import { ArrowLeft, Calendar, MapPin, Ticket } from 'lucide-react';

interface EventDetailPageProps {
  params: {
    slug: string;
  };
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <div id="evento-detalhe-root" className="max-w-4xl mx-auto px-6 py-16 text-left space-y-12">
      <a href="/eventos" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
        <ArrowLeft size={14} />
        Voltar para Eventos
      </a>

      <div className="bg-[#0A2E5D] text-white p-8 sm:p-12 rounded-3xl border border-[#C89B3C]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">IMERSÃO CIENTÍFICA</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-white m-0">Oratória de Contencioso Forense</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-150 space-y-6">
          <h3 className="font-serif font-black text-[#0A2E5D] text-xl">Detalhes Gerais do Evento</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Uma abordagem completa sobre a oratória em tribunais internacionais e procedimentos arbitrais. O participante aprenderá, passo a passo, a estruturar o 'Opening Statement' de maneira eloquente e convincente em inglês jurídico.
          </p>
        </div>

        <div className="md:col-span-4 bg-[#F8F8F6] p-6 rounded-3xl border border-gray-200 space-y-4">
          <h4 className="font-serif font-black text-[#0A2E5D] text-sm">Informações Úteis</h4>
          <div className="space-y-4 text-[11px] text-gray-600 font-mono">
            <p className="flex items-center gap-2"><Calendar size={14} className="text-[#C89B3C]" /> 18 JULHO 2026</p>
            <p className="flex items-center gap-2"><MapPin size={14} className="text-[#C89B3C]" /> HUAMBO, ANGOLA</p>
          </div>
          <button className="w-full py-3 bg-[#C89B3C] hover:bg-[#D4A747] text-white text-xs font-mono font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2">
            <Ticket size={14} />
            Efetuar Inscrição
          </button>
        </div>
      </div>
    </div>
  );
}
