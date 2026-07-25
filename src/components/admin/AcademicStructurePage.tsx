import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Layers3, Plus, UsersRound } from 'lucide-react';
import { Course, User } from '../../types';
import {
  AcademicTerm,
  AcademicTermStatus,
  CourseSection,
  institutionalService,
  SectionStatus,
} from '../../services/supabase/institutionalService';
import { useToast } from '../ui/Toast';

interface Props {
  courses: Course[];
  users: User[];
}

const today = new Date().toISOString().slice(0, 10);
type TermForm = Omit<AcademicTerm, 'id' | 'enrollment_opens_on' | 'enrollment_closes_on'> & { enrollment_opens_on: string; enrollment_closes_on: string };
type SectionForm = Omit<CourseSection, 'id' | 'course' | 'academic_term' | 'primary_teacher' | 'primary_teacher_id' | 'location' | 'capacity' | 'starts_at' | 'ends_at'> & { primary_teacher_id: string; location: string; capacity: string; starts_at: string; ends_at: string };
const termDefaults = (): TermForm => ({ code: '', name: '', starts_on: today, ends_on: today, enrollment_opens_on: '', enrollment_closes_on: '', status: 'PLANNED' });
const sectionDefaults = (): SectionForm => ({ course_id: '', academic_term_id: '', code: '', name: '', primary_teacher_id: '', modality: 'ONLINE', location: '', capacity: '', starts_at: '', ends_at: '', status: 'DRAFT' });

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export default function AcademicStructurePage({ courses, users }: Props) {
  const toast = useToast();
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [termOpen, setTermOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [termForm, setTermForm] = useState(termDefaults);
  const [sectionForm, setSectionForm] = useState(sectionDefaults);

  const teachers = useMemo(() => users.filter((user) => user.role === 'PROFESSOR' || user.role === 'ADMIN'), [users]);

  const load = async () => {
    setLoading(true);
    try {
      const [nextTerms, nextSections] = await Promise.all([institutionalService.getTerms(), institutionalService.getSections()]);
      setTerms(nextTerms);
      setSections(nextSections);
    } catch (error: any) {
      toast.error(error?.message?.includes('academic_terms') ? 'A estrutura acadêmica ainda não foi aplicada à base de dados.' : 'Não foi possível carregar a estrutura acadêmica.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const saveTerm = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await institutionalService.saveTerm({
        ...termForm,
        enrollment_opens_on: termForm.enrollment_opens_on || null,
        enrollment_closes_on: termForm.enrollment_closes_on || null,
      });
      toast.success('Período acadêmico criado.');
      setTermOpen(false);
      setTermForm(termDefaults());
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível criar o período.');
    } finally { setSaving(false); }
  };

  const saveSection = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await institutionalService.saveSection({
        ...sectionForm,
        primary_teacher_id: sectionForm.primary_teacher_id || null,
        location: sectionForm.location || null,
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
        starts_at: sectionForm.starts_at ? new Date(sectionForm.starts_at).toISOString() : null,
        ends_at: sectionForm.ends_at ? new Date(sectionForm.ends_at).toISOString() : null,
      });
      toast.success('Turma criada como rascunho.');
      setSectionOpen(false);
      setSectionForm(sectionDefaults());
      await load();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível criar a turma.');
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-5 text-left">
    <section className="ledger-panel p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="ledger-eyebrow">Fundação institucional</p>
          <h1 className="mt-2 font-serif text-2xl font-black text-[#1C1917] dark:text-white">Estrutura acadêmica</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#78716C]">Defina períodos e turmas antes de governar matrículas, calendário, avaliações e notas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTermOpen(true)} className="ledger-secondary inline-flex items-center gap-2"><CalendarDays size={15} />Novo período</button>
          <button disabled={!terms.length} onClick={() => setSectionOpen(true)} className="ledger-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} />Nova turma</button>
        </div>
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
      <section className="ledger-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] px-5 py-4 dark:border-[#273244]"><div><p className="font-semibold text-[#1C1917] dark:text-white">Períodos</p><p className="mt-0.5 font-mono text-[10px] text-[#78716C]">{terms.length} registrados</p></div><CalendarDays size={17} className="text-[#A16207]" /></div>
        <div className="divide-y divide-[#E7E5E4] dark:divide-[#273244]">
          {loading && <p className="p-5 text-sm text-[#78716C]">A carregar estrutura…</p>}
          {!loading && !terms.length && <p className="p-5 text-sm leading-relaxed text-[#78716C]">Ainda não há período acadêmico. Crie o primeiro para organizar as turmas.</p>}
          {terms.map((term) => <article key={term.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#A16207]">{term.code}</p><h2 className="mt-1 text-sm font-semibold text-[#1C1917] dark:text-white">{term.name}</h2></div><span className={`rounded-lg px-2 py-1 font-mono text-[9px] font-bold ${term.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F5F0E8] text-[#78716C]'}`}>{term.status}</span></div><p className="mt-3 text-xs text-[#78716C]">{formatDate(term.starts_on)} <span aria-hidden="true">—</span> {formatDate(term.ends_on)}</p></article>)}
        </div>
      </section>

      <section className="ledger-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] px-5 py-4 dark:border-[#273244]"><div><p className="font-semibold text-[#1C1917] dark:text-white">Turmas e seções</p><p className="mt-0.5 font-mono text-[10px] text-[#78716C]">{sections.length} configurada(s)</p></div><Layers3 size={17} className="text-[#A16207]" /></div>
        <div className="divide-y divide-[#E7E5E4] dark:divide-[#273244]">
          {!loading && !sections.length && <div className="p-7 text-center"><UsersRound className="mx-auto text-[#A16207]" size={22}/><p className="mt-3 text-sm text-[#78716C]">Nenhuma turma criada neste momento.</p><p className="mt-1 text-xs text-[#A8A29E]">Uma turma vincula curso, período, docente, calendário e lista de alunos.</p></div>}
          {sections.map((section) => <article key={section.id} className="flex items-center gap-3 p-4 sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#A16207]"><UsersRound size={16}/></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-[#1C1917] dark:text-white">{section.name}</h2><span className="rounded-md bg-[#F5F0E8] px-1.5 py-0.5 font-mono text-[8px] font-bold text-[#78716C]">{section.status}</span></div><p className="mt-1 truncate text-xs text-[#78716C]">{section.course?.title || 'Curso'} <span aria-hidden="true">·</span> {section.academic_term?.code || 'Sem período'} <span aria-hidden="true">·</span> {section.primary_teacher?.nome_completo || 'Docente por definir'}</p></div><ChevronRight size={16} className="shrink-0 text-[#A8A29E]" /></article>)}
        </div>
      </section>
    </div>

    {termOpen && <Modal title="Novo período acadêmico" onClose={() => setTermOpen(false)}><form onSubmit={saveTerm} className="grid gap-4 sm:grid-cols-2"><Field label="Código"><input required value={termForm.code} onChange={e => setTermForm({...termForm, code:e.target.value.toUpperCase()})} className="ledger-input mt-1.5" placeholder="2026-S2" /></Field><Field label="Nome"><input required value={termForm.name} onChange={e => setTermForm({...termForm, name:e.target.value})} className="ledger-input mt-1.5" placeholder="2.º semestre de 2026" /></Field><Field label="Início"><input required type="date" value={termForm.starts_on} onChange={e => setTermForm({...termForm, starts_on:e.target.value})} className="ledger-input mt-1.5" /></Field><Field label="Encerramento"><input required type="date" min={termForm.starts_on} value={termForm.ends_on} onChange={e => setTermForm({...termForm, ends_on:e.target.value})} className="ledger-input mt-1.5" /></Field><Field label="Matrículas abrem"><input type="date" value={termForm.enrollment_opens_on} onChange={e => setTermForm({...termForm, enrollment_opens_on:e.target.value})} className="ledger-input mt-1.5" /></Field><Field label="Matrículas encerram"><input type="date" value={termForm.enrollment_closes_on} onChange={e => setTermForm({...termForm, enrollment_closes_on:e.target.value})} className="ledger-input mt-1.5" /></Field><div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setTermOpen(false)} className="ledger-secondary">Cancelar</button><button disabled={saving} className="ledger-primary">{saving ? 'A guardar…' : 'Criar período'}</button></div></form></Modal>}
    {sectionOpen && <Modal title="Nova turma" onClose={() => setSectionOpen(false)}><form onSubmit={saveSection} className="grid gap-4 sm:grid-cols-2"><Field label="Curso"><select required value={sectionForm.course_id} onChange={e => setSectionForm({...sectionForm, course_id:e.target.value})} className="ledger-input mt-1.5"><option value="">Selecionar curso</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field><Field label="Período"><select required value={sectionForm.academic_term_id} onChange={e => setSectionForm({...sectionForm, academic_term_id:e.target.value})} className="ledger-input mt-1.5"><option value="">Selecionar período</option>{terms.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}</select></Field><Field label="Código"><input required value={sectionForm.code} onChange={e => setSectionForm({...sectionForm, code:e.target.value.toUpperCase()})} className="ledger-input mt-1.5" placeholder="DIR-01" /></Field><Field label="Nome"><input required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name:e.target.value})} className="ledger-input mt-1.5" placeholder="Turma A" /></Field><Field label="Docente principal"><select value={sectionForm.primary_teacher_id} onChange={e => setSectionForm({...sectionForm, primary_teacher_id:e.target.value})} className="ledger-input mt-1.5"><option value="">Definir depois</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</select></Field><Field label="Modalidade"><select value={sectionForm.modality} onChange={e => setSectionForm({...sectionForm, modality:e.target.value as typeof sectionForm.modality})} className="ledger-input mt-1.5"><option value="ONLINE">Online</option><option value="PRESENCIAL">Presencial</option><option value="HIBRIDO">Híbrido</option></select></Field><Field label="Lotação"><input min="1" type="number" value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity:e.target.value})} className="ledger-input mt-1.5" placeholder="Sem limite" /></Field><Field label="Local / sala"><input value={sectionForm.location} onChange={e => setSectionForm({...sectionForm, location:e.target.value})} className="ledger-input mt-1.5" placeholder="Online ou Sala 2" /></Field><div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setSectionOpen(false)} className="ledger-secondary">Cancelar</button><button disabled={saving} className="ledger-primary">{saving ? 'A guardar…' : 'Criar turma'}</button></div></form></Modal>}
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-xs font-semibold text-[#1C1917] dark:text-white">{label}{children}</label>; }
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><button aria-label="Fechar" onClick={onClose} className="absolute inset-0 cursor-default bg-[#0B1629]/55 backdrop-blur-sm"/><section role="dialog" aria-modal="true" aria-label={title} className="relative z-10 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#101827] sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-xl font-black text-[#1C1917] dark:text-white">{title}</h2><button onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#78716C] hover:bg-[#F5F0E8]">Fechar</button></div>{children}</section></div>; }
