import * as React from "react";

export default function BlogPage() {
  const posts = [
    {
      title: "Como se Preparar para Ambientes Jurídicos Bilingues",
      date: "02 de Junho, 2026",
      summary: "Descubra os principais desafios enfrentados por juristas angolanos ao lidar com contratos escritos na Língua Inglesa."
    },
    {
      title: "O Crescimento Económico do Huambo e Novas Demandas de Emprego",
      date: "28 de Maio, 2026",
      summary: "Uma análise profunda sobre a ascensão de novas hubs produtivas e como a qualificação bilingue desbloqueia vagas seniores."
    }
  ];

  return (
    <div className="py-20 text-left max-w-5xl mx-auto px-4 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#C89B3C]">Conteúdo Informativo</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D] m-0">O Nosso Blog Executivo</h1>
        <p className="text-sm text-slate-600 font-sans m-0">Artigos de fundo, análises de mercado linguístico e novidades académicas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((p, idx) => (
          <article key={idx} className="bg-white border border-gray-150 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-gray-400 font-bold block">{p.date}</span>
              <h3 className="text-lg font-serif font-black text-[#0A2E5D] leading-snug m-0">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans m-0">{p.summary}</p>
            </div>
            <div>
              <a href="#" className="text-xs font-mono font-bold text-[#C89B3C] hover:text-[#9F7523]">Ler Artigo Completo →</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
