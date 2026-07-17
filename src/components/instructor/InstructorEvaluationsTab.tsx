import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  CheckCheck, 
  FileText, 
  TrendingUp, 
  Award, 
  HelpCircle,
  MessageSquare,
  Users,
  Loader2
} from 'lucide-react';
import { User, Course } from '../../types';
import { assignmentService } from '../../services/supabase/assignmentService';
import { academicService } from '../../services/supabase/academicService';
import { useToast } from '../ui/Toast';

interface InstructorEvaluationsTabProps {
  students: User[];
  courses: Course[];
  currentUser: User | null;
}

export default function InstructorEvaluationsTab({
  students,
  courses,
  currentUser
}: InstructorEvaluationsTabProps) {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'grade'>('grade');

  // ──────── ESTADOS DE CRIAÇÃO DE AVALIAÇÃO ────────
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Exame Prático');
  const [newMinGrade, setNewMinGrade] = useState(70);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // ──────── DADOS REAIS DO SUPABASE ────────
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ──────── MÓDULOS DINÂMICOS ────────
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  // ──────── ESTADOS DE CORREÇÃO ────────
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState(0);
  const [individualFeedbackText, setIndividualFeedbackText] = useState('');
  const [grading, setGrading] = useState(false);

  // ──────── FEEDBACK COLETIVO ────────
  const [collectiveBroadcastText, setCollectiveBroadcastText] = useState('');
  const [broadcastCourseId, setBroadcastCourseId] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // ──────── CARREGAR DADOS ────────
  const loadEvaluationData = async () => {
    if (!currentUser?.id) return;
    setLoadingData(true);
    try {
      const [assigns, subs] = await Promise.all([
        assignmentService.getAssignmentsByTeacher(currentUser.id),
        assignmentService.getPendingSubmissions(currentUser.id)
      ]);
      setAssignments(assigns || []);
      setPendingSubmissions(subs || []);
    } catch (err) {
      console.error('Error loading evaluation data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadEvaluationData();
  }, [currentUser?.id]);

  // Selecionar primeiro curso por defeito
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
      setBroadcastCourseId(courses[0].id);
    }
  }, [courses]);

  // Carregar módulos quando o curso muda
  useEffect(() => {
    if (!selectedCourseId) return;
    const loadModules = async () => {
      try {
        const mods = await academicService.getCourseModules(selectedCourseId);
        setAvailableModules(mods || []);
        if (mods.length > 0) setSelectedModuleId(mods[0].id);
      } catch (err) {
        console.error('Error loading modules:', err);
        setAvailableModules([]);
      }
    };
    loadModules();
  }, [selectedCourseId]);

  // Selecionar primeira submissão pendente
  useEffect(() => {
    if (pendingSubmissions.length > 0 && !selectedSubmissionId) {
      setSelectedSubmissionId(pendingSubmissions[0].id);
    }
  }, [pendingSubmissions]);

  // ──────── CRIAR AVALIAÇÃO ────────
  const handleRegisterAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedCourseId || !currentUser?.id) return;

    setCreatingAssignment(true);
    try {
      await assignmentService.createAssignment({
        course_id: selectedCourseId,
        teacher_id: currentUser.id,
        titulo: newTitle,
        descricao: `Tipo: ${newType} | Nota mínima: ${newMinGrade}/100`,
        due_date: null,
        lesson_id: selectedModuleId || undefined,
        status: 'PUBLISHED'
      });

      toast.success(`Avaliação "${newTitle}" publicada com sucesso!`);
      setNewTitle('');
      setActiveSubTab('grade');
      loadEvaluationData();
    } catch (err: any) {
      toast.error(`Erro ao publicar avaliação: ${err.message || err}`);
    } finally {
      setCreatingAssignment(false);
    }
  };

  // ──────── ATRIBUIR NOTA ────────
  const handleGradeSubmit = async (submissionId: string) => {
    setGrading(true);
    try {
      await assignmentService.gradeSubmission(submissionId, gradeValue, individualFeedbackText || undefined);
      toast.success(`Nota de ${gradeValue}/100 atribuída com sucesso!`);
      setIndividualFeedbackText('');
      setSelectedSubmissionId(null);
      loadEvaluationData();
    } catch (err: any) {
      toast.error(`Erro ao atribuir nota: ${err.message || err}`);
    } finally {
      setGrading(false);
    }
  };

  // ──────── FEEDBACK COLETIVO ────────
  const handleBroadcastCollectiveFeedback = async () => {
    if (!collectiveBroadcastText.trim() || !broadcastCourseId || !currentUser?.id) return;

    setBroadcasting(true);
    try {
      await assignmentService.broadcastFeedback(currentUser.id, broadcastCourseId, collectiveBroadcastText.trim());
      toast.success('Feedback coletivo transmitido para todos os alunos do curso!');
      setCollectiveBroadcastText('');
    } catch (err: any) {
      toast.error(`Erro ao transmitir feedback: ${err.message || err}`);
    } finally {
      setBroadcasting(false);
    }
  };

  // Submissão selecionada atual
  const currentSubmission = pendingSubmissions.find((s: any) => s.id === selectedSubmissionId);

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Top selection navbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-ink-900 p-4 rounded-3xl border border-gray-150 dark:border-ink-800/60 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-600/[0.01] to-transparent pointer-events-none" />
        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => setActiveSubTab('grade')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 transition-all ${
              activeSubTab === 'grade' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'text-neutral-400 dark:text-cream-200/60 hover:bg-cream-200 dark:hover:bg-ink-800 bg-transparent'
            }`}
          >
            Corrigir Trabalhos Submetidos
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 transition-all ${
              activeSubTab === 'create' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'text-neutral-400 dark:text-cream-200/60 hover:bg-cream-200 dark:hover:bg-ink-800 bg-transparent'
            }`}
          >
            Formular Nova Avaliação
          </button>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-cream-200/60 font-bold uppercase hidden md:inline relative z-10">
          {pendingSubmissions.length} JURISTAS AGUARDANDO NOTA
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        <div className="lg:col-span-8">

          {/* ──── TAB: CORREÇÃO MANUAL ──── */}
          {activeSubTab === 'grade' && (
            <div className="space-y-6">

              {loadingData ? (
                <div className="flex items-center justify-center py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
                  <span className="ml-3 text-xs text-neutral-400">A carregar submissões...</span>
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="bg-cream-100 dark:bg-ink-900 p-8 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-gold-600/40 mx-auto" />
                  <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Nenhuma submissão pendente</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">Todos os trabalhos foram corrigidos ou ainda não foram submetidos. Novas submissões aparecerão aqui em tempo real.</p>
                </div>
              ) : (
                <>
                  {/* Selecionar submissão */}
                  <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                    <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Seleccione o Rascunho Prático do Formando</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingSubmissions.map((sub: any) => {
                        const studentName = sub.student?.nome_completo || 'Aluno';
                        const taskTitle = sub.assignment?.titulo || 'Tarefa';
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setGradeValue(sub.grade || 0);
                            }}
                            className={`p-3 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              selectedSubmissionId === sub.id
                                ? 'border-gold-600 bg-ink-900/5 dark:bg-gold-600/5'
                                : 'border-cream-150 dark:border-ink-800/80 bg-transparent hover:border-cream-250 dark:hover:border-ink-700'
                            }`}
                          >
                            <div>
                              <h4 className="text-2xs font-serif font-black m-0 leading-tight text-ink-900 dark:text-cream-100">{studentName}</h4>
                              <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 block mt-0.5">{taskTitle}</span>
                            </div>
                            <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded mt-2.5 inline-block self-start bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                              Pendente
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ver submissão selecionada */}
                  {currentSubmission && (
                    <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-6 text-left">
                      <div className="border-b border-gray-150 dark:border-ink-800/60 pb-4">
                        <span className="text-[9px] font-mono text-gold-600 uppercase tracking-wider block font-bold">DRAFTING MANUSCRITO PARA DISCUSSÃO RECURSAL</span>
                        <h4 className="text-md font-serif font-black text-ink-900 dark:text-cream-100 mt-1 m-0">{currentSubmission.assignment?.titulo || 'Tarefa'}</h4>
                        <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">
                          ESTUDANTE: {currentSubmission.student?.nome_completo || 'Aluno'} ({currentSubmission.student?.email || ''})
                        </p>
                      </div>

                      {/* Texto submetido */}
                      {currentSubmission.submission_text && (
                        <div className="p-5 sm:p-7 bg-[#FAF9F5] dark:bg-ink-950/40 border-l-4 border-gold-600 rounded-r-2xl font-mono text-xs text-slate-800 dark:text-cream-100 leading-relaxed shadow-inner select-text">
                          {currentSubmission.submission_text}
                        </div>
                      )}

                      {currentSubmission.submission_url && (
                        <div className="p-3 bg-cream-200 dark:bg-ink-800 rounded-xl border border-gray-150 dark:border-ink-800/60">
                          <span className="text-[9px] font-mono text-neutral-400 uppercase block mb-1">Ficheiro Submetido:</span>
                          <a href={currentSubmission.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-600 hover:underline break-all">
                            {currentSubmission.submission_url}
                          </a>
                        </div>
                      )}

                      {/* Formulário de correção */}
                      <div className="bg-cream-200 dark:bg-ink-850 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 space-y-4">
                        <span className="text-[9.5px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold">PARECER RECURSAL DO TUTOR</span>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase mb-1">Nota Quantitativa (0 - 100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(Number(e.target.value))}
                              className="w-full p-2.5 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl font-serif font-black text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                            />
                          </div>
                          <div className="w-full sm:w-2/3">
                            <label className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase mb-1">Feedback Corretivo Individual</label>
                            <input
                              type="text"
                              value={individualFeedbackText}
                              onChange={(e) => setIndividualFeedbackText(e.target.value)}
                              placeholder="Ex: Excelente precisão vocabular ao citar as regras locais de Luanda..."
                              className="w-full p-2.5 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleGradeSubmit(currentSubmission.id)}
                          disabled={grading}
                          className="w-full py-2.5 bg-gold-600 hover:bg-[#b58b35] border-0 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {grading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>A GUARDAR NOTA...</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck size={14} />
                              <span>Guardar Notas e Notificar Jurista</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Feedback Coletivo */}
              <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                <div>
                  <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Feedback e Aviso Coletivo (Todas as Turmas)</h4>
                  <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5 uppercase">MURAL DE NOTAS DE MODERAÇÃO</p>
                </div>

                <div className="space-y-3">
                  <select
                    value={broadcastCourseId}
                    onChange={(e) => setBroadcastCourseId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                  >
                    <option value="">-- Selecione o Curso Destinatário --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <textarea
                    rows={3}
                    placeholder="Escreva orientações gerais válidas para todos os alunos do curso selecionado..."
                    value={collectiveBroadcastText}
                    onChange={(e) => setCollectiveBroadcastText(e.target.value)}
                    className="w-full p-3 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />

                  <button
                    onClick={handleBroadcastCollectiveFeedback}
                    disabled={!collectiveBroadcastText.trim() || !broadcastCourseId || broadcasting}
                    className="px-4 py-2 bg-cream-200 dark:bg-ink-800 hover:bg-gold-600 dark:hover:bg-gold-600 text-neutral-400 dark:text-cream-200 hover:text-ink-900 dark:hover:text-ink-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {broadcasting ? 'A ENVIAR...' : 'Transmitir Feedback Coletivo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──── TAB: CRIAR AVALIAÇÃO ──── */}
          {activeSubTab === 'create' && (
            <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-6">
              <div>
                <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg m-0">Criar Novo Instrumento de Avaliação</h4>
                <p className="text-xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">GERADOR DE SESSÕES EXAMINADORAS</p>
              </div>

              <form onSubmit={handleRegisterAssessment} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Título Curricular da Prova</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Exame Escrito: Elaboração de Contratos de Concessão de Mineração"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Curso */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Curso Associado</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="">-- Selecione --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Tipo de Instrumento</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="Questionário Rápido">Questionário Rápido (LMS)</option>
                      <option value="Trabalho de Pesquisa">Trabalho de Pesquisa / Documental</option>
                      <option value="Exame Prático">Exame Prático / Defesa Oral</option>
                    </select>
                  </div>

                  {/* Nota mínima */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Nota de Corte Mínima (0-100)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newMinGrade}
                      onChange={(e) => setNewMinGrade(Number(e.target.value))}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl font-serif font-bold text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                    />
                  </div>

                  {/* Módulo — DINÂMICO */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Vínculo de Módulo</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="">-- Sem módulo específico --</option>
                      {availableModules.map((mod: any) => (
                        <option key={mod.id} value={mod.id}>{mod.titulo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingAssignment || !selectedCourseId}
                  className="w-full py-3 bg-gold-600 hover:bg-[#b58b35] border-0 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {creatingAssignment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A PUBLICAR NO SUPABASE...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      <span>Publicar Avaliação no LMS das Turmas</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ──── COLUNA DIREITA: BANCO DE PROVAS ──── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-4">
            <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Banco de Provas Vigentes</span>
            
            {assignments.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">Nenhuma avaliação criada ainda.</p>
            ) : (
              <div className="space-y-3.5">
                {assignments.map((quiz: any) => (
                  <div key={quiz.id} className="p-3 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-150 dark:border-ink-800/60 rounded-2xl text-left space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gold-600 font-bold">
                      <span>{quiz.course_title || 'Curso'}</span>
                      <span className="text-neutral-400 dark:text-cream-200/40 font-semibold uppercase">{quiz.status}</span>
                    </div>
                    <h5 className="font-serif font-black text-ink-900 dark:text-cream-100 text-2xs m-0 leading-tight">{quiz.titulo}</h5>
                    <span className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60">{quiz.descricao || 'Sem descrição'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
