import { Plus, Folder } from 'lucide-react';

export default function AdminBlogConteudoPage() {
  return (
    <div id="admin-blog-manager" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Gerir Artigos</h2>
          <p className="text-xs text-gray-500">Crie, edite e oculte artigos de blog sobre o inglês jurídico em Angola.</p>
        </div>
        <button className="px-4 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
          <Plus size={14} />
          Escrever Novo
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-4 text-xs font-sans">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl">
              <Folder size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800">The Power of Indentification in Joint Ventures Contracts</p>
              <p className="text-[10px] text-gray-400 font-mono">Publicado em 01/06/2026</p>
            </div>
          </div>
          <button className="text-[10px] font-mono text-gray-400 hover:text-red-650 uppercase font-bold">Inativar</button>
        </div>
      </div>
    </div>
  );
}
