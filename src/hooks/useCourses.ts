import { useState, useEffect } from 'react';
import { courseService, SupabaseCourse } from '../services/supabase/courseService';

export function useCourses() {
  const [courses, setCourses] = useState<SupabaseCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const createCourse = async (course: Partial<SupabaseCourse>) => {
    try {
      const newCourse = await courseService.createCourse(course);
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar curso');
      throw err;
    }
  };

  const enrollStudent = async (studentId: string, courseId: string) => {
    try {
      return await courseService.enrollStudent(studentId, courseId);
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
    enrollStudent
  };
}
