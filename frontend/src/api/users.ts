import { api } from './client';
import type { ProgressResponse, User } from './types';

export type ProfilePayload = Partial<
  Pick<User, 'firstName' | 'lastName' | 'bio' | 'university' | 'course' | 'emailNotifications' | 'reminderHoursBefore'>
>;

export const usersApi = {
  updateProfile: (payload: ProfilePayload) => api.patch<User>('/users/me', payload).then((r) => r.data),
  progress: () => api.get<ProgressResponse>('/users/me/progress').then((r) => r.data),
};