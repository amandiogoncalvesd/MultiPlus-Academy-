import { Info, ShieldCheck, Users } from 'lucide-react';

export default function SobreNosPage() {
  return (
    <div id="sobre-nos-page" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-4">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">A NOSSA ESSÊNCIA</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Sobre a MultiPlus Academy</h1>
        <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
          Fundada no Huambo, a MultiPlus Academy nasceu com o firme propósito de elevar os padrões de formação técnica em direito e oratória jurídica em Angola, unindo a excelência académica nacional com as exigências forenses internacionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <div className="p-6 bg-white rounded-3xl border border-gray-150 space-y-4">
          <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-serif font-bold text-[#0A2E5D] text-base">Rigor Académico</h3>
          <p className="text-xs text-gray-500 leading-normal">
            Garantia de coerência pedagógica supervisionada pela Dra. Esmeralda Sumbelelo.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-gray-150 space-y-4">
          <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
            <Users size={20} />
          </div>
          <h3 className="font-serif font-bold text-[#0A2E5D] text-base">Membro e Comunidade</h3>
          <p className="text-xs text-gray-500 leading-normal">
            Mais de 100 juristas formados e conectados na nossa rede interna de diplomados.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-gray-150 space-y-4">
          <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
            <Info size={20} />
          </div>
          <h3 className="font-serif font-bold text-[#0A2E5D] text-base">Impacto Internacional</h3>
          <p className="text-xs text-gray-500 leading-normal">
            Foco no domínio linguístico internacional da Common Law.
          </p>
        </div>
      </div>
    </div>
  );
}
