import { supabase } from '../../lib/supabase/client';
import { generateSlug } from '../../lib/utils/slug';
import { quizService } from './quizService';
import { schedulingService } from './schedulingService';
import { noteService } from './noteService';
import { progressService } from './progressService';
import { materialService } from './materialService';
import { enrollmentService } from './enrollmentService';

// Re-exportar serviços especializados para compatibilidade temporária
// Os consumidores podem migrar para importar diretamente dos novos serviços
export { quizService } from './quizService';
export { schedulingService } from './schedulingService';
export { noteService } from './noteService';
export { progressService } from './progressService';
export { materialService } from './materialService';

// =========================================================================
// Interfaces compartilhadas (mantidas aqui pois são usadas por múltiplos serviços)
// =========================================================================

export interface DBEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  data_inicio: string;
  progress_percent?: number;
}

export interface DBLesson {
  id: string;
  course_id: string;
  module_id?: string;
  titulo: string;
  descricao?: string;
  video_url?: string;
  ordem: number;
  duracao?: string;
  scheduled_at?: string;
  access_starts_at?: string;
  access_ends_at?: string;
  allow_replay_after_end?: boolean;
  status?: string;
  quiz?: any;
  meeting_url?: string;
}

export interface DBModule {
  id: string;
  course_id: string;
  titulo: string;
  ordem: number;
}

export interface DBCertificate {
  id: string;
  student_id: string;
  course_id: string;
  codigo_validacao: string;
  emitido_em: string;
  final_grade?: string;
}

export interface DBLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  created_at: string;
}

// =========================================================================
// Serviço acadêmico — apenas cursos, módulos, aulas, matrículas e certificados
// =========================================================================

export const academicService = {
  // =========================================================================
  // 1. COURSES CRUD
  // =========================================================================
  async getCourses(onlyActive = true): Promise<any[]> {
    let query = supabase.from('courses').select('id, title, slug, description, thumbnail, category, level, duration, status, teacher_id, created_at');
    if (onlyActive) {
      query = query.eq('status', 'PUBLISHED');
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
    return data || [];
  },

  async createCourse(course: any): Promise<any> {
    const titleVal = course.title || course.titulo || 'Novo Curso';
    const slugVal = course.slug || generateSlug(titleVal);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: titleVal,
        slug: slugVal,
        description: course.description || course.descricao || course.subtitle || '',
        duration: course.duration || course.duracao || '12 Semanas',
        category: course.category || course.categoria || 'Geral',
        status: course.status || 'DRAFT',
        thumbnail: course.thumbnail || course.imagem || null,
        teacher_id: course.teacher_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }
    return data;
  },

  async updateCourse(id: string, updates: any): Promise<any> {
    const payload: any = {};
    if (updates.title !== undefined || updates.titulo !== undefined) payload.title = updates.title || updates.titulo;
    if (updates.description !== undefined || updates.descricao !== undefined) payload.description = updates.description || updates.descricao;
    if (updates.duration !== undefined || updates.duracao !== undefined) payload.duration = updates.duration || updates.duracao;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.thumbnail !== undefined || updates.imagem !== undefined) payload.thumbnail = updates.thumbnail || updates.imagem;
    if (updates.category !== undefined || updates.categoria !== undefined) payload.category = updates.category || updates.categoria;

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw error;
    }
    return data;
  },

  async deleteCourse(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 2. MODULES SYSTEM
  // =========================================================================
  async getCourseModules(courseId: string): Promise<DBModule[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`Error fetching modules for course ${courseId}:`, error);
      throw error;
    }
    return data || [];
  },

  async createModule(courseId: string, titulo: string, ordem: number): Promise<DBModule> {
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, titulo, ordem })
      .select()
      .single();

    if (error) {
      console.error('Error creating module:', error);
      throw error;
    }
    return data;
  },

  // =========================================================================
  // 3. LESSONS SYSTEM
  // =========================================================================
  async getLessons(courseId: string): Promise<DBLesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, course_id, module_id, titulo, descricao, video_url, ordem, duracao, scheduled_at, access_starts_at, access_ends_at, allow_replay_after_end, status, quiz, meeting_url')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
    return data || [];
  },

  async createLesson(lesson: Partial<DBLesson>): Promise<DBLesson> {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
    return data;
  },

  async deleteLesson(lessonId: string): Promise<boolean> {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 4. ENROLLMENTS
  // =========================================================================
  enrollStudent: enrollmentService.enrollStudent.bind(enrollmentService),

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, student_id, course_id, status, data_inicio, progress_percent, course:courses(id, title, slug, thumbnail, duration, category, status)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching student enrollments:', error);
      return [];
    }
    return data || [];
  },

  async updateEnrollmentProgress(studentId: string, courseId: string, progressPercent: number): Promise<any> {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: progressPercent >= 100 ? 'COMPLETED' : 'ACTIVE'
      })
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      console.warn('Could not update status on enrollments table:', error);
    }
    return data;
  },

  // =========================================================================
  // 5. CERTIFICATES
  // =========================================================================
  async getStudentCertificates(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, course:courses(id, title, slug, thumbnail, duration)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }
    return data || [];
  },

  async verifyCertificate(codigo: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('verify_certificate_public', { p_codigo: codigo.trim() })
      .maybeSingle();

    if (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
    if (!data) return null;

    const certificate = data as {
      codigo_validacao: string;
      emitido_em: string;
      final_grade: number | null;
      student_name: string;
      course_title: string;
    };

    return {
      codigo_validacao: certificate.codigo_validacao,
      emitido_em: certificate.emitido_em,
      final_grade: certificate.final_grade,
      student: { nome_completo: certificate.student_name },
      course: { title: certificate.course_title },
    };
  },

  // =========================================================================
  // 6. DELEGATED METHODS (compatibilidade — chamar serviços especializados)
  // =========================================================================
  // Quiz
  getQuizByLesson: quizService.getQuizByLesson,
  submitQuizResponse: quizService.submitQuizResponse,
  getQuizSubmissions: quizService.getQuizSubmissions,

  // Scheduling
  scheduleLesson: schedulingService.scheduleLesson,
  getScheduledLessonsForStudent: schedulingService.getScheduledLessonsForStudent,
  getScheduledLessonsForProfessor: schedulingService.getScheduledLessonsForProfessor,

  // Progress
  getCompletedLessons: progressService.getCompletedLessons,
  markLessonComplete: progressService.markLessonComplete,
  saveVideoProgress: progressService.saveVideoProgress,
  getVideoProgress: progressService.getVideoProgress,
  getStudentProgressMetrics: progressService.getStudentProgressMetrics,

  // Notes
  getLessonNotes: noteService.getLessonNotes,
  saveLessonNote: noteService.saveLessonNote,

  // Materials & Assignments
  getStudentMaterials: materialService.getStudentMaterials,
  getStudentAssignments: materialService.getStudentAssignments,
  submitAssignment: materialService.submitAssignment,
};
