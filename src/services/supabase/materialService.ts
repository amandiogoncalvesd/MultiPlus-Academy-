import { supabase } from '../../lib/supabase/client';

export const materialService = {
  async getStudentMaterials(studentId: string): Promise<any[]> {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (!enrollments || enrollments.length === 0) return [];

    const courseIds = enrollments.map(e => e.course_id);

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id, titulo')
      .in('course_id', courseIds);

    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(l => l.id);

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .in('lesson_id', lessonIds);

    if (error) { console.error('Erro ao buscar materiais:', error); return []; }

    return (materials || []).map(m => ({
      ...m,
      course_id: lessons.find(l => l.id === m.lesson_id)?.course_id,
      lesson_title: lessons.find(l => l.id === m.lesson_id)?.titulo
    }));
  },

  async getStudentAssignments(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id, course:courses(id, title)')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (error || !data) return [];

    const courseIds = data.map(e => e.course_id);

    const { data: assignments, error: aError } = await supabase
      .from('assignments')
      .select('*')
      .in('course_id', courseIds)
      .eq('status', 'PUBLISHED');

    if (aError) { console.error('Erro ao buscar tarefas:', aError); return []; }
    return assignments || [];
  },

  async submitAssignment(assignmentId: string, studentId: string, submission: { text?: string; url?: string }): Promise<any> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: studentId,
        submission_text: submission.text || null,
        submission_url: submission.url || null,
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();
    if (error) { console.error('Erro ao submeter tarefa:', error); throw error; }
    return data;
  }
};
