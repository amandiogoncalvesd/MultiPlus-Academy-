import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  Smartphone, 
  Award, 
  Layers, 
  CheckCheck, 
  Lock, 
  Unlock, 
  Flame, 
  FileDown,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { User, Course } from '../../types';

interface InstructorStudentsTabProps {
  students: User[];
  enrollments: any[];
  courses: Course[];
  onToggleStatus: (userId: string, currentStatus: string) => void;
  onEmitCertificate: (userId: string) => void;
  onUpdateStudentsList: (updatedList: User[]) => void;
}

export default function InstructorStudentsTab({
  students = [],
  enrollments = [],
  courses = [],
  onToggleStatus,
  onEmitCertificate,
  onUpdateStudentsList
}: InstructorStudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Interactive student note/alert state
  const [alertingStudentId, setAlertingStudentId] = useState<string | null>(null);
  const [customAlertText, setCustomAlertText] = useState('');

  // Editable grades state
  const [editingGradeStudentId, setEditingGradeStudentId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(88);

  // Helper mock data for grades and presence because they are simulated inside LMS
  const [metricsDB, setMetricsDB] = useState<Record<string, { grade: number; presence: number }>>(() => {
    return {
      'per_student': { grade: 92, presence: 95 },
      'user_temp_1': { grade: 78, presence: 82 },
      'default': { grade: 85, presence: 90 }
    };
  });

  const getEnrollment = (studentId: string) => {
    const enroll = enrollments.find(e => e.userId === studentId);
    return enroll || { progressPercent: 66, status: 'ACTIVE', courseId: 'eng-legal-angola' };
  };

  const updateStudentProgress = async (studentId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ progress_percent: newProgress })
        .eq('student_id', studentId);

      if (error) throw error;
      alert(`O progresso de estudos foi reajustado no Supabase para ${newProgress}%!`);
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao reajustar progresso: ${err.message || err}`);
    }
  };

  const handleSendInstantAlert = (id: string, name: string) => {
    if (!customAlertText.trim()) return;
    alert(`Mensagem com carimbo de urgência redirecionada para ${name}: "${customAlertText}"`);
    setAlertingStudentId(null);
    setCustomAlertText('');
  };

  const saveGradeScore = (id: string) => {
    setMetricsDB(prev => ({
      ...prev,
      [id]: {
        ...prev[id || 'default'],
        grade: editScore
      }
    }));
    setEditingGradeStudentId(null);
    alert('Nota académica guardada e vinculada ao percurso letivo.');
  };

  // Perform advanced filter matches
  const filteredList = students.filter(student => {
    // 1. Text lookup
    const term = searchQuery.toLowerCase();
    const textMatch = student.firstName.toLowerCase().includes(term) ||
                      student.lastName.toLowerCase().includes(term) ||
                      student.email.toLowerCase().includes(term) ||
                      (student.phone && student.phone.includes(term));

    // 2. Course matching
    const enrollment = getEnrollment(student.id);
    const courseMatch = selectedCourseFilter === 'all' || enrollment.courseId === selectedCourseFilter;

    // 3. Status filter matching
    const statusMatch = selectedStatusFilter === 'all' || student.status === selectedStatusFilter;

    // 4. Progress criteria
    let progressMatch = true;
    if (selectedProgressFilter === 'low') {
      progressMatch = enrollment.progressPercent < 50;
    } else if (selectedProgressFilter === 'medium') {
      progressMatch = enrollment.progressPercent >= 50 && enrollment.progressPercent < 80;
    } else if (selectedProgressFilter === 'completed') {
      progressMatch = enrollment.progressPercent === 100 || enrollment.status === 'COMPLETED';
    }

    return textMatch && courseMatch && statusMatch && progressMatch;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Title section with quick stats */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block">Gestão Curricular</span>
          <h3 className="text-xl font-serif font-black text-[#0A2E5D] m-0">Acompanhamento e Perfil de Alunos</h3>
          <p className="text-xs text-gray-400 mt-1">Monitore rascunhos de contratos, controle frequências e emita diplomas sob as normas angolanas.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const csvData = students.map(s => `${s.firstName} ${s.lastName},${s.email},${s.status}`).join('\n');
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('href', url);
              a.setAttribute('download', 'LMS-Juristas-MultiPlus.csv');
              a.click();
            }}
            className="px-3.5 py-2 border border-gray-200 hover:border-[#C89B3C] text-gray-650 hover:text-slate-900 transition-all rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown size={14} />
            <span>Exportar Lista (.csv)</span>
          </button>
        </div>
      </div>

      {/* Advanced filters bars panel */}
      <div className="bg-white p-5 rounded-3xl border border-gray-150 space-y-4">
        
        {/* Row 1 details lookup */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por Dr./Dra. Nome, Correio Eletrónico ou Número Telefónico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C89B3C]"
          />
        </div>

        {/* Row 2 select filter bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div>
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Filtrar por Curso</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none text-slate-800"
            >
              <option value="all">Frequência Global (Todos)</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Engajamento / Progresso</span>
            <select
              value={selectedProgressFilter}
              onChange={(e) => setSelectedProgressFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none text-slate-800"
            >
              <option value="all">Todas as Faixas de Retenção</option>
              <option value="low">Abaixo de 50% de Progresso</option>
              <option value="medium">Entre 50% e 80%</option>
              <option value="completed">Diplomados (100% de Progresso)</option>
            </select>
          </div>

          <div>
            <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Estado das Contas</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none text-slate-800"
            >
              <option value="all">Ativo ou Suspenso</option>
              <option value="ACTIVE">Apenas Alunos Regulados (Ativo)</option>
              <option value="SUSPENDED">Bloqueado e Pendente</option>
            </select>
          </div>

        </div>

      </div>

      {/* Dynamic Results Grid/Table list */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-sm">
        <div className="overflow-x-auto">
          <table className="hidden md:table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0A2E5D]/5 border-b border-gray-150 text-gray-500 font-mono uppercase text-[9px] tracking-widest">
                <th className="p-4 sm:p-5">Jurista Regulado</th>
                <th className="p-4 sm:p-5">Curso & Progressogram</th>
                <th className="p-4 sm:p-5">Rendimento (Média)</th>
                <th className="p-4 sm:p-5">Presença Síncrona</th>
                <th className="p-4 sm:p-5 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-105">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center font-mono text-gray-400">
                    Nenhum formando correspondente aos filtros de matrícula.
                  </td>
                </tr>
              ) : (
                filteredList.map((student) => {
                  const enroll = getEnrollment(student.id);
                  const isBlocked = student.status === 'SUSPENDED';
                  const activeMetric = metricsDB[student.id] || metricsDB['default'];

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Studen avatar & phone info */}
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'}
                            alt={student.firstName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                          />
                          <div>
                            <span className="font-serif font-black text-sm text-[#0A2E5D] block">
                              Dr(a). {student.firstName} {student.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 block">{student.email}</span>
                            <span className="text-[9px] font-mono text-[#C89B3C] font-semibold">{student.phone || '+244 9xx-xxx-xxx'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Math enrollment display */}
                      <td className="p-4 sm:p-5">
                        <div className="space-y-1.5 w-44">
                          <span className="text-[9px] font-mono text-gray-500 block uppercase truncate max-w-[170px]">
                            {courses.find(c => c.id === enroll.courseId)?.title || 'English for the Legal Field'}
                          </span>
                          
                          {/* Slider/Progress interactive controller */}
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={enroll.progressPercent}
                              onChange={(e) => updateStudentProgress(student.id, Number(e.target.value))}
                              className="w-full accent-[#C89B3C] h-1 bg-gray-100 rounded-full cursor-pointer"
                              title="Ajuste manual de progresso para fins de simulação"
                            />
                            <span className="text-[9px] font-mono font-bold text-gray-700">{enroll.progressPercent}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Grades scorecard */}
                      <td className="p-4 sm:p-5">
                        {editingGradeStudentId === student.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editScore}
                              onChange={(e) => setEditScore(Number(e.target.value))}
                              className="w-14 p-1 text-2xs border bg-white rounded text-center text-slate-800"
                            />
                            <button
                              onClick={() => saveGradeScore(student.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-4xs font-mono font-bold uppercase"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingGradeStudentId(student.id);
                              setEditScore(activeMetric.grade);
                            }}
                            className="bg-transparent border-0 p-0 text-left cursor-pointer hover:underline"
                            title="Clique para redefinir nota final de exames"
                          >
                            <span className="text-sm font-serif font-black text-[#0A2E5D]">{activeMetric.grade}</span>
                            <span className="text-[8px] font-mono text-gray-400 block">/ 100 • EDITAR</span>
                          </button>
                        )}
                      </td>

                      {/* Attendance presence tracker */}
                      <td className="p-4 sm:p-5">
                        <span className="text-sm font-serif font-black text-gray-700 block">
                          {activeMetric.presence}%
                        </span>
                        <span className="text-[8px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">
                          REGULADO
                        </span>
                      </td>

                      {/* Quick access togglers */}
                      <td className="p-4 sm:p-5 text-right space-x-2">
                        {/* Send urgent alert */}
                        <button
                          onClick={() => {
                            setAlertingStudentId(alertingStudentId === student.id ? null : student.id);
                            setCustomAlertText('');
                          }}
                          className="px-2.5 py-1.5 border border-gray-150 hover:bg-gray-50 text-gray-650 hover:text-slate-900 rounded-lg text-3xs font-mono font-semibold uppercase transition-all whitespace-nowrap cursor-pointer"
                        >
                          Chamar
                        </button>

                        <button
                          onClick={() => onToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isBlocked 
                              ? 'bg-red-50 hover:bg-red-100/50 border-red-200 text-red-650' 
                              : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-200 text-emerald-650'
                          }`}
                          title={isBlocked ? 'Matrícula Bloqueada - Clique para libertar' : 'Matrícula Ativa - Clique para bloquear'}
                        >
                          {isBlocked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>

                        {enroll.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase rounded-xl border border-emerald-100">
                            Certificado✓
                          </span>
                        ) : (
                          <button
                            onClick={() => onEmitCertificate(student.id)}
                            className="px-3 py-1.5 bg-[#C89B3C] text-white hover:bg-slate-900 transition-all rounded-xl text-3xs font-mono font-bold uppercase whitespace-nowrap cursor-pointer"
                          >
                            Outorgar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile view of stacked student cards */}
          <div className="block md:hidden space-y-4 p-4">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl font-mono text-gray-450 text-xs">
                Nenhum formando correspondente aos filtros de matrícula.
              </div>
            ) : (
              filteredList.map((student) => {
                const enroll = getEnrollment(student.id);
                const isBlocked = student.status === 'SUSPENDED';
                const activeMetric = metricsDB[student.id] || metricsDB['default'];

                return (
                  <div key={student.id} className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm text-left">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'}
                        alt={student.firstName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-serif font-black text-xs text-[#0A2E5D] block">
                          Dr(a). {student.firstName} {student.lastName}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">{student.email}</span>
                        <span className="text-[9px] font-mono text-[#C89B3C] font-semibold block">{student.phone || '+244 9xx-xxx-xxx'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[8px] font-mono text-gray-400 block uppercase">Curso</span>
                        <span className="font-semibold text-gray-700 block text-[11px] truncate">
                          {courses.find(c => c.id === enroll.courseId)?.title || 'English for the Legal Field'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-gray-50 p-2 rounded-xl">
                        <div>
                          <span className="block text-[8px] text-gray-400 uppercase">Progresso</span>
                          <span className="font-bold text-slate-700">{enroll.progressPercent}%</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-400 uppercase">Rendimento</span>
                          <span className="font-bold text-[#0A2E5D]">{activeMetric.grade}/100</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-400 uppercase">Presença</span>
                          <span className="font-bold text-slate-700">{activeMetric.presence}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setAlertingStudentId(alertingStudentId === student.id ? null : student.id);
                            setCustomAlertText('');
                          }}
                          className="px-2.5 py-1.5 border border-gray-150 hover:bg-gray-50 text-gray-650 rounded-lg text-3xs font-mono font-semibold uppercase"
                        >
                          Chamar
                        </button>
                        
                        <button
                          onClick={() => onToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isBlocked 
                              ? 'bg-red-50 hover:bg-red-100/50 border-red-200 text-red-650' 
                              : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-200 text-emerald-650'
                          }`}
                          title={isBlocked ? 'Matrícula Bloqueada - Clique para libertar' : 'Matrícula Ativa - Clique para bloquear'}
                        >
                          {isBlocked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                      </div>

                      <div>
                        {enroll.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold uppercase rounded-xl border border-emerald-100">
                            Certificado✓
                          </span>
                        ) : (
                          <button
                            onClick={() => onEmitCertificate(student.id)}
                            className="px-3 py-1.5 bg-[#C89B3C] text-white hover:bg-slate-900 transition-all rounded-xl text-3xs font-mono font-bold uppercase whitespace-nowrap cursor-pointer"
                          >
                            Outorgar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Send Urgent Alert popup modal drawer inside */}
      {alertingStudentId && (
        <div className="p-5 bg-amber-50 rounded-2xl border border-[#C89B3C]/30 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-wider">
              🔔 CANAL DE CONTINGÊNCIA • DISPARO DE SMS & NOTIFICAÇÕES SEVERAS
            </span>
            <button 
              onClick={() => setAlertingStudentId(null)}
              className="text-2xs font-mono text-gray-400 hover:text-black border-0 bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <p className="text-2xs text-[#0A2E5D] leading-snug m-0">
            Envie alertas para orientar o jurista {students.find(s => s.id === alertingStudentId)?.firstName} a submeter e rascunhar o texto em falta na ementa.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escreva advertência formal (Ex: Por favor submeta o rascunho de isenções do módulo 2 até amanhã)..."
              value={customAlertText}
              onChange={(e) => setCustomAlertText(e.target.value)}
              className="flex-grow p-2 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none text-slate-800"
            />
            <button
              onClick={() => handleSendInstantAlert(alertingStudentId, students.find(s => s.id === alertingStudentId)?.firstName || 'Aluno')}
              className="px-4 py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0"
              disabled={!customAlertText.trim()}
            >
              Disparar Alerta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
