import * as React from "react";

export default function CursosPage() {
  const cursos = [
    {
      title: "English for the Legal Field in Angola",
      modality: "Híbrido (Presencial & Online)",
      duration: "120 Horas",
      specs: "Análise de contratos bilingues, terminologias civis angolanas e arbitragem internacional."
    },
    {
      title: "Inglês Geral Avançado e Conversação",
      modality: "Online Síncrono / Presencial",
      duration: "90 Horas",
      specs: "Orientação intensiva na fluência de debate, modulação de sotaques e oratória executiva."
    },
    {
      title: "Corporate English Boost",
      modality: "In-Company",
      duration: "60 Horas",
      specs: "Escrita de relatórios, técnicas de pitch, negociações internacionais e apresentações executivas."
    }
  ];

  return (
    <div className="py-20 text-left max-w-5xl mx-auto px-4 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Catálogo Académico</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D] m-0">Nossos Cursos de Especialidade</h1>
        <p className="text-sm text-slate-600 font-sans m-0">
          Oferecemos caminhos estruturados que respondem às maiores exigências do mercado corporativo moderno.
        </p>
      </div>

      <div className="space-y-6">
        {cursos.map((c, idx) => (
          <div key={idx} className="bg-white border border-gray-150 p-8 rounded-3xl relative shadow-sm hover:border-[#C89B3C] hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="inline-block px-2.5 py-1 bg-[#0A2E5D]/5 rounded-lg text-[9px] font-mono font-bold text-[#0A2E5D] uppercase tracking-wider">{c.modality}</span>
              <h3 className="text-xl font-serif font-black text-[#0A2E5D] m-0">{c.title}</h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed m-0 max-w-xl">{c.specs}</p>
            </div>
            <div className="flex-shrink-0 flex flex-col justify-end text-left sm:text-right">
              <span className="text-[10px] text-gray-400 font-mono block">CARGA HORÁRIA</span>
              <span className="text-base font-serif font-black text-[#C89B3C]">{c.duration}</span>
              <button className="mt-3 px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors">Ver Detalhes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
