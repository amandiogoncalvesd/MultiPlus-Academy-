import { supabase } from '../../lib/supabase/client';

export const quizService = {
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
  }
};
