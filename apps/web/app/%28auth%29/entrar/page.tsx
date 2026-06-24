import { KeyRound, Mail, LogIn } from 'lucide-react';

export default function EntrarPage() {
  return (
    <div id="entrar-page-container" className="space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-xl font-serif font-black text-[#0A2E5D]">Iniciar Sessão</h2>
        <p className="text-xs text-gray-500">Aceda ao seu painel letivo corporativo.</p>
      </div>

      <form className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">E-mail Corporativo</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <Mail size={14} />
            </span>
            <input type="email" placeholder="nome@exemplo.com" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#C89B3C] outline-none" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Palavra-passe</label>
            <a href="/recuperar-senha" className="text-[10px] font-mono text-[#C89B3C] hover:underline uppercase font-bold">Esqueceu-se?</a>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <KeyRound size={14} />
            </span>
            <input type="password" placeholder="••••••••" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#C89B3C] outline-none" />
          </div>
        </div>

        <button type="button" className="w-full py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2">
          <LogIn size={14} />
          Entrar na Academia
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-550">
          Ainda não é membro?{' '}
          <a href="/registar" className="text-[#C89B3C] hover:underline font-bold">Criar Conta</a>
        </p>
      </div>
    </div>
  );
}
