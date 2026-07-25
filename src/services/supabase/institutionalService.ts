import { supabase } from '../../lib/supabase/client';

export type AcademicTermStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type SectionStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type SectionEnrollmentStatus = 'PENDING' | 'ACTIVE' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';

export interface SectionEnrollment {
  id: string;
  section_id: string;
  student_id: string;
  status: SectionEnrollmentStatus;
  enrolled_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  student?: { nome_completo: string; email: string } | null;
}

export interface InstitutionalCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: 'ACADEMIC' | 'HOLIDAY' | 'ENROLLMENT' | 'ASSESSMENT' | 'MEETING';
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  visibility: 'INSTITUTION' | 'TERM' | 'SECTION';
  section?: { name: string; code: string } | null;
  academic_term?: { name: string; code: string } | null;
}

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

  async getSectionEnrollments(sectionId: string): Promise<SectionEnrollment[]> {
    const { data, error } = await supabase.from('section_enrollments').select(`
      id, section_id, student_id, status, enrolled_at, cancelled_at, cancellation_reason,
      student:users!section_enrollments_student_id_fkey(nome_completo, email)
    `).eq('section_id', sectionId).order('enrolled_at', { ascending: false });
    throwIfError(error);
    return (data || []) as unknown as SectionEnrollment[];
  },

  async enrollInSection(input: { section_id: string; student_id: string; status: SectionEnrollmentStatus }): Promise<SectionEnrollment> {
    const { data, error } = await supabase.from('section_enrollments').upsert(input, { onConflict: 'section_id,student_id' }).select().single();
    throwIfError(error);
    return data as SectionEnrollment;
  },

  async updateSectionEnrollment(id: string, updates: Partial<Pick<SectionEnrollment, 'status' | 'cancelled_at' | 'cancellation_reason'>>): Promise<void> {
    const { error } = await supabase.from('section_enrollments').update(updates).eq('id', id);
    throwIfError(error);
  },

  async transferSectionEnrollment(record: SectionEnrollment, targetSectionId: string): Promise<void> {
    const { error: createError } = await supabase.from('section_enrollments').upsert({ section_id: targetSectionId, student_id: record.student_id, status: 'ACTIVE' }, { onConflict: 'section_id,student_id' });
    throwIfError(createError);
    await this.updateSectionEnrollment(record.id, { status: 'CANCELLED', cancelled_at: new Date().toISOString(), cancellation_reason: 'TRANSFERRED' });
  },

  async getCalendarEvents(): Promise<InstitutionalCalendarEvent[]> {
    const { data, error } = await supabase.from('academic_calendar_events').select(`
      id, title, description, event_type, starts_at, ends_at, all_day, visibility,
      section:course_sections(name, code), academic_term:academic_terms(name, code)
    `).order('starts_at', { ascending: true });
    throwIfError(error);
    return (data || []) as unknown as InstitutionalCalendarEvent[];
  },
};
