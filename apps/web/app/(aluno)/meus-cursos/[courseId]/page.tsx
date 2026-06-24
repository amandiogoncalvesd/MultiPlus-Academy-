import { Play, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ClassroomPageProps {
  params: {
    courseId: string;
  };
}

export default function ClassroomPage({ params }: ClassroomPageProps) {
  return (
    <div id="classroom-player-root" className="space-y-8 text-left">
      <div className="flex items-center gap-2">
        <a href="/meus-cursos" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar a Meus Cursos
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lesson Player (main) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="aspect-video bg-[#0A2E5D] rounded-3xl border border-[#C89B3C]/20 flex items-center justify-center relative overflow-hidden text-center p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <span className="text-[10px] bg-red-650 text-white font-mono font-bold uppercase py-0.5 px-2 rounded">AULA EM VÍDEO COMPACTA</span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white m-0">Introduction to Contract Drafting</h2>
              <p className="text-xs text-white/70 max-w-sm mx-auto">Nesta aula introdutória abordamos os termos-chave "Whereas" e "Schedules".</p>
              <button className="px-6 py-3 bg-[#C89B3C] text-white font-mono font-bold uppercase text-xs rounded-xl tracking-wider hover:bg-[#D4A747] transition-all flex items-center gap-2 mx-auto">
                <Play size={14} fill="currentColor" />
                Iniciar Reprodução
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-3">
            <h3 className="font-serif font-black text-[#0A2E5D] text-lg">Módulo 1: Contractual Lexicon</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Foco exclusivo no vocabulário prático e semântica jurídica anglo-saxónica usada por advogados societários em transações internacionais de investimento e joint-ventures na República de Angola.
            </p>
          </div>
        </div>

        {/* Sidebar course outline */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h4 className="font-serif font-black text-[#0A2E5D] text-sm">Estrutura de Aulas</h4>
            <a href={`/meus-cursos/${params.courseId}/materiais`} className="text-[10px] font-mono text-[#C89B3C] hover:underline font-bold uppercase">Materiais</a>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-800">1. Termos Práticos Fundamentais</p>
                <p className="text-[10px] text-gray-405">Concluída • 1h 15m</p>
              </div>
            </div>

            <div className="p-3 bg-[#0A2E5D]/5 rounded-xl border border-[#0A2E5D]/10 flex items-center gap-3">
              <Play size={16} className="text-[#C89B3C] flex-shrink-0" />
              <div>
                <p className="font-bold text-[#0A2E5D]">2. Introduction to Contract Drafting</p>
                <p className="text-[10px] text-gray-405 font-mono">Aula Atual • 45m</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
