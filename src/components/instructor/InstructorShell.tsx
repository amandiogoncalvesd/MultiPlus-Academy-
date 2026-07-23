import { ReactNode } from 'react';

interface Props { sidebar: ReactNode; topbar: ReactNode; children: ReactNode; isDarkMode: boolean; highContrast: boolean; }
export default function InstructorShell({ sidebar, topbar, children, isDarkMode, highContrast }: Props) {
  const surface = highContrast ? 'bg-black text-cream-100' : isDarkMode ? 'bg-ink-950 text-cream-100' : 'bg-slate-50 text-slate-800';
  return <div id="multiplus-instructor-portal" className={`flex min-h-[100dvh] ${surface}`}>{sidebar}<div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col lg:pl-[280px]">{topbar}<main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8"><div className="mx-auto w-full max-w-7xl">{children}</div></main></div></div>;
}
