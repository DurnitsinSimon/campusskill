import { api } from "./client";
import type {
  MentorReview,
  MentorWorkshop,
  MentorWorkshopDetails,
  Participant,
  WorkshopFormValues,
} from "./types";

type ParticipantAction = "ATTENDED" | "NO_SHOW" | "REJECTED";

export const mentorApi = {
  workshops: () =>
    api.get<MentorWorkshop[]>("/mentor/workshops").then((r) => r.data),
  workshop: (id: number) =>
    api
      .get<MentorWorkshopDetails>(`/mentor/workshops/${id}`)
      .then((r) => r.data),
  create: (values: WorkshopFormValues) =>
    api
      .post<{ id: number; slug: string }>("/mentor/workshops", values)
      .then((r) => r.data),
  update: (id: number, values: Partial<WorkshopFormValues>) =>
    api
      .patch<{ id: number; slug: string }>(`/mentor/workshops/${id}`, values)
      .then((r) => r.data),
  submit: (id: number) =>
    api.post(`/mentor/workshops/${id}/submit`).then((r) => r.data),
  cancel: (id: number) =>
    api.post(`/mentor/workshops/${id}/cancel`).then((r) => r.data),

  participants: (id: number) =>
    api
      .get<Participant[]>(`/mentor/workshops/${id}/participants`)
      .then((r) => r.data),
  updateParticipant: (
    workshopId: number,
    enrollmentId: number,
    status: ParticipantAction,
  ) =>
    api
      .patch(`/mentor/workshops/${workshopId}/participants/${enrollmentId}`, {
        status,
      })
      .then((r) => r.data),

  reviews: () => api.get<MentorReview[]>("/mentor/reviews").then((r) => r.data),
  reply: (reviewId: number, reply: string) =>
    api
      .patch(`/mentor/reviews/${reviewId}/reply`, { reply })
      .then((r) => r.data),
};
