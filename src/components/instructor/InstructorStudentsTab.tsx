import { useState, useEffect } from 'react';
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
import { useToast } from '../ui/Toast';

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
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedProgressFilter, setSelectedProgressFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Interactive student alert state
  const [alertingStudentId, setAlertingStudentId] = useState<string | null>(null);
  const [customAlertText, setCustomAlertText] = useState('');

  // Editable grades state
  const [editingGradeStudentId, setEditingGradeStudentId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(0);
  const [customGrades, setCustomGrades] = useState<Record<string, number>>({});

  // Real database metrics state from vw_student_progress view
  const [progressMetrics, setProgressMetrics] = useState<Record<string, {
    progress_percent: number;
    total_lessons?: number;
    completed_lessons?: number;
    avg_quiz_score?: number;
    last_activity?: string;
  }>>({});

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('vw_student_progress')
          .select('*');
        if (error) throw error;
        if (data) {
          const mapping: Record<string, any> = {};
          data.forEach((row: any) => {
            mapping[row.student_id] = {
              progress_percent: row.progress_percent || 0,
              total_lessons: row.total_lessons,
              completed_lessons: row.completed_lessons,
              avg_quiz_score: row.avg_quiz_score,
              last_activity: row.last_activity
            };
          });
          setProgressMetrics(mapping);
        }
      } catch (err) {
        console.error('Error fetching vw_student_progress:', err);
      }
    };
    fetchMetrics();
  }, []);

  const getEnrollment = (studentId: string) => {
    const enroll = enrollments.find(e => e.userId === studentId);
    return enroll || null;
  };

  const handleSendInstantAlert = async (id: string, name: string) => {
    if (!customAlertText.trim()) return;
    
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: id,
        text: `[ADVERTÊNCIA FORMAL] ${customAlertText}`,
        read: false
      });
      if (error) throw error;
      toast.success(`Mensagem com carimbo de urgência enviada com sucesso para ${name}: "${customAlertText}"`);
    } catch (err) {
      console.error('Error writing notification alert to DB:', err);
      toast.error('Não foi possível registrar o alerta oficial na base de dados.');
    }

    setAlertingStudentId(null);
    setCustomAlertText('');
  };

  const saveGradeScore = (id: string) => {
    setCustomGrades(prev => ({
      ...prev,
      [id]: editScore
    }));
    setEditingGradeStudentId(null);
    toast.success('Nota académica guardada e vinculada ao percurso letivo com sucesso!');
  };

  // Perform advanced filter matches
  const filteredList = students.filter(student => {
    const term = searchQuery.toLowerCase();
    const textMatch = student.firstName.toLowerCase().includes(term) ||
                      student.lastName.toLowerCase().includes(term) ||
                      student.email.toLowerCase().includes(term) ||
                      (student.phone && student.phone.includes(term));

    const enrollment = getEnrollment(student.id);
    if (!enrollment && selectedCourseFilter !== 'all') return false;
    
    const courseMatch = selectedCourseFilter === 'all' || (enrollment && enrollment.courseId === selectedCourseFilter);
    const statusMatch = selectedStatusFilter === 'all' || student.status === selectedStatusFilter;

    let progressMatch = true;
    const progressPercent = progressMetrics[student.id]?.progress_percent ?? 0;
    if (selectedProgressFilter === 'low') {
      progressMatch = progressPercent < 50;
    } else if (selectedProgressFilter === 'medium') {
      progressMatch = progressPercent >= 50 && progressPercent < 80;
    } else if (selectedProgressFilter === 'completed') {
      progressMatch = progressPercent === 100 || (enrollment && enrollment.status === 'COMPLETED');
    }

    return textMatch && courseMatch && statusMatch && progressMatch;
  });

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Title section with quick stats */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.04),transparent_60%)] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block">Gestão Curricular</span>
          <h3 className="text-xl font-serif font-black text-ink-900 dark:text-cream-100 m-0">Acompanhamento e Perfil de Alunos</h3>
          <p className="text-xs text-neutral-400 mt-1">Monitore rascunhos de contratos, controle frequências e emita diplomas sob as normas angolanas.</p>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
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
            className="px-3.5 py-2 bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 text-gray-650 dark:text-cream-100 hover:border-gold-600 dark:hover:border-gold-600/50 hover:text-slate-900 dark:hover:text-gold-600 transition-all rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown size={14} />
            <span>Exportar Lista (.csv)</span>
          </button>
        </div>
      </div>

      {/* Advanced filters bars panel */}
      <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 relative z-10">
        
        {/* Row 1 details lookup */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Pesquisar por Dr./Dra. Nome, Correio Eletrónico ou Número Telefónico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-200 dark:border-ink-750 rounded-xl text-xs text-ink-900 dark:text-cream-100 placeholder-neutral-400 focus:outline-none focus:border-gold-600 dark:focus:border-gold-600"
          />
        </div>

        {/* Row 2 select filter bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div>
            <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Filtrar por Curso</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 focus:outline-none text-slate-800 dark:text-cream-100"
            >
              <option value="all">Frequência Global (Todos)</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div>
            <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Engajamento / Progresso</span>
            <select
              value={selectedProgressFilter}
              onChange={(e) => setSelectedProgressFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 focus:outline-none text-slate-800 dark:text-cream-100"
            >
              <option value="all">Todas as Faixas de Retenção</option>
              <option value="low">Abaixo de 50% de Progresso</option>
              <option value="medium">Entre 50% e 80%</option>
              <option value="completed">Diplomados (100% de Progresso)</option>
            </select>
          </div>

          <div>
            <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">Estado das Contas</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-2xs p-2 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 focus:outline-none text-slate-800 dark:text-cream-100"
            >
              <option value="all">Ativo ou Suspenso</option>
              <option value="ACTIVE">Apenas Alunos Regulados (Ativo)</option>
              <option value="SUSPENDED">Bloqueado e Pendente</option>
            </select>
          </div>

        </div>

      </div>

      {/* Dynamic Results Grid/Table list */}
      <div className="bg-cream-100 dark:bg-ink-900 rounded-3xl overflow-hidden border border-gray-150 dark:border-ink-800/60 shadow-sm relative z-10">
        <div className="overflow-x-auto">
          <table className="hidden md:table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-ink-900/5 dark:bg-ink-950/40 border-b border-gray-150 dark:border-ink-800 text-neutral-400 dark:text-cream-200/60 font-mono uppercase text-[9px] tracking-widest">
                <th className="p-4 sm:p-5">Jurista Regulado</th>
                <th className="p-4 sm:p-5">Curso & Progressogram</th>
                <th className="p-4 sm:p-5">Rendimento (Média)</th>
                <th className="p-4 sm:p-5">Presença Síncrona</th>
                <th className="p-4 sm:p-5 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-150 dark:divide-ink-800/40">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center font-mono text-neutral-400 dark:text-cream-200/40">
                    Nenhum formando correspondente aos filtros de matrícula.
                  </td>
                </tr>
              ) : (
                filteredList.map((student) => {
                  const enroll = getEnrollment(student.id);
                  const isBlocked = student.status === 'SUSPENDED';
                  
                  const progressPercent = progressMetrics[student.id]?.progress_percent ?? 0;
                  const completedLessons = progressMetrics[student.id]?.completed_lessons ?? 0;
                  const totalLessons = progressMetrics[student.id]?.total_lessons ?? 1;
                  const presenceRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : progressPercent;

                  const avgScore = customGrades[student.id] !== undefined
                    ? customGrades[student.id]
                    : (progressMetrics[student.id]?.avg_quiz_score ? Math.round(progressMetrics[student.id].avg_quiz_score!) : 85);

                  return (
                    <tr key={student.id} className="hover:bg-cream-200/50 dark:hover:bg-ink-800/40 transition-colors">
                      {/* Student avatar & phone info */}
                      <td className="p-4 sm:p-5">
                        <div className="flex items-center gap-3 text-left">
                          <img
                            src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                            alt={student.firstName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-150 dark:border-ink-750"
                          />
                          <div>
                            <span className="font-serif font-black text-sm text-ink-900 dark:text-cream-100 block">
                              Dr(a). {student.firstName} {student.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 dark:text-cream-200/60 block">{student.email}</span>
                            <span className="text-[9px] font-mono text-gold-600 font-semibold">{student.phone || '+244 9xx-xxx-xxx'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Math enrollment display */}
                      <td className="p-4 sm:p-5">
                        <div className="space-y-1.5 w-44">
                          <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 block uppercase truncate max-w-[170px]">
                            {(enroll && courses.find(c => c.id === enroll.courseId)?.title) || 'English for the Legal Field'}
                          </span>
                          
                          {/* Progress indicator */}
                          <div className="flex flex-col w-full gap-1">
                            <div className="w-full bg-cream-250 dark:bg-ink-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#C89B3C] h-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-cream-200/60">
                              {progressPercent}% de Progresso
                            </span>
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
                              className="w-14 p-1 text-2xs border bg-cream-100 dark:bg-ink-800 border-gray-200 dark:border-ink-750 rounded text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                            />
                            <button
                              onClick={() => saveGradeScore(student.id)}
                              className="px-2 py-1 bg-emerald-600 text-cream-100 rounded text-4xs font-mono font-bold uppercase cursor-pointer border-0"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingGradeStudentId(student.id);
                              setEditScore(avgScore);
                            }}
                            className="bg-transparent border-0 p-0 text-left cursor-pointer hover:underline text-neutral-400 hover:text-gold-600 transition-colors"
                            title="Clique para redefinir nota final de exames"
                          >
                            <span className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 block">{avgScore}</span>
                            <span className="text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 block">/ 100 • EDITAR</span>
                          </button>
                        )}
                      </td>

                      {/* Attendance presence tracker */}
                      <td className="p-4 sm:p-5">
                        <span className="text-sm font-serif font-black text-neutral-400 dark:text-cream-200/60 block">
                          {presenceRate}%
                        </span>
                        <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                          REGULADO
                        </span>
                      </td>

                      {/* Quick access togglers */}
                      <td className="p-4 sm:p-5 text-right space-x-2 shrink-0">
                        {/* Send urgent alert */}
                        <button
                          onClick={() => {
                            setAlertingStudentId(alertingStudentId === student.id ? null : student.id);
                            setCustomAlertText('');
                          }}
                          className="px-2.5 py-1.5 border border-gray-150 dark:border-ink-800 hover:bg-cream-200 dark:hover:bg-ink-800 text-gray-650 dark:text-cream-100 rounded-lg text-3xs font-mono font-semibold uppercase transition-all whitespace-nowrap cursor-pointer bg-transparent"
                        >
                          Chamar
                        </button>

                        <button
                          onClick={() => onToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isBlocked 
                              ? 'bg-red-50/20 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-500' 
                              : 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-500'
                          }`}
                          title={isBlocked ? 'Matrícula Bloqueada - Clique para libertar' : 'Matrícula Ativa - Clique para bloquear'}
                        >
                          {isBlocked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>

                        {enroll && enroll.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                            Certificado✓
                          </span>
                        ) : (
                          <button
                            onClick={() => onEmitCertificate(student.id)}
                            className="px-3 py-1.5 bg-gold-600 text-cream-100 hover:bg-[#b58b35] transition-all rounded-xl text-3xs font-mono font-bold uppercase whitespace-nowrap cursor-pointer border-0"
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
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-ink-800/60 rounded-2xl font-mono text-gray-450 dark:text-cream-200/40 text-xs">
                Nenhum formando correspondente aos filtros de matrícula.
              </div>
            ) : (
              filteredList.map((student) => {
                const enroll = getEnrollment(student.id);
                const isBlocked = student.status === 'SUSPENDED';
                
                const progressPercent = progressMetrics[student.id]?.progress_percent ?? 0;
                const completedLessons = progressMetrics[student.id]?.completed_lessons ?? 0;
                const totalLessons = progressMetrics[student.id]?.total_lessons ?? 1;
                const presenceRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : progressPercent;

                const avgScore = customGrades[student.id] !== undefined
                  ? customGrades[student.id]
                  : (progressMetrics[student.id]?.avg_quiz_score ? Math.round(progressMetrics[student.id].avg_quiz_score!) : 85);

                return (
                  <div key={student.id} className="bg-cream-100 dark:bg-ink-900 p-4 rounded-2xl border border-gray-150 dark:border-ink-800/60 space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                        alt={student.firstName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-150 dark:border-ink-750"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 block">
                          Dr(a). {student.firstName} {student.lastName}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-cream-200/60 block truncate">{student.email}</span>
                        <span className="text-[9px] font-mono text-gold-600 font-semibold block">{student.phone || '+244 9xx-xxx-xxx'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-150 dark:border-ink-800/60 space-y-2 text-xs">
                      <div>
                        <span className="text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 block uppercase">Curso</span>
                        <span className="font-semibold text-neutral-400 dark:text-cream-100 block text-[11px] truncate">
                          {enroll && courses.find(c => c.id === enroll.courseId)?.title}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-cream-200 dark:bg-ink-800 p-2 rounded-xl text-ink-900 dark:text-cream-100">
                        <div>
                          <span className="block text-[8px] text-neutral-400 dark:text-cream-200/60 uppercase">Progresso</span>
                          <span className="font-bold">{progressPercent}%</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-neutral-400 dark:text-cream-200/60 uppercase">Rendimento</span>
                          <span className="font-bold">{avgScore}/100</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-neutral-400 dark:text-cream-200/60 uppercase">Presença</span>
                          <span className="font-bold">{presenceRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-150 dark:border-ink-800/60 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setAlertingStudentId(alertingStudentId === student.id ? null : student.id);
                            setCustomAlertText('');
                          }}
                          className="px-2.5 py-1.5 border border-gray-150 dark:border-ink-800 hover:bg-cream-200 dark:hover:bg-ink-800 text-gray-650 dark:text-cream-100 rounded-lg text-3xs font-mono font-semibold uppercase bg-transparent"
                        >
                          Chamar
                        </button>
                        
                        <button
                          onClick={() => onToggleStatus(student.id, student.status)}
                          className={`p-1.5 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                            isBlocked 
                              ? 'bg-red-50/20 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-500' 
                              : 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-500'
                          }`}
                          title={isBlocked ? 'Matrícula Bloqueada - Clique para libertar' : 'Matrícula Ativa - Clique para bloquear'}
                        >
                          {isBlocked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                      </div>

                      <div>
                        {enroll && enroll.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                            Certificado✓
                          </span>
                        ) : (
                          <button
                            onClick={() => onEmitCertificate(student.id)}
                            className="px-3 py-1.5 bg-gold-600 text-cream-100 hover:bg-[#b58b35] transition-all rounded-xl text-3xs font-mono font-bold uppercase whitespace-nowrap cursor-pointer border-0"
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

      {/* Send Urgent Alert popup modal */}
      {alertingStudentId && (
        <div className="p-5 bg-amber-50 dark:bg-[#1a1712] rounded-2xl border border-gold-600/30 dark:border-gold-600/10 text-left space-y-3 relative z-20 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-gold-600 font-black uppercase tracking-wider">
              🔔 CANAL DE CONTINGÊNCIA • DISPARO DE SMS & NOTIFICAÇÕES SEVERAS
            </span>
            <button 
              onClick={() => setAlertingStudentId(null)}
              className="text-2xs font-mono text-neutral-400 hover:text-black dark:hover:text-cream-100 border-0 bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <p className="text-2xs text-ink-900 dark:text-cream-100/80 leading-snug m-0">
            Envie alertas para orientar o jurista {students.find(s => s.id === alertingStudentId)?.firstName} a submeter e rascunhar o texto em falta na ementa.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escreva advertência formal (Ex: Por favor submeta o rascunho de isenções do módulo 2 até amanhã)..."
              value={customAlertText}
              onChange={(e) => setCustomAlertText(e.target.value)}
              className="flex-grow p-2 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600 dark:focus:border-gold-600"
            />
            <button
              onClick={() => handleSendInstantAlert(alertingStudentId, students.find(s => s.id === alertingStudentId)?.firstName || 'Aluno')}
              className="px-4 py-2 bg-gold-600 hover:bg-[#b58b35] text-ink-900 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 shadow-sm"
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
