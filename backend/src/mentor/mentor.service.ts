import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Prisma } from '../generated/prisma/client';
import {
  EnrollmentStatus,
  NotificationType,
  Role,
  SkillLevel,
  WorkshopStatus,
} from '../generated/prisma/enums';
import { slugify } from '../common/slugify';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop-form.dto';
import { ParticipantActionDto } from './dto/participant-action.dto';

const EDITABLE: WorkshopStatus[] = [
  WorkshopStatus.DRAFT,
  WorkshopStatus.REJECTED,
];

const ACTIVE: EnrollmentStatus[] = [
  EnrollmentStatus.CONFIRMED,
  EnrollmentStatus.WAITLISTED,
];

const levelFor = (count: number) =>
  count >= 3
    ? SkillLevel.ADVANCED
    : count === 2
      ? SkillLevel.INTERMEDIATE
      : SkillLevel.BEGINNER;

@Injectable()
export class MentorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  async findMine(userId: number) {
    const mentorId = await this.getMentorId(userId);
    const workshops = await this.prisma.workshop.findMany({
      where: { mentorId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        rejectionReason: true,
        format: true,
        startsAt: true,
        durationMinutes: true,
        capacity: true,
        price: true,
        ratingAvg: true,
        reviewsCount: true,
      },
    });

    const counts = await this.prisma.enrollment.groupBy({
      by: ['workshopId', 'status'],
      where: { workshopId: { in: workshops.map((w) => w.id) } },
      _count: true,
    });
    const countOf = (workshopId: number, status: EnrollmentStatus) =>
      counts.find((c) => c.workshopId === workshopId && c.status === status)
        ?._count ?? 0;

    return workshops.map((workshop) => ({
      ...workshop,
      confirmedCount:
        countOf(workshop.id, EnrollmentStatus.CONFIRMED) +
        countOf(workshop.id, EnrollmentStatus.ATTENDED),
      waitlistCount: countOf(workshop.id, EnrollmentStatus.WAITLISTED),
      attendedCount: countOf(workshop.id, EnrollmentStatus.ATTENDED),
    }));
  }

  async findOne(userId: number, workshopId: number) {
    const workshop = await this.getOwnWorkshop(userId, workshopId);
    const full = await this.prisma.workshop.findUniqueOrThrow({
      where: { id: workshop.id },
      include: {
        programItems: { orderBy: { position: 'asc' } },
        skills: {
          orderBy: { isPrimary: 'desc' },
          include: { skill: { select: { slug: true, name: true } } },
        },
      },
    });
    return {
      ...full,
      skills: full.skills.map(({ skill }) => skill),
    };
  }

  async create(userId: number, dto: CreateWorkshopDto) {
    const mentorId = await this.getMentorId(userId);
    this.assertFuture(dto.startsAt);
    const skillIds = await this.resolveSkills(dto.skills);

    return this.prisma.workshop.create({
      data: {
        mentorId,
        slug: await this.uniqueSlug(dto.title),
        title: dto.title,
        shortDescription: dto.shortDescription,
        description: dto.description,
        requirements: dto.requirements,
        format: dto.format,
        location: dto.location,
        meetingUrl: dto.meetingUrl,
        level: dto.level,
        startsAt: dto.startsAt,
        durationMinutes: dto.durationMinutes,
        capacity: dto.capacity,
        price: dto.price,
        status: WorkshopStatus.DRAFT,
        programItems: {
          create: dto.program.map((item, i) => ({ ...item, position: i + 1 })),
        },
        skills: {
          create: skillIds.map((skillId, i) => ({
            skillId,
            isPrimary: i === 0,
          })),
        },
      },
      select: { id: true, slug: true, status: true },
    });
  }

  async update(userId: number, workshopId: number, dto: UpdateWorkshopDto) {
    const workshop = await this.getOwnWorkshop(userId, workshopId);
    if (!EDITABLE.includes(workshop.status)) {
      throw new BadRequestException(
        'Редактировать можно только черновик или отклонённый воркшоп',
      );
    }
    if (dto.startsAt) this.assertFuture(dto.startsAt);
    const skillIds = dto.skills
      ? await this.resolveSkills(dto.skills)
      : undefined;
    const { skills: _skills, program, ...fields } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (program) {
        await tx.workshopProgramItem.deleteMany({ where: { workshopId } });
        await tx.workshopProgramItem.createMany({
          data: program.map((item, i) => ({
            ...item,
            position: i + 1,
            workshopId,
          })),
        });
      }
      if (skillIds) {
        await tx.workshopSkill.deleteMany({ where: { workshopId } });
        await tx.workshopSkill.createMany({
          data: skillIds.map((skillId, i) => ({
            workshopId,
            skillId,
            isPrimary: i === 0,
          })),
        });
      }
      return tx.workshop.update({
        where: { id: workshopId },
        data: fields,
        select: { id: true, slug: true, status: true },
      });
    });
  }

  async submit(userId: number, workshopId: number) {
    const workshop = await this.getOwnWorkshop(userId, workshopId);
    if (!EDITABLE.includes(workshop.status)) {
      throw new BadRequestException(
        'Отправить на модерацию можно только черновик или отклонённый воркшоп',
      );
    }
    this.assertFuture(workshop.startsAt);
    if (workshop.format === 'OFFLINE' && !workshop.location) {
      throw new BadRequestException(
        'Для офлайн-воркшопа укажите место проведения',
      );
    }
    if (workshop.format === 'ONLINE' && !workshop.meetingUrl) {
      throw new BadRequestException(
        'Для онлайн-воркшопа укажите ссылку на встречу',
      );
    }

    const updated = await this.prisma.workshop.update({
      where: { id: workshopId },
      data: { status: WorkshopStatus.PENDING_REVIEW, rejectionReason: null },
      select: { id: true, slug: true, status: true },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        workshopId,
        type: NotificationType.WORKSHOP_UPDATED,
        title: 'Воркшоп ждёт модерации',
        body: `«${workshop.title}» отправлен на проверку.`,
      })),
    });
    return updated;
  }

  async cancel(userId: number, workshopId: number) {
    const own = await this.getOwnWorkshop(userId, workshopId);

    await this.prisma.$transaction(async (tx) => {
      const workshop = await this.enrollments.lockWorkshop(tx, own.id);
      if (workshop.status !== WorkshopStatus.PUBLISHED) {
        throw new BadRequestException(
          'Отменить можно только опубликованный воркшоп',
        );
      }
      if (workshop.startsAt <= new Date()) {
        throw new BadRequestException('Воркшоп уже начался');
      }

      const userIds = await this.enrollments.annulAll(tx, workshop.id);
      await tx.workshop.update({
        where: { id: workshop.id },
        data: { status: WorkshopStatus.CANCELLED },
      });
      await tx.notification.createMany({
        data: userIds.map((id) => ({
          userId: id,
          workshopId: workshop.id,
          type: NotificationType.WORKSHOP_CANCELLED,
          title: 'Воркшоп отменён',
          body: `Ментор отменил «${workshop.title}». Ваша запись аннулирована.`,
        })),
      });
    });

    return { id: workshopId, status: WorkshopStatus.CANCELLED };
  }

  async participants(userId: number, workshopId: number) {
    await this.getOwnWorkshop(userId, workshopId);
    return this.prisma.enrollment.findMany({
      where: { workshopId },
      orderBy: [
        { status: 'asc' },
        { waitlistPosition: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        status: true,
        waitlistPosition: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            university: true,
            course: true,
            avatarUrl: true,
          },
        },
        review: { select: { workshopRating: true } },
      },
    });
  }

  async updateParticipant(
    userId: number,
    workshopId: number,
    enrollmentId: number,
    { status }: ParticipantActionDto,
  ) {
    await this.getOwnWorkshop(userId, workshopId);

    return this.prisma.$transaction(async (tx) => {
      const workshop = await this.enrollments.lockWorkshop(tx, workshopId);
      const enrollment = await tx.enrollment.findFirst({
        where: { id: enrollmentId, workshopId },
        include: {
          workshop: {
            select: {
              durationMinutes: true,
              skills: { select: { skillId: true } },
            },
          },
        },
      });
      if (!enrollment) throw new NotFoundException('Участник не найден');

      const hasStarted = workshop.startsAt <= new Date();
      const quoted = `«${workshop.title}»`;

      if (status === EnrollmentStatus.REJECTED) {
        if (hasStarted)
          throw new BadRequestException(
            'После начала воркшопа заявку нельзя отклонить',
          );
        if (!ACTIVE.includes(enrollment.status))
          throw new BadRequestException('Эту запись нельзя отклонить');

        await tx.enrollment.update({
          where: { id: enrollmentId },
          data: { status: EnrollmentStatus.REJECTED, waitlistPosition: null },
        });
        await tx.reminder.deleteMany({ where: { enrollmentId, sentAt: null } });
        if (enrollment.status === EnrollmentStatus.WAITLISTED) {
          await this.enrollments.shiftWaitlist(
            tx,
            workshopId,
            enrollment.waitlistPosition!,
          );
        } else {
          await this.enrollments.promoteFromWaitlist(tx, workshop);
        }
        await this.notifications.create(
          {
            userId: enrollment.userId,
            workshopId,
            type: NotificationType.ENROLLMENT_REJECTED,
            title: 'Заявка отклонена',
            body: `Ментор отклонил вашу заявку на ${quoted}.`,
          },
          tx,
        );
        return { id: enrollmentId, status };
      }

      if (!hasStarted)
        throw new BadRequestException(
          'Посещение можно отметить после начала воркшопа',
        );
      if (enrollment.status === EnrollmentStatus.ATTENDED) {
        throw new ConflictException('Посещение уже отмечено');
      }
      if (
        enrollment.status !== EnrollmentStatus.CONFIRMED &&
        enrollment.status !== EnrollmentStatus.NO_SHOW
      ) {
        throw new BadRequestException(
          'Отметить можно только подтверждённого участника',
        );
      }

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status,
          attendedAt: status === EnrollmentStatus.ATTENDED ? new Date() : null,
        },
      });

      if (status === EnrollmentStatus.ATTENDED) {
        await this.addProgress(tx, enrollment.userId, enrollment.workshop);
        await this.notifications.create(
          {
            userId: enrollment.userId,
            workshopId,
            type: NotificationType.REVIEW_REQUEST,
            title: 'Оцените воркшоп',
            body: `Как прошёл ${quoted}? Ваш отзыв поможет ментору и другим студентам.`,
          },
          tx,
        );
      }
      return { id: enrollmentId, status };
    });
  }

  async replyToReview(userId: number, reviewId: number, reply: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, enrollment: { workshop: { mentor: { userId } } } },
      select: { id: true },
    });
    if (!review) throw new NotFoundException('Отзыв не найден');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { mentorReply: reply, repliedAt: new Date() },
      select: { id: true, mentorReply: true, repliedAt: true },
    });
  }

  async findReviews(userId: number) {
    return this.prisma.review.findMany({
      where: { enrollment: { workshop: { mentor: { userId } } } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workshopRating: true,
        mentorRating: true,
        comment: true,
        mentorReply: true,
        createdAt: true,
        enrollment: {
          select: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
            workshop: { select: { title: true, slug: true } },
          },
        },
      },
    });
  }

  private async getMentorId(userId: number) {
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile)
      throw new ForbiddenException('Сначала заполните профиль ментора');
    return profile.id;
  }

  private async getOwnWorkshop(userId: number, workshopId: number) {
    const workshop = await this.prisma.workshop.findFirst({
      where: { id: workshopId, mentor: { userId } },
    });
    if (!workshop) throw new NotFoundException('Воркшоп не найден');
    return workshop;
  }

  private assertFuture(date: Date) {
    if (date.getTime() < Date.now() + 60 * 60 * 1000) {
      throw new BadRequestException(
        'Дата начала должна быть хотя бы через час',
      );
    }
  }

  private async resolveSkills(slugs: string[]) {
    const unique = [...new Set(slugs)];
    const skills = await this.prisma.skill.findMany({
      where: { slug: { in: unique } },
      select: { id: true, slug: true },
    });
    if (skills.length !== unique.length)
      throw new BadRequestException('Указан несуществующий навык');
    return unique.map((slug) => skills.find((s) => s.slug === slug)!.id);
  }

  private async uniqueSlug(title: string) {
    const base = slugify(title) || 'workshop';
    let slug = base;
    for (
      let i = 2;
      await this.prisma.workshop.findUnique({
        where: { slug },
        select: { id: true },
      });
      i++
    ) {
      slug = `${base}-${i}`;
    }
    return slug;
  }

  private async addProgress(
    tx: Prisma.TransactionClient,
    userId: number,
    workshop: { durationMinutes: number; skills: { skillId: number }[] },
  ) {
    for (const { skillId } of workshop.skills) {
      const progress = await tx.userSkillProgress.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: {
          userId,
          skillId,
          workshopsCompleted: 1,
          minutesTotal: workshop.durationMinutes,
        },
        update: {
          workshopsCompleted: { increment: 1 },
          minutesTotal: { increment: workshop.durationMinutes },
        },
      });
      await tx.userSkillProgress.update({
        where: { userId_skillId: { userId, skillId } },
        data: { level: levelFor(progress.workshopsCompleted) },
      });
    }
  }
}
