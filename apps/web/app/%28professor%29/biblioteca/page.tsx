import { FilePlus, FileText } from 'lucide-react';

export default function ProfessorBibliotecaPage() {
  return (
    <div id="professor-biblioteca-root" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Biblioteca de Recursos</h2>
          <p className="text-xs text-gray-500">Faça o upload de novos PDFs e glossários de inglês forense para proveito coletivo.</p>
        </div>
        <button className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
          <FilePlus size={14} />
          Fazer Carregamento
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800">Glossary of English Contractual Terms.pdf</p>
              <p className="text-[10px] text-gray-400 font-mono">PDF • 3.2 MB</p>
            </div>
          </div>
          <button className="text-[10px] font-mono text-gray-400 hover:text-red-650 uppercase font-bold">Arquivar</button>
        </div>
      </div>
    </div>
  );
}
