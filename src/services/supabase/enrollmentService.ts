import { supabase } from '../../lib/supabase/client';
import { notificationService } from './notificationService';
import { mapSupabaseUserToAppUser } from '../../lib/utils/userMapper';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  created_at: string;
}

export const enrollmentService = {
  /**
   * Enrolls a student in a specific course.
   * Also creates initial progress and prepares a notification.
   */
  async enrollStudent(studentId: string, courseId: string): Promise<any> {
    // 1. Insert or update enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .upsert({
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE'
      }, { onConflict: 'student_id,course_id' })
      .select()
      .single();

    if (enrollError) {
      console.error('Error in enrollStudent:', enrollError);
      throw enrollError;
    }

    // Nota: O progresso agora é rastreado via lesson_progress, não student_progress
    // Não é necessário criar registo inicial aqui

    // 3. Prepare future notification
    try {
      // Get course title to customize notification text
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle();
      
      const courseTitle = course?.title || 'um novo curso';

      await notificationService.createNotification({
        userId: studentId,
        text: `Foste matriculado no curso: ${courseTitle}. Já podes aceder ao portal do aluno.`,
        type: 'enrollment',
      });
    } catch (e) {
      console.warn('Could not create enrollment notification:', e);
    }

    return enrollment;
  },

  /**
   * Removes a student from a course.
   */
  async removeStudent(studentId: string, courseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error removing student from course:', error);
      throw error;
    }

    // Limpar progresso das aulas (lesson_progress)
    try {
      // Buscar IDs das aulas do curso
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);
      
      if (courseLessons && courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id);
        await supabase
          .from('lesson_progress')
          .delete()
          .eq('student_id', studentId)
          .in('lesson_id', lessonIds);
      }
    } catch (e) {
      console.warn('Could not clean up lesson progress on removal:', e);
    }

    return true;
  },

  /**
   * Gets all students enrolled in a specific course using a single joined query (prevents N+1 query pattern).
   */
  async getCourseStudents(courseId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, created_at, status, student:users(id, email, nome_completo, role, foto_perfil, telefone, status)')
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching course students:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((enrollment: any) => {
      const student = enrollment.student;
      if (!student) return null;
      return {
        ...mapSupabaseUserToAppUser(student),
        enrolled_at: enrollment.created_at,
        enrollment_id: enrollment.id
      };
    }).filter(Boolean);
  },

  /**
   * Gets all courses a student is enrolled in.
   */
  async getStudentCourses(studentId: string): Promise<any[]> {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId);

    if (enrollError) {
      console.error('Error fetching enrollments for student:', enrollError);
      return [];
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    const courseIds = enrollments.map(e => e.course_id);

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    if (coursesError) {
      console.error('Error fetching enrolled courses:', coursesError);
      return [];
    }

    return (courses || []).map(course => {
      const enrollment = enrollments.find(e => e.course_id === course.id);
      return {
        ...course,
        enrollment_status: enrollment?.status,
        enrolled_at: enrollment?.created_at
      };
    });
  },

  /**
   * Checks if a student is enrolled in a course.
   */
  async checkEnrollment(studentId: string, courseId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Fetches all real profiles with role = ALUNO.
   */
  async getAllStudents(): Promise<any[]> {
    const { data: students, error } = await supabase
      .from('users')
      .select('id, email, nome_completo, role, foto_perfil, telefone, status')
      .eq('role', 'ALUNO');

    if (error) {
      console.error('Error fetching all students:', error);
      return [];
    }

    return (students || []).map(student => mapSupabaseUserToAppUser(student));
  }
};
