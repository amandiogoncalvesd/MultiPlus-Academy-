import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { Course } from '../types';

export function useTeacherCourses(teacherId: string | undefined) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teacherId) {
      setCourses([]);
      setLoading(false);
      return;
    }

    fetchCourses();

    const channel = supabase
      .channel(`teacher-courses-${teacherId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses', filter: `teacher_id=eq.${teacherId}` },
        () => {
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  return { courses, loading, refetch: fetchCourses };
}
