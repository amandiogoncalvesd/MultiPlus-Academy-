import { useState } from 'react';
import { lessonService, SupabaseLesson, SupabaseMaterial } from '../services/supabase/lessonService';

export function useLessons(courseId?: string) {
  const [lessons, setLessons] = useState<SupabaseLesson[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await lessonService.getLessons(cId);
      setLessons(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (lesson: Partial<SupabaseLesson>) => {
    try {
      const newLesson = await lessonService.createLesson(lesson);
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar aula');
      throw err;
    }
  };

  const getMaterials = async (lessonId: string): Promise<SupabaseMaterial[]> => {
    try {
      return await lessonService.getMaterials(lessonId);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar materiais');
      return [];
    }
  };

  const addMaterial = async (material: Partial<SupabaseMaterial>) => {
    try {
      return await lessonService.addMaterial(material);
    } catch (err: any) {
      setError(err.message || 'Erro ao anexar material');
      throw err;
    }
  };

  return {
    lessons,
    loading,
    error,
    fetchLessons,
    createLesson,
    getMaterials,
    addMaterial
  };
}
