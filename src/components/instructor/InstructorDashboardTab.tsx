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

interface InstructorDashboardTabProps {
  currentUser: User | null;
  courses: Course[];
  students: User[];
  evaluationsPendingCount: number;
  certificatesIssuedCount: number;
  completionRate: number;
  onNavigate: (tab: string) => void;
  lessonsCount?: number;
}

export default function InstructorDashboardTab({
  currentUser,
  courses,
  students,
  evaluationsPendingCount,
  certificatesIssuedCount,
  completionRate,
  onNavigate,
  lessonsCount = 0
}: InstructorDashboardTabProps) {
  const [activeMetricChart, setActiveMetricChart] = useState<'completion' | 'engagement'>('completion');

  // Realistic telemetry feedback items
  const alertsQueue = [
    { id: 1, type: 'assignment', text: 'Dr. António Carvalho submeteu a redação final do Módulo II para correção.', time: 'Há 15 mins' },
    { id: 2, type: 'enrollment', text: 'Dra. Patrícia Santos registou-se no curso de Advanced Legal Writing.', time: 'Há 2 horas' },
    { id: 3, type: 'live', text: 'Sessão ao Vivo agendada via Google Meet para as 18h30 amanhã.', time: 'Agendado' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Greetings Block */}
      <div className="bg-[#0A2E5D] text-cream-100 p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-[#C89B3C]/25 shadow-sm text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">
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

      {/* Modern High-End Neo-Skeuomorphic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total de Cursos', value: courses.length, note: courses.length === 1 ? '1 Ativo' : `${courses.length} Ativos`, icon: <BookOpen size={16} />, tab: 'cursos', color: 'text-blue-600 bg-blue-50' },
          { title: 'Total de Alunos', value: students.length, note: 'Todos regulados', icon: <Users size={16} />, tab: 'alunos', color: 'text-amber-500 bg-amber-50/60' },
          { title: 'Aulas Publicadas', value: lessonsCount, note: lessonsCount === 1 ? '1 Mapeada' : `${lessonsCount} Mapeadas`, icon: <Clock size={16} />, tab: 'cursos', color: 'text-purple-600 bg-purple-50' },
          { title: 'Avaliações Pendentes', value: evaluationsPendingCount, note: 'Requer correção', icon: <HelpCircle size={16} />, tab: 'avaliacoes', color: 'text-danger-700 bg-red-50' },
          { title: 'Certificados Emitidos', value: certificatesIssuedCount, note: 'QR Code válidos', icon: <Award size={16} />, tab: 'certificados', color: 'text-emerald-600 bg-emerald-50' },
          { title: 'Taxa de Conclusão', value: `${completionRate}%`, note: 'Fidelidade letiva', icon: <TrendingUp size={16} />, tab: 'relatorios', color: 'text-sky-600 bg-sky-50' }
        ].map((kpi, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(kpi.tab)}
            className="p-4 rounded-2xl bg-cream-100 border border-gray-150 text-left hover:border-gold-600/40 transition-all cursor-pointer flex flex-col justify-between h-32 hover:shadow-md border-b-2 hover:border-b-[#BB8533] select-none"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-[8px] font-mono font-bold text-gray-405 uppercase tracking-wider block">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-lg border border-gray-100 ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-2 text-left">
              <span className="text-xl sm:text-2xl font-serif font-black text-ink-900 dark:text-neutral-900 block leading-none">
                {kpi.value}
              </span>
              <span className="text-[9px] font-mono text-gray-450 uppercase block mt-1">
                {kpi.note}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Section split graphics & feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Graphical statistics visualization map using responsive gorgeous vectors in pure SVG */}
        <div className="lg:col-span-8 bg-cream-100 p-6 rounded-3xl border border-gray-150 text-left flex flex-col justify-between min-h-[350px]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <span className="text-[9px] font-mono text-neutral-400 uppercase font-black tracking-widest block">Relações de Frequência LMS</span>
              <h3 className="text-base font-serif font-bold text-ink-900 m-0">Análise Temporal de Presença & Aprendizado</h3>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveMetricChart('completion')}
                className={`px-3 py-1 text-3xs font-mono rounded-lg transition-all border ${
                  activeMetricChart === 'completion' 
                    ? 'bg-ink-900 text-cream-100 border-ink-900' 
                    : 'bg-cream-200 text-neutral-400 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Conclusão de Aula
              </button>
              <button
                onClick={() => setActiveMetricChart('engagement')}
                className={`px-3 py-1 text-3xs font-mono rounded-lg transition-all border ${
                  activeMetricChart === 'engagement' 
                    ? 'bg-ink-900 text-cream-100 border-ink-900' 
                    : 'bg-cream-200 text-neutral-400 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Submissão Exames
              </button>
            </div>
          </div>

          <div className="relative pt-6 flex-grow flex items-end">
            {/* Pure Responsive SVG beautiful Graph Curve */}
            <div className="w-full h-48 relative">
              <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BB8533" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#151D29" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {activeMetricChart === 'completion' ? (
                  <>
                    <path
                      d="M 0,100 C 50,85 100,50 150,70 C 200,90 250,30 300,45 C 350,60 400,15 450,10 L 500,5"
                      fill="none"
                      stroke="#BB8533"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 0,100 C 50,85 100,50 150,70 C 200,90 250,30 300,45 C 350,60 400,15 450,10 L 500,5 L 500,120 L 0,120 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Data Points hover rings */}
                    <circle cx="150" cy="70" r="5" fill="#151D29" stroke="#BB8533" strokeWidth="2" />
                    <circle cx="300" cy="45" r="5" fill="#151D29" stroke="#BB8533" strokeWidth="2" />
                    <circle cx="450" cy="10" r="5" fill="#151D29" stroke="#BB8533" strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <path
                      d="M 0,90 C 50,95 100,80 150,60 C 200,40 250,65 300,55 C 350,45 400,30 450,32 L 500,15"
                      fill="none"
                      stroke="#151D29"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Points */}
                    <circle cx="150" cy="60" r="5" fill="#BB8533" stroke="#151D29" strokeWidth="2" />
                    <circle cx="300" cy="55" r="5" fill="#BB8533" stroke="#151D29" strokeWidth="2" />
                    <circle cx="450" cy="32" r="5" fill="#BB8533" stroke="#151D29" strokeWidth="2" />
                  </>
                )}
              </svg>
              
              {/* Graph axis coordinates labels */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] font-mono text-neutral-400 pt-2 border-t border-gray-100">
                <span>SEMANA 1</span>
                <span>SEMANA 4 (DRAFTING)</span>
                <span>SEMANA 8 (ORAL EXAM)</span>
                <span>SEMANA 12 (HOJE)</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 flex items-center gap-3.5 mt-4">
            <span className="p-1 rounded bg-gold-600/10 text-gold-600 text-xs shrink-0 font-bold font-mono">INSIGHT</span>
            <p className="text-2xs text-ink-900 leading-relaxed font-sans m-0">
              O pico de envolvimento letivo aumentou após a introdução de áudios e vídeos indexados do Cloudinary no Módulo II. A frequência de submissões práticas subiu para <strong>94%</strong>.
            </p>
          </div>
        </div>

        {/* Alerts queue notifications channel feed */}
        <div className="lg:col-span-4 bg-cream-100 p-6 rounded-3xl border border-gray-150 text-left flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[9px] font-mono text-neutral-400 uppercase font-black tracking-widest block">Eventos Críticos</span>
              <h3 className="text-sm font-serif font-bold text-ink-900 m-0">Fila Pendente de Ação</h3>
            </div>

            <div className="space-y-3.5">
              {alertsQueue.map((alertItem) => (
                <div key={alertItem.id} className="p-3 bg-cream-200/50 border border-gray-150 rounded-2xl space-y-1 hover:border-gold-600/20 transition-all text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono text-gold-600 font-bold">
                    <span className="uppercase">{alertItem.type === 'assignment' ? 'Avaliação Recebida' : alertItem.type === 'enrollment' ? 'Novo Aluno' : 'Aula Síncrona'}</span>
                    <span className="text-neutral-400 font-semibold">{alertItem.time}</span>
                  </div>
                  <p className="text-2xs text-neutral-400 leading-snug font-sans m-0">
                    {alertItem.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('avaliacoes')}
            className="w-full mt-4 py-2.5 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-ink-900 text-3xs font-mono font-bold uppercase rounded-xl tracking-widest border-0 cursor-pointer transition-all inline-flex items-center justify-center gap-2"
          >
            <span>Ir para Portal de Correção</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

      </div>

    </div>
  );
}
