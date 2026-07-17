import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { Course } from '../types';
import { courseService } from '../services/supabase/courseService';

export function useTeacherCourses(teacherId: string | undefined, isAdmin: boolean = false) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      let liveCourses: any[];
      if (isAdmin) {
        const { data } = await supabase.from('courses').select('*');
        liveCourses = data || [];
      } else {
        liveCourses = await courseService.getTeacherCourses(teacherId);
      }
      setCourses(liveCourses.map((c: any) => ({
        id: c.id,
        slug: c.slug || c.id,
        title: c.title,
        subtitle: c.description || '',
        summary: c.description || '',
        duration: c.duration || '12 Semanas',
        hours: '72 Horas Letivas',
        language: 'Inglês',
        modality: 'Híbrido',
        schedule: 'Terças e Quintas',
        startDate: 'Em breve',
        price: 'Grátis',
        targetAudience: [],
        modules: [],
        teacher_id: c.teacher_id,
        status: c.status,
        level: c.level || 'Intermédio',
        category: c.category || 'Geral',
        thumbnail: c.thumbnail
      })));
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId, isAdmin]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, refetch: fetchCourses };
}
