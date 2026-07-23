import { Bell, Menu, MessageSquare, Moon, Search, Sun } from 'lucide-react';
import { User } from '../../types';
import { AdminTab } from './AdminSidebar';
import ProfileMenu from './ProfileMenu';

interface AdminTopbarProps {
  activeTab: AdminTab;
  user: User | null;
  isDarkMode: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
  onMessages: () => void;
  onNotifications: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}

const labels: Record<AdminTab, string> = { dashboard: 'Visão geral', utilizadores: 'Utilizadores', cursos: 'Cursos e turmas', certificados: 'Certificados', notificacoes: 'Notificações', auditoria: 'Auditoria', integracoes: 'Integrações', configuracoes: 'Configurações', perfil: 'Meu perfil' };

export default function AdminTopbar(props: AdminTopbarProps) {
  return <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-150 bg-white/90 px-3 py-2 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/90 sm:px-5">
    <div className="flex min-w-0 items-center gap-3">
      <button onClick={props.onOpenSidebar} className="rounded-xl p-2 text-ink-900 hover:bg-cream-200 lg:hidden dark:text-cream-100 dark:hover:bg-ink-800" aria-label="Abrir navegação"><Menu size={20} /></button>
      <div className="min-w-0"><p className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">MultiPlus Command Center</p><h1 className="truncate font-serif text-base font-black text-ink-900 dark:text-cream-100">{labels[props.activeTab]}</h1></div>
    </div>
    <label className="hidden min-w-0 flex-1 md:block md:max-w-sm"><span className="sr-only">Pesquisar administração</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} /><input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Pesquisar utilizadores, cursos…" className="w-full rounded-xl border border-gray-200 bg-cream-200 py-2 pl-9 pr-3 text-xs text-ink-900 outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></span></label>
    <div className="flex items-center gap-1.5">
      <button onClick={props.onToggleTheme} className="rounded-xl p-2 text-gold-600 hover:bg-cream-200 dark:hover:bg-ink-800" aria-label="Alternar tema">{props.isDarkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
      <button onClick={props.onMessages} className="relative rounded-xl p-2 text-ink-900 hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-ink-800" aria-label="Abrir mensagens"><MessageSquare size={17} />{props.unreadMessages > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold text-white">{props.unreadMessages > 9 ? '9+' : props.unreadMessages}</span>}</button>
      <button onClick={props.onNotifications} className="relative rounded-xl p-2 text-ink-900 hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-ink-800" aria-label="Abrir notificações"><Bell size={17} />{props.unreadNotifications > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}</button>
      <ProfileMenu user={props.user} onProfile={props.onProfile} onSettings={props.onSettings} onSignOut={props.onSignOut} />
    </div>
  </header>;
}
