import { Award, BookOpen, CalendarClock, ChevronRight, CircleAlert, GraduationCap, Users } from 'lucide-react';
import { Course, User } from '../../types';

interface Props {
  users: User[];
  courses: Course[];
  enrollments: any[];
  certificates: any[];
  onNavigate: (tab: string) => void;
}

export default function AdminOverview({ users, courses, enrollments, certificates, onNavigate }: Props) {
  const students = users.filter((user) => user.role === 'ALUNO').length;
  const teachers = users.filter((user) => user.role === 'PROFESSOR').length;
  const activeCourses = courses.filter((course) => course.status === 'PUBLISHED').length;
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'ACTIVE').length;
  const topCourses = courses
    .map((course) => ({
      course,
      count: enrollments.filter((enrollment) => enrollment.course_id === course.id || enrollment.courseId === course.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const attention = [
    activeCourses === 0 ? { label: 'Publicar um curso para liberar o catálogo e as matrículas.', tab: 'cursos', tone: 'amber' } : null,
    activeEnrollments === 0 ? { label: 'Não há matrículas ativas. Revise cursos e turmas.', tab: 'cursos', tone: 'amber' } : null,
    users.some((user) => user.status === 'SUSPENDED') ? { label: `${users.filter((user) => user.status === 'SUSPENDED').length} conta(s) suspensa(s) exigem revisão.`, tab: 'utilizadores', tone: 'red' } : null,
  ].filter(Boolean) as Array<{ label: string; tab: string; tone: string }>;

  const metrics = [
    { label: 'Alunos ativos', value: students, detail: `${activeEnrollments} matrícula(s)`, icon: <GraduationCap size={18} />, tab: 'utilizadores' },
    { label: 'Professores', value: teachers, detail: 'Contas docentes', icon: <Users size={18} />, tab: 'utilizadores' },
    { label: 'Cursos publicados', value: activeCourses, detail: `${courses.length} total`, icon: <BookOpen size={18} />, tab: 'cursos' },
    { label: 'Certificados', value: certificates.length, detail: 'Registros emitidos', icon: <Award size={18} />, tab: 'certificados' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-ink-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-accent/8 blur-[80px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ledger-eyebrow" style={{ color: '#C99A47', borderColor: '#C99A47' }}>Registro operacional</p>
            <h1 className="mt-3 max-w-2xl font-serif text-3xl font-black tracking-tight sm:text-4xl">
              A instituição em um relance.
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-cream-100/65">
              Acompanhe pessoas, turmas e credenciais. Cada indicador abre a área correspondente.
            </p>
          </div>
          <button
            onClick={() => onNavigate('cursos')}
            className="ledger-primary inline-flex items-center justify-center gap-2 rounded-xl"
          >
            <BookOpen size={16} />
            Gerir cursos
          </button>
        </div>
      </section>

      {/* Metrics grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            onClick={() => onNavigate(metric.tab)}
            className="group ledger-panel p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/30"
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">{metric.label}</p>
              <span className="rounded-xl bg-[#F5F0E8] p-2.5 text-accent dark:bg-accent/15">
                {metric.icon}
              </span>
            </div>
            <p className="mt-4 font-serif text-2xl font-black text-ink-900 dark:text-cream-100">{metric.value}</p>
            <p className="mt-1 text-[11px] text-neutral-400">{metric.detail}</p>
          </button>
        ))}
      </section>

      {/* Courses + Attention */}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="ledger-panel">
          <header className="flex items-center justify-between border-b border-border p-5 dark:border-ink-800">
            <div>
              <p className="ledger-eyebrow">Cursos em foco</p>
              <h2 className="mt-1 font-serif text-[17px] font-black text-ink-900 dark:text-cream-100">Turmas por matrícula</h2>
            </div>
            <button onClick={() => onNavigate('cursos')} className="rounded-lg p-2 text-accent hover:bg-accent/10 transition-colors" aria-label="Abrir cursos">
              <ChevronRight size={18} />
            </button>
          </header>
          <div className="divide-y divide-border dark:divide-ink-800">
            {topCourses.map(({ course, count }) => (
              <button
                key={course.id}
                onClick={() => onNavigate('cursos')}
                className="grid w-full grid-cols-[1fr_auto] gap-4 p-5 text-left hover:bg-cream-200/50 dark:hover:bg-ink-950 transition-colors"
              >
                <span>
                  <b className="block text-[13px] text-ink-900 dark:text-cream-100">{course.title}</b>
                  <small className="mt-1 block text-[10px] font-mono text-neutral-400">{course.status || 'DRAFT'} · {course.teacher?.nome_completo || 'Não atribuído'}</small>
                </span>
                <span className="self-center text-right">
                  <b className="block font-serif text-lg text-accent">{count}</b>
                  <small className="text-[10px] text-neutral-400">matrículas</small>
                </span>
              </button>
            ))}
            {!topCourses.length && (
              <p className="p-8 text-center text-[13px] text-neutral-400">Crie o primeiro curso institucional.</p>
            )}
          </div>
        </article>

        <aside className="ledger-panel bg-cream-200/50 dark:bg-ink-900 p-5">
          <p className="ledger-eyebrow">Fila de atenção</p>
          <h2 className="mt-1 font-serif text-[17px] font-black text-ink-900 dark:text-cream-100">Próximas ações</h2>
          <div className="mt-5 space-y-3">
            {attention.length ? attention.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.tab)}
                className="flex w-full items-start gap-3 ledger-panel p-4 text-left hover:border-accent/30 transition-all"
              >
                <CircleAlert size={17} className={item.tone === 'red' ? 'shrink-0 text-danger-700' : 'shrink-0 text-accent'} />
                <span className="text-[12px] leading-relaxed text-ink-900 dark:text-cream-100">{item.label}</span>
              </button>
            )) : (
              <div className="ledger-panel border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">
                <CalendarClock className="mr-2 inline" size={16} />
                Nenhuma exceção operacional.
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
