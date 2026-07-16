import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';

export function useTeacherCalendar(teacherId: string | undefined) {
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      // Fetch teacher courses first
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', teacherId);

      const courseIds = (teacherCourses || []).map(c => c.id);

      if (courseIds.length === 0) {
        setScheduledLessons([]);
        setLoading(false);
        return;
      }

      // Fetch scheduled lesson targets
      const { data: targets, error } = await supabase
        .from('lesson_targets')
        .select('*, lesson:lessons(*, course:courses(*)), student:users(*)')
        .in('course_id', courseIds);

      if (error) throw error;
      setScheduledLessons(targets || []);
    } catch (err) {
      console.error('Error fetching teacher calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) {
      setScheduledLessons([]);
      setLoading(false);
      return;
    }

    fetchCalendar();

    // Setup realtime subscription
    const channel = supabase
      .channel(`teacher-calendar-${teacherId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_targets' }, () => fetchCalendar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => fetchCalendar())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, fetchCalendar]);

  return { scheduledLessons, loading, refetch: fetchCalendar };
}
