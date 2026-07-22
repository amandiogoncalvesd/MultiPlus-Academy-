import { supabase } from '../../lib/supabase/client';

export const schedulingService = {
  /**
   * Legacy compatibility for instructor calendar callers. The lesson access
   * window is authoritative and belongs to the course lesson, not one student.
   */
  async scheduleLesson(
    lessonId: string,
    _studentId: string,
    courseId: string,
    accessStartsAt: string,
    accessEndsAt?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('lessons')
      .update({
        scheduled_at: accessStartsAt,
        access_starts_at: accessStartsAt,
        access_ends_at: accessEndsAt || null,
        status: 'PUBLISHED',
      })
      .eq('id', lessonId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error scheduling lesson:', error);
      throw error;
    }
  },

  /**
   * Returns every scheduled lesson in the student's active courses. The
   * timeline includes future, active and ended lessons so the UI can place
   * each one in the appropriate section without relying on per-student
   * lesson_targets.
   */
  async getScheduledLessonsForStudent(studentId: string): Promise<any[]> {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id, course:courses(id, title, slug, thumbnail)')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (enrollmentError) {
      console.error('Error fetching student enrollments for calendar:', enrollmentError);
      return [];
    }

    const timeline = await Promise.all((enrollments || []).map(async (enrollment: any) => {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', enrollment.course_id)
        .eq('status', 'PUBLISHED')
        .not('access_starts_at', 'is', null)
        .order('access_starts_at', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled lessons for course:', error);
        return [];
      }

      return (lessons || []).map((lesson: any) => ({
        id: lesson.id,
        lesson: { ...lesson, course: enrollment.course },
      }));
    }));

    return timeline.flat();
  },

  async getScheduledLessonsForProfessor(): Promise<any[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, course:courses(id, title, teacher_id)')
      .eq('status', 'PUBLISHED')
      .not('access_starts_at', 'is', null)
      .order('access_starts_at', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled lessons for professor:', error);
      return [];
    }
    return (data || []).map((lesson: any) => ({ id: lesson.id, lesson }));
  },
};
