import React from 'react';
import { MessageSquare } from 'lucide-react';
import NotificationBadge from './NotificationBadge';

interface MessageButtonProps {
  unreadCount: number;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function MessageButton({ unreadCount, onClick, ariaLabel, className = '' }: MessageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || `Abrir mensagens${unreadCount > 0 ? `, ${unreadCount} não lida(s)` : ''}`}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[#1C1917] transition hover:bg-white dark:text-white dark:hover:bg-[#18263A] ${className}`.trim()}
    >
      <MessageSquare size={17} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#B42318] px-1 text-[9px] font-bold text-white shadow-md ring-2 ring-[#F7F6F2] dark:ring-[#0B111C]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
