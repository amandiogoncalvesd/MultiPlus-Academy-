import * as React from "react";

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2E5D]/5 via-white to-white py-24 text-left">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#0A2E5D_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A2E5D]/5 border border-[#0A2E5D]/10 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C89B3C]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0A2E5D]">Huambo Hub • Língua Inglesa & Liderança</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-[#0A2E5D] leading-[1.1] m-0">
              Transformando <br className="hidden sm:block" />
              <span className="text-[#C89B3C]">Competências</span> em <br className="hidden sm:block" />
              Oportunidades.
            </h1>
            
            <p className="text-sm text-slate-600 font-sans leading-relaxed max-w-xl m-0">
              A <strong>MultiPlus Academy</strong> dota profissionais e estudantes angolanos de proficiência de classe mundial, com foco em programas inovadores híbridos e bilingues.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a 
                href="/cursos" 
                className="px-6 py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md inline-block text-center"
              >
                Explorar Programas
              </a>
              <a 
                href="/sobre" 
                className="px-6 py-3 border border-gray-250 hover:bg-slate-50 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#0A2E5D] transition-all inline-block text-center"
              >
                Sobre Nós
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            {/* Visual branding stack with Cloudinary Logo */}
            <div className="relative w-full max-w-[360px] p-8 aspect-square rounded-[2rem] bg-gradient-to-br from-[#0A2E5D] to-[#061B37] shadow-xl flex flex-col justify-between overflow-hidden border border-white/10 text-left">
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
              
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase font-bold">MultiPlus Gold Seal</span>
                <span className="text-xs text-[#C89B3C] font-mono font-bold">ESTD 2026</span>
              </div>

              {/* Central Premium Logo */}
              <div className="relative z-10 flex flex-col items-center justify-center py-6">
                <img 
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png" 
                  alt="MultiPlus Academy" 
                  className="h-28 w-auto object-contain drop-shadow-[0_10px_20px_rgba(200,155,60,0.25)]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white m-0">Huambo Campus</h4>
                  <p className="text-[9px] text-white/50 m-0 font-sans">República de Angola</p>
                </div>
                <span className="inline-block px-2.5 py-1 rounded bg-[#C89B3C] text-slate-900 text-[10px] font-mono font-extrabold uppercase tracking-wide">
                  100% SECURE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-20 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-left space-y-3 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Destaque Académico</span>
            <h2 className="text-3xl font-serif font-black text-[#0A2E5D] m-0">Programas de Auto-Rendimento</h2>
            <p className="text-xs text-gray-500 font-sans leading-relaxed m-0">
              Desenhamos currículos dinâmicos e adaptados às nuances competitivas do mercado laboral de Angola e internacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-150 p-6 rounded-2xl relative shadow-[0_10px_25px_rgba(10,46,93,0.015)]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C89B3C] block mb-2">Inglês Corporativo</span>
              <h3 className="text-lg font-serif font-bold text-[#0A2E5D] mb-2">English for the Legal Field</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans mb-4">
                Programa pioneiro dedicado a advogados, investigadores jurídicos e consultores em Angola. Foco na terminologia legal bilingue e contratos internacionais.
              </p>
              <a href="/cursos" className="text-xs font-mono font-bold text-[#0A2E5D] hover:text-[#C89B3C] border-b border-dashed border-[#0A2E5D] pb-0.5">Saber mais →</a>
            </div>

            <div className="bg-white border border-gray-150 p-6 rounded-2xl relative shadow-[0_10px_25px_rgba(10,46,93,0.015)]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C89B3C] block mb-2">Linguística Básica-Avançada</span>
              <h3 className="text-lg font-serif font-bold text-[#0A2E5D] mb-2">Inglês Geral Prático</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans mb-4">
                Para profissionais em transição que necessitam de bases orais e escritas eficientes no inglês empresarial, acelerando as conexões inter-continentais.
              </p>
              <a href="/cursos" className="text-xs font-mono font-bold text-[#0A2E5D] hover:text-[#C89B3C] border-b border-dashed border-[#0A2E5D] pb-0.5">Saber mais →</a>
            </div>

            <div className="bg-white border border-gray-150 p-6 rounded-2xl relative shadow-[0_10px_25px_rgba(10,46,93,0.015)]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C89B3C] block mb-2">Credenciais Académicas</span>
              <h3 className="text-lg font-serif font-bold text-[#0A2E5D] mb-2">IELTS / TOEFL Prep</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans mb-4">
                Treino exaustivo para exames de certificações exigidos para bolsas de estudo no estrangeiro, mestrados, doutoramentos e projetos transfronteiriços.
              </p>
              <a href="/cursos" className="text-xs font-mono font-bold text-[#0A2E5D] hover:text-[#C89B3C] border-b border-dashed border-[#0A2E5D] pb-0.5">Saber mais →</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
