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
import { EnrollmentStatus, NotificationType, WorkshopStatus } from '../generated/prisma/enums';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

interface LockedWorkshop {
  id: number;
  title: string;
  capacity: number;
  status: WorkshopStatus;
  startsAt: Date;
  mentorUserId: number;
}

const ACTIVE_STATUSES: EnrollmentStatus[] = [EnrollmentStatus.CONFIRMED, EnrollmentStatus.WAITLISTED];

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
      mentor: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  },
  review: { select: { id: true, workshopRating: true } },
} satisfies Prisma.EnrollmentSelect;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{ select: typeof enrollmentSelect }>;

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
        throw new ForbiddenException('Нельзя записаться на собственный воркшоп');
      }

      const existing = await tx.enrollment.findUnique({
        where: { workshopId_userId: { workshopId: workshop.id, userId } },
      });
      if (existing && ACTIVE_STATUSES.includes(existing.status)) {
        throw new ConflictException('Вы уже записаны на этот воркшоп');
      }
      if (existing?.status === EnrollmentStatus.REJECTED) {
        throw new ForbiddenException('Ментор отклонил вашу заявку на этот воркшоп');
      }

      const taken = await tx.enrollment.count({
        where: { workshopId: workshop.id, status: EnrollmentStatus.CONFIRMED },
      });
      const hasSeat = taken < workshop.capacity;
      const now = new Date();

      const data = hasSeat
        ? { status: EnrollmentStatus.CONFIRMED, confirmedAt: now, waitlistPosition: null }
        : {
            status: EnrollmentStatus.WAITLISTED,
            confirmedAt: null,
            waitlistPosition: (await this.lastWaitlistPosition(tx, workshop.id)) + 1,
          };

      const enrollment = existing
        ? await tx.enrollment.update({
            where: { id: existing.id },
            data: { ...data, comment: dto.comment, cancelledAt: null, createdAt: now },
          })
        : await tx.enrollment.create({
            data: { ...data, comment: dto.comment, workshopId: workshop.id, userId },
          });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { firstName: true, lastName: true, reminderHoursBefore: true },
      });
      const quoted = `«${workshop.title}»`;

      if (hasSeat) {
        await this.scheduleReminder(tx, enrollment.id, workshop.startsAt, user.reminderHoursBefore);
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

  private async lastWaitlistPosition(tx: Prisma.TransactionClient, workshopId: number) {
    const { _max } = await tx.enrollment.aggregate({
      where: { workshopId, status: EnrollmentStatus.WAITLISTED },
      _max: { waitlistPosition: true },
    });
    return _max.waitlistPosition ?? 0;
  }

  private async scheduleReminder(
    tx: Prisma.TransactionClient,
    enrollmentId: number,
    startsAt: Date,
    hoursBefore: number,
  ) {
    const remindAt = new Date(startsAt.getTime() - hoursBefore * 60 * 60 * 1000);
    await tx.reminder.create({
      data: { enrollmentId, remindAt: remindAt > new Date() ? remindAt : new Date() },
    });
  }
}

function toResponse({ workshop, ...enrollment }: EnrollmentRow) {
  const { meetingUrl, mentor, ...rest } = workshop;
  return {
    ...enrollment,
    canReview: enrollment.status === EnrollmentStatus.ATTENDED && !enrollment.review,
    workshop: {
      ...rest,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`,
      meetingUrl: enrollment.status === EnrollmentStatus.CONFIRMED ? meetingUrl : null,
    },
  };
}