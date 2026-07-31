import { User } from '../../types';
import {
  X,
  TrendingUp,
  BookOpen,
  Calendar as CalendarIcon,
  Download,
  CheckCircle,
  MessageSquare,
  Award,
  Bell,
  User as UserIcon,
  Settings,
  LogOut
} from 'lucide-react';

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setCurrentPage: (page: any) => void;
  currentUser: User | null;
  onSignOut: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  isHighContrast: boolean;
  themeMode: 'dark' | 'light';
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'courses', label: 'Videoaulas', icon: BookOpen },
  { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
  { id: 'materials', label: 'Manuais', icon: Download },
  { id: 'tasks', label: 'Tarefas', icon: CheckCircle },
  { id: 'grades', label: 'Notas', icon: TrendingUp },
  { id: 'academic', label: 'Minha turma', icon: BookOpen },
  { id: 'messages', label: 'Tutor', icon: MessageSquare },
  { id: 'certificates', label: 'Certificados', icon: Award },
  { id: 'progress', label: 'Progresso', icon: TrendingUp },
  { id: 'notifications', label: 'Avisos', icon: Bell },
  { id: 'profile', label: 'Perfil', icon: UserIcon },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export default function StudentSidebar({
  activeTab,
  setActiveTab,
  setCurrentPage,
  currentUser,
  onSignOut,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isHighContrast,
  themeMode
}: StudentSidebarProps) {
  const isDark = themeMode === 'dark' || isHighContrast;

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col ${
          isHighContrast
            ? 'bg-black border-r-4 border-yellow-500'
            : 'bg-ink-900 border-r border-white/[0.06]'
        } transition-transform duration-250 transform lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header — brand */}
        <div className="flex items-center justify-between px-5 h-[64px] border-b border-white/[0.08]">
          <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2.5 group">
            <img
              src="/brand/multiplus-academy-logo-original.png"
              alt="MultiPlus Academy"
              className="h-8 w-auto object-contain"
            />
            <div>
              <span className="block font-serif text-[13px] font-black tracking-wide text-cream-100 leading-none">MultiPlus</span>
              <span className="block text-[8px] font-mono font-bold tracking-[0.18em] uppercase text-gold-400 leading-none mt-0.5">Student LMS</span>
            </div>
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-cream-100/60 hover:text-cream-100 hover:bg-white/[0.06] transition-colors"
            aria-label="Fechar navegação"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Navegação do aluno">
          <p className="px-3 mb-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-gold-400/70">Navegação</p>
          {navItems.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === 'messages') {
                    setCurrentPage('messages');
                  } else {
                    setActiveTab(link.id);
                  }
                  setIsMobileSidebarOpen(false);
                }}
                className={`group flex items-center gap-3 w-full px-3 py-[10px] rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-accent text-white font-semibold shadow-sm'
                    : 'text-cream-100/60 hover:text-cream-100 hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-cream-100/40 group-hover:text-cream-100/70'} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer — user + logout */}
        <div className="border-t border-white/[0.08] p-4">
          <div className="flex items-center gap-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.firstName}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold capitalize shadow-sm">
                {currentUser?.firstName?.[0] || 'A'}
              </span>
            )}
            <div className="min-w-0 flex-1 truncate">
              <p className="text-[12px] font-semibold text-cream-100 truncate leading-none">{currentUser?.firstName} {currentUser?.lastName}</p>
              <p className="text-[9px] font-mono font-bold uppercase text-gold-400/60 truncate leading-none mt-1">{currentUser?.role || 'Aluno'}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="mt-3 w-full py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide text-cream-100/50 border border-white/[0.08] hover:border-danger-700 hover:text-danger-700 hover:bg-danger-700/10 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
