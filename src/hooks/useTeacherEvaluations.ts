import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../services/supabase/assignmentService';
import { Assignment } from '../types';

export function useTeacherEvaluations(teacherId: string | undefined) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [assigns, pending, count] = await Promise.all([
        assignmentService.getAssignmentsByTeacher(teacherId),
        assignmentService.getPendingSubmissions(teacherId),
        assignmentService.getPendingSubmissionsCount(teacherId)
      ]);
      setAssignments(assigns);
      setPendingSubmissions(pending);
      setPendingCount(count);
    } catch (err) {
      console.error('Error fetching teacher evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { assignments, pendingSubmissions, pendingCount, loading, refetch: fetchData };
}
