import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  
  create(
    data: Prisma.NotificationUncheckedCreateInput,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return db.notification.create({ data });
  }

  async findForUser(userId: number, onlyUnread = false) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, ...(onlyUnread && { isRead: false }) },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { workshop: { select: { slug: true, title: true } } },
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(userId: number, id: number) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (count === 0) throw new NotFoundException('Уведомление не найдено');
  }

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}