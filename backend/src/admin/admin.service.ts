import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Prisma } from '../generated/prisma/client';
import { EnrollmentStatus, NotificationType, Role, WorkshopStatus } from '../generated/prisma/enums';
import { AdminUsersQueryDto, BlockUserDto, ChangeRoleDto } from './dto/admin.dto';

const OPEN_STATUSES: WorkshopStatus[] = [WorkshopStatus.PENDING_REVIEW, WorkshopStatus.PUBLISHED];

const HOUR = 60 * 60 * 1000;

const workshopSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  description: true,
  requirements: true,
  format: true,
  location: true,
  meetingUrl: true,
  level: true,
  startsAt: true,
  durationMinutes: true,
  capacity: true,
  price: true,
  status: true,
  rejectionReason: true,
  publishedAt: true,
  updatedAt: true,
  mentor: {
    select: {
      id: true,
      headline: true,
      ratingAvg: true,
      reviewsCount: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, isBlocked: true } },
      _count: {
        select: { workshops: { where: { status: { in: [WorkshopStatus.PUBLISHED, WorkshopStatus.COMPLETED] } } } },
      },
    },
  },
  skills: {
    orderBy: { isPrimary: 'desc' },
    select: { isPrimary: true, skill: { select: { name: true, slug: true } } },
  },
  programItems: { orderBy: { position: 'asc' }, select: { position: true, title: true, durationMinutes: true } },
  _count: { select: { enrollments: { where: { status: EnrollmentStatus.CONFIRMED } } } },
} satisfies Prisma.WorkshopSelect;

type WorkshopRow = Prisma.WorkshopGetPayload<{ select: typeof workshopSelect }>;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: EnrollmentsService,
  ) {}


  async stats() {
    const monthAgo = new Date(Date.now() - 30 * 24 * HOUR);
    const [usersByRole, blocked, workshopsByStatus, enrollmentsMonth, attendance, rating] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.workshop.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.enrollment.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.enrollment.groupBy({
        by: ['status'],
        where: { status: { in: [EnrollmentStatus.ATTENDED, EnrollmentStatus.NO_SHOW] } },
        _count: { _all: true },
      }),
      this.prisma.review.aggregate({ _avg: { workshopRating: true }, _count: { _all: true } }),
    ]);

    const attended = attendance.find((r) => r.status === EnrollmentStatus.ATTENDED)?._count._all ?? 0;
    const noShow = attendance.find((r) => r.status === EnrollmentStatus.NO_SHOW)?._count._all ?? 0;

    return {
      usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all])),
      blockedUsers: blocked,
      workshopsByStatus: Object.fromEntries(workshopsByStatus.map((r) => [r.status, r._count._all])),
      enrollmentsLast30Days: enrollmentsMonth,
      // доля пришедших среди отмеченных ментором
      attendanceRate: attended + noShow ? Math.round((attended / (attended + noShow)) * 100) : null,
      reviews: { count: rating._count._all, avgRating: Number((rating._avg.workshopRating ?? 0).toFixed(2)) },
    };
  }


  async findWorkshops(status: WorkshopStatus) {
    const rows = await this.prisma.workshop.findMany({
      where: { status },
      orderBy: status === WorkshopStatus.PENDING_REVIEW ? { startsAt: 'asc' } : { updatedAt: 'desc' },
      take: 100,
      select: workshopSelect,
    });
    return rows.map(toAdminWorkshop);
  }

  async findWorkshop(id: number) {
    const row = await this.prisma.workshop.findUnique({ where: { id }, select: workshopSelect });
    if (!row) throw new NotFoundException('Воркшоп не найден');
    return toAdminWorkshop(row);
  }

  async approve(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const workshop = await this.enrollments.lockWorkshop(tx, id);
      if (workshop.status !== WorkshopStatus.PENDING_REVIEW) {
        throw new ConflictException('Воркшоп уже не на модерации — возможно, его проверил другой администратор');
      }
      if (workshop.startsAt.getTime() < Date.now() + HOUR) {
        throw new BadRequestException('До начала меньше часа — отклоните воркшоп, чтобы ментор перенёс дату');
      }
      const mentor = await tx.user.findUniqueOrThrow({
        where: { id: workshop.mentorUserId },
        select: { isBlocked: true },
      });
      if (mentor.isBlocked) throw new BadRequestException('Ментор заблокирован');

      await tx.workshop.update({
        where: { id },
        data: { status: WorkshopStatus.PUBLISHED, publishedAt: new Date(), rejectionReason: null },
      });
      await this.notifyMentor(
        tx,
        workshop,
        NotificationType.WORKSHOP_APPROVED,
        'Воркшоп опубликован',
        `«${workshop.title}» прошёл модерацию и появился в каталоге.`,
      );
      await this.closeAdminTask(tx, id);
      return { id, status: WorkshopStatus.PUBLISHED };
    });
  }

  async reject(id: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const workshop = await this.enrollments.lockWorkshop(tx, id);
      if (workshop.status !== WorkshopStatus.PENDING_REVIEW) {
        throw new ConflictException('Воркшоп уже не на модерации — возможно, его проверил другой администратор');
      }
      await tx.workshop.update({ where: { id }, data: { status: WorkshopStatus.REJECTED, rejectionReason: reason } });
      await this.notifyMentor(
        tx,
        workshop,
        NotificationType.WORKSHOP_REJECTED,
        'Воркшоп отклонён',
        `«${workshop.title}» не прошёл модерацию. Причина: ${reason}`,
      );
      await this.closeAdminTask(tx, id);
      return { id, status: WorkshopStatus.REJECTED, rejectionReason: reason };
    });
  }

  async cancelWorkshop(id: number, reason: string) {
    await this.prisma.$transaction(async (tx) => {
      const workshop = await this.enrollments.lockWorkshop(tx, id);
      if (workshop.status !== WorkshopStatus.PUBLISHED) {
        throw new BadRequestException('Снять можно только опубликованный воркшоп');
      }
      if (workshop.startsAt <= new Date()) throw new BadRequestException('Воркшоп уже начался');
      await this.cancelLocked(tx, workshop, reason);
    });
    return { id, status: WorkshopStatus.CANCELLED };
  }


  async findUsers({ search, role, page, limit }: AdminUsersQueryDto) {
    const contains = search && { contains: search, mode: 'insensitive' as const };
    const where: Prisma.UserWhereInput = {
      role,
      ...(contains && { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ isBlocked: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          university: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
          mentorProfile: { select: { ratingAvg: true, _count: { select: { workshops: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map(({ _count, mentorProfile, ...user }) => ({
        ...user,
        enrollmentsCount: _count.enrollments,
        workshopsCount: mentorProfile?._count.workshops ?? 0,
        mentorRating: mentorProfile?.ratingAvg ?? null,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  
  async setBlocked(adminId: number, userId: number, { isBlocked }: BlockUserDto) {
    const user = await this.getManageableUser(adminId, userId);
    if (user.isBlocked === isBlocked) return { id: userId, isBlocked };

    const summary = { cancelledEnrollments: 0, cancelledWorkshops: 0 };
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isBlocked } });
      if (!isBlocked) return;

      const enrollments = await tx.enrollment.findMany({
        where: {
          userId,
          status: { in: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.WAITLISTED] },
          workshop: { startsAt: { gt: new Date() } },
        },
        select: { id: true, workshopId: true },
        orderBy: { workshopId: 'asc' }, 
      });
      for (const { id, workshopId } of enrollments) {
        const workshop = await this.enrollments.lockWorkshop(tx, workshopId);
        const enrollment = await tx.enrollment.findUniqueOrThrow({ where: { id } });
        await tx.enrollment.update({
          where: { id },
          data: { status: EnrollmentStatus.CANCELLED, cancelledAt: new Date(), waitlistPosition: null },
        });
        await tx.reminder.deleteMany({ where: { enrollmentId: id, sentAt: null } });
        if (enrollment.status === EnrollmentStatus.WAITLISTED) {
          await this.enrollments.shiftWaitlist(tx, workshopId, enrollment.waitlistPosition!);
        } else {
          await this.enrollments.promoteFromWaitlist(tx, workshop);
        }
        summary.cancelledEnrollments++;
      }

      if (user.role === Role.MENTOR) {
        const workshops = await tx.workshop.findMany({
          where: { mentor: { userId }, status: WorkshopStatus.PUBLISHED, startsAt: { gt: new Date() } },
          select: { id: true },
          orderBy: { id: 'asc' },
        });
        for (const { id } of workshops) {
          const workshop = await this.enrollments.lockWorkshop(tx, id);
          await this.cancelLocked(tx, workshop, 'аккаунт ментора заблокирован администрацией');
          summary.cancelledWorkshops++;
        }
        await tx.workshop.updateMany({
          where: { mentor: { userId }, status: WorkshopStatus.PENDING_REVIEW },
          data: { status: WorkshopStatus.DRAFT },
        });
      }
    });

    return { id: userId, isBlocked, ...summary };
  }

  async changeRole(adminId: number, userId: number, { role }: ChangeRoleDto) {
    const user = await this.getManageableUser(adminId, userId);
    if (user.role === role) return { id: userId, role };

    if (role === Role.MENTOR) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          role,
          mentorProfile: {
            connectOrCreate: {
              where: { userId },
              create: { headline: 'Ментор CampusSkill', experience: '', formats: [] },
            },
          },
        },
      });
    } else {
      const open = await this.prisma.workshop.count({
        where: { mentor: { userId }, status: { in: OPEN_STATUSES }, startsAt: { gt: new Date() } },
      });
      if (open > 0) {
        throw new ConflictException(
          `У ментора ${open} активных воркшопа(-ов) — сначала их нужно завершить или отменить`,
        );
      }
      await this.prisma.user.update({ where: { id: userId }, data: { role } });
    }
    return { id: userId, role };
  }


  private async getManageableUser(adminId: number, userId: number) {
    if (adminId === userId) throw new ForbiddenException('Нельзя изменить собственный аккаунт');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true, isBlocked: true } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.role === Role.ADMIN) throw new ForbiddenException('Нельзя изменить аккаунт администратора');
    return user;
  }

  private async cancelLocked(
    tx: Prisma.TransactionClient,
    workshop: { id: number; title: string; mentorUserId: number },
    reason: string,
  ) {
    const userIds = await this.enrollments.annulAll(tx, workshop.id);
    await tx.workshop.update({ where: { id: workshop.id }, data: { status: WorkshopStatus.CANCELLED } });
    await tx.notification.createMany({
      data: [
        ...userIds.map((userId) => ({
          userId,
          workshopId: workshop.id,
          type: NotificationType.WORKSHOP_CANCELLED,
          title: 'Воркшоп отменён',
          body: `«${workshop.title}» отменён администрацией: ${reason}. Ваша запись аннулирована.`,
        })),
        {
          userId: workshop.mentorUserId,
          workshopId: workshop.id,
          type: NotificationType.WORKSHOP_CANCELLED,
          title: 'Воркшоп снят администрацией',
          body: `«${workshop.title}» отменён. Причина: ${reason}`,
        },
      ],
    });
  }

  private notifyMentor(
    tx: Prisma.TransactionClient,
    workshop: { id: number; mentorUserId: number },
    type: NotificationType,
    title: string,
    body: string,
  ) {
    return tx.notification.create({
      data: { userId: workshop.mentorUserId, workshopId: workshop.id, type, title, body },
    });
  }

  private closeAdminTask(tx: Prisma.TransactionClient, workshopId: number) {
    return tx.notification.updateMany({
      where: { workshopId, type: NotificationType.WORKSHOP_UPDATED, isRead: false, user: { role: Role.ADMIN } },
      data: { isRead: true },
    });
  }
}

function toAdminWorkshop({ _count, mentor, skills, ...workshop }: WorkshopRow) {
  return {
    ...workshop,
    seatsTaken: _count.enrollments,
    isFirstWorkshop: mentor._count.workshops === 0,
    mentor: {
      id: mentor.id,
      userId: mentor.user.id,
      firstName: mentor.user.firstName,
      lastName: mentor.user.lastName,
      email: mentor.user.email,
      isBlocked: mentor.user.isBlocked,
      headline: mentor.headline,
      ratingAvg: mentor.ratingAvg,
      reviewsCount: mentor.reviewsCount,
    },
    skills: skills.map(({ isPrimary, skill }) => ({ ...skill, isPrimary })),
  };
}