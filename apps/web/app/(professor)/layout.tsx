import { ReactNode } from 'react';
import { LayoutDashboard, BookOpen, FolderOpen, ClipboardCheck, Award } from 'lucide-react';

interface ProfessorLayoutProps {
  children: ReactNode;
}

export default function ProfessorLayout({ children }: ProfessorLayoutProps) {
  return (
    <div id="professor-layout" className="flex min-h-screen bg-[#F8F8F6] text-[#1C1C1C]">
      {/* Instructor Sidebar Panel */}
      <aside className="w-64 bg-[#0A2E5D] text-white flex flex-col border-r border-[#C89B3C]/10 flex-shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <span className="font-serif font-black text-lg text-white">MultiPlus</span>
          <span className="text-[8px] font-mono select-none px-1.5 py-0.5 bg-[#C89B3C] rounded uppercase font-bold text-white">PROFESSOR</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <a href="/professor/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors bg-white/5">
            <LayoutDashboard size={16} className="text-[#C89B3C]" />
            Dashboard
          </a>
          <a href="/professor/cursos" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <BookOpen size={16} />
            Gerir Cursos
          </a>
          <a href="/professor/biblioteca" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <FolderOpen size={16} />
            Biblioteca Docs
          </a>
          <a href="/professor/avaliacoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <ClipboardCheck size={16} />
            Avaliações
          </a>
          <a href="/professor/certificados" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <Award size={16} />
            Emitir Certificados
          </a>
        </nav>
      </aside>

      {/* Main Panel Content with standard viewport spacing */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-gray-150 bg-white flex items-center justify-between px-8">
          <div className="text-xs font-mono text-gray-400">PAINEL DOCENTE DE GESTÃO ACADÉMICA</div>
          <button className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-md text-[10px] font-mono uppercase font-bold transition-all">
            Terminar Sessão
          </button>
        </header>
        
        <main className="p-8 flex-grow">{children}</main>
      </div>
    </div>
  );
}
