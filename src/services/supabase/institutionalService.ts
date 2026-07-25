import { supabase } from '../../lib/supabase/client';

export type AcademicTermStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type SectionStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface AcademicTerm {
  id: string;
  code: string;
  name: string;
  starts_on: string;
  ends_on: string;
  enrollment_opens_on: string | null;
  enrollment_closes_on: string | null;
  status: AcademicTermStatus;
}

export interface CourseSection {
  id: string;
  course_id: string;
  academic_term_id: string;
  code: string;
  name: string;
  primary_teacher_id: string | null;
  modality: 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';
  location: string | null;
  capacity: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: SectionStatus;
  course?: { title: string } | null;
  academic_term?: { name: string; code: string } | null;
  primary_teacher?: { nome_completo: string } | null;
}

const throwIfError = (error: Error | null) => {
  if (error) throw error;
};

export const institutionalService = {
  async getTerms(): Promise<AcademicTerm[]> {
    const { data, error } = await supabase
      .from('academic_terms')
      .select('id, code, name, starts_on, ends_on, enrollment_opens_on, enrollment_closes_on, status')
      .order('starts_on', { ascending: false });
    throwIfError(error);
    return data || [];
  },

  async saveTerm(term: Omit<AcademicTerm, 'id'> & { id?: string }): Promise<AcademicTerm> {
    const payload = { ...term };
    const query = term.id
      ? supabase.from('academic_terms').update(payload).eq('id', term.id)
      : supabase.from('academic_terms').insert(payload);
    const { data, error } = await query.select().single();
    throwIfError(error);
    return data;
  },

  async getSections(): Promise<CourseSection[]> {
    const { data, error } = await supabase
      .from('course_sections')
      .select(`
        id, course_id, academic_term_id, code, name, primary_teacher_id, modality, location,
        capacity, starts_at, ends_at, status,
        course:courses(title),
        academic_term:academic_terms(name, code),
        primary_teacher:users!course_sections_primary_teacher_id_fkey(nome_completo)
      `)
      .order('starts_at', { ascending: false, nullsFirst: false });
    throwIfError(error);
    return (data || []) as unknown as CourseSection[];
  },

  async saveSection(section: Omit<CourseSection, 'id' | 'course' | 'academic_term' | 'primary_teacher'> & { id?: string }): Promise<CourseSection> {
    const payload = { ...section };
    const query = section.id
      ? supabase.from('course_sections').update(payload).eq('id', section.id)
      : supabase.from('course_sections').insert(payload);
    const { data, error } = await query.select().single();
    throwIfError(error);
    return data as CourseSection;
  },
};
