import { ArrowLeft, Clock, Calendar } from 'lucide-react';

interface BlogArticlePageProps {
  params: {
    slug: string;
  };
}

export default function BlogArticlePage({ params }: BlogArticlePageProps) {
  return (
    <div id="artigo-blog-root" className="max-w-4xl mx-auto px-6 py-16 text-left space-y-8">
      <a href="/blog" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
        <ArrowLeft size={14} />
        Voltar ao Blog
      </a>

      <article className="space-y-6">
        <div className="space-y-3">
          <div className="flex gap-4 text-[10px] font-mono text-gray-400 font-bold uppercase">
            <span className="flex items-center gap-1"><Calendar size={12} /> 01 JUNHO 2026</span>
            <span className="flex items-center gap-1"><Clock size={12} /> 6 MINUTOS DE LEITURA</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#0A2E5D] leading-tight">
            How to Properly Draft Indemnity Clauses in Legal English
          </h1>
        </div>

        <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-gray-100 border border-gray-200">
          <img 
            src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800" 
            alt="Contracts"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-sm text-gray-600 leading-relaxed space-y-4 pt-4">
          <p className="font-serif italic text-gray-800 text-base leading-normal">
            "An indemnity clause is a commitment by alternative entities to bear potential losses resulting directly from transactions..."
          </p>
          <p>
            No inglês jurídico associado à elaboração contratual, as cláusulas de indenização exigem clareza absoluta na alocação de riscos. O estudo preciso desse termo garante proteção adequada às partes signatárias.
          </p>
        </div>
      </article>
    </div>
  );
}
