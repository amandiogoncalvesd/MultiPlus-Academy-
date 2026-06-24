import { Plus, Tag } from 'lucide-react';

export default function AdminEventosConteudoPage() {
  return (
    <div id="admin-eventos-manager" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Gerir Eventos Públicos</h2>
          <p className="text-xs text-gray-500">Adicione novas imersões presenciais ou seminários oratórios síncronos.</p>
        </div>
        <button className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
          <Plus size={14} />
          Novo Evento
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl">
              <Tag size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800">Imersão: Oratória de Contencioso Forense (Huambo)</p>
              <p className="text-[10px] text-gray-400 font-mono">Agendado para 18 de Julho, 2026</p>
            </div>
          </div>
          <button className="text-[10px] font-mono text-gray-400 hover:text-red-650 uppercase font-bold">Cancelar Evento</button>
        </div>
      </div>
    </div>
  );
}
