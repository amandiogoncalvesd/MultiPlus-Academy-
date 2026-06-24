import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function EventosPage() {
  return (
    <div id="eventos-root" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">IMERSÕES & SEMINÁRIOS</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Oficinas Práticas e Webinars</h1>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Participe nos nossos eventos presenciais no Huambo e sessões online de simulação oratória forense internacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden flex flex-col justify-between">
          <div className="p-8 text-left space-y-4">
            <span className="text-[9px] font-mono font-bold text-white bg-[#C89B3C] px-2 py-0.5 rounded uppercase">Inscrições Abertas</span>
            <h3 className="font-serif font-black text-[#0A2E5D] text-xl leading-snug">Imersão Presencial: Oratória de Contencioso Forense</h3>
            
            <div className="space-y-1.5 pt-2 text-[11px] text-gray-500 font-mono">
              <p className="flex items-center gap-1.5"><Calendar size={12} className="text-[#C89B3C]" /> 18 DE JULHO, 2026 • 09:00 - 17:00</p>
              <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#C89B3C]" /> MULTIPLUS ACADEMY HUAMBO HQ</p>
            </div>
            
            <p className="text-xs text-gray-500 leading-normal">
              Oficina essencial teórica e prática simulando a defesa de teses financeiras perante árbitros e juízes internacionais de língua inglesa.
            </p>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <a href="/eventos/imersao-contencioso" className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-[#C89B3C] hover:text-[#0A2E5D] transition-colors">
              Garantir Bilhete
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
