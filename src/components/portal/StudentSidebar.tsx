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
  return (
    <>
      {/* Overlay escuro no mobile quando sidebar está aberta */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          isHighContrast ? 'bg-black border-r-4 border-yellow-500' : themeMode === 'dark' ? 'bg-ink-900 border-ink-800' : 'bg-ink-900 text-white border-r border-ink-800/10'
        } transition-transform duration-300 transform lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Topbrand */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Logo"
                className="h-9 w-auto object-contain shrink-0"
              />
              <div className="text-left">
                <h1 className="text-sm font-serif font-black m-0 tracking-wide text-cream-100">MultiPlus</h1>
                <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-bold">Student LMS</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-cream-100/70 hover:text-cream-100 rounded bg-transparent border-0 cursor-pointer"
              aria-label="Fechar lateral"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard Académico', icon: <TrendingUp size={15} /> },
              { id: 'courses', label: 'Videoaulas & Notas', icon: <BookOpen size={15} /> },
              { id: 'calendar', label: 'Calendário Letivo', icon: <CalendarIcon size={15} /> },
              { id: 'materials', label: 'Manuais & Modelos', icon: <Download size={15} /> },
              { id: 'tasks', label: 'Minhas Tarefas', icon: <CheckCircle size={15} /> },
              { id: 'messages', label: 'Advisories de Tutor', icon: <MessageSquare size={15} /> },
              { id: 'certificates', label: 'Meus Certificados', icon: <Award size={15} /> },
              { id: 'progress', label: 'Meu Progresso', icon: <Bell size={15} /> },
              { id: 'profile', label: 'Coordenadas de Perfil', icon: <UserIcon size={15} /> },
              { id: 'settings', label: 'Acessibilidade & Ajustes', icon: <Settings size={15} /> }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  if (link.id === 'messages') {
                    setCurrentPage('messages');
                  } else {
                    setActiveTab(link.id as any);
                  }
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-left transition-all cursor-pointer border-0 ${
                  activeTab === link.id
                    ? 'bg-gold-600 text-ink-900 shadow-sm font-bold'
                    : 'text-cream-100/80 hover:text-cream-100 hover:bg-cream-100/10'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer context banner */}
          <div className="p-4 border-t border-white/10 space-y-3.5">
            <div className="flex items-center gap-3">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.firstName}
                  className="w-9 h-9 rounded-full object-cover border border-gold-600/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 bg-gold-600 text-ink-900 rounded-full flex items-center justify-center font-bold text-xs shadow-sm capitalize">
                  {currentUser?.firstName ? currentUser.firstName[0] : 'A'}
                </div>
              )}
              <div className="text-left truncate max-w-[130px]">
                <h4 className="text-xs font-bold text-cream-100 m-0 tracking-wide truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h4>
                <span className="text-[10px] font-mono text-gold-600 font-semibold uppercase">
                  {currentUser?.role || 'Aluno'}
                </span>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="w-full py-2 bg-danger-700 hover:bg-red-700 text-cream-100 text-[10px] font-mono font-bold uppercase rounded-lg border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={11} />
              <span>Sair do Portal</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
