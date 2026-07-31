import { supabase } from '../../lib/supabase/client';
import { Assignment, AssignmentSubmission } from '../../types';

export const assignmentService = {
  // ──────────────── PROFESSOR: ASSIGNMENTS ────────────────

  /**
   * Listar todas as avaliações criadas por um professor
   */
  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, course:courses(id, title)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teacher assignments:', error);
      return [];
    }
    return (data || []).map((a: any) => ({
      ...a,
      course_title: a.course?.title || ''
    }));
  },

  /**
   * Listar avaliações de um curso específico
   */
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course assignments:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Criar nova avaliação
   */
  async createAssignment(assignment: {
    course_id: string;
    teacher_id: string;
    titulo: string;
    descricao?: string;
    due_date?: string;
    lesson_id?: string;
    status?: 'DRAFT' | 'PUBLISHED';
    target_student_ids?: string[];
  }): Promise<Assignment> {
    const { target_student_ids = [], ...payload } = assignment;
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...payload,
        status: assignment.status || 'PUBLISHED'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
    if (target_student_ids.length) {
      const { error: targetError } = await supabase.from('assignment_targets').insert(target_student_ids.map((student_id) => ({ assignment_id: data.id, student_id })));
      if (targetError) {
        await supabase.from('assignments').delete().eq('id', data.id);
        throw targetError;
      }
    }
    return data;
  },

  /**
   * Atualizar avaliação existente
   */
  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
    return data;
  },

  /**
   * Eliminar avaliação
   */
  async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
    return true;
  },

  // ──────────────── PROFESSOR: SUBMISSÕES ────────────────

  /**
   * Buscar submissões pendentes (sem nota) para o professor
   */
  async getPendingSubmissions(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner(id, titulo, course_id, teacher_id, course:courses(id, title)),
        student:users(id, nome_completo, email, foto_perfil)
      `)
      .is('grade', null)
      .eq('assignment.teacher_id', teacherId)
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Buscar TODAS as submissões (pendentes + corrigidas) para o professor
   */
  async getAllSubmissions(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner(id, titulo, course_id, teacher_id, course:courses(id, title)),
        student:users(id, nome_completo, email, foto_perfil)
      `)
      .eq('assignment.teacher_id', teacherId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Buscar submissões de uma avaliação específica
   */
  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, student:users(id, nome_completo, email, foto_perfil)')
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Error fetching submissions for assignment:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Atribuir nota e feedback a uma submissão
   */
  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        grade,
        feedback: feedback || null
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
    return data;
  },

  /**
   * Contar submissões pendentes (sem nota) para o professor
   */
  async getPendingSubmissionsCount(teacherId: string): Promise<number> {
    const { count, error } = await supabase
      .from('assignment_submissions')
      .select('id, assignment:assignments!inner(teacher_id)', { count: 'exact', head: true })
      .is('grade', null)
      .eq('assignment.teacher_id', teacherId);

    if (error) {
      console.error('Error counting pending submissions:', error);
      return 0;
    }
    return count || 0;
  },

  // ──────────────── BROADCAST FEEDBACK ────────────────

  /**
   * Enviar feedback coletivo como notificação para todos os alunos do curso
   */
  async broadcastFeedback(
    teacherId: string,
    courseId: string,
    message: string
  ): Promise<void> {
    // 1. Buscar todos os alunos matriculados no curso
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE');

    if (!enrollments || enrollments.length === 0) return;

    // 2. Criar notificação para cada aluno
    const notifications = enrollments.map(e => ({
      user_id: e.student_id,
      text: message,
      read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error broadcasting feedback:', error);
      throw error;
    }
  }
};
