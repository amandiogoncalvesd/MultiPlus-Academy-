import React from 'react';
import { LogOut, User } from 'lucide-react';

export interface DashboardProfileData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  roleLabel?: string;
  subtitle?: string;
  email?: string;
}

interface DashboardProfileCardProps {
  data: DashboardProfileData;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showEmail?: boolean;
  onProfile?: () => void;
  onSignOut?: () => void;
  className?: string;
}

export default function DashboardProfileCard({
  data,
  size = 'md',
  showSubtitle = false,
  showEmail = false,
  onProfile,
  onSignOut,
  className = '',
}: DashboardProfileCardProps) {
  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const sizeMap = { sm: { avatar: 'h-7 w-7 text-[10px]', name: 'text-[11px]', sub: 'text-[9px]' }, md: { avatar: 'h-9 w-9 text-[11px]', name: 'text-xs', sub: 'text-[10px]' }, lg: { avatar: 'h-12 w-12 text-sm', name: 'text-sm', sub: 'text-xs' } };
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt={`${data.firstName} ${data.lastName || ''}`} className={`${s.avatar} rounded-full object-cover`} referrerPolicy="no-referrer" />
      ) : (
        <span className={`${s.avatar} rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-[#A16207] to-[#854D0D] text-white shadow-sm`}>{initials}</span>
      )}
      <div className="min-w-0 hidden sm:block">
        <p className={`${s.name} font-semibold text-[#0B1629] dark:text-white truncate leading-none`}>{data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : 'Usuário'}</p>
        {showSubtitle && data.subtitle && <p className={`${s.sub} text-[#78716C] truncate leading-none mt-0.5`}>{data.subtitle}</p>}
        {showEmail && data.email && <p className={`${s.sub} font-mono text-[#A16207] truncate leading-none mt-0.5`}>{data.email}</p>}
        {!showSubtitle && data.roleLabel && <p className={`${s.sub} text-[#78716C] truncate leading-none mt-0.5`}>{data.roleLabel}</p>}
      </div>
      {onProfile && (
        <button onClick={onProfile} aria-label="Abrir perfil" className="ml-auto p-1 text-[#A16207] hover:text-[#854D0D] transition-colors" title="Perfil">
          <User size={14} />
        </button>
      )}
      {onSignOut && (
        <button onClick={onSignOut} aria-label="Terminar sessão" className="ml-auto p-1 text-[#78716C] hover:text-[#DC2626] transition-colors" title="Sair">
          <LogOut size={14} />
        </button>
      )}
    </div>
  );
}
