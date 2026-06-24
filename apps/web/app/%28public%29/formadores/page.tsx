import { Award, ShieldCheck } from 'lucide-react';

export default function FormadoresPage() {
  return (
    <div id="formadores-root" className="max-w-7xl mx-auto px-6 py-16 space-y-12 text-left">
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-[#C89B3C] uppercase block">CORPO DOCENTE</span>
        <h1 className="text-4xl font-serif font-black text-[#0A2E5D]">Os Nossos Formadores</h1>
        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          Juristas experientes e linguistas certificados prontos a conduzir o seu percurso de aprendizagem de forma estrita e imersiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden flex flex-col justify-between">
          <div className="p-6 text-left space-y-4">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=350" 
                alt="Prof. Dra. Esmeralda Bruno Sumbelelo"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h3 className="font-serif font-black text-[#0A2E5D] text-lg block">Prof. Esmeralda Bruno Sumbelelo</h3>
              <p className="text-[10px] text-[#C89B3C] font-mono uppercase font-bold">Diretora Pedagógica & Tutora de Inglês Jurídico</p>
            </div>
            <p className="text-xs text-gray-500 leading-normal">
              Especialista em Common Law e assessoria de contencioso corporativo com vasta experiência de formação académica em Angola e no exterior.
            </p>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <a href="/formadores/esmeralda-sumbelelo" className="block text-center py-2 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-colors">
              Conhecer Percurso
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
