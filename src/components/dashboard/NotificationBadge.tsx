import React from 'react';
import { Bell, MessageSquare, Mail } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  maxDisplay?: number;
  icon?: 'bell' | 'message' | 'mail';
  ariaLabel?: string;
  className?: string;
}

export default function NotificationBadge({
  count,
  maxDisplay = 9,
  icon = 'bell',
  ariaLabel,
  className = '',
}: NotificationBadgeProps) {
  if (count <= 0) return null;
  const Icon = icon === 'message' ? MessageSquare : icon === 'mail' ? Mail : Bell;
  const label = count > maxDisplay ? `${maxDisplay}+` : String(count);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#B42318] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm ${className}`.trim()}
      aria-label={ariaLabel || `${count} notificação${count > 1 ? 's' : ''}`}
      role="status"
    >
      <Icon size={10} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
