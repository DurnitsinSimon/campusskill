import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus, NotificationType, WorkshopStatus } from '../generated/prisma/enums';

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Yekaterinburg',
  }).format(date);

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}


  @Cron(CronExpression.EVERY_MINUTE, { name: 'send-reminders' })
  async sendDueReminders() {
    const due = await this.prisma.reminder.findMany({
      where: { sentAt: null, remindAt: { lte: new Date() } },
      take: 200,
      orderBy: { remindAt: 'asc' },
      select: {
        id: true,
        enrollment: {
          select: {
            userId: true,
            status: true,
            workshop: {
              select: { id: true, title: true, status: true, startsAt: true, format: true, location: true },
            },
          },
        },
      },
    });

    let sent = 0;
    for (const { id, enrollment } of due) {
      const { workshop } = enrollment;
      const isActual =
        enrollment.status === EnrollmentStatus.CONFIRMED &&
        workshop.status === WorkshopStatus.PUBLISHED &&
        workshop.startsAt > new Date();

      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.reminder.updateMany({
          where: { id, sentAt: null },
          data: { sentAt: new Date() },
        });
        if (count === 0 || !isActual) return;

        const place =
          workshop.format === 'ONLINE' ? 'Ссылка на встречу — в личном кабинете.' : `Место: ${workshop.location}.`;
        await tx.notification.create({
          data: {
            userId: enrollment.userId,
            workshopId: workshop.id,
            type: NotificationType.WORKSHOP_REMINDER,
            title: 'Скоро воркшоп',
            body: `«${workshop.title}» начнётся ${formatTime(workshop.startsAt)}. ${place}`,
          },
        });
        sent++;
      });
    }

    if (due.length) this.logger.log(`Напоминания: обработано ${due.length}, отправлено ${sent}`);
  }

  
  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'complete-workshops' })
  async completeFinishedWorkshops() {

    const finished = await this.prisma.$queryRaw<{ id: number; title: string; mentorUserId: number }[]>`
      UPDATE "Workshop" w
      SET status = 'COMPLETED', "updatedAt" = now() AT TIME ZONE 'UTC'
      FROM "MentorProfile" m
      WHERE m.id = w."mentorId"
        AND w.status = 'PUBLISHED'
        AND w."startsAt" + w."durationMinutes" * interval '1 minute' <= now() AT TIME ZONE 'UTC'
      RETURNING w.id, w.title, m."userId" AS "mentorUserId"
    `;
    if (finished.length === 0) return;

    const ids = finished.map((w) => w.id);
    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.updateMany({
        where: { workshopId: { in: ids }, status: EnrollmentStatus.WAITLISTED },
        data: { status: EnrollmentStatus.CANCELLED, cancelledAt: new Date(), waitlistPosition: null },
      });

      const unmarked = await tx.enrollment.groupBy({
        by: ['workshopId'],
        where: { workshopId: { in: ids }, status: EnrollmentStatus.CONFIRMED },
        _count: { _all: true },
      });
      await tx.notification.createMany({
        data: unmarked.map(({ workshopId, _count }) => {
          const workshop = finished.find((w) => w.id === workshopId)!;
          return {
            userId: workshop.mentorUserId,
            workshopId,
            type: NotificationType.WORKSHOP_UPDATED,
            title: 'Отметьте посещаемость',
            body: `«${workshop.title}» завершился. Отметьте, кто пришёл (${_count._all} без отметки): посетившие получат прогресс и смогут оставить отзыв.`,
          };
        }),
      });
    });

    this.logger.log(`Завершено воркшопов: ${finished.length}`);
  }
}