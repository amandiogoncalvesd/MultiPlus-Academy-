import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  Award, 
  Calendar,
  Flame,
  Check
} from 'lucide-react';
import { User } from '../../types';

interface StudentProgressTabProps {
  currentUser: User | null;
}

export default function StudentProgressTab({ currentUser }: StudentProgressTabProps) {
  const streak = currentUser?.streak || 5;
  const hours = currentUser?.totalHoursLearned || 24;

  const progressBenchmarks = [
    { label: 'Módulo I: Fundamentos do Common Law vs. Civil Law', status: true, score: 95 },
    { label: 'Módulo II: Drafting de Boilerplate & Prática de Isenção', status: true, score: 88 },
    { label: 'Módulo III: Direito Societário e Defesa Oral Mock', status: false, score: 0 }
  ];

  const weeklyhours = [
    { week: 'Semana 1', hrs: 4.5 },
    { week: 'Semana 2', hrs: 6.2 },
    { week: 'Semana 3', hrs: 3.8 },
    { week: 'Semana 4', hrs: 7.0 },
    { week: 'Semana 5', hrs: 5.1 },
    { week: 'Semana 6', hrs: 6.5 }
  ];

  const maxWeeklyHrs = Math.max(...weeklyhours.map(w => w.hrs));

  return (
    <div className="space-y-6 text-left">
      
      {/* Visual Analytics Header Panel */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm text-left">
        <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Painel Analítico de Progresso</span>
        <h3 className="text-xl font-serif font-black text-[#0A2E5D] m-0">Minha Performance Escolar</h3>
        <p className="text-xs text-gray-400 mt-1">Dados agregados de visualização de aulas, submissão de relatórios e notas de moderação em tempo real.</p>
      </div>

      {/* Main split dashboard metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 - study commitment dial */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 flex flex-col justify-between hover:border-[#C89B3C]/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Comprometimento de Horas</span>
              <span className="text-2xl font-serif font-black text-[#0A2E5D]">{hours} horas</span>
            </div>
            <div className="p-2 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl border border-[#0A2E5D]/10">
              <Clock size={18} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-400">STATUS DA META LETIVA:</span>
            <span className="text-emerald-600 font-bold">100% REGULADA</span>
          </div>
        </div>

        {/* Metric 2 - Attendance Presence gauge */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 flex flex-col justify-between hover:border-[#C89B3C]/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Presença Workshops Síncronos</span>
              <span className="text-2xl font-serif font-black text-[#0A2E5D]">92% de Taxa</span>
            </div>
            <div className="p-2 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl border border-[#0A2E5D]/10">
              <Calendar size={18} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-400">FALTAS TOLERADAS:</span>
            <span className="text-slate-500 font-bold">1 restando</span>
          </div>
        </div>

        {/* Metric 3 - Streak booster review */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 flex flex-col justify-between hover:border-[#C89B3C]/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Rendimento Médio Global</span>
              <span className="text-2xl font-serif font-black text-[#0A2E5D]">91.5 / 100</span>
            </div>
            <div className="p-2 bg-[#0A2E5D]/5 text-orange-600 rounded-xl border border-[#0A2E5D]/10">
              <Flame size={18} fill="currentColor" />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-400">DESEMPENHO ESTIMADO:</span>
            <span className="text-[#C89B3C] font-black">EXCELENTE (A)</span>
          </div>
        </div>

      </div>

      {/* SVG Graphics Week Traced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* SVG hours chart block */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">MÉTRICAS DO LMS</span>
              <h4 className="text-sm font-serif font-black text-[#0A2E5D] m-0">Gráfico de Dedicação Letiva Semanal</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold uppercase bg-emerald-50 px-2 py-0.5 rounded">
              +14% ESTÁVEL
            </span>
          </div>

          {/* Pure SVG Custom Bar Chart Drawing (Responsive & Clean) */}
          <div className="relative pt-4">
            <div className="h-44 w-full flex items-end justify-between gap-2 border-b border-gray-200 pb-2">
              {weeklyhours.map((w, idx) => {
                const heightPercent = (w.hrs / maxWeeklyHrs) * 85; 
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <span className="text-[9px] font-mono font-bold text-[#C89B3C] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {w.hrs}h
                    </span>
                    <div 
                      className="w-full bg-[#0A2E5D] rounded-t-lg group-hover:bg-[#C89B3C] transition-all duration-700"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-mono text-gray-400 mt-2 truncate w-full text-center">
                      {w.week}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between text-[8px] font-mono text-gray-400 pt-2 uppercase">
              <span>META DE Estudo Recomendada: 3 Horas / semana</span>
              <span>Visualização Completa</span>
            </div>
          </div>
        </div>

        {/* Module Benchmarks lists */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-150 text-left flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold block">Status Curricular</span>
            <h4 className="text-sm font-serif font-black text-[#0A2E5D] m-0 border-b border-gray-100 pb-2">Unidades Didácticas</h4>

            <div className="space-y-3 pt-2">
              {progressBenchmarks.map((bench, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className={`p-1 rounded-full shrink-0 mt-0.5 ${
                    bench.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <div>
                    <span className="block text-2xs font-semibold text-gray-700 leading-snug">
                      {bench.label}
                    </span>
                    {bench.status ? (
                      <span className="text-[9px] font-mono text-emerald-600">Completo • Nota: {bench.score}/100</span>
                    ) : (
                      <span className="text-[9px] font-mono text-gray-400">Pendente de avaliação</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl mt-4 text-[10px] text-slate-500 leading-normal">
            <p className="m-0 font-sans">A moderação final do curso no Huambo avalia o seu desempenho oral coletivo perante as cortes fictícias de exames.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
