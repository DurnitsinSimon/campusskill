import { api } from './client';

export interface CreateReviewPayload {
  enrollmentId: number;
  workshopRating: number;
  mentorRating: number;
  comment?: string;
}

export const reviewsApi = {
  create: (payload: CreateReviewPayload) => api.post('/reviews', payload).then((r) => r.data),
};