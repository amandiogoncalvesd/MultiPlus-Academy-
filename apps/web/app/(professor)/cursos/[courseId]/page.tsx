import { ArrowLeft, BookOpen, Settings } from 'lucide-react';

interface ProfCourseDetailPageProps {
  params: {
    courseId: string;
  };
}

export default function ProfCourseDetailPage({ params }: ProfCourseDetailPageProps) {
  return (
    <div id="prof-course-detail-view" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <a href="/professor/cursos" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar aos Cursos
        </a>
      </div>

      <div className="bg-[#0A2E5D] text-white p-8 rounded-3xl border border-[#C89B3C]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">CÓDIGO CURSO: {params.courseId.toUpperCase()}</span>
          <h2 className="text-2xl font-serif font-black text-white m-0">English for the Legal Field in Angola</h2>
          <p className="text-xs text-white/75 max-w-xl">
            Modifique a grade letiva desta disciplina jurídica corporativa e verifique as avaliações de redação geral.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href={`/professor/cursos/${params.courseId}/modulos`} className="p-6 bg-white rounded-3xl border border-gray-150 hover:shadow-sm transition-shadow flex items-center justify-between text-xs">
          <div>
            <h4 className="font-serif font-bold text-gray-800 text-sm">Estruturar Módulos</h4>
            <p className="text-gray-400">Adicione leituras e tópicos de aula</p>
          </div>
          <BookOpen size={20} className="text-[#C89B3C]" />
        </a>

        <a href={`/professor/cursos/${params.courseId}/alunos`} className="p-6 bg-white rounded-3xl border border-gray-150 hover:shadow-sm transition-shadow flex items-center justify-between text-xs">
          <div>
            <h4 className="font-serif font-bold text-gray-800 text-sm">Alunos Matriculados</h4>
            <p className="text-gray-400">Acompanhar progresso letivo individual</p>
          </div>
          <Settings size={20} className="text-[#C89B3C]" />
        </a>
      </div>
    </div>
  );
}
