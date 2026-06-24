import { ArrowLeft, Plus } from 'lucide-react';

interface ModulosPageProps {
  params: {
    courseId: string;
  };
}

export default function ModulosPage({ params }: ModulosPageProps) {
  return (
    <div id="course-modulos-edit" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <a href={`/professor/cursos/${params.courseId}`} className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar a Gerir Curso
        </a>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Conteúdo Programático ({params.courseId.toUpperCase()})</h2>
          <p className="text-xs text-gray-500">Desenhe os módulos sequenciais e insira links complementares.</p>
        </div>
        <button className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
          <Plus size={14} />
          Adicionar Módulo
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div>
            <span className="font-mono font-bold text-[#C89B3C] text-[10px]">MÓDULO 1</span>
            <p className="font-serif font-bold text-gray-800 text-sm mt-0.5">Introduction to Common Law & Global Legal English</p>
          </div>
          <button className="text-[10px] font-mono text-gray-400 hover:text-red-650 uppercase font-bold">Remover</button>
        </div>
      </div>
    </div>
  );
}
