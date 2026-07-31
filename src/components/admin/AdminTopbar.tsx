import { Bell, Menu, MessageSquare, Moon, Search, Sun } from 'lucide-react';
import { User } from '../../types';
import { AdminTab } from './AdminSidebar';
import ProfileMenu from './ProfileMenu';

interface Props {
  activeTab: AdminTab;
  user: User | null;
  isDarkMode: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  search: string;
  onSearchChange: (v: string) => void;
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
  onMessages: () => void;
  onNotifications: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}

const labels: Record<AdminTab, string> = {
  dashboard: 'Visão geral',
  utilizadores: 'Usuários',
  cursos: 'Cursos',
  estrutura: 'Estrutura acadêmica',
  certificados: 'Certificados',
  notificacoes: 'Avisos',
  auditoria: 'Histórico',
  integracoes: 'Integrações',
  configuracoes: 'Configurações',
  perfil: 'Meu perfil',
};

export default function AdminTopbar(p: Props) {
  return (
    <header className={`sticky top-0 z-30 flex h-[64px] items-center justify-between gap-4 border-b px-4 sm:px-7 backdrop-blur-md transition-colors ${
      p.isDarkMode
        ? 'border-ink-800 bg-ink-900/92 text-cream-100'
        : 'border-border bg-background/92 text-foreground'
    }`}>
      {/* Left — hamburger + label */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={p.onOpenSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] lg:hidden"
          aria-label="Abrir navegação"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="ledger-eyebrow">Centro de operação</p>
          <h1 className="truncate font-serif text-[17px] font-black">
            {labels[p.activeTab]}
          </h1>
        </div>
      </div>

      {/* Search */}
      <label className="relative hidden flex-1 md:block md:max-w-[320px]">
        <span className="sr-only">Pesquisar</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={p.search}
          onChange={(e) => p.onSearchChange(e.target.value)}
          placeholder="Pesquisar pessoas ou cursos"
          className="ledger-input h-10 pl-9 pr-3 text-[13px]"
        />
      </label>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={p.onToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10"
          aria-label="Alternar tema"
        >
          {p.isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          onClick={p.onMessages}
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
          aria-label="Abrir mensagens"
        >
          <MessageSquare size={17} />
          {p.unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-danger-700 px-1 text-center text-[9px] font-bold text-white">
              {p.unreadMessages > 9 ? '9+' : p.unreadMessages}
            </span>
          )}
        </button>
        <button
          onClick={p.onNotifications}
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
          aria-label="Abrir avisos"
        >
          <Bell size={17} />
          {p.unreadNotifications > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </button>
        <ProfileMenu user={p.user} onProfile={p.onProfile} onSettings={p.onSettings} onSignOut={p.onSignOut} />
      </div>
    </header>
  );
}
