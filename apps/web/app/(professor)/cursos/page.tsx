import { BookOpen, Plus } from 'lucide-react';

export default function ProfessorCoursesPage() {
  return (
    <div id="professor-cursos-root" className="space-y-8 text-left">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Gerir Meus Cursos</h2>
          <p className="text-xs text-gray-500">Desenhe e modifique o conteúdo programático das suas disciplinas jurídicas.</p>
        </div>
        <a href="/professor/cursos/novo" className="px-4 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
          <Plus size={14} />
          Criar Novo Curso
        </a>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150">
        <h3 className="font-serif font-black text-[#0A2E5D] text-base mb-4">Lista de Cursos e Turmas Ativas</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-gray-100 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] bg-[#C89B3C]/10 text-[#C89B3C] font-mono font-bold px-1.5 py-0.5 rounded uppercase">Turma Activa</span>
              <h4 className="font-serif font-bold text-gray-800 text-sm mt-1">English for the Legal Field in Angola</h4>
              <p className="text-gray-400 text-[10px]">12 Módulos • 72 Horas • 42 Alunos Inscritos</p>
            </div>
            <div className="flex gap-2">
              <a href="/professor/cursos/eng-legal/modulos" className="px-3.5 py-1.5 border border-gray-250 text-gray-700 font-mono text-[9px] font-bold uppercase rounded-lg hover:bg-gray-100 transition-colors">Modificar Grade</a>
              <a href="/professor/cursos/eng-legal/alunos" className="px-3.5 py-1.5 bg-[#0A2E5D] text-white font-mono text-[9px] font-bold uppercase rounded-lg hover:bg-[#123C73] transition-colors">Ver Alunos</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
