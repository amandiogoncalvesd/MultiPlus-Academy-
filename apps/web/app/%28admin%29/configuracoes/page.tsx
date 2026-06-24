import { Shield, KeyRound, Server } from 'lucide-react';

export default function AdminConfiguracoesPage() {
  return (
    <div id="admin-settings-root" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Configurações da Plataforma</h2>
        <p className="text-xs text-gray-500">Faça ajustes de segurança e audite as chaves de API ligadas ao NestJS do back-end.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-150 space-y-6 text-xs font-sans">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-xl flex-shrink-0">
            <Server size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-black text-[#0A2E5D] text-base">Estado da Conectividade API</h4>
            <p className="text-xs text-gray-500 leading-normal">
              O microsserviço de backend NestJS e base de dados PostgreSQL estão operacionais no cluster Cloud Run.
            </p>
          </div>
        </div>

        <form className="space-y-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-gray-500 font-mono font-bold uppercase mb-1">Nome Fantasia da Academia</label>
            <input type="text" defaultValue="MultiPlus Academy" className="w-full p-3 rounded-lg border border-gray-200 outline-none" />
          </div>
          <button type="button" className="px-5 py-2.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white font-mono font-bold uppercase text-[10px] tracking-wider rounded-xl transition-colors">
            Gravar Configurações
          </button>
        </form>
      </div>
    </div>
  );
}
