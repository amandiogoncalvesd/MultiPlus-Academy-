import { ClipboardCheck, Sparkles } from 'lucide-react';

export default function ProfessorAvaliacoesPage() {
  return (
    <div id="professor-avaliacoes-root" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Avaliações e Trabalhos</h2>
        <p className="text-xs text-gray-500">Corrija as redações e simulações processuais submetidas pelos seus alunos jurídicos.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden text-xs font-sans">
        <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase">
          <span className="font-bold">Aluno / Disciplina</span>
          <span className="font-bold">Estado de Correção</span>
        </div>

        <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-gray-700">
          <div className="space-y-1">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <ClipboardCheck size={14} className="text-[#C89B3C]" />
              Dr. António Ferreira Carvalho
            </h4>
            <p className="text-gray-500 text-[11px]">Trabalho: Drafting Indemnity Clauses (Legal English Angola)</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-mono text-[9px] font-bold uppercase rounded-lg transition-colors">Ver Grelha</button>
            <button className="px-3.5 py-1.5 bg-[#0A2E5D] text-white font-mono text-[9px] font-bold uppercase rounded-lg hover:bg-[#123C73] transition-colors flex items-center gap-1">
              <Sparkles size={10} />
              Atribuir Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
