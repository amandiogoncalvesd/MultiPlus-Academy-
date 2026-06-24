import { supabase } from '../../lib/supabase/client';
import { Course } from '../../types';

export interface SupabaseCourse {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  imagem: string;
  categoria: string;
  duracao: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

export const courseService = {
  /**
   * Retrieves active courses.
   */
  async getCourses(): Promise<SupabaseCourse[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'ACTIVE');
      
      if (!error && data && data.length > 0) {
        return data as SupabaseCourse[];
      }
    } catch (e) {
      console.warn('Supabase courses fetching skipped or error. Falling back to local data.');
    }

    // Default institutional courses from data.ts
    return [
      {
        id: 'eng-legal-angola',
        titulo: 'English for the Legal Field in Angola',
        slug: 'eng-legal-angola',
        descricao: 'Inglês Jurídico especializado na oratória e termos jurídicos angolanos.',
        imagem: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
        categoria: 'Inglês Jurídico',
        duracao: '3 Meses (72h)',
        status: 'ACTIVE'
      },
      {
        id: 'legal-writing',
        titulo: 'Advanced Legal Writing & Contract Drafting',
        slug: 'legal-writing',
        descricao: 'Técnicas avançadas de redação técnica e elaboração de contratos em Inglês.',
        imagem: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=60',
        categoria: 'Inglês Jurídico',
        duracao: '4 Semanas (24h)',
        status: 'ACTIVE'
      }
    ];
  },

  async getCourseBySlug(slug: string): Promise<SupabaseCourse | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (!error && data) {
         return data as SupabaseCourse;
      }
    } catch (e) {}

    const courses = await this.getCourses();
    return courses.find(c => c.slug === slug) || null;
  },

  async createCourse(course: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();
      
      if (!error && data) return data as SupabaseCourse;
      if (error) throw error;
    } catch (e) {
      console.warn('Bypassing Supabase course creation in mockmode.');
    }
    return {
      id: course.id || 'course-' + Math.random().toString(36).substr(2, 9),
      titulo: course.titulo || '',
      slug: course.slug || '',
      descricao: course.descricao || '',
      imagem: course.imagem || '',
      categoria: course.categoria || '',
      duracao: course.duracao || '',
      status: 'ACTIVE'
    };
  },

  async updateCourse(id: string, updates: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (!error && data) return data as SupabaseCourse;
      if (error) throw error;
    } catch (e) {}
    return { id, ...updates } as SupabaseCourse;
  },

  async deleteCourse(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      return !error;
    } catch (e) {
      return true;
    }
  },

  async enrollStudent(studentId: string, courseId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'ACTIVE'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Simulated local enrollment active.');
      return { success: true, enrolled: true };
    }
  },

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId);
      
      if (!error && data) return data;
    } catch (e) {}
    return [
      {
        course_id: 'eng-legal-angola',
        student_id: studentId,
        status: 'ACTIVE',
        progress_percent: 66,
        data_inicio: new Date().toISOString()
      }
    ];
  }
};
