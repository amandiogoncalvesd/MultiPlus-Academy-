import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { User } from '../../types';

interface ProfileMenuProps {
  user: User | null;
  onProfile: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}

export default function ProfileMenu({ user, onProfile, onSettings, onSignOut }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const name = `${user?.firstName || 'Administrador'} ${user?.lastName || ''}`.trim();

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Abrir menu de perfil" className="flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-gold-600 dark:border-ink-800 dark:bg-ink-900">
        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-600 font-bold text-ink-900">{name[0]}</span>}
        <span className="hidden max-w-28 sm:block"><span className="block truncate text-xs font-bold text-ink-900 dark:text-cream-100">{name}</span><span className="block text-[9px] font-mono text-gold-600">ADMIN</span></span>
      </button>
      {open && <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-gray-150 bg-white p-2 shadow-2xl dark:border-ink-800 dark:bg-ink-900">
        <div className="border-b border-gray-100 px-3 py-2 dark:border-ink-800"><p className="truncate text-sm font-semibold text-ink-900 dark:text-cream-100">{name}</p><p className="truncate text-[10px] text-neutral-400">{user?.email}</p></div>
        <button role="menuitem" onClick={() => { setOpen(false); onProfile(); }} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-ink-900 hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-ink-800"><UserIcon size={16} /> Meu perfil</button>
        <button role="menuitem" onClick={() => { setOpen(false); onSettings(); }} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-ink-900 hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-ink-800"><Settings size={16} /> Preferências</button>
        <button role="menuitem" onClick={() => { setOpen(false); onSignOut(); }} className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"><LogOut size={16} /> Sair</button>
      </div>}
    </div>
  );
}
