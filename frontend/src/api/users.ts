import { api } from './client';
import type { MentorProfile, ProgressResponse, User } from './types';

export type ProfilePayload = Partial<
  Pick<User, 'firstName' | 'lastName' | 'bio' | 'university' | 'course' | 'emailNotifications' | 'reminderHoursBefore'>
>;

export const usersApi = {
  updateProfile: (payload: ProfilePayload) => api.patch<User>('/users/me', payload).then((r) => r.data),
  progress: () => api.get<ProgressResponse>('/users/me/progress').then((r) => r.data),
    updateMentorProfile: (payload: Partial<Omit<MentorProfile, 'id'>>) =>
    api.patch<MentorProfile>('/users/me/mentor-profile', payload).then((r) => r.data),
};