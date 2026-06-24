import { Edit, Globe } from 'lucide-react';

export default function AdminStaticPaginasPage() {
  return (
    <div id="admin-static-pages-manager" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Gerir Páginas do Website</h2>
        <p className="text-xs text-gray-500">Mude secções de texto e cabeçalhos visíveis das landing pages no domínio público.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <h3 className="font-serif font-black text-[#0A2E5D] text-base mb-2">Páginas de Layout Integrado</h3>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl">
              <Globe size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800">Sobre Nós (Ementa de Identidade Corporativa)</p>
              <p className="text-[10px] text-gray-400 font-mono">Última edição: Há 4 dias por Dra. Esmeralda</p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 border border-gray-200 hover:bg-white text-gray-800 font-mono text-[9px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1">
            <Edit size={10} />
            Editar Texto
          </button>
        </div>
      </div>
    </div>
  );
}
