import * as React from "react";
import { BookOpen, Calendar, Award, MessageSquare, User, CheckSquare, BarChart, FileText } from "lucide-react";

export default function AlunoDashboard() {
  const sections = [
    { title: "Meus Cursos", icon: <BookOpen className="text-[#C89B3C]" /> },
    { title: "Player de Aula", icon: <BookOpen className="text-sky-600" /> },
    { title: "Materiais Pedagógicos", icon: <FileText className="text-[#0A2E5D]" /> },
    { title: "Calendário letivo", icon: <Calendar className="text-emerald-500" /> },
    { title: "Certificados digitais", icon: <Award className="text-[#C89B3C]" /> },
    { title: "Mensagens rápidas", icon: <MessageSquare className="text-blue-500" /> },
    { title: "Perfil do formando", icon: <User className="text-purple-500" /> },
    { title: "Tarefas pendentes", icon: <CheckSquare className="text-rose-500" /> },
    { title: "Progresso acumulado", icon: <BarChart className="text-amber-500" /> }
  ];

  return (
    <div className="py-12 text-left max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="bg-[#0A2E5D] text-white p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#C89B3C_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C89B3C] font-extrabold">Portal do Aluno</span>
          <h2 className="text-2xl font-serif font-black m-0">Bem-vindo à Sua Área Académica</h2>
          <p className="text-xs text-white/70 max-w-lg m-0 font-sans">Gerencie o seu progresso, aceda às aulas do English for the Legal Field, revise materiais e obtenha certificados.</p>
        </div>
        <div className="bg-white/10 px-4 py-2 border border-white/10 rounded-xl relative z-10 text-left">
          <span className="block text-[8px] font-mono text-white/50 uppercase tracking-widest">Estudo diário</span>
          <span className="text-sm font-serif font-bold text-[#C89B3C]">🔥 Streak de 4 Dias</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-white border border-gray-150 p-6 rounded-2xl flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex-shrink-0">
              {sec.icon}
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-[#0A2E5D] m-0">{sec.title}</h4>
              <p className="text-[11px] text-gray-400 font-mono m-0 uppercase pointer-events-none">Aceder Secção →</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
