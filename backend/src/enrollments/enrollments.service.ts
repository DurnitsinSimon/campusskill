import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '../generated/prisma/client';
import {
  EnrollmentStatus,
  NotificationType,
  WorkshopStatus,
} from '../generated/prisma/enums';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

interface LockedWorkshop {
  id: number;
  title: string;
  capacity: number;
  status: WorkshopStatus;
  startsAt: Date;
  mentorUserId: number;
}

const ACTIVE_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.CONFIRMED,
  EnrollmentStatus.WAITLISTED,
];

const enrollmentSelect = {
  id: true,
  status: true,
  waitlistPosition: true,
  comment: true,
  createdAt: true,
  confirmedAt: true,
  cancelledAt: true,
  workshop: {
    select: {
      id: true,
      slug: true,
      title: true,
      startsAt: true,
      durationMinutes: true,
      format: true,
      location: true,
      meetingUrl: true,
      status: true,
      mentor: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  },
  review: { select: { id: true, workshopRating: true } },
} satisfies Prisma.EnrollmentSelect;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Yekaterinburg',
  }).format(date);

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async enroll(userId: number, dto: CreateEnrollmentDto) {
    const enrollmentId = await this.prisma.$transaction(async (tx) => {
      const workshop = await this.lockWorkshop(tx, dto.workshopId);

      if (workshop.status !== WorkshopStatus.PUBLISHED) {
        throw new BadRequestException('Запись на этот воркшоп закрыта');
      }
      if (workshop.startsAt <= new Date()) {
        throw new BadRequestException('Воркшоп уже начался');
      }
      if (workshop.mentorUserId === userId) {
        throw new ForbiddenException(
          'Нельзя записаться на собственный воркшоп',
        );
      }

      const existing = await tx.enrollment.findUnique({
        where: { workshopId_userId: { workshopId: workshop.id, userId } },
      });
      if (existing && ACTIVE_STATUSES.includes(existing.status)) {
        throw new ConflictException('Вы уже записаны на этот воркшоп');
      }
      if (existing?.status === EnrollmentStatus.REJECTED) {
        throw new ForbiddenException(
          'Ментор отклонил вашу заявку на этот воркшоп',
        );
      }

      const taken = await tx.enrollment.count({
        where: { workshopId: workshop.id, status: EnrollmentStatus.CONFIRMED },
      });
      const hasSeat = taken < workshop.capacity;
      const now = new Date();

      const data = hasSeat
        ? {
            status: EnrollmentStatus.CONFIRMED,
            confirmedAt: now,
            waitlistPosition: null,
          }
        : {
            status: EnrollmentStatus.WAITLISTED,
            confirmedAt: null,
            waitlistPosition:
              (await this.lastWaitlistPosition(tx, workshop.id)) + 1,
          };

      const enrollment = existing
        ? await tx.enrollment.update({
            where: { id: existing.id },
            data: {
              ...data,
              comment: dto.comment,
              cancelledAt: null,
              createdAt: now,
            },
          })
        : await tx.enrollment.create({
            data: {
              ...data,
              comment: dto.comment,
              workshopId: workshop.id,
              userId,
            },
          });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { firstName: true, lastName: true, reminderHoursBefore: true },
      });
      const quoted = `«${workshop.title}»`;

      if (hasSeat) {
        await this.scheduleReminder(
          tx,
          enrollment.id,
          workshop.startsAt,
          user.reminderHoursBefore,
        );
        await this.notifications.create(
          {
            userId,
            workshopId: workshop.id,
            type: NotificationType.ENROLLMENT_CONFIRMED,
            title: 'Запись подтверждена',
            body: `Вы записаны на ${quoted}, ${formatDate(workshop.startsAt)}.`,
          },
          tx,
        );
      } else {
        await this.notifications.create(
          {
            userId,
            workshopId: workshop.id,
            type: NotificationType.ENROLLMENT_WAITLISTED,
            title: 'Вы в листе ожидания',
            body: `Все места на ${quoted} заняты. Ваша позиция в очереди: ${enrollment.waitlistPosition}. Сообщим, если место освободится.`,
          },
          tx,
        );
      }

      await this.notifications.create(
        {
          userId: workshop.mentorUserId,
          workshopId: workshop.id,
          type: NotificationType.NEW_ENROLLMENT,
          title: hasSeat ? 'Новый участник' : 'Новая заявка в лист ожидания',
          body: `${user.firstName} ${user.lastName} записался(-ась) на ${quoted}.`,
        },
        tx,
      );

      return enrollment.id;
    });

    return this.findOneForUser(userId, enrollmentId);
  }

  async cancel(userId: number, enrollmentId: number) {
    await this.prisma.$transaction(async (tx) => {
      const found = await tx.enrollment.findFirst({
        where: { id: enrollmentId, userId },
        select: { workshopId: true },
      });
      if (!found) throw new NotFoundException('Запись не найдена');

      const workshop = await this.lockWorkshop(tx, found.workshopId);
      const enrollment = await tx.enrollment.findUniqueOrThrow({
        where: { id: enrollmentId },
      });

      if (!ACTIVE_STATUSES.includes(enrollment.status)) {
        throw new BadRequestException('Эту запись нельзя отменить');
      }
      if (workshop.startsAt <= new Date()) {
        throw new BadRequestException(
          'Воркшоп уже начался — отменить запись нельзя',
        );
      }

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.CANCELLED,
          cancelledAt: new Date(),
          waitlistPosition: null,
        },
      });
      await tx.reminder.deleteMany({
        where: { enrollmentId: enrollment.id, sentAt: null },
      });

      if (enrollment.status === EnrollmentStatus.WAITLISTED) {
        await this.shiftWaitlist(tx, workshop.id, enrollment.waitlistPosition!);
      } else {
        await this.promoteFromWaitlist(tx, workshop);
      }
    });

    return this.findOneForUser(userId, enrollmentId);
  }

  async findMine(userId: number, scope: 'upcoming' | 'past') {
    const now = new Date();
    const where: Prisma.EnrollmentWhereInput =
      scope === 'upcoming'
        ? {
            userId,
            status: { in: ACTIVE_STATUSES },
            workshop: { startsAt: { gte: now } },
          }
        : {
            userId,
            OR: [
              { status: { notIn: ACTIVE_STATUSES } },
              { workshop: { startsAt: { lt: now } } },
            ],
          };

    const rows = await this.prisma.enrollment.findMany({
      where,
      select: enrollmentSelect,
      orderBy: {
        workshop: { startsAt: scope === 'upcoming' ? 'asc' : 'desc' },
      },
    });
    return rows.map(toResponse);
  }

  async findForWorkshop(userId: number, workshopId: number) {
    const row = await this.prisma.enrollment.findUnique({
      where: { workshopId_userId: { workshopId, userId } },
      select: enrollmentSelect,
    });
    return row ? toResponse(row) : null;
  }

  private async findOneForUser(userId: number, enrollmentId: number) {
    const row = await this.prisma.enrollment.findFirstOrThrow({
      where: { id: enrollmentId, userId },
      select: enrollmentSelect,
    });
    return toResponse(row);
  }

  private async lockWorkshop(tx: Prisma.TransactionClient, workshopId: number) {
    const [workshop] = await tx.$queryRaw<LockedWorkshop[]>`
      SELECT w.id, w.title, w.capacity, w.status, w."startsAt", m."userId" AS "mentorUserId"
      FROM "Workshop" w
      JOIN "MentorProfile" m ON m.id = w."mentorId"
      WHERE w.id = ${workshopId}
      FOR UPDATE OF w
    `;
    if (!workshop) throw new NotFoundException('Воркшоп не найден');
    return workshop;
  }

  private async lastWaitlistPosition(
    tx: Prisma.TransactionClient,
    workshopId: number,
  ) {
    const { _max } = await tx.enrollment.aggregate({
      where: { workshopId, status: EnrollmentStatus.WAITLISTED },
      _max: { waitlistPosition: true },
    });
    return _max.waitlistPosition ?? 0;
  }

  private shiftWaitlist(
    tx: Prisma.TransactionClient,
    workshopId: number,
    afterPosition: number,
  ) {
    return tx.enrollment.updateMany({
      where: {
        workshopId,
        status: EnrollmentStatus.WAITLISTED,
        waitlistPosition: { gt: afterPosition },
      },
      data: { waitlistPosition: { decrement: 1 } },
    });
  }

  private async promoteFromWaitlist(
    tx: Prisma.TransactionClient,
    workshop: LockedWorkshop,
  ) {
    const next = await tx.enrollment.findFirst({
      where: { workshopId: workshop.id, status: EnrollmentStatus.WAITLISTED },
      orderBy: { waitlistPosition: 'asc' },
      include: { user: { select: { reminderHoursBefore: true } } },
    });
    if (!next) return;

    await tx.enrollment.update({
      where: { id: next.id },
      data: {
        status: EnrollmentStatus.CONFIRMED,
        confirmedAt: new Date(),
        waitlistPosition: null,
      },
    });
    await this.shiftWaitlist(tx, workshop.id, next.waitlistPosition!);
    await this.scheduleReminder(
      tx,
      next.id,
      workshop.startsAt,
      next.user.reminderHoursBefore,
    );
    await this.notifications.create(
      {
        userId: next.userId,
        workshopId: workshop.id,
        type: NotificationType.WAITLIST_PROMOTED,
        title: 'Освободилось место!',
        body: `Вы переведены из листа ожидания: запись на «${workshop.title}» подтверждена.`,
      },
      tx,
    );
  }

  private async scheduleReminder(
    tx: Prisma.TransactionClient,
    enrollmentId: number,
    startsAt: Date,
    hoursBefore: number,
  ) {
    const remindAt = new Date(
      startsAt.getTime() - hoursBefore * 60 * 60 * 1000,
    );
    await tx.reminder.create({
      data: {
        enrollmentId,
        remindAt: remindAt > new Date() ? remindAt : new Date(),
      },
    });
  }
}

function toResponse({ workshop, ...enrollment }: EnrollmentRow) {
  const { meetingUrl, mentor, ...rest } = workshop;
  return {
    ...enrollment,
    canReview:
      enrollment.status === EnrollmentStatus.ATTENDED && !enrollment.review,
    workshop: {
      ...rest,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`,
      meetingUrl:
        enrollment.status === EnrollmentStatus.CONFIRMED ? meetingUrl : null,
    },
  };
}
