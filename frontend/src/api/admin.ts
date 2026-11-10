import { api } from './client';
import type { AdminStats, AdminUser, AdminWorkshop, BlockResult, Paginated, Role, WorkshopStatus } from './types';

export interface AdminUsersParams {
  search?: string;
  role?: Role;
  page?: number;
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),

  workshops: (status: WorkshopStatus) =>
    api.get<AdminWorkshop[]>('/admin/workshops', { params: { status } }).then((r) => r.data),
  approve: (id: number) => api.post(`/admin/workshops/${id}/approve`).then((r) => r.data),
  reject: (id: number, reason: string) => api.post(`/admin/workshops/${id}/reject`, { reason }).then((r) => r.data),
  cancel: (id: number, reason: string) => api.post(`/admin/workshops/${id}/cancel`, { reason }).then((r) => r.data),

  users: ({ search, role, page }: AdminUsersParams) =>
    api
      .get<Omit<Paginated<AdminUser>, 'limit'>>('/admin/users', {
        params: { search: search || undefined, role: role || undefined, page },
      })
      .then((r) => r.data),
  setBlocked: (id: number, isBlocked: boolean) =>
    api.patch<BlockResult>(`/admin/users/${id}/block`, { isBlocked }).then((r) => r.data),
  changeRole: (id: number, role: Role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
};