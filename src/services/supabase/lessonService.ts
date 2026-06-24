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
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('ordem', { ascending: true });
      
      if (!error && data && data.length > 0) {
        return data as SupabaseLesson[];
      }
    } catch (e) {}

    // Mock fallback values
    return [
      {
        id: 'lesson-1',
        course_id: courseId,
        titulo: 'Introdução ao Sistema Jurídico Angolano e o Common Law',
        descricao: 'Visão geral comparativa entre o sistema civil de herança portuguesa e o modelo anglo-saxônico em inglês.',
        video_url: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05c243dca573a0aef802e86481005cf&profile_id=165',
        ordem: 1,
        duracao: '15:20'
      },
      {
        id: 'lesson-2',
        course_id: courseId,
        titulo: 'Vocabulary of Courtroom Personnel & Litigation',
        descricao: 'Atores processuais no tribunal - Judges, Barristers, Solicitors, Prosecutors, Witness e Claimant.',
        video_url: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05c243dca573a0aef802e86481005cf&profile_id=165',
        ordem: 2,
        duracao: '22:45'
      }
    ];
  },

  async createLesson(lesson: Partial<SupabaseLesson>): Promise<SupabaseLesson> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();
      
      if (!error && data) return data as SupabaseLesson;
      if (error) throw error;
    } catch (e) {}
    return {
      id: lesson.id || 'lesson-' + Math.random().toString(36).substr(2, 9),
      course_id: lesson.course_id || '',
      titulo: lesson.titulo || '',
      descricao: lesson.descricao || '',
      video_url: lesson.video_url || '',
      ordem: lesson.ordem || 1,
      duracao: lesson.duracao || '10:00'
    };
  },

  async getMaterials(lessonId: string): Promise<SupabaseMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (!error && data) return data as SupabaseMaterial[];
    } catch (e) {}
    return [
      {
        id: 'mat-1',
        lesson_id: lessonId,
        titulo: 'Glossário Técnico de Inglês Jurídico - Multiplus Academy.pdf',
        arquivo_url: '#',
        tipo: 'PDF'
      }
    ];
  },

  async addMaterial(material: Partial<SupabaseMaterial>): Promise<SupabaseMaterial> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single();
      
      if (!error && data) return data as SupabaseMaterial;
      if (error) throw error;
    } catch (e) {}
    return {
      id: material.id || 'mat-' + Math.random().toString(36).substr(2, 9),
      lesson_id: material.lesson_id || '',
      titulo: material.titulo || '',
      arquivo_url: material.arquivo_url || '#',
      tipo: material.tipo || 'PDF'
    };
  }
};
