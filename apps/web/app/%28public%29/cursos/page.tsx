import { BookOpen, GraduationCap, Clock } from 'lucide-react';

export default function CursosPage() {
  return (
    <div id="cursos-listagem" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">OFERTA FORMATIVA</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Cursos de Especialização</h1>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Formações desenhadas especificamente para juristas de alto nível. Estude em regime híbrido ou online completo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="p-8 bg-white rounded-3xl border border-gray-150 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-1 bg-[#0A2E5D]/5 text-[#C89B3C] font-mono text-[9px] font-bold uppercase rounded">Híbrido (Huambo/Live)</span>
            <h3 className="text-2xl font-serif font-black text-[#0A2E5D]">English for the Legal Field in Angola</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              O programa definitivo de inglês jurídico cobrindo elaboração de contratos, direito societário angolano em inglês e oratória forense internacional.
            </p>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
            <span className="text-xs font-mono font-bold text-gray-400">12 Módulos • 72 Horas</span>
            <a href="/cursos/eng-legal-angola" className="px-4 py-2 bg-[#0A2E5D] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-lg hover:bg-[#123C73] transition-all">Ver Detalhes</a>
          </div>
        </div>
      </div>
    </div>
  );
}
