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
  mentorProfile?: MentorProfile | null;}

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

export interface WorkshopReview {
  id: number;
  workshopRating: number;
  mentorRating: number;
  comment: string | null;
  mentorReply: string | null;
  createdAt: string;
  author: { name: string; avatarUrl: string | null };
}

export interface WorkshopDetails extends WorkshopListItem {
  description: string;
  requirements: string | null;
  programItems: { position: number; title: string; description: string | null; durationMinutes: number | null }[];
  mentor: WorkshopListItem['mentor'] & {
    experience: string;
    yearsOfExperience: number;
    reviewsCount: number;
    telegram: string | null;
    bio: string | null;
  };
  reviews: WorkshopReview[];
  similar: WorkshopListItem[];
}

export type EnrollmentStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'REJECTED' | 'ATTENDED' | 'NO_SHOW';

export interface Enrollment {
  id: number;
  status: EnrollmentStatus;
  waitlistPosition: number | null;
  comment: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  canReview: boolean;
  review: { id: number; workshopRating: number } | null;
  workshop: {
    id: number;
    slug: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    format: WorkshopFormat;
    location: string | null;
    meetingUrl: string | null;
    status: WorkshopStatus;
    mentorName: string;
  };
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  workshop: { slug: string; title: string } | null;
}

export interface SkillProgress {
  workshopsCompleted: number;
  minutesTotal: number;
  level: SkillLevel;
  updatedAt: string;
  skill: { name: string; slug: string; category: Category };
}

export interface ProgressResponse {
  summary: { workshopsAttended: number; minutesTotal: number; skillsCount: number; reviewsCount: number };
  skills: SkillProgress[];
}

export interface MentorWorkshop {
  id: number;
  slug: string;
  title: string;
  status: WorkshopStatus;
  rejectionReason: string | null;
  format: WorkshopFormat;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  price: number;
  ratingAvg: number;
  reviewsCount: number;
  confirmedCount: number;
  waitlistCount: number;
  attendedCount: number;
}

export interface ProgramItemInput {
  title: string;
  description?: string;
  durationMinutes?: number;
}

export interface WorkshopFormValues {
  title: string;
  shortDescription: string;
  description: string;
  requirements?: string;
  format: WorkshopFormat;
  location?: string;
  meetingUrl?: string;
  level: SkillLevel;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  price: number;
  skills: string[];
  program: ProgramItemInput[];
}

export interface MentorWorkshopDetails extends Omit<WorkshopFormValues, 'skills' | 'program'> {
  id: number;
  slug: string;
  status: WorkshopStatus;
  rejectionReason: string | null;
  skills: { slug: string; name: string }[];
  programItems: { position: number; title: string; description: string | null; durationMinutes: number | null }[];
}

export interface Participant {
  id: number;
  status: EnrollmentStatus;
  waitlistPosition: number | null;
  comment: string | null;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    university: string | null;
    course: number | null;
    avatarUrl: string | null;
  };
  review: { workshopRating: number } | null;
}

export interface MentorReview {
  id: number;
  workshopRating: number;
  mentorRating: number;
  comment: string | null;
  mentorReply: string | null;
  createdAt: string;
  enrollment: {
    user: { firstName: string; lastName: string; avatarUrl: string | null };
    workshop: { title: string; slug: string };
  };
}

export interface MentorProfile {
  id: number;
  headline: string;
  experience: string;
  yearsOfExperience: number;
  formats: WorkshopFormat[];
  telegram: string | null;
}