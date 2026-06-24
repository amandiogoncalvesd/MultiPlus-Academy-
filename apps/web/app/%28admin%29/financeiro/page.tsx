import { Landmark, ArrowUpRight } from 'lucide-react';

export default function FinanceiroPage() {
  return (
    <div id="admin-financial-panel" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Fluxos de Caixa e Propinas</h2>
        <p className="text-xs text-gray-500">Histórico de inscrições confirmadas e notas de faturamento da MultiPlus Academy.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <h3 className="font-serif font-black text-[#0A2E5D] text-base">Últimas Atividades Financeiras</h3>
        
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <Landmark size={18} />
              </div>
              <div>
                <p className="font-bold text-gray-800">Inscrição Dr. António Ferreira Carvalho</p>
                <p className="text-[10px] text-gray-400 font-mono">Transferência Ao Vivo • Reconciliado</p>
              </div>
            </div>
            
            <div className="text-right font-mono">
              <p className="font-bold text-emerald-750 flex items-center justify-end text-sm">
                +450,050 Kz
                <ArrowUpRight size={14} />
              </p>
              <p className="text-[10px] text-gray-400">01 Junho 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
