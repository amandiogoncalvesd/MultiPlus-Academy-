import { useState, useEffect } from 'react';
import { academicService } from '../services/supabase/academicService';

export function useCourses(onlyActive = true) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await academicService.getCourses(onlyActive);
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [onlyActive]);

  const createCourse = async (course: any) => {
    try {
      const newCourse = await academicService.createCourse(course);
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar curso');
      throw err;
    }
  };

  const updateCourse = async (id: string, updates: any) => {
    try {
      const updated = await academicService.updateCourse(id, updates);
      setCourses(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar curso');
      throw err;
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await academicService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir curso');
      throw err;
    }
  };

  const enrollStudent = async (studentId: string, courseId: string) => {
    try {
      return await academicService.enrollStudent(studentId, courseId);
    } catch (err: any) {
      setError(err.message || 'Erro ao matricular no curso');
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudent
  };
}

