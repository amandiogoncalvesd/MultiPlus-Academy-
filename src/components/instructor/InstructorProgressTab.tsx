import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, Loader2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { Course } from '../../types';

interface ProgressRow {
  student_id: string;
  student_name: string;
  student_email: string;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  access_starts_at: string | null;
  access_ends_at: string | null;
  completed: boolean;
  video_progress_seconds: number;
  last_activity: string | null;
}

interface InstructorProgressTabProps {
  courses: Course[];
}

export default function InstructorProgressTab({ courses }: InstructorProgressTabProps) {
  const [courseId, setCourseId] = useState('');
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId && courses[0]?.id) setCourseId(courses[0].id);
  }, [courseId, courses]);

  useEffect(() => {
    if (!courseId) {
      setRows([]);
      return;
    }

    const loadProgress = async () => {
      setLoading(true);
      setError('');
      const { data, error: requestError } = await supabase
        .rpc('get_course_lesson_progress', { p_course_id: courseId });

      if (requestError) {
        console.error('Error loading course lesson progress:', requestError);
        setError('Não foi possível carregar o progresso deste curso.');
        setRows([]);
      } else {
        setRows((data || []) as ProgressRow[]);
      }
      setLoading(false);
    };

    loadProgress();
  }, [courseId]);

  const students = useMemo(() => {
    const byStudent = new Map<string, { name: string; email: string; lessons: ProgressRow[] }>();
    rows.forEach((row) => {
      const current = byStudent.get(row.student_id) || {
        name: row.student_name,
        email: row.student_email,
        lessons: [],
      };
      current.lessons.push(row);
      byStudent.set(row.student_id, current);
    });
    return [...byStudent.entries()];
  }, [rows]);

  const selectedCourse = courses.find((course) => course.id === courseId);

  return (
    <div className="space-y-6 text-left">
      <section className="rounded-3xl border border-gray-150 bg-cream-100 p-6 shadow-xs dark:border-ink-800/60 dark:bg-ink-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gold-600">Acompanhamento académico</span>
            <h3 className="mt-1 text-xl font-serif font-black text-ink-900 dark:text-cream-100">Progresso por aluno e aula</h3>
            <p className="mt-1 text-xs text-neutral-400">Consulte conclusões e tempo assistido somente nas turmas pelas quais é responsável.</p>
          </div>
          <label className="block min-w-[240px] text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
            Curso
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-250 bg-cream-200 p-2.5 text-xs font-sans normal-case text-ink-900 focus:border-gold-600 focus:outline-none dark:border-ink-750 dark:bg-ink-800 dark:text-cream-100"
            >
              {courses.length === 0 && <option value="">Nenhum curso disponível</option>}
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl border border-gray-150 bg-cream-100 text-xs font-mono text-neutral-400 dark:border-ink-800 dark:bg-ink-900">
          <Loader2 className="animate-spin text-gold-600" size={24} /> A carregar progresso da turma…
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : !courseId || students.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-250 bg-cream-100 p-10 text-center text-xs text-neutral-400 dark:border-ink-800 dark:bg-ink-900">
          Ainda não existem alunos matriculados ou aulas criadas em {selectedCourse?.title || 'este curso'}.
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(([studentId, student]) => {
            const completed = student.lessons.filter((lesson) => lesson.completed).length;
            const total = student.lessons.length;
            const percent = total ? Math.round((completed / total) * 100) : 0;

            return (
              <article key={studentId} className="overflow-hidden rounded-3xl border border-gray-150 bg-cream-100 dark:border-ink-800/60 dark:bg-ink-900">
                <header className="flex flex-col gap-3 border-b border-gray-150 bg-cream-200/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-ink-800 dark:bg-ink-950/40">
                  <div>
                    <h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100">{student.name || 'Aluno sem nome'}</h4>
                    <p className="mt-0.5 text-[11px] text-neutral-400">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-cream-200"><Users size={13} /> {completed}/{total} aulas</span>
                    <span className="rounded-lg bg-gold-600/15 px-2.5 py-1 font-bold text-gold-700 dark:text-gold-500">{percent}%</span>
                  </div>
                </header>
                <div className="divide-y divide-gray-100 dark:divide-ink-800">
                  {student.lessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="grid grid-cols-1 gap-2 p-4 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-5">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase text-gold-600">Aula {lesson.lesson_order + 1}</span>
                        <p className="mt-0.5 font-semibold text-ink-900 dark:text-cream-100">{lesson.lesson_title}</p>
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {lesson.access_starts_at ? new Date(lesson.access_starts_at).toLocaleString('pt-AO') : 'Sem janela definida'}
                          {lesson.access_ends_at ? ` — ${new Date(lesson.access_ends_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold ${lesson.completed ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-cream-200'}`}>
                        <CheckCircle2 size={12} /> {lesson.completed ? 'Concluída' : 'Pendente'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400"><Clock3 size={12} /> {Math.floor((lesson.video_progress_seconds || 0) / 60)} min</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-300">
        <BarChart3 size={16} /> O progresso é calculado a partir de conclusões e da posição guardada no vídeo; não inclui dados de outros cursos.
      </div>
    </div>
  );
}
