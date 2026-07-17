import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Clock, 
  HelpCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Flame,
  MessageSquare
} from 'lucide-react';
import { User, Course } from '../../types';
import { useTeacherMetrics } from '../../hooks/useTeacherMetrics';
import { useTeacherNotifications } from '../../hooks/useTeacherNotifications';
import StarBorder from '../ui/StarBorder';

interface InstructorDashboardTabProps {
  currentUser: User | null;
  courses: Course[];
  students: User[];
  evaluationsPendingCount: number;
  certificatesIssuedCount: number;
  completionRate: number;
  onNavigate: (tab: string) => void;
  lessonsCount?: number;
  recentNotifications?: any[];
}

export default function InstructorDashboardTab({
  currentUser,
  courses: initialCourses,
  students: initialStudents,
  evaluationsPendingCount: initialEvaluationsCount,
  certificatesIssuedCount: initialCertsCount,
  completionRate: initialCompletionRate,
  onNavigate,
  lessonsCount = 0,
  recentNotifications
}: InstructorDashboardTabProps) {
  const [activeMetricChart, setActiveMetricChart] = useState<'completion' | 'engagement'>('completion');

  // Load real-time aggregated metrics
  const { metrics, weeklyEngagement, loading: loadingMetrics } = useTeacherMetrics(currentUser?.id);

  // Load real-time teacher notifications for the Action Queue
  const { notifications, loading: loadingNotifs } = useTeacherNotifications(currentUser?.id);

  // Fallbacks using prop values if loading or empty
  const activeCoursesCount = metrics.totalCourses > 0 ? metrics.totalCourses : initialCourses.length;
  const activeStudentsCount = metrics.totalStudents > 0 ? metrics.totalStudents : initialStudents.length;
  const activeLessonsCount = metrics.totalLessons > 0 ? metrics.totalLessons : lessonsCount;
  const activePendingCount = metrics.pendingEvaluations > 0 ? metrics.pendingEvaluations : initialEvaluationsCount;
  const activeCertsCount = metrics.issuedCertificates > 0 ? metrics.issuedCertificates : initialCertsCount;
  const activeCompletionRate = metrics.completionRate > 0 ? metrics.completionRate : initialCompletionRate;

  // Format notifications for the Action Queue
  const finalNotifications = recentNotifications && recentNotifications.length > 0 ? recentNotifications : notifications;
  const alertsQueue = finalNotifications.length > 0 
    ? finalNotifications.slice(0, 5).map((n) => {
        let type = 'enrollment';
        if (n.text.toLowerCase().includes('tarefa') || n.text.toLowerCase().includes('submiss') || n.text.toLowerCase().includes('avalia')) {
          type = 'assignment';
        } else if (n.text.toLowerCase().includes('aula') || n.text.toLowerCase().includes('síncron') || n.text.toLowerCase().includes('meet')) {
          type = 'live';
        }
        
        let timeStr = 'Recente';
        if (n.created_at) {
          const d = new Date(n.created_at);
          timeStr = d.toLocaleDateString('pt-AO') + ' ' + d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: n.id,
          type,
          text: n.text,
          time: timeStr
        };
      })
    : [
        { id: '1', type: 'assignment', text: 'Não há submissões pendentes de correção neste momento.', time: 'Sincronizado' },
        { id: '2', type: 'enrollment', text: 'Acompanhe a entrada de novos juristas através do menu Alunos.', time: 'Sincronizado' }
      ];

  // Draw dynamic curves
  const ratePoints = (weeklyEngagement.length > 0 ? weeklyEngagement : [
    { week: '1', rate: 10 },
    { week: '2', rate: 30 },
    { week: '3', rate: 60 },
    { week: '4', rate: activeCompletionRate || 75 }
  ]).map((w, idx) => ({
    x: (idx / 3) * 500,
    y: 120 - (((w.rate || w.completion_rate || 0) / 100) * 100)
  }));

  const subsPoints = (weeklyEngagement.length > 0 ? weeklyEngagement : [
    { week: '1', subs: 2 },
    { week: '2', subs: 5 },
    { week: '3', subs: 12 },
    { week: '4', subs: activePendingCount || 3 }
  ]).map((w, idx) => ({
    x: (idx / 3) * 500,
    y: 120 - ((Math.min(10, w.subs || 1) / 10) * 100)
  }));

  const generateSvgPath = (points: { x: number, y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((path, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${path} L ${p.x},${p.y}`;
    }, '');
  };

  const linePath = activeMetricChart === 'completion' ? generateSvgPath(ratePoints) : generateSvgPath(subsPoints);

  // Dynamic Insights
  const insightText = activeCompletionRate > 0
    ? `A taxa de conclusão geral dos seus cursos é de ${activeCompletionRate}%. Continue acompanhando o progresso dos alunos para identificar oportunidades de melhoria.`
    : 'Os insights analíticos serão gerados automaticamente quando houver dados de progresso dos alunos registados no sistema.';

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Greetings Block */}
      <div className="bg-[#0e141f] text-cream-100 p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-gold-600/25 shadow-sm text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">
            Centro de Gestão Académica • Direção de Curso
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black m-0 text-cream-100">
            Olá, Professor(a) {currentUser?.firstName || 'Esmeralda'} {currentUser?.lastName || 'Sumbelelo'}! 🏛️
          </h2>
          <p className="text-xs text-cream-100/70 mt-1 max-w-xl">
            Bem-vindo ao Centro de Gestão Académica da MultiPlus Academy. Acompanhe abaixo o rendimento escolar dos juristas em Angola, configure ementas síncronas e emita diplomas certificados com autenticação criptográfica rigorosa.
          </p>
        </div>
      </div>

      {/* Modern High-End KPI Cards using StarBorder for visual fidelity */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total de Cursos', value: activeCoursesCount, note: activeCoursesCount === 1 ? '1 Ativo' : `${activeCoursesCount} Ativos`, icon: <BookOpen size={16} />, tab: 'cursos', color: 'text-blue-500' },
          { title: 'Total de Alunos', value: activeStudentsCount, note: 'Todos matriculados', icon: <Users size={16} />, tab: 'alunos', color: 'text-amber-500' },
          { title: 'Aulas Publicadas', value: activeLessonsCount, note: activeLessonsCount === 1 ? '1 Mapeada' : `${activeLessonsCount} Mapeadas`, icon: <Clock size={16} />, tab: 'cursos', color: 'text-purple-500' },
          { title: 'Avaliações Pendentes', value: activePendingCount, note: 'Requer correção', icon: <HelpCircle size={16} />, tab: 'avaliacoes', color: 'text-red-500' },
          { title: 'Certificados Emitidos', value: activeCertsCount, note: 'QR Code válidos', icon: <Award size={16} />, tab: 'certificados', color: 'text-emerald-500' },
          { title: 'Taxa de Conclusão', value: `${activeCompletionRate}%`, note: 'Fidelidade letiva', icon: <TrendingUp size={16} />, tab: 'relatorios', color: 'text-sky-500' }
        ].map((kpi, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(kpi.tab)}
            className="group p-0 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all cursor-pointer border-0 shadow-xs flex flex-col justify-between h-32 select-none bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800/60"
          >
            <div className="p-4 flex flex-col justify-between h-full w-full relative">
              <div className="flex justify-between items-start w-full">
                <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  {kpi.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-2 text-left">
                <span className="text-xl sm:text-2xl font-serif font-black text-ink-900 dark:text-cream-100 block leading-none group-hover:text-gold-600 transition-colors">
                  {kpi.value}
                </span>
                <span className="text-[9px] font-mono text-neutral-400 uppercase block mt-1">
                  {kpi.note}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Section split graphics & feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* Graphical statistics visualization map */}
        <div className="lg:col-span-8 bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left flex flex-col justify-between min-h-[350px] shadow-xs relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,155,60,0.02),transparent_60%)] pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-150 dark:border-ink-800/60 pb-3 relative z-10">
            <div>
              <span className="text-[9px] font-mono text-neutral-400 uppercase font-black tracking-widest block">Relações de Frequência LMS</span>
              <h3 className="text-base font-serif font-bold text-ink-900 dark:text-cream-100 m-0">Análise Temporal de Presença & Aprendizado</h3>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setActiveMetricChart('completion')}
                className={`px-3 py-1 text-3xs font-mono rounded-lg transition-all border-0 cursor-pointer ${
                  activeMetricChart === 'completion' 
                    ? 'bg-gold-600 text-cream-100 shadow-sm shadow-gold-600/20' 
                    : 'bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200 hover:bg-cream-250 dark:hover:bg-ink-750'
                }`}
              >
                Conclusão de Aula
              </button>
              <button
                onClick={() => setActiveMetricChart('engagement')}
                className={`px-3 py-1 text-3xs font-mono rounded-lg transition-all border-0 cursor-pointer ${
                  activeMetricChart === 'engagement' 
                    ? 'bg-gold-600 text-cream-100 shadow-sm shadow-gold-600/20' 
                    : 'bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200 hover:bg-cream-250 dark:hover:bg-ink-750'
                }`}
              >
                Submissão Exames
              </button>
            </div>
          </div>

          <div className="relative pt-6 flex-grow flex items-end z-10 w-full">
            <div className="w-full h-48 flex flex-col items-center justify-center text-center space-y-3">
              <Activity className="w-10 h-10 text-gold-600/30" />
              <p className="text-xs text-neutral-400 max-w-sm">
                Os gráficos analíticos serão exibidos quando houver dados suficientes de progresso dos alunos. 
                As métricas serão calculadas automaticamente a partir das submissões e conclusões de aulas.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 flex items-center gap-3.5 mt-4 relative z-10">
            <span className="p-1 rounded bg-gold-600/10 text-gold-600 text-xs shrink-0 font-bold font-mono">INSIGHT</span>
            <p className="text-2xs text-ink-900 dark:text-cream-100/80 leading-relaxed font-sans m-0">
              {insightText}
            </p>
          </div>
        </div>

        {/* Action Queue feed */}
        <div className="lg:col-span-4 bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold-600/[0.01] to-transparent pointer-events-none" />
          <div className="space-y-4 relative z-10 w-full">
            <div className="border-b border-gray-150 dark:border-ink-800/60 pb-3">
              <span className="text-[9px] font-mono text-neutral-400 uppercase font-black tracking-widest block">Eventos Críticos</span>
              <h3 className="text-sm font-serif font-bold text-ink-900 dark:text-cream-100 m-0">Fila Pendente de Ação</h3>
            </div>

            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {alertsQueue.map((alertItem, idx) => (
                <div key={idx} className="p-3 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-150 dark:border-ink-800/60 rounded-2xl space-y-1 hover:border-gold-600/20 transition-all text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono text-gold-600 font-bold">
                    <span className="uppercase">
                      {alertItem.type === 'assignment' ? 'Avaliação Recebida' : alertItem.type === 'enrollment' ? 'Novo Aluno' : 'Aula Síncrona'}
                    </span>
                    <span className="text-neutral-400 font-semibold">{alertItem.time}</span>
                  </div>
                  <p className="text-2xs text-neutral-400 dark:text-cream-100/70 leading-snug font-sans m-0">
                    {alertItem.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('avaliacoes')}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-gold-600 to-[#E2B755] hover:scale-105 active:scale-95 text-ink-900 text-3xs font-mono font-bold uppercase rounded-xl tracking-widest border-0 cursor-pointer transition-all inline-flex items-center justify-center gap-2 relative z-10 shadow-sm"
          >
            <span>Ir para Portal de Correção</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

      </div>

    </div>
  );
}
