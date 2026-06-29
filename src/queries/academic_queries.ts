import { supabase } from '../lib/supabase/client';

export const academicQueries = {
  /**
   * Complex query to retrieve full course curriculum including lessons, materials and modules.
   */
  async getFullCourseCurriculum(courseId: string) {
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      return null;
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, materials(*)')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching lessons with materials:', lessonsError);
    }

    return {
      ...course,
      lessons: lessons || []
    };
  },

  /**
   * Retrieves the dynamic calculated progression percentage of a student in a course
   */
  async calculateStudentProgress(studentId: string, courseId: string): Promise<number> {
    try {
      // 1. Fetch total lessons count
      const { data: totalLessons, error: totalErr } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (totalErr || !totalLessons || totalLessons.length === 0) {
        return 0;
      }

      const totalCount = totalLessons.length;
      const lessonIds = totalLessons.map(l => l.id);

      // 2. Fetch completed lessons count
      const { data: completedLessons, error: compErr } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .in('lesson_id', lessonIds)
        .eq('completed', true);

      if (compErr || !completedLessons) {
        return 0;
      }

      const completedCount = completedLessons.length;
      return Math.round((completedCount / totalCount) * 100);
    } catch (e) {
      console.error('Error calculating progress:', e);
      return 0;
    }
  }
};
