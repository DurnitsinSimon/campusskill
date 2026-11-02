import { api } from './client';
import type { AppNotification } from './types';

export const notificationsApi = {
  list: () =>
    api.get<{ items: AppNotification[]; unreadCount: number }>('/notifications').then((r) => r.data),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};