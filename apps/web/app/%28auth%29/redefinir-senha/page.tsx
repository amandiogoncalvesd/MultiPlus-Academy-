import { KeyRound } from 'lucide-react';

export default function RedefinirSenhaPage() {
  return (
    <div id="redefinir-senha-container" className="space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-xl font-serif font-black text-[#0A2E5D]">Redefinir Senha</h2>
        <p className="text-xs text-gray-500">Introduza e confirme a nova senha de segurança.</p>
      </div>

      <form className="space-y-4 text-xs">
        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Nova Palavra-passe</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <KeyRound size={14} />
            </span>
            <input type="password" placeholder="••••••••" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#C89B3C] outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Confirmar Palavra-passe</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
              <KeyRound size={14} />
            </span>
            <input type="password" placeholder="••••••••" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-[#C89B3C] outline-none" />
          </div>
        </div>

        <button type="button" className="w-full py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors">
          Atualizar Palavra-passe
        </button>
      </form>
    </div>
  );
}
