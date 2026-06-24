import { ArrowLeft, Award, BookOpen, GraduationCap } from 'lucide-react';

interface FormadorDetailPageProps {
  params: {
    slug: string;
  };
}

export default function FormadorDetailPage({ params }: FormadorDetailPageProps) {
  return (
    <div id="formador-detalhe-root" className="max-w-7xl mx-auto px-6 py-16 text-left space-y-12">
      <a href="/formadores" className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors mb-4">
        <ArrowLeft size={14} />
        Voltar à listagem
      </a>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Photo Container */}
        <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-gray-150 text-center space-y-4">
          <div className="aspect-[4/5] rounded-2xl bg-gray-100 overflow-hidden border border-gray-100 relative">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=350" 
              alt="Prof. Dra. Esmeralda Bruno Sumbelelo"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <h3 className="font-serif font-black text-[#0A2E5D] text-lg">Esmeralda B. Sumbelelo</h3>
            <p className="text-[9px] font-mono font-bold text-[#C89B3C] uppercase tracking-wider">REG. IDENT: MPA-{params.slug.substring(0, 4).toUpperCase()}</p>
          </div>
        </div>

        {/* Info Bio container */}
        <div className="md:col-span-8 bg-white p-8 rounded-3xl border border-gray-150 space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <span className="text-[10px] font-mono font-bold uppercase text-gray-400">Currículo Académico</span>
            <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Diretora Pedagógica da MultiPlus Academy</h2>
          </div>

          <div className="text-xs text-gray-600 space-y-4 leading-relaxed">
            <p>
              A Prof. Esmeralda Bruno Sumbelelo é a coordenadora principal do programa de inglês para juristas, tendo focado a sua atividade docente na aceleração profissional de magistrados e peritos judiciais.
            </p>
            <p>
              Com doutrinas direcionadas à redação forense internacional e oratória do contencioso corporativo em fóruns multilaterais, o seu método de ensino foca na coerência prática e na aplicação imediata das regras de negociação da Common Law.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
