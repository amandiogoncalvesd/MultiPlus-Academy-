import React from 'react';

export type StatusType = 'online' | 'typing' | 'offline' | 'away';

interface StatusDotProps {
  status?: StatusType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  label?: string; // texto acessível opcional
}

const colors: Record<StatusType, string> = {
  online: 'bg-emerald-500',
  typing: 'bg-amber-400 animate-pulse',
  offline: 'bg-neutral-300 dark:bg-neutral-600',
  away: 'bg-amber-300',
};

const sizeMap = { xs: 'h-1.5 w-1.5', sm: 'h-2 w-2', md: 'h-2.5 w-2.5' };

export default function StatusDot({ status = 'offline', size = 'sm', className = '', label }: StatusDotProps) {
  return (
    <span
      className={`inline-block rounded-full ${colors[status]} ${sizeMap[size]} ${className}`.trim()}
      aria-label={label || `Status: ${status}`}
      title={label || status}
    />
  );
}
