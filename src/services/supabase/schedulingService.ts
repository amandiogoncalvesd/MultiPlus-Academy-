import { supabase } from '../../lib/supabase/client';

export const schedulingService = {
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
  }
};
