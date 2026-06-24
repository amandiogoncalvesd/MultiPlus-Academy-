import { ReactNode } from 'react';
import { LayoutDashboard, Users, CreditCard, Layers, Settings } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div id="admin-layout" className="flex min-h-screen bg-[#F8F8F6] text-[#1C1C1C]">
      {/* Admin Sidebar Navigation Panel */}
      <aside className="w-64 bg-[#0A2E5D] text-white flex flex-col border-r border-[#C89B3C]/10 flex-shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <span className="font-serif font-black text-lg text-white">MultiPlus</span>
          <span className="text-[8px] font-mono select-none px-1.5 py-0.5 bg-[#C89B3C] rounded uppercase font-bold text-white">EXECUTIVE</span>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <a href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors bg-white/5">
            <LayoutDashboard size={16} className="text-[#C89B3C]" />
            Dashboard
          </a>
          <a href="/admin/utilizadores" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <Users size={16} />
            Utilizadores
          </a>
          <a href="/admin/financeiro" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <CreditCard size={16} />
            Financeiro
          </a>
          <a href="/admin/conteudo/blog" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <Layers size={16} />
            Conteúdo Geral
          </a>
          <a href="/admin/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold uppercase hover:bg-white/10 transition-colors">
            <Settings size={16} />
            Configurações
          </a>
        </nav>
      </aside>

      {/* Main Panel Content with standard viewport spacing */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        <header className="h-16 border-b border-gray-150 bg-white flex items-center justify-between px-8">
          <div className="text-xs font-mono text-gray-400">PAINEL ADMINISTRATIVO E FINANCEIRO</div>
          <button className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-md text-[10px] font-mono uppercase font-bold transition-all">
            Logout Admin
          </button>
        </header>
        
        <main className="p-8 flex-grow">{children}</main>
      </div>
    </div>
  );
}
