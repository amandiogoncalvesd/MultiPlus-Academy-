import { supabase } from '../../lib/supabase/client';

const fail = (error: Error | null) => { if (error) throw error; };

export type GradeStatus = 'PENDING' | 'GRADED' | 'EXCUSED' | 'PUBLISHED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';

export interface LearningSection { id: string; course_id: string; code: string; name: string; course?: { title: string } | null; }
export interface SectionStudent { id: string; student_id: string; student?: { nome_completo: string; email: string } | null; }
export interface Assessment { id: string; section_id: string; title: string; points_possible: number; due_at: string | null; status: string; }
export interface GradeEntry { id: string; assessment_id: string; student_id: string; score: number | null; feedback: string | null; status: GradeStatus; student?: { nome_completo: string; email: string } | null; }
export interface AttendanceSession { id: string; section_id: string; title: string; occurred_at: string; }
export interface AttendanceRecord { attendance_session_id: string; student_id: string; status: AttendanceStatus; note: string | null; }
export interface SectionSyllabus { section_id: string; overview: string | null; learning_methodology: string | null; assessment_policy: string | null; attendance_policy: string | null; late_work_policy: string | null; accessibility_statement: string | null; published_at: string | null; }
export interface LearningOutcome { id: string; course_id: string; code: string; title: string; description: string | null; }
export interface DiscussionForum { id: string; section_id: string; title: string; description: string | null; is_locked: boolean; }
export interface DiscussionThread { id: string; forum_id: string; author_id: string; title: string; body: string; created_at: string; author?: { nome_completo: string } | null; }
export interface DiscussionPost { id: string; thread_id: string; author_id: string; body: string; created_at: string; author?: { nome_completo: string } | null; }
export interface RubricCriterion { id: string; rubric_id: string; description: string; points_possible: number; sort_order: number; levels: Array<{ label: string; points: number; description?: string }>; }
export interface DiscussionAttachment { id: string; thread_id: string | null; post_id: string | null; file_name: string; file_size: number; mime_type: string | null; }

export const learningService = {
  async getSections(): Promise<LearningSection[]> {
    const { data, error } = await supabase.from('course_sections').select('id, course_id, code, name, course:courses(title)').order('name');
    fail(error); return (data || []) as unknown as LearningSection[];
  },
  async getStudents(sectionId: string): Promise<SectionStudent[]> {
    const { data, error } = await supabase.from('section_enrollments').select('id, student_id, student:users!section_enrollments_student_id_fkey(nome_completo,email)').eq('section_id', sectionId).eq('status', 'ACTIVE');
    fail(error); return (data || []) as unknown as SectionStudent[];
  },
  async getAssessments(sectionId: string): Promise<Assessment[]> {
    const { data, error } = await supabase.from('assessments').select('id,section_id,title,points_possible,due_at,status').eq('section_id', sectionId).order('created_at', { ascending: false });
    fail(error); return data || [];
  },
  async createAssessment(input: Pick<Assessment, 'section_id' | 'title' | 'points_possible'> & { due_at?: string | null }): Promise<Assessment> {
    const { data, error } = await supabase.from('assessments').insert({ ...input, status: 'PUBLISHED', published_at: new Date().toISOString() }).select().single();
    fail(error); return data;
  },
  async getGrades(assessmentId: string): Promise<GradeEntry[]> {
    const { data, error } = await supabase.from('grade_entries').select('id,assessment_id,student_id,score,feedback,status,student:users!grade_entries_student_id_fkey(nome_completo,email)').eq('assessment_id', assessmentId);
    fail(error); return (data || []) as unknown as GradeEntry[];
  },
  async saveGrade(input: Pick<GradeEntry, 'assessment_id' | 'student_id' | 'score' | 'feedback' | 'status'>): Promise<void> {
    const { error } = await supabase.from('grade_entries').upsert({ ...input, graded_at: new Date().toISOString(), published_at: input.status === 'PUBLISHED' ? new Date().toISOString() : null }, { onConflict: 'assessment_id,student_id' });
    fail(error);
  },
  async getAttendanceSessions(sectionId: string): Promise<AttendanceSession[]> {
    const { data, error } = await supabase.from('attendance_sessions').select('id,section_id,title,occurred_at').eq('section_id', sectionId).order('occurred_at', { ascending: false });
    fail(error); return data || [];
  },
  async createAttendanceSession(sectionId: string, title: string): Promise<AttendanceSession> {
    const { data, error } = await supabase.from('attendance_sessions').insert({ section_id: sectionId, title, occurred_at: new Date().toISOString() }).select().single();
    fail(error); return data;
  },
  async getAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance_records').select('attendance_session_id,student_id,status,note').eq('attendance_session_id', sessionId);
    fail(error); return data || [];
  },
  async saveAttendance(input: AttendanceRecord): Promise<void> {
    const { error } = await supabase.from('attendance_records').upsert(input, { onConflict: 'attendance_session_id,student_id' });
    fail(error);
  },
  async getSyllabus(sectionId: string): Promise<SectionSyllabus | null> {
    const { data, error } = await supabase.from('section_syllabi').select('*').eq('section_id', sectionId).maybeSingle(); fail(error); return data;
  },
  async saveSyllabus(input: SectionSyllabus): Promise<void> { const { error } = await supabase.from('section_syllabi').upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: 'section_id' }); fail(error); },
  async getOutcomes(courseId: string): Promise<LearningOutcome[]> { const { data, error } = await supabase.from('learning_outcomes').select('id,course_id,code,title,description').eq('course_id', courseId).eq('status', 'ACTIVE').order('code'); fail(error); return data || []; },
  async createOutcome(input: Omit<LearningOutcome, 'id'>): Promise<void> { const { error } = await supabase.from('learning_outcomes').insert(input); fail(error); },
  async getForums(sectionId: string): Promise<DiscussionForum[]> { const { data, error } = await supabase.from('discussion_forums').select('id,section_id,title,description,is_locked').eq('section_id', sectionId).order('created_at'); fail(error); return data || []; },
  async createForum(sectionId: string, title: string, description: string): Promise<void> { const { error } = await supabase.from('discussion_forums').insert({ section_id: sectionId, title, description }); fail(error); },
  async getThreads(forumId: string): Promise<DiscussionThread[]> { const { data, error } = await supabase.from('discussion_threads').select('id,forum_id,author_id,title,body,created_at,author:users!discussion_threads_author_id_fkey(nome_completo)').eq('forum_id', forumId).order('created_at', { ascending: false }); fail(error); return (data || []) as unknown as DiscussionThread[]; },
  async createThread(forumId: string, authorId: string, title: string, body: string): Promise<void> { const { error } = await supabase.from('discussion_threads').insert({ forum_id: forumId, author_id: authorId, title, body }); fail(error); },
  async getPosts(threadId: string): Promise<DiscussionPost[]> { const { data, error } = await supabase.from('discussion_posts').select('id,thread_id,author_id,body,created_at,author:users!discussion_posts_author_id_fkey(nome_completo)').eq('thread_id', threadId).order('created_at'); fail(error); return (data || []) as unknown as DiscussionPost[]; },
  async createPost(threadId: string, authorId: string, body: string): Promise<void> { const { error } = await supabase.from('discussion_posts').insert({ thread_id: threadId, author_id: authorId, body }); fail(error); },
  async getRubrics(sectionId: string): Promise<Array<{ id: string; name: string; description: string | null }>> { const { data, error } = await supabase.from('rubrics').select('id,name,description').eq('section_id', sectionId).order('created_at'); fail(error); return data || []; },
  async getRubricCriteria(rubricId: string): Promise<RubricCriterion[]> { const { data, error } = await supabase.from('rubric_criteria').select('id,rubric_id,description,points_possible,sort_order,levels').eq('rubric_id', rubricId).order('sort_order'); fail(error); return (data || []) as unknown as RubricCriterion[]; },
  async createRubric(sectionId: string, name: string, description: string): Promise<{ id: string }> { const { data, error } = await supabase.from('rubrics').insert({ section_id: sectionId, name, description }).select('id').single(); fail(error); return data!; },
  async createRubricCriterion(input: Omit<RubricCriterion, 'id'>): Promise<void> { const { error } = await supabase.from('rubric_criteria').insert(input); fail(error); },
  async linkRubricToAssessment(assessmentId: string, rubricId: string): Promise<void> { const { error } = await supabase.from('assessment_rubrics').upsert({ assessment_id: assessmentId, rubric_id: rubricId }); fail(error); },
  async getAssessmentRubric(assessmentId: string): Promise<{ id: string; name: string; criteria: RubricCriterion[] } | null> { const { data, error } = await supabase.from('assessment_rubrics').select('rubric:rubrics(id,name)').eq('assessment_id', assessmentId).maybeSingle(); fail(error); const rubric = (data as any)?.rubric; if (!rubric) return null; return { ...rubric, criteria: await this.getRubricCriteria(rubric.id) }; },
  async saveRubricGrade(assessmentId: string, studentId: string, scores: Record<string, number>, feedback: string, status: GradeStatus): Promise<void> { const rubric_scores = Object.fromEntries(Object.entries(scores).map(([criterionId, score]) => [criterionId, { score }])); const { error } = await supabase.from('grade_entries').upsert({ assessment_id: assessmentId, student_id: studentId, rubric_scores, feedback, status, graded_at: new Date().toISOString(), published_at: status === 'PUBLISHED' ? new Date().toISOString() : null }, { onConflict: 'assessment_id,student_id' }); fail(error); },
  async getDiscussionAttachments(threadId: string): Promise<DiscussionAttachment[]> { const { data, error } = await supabase.from('discussion_attachments').select('id,thread_id,post_id,file_name,file_size,mime_type').eq('thread_id', threadId); fail(error); return data || []; },
  async uploadDiscussionAttachment(threadId: string, file: File): Promise<void> { const form = new FormData(); form.append('threadId', threadId); form.append('file', file); const { data, error } = await supabase.functions.invoke('student-files?action=upload-discussion-attachment', { body: form }); if (error || data?.error) throw new Error(error?.message || data?.error || 'Não foi possível enviar o anexo.'); },
  async getDiscussionAttachmentUrl(attachmentId: string): Promise<string> { const { data, error } = await supabase.functions.invoke('student-files?action=download-discussion-attachment', { body: { attachmentId } }); if (error || data?.error || !data?.url) throw new Error(error?.message || data?.error || 'Não foi possível abrir o anexo.'); return data.url; },
};
