import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Loader2, UserPlus, Users } from 'lucide-react';
import { User } from '../../types';
import { CourseSection, institutionalService, SectionEnrollment, SectionEnrollmentStatus } from '../../services/supabase/institutionalService';
import { useToast } from '../ui/Toast';

interface Props { sections: CourseSection[]; users: User[]; }

const statusCopy: Record<SectionEnrollmentStatus, string> = { PENDING: 'Pendente', ACTIVE: 'Ativa', WAITLISTED: 'Lista de espera', CANCELLED: 'Cancelada', COMPLETED: 'Concluída' };

export default function SectionEnrollmentPanel({ sections, users }: Props) {
  const toast = useToast();
  const students = useMemo(() => users.filter((person) => person.role === 'ALUNO'), [users]);
  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<SectionEnrollmentStatus>('ACTIVE');
  const [records, setRecords] = useState<SectionEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!sectionId && sections[0]) setSectionId(sections[0].id); }, [sections, sectionId]);
  const load = async () => {
    if (!sectionId) { setRecords([]); return; }
    setLoading(true);
    try { setRecords(await institutionalService.getSectionEnrollments(sectionId)); }
    catch (error: any) { toast.error(error?.message || 'Não foi possível carregar as matrículas da turma.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [sectionId]);

  const enroll = async (event: FormEvent) => {
    event.preventDefault();
    if (!sectionId || !studentId) return;
    setSaving(true);
    try {
      await institutionalService.enrollInSection({ section_id: sectionId, student_id: studentId, status });
      toast.success(status === 'WAITLISTED' ? 'Aluno incluído na lista de espera.' : 'Matrícula da turma registada.');
      setStudentId('');
      await load();
    } catch (error: any) { toast.error(error?.message || 'Não foi possível guardar a matrícula.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (record: SectionEnrollment, next: SectionEnrollmentStatus) => {
    try {
      await institutionalService.updateSectionEnrollment(record.id, { status: next, cancelled_at: next === 'CANCELLED' ? new Date().toISOString() : null });
      toast.success(`Matrícula marcada como ${statusCopy[next].toLowerCase()}.`);
      await load();
    } catch (error: any) { toast.error(error?.message || 'Não foi possível atualizar a matrícula.'); }
  };

  const transfer = async (record: SectionEnrollment, targetSectionId: string) => {
    if (!targetSectionId || targetSectionId === record.section_id) return;
    try {
      await institutionalService.transferSectionEnrollment(record, targetSectionId);
      toast.success('Aluno transferido entre turmas com histórico preservado.');
      await load();
    } catch (error: any) { toast.error(error?.message || 'Não foi possível transferir o aluno.'); }
  };

  if (!sections.length) return null;
  return <section className="ledger-panel overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-[#E7E5E4] p-5 dark:border-[#273244] sm:flex-row sm:items-end sm:justify-between">
      <div><p className="ledger-eyebrow">Vínculos acadêmicos</p><h2 className="mt-2 font-serif text-xl font-black text-[#1C1917] dark:text-white">Matrículas por turma</h2><p className="mt-1 text-xs text-[#78716C]">Controle vagas, lista de espera, cancelamentos e transferências sem autoinscrição.</p></div>
      <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="ledger-input w-full sm:w-72"><option value="">Selecionar turma</option>{sections.map(section => <option key={section.id} value={section.id}>{section.code} — {section.name}</option>)}</select>
    </div>
    <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.4fr]">
      <form onSubmit={enroll} className="rounded-xl bg-[#F7F6F2] p-4 dark:bg-[#0B111C]"><p className="text-xs font-semibold text-[#1C1917] dark:text-white">Adicionar aluno</p><label className="mt-3 block text-[11px] font-medium text-[#78716C]">Aluno<select required value={studentId} onChange={e => setStudentId(e.target.value)} className="ledger-input mt-1.5"><option value="">Selecionar aluno</option>{students.map(student => <option key={student.id} value={student.id}>{student.firstName} {student.lastName} — {student.email}</option>)}</select></label><label className="mt-3 block text-[11px] font-medium text-[#78716C]">Estado inicial<select value={status} onChange={e => setStatus(e.target.value as SectionEnrollmentStatus)} className="ledger-input mt-1.5">{Object.entries(statusCopy).slice(0, 3).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button disabled={saving || !sectionId} className="ledger-primary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"><UserPlus size={15}/>{saving ? 'A guardar…' : 'Registar vínculo'}</button></form>
      <div className="min-w-0"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-[#1C1917] dark:text-white">Lista da turma</p><span className="font-mono text-[10px] text-[#78716C]">{records.length} vínculo(s)</span></div>{loading ? <div className="flex items-center gap-2 py-8 text-xs text-[#78716C]"><Loader2 size={15} className="animate-spin"/>A carregar…</div> : !records.length ? <div className="rounded-xl border border-dashed border-[#D6D3D1] p-6 text-center text-xs text-[#78716C]">Nenhum aluno vinculado a esta turma.</div> : <div className="space-y-2">{records.map(record => <article key={record.id} className="flex flex-col gap-3 rounded-xl border border-[#E7E5E4] p-3 dark:border-[#273244] sm:flex-row sm:items-center"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-[11px] font-bold text-[#A16207]">{record.student?.nome_completo?.[0] || 'A'}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#1C1917] dark:text-white">{record.student?.nome_completo || 'Aluno'}</p><p className="truncate text-[11px] text-[#78716C]">{record.student?.email || 'Sem e-mail'}</p></div><select value={record.status} onChange={e => changeStatus(record, e.target.value as SectionEnrollmentStatus)} className="rounded-lg border border-[#D6D3D1] bg-white px-2 py-1.5 text-[10px] dark:bg-[#101827]">{Object.entries(statusCopy).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label={`Transferir ${record.student?.nome_completo || 'aluno'}`} defaultValue="" onChange={e => { void transfer(record, e.target.value); e.currentTarget.value = ''; }} className="rounded-lg border border-[#D6D3D1] bg-white px-2 py-1.5 text-[10px] dark:bg-[#101827]"><option value="">Transferir…</option>{sections.filter(section => section.id !== record.section_id).map(section => <option key={section.id} value={section.id}>{section.code}</option>)}</select><ArrowRightLeft size={14} className="hidden text-[#A8A29E] xl:block"/></article>)}</div>}</div>
    </div>
  </section>;
}
