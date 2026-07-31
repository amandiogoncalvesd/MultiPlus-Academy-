import { ReactNode, useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle2, Clock3, Loader2, TrendingUp } from 'lucide-react';
import { User } from '../../types';
import { academicService } from '../../services/supabase/academicService';

interface StudentProgressTabProps { currentUser: User | null; }

const courseProgress = (row: any) => Math.max(0, Math.min(100, Number(row.progress_percent || 0)));

export default function StudentProgressTab({ currentUser }: StudentProgressTabProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return; }
    academicService.getStudentProgressMetrics(currentUser.id).then(setMetrics).catch((error) => console.error('Progress metrics:', error)).finally(() => setLoading(false));
  }, [currentUser?.id]);

  const totals = metrics.reduce((acc, row) => ({ total: acc.total + Number(row.total_lessons || 0), complete: acc.complete + Number(row.completed_lessons || 0) }), { total: 0, complete: 0 });
  const progress = totals.total ? Math.round((totals.complete / totals.total) * 100) : 0;

  if (loading) return <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-150 bg-white dark:border-ink-800 dark:bg-ink-900"><Loader2 className="animate-spin text-gold-600" /><p className="text-xs text-neutral-400">A carregar progresso real…</p></div>;

  return <div className="space-y-5 text-left">
    <section className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-6">
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Desempenho acadêmico</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Meu progresso</h1><p className="mt-1 text-xs text-neutral-400">Acompanhe sua evolução por curso, aulas concluídas e quizzes.</p></div><span className="rounded-lg bg-gold-600/10 px-2.5 py-1 font-mono text-[10px] font-bold text-gold-700 dark:text-gold-400">ATUALIZADO COM DADOS REAIS</span></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded-2xl bg-ink-900 p-5 text-cream-100"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] font-bold uppercase tracking-widest text-gold-400">Conclusão global</p><p className="mt-2 font-serif text-3xl font-black">{progress}%</p><p className="mt-1 text-xs text-cream-100/60">{totals.complete} de {totals.total} aulas concluídas</p></div><div className="relative flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `conic-gradient(#C89B3C ${progress * 3.6}deg, rgba(255,255,255,.14) 0deg)` }} role="progressbar" aria-label="Progresso global" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 font-mono text-xs font-bold text-gold-400">{progress}%</span></div></div></article>
      <div className="grid gap-3 sm:grid-cols-3"><Metric icon={<CheckCircle2 size={17}/>} label="Aulas" value={`${totals.complete}/${totals.total}`} accent="text-gold-600"/><Metric icon={<Clock3 size={17}/>} label="Tempo" value={`${currentUser?.totalHoursLearned || 0} h`} accent="text-blue-600"/><Metric icon={<Award size={17}/>} label="Cursos" value={`${metrics.length}`} accent="text-emerald-600"/></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-gray-150 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900"><div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-ink-800"><div><p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-600">Visão por curso</p><h2 className="mt-1 font-serif text-lg font-black text-ink-900 dark:text-cream-100">Evolução de aprendizagem</h2></div><TrendingUp size={18} className="text-gold-600"/></div><ul className="divide-y divide-gray-100 dark:divide-ink-800">{metrics.map((row) => { const value=courseProgress(row); return <li key={row.course_id} className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="truncate text-sm font-semibold text-ink-900 dark:text-cream-100">{row.course_title || 'Curso'}</h3><span className="rounded-lg bg-gold-600/10 px-2 py-1 font-mono text-[10px] font-bold text-gold-700 dark:text-gold-400">{value}%</span></div><p className="mt-1 text-xs text-neutral-400">{row.completed_lessons || 0} de {row.total_lessons || 0} aulas concluídas</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-ink-800" role="progressbar" aria-label={`Progresso no curso ${row.course_title || ''}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-[#E2B755] transition-[width] duration-300" style={{ width: `${value}%` }}/></div></div><div className="shrink-0 rounded-xl bg-[#F7F6F2] px-3 py-2 text-xs dark:bg-ink-950"><span className="font-mono text-[9px] uppercase text-neutral-400">Quiz médio</span><p className="mt-1 font-semibold text-ink-900 dark:text-cream-100">{row.avg_quiz_score ? `${Math.round(row.avg_quiz_score)}%` : 'Sem notas'}</p></div></div></li>; })}{metrics.length === 0 && <li className="p-10 text-center text-sm text-neutral-400"><BookOpen className="mx-auto text-gold-600" /><p className="mt-3">O progresso aparecerá quando houver cursos e aulas registradas.</p></li>}</ul></section>
  </div>;
}

function Metric({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) { return <article className="rounded-2xl border border-gray-150 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"><span className={accent}>{icon}</span><p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-400">{label}</p><p className="mt-1 font-serif text-xl font-black text-ink-900 dark:text-cream-100">{value}</p></article>; }
