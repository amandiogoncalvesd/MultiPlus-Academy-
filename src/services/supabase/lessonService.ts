import { supabase } from '../../lib/supabase/client';

export interface SupabaseLesson {
  id: string;
  course_id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  ordem: number;
  duracao: string;
}

export interface SupabaseMaterial {
  id: string;
  lesson_id: string;
  titulo: string;
  arquivo_url: string;
  tipo: string;
}

export const lessonService = {
  async getLessons(courseId: string): Promise<SupabaseLesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });
    
    if (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      throw error;
    }
    return (data || []) as SupabaseLesson[];
  },

  async createLesson(lesson: Partial<SupabaseLesson>): Promise<SupabaseLesson> {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lesson in Supabase:', error);
      throw error;
    }
    return data as SupabaseLesson;
  },

  async getMaterials(lessonId: string): Promise<SupabaseMaterial[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('lesson_id', lessonId);
    
    if (error) {
      console.error(`Error fetching materials for lesson ${lessonId}:`, error);
      throw error;
    }
    return (data || []) as SupabaseMaterial[];
  },

  async addMaterial(material: Partial<SupabaseMaterial>): Promise<SupabaseMaterial> {
    const { data, error } = await supabase
      .from('materials')
      .insert(material)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding material in Supabase:', error);
      throw error;
    }
    return data as SupabaseMaterial;
  }
};
