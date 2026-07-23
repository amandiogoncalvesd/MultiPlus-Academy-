import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Lock, PlayCircle, Video } from 'lucide-react';
import { User } from '../../types';
import { academicService } from '../../services/supabase/academicService';
import { getLessonAvailability, isLessonActive } from '../../lib/academic/lessonAccess';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import VideoPlayer from './VideoPlayer';

interface StudentLessonsPageProps {
  user: User | null;
  enrollments: any[];
  selectedCourseId: string;
  lessons: any[];
  completedLessons: string[];
  onCourseChange: (courseId: string) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
}

export default function StudentLessonsPage({ user, enrollments, selectedCourseId, lessons, completedLessons, onCourseChange, onRefresh }: StudentLessonsPageProps) {
  const activeLessons = useMemo(() => lessons.filter((lesson) => isLessonActive(lesson)), [lessons]);
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => { if (!activeLessons.some((lesson) => lesson.id === selectedId)) setSelectedId(activeLessons[0]?.id || ''); }, [activeLessons, selectedId]);
  const selected = activeLessons.find((lesson) => lesson.id === selectedId) || null;
  const player = useVideoPlayer(user?.id, selectedCourseId, selected?.id);

  const complete = async () => {
    if (!user?.id || !selected?.id) return;
    await academicService.markLessonComplete(user.id, selectedCourseId, selected.id, !completedLessons.includes(selected.id));
    await onRefresh();
  };

  return <div className="space-y-6 text-left"><section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Aulas disponíveis agora</p><h1 className="mt-1 font-serif text-2xl font-black text-ink-900 dark:text-cream-100">Minhas aulas</h1><p className="mt-1 text-xs text-neutral-400">O conteúdo só pode ser aberto durante a janela definida pelo professor.</p></div><label className="text-xs font-semibold text-ink-900 dark:text-cream-100">Curso<select value={selectedCourseId} onChange={(event) => onCourseChange(event.target.value)} className="mt-2 min-h-11 min-w-64 rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100">{enrollments.map((enrollment: any) => <option key={enrollment.course_id} value={enrollment.course_id}>{enrollment.course?.title || 'Curso'}</option>)}</select></label></div></section>
    <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">{selected ? <div className="overflow-hidden rounded-3xl border border-gray-150 bg-ink-950 shadow-sm dark:border-ink-800"><div className="aspect-video"><VideoPlayer videoRef={player.videoRef} src={selected.video_url || ''} title={selected.titulo || selected.title || ''} isPlaying={player.isPlaying} setIsPlaying={player.setIsPlaying} currentSeconds={player.currentSeconds} setCurrentSeconds={player.setCurrentSeconds} playbackSpeed={player.playbackSpeed} onSpeedChange={player.changeSpeed} watermarkPosition={player.randomWatermark} watermarkText={`${user?.email || user?.firstName || 'Aluno'} • MULTIPLUS`} onTimeUpdate={player.setCurrentSeconds} onEnded={() => player.setIsPlaying(false)} /></div><div className="bg-white p-5 dark:bg-ink-900"><h2 className="font-serif text-lg font-black text-ink-900 dark:text-cream-100">{selected.titulo || selected.title}</h2><p className="mt-2 text-sm text-neutral-400">{selected.descricao || selected.description || 'Sem descrição disponível.'}</p><button onClick={complete} className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-mono font-bold uppercase ${completedLessons.includes(selected.id) ? 'bg-emerald-50 text-emerald-700' : 'bg-gold-600 text-ink-900'}`}><CheckCircle2 size={16} />{completedLessons.includes(selected.id) ? 'Concluída — reabrir' : 'Marcar como concluída'}</button></div></div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-250 bg-white p-8 text-center dark:border-ink-800 dark:bg-ink-900"><Video className="text-gold-600" size={32} /><h2 className="mt-4 font-serif text-lg font-black text-ink-900 dark:text-cream-100">Nenhuma aula disponível</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-400">As aulas futuras ficam bloqueadas no calendário até a hora de início. Aulas encerradas ficam no histórico letivo.</p></div>}
      <aside className="rounded-3xl border border-gray-150 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900"><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Nesta janela</p><div className="mt-4 space-y-2">{activeLessons.map((lesson) => <button key={lesson.id} onClick={() => setSelectedId(lesson.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === lesson.id ? 'border-gold-600 bg-gold-600/10' : 'border-gray-150 hover:border-gold-600/40 dark:border-ink-800'}`}><span className="flex items-center gap-2 text-xs font-bold text-ink-900 dark:text-cream-100"><PlayCircle size={15} className="text-gold-600" />{lesson.titulo || lesson.title}</span><span className="mt-1 block text-[10px] text-neutral-400">{lesson.duracao || lesson.duration || 'Vídeo'}</span></button>)}{activeLessons.length === 0 && <p className="rounded-xl bg-cream-200 p-4 text-xs text-neutral-400 dark:bg-ink-950">Nenhuma aula está aberta neste momento.</p>}</div></aside></section>
    <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-900/30 dark:bg-amber-950/10"><span className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300"><Lock size={16} />Aulas futuras</span><p className="mt-2 text-xs leading-relaxed text-neutral-500">Aparecem no calendário com a data de abertura. Não é possível abrir vídeo ou reunião antes da janela.</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-ink-800 dark:bg-ink-950"><span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-cream-100"><CalendarClock size={16} />Histórico acadêmico</span><p className="mt-2 text-xs leading-relaxed text-neutral-500">Depois do término, a aula sai desta página e permanece no calendário como registro da turma.</p></div></section>
  </div>;
}
