import { supabase } from '../../lib/supabase/client';

export const noteService = {
  async getLessonNotes(studentId: string, lessonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .order('video_timestamp', { ascending: true });
    if (error) { console.error('Erro ao buscar apontamentos:', error); return []; }
    return data || [];
  },

  async saveLessonNote(studentId: string, lessonId: string, courseId: string, content: string, videoTimestamp: number): Promise<any> {
    const { data, error } = await supabase
      .from('lesson_notes')
      .insert({
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId,
        content,
        video_timestamp: videoTimestamp
      })
      .select()
      .single();
    if (error) { console.error('Erro ao salvar apontamento:', error); throw error; }
    return data;
  }
};
