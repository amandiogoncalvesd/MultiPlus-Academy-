import { Activity, Bell, BookOpen, MessageSquare, Network, QrCode, Settings, User as UserIcon, Users, X } from 'lucide-react';
import { User } from '../../types';

export type AdminTab = 'dashboard' | 'utilizadores' | 'cursos' | 'certificados' | 'notificacoes' | 'integracoes' | 'configuracoes' | 'perfil';

interface AdminSidebarProps {
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
  { id: 'utilizadores', label: 'Utilizadores', icon: <Users size={17} /> },
  { id: 'cursos', label: 'Cursos e turmas', icon: <BookOpen size={17} /> },
  { id: 'certificados', label: 'Certificados', icon: <QrCode size={17} /> },
  { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={17} /> },
  { id: 'notificacoes', label: 'Notificações', icon: <Bell size={17} /> },
  { id: 'integracoes', label: 'Integrações', icon: <Network size={17} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <Settings size={17} /> },
];

export default function AdminSidebar({ activeTab, isOpen, user, onClose, onNavigate, onMessages, onSignOut }: AdminSidebarProps) {
  return (
    <>
      {isOpen && <button aria-label="Fechar menu de administração" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#0b1629] text-cream-100 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <img src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png" alt="MultiPlus Academy" className="h-9 w-auto" />
            <div><p className="font-serif text-sm font-black">MultiPlus</p><p className="mt-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-gold-600">Command Center</p></div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Navegação administrativa">
          <p className="px-3 pb-2 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-white/35">Gestão institucional</p>
          {items.map((item) => {
            const selected = item.id !== 'messages' && activeTab === item.id;
            return <button key={item.id} onClick={() => { if (item.id === 'messages') onMessages(); else onNavigate(item.id); onClose(); }} aria-current={selected ? 'page' : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${selected ? 'bg-gold-600 text-ink-900 shadow-lg shadow-gold-600/15' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>{item.icon}<span>{item.label}</span></button>;
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button onClick={() => { onNavigate('perfil'); onClose(); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-600 font-bold text-ink-900">{user?.firstName?.[0] || 'A'}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user?.firstName || 'Admin'} {user?.lastName || ''}</span><span className="block text-[10px] font-mono text-gold-600">ADMINISTRADOR</span></span><UserIcon size={16} className="text-white/40" />
          </button>
          <button onClick={onSignOut} className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 text-xs font-mono font-bold uppercase text-rose-200 transition hover:bg-rose-600 hover:text-white">Sair com segurança</button>
        </div>
      </aside>
    </>
  );
}
