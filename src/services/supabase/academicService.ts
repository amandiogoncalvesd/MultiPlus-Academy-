import { supabase } from '../../lib/supabase/client';
import { Course } from '../../types';

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

export const academicService = {
  // =========================================================================
  // 1. COURSES CRUD
  // =========================================================================
  async getCourses(onlyActive = true): Promise<any[]> {
    let query = supabase.from('courses').select('*');
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
    const slugVal = course.slug || titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: titleVal,
        slug: slugVal,
        description: course.description || course.descricao || course.subtitle || '',
        duration: course.duration || course.duracao || '12 Semanas',
        category: course.category || course.categoria || 'Geral',
        status: course.status || 'DRAFT',
        thumbnail: course.thumbnail || course.imagem || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=300',
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
  // 3. LESSONS AND MATERIALS SYSTEM
  // =========================================================================
  async getLessons(courseId: string): Promise<DBLesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
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
  // 4. ENROLLMENTS & PROGRESS
  // =========================================================================
  async enrollStudent(studentId: string, courseId: string): Promise<DBEnrollment> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
    return data;
  },

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
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
  // 5. LESSON COMPLETIONS
  // =========================================================================
  async getCompletedLessons(studentId: string, courseId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching completed lessons:', error);
      return [];
    }
    return (data || []).map((row: any) => row.lesson_id);
  },

  async markLessonComplete(studentId: string, courseId: string, lessonId: string, completed = true): Promise<boolean> {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        completed
      }, { onConflict: 'student_id,lesson_id' });

    if (error) {
      console.error('Upsert on lesson_progress failed:', error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 6. CERTIFICATES GENERATION & VALIDATION
  // =========================================================================
  async getStudentCertificates(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, course:courses(*)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }
    return data || [];
  },

  async verifyCertificate(codigo: string): Promise<any> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, student:users(*), course:courses(*)')
      .eq('codigo_validacao', codigo.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
    return data;
  },

  async getQuizByLesson(lessonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('quiz')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching quiz by lesson:', error);
      throw error;
    }
    
    return data?.quiz || [];
  },

  async submitQuizResponse(userId: string, lessonId: string, score: number, answers: any): Promise<any> {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .upsert({
        student_id: userId,
        lesson_id: lessonId,
        answers: answers,
        score: score,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'student_id,lesson_id' })
      .select()
      .single();

    if (error) {
      console.error('Error submitting quiz response:', error);
      throw error;
    }
    return data;
  },

  async getQuizSubmissions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('*')
      .eq('student_id', userId);

    if (error) {
      console.error('Error fetching quiz submissions:', error);
      return [];
    }
    return data || [];
  },

  async scheduleLesson(lessonId: string, studentId: string, courseId: string, scheduledAt: string): Promise<any> {
    const { data: targetData, error: targetError } = await supabase
      .from('lesson_targets')
      .upsert({
        lesson_id: lessonId,
        student_id: studentId,
        course_id: courseId
      }, { onConflict: 'lesson_id,student_id' })
      .select()
      .single();

    if (targetError) {
      console.error('Error inserting into lesson_targets:', targetError);
      throw targetError;
    }

    const { error: lessonError } = await supabase
      .from('lessons')
      .update({
        scheduled_at: scheduledAt,
        status: 'PUBLISHED'
      })
      .eq('id', lessonId);

    if (lessonError) {
      console.warn('Error updating scheduled_at on lessons:', lessonError);
    }

    return targetData;
  },

  async getScheduledLessonsForStudent(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_targets')
      .select('*, lesson:lessons(*, course:courses(*))')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching scheduled lessons for student:', error);
      return [];
    }
    return data || [];
  },

  async getScheduledLessonsForProfessor(): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_targets')
      .select('*, lesson:lessons(*, course:courses(*)), student:users(*)');

    if (error) {
      console.error('Error fetching scheduled lessons for professor:', error);
      return [];
    }
    return data || [];
  },

  async getStudentProgressMetrics(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_student_progress')
      .select('*')
      .eq('student_id', userId);

    if (error) {
      console.warn('Error fetching student progress metrics from view, running direct calculation fallback:', error);
      try {
        const completed = await this.getCompletedLessons(userId, '');
        const submissions = await this.getQuizSubmissions(userId);
        const avgScore = submissions.length > 0 
          ? Math.round(submissions.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / submissions.length)
          : 0;

        return [{
          student_id: userId,
          total_lessons: 3,
          completed_lessons: completed.length,
          progress_percent: Math.min(100, Math.round((completed.length / 3) * 100)),
          avg_quiz_score: avgScore || 0,
          last_activity: new Date().toISOString()
        }];
      } catch (fallbackErr) {
        console.error('Fallback calculation also failed:', fallbackErr);
        return [];
      }
    }
    return data || [];
  }
};
