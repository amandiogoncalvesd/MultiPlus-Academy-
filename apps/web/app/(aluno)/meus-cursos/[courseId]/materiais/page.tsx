import { FileText, Download, ArrowLeft } from 'lucide-react';

interface MaterialsPageProps {
  params: {
    courseId: string;
  };
}

export default function MaterialsPage({ params }: MaterialsPageProps) {
  return (
    <div id="materiais-view-root" className="space-y-8 text-left">
      <div className="flex items-center gap-2">
        <a href={`/meus-cursos/${params.courseId}`} className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar ao Player
        </a>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Doutrinas e Materiais Complementares</h2>
        <p className="text-xs text-gray-500">Transfira os modelos de contratos e glossários técnicos disponibilizados pelo corpo docente.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4">
        <h3 className="font-serif font-black text-[#0A2E5D] text-base">Ficheiros Disponíveis</h3>
        
        <div className="space-y-3">
          <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-gray-100 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
                <FileText size={18} />
              </div>
              <div>
                <p className="font-bold text-gray-800">Glossary of English Contractual Terms.pdf</p>
                <p className="text-[10px] text-gray-400 font-mono">PDF • 3.2 MB • Adicionado em 01/06/2026</p>
              </div>
            </div>
            <button className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-[#0A2E5D] rounded-xl transition-all">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
