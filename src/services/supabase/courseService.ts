import { supabase } from '../../lib/supabase/client';
import { generateSlug } from '../../lib/utils/slug';

export interface SupabaseCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  teacher_id: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  price?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const courseService = {
  /**
   * Retrieves all published courses for the public catalog.
   */
  async getCourses(): Promise<SupabaseCourse[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('status', 'PUBLISHED');
    
    if (error) {
      console.error('Error fetching courses from Supabase:', error);
      return [];
    }
    return (data || []) as SupabaseCourse[];
  },

  /**
   * Retrieves a course by its ID.
   */
  async getCourseById(id: string): Promise<SupabaseCourse | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching course with id ${id}:`, error);
      return null;
    }
    return data as SupabaseCourse | null;
  },

  /**
   * Retrieves a course by its slug.
   */
  async getCourseBySlug(slug: string): Promise<SupabaseCourse | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching course with slug ${slug}:`, error);
      return null;
    }
    return data as SupabaseCourse | null;
  },

  /**
   * Retrieves all courses created by a specific teacher.
   */
  async getTeacherCourses(teacherId: string): Promise<SupabaseCourse[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId);
    
    if (error) {
      console.error(`Error fetching courses for teacher ${teacherId}:`, error);
      return [];
    }
    return (data || []) as SupabaseCourse[];
  },

  /**
   * Creates a new course under the authenticated teacher.
   */
  async createCourse(course: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
    const titleVal = course.title || 'Novo Curso';
    const slugVal = course.slug || generateSlug(titleVal);

    const payload = {
      title: titleVal,
      slug: slugVal,
      description: course.description || '',
      thumbnail: course.thumbnail || null,
      category: course.category || 'Geral',
      level: course.level || 'Intermédio',
      duration: course.duration || '12 Semanas',
      teacher_id: course.teacher_id,
      status: course.status || 'DRAFT',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating course in Supabase:', error);
      throw error;
    }
    return data as SupabaseCourse;
  },

  /**
   * Updates an existing course.
   */
  async updateCourse(id: string, updates: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove immutable fields if present
    delete (payload as any).id;
    delete (payload as any).created_at;

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating course ${id}:`, error);
      throw error;
    }
    return data as SupabaseCourse;
  },

  /**
   * Deletes a course.
   */
  async deleteCourse(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting course ${id}:`, error);
      throw error;
    }
    return true;
  }
};
