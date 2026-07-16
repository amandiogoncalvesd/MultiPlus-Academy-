import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { assignmentService } from '../services/supabase/assignmentService';
import { Assignment, AssignmentSubmission } from '../types';

export function useTeacherEvaluations(teacherId: string | undefined) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      // 1. Fetch teacher's assignments
      const list = await assignmentService.getAssignmentsByTeacher(teacherId);
      setAssignments(list);

      // 2. Fetch pending submissions (where grade IS NULL) for these assignments
      const pSubs = await assignmentService.getPendingSubmissions(teacherId);

      // We should join student info to the pending submissions for premium display
      if (pSubs.length > 0) {
        const studentIds = Array.from(new Set(pSubs.map(s => s.student_id)));
        const { data: students } = await supabase
          .from('users')
          .select('id, email, nome_completo, foto_perfil')
          .in('id', studentIds);

        const mappedSubs = pSubs.map(sub => {
          const student = students?.find(s => s.id === sub.student_id);
          const assignment = list.find(a => a.id === sub.assignment_id);
          return {
            ...sub,
            studentName: student?.nome_completo || student?.email || 'Estudante',
            studentAvatar: student?.foto_perfil,
            assignmentTitle: assignment?.titulo || 'Tarefa de Oratória'
          };
        });
        setPendingSubmissions(mappedSubs);
      } else {
        setPendingSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching teacher evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) {
      setAssignments([]);
      setPendingSubmissions([]);
      setLoading(false);
      return;
    }

    fetchEvaluations();

    // Setup realtime subscription
    const channel = supabase
      .channel(`teacher-evaluations-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments', filter: `teacher_id=eq.${teacherId}` }, () => fetchEvaluations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_submissions' }, () => fetchEvaluations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, fetchEvaluations]);

  return { assignments, pendingSubmissions, loading, refetch: fetchEvaluations };
}
