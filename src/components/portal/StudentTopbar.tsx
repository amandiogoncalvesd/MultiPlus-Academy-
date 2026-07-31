import * as React from 'react';
import { User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase/client';
import { 
  Menu, 
  Search, 
  Flame, 
  Moon, 
  Sun, 
  MessageSquare, 
  Bell, 
  ChevronDown, 
  User as UserIcon, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface StudentTopbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setCurrentPage: (page: any) => void;
  currentUser: User | null;
  onSignOut: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  isHighContrast: boolean;
  themeMode: 'dark' | 'light';
  toggleTheme: () => void;
  streakCount: number;
  unreadMessagesCount: number;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (isOpen: boolean) => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (isOpen: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
  handleGlobalSearchSubmit: (e: React.FormEvent) => void;
  cardThemeClass: string;
}

export default function StudentTopbar({
  activeTab,
  setActiveTab,
  setCurrentPage,
  currentUser,
  onSignOut,
  setIsMobileSidebarOpen,
  isHighContrast,
  themeMode,
  toggleTheme,
  streakCount,
  unreadMessagesCount,
  notifications,
  setNotifications,
  isNotificationsOpen,
  setIsNotificationsOpen,
  isUserMenuOpen,
  setIsUserMenuOpen,
  globalSearch,
  setGlobalSearch,
  handleGlobalSearchSubmit,
  cardThemeClass
}: StudentTopbarProps) {
  const notificationRegionRef = React.useRef<HTMLDivElement>(null);
  const profileRegionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const dismissFloatingPanels = (event: PointerEvent) => {
      const target = event.target as Node;
      if (isNotificationsOpen && !notificationRegionRef.current?.contains(target)) setIsNotificationsOpen(false);
      if (isUserMenuOpen && !profileRegionRef.current?.contains(target)) setIsUserMenuOpen(false);
    };
    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', dismissFloatingPanels);
    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissFloatingPanels);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [isNotificationsOpen, isUserMenuOpen, setIsNotificationsOpen, setIsUserMenuOpen]);

  return (
    <header className={`min-h-16 px-3 sm:px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors ${
      isHighContrast ? 'bg-black border-yellow-500 text-yellow-300' : themeMode === 'dark' ? 'bg-ink-900 border-ink-800 text-cream-100' : 'bg-white border-slate-200/60 text-slate-800'
    }`}>
      {/* Topbar Left - Hamburger and section headers */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-current transition-all hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Abrir lateral"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden sm:block text-left">
          <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block">MultiPlus LMS</span>
          <h2 className="text-sm font-serif font-black tracking-wide m-0 capitalize">{activeTab} • Portal de Aluno</h2>
        </div>
      </div>

      {/* Topbar Center Search bar */}
      <form onSubmit={handleGlobalSearchSubmit} className="hidden md:flex relative w-64">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
          <Search size={14} />
        </span>
        <label htmlFor="student-global-search" className="sr-only">Pesquisar no portal do aluno</label>
        <input
          id="student-global-search"
          type="text"
          placeholder="Pesquisar certificado, drafting..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 placeholder:text-neutral-400 text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600 dark:bg-slate-800/50 dark:border-ink-800"
        />
      </form>

      {/* Topbar Right - Actions buttons widgets */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs">
        
        {/* Streak Indicator widget */}
        <div className="hidden sm:flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 text-orange-600 font-bold font-mono text-[10px]">
          <Flame size={12} fill="currentColor" />
          <span>{streakCount} d</span>
        </div>

        {/* Accessibility swift switch */}
        <button 
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-slate-100 text-gold-600 transition-all hover:bg-slate-200 dark:bg-slate-800"
          title="Mudar visual cor" aria-label="Alternar tema"
        >
          {themeMode === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Quick Access Messages Page icon with unread badge */}
        <button
          onClick={() => setCurrentPage('messages')}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-0 bg-slate-100 text-ink-900 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-blue-400"
          title="Abrir Mensagens" aria-label="Abrir mensagens"
        >
          <MessageSquare size={14} className="text-gold-600" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold sm:flex hidden">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Notification Drawer controller */}
        <div ref={notificationRegionRef} className="relative">
          <button 
            type="button"
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false); }}
            aria-expanded={isNotificationsOpen}
            aria-controls="student-notifications-popover"
            aria-haspopup="dialog"
            aria-label={`Notificações${notifications.filter(n => !n.read).length ? `, ${notifications.filter(n => !n.read).length} não lida(s)` : ''}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-0 bg-cream-200 text-ink-900 transition-all hover:bg-gray-100 dark:bg-slate-800 dark:text-blue-400"
          >
            <Bell size={14} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-gold-600 ring-2 ring-white dark:ring-ink-900" />
            )}
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                id="student-notifications-popover"
                role="dialog" aria-label="Notificações" aria-modal="false" className={`fixed inset-x-3 top-[4.5rem] max-h-[70dvh] overflow-hidden sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-2xl p-4 shadow-2xl text-left ${cardThemeClass} z-50`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-mono text-2xs font-bold text-neutral-400">NOTIFICAÇÕES</span>
                  <button 
                    onClick={async () => {
                      if (!currentUser?.id) return;
                      await supabase
                        .from('notifications')
                        .update({ read: true })
                        .eq('user_id', currentUser.id)
                        .eq('read', false);
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    className="text-gold-600 font-mono text-4xs uppercase font-extrabold hover:underline"
                  >
                    Marcar tudo lido
                  </button>
                </div>
                <div className="mt-2 max-h-[52dvh] space-y-1 divide-y divide-gray-100 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-neutral-400 text-center py-4 m-0 text-3xs">Sem novas notificações</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`flex gap-2 rounded-xl px-2 py-2.5 text-xs ${n.read ? 'text-neutral-400' : 'bg-gold-600/5 text-ink-900 dark:text-cream-100'} dark:text-gray-300`}>
                        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-gray-200' : 'bg-gold-600'}`} />
                        <div className="min-w-0"><p className="m-0 leading-snug">{n.text}</p><time className="mt-1 block text-[9px] font-mono text-neutral-400">{n.created_at ? new Date(n.created_at).toLocaleString('pt-AO') : 'Agora'}</time></div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Profile Dropdown Menu */}
        <div ref={profileRegionRef} className="relative">
          <button 
            type="button"
            onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
            aria-expanded={isUserMenuOpen}
            aria-controls="student-profile-popover"
            aria-haspopup="menu"
            aria-label="Abrir menu do perfil"
            className="flex min-h-10 items-center gap-1 rounded-lg border-0 bg-transparent px-1 text-ink-900 transition-colors hover:bg-slate-100 dark:text-cream-100 dark:hover:bg-slate-800"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.firstName}
                className="h-6 w-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="h-6 w-6 rounded-full bg-gold-600 text-slate-950 font-bold flex items-center justify-center font-mono">
                {currentUser?.firstName ? currentUser.firstName[0] : 'A'}
              </span>
            )}
            <ChevronDown size={12} />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                id="student-profile-popover"
                role="menu"
                aria-label="Menu do perfil"
                className={`absolute right-0 mt-2 w-48 rounded-xl p-2 shadow-xl text-left ${cardThemeClass} z-50`}
              >
                {[
                  { tab: 'profile', text: 'Meu Perfil Académico', id: <UserIcon size={12} /> },
                  { tab: 'settings', text: 'Configurações de Ecrã', id: <Settings size={12} /> }
                ].map(act => (
                  <button
                    key={act.tab}
                    onClick={() => {
                      setActiveTab(act.tab as any);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-cream-200 dark:hover:bg-slate-700/50 rounded-lg text-2xs text-neutral-400 dark:text-gray-200 text-left cursor-pointer border-0"
                  >
                    {act.id}
                    <span>{act.text}</span>
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1 pb-1" />
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 p-2 hover:bg-red-50 text-danger-700 rounded-lg text-2xs text-left cursor-pointer border-0"
                >
                  <LogOut size={12} />
                  <span>Sair do MultiPlus</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
