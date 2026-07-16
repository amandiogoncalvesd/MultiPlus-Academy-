import React from 'react';
import ChatShell from './messaging/ChatShell';
import { useAuth } from './auth/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { PageId } from '../types';

interface MessagesPageProps {
  setCurrentPage: (page: PageId) => void;
  previousDashboardPage: PageId;
}

export default function MessagesPage({ setCurrentPage, previousDashboardPage }: MessagesPageProps) {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Map database roles to ChatShell expected role props ('ADMIN' | 'PROFESSOR' | 'ALUNO')
  const getChatRole = (role?: string): 'ADMIN' | 'PROFESSOR' | 'ALUNO' => {
    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'PROFESSOR') return 'PROFESSOR';
    return 'ALUNO';
  };

  const chatRole = getChatRole(user?.role);

  return (
    <div className="flex flex-col h-screen bg-cream-150 dark:bg-ink-950 overflow-hidden text-slate-850 dark:text-cream-100">
      {/* Upper header bar */}
      <header className="h-16 border-b border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(previousDashboardPage)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-250 dark:border-ink-800 bg-cream-200 dark:bg-ink-850 text-xs font-mono font-bold uppercase hover:bg-cream-250 dark:hover:bg-ink-800 transition-all text-neutral-500 dark:text-cream-200 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={14} className="text-gold-600" />
            Voltar
          </button>
          
          <div className="h-4 w-px bg-gray-250 dark:bg-ink-800" />

          {/* User profile identifier */}
          <div className="flex items-center gap-2">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 rounded-full object-cover border border-gold-600/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cream-200 dark:bg-ink-850 flex items-center justify-center text-xs text-gold-600 font-bold border border-gold-600/20">
                {user?.firstName?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}
            <div className="hidden sm:block text-left leading-none">
              <p className="text-xs font-bold font-serif text-ink-900 dark:text-cream-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[9px] font-mono text-neutral-400 capitalize mt-0.5">
                {user?.role?.toLowerCase() || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Brand center label */}
        <div className="hidden md:flex items-center gap-2">
          <img
            src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
            alt="MultiPlus Logo"
            className="h-6 w-auto object-contain"
          />
          <span className="font-serif font-black tracking-wider text-xs uppercase text-gold-600">
            MultiPlus Academy Messages
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-cream-200 dark:bg-ink-850 hover:bg-cream-250 dark:hover:bg-ink-800 rounded-full transition-all text-gold-600 border border-gray-250/30 dark:border-ink-850 cursor-pointer"
            title="Alternar tema"
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* Main Chat component */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gradient-to-b from-cream-150 to-cream-200 dark:from-ink-950 dark:to-ink-900">
        <div className="max-w-7xl mx-auto h-full">
          {/* We supply the role prop dynamically */}
          <ChatShell role={chatRole} />
        </div>
      </main>
    </div>
  );
}
