import { BookOpen } from 'lucide-react';

export default function StudentCoursesPage() {
  return (
    <div id="meus-cursos-root" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Meus Cursos Inscritos</h2>
        <p className="text-xs text-gray-500">Selecione uma turma activa para entrar na sala de aula digital e verificar os seus módulos letivos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-gray-150 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[9px] font-bold uppercase rounded">TURMA ATIVA</span>
            <h3 className="text-xl font-serif font-black text-[#0A2E5D]">English for the Legal Field in Angola</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Domínio completo da linguagem jurídica de contratos, oratória forense, arbitragem societária internacional e termos de compliance.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-mono text-gray-400">Progresso: 66%</span>
            <a href="/meus-cursos/eng-legal" className="px-4 py-2 bg-[#0A2E5D] text-white font-mono font-bold uppercase text-[9px] tracking-wider rounded-lg hover:bg-[#123C73] transition-all">
              Aceder às Aulas
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
