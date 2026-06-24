import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div id="auth-layout" className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center items-center py-12 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-serif font-black text-2xl tracking-wider text-[#0A2E5D]">MultiPlus</span>
          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] border border-[#C89B3C]/20 px-2 py-0.5 rounded uppercase font-extrabold">ACADEMY</span>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-gray-150">
          {children}
        </div>

        <p className="text-[10px] font-mono text-gray-400">
          © 2026 MultiPlus Academy. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
