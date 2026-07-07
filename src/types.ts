export type PageId = 
  | 'home' 
  | 'about' 
  | 'courses' 
  | 'instructors' 
  | 'blog' 
  | 'contact'
  | 'student-dashboard'
  | 'instructor-dashboard'
  | 'admin-dashboard'
  | 'login'
  | 'register'
  | 'verify-certificate';

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  whatsapp?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  streak: number;
  longestStreak: number;
  totalHoursLearned: number;
}

export interface Enrollment {
  courseId: string;
  progressPercent: number;
  enrolledAt: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface LessonNote {
  id: string;
  lessonId: string;
  courseId: string;
  content: string;
  timestamp: number; // video timestamp in seconds
  createdAt: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  texto: string;
  lido: boolean;
  created_at: string;
  sender_nome?: string;
  sender_avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  duration: string;
  hours: string;
  language: string;
  modality: 'Híbrido' | 'Online' | 'Presencial';
  schedule: string;
  price?: string;
  startDate: string;
  targetAudience: string[];
  modules: {
    number: string;
    title: string;
    topics: string[];
  }[];
  teacher_id?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  level?: string;
  category?: string;
  thumbnail?: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  credentials: string[];
  bio: string;
  experienceYears: number;
  specializations: string[];
  institutions: string[];
  photo: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
}

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
