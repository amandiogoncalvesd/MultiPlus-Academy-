import { ShieldCheck, Book, ArrowLeft } from 'lucide-react';

interface CourseDetailPageProps {
  params: {
    slug: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return (
    <div id="curso-detalhe-root" className="max-w-7xl mx-auto px-6 py-16 text-left space-y-12">
      <a href="/cursos" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors mb-4">
        <ArrowLeft size={14} />
        Voltar aos Cursos
      </a>

      <div className="bg-[#0A2E5D] text-white p-8 sm:p-12 rounded-3xl border border-[#C89B3C]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">CÓDIGO: {params.slug.toUpperCase()}</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-white m-0">English for the Legal Field in Angola</h1>
          <p className="text-sm text-white/80 leading-relaxed">
            Domine os meandros da terminologia contratual internacional e da oratória de contencioso em fóruns internacionais, com enquadramento na nova realidade empresarial de Angola.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-150 space-y-6">
          <h3 className="font-serif font-black text-[#0A2E5D] text-xl">Estrutura Programática</h3>
          <ul className="space-y-4 text-xs font-sans text-gray-650 leading-relaxed">
            <li className="flex gap-3">
              <span className="inline-block bg-[#0A2E5D]/5 text-[#C89B3C] font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">1</span>
              <div>
                <p className="font-bold text-gray-800">Introduction to Common Law & Global Legal English</p>
                <p className="text-gray-500 text-[11px]">Fundamentos de redação legal, estruturas cognitivas judiciais e vocabulário civil vs. criminal.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="inline-block bg-[#0A2E5D]/5 text-[#C89B3C] font-mono font-bold h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">2</span>
              <div>
                <p className="font-bold text-gray-800">Contract Drafting and Joint Ventures</p>
                <p className="text-gray-500 text-[11px]">Redação de cláusulas de indenização, confidencialidade, força maior e foros de arbitragem internacional.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
