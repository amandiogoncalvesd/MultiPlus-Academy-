import { Activity, Bell, BookOpen, ChevronRight, FileCheck2, MessageSquare, Network, Settings, Users, X, LogOut } from 'lucide-react';
import { User } from '../../types';

export type AdminTab = 'dashboard' | 'utilizadores' | 'cursos' | 'certificados' | 'notificacoes' | 'auditoria' | 'integracoes' | 'configuracoes' | 'perfil';

interface Props {
  activeTab: AdminTab;
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onNavigate: (tab: AdminTab) => void;
  onMessages: () => void;
  onSignOut: () => void;
}

const items: Array<{ id: AdminTab | 'messages'; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Visão geral', icon: <Activity size={17} /> },
  { id: 'utilizadores', label: 'Pessoas', icon: <Users size={17} /> },
  { id: 'cursos', label: 'Cursos', icon: <BookOpen size={17} /> },
  { id: 'certificados', label: 'Certificados', icon: <FileCheck2 size={17} /> },
  { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={17} /> },
  { id: 'notificacoes', label: 'Avisos', icon: <Bell size={17} /> },
  { id: 'auditoria', label: 'Histórico', icon: <Activity size={17} /> },
  { id: 'integracoes', label: 'Integrações', icon: <Network size={17} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={17} /> },
];

export default function AdminSidebar({ activeTab, isOpen, user, onClose, onNavigate, onMessages, onSignOut }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          onClick={onClose}
          aria-label="Fechar navegação"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-ink-900 text-cream-100 transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header — brand */}
        <div className="flex h-[64px] items-center justify-between border-b border-white/[0.08] px-5">
          <div className="flex items-center gap-2.5">
            <img
              src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fondo_ojals8.png"
              alt="MultiPlus Academy"
              className="h-8 w-auto object-contain"
            />
            <div>
              <span className="block font-serif text-[13px] font-black tracking-wide text-cream-100 leading-none">MULTIPLUS</span>
              <span className="block text-[8px] font-mono font-bold tracking-[0.18em] uppercase text-gold-400 leading-none mt-0.5">Admin</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-cream-100/50 hover:bg-white/[0.06] lg:hidden" aria-label="Fechar menu">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Navegação administrativa">
          <p className="mb-2 px-3 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-gold-400/70">Administração</p>
          {items.map((item) => {
            const active = item.id !== 'messages' && activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'messages') onMessages();
                  else onNavigate(item.id);
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 w-full px-3 py-[10px] rounded-lg text-left text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-accent text-white font-semibold shadow-sm'
                    : 'text-cream-100/55 hover:text-cream-100 hover:bg-white/[0.06]'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        {/* Footer — user + logout */}
        <div className="border-t border-white/[0.08] p-4">
          <button
            onClick={() => { onNavigate('perfil'); onClose(); }}
            className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-white/[0.06] transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-gold-400/30 bg-ink-750 text-[11px] font-bold text-gold-400">
              {user?.firstName?.[0] || 'A'}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[12px] font-semibold text-cream-100">{user?.firstName || 'Administrador'} {user?.lastName || ''}</b>
              <small className="block font-mono text-[9px] text-cream-100/40 mt-0.5">Perfil e preferências</small>
            </span>
          </button>
          <button
            onClick={onSignOut}
            className="mt-3 w-full py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide text-cream-100/50 border border-white/[0.08] hover:border-danger-700 hover:text-danger-700 hover:bg-danger-700/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={12} className="inline mr-1.5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
