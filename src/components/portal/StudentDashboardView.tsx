import { Award, BookOpen, CalendarClock, CheckCircle2, Clock3, Flame, PlayCircle, TrendingUp } from 'lucide-react';

interface StudentDashboardViewProps {
  enrollments: any[];
  currentTime: Date;
  profileForm: { firstName: string; [key: string]: any };
  nextScheduledLesson: any;
  streakCount: number;
  completedLessons: string[];
  realLessons: any[];
  certificates: any[];
  currentLecture: any;
  selectedCourseTitle?: string;
  totalHoursLearned?: number;
  setActiveTab: (tab: any) => void;
  cardThemeClass: string;
  isHighContrast: boolean;
}

export default function StudentDashboardView({ enrollments, currentTime, profileForm, nextScheduledLesson, streakCount, completedLessons, realLessons, certificates, currentLecture, selectedCourseTitle, totalHoursLearned = 0, setActiveTab, cardThemeClass, isHighContrast }: StudentDashboardViewProps) {
  if (!enrollments.length) return <div className="mx-auto mt-6 max-w-lg space-y-5 rounded-3xl border border-gray-150 bg-cream-100 p-8 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-12"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-600/10 text-gold-600"><BookOpen size={28} /></span><div><h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Ainda não possui cursos ativos</h2><p className="mt-2 text-sm leading-relaxed text-neutral-400">Quando a administração ou o professor concluir a sua matrícula, os cursos e as aulas aparecerão aqui.</p></div></div>;

  const total = realLessons.length;
  const completed = completedLessons.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const lessonTime = nextScheduledLesson?.access_starts_at || nextScheduledLesson?.scheduled_at;

  const metrics = [
    { label: 'Progresso do curso', value: `${progress}%`, note: `${completed} de ${total} aulas concluídas`, icon: <TrendingUp size={18} className="text-emerald-600" /> },
    { label: 'Tempo estudado', value: `${totalHoursLearned} h`, note: 'Calculado pelo tempo de vídeo guardado', icon: <Clock3 size={18} className="text-blue-600" /> },
    { label: 'Sequência de estudo', value: `${streakCount} dias`, note: 'Dias consecutivos de atividade', icon: <Flame size={18} className="text-orange-600" /> },
    { label: 'Certificados', value: `${certificates.length}`, note: 'Credenciais disponíveis para download', icon: <Award size={18} className="text-gold-600" /> },
  ];

  return <div className="space-y-6 text-left">
    <section className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${isHighContrast ? 'border-4 border-yellow-500 bg-black text-cream-100' : 'border border-gold-600/20 bg-ink-900 text-cream-100 shadow-sm'}`}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-600/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-gold-600">Meu espaço de aprendizagem</p><h1 className="mt-2 font-serif text-2xl font-black sm:text-3xl">Olá, {profileForm.firstName || 'estudante'}.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-cream-100/70">{selectedCourseTitle ? `Você está acompanhando ${selectedCourseTitle}.` : 'Acompanhe os seus cursos, aulas e progresso.'} O horário atual é {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}.</p></div>
        <button onClick={() => setActiveTab('courses')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold-600 px-4 text-xs font-mono font-bold uppercase text-ink-900 transition hover:bg-cream-100"><PlayCircle size={16} />Abrir minhas aulas</button></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className={`min-h-36 rounded-2xl p-5 ${cardThemeClass}`}><div className="flex items-start justify-between"><div><p className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">{metric.label}</p><p className="mt-2 font-serif text-2xl font-black text-ink-900 dark:text-cream-100">{metric.value}</p></div><span className="rounded-xl border border-gray-150 bg-cream-200 p-2.5 dark:border-ink-800 dark:bg-ink-950">{metric.icon}</span></div><p className="mt-3 text-[10px] text-neutral-400">{metric.note}</p></article>)}</section>

    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className={`rounded-3xl p-6 ${cardThemeClass}`}><div className="flex items-center justify-between border-b border-gray-150 pb-4 dark:border-ink-800"><div><p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gold-600">Retomar aprendizagem</p><h2 className="mt-1 font-serif text-lg font-black text-ink-900 dark:text-cream-100">{currentLecture?.title || 'Nenhuma aula disponível agora'}</h2></div>{currentLecture && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-mono font-bold text-emerald-700">DISPONÍVEL</span>}</div><p className="mt-5 text-sm leading-relaxed text-neutral-400">{currentLecture?.description || 'Aulas futuras ficam no calendário até a janela de acesso começar. Aulas encerradas ficam guardadas no histórico.'}</p><button onClick={() => setActiveTab('courses')} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 text-xs font-mono font-bold uppercase text-white hover:bg-gold-600 hover:text-ink-900 dark:bg-gold-600 dark:text-ink-900"><PlayCircle size={15} />{currentLecture ? 'Continuar aula' : 'Ver calendário de aulas'}</button></article>
      <article className={`rounded-3xl p-6 ${cardThemeClass}`}><p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gold-600">Próximo compromisso</p>{nextScheduledLesson ? <div className="mt-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-600/15 text-gold-600"><CalendarClock size={20} /></span><h2 className="mt-4 font-serif text-lg font-black text-ink-900 dark:text-cream-100">{nextScheduledLesson.titulo || nextScheduledLesson.title}</h2><p className="mt-2 text-sm text-neutral-400">{lessonTime ? new Date(lessonTime).toLocaleString('pt-AO', { dateStyle: 'full', timeStyle: 'short' }) : 'Horário a confirmar'}</p><button onClick={() => setActiveTab('calendar')} className="mt-5 text-xs font-mono font-bold uppercase text-gold-600 hover:underline">Abrir calendário</button></div> : <div className="mt-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-200 text-neutral-400 dark:bg-ink-950"><CalendarClock size={20} /></span><p className="mt-4 text-sm leading-relaxed text-neutral-400">Não existem aulas futuras agendadas neste momento.</p><button onClick={() => setActiveTab('calendar')} className="mt-5 text-xs font-mono font-bold uppercase text-gold-600 hover:underline">Ver histórico letivo</button></div>}</article>
    </section>
  </div>;
}
