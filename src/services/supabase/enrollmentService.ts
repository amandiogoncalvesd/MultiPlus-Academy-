import { supabase } from '../../lib/supabase/client';

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

    // 2. Prepare initial progress in student_progress table
    try {
      const { error: progressError } = await supabase
        .from('student_progress')
        .insert({
          student_id: studentId,
          course_id: courseId,
          completed_lessons: 0,
          progress_percentage: 0
        });
      
      if (progressError) {
        console.warn('Initial student_progress insert returned an error (expected if schema differs):', progressError);
      }
    } catch (e) {
      console.warn('Failed to insert initial progress:', e);
    }

    // 3. Prepare future notification
    try {
      // Get course title to customize notification text
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle();
      
      const courseTitle = course?.title || 'um novo curso';

      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          text: `Foste matriculado no curso: ${courseTitle}. Já podes aceder ao portal do aluno.`,
          read: false
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

    // Also clean up student progress if possible (optional, ignore errors)
    try {
      await supabase
        .from('student_progress')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', courseId);
    } catch (e) {
      console.warn('Could not clean up student progress on removal:', e);
    }

    return true;
  },

  /**
   * Gets all students enrolled in a specific course.
   */
  async getCourseStudents(courseId: string): Promise<any[]> {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return [];
    }

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    const studentIds = enrollments.map(e => e.student_id);

    // Fetch matching user profiles
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students for course:', studentsError);
      return [];
    }

    return (students || []).map(student => {
      const enrollment = enrollments.find(e => e.student_id === student.id);
      return {
        id: student.id,
        email: student.email,
        firstName: student.nome_completo?.split(' ')[0] || student.firstName || '',
        lastName: student.nome_completo?.split(' ').slice(1).join(' ') || student.lastName || '',
        role: student.role,
        avatarUrl: student.foto_perfil || null,
        phone: student.telefone || '',
        status: student.status || 'ACTIVE',
        enrolled_at: enrollment?.created_at,
        enrollment_id: enrollment?.id
      };
    });
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
      .select('*')
      .eq('role', 'ALUNO');

    if (error) {
      console.error('Error fetching all students:', error);
      return [];
    }

    return (students || []).map(student => ({
      id: student.id,
      email: student.email,
      firstName: student.nome_completo?.split(' ')[0] || student.firstName || '',
      lastName: student.nome_completo?.split(' ').slice(1).join(' ') || student.lastName || '',
      avatarUrl: student.foto_perfil || null,
      phone: student.telefone || '',
      status: student.status || 'ACTIVE'
    }));
  }
};
