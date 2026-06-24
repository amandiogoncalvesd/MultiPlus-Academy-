import { ArrowLeft, UserCheck } from 'lucide-react';

interface AlunosRosterPageProps {
  params: {
    courseId: string;
  };
}

export default function AlunosRosterPage({ params }: AlunosRosterPageProps) {
  return (
    <div id="course-students-roster" className="space-y-8 text-left max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <a href={`/professor/cursos/${params.courseId}`} className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-gray-500 hover:text-[#0A2E5D] transition-colors">
          <ArrowLeft size={12} />
          Voltar a Gerir Curso
        </a>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-black text-[#0A2E5D]">Alunos Matriculados (Curso: {params.courseId.toUpperCase()})</h2>
        <p className="text-xs text-gray-500">Acompanhe a frequência pedagógica quotidiana e as notas das simulações orais.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden text-xs font-sans">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-mono text-gray-400 uppercase">
              <th className="p-4 font-bold">Nome do Aluno</th>
              <th className="p-4 font-bold">Progresso Letivo</th>
              <th className="p-4 font-bold">Estado Académico</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 last:border-b-0 text-gray-700">
              <td className="p-4 font-bold text-[#0A2E5D] flex items-center gap-2">
                <UserCheck size={14} className="text-emerald-700" />
                Dr. António Ferreira Carvalho
              </td>
              <td className="p-4 font-mono">66% Concluído</td>
              <td className="p-4">
                <span className="font-bold text-emerald-750 font-mono text-[9px] uppercase bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded">Ativo</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
