export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  user?: User;
  phoneNumber?: string;
  academicLevel?: string;
  currentStreak: number;
  lastActiveDate?: Date;
  createdAt: Date;
}

export interface Teacher {
  id: string;
  userId: string;
  user?: User;
  bio?: string;
  specialties: string[];
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  hours: number;
  duration: string;
  modality: string; // Presencial, Híbrido, Online
  teacherId?: string;
  teacher?: Teacher;
  startDate?: Date;
  imageUrl?: string;
  createdAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  module?: Module;
  title: string;
  description?: string;
  videoUrl?: string; // Cloudinary URL
  durationSeconds: number;
  orderIndex: number;
  createdAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  student?: Student;
  courseId: string;
  course?: Course;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "PENDING";
  progressPercent: number;
  enrolledAt: Date;
}

export interface Assessment {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  maxScore: number;
  minPassingScore: number;
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  passed: boolean;
  attemptedAt: Date;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  issueDate: Date;
  revocationDate?: Date;
  uuid: string; // Unique Certificate Hash for Verifier Panel
  createdAt: Date;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  currency: string; // AOA or USD
  paymentMethod: string;
  status: "PAID" | "PENDING" | "FAILED";
  referenceCode?: string;
  paidAt?: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  authorId: string;
  published: boolean;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  location: string;
  isVirtual: boolean;
  meetingLink?: string; // Google Meet integration URL
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
