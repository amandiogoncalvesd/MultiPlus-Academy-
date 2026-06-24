import { Calendar, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  return (
    <div id="blog-root" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">DICAS E ATUALIDADE</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Doutrinas & Blog</h1>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Leia os últimos artigos pedagógicos escritos pelo nosso corpo docente e turbine a sua oratória forense com termos essenciais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="p-6 text-left space-y-4">
            <span className="text-[9px] font-mono font-bold text-[#C89B3C] uppercase flex items-center gap-1">
              <Calendar size={10} />
              01 DE JUNHO, 2026
            </span>
            <h3 className="font-serif font-bold text-[#0A2E5D] text-base leading-snug">The Power of Indentification in Joint Ventures Contracts</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Como redigir corretamente a cláusula de limitação de responsabilidade civil em contratos mercantis de direito angolano.
            </p>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <a href="/blog/contracts-joint-ventures" className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-[#C89B3C] hover:text-[#0A2E5D] transition-colors">
              Continuar Leitura
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
