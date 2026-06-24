import { FileCheck, BookOpen, GraduationCap, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-left space-y-6">
          <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">A Maior Referência em Inglês Jurídico</span>
          <h1 className="text-4xl sm:text-5xl font-serif font-black text-[#0A2E5D] leading-tight leading-none">
            Unlock the Language of Global Legal Systems ⚖️
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Formações imersivas e especializadas direcionadas a advogados, juízes e juristas de elite em Angola. Descubra a metodologia de ensino ativo e domine a oratória forense internacional.
          </p>
          <div className="flex gap-4">
            <a href="/cursos" className="px-6 py-3 bg-[#0A2E5D] text-white font-mono font-bold uppercase text-xs rounded-xl tracking-wider hover:bg-[#123C73] transition-colors">
              Explorar Cursos
            </a>
            <a href="/contactos" className="px-6 py-3 border border-gray-350 text-[#0A2E5D] font-mono font-semibold uppercase text-xs rounded-xl tracking-wider hover:bg-gray-100 transition-colors">
              Falar Connosco
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600" 
              alt="Legal Systems"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section className="bg-white py-16 border-y border-gray-150">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Diferenciais Pedagógicos</h2>
            <p className="text-xs text-gray-400">QUALIDADE CERTIFICADA PELA MULTIPLUS ACADEMY</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8F8F6] border border-gray-100 text-left space-y-4">
              <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
                <BookOpen size={20} />
              </div>
              <h3 className="font-serif font-bold text-[#0A2E5D]">Vocabulário Técnico Real</h3>
              <p className="text-xs text-gray-500 leading-normal">Foco prático em contratos de joint ventures, arbitragem corporativa e redação processual.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F8F6] border border-gray-100 text-left space-y-4">
              <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
                <GraduationCap size={20} />
              </div>
              <h3 className="font-serif font-bold text-[#0A2E5D]">Ementa Integrada</h3>
              <p className="text-xs text-gray-500 leading-normal">Módulos adaptados à transição económica de Angola e regras internacionais de compliance.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F8F6] border border-gray-100 text-left space-y-4">
              <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl inline-block">
                <FileCheck size={20} />
              </div>
              <h3 className="font-serif font-bold text-[#0A2E5D]">Certificação Nacional</h3>
              <p className="text-xs text-gray-500 leading-normal">Diplomas auditáveis em blockchain interna validados pela diretoria e homologados para concursos públicos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
