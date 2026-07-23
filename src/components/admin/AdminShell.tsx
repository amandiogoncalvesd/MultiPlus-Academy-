import { ReactNode } from 'react';

interface Props { sidebar: ReactNode; topbar: ReactNode; children: ReactNode; isDarkMode: boolean; highContrast: boolean; }

export default function AdminShell({ sidebar, topbar, children, isDarkMode, highContrast }: Props) {
  const theme = highContrast ? 'bg-black text-white' : isDarkMode ? 'bg-[#0B111C] text-white' : 'bg-[#F7F6F2] text-[#1C1917]';
  return <div id="multiplus-admin-portal" className={`min-h-[100dvh] ${theme}`}>
    {sidebar}
    <div className="min-h-[100dvh] lg:pl-[232px]">
      <div className="flex min-h-[100dvh] min-w-0 flex-col">
        {topbar}
        <main id="admin-main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7 xl:px-10">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  </div>;
}
