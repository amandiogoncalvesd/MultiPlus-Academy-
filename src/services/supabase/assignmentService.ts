import { supabase } from '../../lib/supabase/client';
import { Assignment, AssignmentSubmission } from '../../types';

export interface CreateAssignmentDTO {
  course_id: string;
  lesson_id?: string | null;
  teacher_id: string;
  titulo: string;
  descricao?: string | null;
  due_date?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export const assignmentService = {
  // =========================================================================
  // 1. ASSIGNMENTS CRUD
  // =========================================================================
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      throw error;
    }
    return data || [];
  },

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching assignments for teacher ${teacherId}:`, error);
      throw error;
    }
    return data || [];
  },

  async createAssignment(data: CreateAssignmentDTO): Promise<Assignment> {
    const { data: created, error } = await supabase
      .from('assignments')
      .insert({
        course_id: data.course_id,
        lesson_id: data.lesson_id || null,
        teacher_id: data.teacher_id,
        titulo: data.titulo,
        descricao: data.descricao || null,
        due_date: data.due_date || null,
        status: data.status || 'DRAFT'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
    return created;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const payload: any = {};
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.descricao !== undefined) payload.descricao = updates.descricao;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.lesson_id !== undefined) payload.lesson_id = updates.lesson_id;

    const { data, error } = await supabase
      .from('assignments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating assignment ${id}:`, error);
      throw error;
    }
    return data;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting assignment ${id}:`, error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 2. SUBMISSIONS & GRADING
  // =========================================================================
  async getPendingSubmissions(teacherId: string): Promise<AssignmentSubmission[]> {
    // Fetch assignments by this teacher first
    const assignments = await this.getAssignmentsByTeacher(teacherId);
    const assignmentIds = assignments.map(a => a.id);

    if (assignmentIds.length === 0) return [];

    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .in('assignment_id', assignmentIds)
      .is('grade', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      throw error;
    }
    return data || [];
  },

  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
      throw error;
    }
    return data || [];
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        grade,
        feedback,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error(`Error grading submission ${submissionId}:`, error);
      throw error;
    }

    // Send a real-time notification to the student
    try {
      if (data && data.student_id) {
        await supabase.from('notifications').insert({
          user_id: data.student_id,
          text: `A tua submissão de tarefa foi avaliada com a nota ${grade}/100.`,
          read: false
        });
      }
    } catch (e) {
      console.warn('Could not trigger notification for submission grading:', e);
    }

    return data;
  },

  // =========================================================================
  // 3. BROADCAST NOTIFICATION
  // =========================================================================
  async broadcastFeedback(teacherId: string, courseId: string, message: string): Promise<void> {
    // Get all students enrolled in this course
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);

    if (enrollError) {
      console.error(`Error getting enrolled students for course ${courseId}:`, enrollError);
      throw enrollError;
    }

    if (!enrollments || enrollments.length === 0) return;

    // Filter unique student IDs
    const studentIds = Array.from(new Set(enrollments.map(e => e.student_id)));

    // Insert notifications for all enrolled students
    const notificationsToInsert = studentIds.map(studentId => ({
      user_id: studentId,
      text: message,
      read: false
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);

    if (notifError) {
      console.error('Error inserting broadcast notifications:', notifError);
      throw notifError;
    }
  }
};
