import { ArrowLeft, Send } from 'lucide-react';

export default function NewCourseCreatorPage() {
  return (
    <div id="new-course-creator" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <a href="/professor/cursos" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar a Cursos
        </a>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Criar Nova Disciplina Letiva</h2>
        <p className="text-xs text-gray-500">Desenhe os parâmetros gerais e configure a modalidade do novo curso.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-150 space-y-6">
        <form className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Título do Curso</label>
              <input type="text" placeholder="Ex: English for Contract Drafting" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C]" />
            </div>
            <div>
              <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Carga Horária (Ex: 36 Horas)</label>
              <input type="text" placeholder="Ex: 36 Horas" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C]" />
            </div>
          </div>

          <div>
            <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Modalidade</label>
            <select className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#C89B3C] bg-white">
              <option>Híbrido (Presencial/Ao Vivo)</option>
              <option>Online Completo (Assíncrono)</option>
            </select>
          </div>

          <button type="button" className="py-3 px-6 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors inline-flex items-center gap-1.5">
            <Send size={12} />
            Publicar Curso
          </button>
        </form>
      </div>
    </div>
  );
}
