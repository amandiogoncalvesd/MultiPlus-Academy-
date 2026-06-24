import { Users, FileUser } from 'lucide-react';

export default function AdminUtilizadoresPage() {
  return (
    <div id="admin-users-manager" className="space-y-8 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Gerir Utilizadores</h2>
        <p className="text-xs text-gray-500">Adicione novos formadores, valide inscrições de alunos ou promova cargos administrativos.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden text-xs font-sans">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-mono text-gray-400 uppercase">
              <th className="p-4 font-bold">Identificação / E-mail</th>
              <th className="p-4 font-bold">Nível Hierárquico</th>
              <th className="p-4 font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 last:border-b-0 text-gray-700">
              <td className="p-4">
                <p className="font-bold text-[#0A2E5D]">Dr. António Ferreira Carvalho</p>
                <p className="text-gray-450 text-[10px] font-mono">antonio.carvalho@gmail.com</p>
              </td>
              <td className="p-4">
                <span className="font-bold text-sky-700 font-mono text-[9px] uppercase bg-sky-50 border border-sky-150 px-1.5 py-0.5 rounded">Aluno</span>
              </td>
              <td className="p-4">
                <a href="/admin/utilizadores/antonio-ferreira" className="inline-flex items-center gap-1 text-[10px] font-mono text-[#C89B3C] font-bold uppercase hover:underline">
                  <FileUser size={12} />
                  Ficha Completa
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
