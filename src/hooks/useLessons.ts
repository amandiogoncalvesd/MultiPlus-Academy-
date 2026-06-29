import { useState } from 'react';
import { academicService, DBLesson } from '../services/supabase/academicService';
import { lessonService, SupabaseMaterial } from '../services/supabase/lessonService';

export function useLessons(courseId?: string) {
  const [lessons, setLessons] = useState<DBLesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async (cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await academicService.getLessons(cId);
      setLessons(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (lesson: Partial<DBLesson>) => {
    try {
      const newLesson = await academicService.createLesson(lesson);
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar aula');
      throw err;
    }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      await academicService.deleteLesson(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir aula');
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

  const fetchCompletedLessons = async (studentId: string, cId: string) => {
    try {
      const completed = await academicService.getCompletedLessons(studentId, cId);
      setCompletedLessonIds(completed);
      return completed;
    } catch (err: any) {
      console.error('Error fetching completed lessons:', err);
      return [];
    }
  };

  const toggleLessonComplete = async (studentId: string, cId: string, lessonId: string, completed: boolean) => {
    try {
      await academicService.markLessonComplete(studentId, cId, lessonId, completed);
      setCompletedLessonIds(prev => 
        completed ? [...prev, lessonId] : prev.filter(id => id !== lessonId)
      );
      
      // Re-calculate percentage
      const totalLessonsCount = lessons.length || 1;
      const completedCount = completed 
        ? completedLessonIds.filter(id => id !== lessonId).length + 1 
        : completedLessonIds.filter(id => id !== lessonId).length;
      
      const newPercent = Math.round((completedCount / totalLessonsCount) * 100);
      await academicService.updateEnrollmentProgress(studentId, cId, newPercent);
    } catch (err: any) {
      console.error('Error toggling lesson complete status:', err);
    }
  };

  return {
    lessons,
    completedLessonIds,
    loading,
    error,
    fetchLessons,
    createLesson,
    deleteLesson,
    getMaterials,
    addMaterial,
    fetchCompletedLessons,
    toggleLessonComplete
  };
}

