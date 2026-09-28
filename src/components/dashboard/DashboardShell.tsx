import React from 'react';

interface DashboardShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function DashboardShell({ sidebar, topbar, children, className = '', contentClassName = '' }: DashboardShellProps) {
  return (
    <div className={`min-h-[calc(100dvh-64px)] bg-[#FAFAF9] text-[#1C1917] dark:bg-[#0B111C] dark:text-white ${className}`.trim()}>
      {sidebar}
      <div className="flex flex-col lg:ml-[240px]">
        <div className="sticky top-0 z-30">
          {topbar}
        </div>
        <main className={`min-h-[calc(100dvh-64px-72px)] px-4 py-6 sm:px-6 lg:px-8 ${contentClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>
  );
}
