export type Role = 'PARTICIPANT' | 'MENTOR' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  university: string | null;
  course: number | null;
  role: Role;
  emailNotifications: boolean;
  reminderHoursBefore: number;
  createdAt: string;
  mentorProfile?: { id: number; headline: string } | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}