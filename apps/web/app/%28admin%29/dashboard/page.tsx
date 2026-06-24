import { Users, Banknote, ShieldAlert, Sparkles } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div id="admin-dashboard-root" className="space-y-8 text-left">
      <div className="bg-[#0A2E5D] text-white p-6 sm:p-8 rounded-3xl border border-[#C89B3C]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Painel Executivo Principal</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-white m-0">Consola Superior Administrativa 👋</h2>
          <p className="text-xs text-white/75 max-w-xl">
            Tenha uma visão holística e imediata do total de propinas recolhidas, registos de novos alunos no Huambo e estado do servidor da API NestJS.
          </p>
        </div>
      </div>

      {/* Stats KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
        <div className="p-5 rounded-2xl bg-white border border-gray-150">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Membros Submetidos</span>
          <span className="text-2xl font-serif font-black text-[#0A2E5D]">104 Utilizadores</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Liquidações Mensais</span>
          <span className="text-2xl font-serif font-black text-emerald-700">12,400,000 Kz</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Avisos do Servidor</span>
          <span className="text-2xl font-serif font-black text-[#C89B3C]">0 Alertas</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-150">
          <span className="text-[9px] font-mono text-gray-400 block uppercase mb-1">Novos Leads</span>
          <span className="text-2xl font-serif font-black text-[#0A2E5D]">14 Inscrições</span>
        </div>
      </div>
    </div>
  );
}
