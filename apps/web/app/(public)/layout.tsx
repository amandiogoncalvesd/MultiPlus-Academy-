import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8F6] text-[#1C1C1C]">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#0A2E5D] text-white py-4 px-6 shadow-sm border-b border-[#C89B3C]/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-lg tracking-wider text-white">MultiPlus</span>
            <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] border border-[#C89B3C]/20 px-1.5 py-0.5 rounded">ACADEMY</span>
          </div>
          <nav className="flex items-center gap-6 text-xs font-mono font-bold uppercase tracking-wider text-white/80">
            <a href="/sobre-nos" className="hover:text-[#C89B3C] transition-colors">Sobre Nós</a>
            <a href="/cursos" className="hover:text-[#C89B3C] transition-colors">Cursos</a>
            <a href="/formadores" className="hover:text-[#C89B3C] transition-colors">Formadores</a>
            <a href="/contactos" className="px-3 py-1.5 bg-[#C89B3C] hover:bg-[#D4A747] text-white rounded transition-colors">Contactar</a>
          </nav>
        </div>
      </header>

      {/* Main Page Layout Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer standard */}
      <footer className="bg-[#0A2E5D] text-[#F8F8F6]/80 text-xs py-8 border-t border-[#C89B3C]/15 font-sans">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-2">
          <p>© 2026 MultiPlus Academy. Todos os direitos reservados. Huambo, Angola.</p>
        </div>
      </footer>
    </div>
  );
}
