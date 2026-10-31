import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '../generated/prisma/client';
import { EnrollmentStatus, NotificationType } from '../generated/prisma/enums';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: number, dto: CreateReviewDto) {
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findFirst({
        where: { id: dto.enrollmentId, userId },
        include: {
          review: { select: { id: true } },
          user: { select: { firstName: true, lastName: true } },
          workshop: {
            select: { id: true, title: true, mentorId: true, mentor: { select: { userId: true } } },
          },
        },
      });
      if (!enrollment) throw new NotFoundException('Запись не найдена');
      if (enrollment.status !== EnrollmentStatus.ATTENDED) {
        throw new BadRequestException('Отзыв можно оставить только после посещения воркшопа');
      }
      if (enrollment.review) throw new ConflictException('Вы уже оставили отзыв на этот воркшоп');

      const { workshop } = enrollment;
      await this.lockForRating(tx, workshop.id);

      const review = await tx.review.create({
        data: {
          enrollmentId: enrollment.id,
          workshopRating: dto.workshopRating,
          mentorRating: dto.mentorRating,
          comment: dto.comment,
        },
      });

      await this.recalculateRatings(tx, workshop.id, workshop.mentorId);

      await this.notifications.create(
        {
          userId: workshop.mentor.userId,
          workshopId: workshop.id,
          type: NotificationType.NEW_REVIEW,
          title: 'Новый отзыв',
          body: `${enrollment.user.firstName} ${enrollment.user.lastName} оценил(а) «${workshop.title}» на ${dto.workshopRating} из 5.`,
        },
        tx,
      );

      return review;
    });
  }

  
  private async lockForRating(tx: Prisma.TransactionClient, workshopId: number) {
    await tx.$queryRaw`
      SELECT w.id FROM "Workshop" w
      JOIN "MentorProfile" m ON m.id = w."mentorId"
      WHERE w.id = ${workshopId}
      FOR UPDATE OF w, m
    `;
  }

  private async recalculateRatings(tx: Prisma.TransactionClient, workshopId: number, mentorId: number) {
    const [workshopStats, mentorStats] = await Promise.all([
      tx.review.aggregate({
        where: { enrollment: { workshopId } },
        _avg: { workshopRating: true },
        _count: true,
      }),
      tx.review.aggregate({
        where: { enrollment: { workshop: { mentorId } } },
        _avg: { mentorRating: true },
        _count: true,
      }),
    ]);

    await tx.workshop.update({
      where: { id: workshopId },
      data: { ratingAvg: round(workshopStats._avg.workshopRating), reviewsCount: workshopStats._count },
    });
    await tx.mentorProfile.update({
      where: { id: mentorId },
      data: { ratingAvg: round(mentorStats._avg.mentorRating), reviewsCount: mentorStats._count },
    });
  }
}

const round = (value: number | null) => Math.round((value ?? 0) * 100) / 100;