import { supabase } from '../../lib/supabase/client';

export const progressService = {
  async getCompletedLessons(studentId: string, _courseId: string): Promise<string[]> {
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
        course_id: courseId,
        completed
      }, { onConflict: 'student_id,lesson_id' });

    if (error) {
      console.error('Upsert on lesson_progress failed:', error);
      throw error;
    }
    return true;
  },

  async saveVideoProgress(studentId: string, courseId: string, lessonId: string, secondsWatched: number): Promise<void> {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId,
        video_progress_seconds: secondsWatched,
      }, { onConflict: 'student_id,lesson_id' });
    if (error) console.error('Erro ao salvar progresso do vídeo:', error);
  },

  async getVideoProgress(studentId: string, lessonId: string): Promise<number> {
    const { data } = await supabase
      .from('lesson_progress')
      .select('video_progress_seconds')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    return data?.video_progress_seconds || 0;
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
        const { data: submissions } = await supabase
          .from('quiz_submissions')
          .select('score')
          .eq('student_id', userId);

        const avgScore = submissions && submissions.length > 0
          ? Math.round(submissions.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) / submissions.length)
          : 0;

        const { data: studentEnrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', userId)
          .eq('status', 'ACTIVE');

        const enrolledCourseIds = (studentEnrollments || []).map((e: any) => e.course_id);

        let totalLessons = 0;
        if (enrolledCourseIds.length > 0) {
          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('course_id', enrolledCourseIds);
          totalLessons = count || 0;
        }

        return [{
          student_id: userId,
          total_lessons: totalLessons,
          completed_lessons: completed.length,
          progress_percent: totalLessons > 0 ? Math.min(100, Math.round((completed.length / totalLessons) * 100)) : 0,
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
