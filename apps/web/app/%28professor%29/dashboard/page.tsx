import { Users, BookOpen, Clock, FileBadge } from 'lucide-react';

export default function ProfessorDashboardPage() {
  return (
    <div id="professor-dashboard-root" className="space-y-8 text-left">
      <div className="bg-[#0A2E5D] text-white p-6 sm:p-8 rounded-3xl border border-[#C89B3C]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Boas-vindas ao Painel Docente</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-white m-0">Olá, Prof. Dra. Esmeralda Bruno 👋</h2>
          <p className="text-xs text-white/75 max-w-xl">
            Faça a gestão dos seus alunos ativos, avalie redações jurídicas submetidas e controle as emissões de certificados oficiais no Huambo.
          </p>
        </div>
      </div>

      {/* KPI stats grids */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-gray-150 text-left">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Total Alunos Orientados</span>
          <span className="text-2xl font-serif font-black text-[#0A2E5D]">104 Alunos</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150 text-left">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Turmas Ativas no Huambo</span>
          <span className="text-2xl font-serif font-black text-[#0A2E5D]">3 Turmas</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150 text-left">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Avaliações Pendentes</span>
          <span className="text-2xl font-serif font-black text-red-650">8 Redações</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150 text-left">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Certificados Homologados</span>
          <span className="text-2xl font-serif font-black text-[#C89B3C]">88 Emitidos</span>
        </div>
      </div>
    </div>
  );
}
