import { api } from './client';
import type { Enrollment } from './types';

export const enrollmentsApi = {
  enroll: (payload: { workshopId: number; comment?: string }) =>
    api.post<Enrollment>('/enrollments', payload).then((r) => r.data),

  cancel: (enrollmentId: number) =>
    api.patch<Enrollment>(`/enrollments/${enrollmentId}/cancel`).then((r) => r.data),

  forWorkshop: (workshopId: number) =>
    api.get<Enrollment | ''>(`/enrollments/workshop/${workshopId}`).then((r) => r.data || null),

  mine: (scope: 'upcoming' | 'past') =>
    api.get<Enrollment[]>('/enrollments/my', { params: { scope } }).then((r) => r.data),
};