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

export default function StudentDashboardView({
  enrollments, currentTime, profileForm, nextScheduledLesson, streakCount,
  completedLessons, realLessons, certificates, currentLecture,
  selectedCourseTitle, totalHoursLearned = 0, setActiveTab, cardThemeClass, isHighContrast
}: StudentDashboardViewProps) {
  if (!enrollments.length) {
    return (
      <div className="mx-auto mt-8 max-w-md ledger-panel p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <BookOpen size={24} />
        </span>
        <div className="mt-5">
          <h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Ainda não possui cursos ativos</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">
            Quando a administração ou o professor concluir a sua matrícula, os cursos e as aulas aparecerão aqui.
          </p>
        </div>
      </div>
    );
  }

  const total = realLessons.length;
  const completed = completedLessons.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const lessonTime = nextScheduledLesson?.access_starts_at || nextScheduledLesson?.scheduled_at;

  const metrics = [
    { label: 'Progresso', value: `${progress}%`, note: `${completed} de ${total} aulas`, icon: <TrendingUp size={17} className="text-emerald-600" />, accent: 'bg-emerald-50 border-emerald-100' },
    { label: 'Tempo', value: `${totalHoursLearned}h`, note: 'Horas de vídeo guardadas', icon: <Clock3 size={17} className="text-blue-600" />, accent: 'bg-blue-50 border-blue-100' },
    { label: 'Sequência', value: `${streakCount}`, note: 'Dias consecutivos', icon: <Flame size={17} className="text-orange-600" />, accent: 'bg-orange-50 border-orange-100' },
    { label: 'Certificados', value: `${certificates.length}`, note: 'Credenciais disponíveis', icon: <Award size={17} className="text-accent" />, accent: 'bg-[#F5F0E8] border-[#D6D3D1]' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Hero greeting */}
      <section className={`relative overflow-hidden rounded-[24px] p-6 sm:p-8 ${
        isHighContrast ? 'border-4 border-yellow-500 bg-black text-cream-100' : 'bg-ink-900 text-cream-100 shadow-sm'
      }`}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/8 blur-[80px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ledger-eyebrow">Meu espaço de aprendizagem</p>
            <h1 className="mt-3 font-serif text-2xl font-black sm:text-3xl">
              Olá, {profileForm.firstName || 'estudante'}.
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-cream-100/65">
              {selectedCourseTitle ? `Acompanhando ${selectedCourseTitle}.` : 'Acompanhe os seus cursos, aulas e progresso.'}
              O horário atual é {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('courses')}
            className="ledger-primary inline-flex items-center justify-center gap-2 rounded-xl"
          >
            <PlayCircle size={16} />
            Abrir minhas aulas
          </button>
        </div>
      </section>

      {/* Metrics grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <article key={m.label} className={`ledger-panel p-5 ${cardThemeClass}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">{m.label}</p>
                <p className="mt-3 font-serif text-2xl font-black text-ink-900 dark:text-cream-100">{m.value}</p>
              </div>
              <span className={`rounded-xl border p-2 ${m.accent} dark:bg-ink-950 dark:border-ink-800`}>
                {m.icon}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">{m.note}</p>
          </article>
        ))}
      </section>

      {/* Resume + Next appointment */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <article className={`ledger-panel p-6 ${cardThemeClass}`}>
          <div className="flex items-center justify-between border-b border-gray-150 pb-4 dark:border-ink-800">
            <div>
              <p className="ledger-eyebrow">Retomar aprendizagem</p>
              <h2 className="mt-1 font-serif text-[17px] font-black text-ink-900 dark:text-cream-100">
                {currentLecture?.title || 'Nenhuma aula disponível'}
              </h2>
            </div>
            {currentLecture && (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-100">
                DISPONÍVEL
              </span>
            )}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-neutral-400">
            {currentLecture?.description || 'Aulas futuras ficam no calendário até a janela de acesso começar.'}
          </p>
          <button
            onClick={() => setActiveTab('courses')}
            className="mt-5 ledger-primary w-full inline-flex items-center justify-center gap-2 rounded-xl"
          >
            <PlayCircle size={15} />
            {currentLecture ? 'Continuar aula' : 'Ver calendário'}
          </button>
        </article>

        <article className={`ledger-panel p-6 ${cardThemeClass}`}>
          <p className="ledger-eyebrow">Próximo compromisso</p>
          {nextScheduledLesson ? (
            <div className="mt-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <CalendarClock size={18} />
              </span>
              <h2 className="mt-3 font-serif text-[17px] font-black text-ink-900 dark:text-cream-100">
                {nextScheduledLesson.titulo || nextScheduledLesson.title}
              </h2>
              <p className="mt-2 text-[13px] text-neutral-400">
                {lessonTime ? new Date(lessonTime).toLocaleString('pt-AO', { dateStyle: 'full', timeStyle: 'short' }) : 'Horário a confirmar'}
              </p>
              <button onClick={() => setActiveTab('calendar')} className="mt-4 text-[11px] font-mono font-bold uppercase text-accent hover:underline cursor-pointer">
                Abrir calendário
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-200 text-neutral-400 dark:bg-ink-950">
                <CalendarClock size={18} />
              </span>
              <p className="mt-4 text-[13px] leading-relaxed text-neutral-400">Nenhuma aula futura agendada.</p>
              <button onClick={() => setActiveTab('calendar')} className="mt-4 text-[11px] font-mono font-bold uppercase text-accent hover:underline cursor-pointer">
                Ver histórico
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
