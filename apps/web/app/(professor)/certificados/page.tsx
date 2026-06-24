import { Award, CheckCircle2 } from 'lucide-react';

export default function ProfessorCertificadosPage() {
  return (
    <div id="professor-certificados-root" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Emissão de Diplomas</h2>
        <p className="text-xs text-gray-500">Valide os requisitos letivos mínimos e emita certificados oficiais auditados.</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <h3 className="font-serif font-black text-[#0A2E5D] text-base">Alunos Aptos a Receber Diploma</h3>
        
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-gray-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-700" />
              Dr. António Ferreira Carvalho
            </h4>
            <p className="text-gray-400 text-[10px]">66h Assistidas • Média: 18.2 Valores • Aprovado</p>
          </div>
          <button className="px-4 py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1">
            <Award size={12} />
            Homologar e Emitir
          </button>
        </div>
      </div>
    </div>
  );
}
