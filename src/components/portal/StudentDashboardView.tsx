import { 
  BookOpen, 
  ExternalLink, 
  Flame, 
  CheckCircle, 
  Clock, 
  Award, 
  PlayCircle 
} from 'lucide-react';

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
  setActiveTab: (tab: any) => void;
  cardThemeClass: string;
  isHighContrast: boolean;
}

export default function StudentDashboardView({
  enrollments,
  currentTime,
  profileForm,
  nextScheduledLesson,
  streakCount,
  completedLessons,
  realLessons,
  certificates,
  currentLecture,
  setActiveTab,
  cardThemeClass,
  isHighContrast
}: StudentDashboardViewProps) {
  return (
    <div className="space-y-6">
      {enrollments.length === 0 ? (
        <div className="bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6">
          <div className="w-16 h-16 bg-ink-900/5 text-gold-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <div className="space-y-2 text-center">
            <h4 className="font-serif font-black text-lg text-ink-900 dark:text-cream-100 leading-tight m-0">
              Você ainda não está inscrito em nenhum curso.
            </h4>
            <p className="text-xs text-neutral-400 dark:text-gray-450 leading-relaxed font-sans m-0">
              Entre em contato com o seu instrutor ou administrador da MultiPlus Academy para efetuar a sua matrícula nos cursos disponíveis.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Personal Greetings Block with UTC live date clock and progress indicator */}
          <div className={`p-6 sm:p-8 rounded-3xl relative overflow-hidden text-left ${
            isHighContrast ? 'border-4 border-yellow-500 bg-black text-cream-100' : 'bg-ink-900 text-cream-100 border border-gold-600/20 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold-600/10 to-transparent rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                {/* Live real-time clock and precise formatted dates */}
                <div className="flex items-center gap-3 text-gold-600 text-[10px] font-mono tracking-widest uppercase font-bold">
                  <span>ASSENTO ACADÉMICO ATIVO • MULTIPLUS</span>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-cream-100 select-none">
                    ⏱ {currentTime.toLocaleTimeString()}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-black m-0 text-cream-100 mt-1.5 leading-tight">
                  Olá, {profileForm.firstName || 'Doutor(a)'}! 👋
                </h2>
                <p className="text-xs text-cream-100/70 mt-1 max-w-xl">
                  Bem-vindo(a) de volta à MultiPlus Academy. Desenvolva as suas competências de oratória ("oral advocacy") e drafting formal de contratos em inglês hoje.
                </p>
              </div>

              {nextScheduledLesson ? (
                <div className="bg-cream-100/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-2 shrink-0 max-w-xs text-left">
                  <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-bold">PRÓXIMA AULA SÍNCRONA</span>
                  <h4 className="text-xs font-serif font-black m-0 truncate max-w-[240px] text-cream-100">
                    {nextScheduledLesson.titulo || nextScheduledLesson.title || 'Sessão Prática'}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 block font-bold uppercase">
                    {new Date(nextScheduledLesson.access_starts_at || nextScheduledLesson.scheduled_at).toLocaleDateString('pt-AO', { weekday: 'long' })} • {new Date(nextScheduledLesson.access_starts_at || nextScheduledLesson.scheduled_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {nextScheduledLesson.meeting_url && (
                    <a 
                      href={nextScheduledLesson.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-gold-600 hover:bg-cream-100 hover:text-slate-900 text-ink-900 font-mono text-3xs font-extrabold rounded-lg tracking-wider transition-all inline-flex items-center gap-1"
                    >
                      Entrar na Reunião <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-cream-100/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-2 shrink-0 text-left max-w-xs">
                  <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-bold">SESSÃO SÍNCRONA</span>
                  <h4 className="text-xs font-serif font-black m-0 text-cream-100">Sem sessões agendadas</h4>
                  <span className="text-[10px] font-mono text-neutral-400 block">Novas tutorias em breve.</span>
                </div>
              )}
            </div>
          </div>

          {/* Responsive Grid statistics metrics using clean neon SaaS indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Cunho de Estudo', value: `${streakCount} Dias`, note: 'Acompanhando a constância', icon: <Flame size={18} fill="currentColor" className="text-orange-600" /> },
              { title: 'Aulas Vídeo Concluídas', value: `${completedLessons.length} de ${realLessons.length} sessões`, note: 'Unidade de Isenção em curso', icon: <CheckCircle size={18} className="text-emerald-600" /> },
              { title: 'Dedicação Acumulada', value: `${Math.round(completedLessons.length * 1.5)} Horas`, note: 'Meta: 3 horas semanais', icon: <Clock size={18} className="text-blue-600" /> },
              { title: 'Certificados Ganhos', value: `${certificates.length} ${certificates.length === 1 ? 'Credencial' : 'Credenciais'}`, note: 'Sincronizados em tempo real', icon: <Award size={18} className="text-amber-500" /> }
            ].map((stat, idx) => (
              <div key={idx} className={`p-5 rounded-2xl text-left flex flex-col justify-between ${cardThemeClass}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">{stat.title}</span>
                    <span className="text-xl font-serif font-black text-ink-900 dark:text-cream-100 leading-tight">{stat.value}</span>
                  </div>
                  <div className="p-2.5 bg-cream-200 dark:bg-ink-900 rounded-xl border border-gray-150 dark:border-ink-800 shrink-0">
                    {stat.icon}
                  </div>
                </div>
                <span className="text-[9px] font-mono text-neutral-400 mt-3 block">{stat.note}</span>
              </div>
            ))}
          </div>

          {/* Active Lessons course review and Google meet widgets partition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Flagship Course card retake */}
            <div className={`lg:col-span-8 p-6 rounded-3xl text-left space-y-4 flex flex-col justify-between ${cardThemeClass}`}>
              <div className="border-b border-gray-150 pb-3 flex justify-between items-center w-full">
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 uppercase font-black tracking-wide">Módulo Ativo</span>
                  <h3 className="text-base font-serif font-black m-0 text-ink-900 dark:text-cream-100">Retome do Módulo II: Drafting Prático</h3>
                </div>
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-mono">
                  {realLessons.length > 0 ? Math.round((completedLessons.length / realLessons.length) * 100) : 0}% COMPLETO
                </span>
              </div>

              <div className="p-4 rounded-xl bg-cream-200 dark:bg-ink-950 border border-gray-150 dark:border-ink-800/50 space-y-3">
                <span className="text-[9px] font-mono text-gold-600 tracking-wide block uppercase font-bold">RETOMAR HOJE:</span>
                <h4 className="text-xs font-serif font-black text-neutral-400 dark:text-gray-200 mt-1 m-0">
                  {currentLecture?.title || 'Sem aulas ativas'}
                </h4>
                <p className="text-2xs text-neutral-400 dark:text-gray-300 leading-relaxed font-sans mt-1 m-0">
                  {currentLecture?.description || 'Nenhuma aula disponível no seu curso no momento.'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('courses')}
                className="px-4 py-2.5 bg-[#011a3d] hover:bg-gold-600 text-cream-100 hover:text-slate-900 border-0 transition-colors text-2xs font-mono font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 cursor-pointer w-full"
              >
                <PlayCircle size={14} />
                <span>Abrir Leitor de Videoaulas</span>
              </button>
            </div>

            {/* Support block info links */}
            <div className={`lg:col-span-4 p-6 rounded-3xl text-left flex flex-col justify-between space-y-4 ${cardThemeClass}`}>
              <div className="space-y-3">
                <span className="text-[9px] font-mono text-gold-600 uppercase tracking-widest font-black block">Atalhos Úteis</span>
                <h3 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 m-0">Biblioteca de Dicionários</h3>
                <p className="text-2xs text-neutral-400 font-sans leading-relaxed m-0">Assegure eficácia na redação perante tribunais descarregando dicionarizações jurídicas na secção de materiais.</p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('materials')}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-ink-800 dark:hover:bg-slate-705 text-neutral-400 dark:text-gray-200 border-0 transition-colors rounded-xl text-3xs font-mono font-bold uppercase tracking-wider"
                >
                  Ir para os Manuais
                </button>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 rounded-xl text-[10px] text-amber-800">
                  <strong>Exame final:</strong> Prático oral agendado no campus de Huambo para data limite em Junho de 2026.
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
