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

export type WorkshopFormat = 'ONLINE' | 'OFFLINE';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type WorkshopStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface Category {
  name: string;
  slug: string;
  icon: string | null;
}

export interface SkillTag {
  name: string;
  slug: string;
  isPrimary: boolean;
  category: Category;
}

export interface WorkshopListItem {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  coverUrl: string | null;
  format: WorkshopFormat;
  location: string | null;
  level: SkillLevel;
  status: WorkshopStatus;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  price: number;
  ratingAvg: number;
  reviewsCount: number;
  seatsTaken: number;
  seatsLeft: number;
  mentor: {
    id: number;
    headline: string;
    ratingAvg: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  skills: SkillTag[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SkillCategory extends Category {
  id: number;
  skills: { id: number; name: string; slug: string; workshopsCount: number }[];
}