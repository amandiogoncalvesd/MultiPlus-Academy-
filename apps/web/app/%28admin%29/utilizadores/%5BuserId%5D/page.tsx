import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface UserDetailPageProps {
  params: {
    userId: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  return (
    <div id="admin-user-detail" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <a href="/admin/utilizadores" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar a Utilizadores
        </a>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Ficha Cadastral do Utilizador</h2>
        <p className="text-xs text-gray-500">ID Único de Investigação: {params.userId}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-150 space-y-6 text-xs font-sans">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="font-serif font-black text-gray-800 text-base">António Ferreira Carvalho</h3>
          <p className="text-gray-400">Nível Letivo: English for the Legal Field (Angola Cohort)</p>
        </div>

        <div className="space-y-4">
          <p className="font-mono text-gray-400 text-[10px] uppercase font-bold">Ações Disponíveis</p>
          <div className="flex gap-2">
            <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase text-[9px] tracking-wider rounded-xl transition-colors flex items-center gap-1.5">
              <ShieldAlert size={12} />
              Suspender Acesso de Utilizador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
