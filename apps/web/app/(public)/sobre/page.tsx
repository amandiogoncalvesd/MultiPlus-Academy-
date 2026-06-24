import * as React from "react";

export default function SobrePage() {
  return (
    <div className="py-20 text-left max-w-5xl mx-auto px-4 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Quem Somos</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D] m-0">A Nossa História</h1>
        <p className="text-sm text-slate-600 leading-relaxed font-sans max-w-3xl m-0">
          A MultiPlus Academy nasceu com a visão de preencher lacunas de proficiência profissional e linguística em Angola, fornecendo metodologias híbridas amparadas por tecnologias de pontas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-6">
        <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-3">
          <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Missão</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans m-0">
            Capacitar cidadãos e corporações através do domínio linguístico prático e do desenvolvimento contínuo de soft & hard skills.
          </p>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-3">
          <h3 className="text-lg font-serif font-black text-[#0A2E5D] m-0">Visão</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans m-0">
            Ser reconhecida como a referência nacional número um em inovação letiva para o ensino da Língua Inglesa Aplicada e Liderança Corporativa.
          </p>
        </div>
      </div>
    </div>
  );
}
