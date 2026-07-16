import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  CheckCheck, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Award, 
  HelpCircle,
  MessageSquare,
  Users,
  ExternalLink,
  Download
} from 'lucide-react';
import { User, Course } from '../../types';
import { useTeacherEvaluations } from '../../hooks/useTeacherEvaluations';
import { useTeacherCourses } from '../../hooks/useTeacherCourses';
import { assignmentService } from '../../services/supabase/assignmentService';
import { academicService, DBModule } from '../../services/supabase/academicService';

interface InstructorEvaluationsTabProps {
  currentUser: User | null;
  students: User[];
  courses: Course[];
}

export default function InstructorEvaluationsTab({
  currentUser,
  students,
  courses: initialCourses
}: InstructorEvaluationsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'grade'>('grade');

  // Load real-time evaluations & assignments
  const { 
    assignments, 
    pendingSubmissions, 
    loading: loadingEvaluations, 
    refetch: refetchEvaluations 
  } = useTeacherEvaluations(currentUser?.id);

  // Load teacher's actual courses
  const { courses: realCourses, loading: loadingCourses } = useTeacherCourses(currentUser?.id);
  const teacherCourses = realCourses.length > 0 ? realCourses : initialCourses;

  // Selected course and module states for creating assessment
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<DBModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  // Interactive states for assessment formulation
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMinGrade, setNewMinGrade] = useState(70);
  const [newDueDate, setNewDueDate] = useState('');

  // Interactive states for manual grading
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState(90);
  const [individualFeedbackText, setIndividualFeedbackText] = useState('');
  const [collectiveBroadcastText, setCollectiveBroadcastText] = useState('');

  // Sync course selection with module loading
  useEffect(() => {
    if (teacherCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(teacherCourses[0].id);
    }
  }, [teacherCourses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setModules([]);
      setSelectedModuleId('');
      return;
    }
    academicService.getCourseModules(selectedCourseId)
      .then(mods => {
        setModules(mods);
        if (mods.length > 0) {
          setSelectedModuleId(mods[0].id);
        } else {
          setSelectedModuleId('');
        }
      })
      .catch(err => {
        console.warn('Error loading modules:', err);
        setModules([]);
        setSelectedModuleId('');
      });
  }, [selectedCourseId]);

  // Set initial selected submission
  useEffect(() => {
    if (pendingSubmissions.length > 0 && !selectedSubmissionId) {
      setSelectedSubmissionId(pendingSubmissions[0].id);
      setGradeValue(90);
      setIndividualFeedbackText('');
    }
  }, [pendingSubmissions, selectedSubmissionId]);

  const handleRegisterAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedCourseId || !currentUser?.id) return;

    try {
      // Calculate due date (default to 14 days from now if not specified)
      const due = newDueDate 
        ? new Date(newDueDate).toISOString() 
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      await assignmentService.createAssignment({
        course_id: selectedCourseId,
        lesson_id: null,
        teacher_id: currentUser.id,
        titulo: newTitle,
        descricao: newDescription || 'Instruções complementares para a resolução prática.',
        due_date: due,
        status: 'PUBLISHED'
      });

      alert(`Nova avaliação "${newTitle}" publicada com sucesso para toda a turma!`);
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      refetchEvaluations();
      setActiveSubTab('grade');
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('Erro ao publicar nova avaliação no Supabase.');
    }
  };

  const handleGradeSubmit = async (subId: string) => {
    if (!subId) return;
    try {
      await assignmentService.gradeSubmission(subId, gradeValue, individualFeedbackText);
      alert(`Rascunho jurídico avaliado! Nota de ${gradeValue}/100 atribuída com sucesso!`);
      
      // Clean up local states and refresh
      setIndividualFeedbackText('');
      setSelectedSubmissionId(null);
      refetchEvaluations();
    } catch (err) {
      console.error('Error submitting grade:', err);
      alert('Erro ao atribuir nota no Supabase.');
    }
  };

  const handleBroadcastCollectiveFeedback = async () => {
    if (!collectiveBroadcastText.trim() || !selectedCourseId || !currentUser?.id) return;
    try {
      const courseObj = teacherCourses.find(c => c.id === selectedCourseId);
      const courseTitle = courseObj?.title || 'Curso';
      
      await assignmentService.broadcastFeedback(
        currentUser.id,
        selectedCourseId,
        `[Feedback Geral de ${courseTitle}]: ${collectiveBroadcastText}`
      );
      
      alert(`Feedback geral transmitido para todos os estudantes do curso: "${collectiveBroadcastText}"`);
      setCollectiveBroadcastText('');
    } catch (err) {
      console.error('Error broadcasting feedback:', err);
      alert('Erro ao transmitir feedback coletivo.');
    }
  };

  const activeSubmission = pendingSubmissions.find(s => s.id === selectedSubmissionId);

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
          {pendingSubmissions.length} TRABALHOS AGUARDANDO CORREÇÃO
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* LEFT WORKSPACE VIEW */}
        <div className="lg:col-span-8">
          
          {/* TAB 1 - CORREÇÃO MANUAL */}
          {activeSubTab === 'grade' && (
            <div className="space-y-6">
              
              {/* Select submission trigger */}
              <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Seleccione o Rascunho Prático do Formando</span>
                
                {pendingSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 dark:text-gray-450">
                    Nenhum trabalho pendente de correção neste momento. Bom trabalho! 🎉
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingSubmissions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmissionId(sub.id);
                          setGradeValue(sub.grade !== null && sub.grade !== undefined ? sub.grade : 90);
                          setIndividualFeedbackText(sub.feedback || '');
                        }}
                        className={`p-3 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selectedSubmissionId === sub.id
                            ? 'border-gold-600 bg-ink-900/5 dark:bg-gold-600/5 text-ink-900 dark:text-cream-100'
                            : 'border-cream-150 dark:border-ink-800/80 bg-transparent hover:border-cream-250 dark:hover:border-ink-700 text-neutral-400'
                        }`}
                      >
                        <div>
                          <h4 className="text-2xs font-serif font-black m-0 leading-tight text-ink-900 dark:text-cream-100">{sub.studentName}</h4>
                          <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 block mt-0.5">{sub.assignmentTitle}</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded mt-2.5 inline-block self-start bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                          Aguardando Nota
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Selected Submission Document Content */}
              {selectedSubmissionId && activeSubmission && (
                <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-6 text-left">
                  <div className="border-b border-gray-150 dark:border-ink-800/60 pb-4">
                    <span className="text-[9px] font-mono text-gold-600 uppercase tracking-wider block font-bold">DRAFTING MANUSCRITO PARA DISCUSSÃO RECURSAL</span>
                    <h4 className="text-md font-serif font-black text-ink-900 dark:text-cream-100 mt-1 m-0">{activeSubmission.assignmentTitle}</h4>
                    <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">ESTUDANTE: {activeSubmission.studentName}</p>
                  </div>

                  {/* Display paper paper skeuomorphic */}
                  {activeSubmission.submission_text ? (
                    <div className="p-5 sm:p-7 bg-[#FAF9F5] dark:bg-ink-950/40 border-l-4 border-gold-600 rounded-r-2xl font-mono text-xs text-slate-800 dark:text-cream-100 leading-relaxed shadow-inner select-text">
                      {activeSubmission.submission_text}
                    </div>
                  ) : (
                    <div className="p-5 text-center border border-dashed border-gray-150 dark:border-ink-800 rounded-2xl text-2xs text-neutral-400">
                      O estudante não enviou resposta escrita direta.
                    </div>
                  )}

                  {activeSubmission.submission_url && (
                    <div className="flex items-center justify-between p-4 bg-cream-200 dark:bg-ink-950 rounded-2xl border border-gray-150 dark:border-ink-800">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gold-600" />
                        <div>
                          <span className="text-2xs font-serif font-black block text-ink-900 dark:text-cream-100">Ficheiro de Submissão</span>
                          <span className="text-[9px] font-mono text-neutral-400">Anexo carregado no Supabase Storage</span>
                        </div>
                      </div>
                      <a 
                        href={activeSubmission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-ink-900 dark:bg-ink-800 hover:bg-gold-600 text-cream-100 hover:text-slate-900 font-mono text-[9px] font-bold rounded-lg tracking-wider transition-all inline-flex items-center gap-1.5"
                      >
                        <Download size={11} /> Descarregar Ficheiro
                      </a>
                    </div>
                  )}

                  {/* Manual Evaluation Score formulation */}
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
                          placeholder="Ex: Excelente precisão vocabular ao citar as regras locais..."
                          className="w-full p-2.5 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleGradeSubmit(activeSubmission.id)}
                      className="w-full py-2.5 bg-gold-600 hover:bg-[#b58b35] border-0 text-cream-100 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCheck size={14} />
                      <span>Guardar Notas e Notificar Jurista por SMS</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Collective Feedback module */}
              <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                <div>
                  <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Feedback e Aviso Coletivo (Todas as Turmas)</h4>
                  <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5 uppercase">MURAL DE NOTAS DE MODERAÇÃO</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase mb-1">Selecione o Curso Alvo</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full p-2 bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-2xs text-slate-800 dark:text-cream-100"
                      >
                        {teacherCourses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Escreva orientações gerais válidas para todos os alunos deste curso..."
                    value={collectiveBroadcastText}
                    onChange={(e) => setCollectiveBroadcastText(e.target.value)}
                    className="w-full p-3 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />

                  <button
                    onClick={handleBroadcastCollectiveFeedback}
                    disabled={!collectiveBroadcastText.trim() || !selectedCourseId}
                    className="px-4 py-2 bg-cream-200 dark:bg-ink-800 hover:bg-gold-600 dark:hover:bg-gold-600 text-neutral-400 dark:text-cream-200 hover:text-ink-900 dark:hover:text-ink-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Transmitir Feedback Coletivo
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2 - FORMULAR NOVA AVALIAÇÃO */}
          {activeSubTab === 'create' && (
            <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-6">
              <div>
                <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg m-0">Criar Novo Instrumento de Avaliação</h4>
                <p className="text-xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">GERADOR DE SESSÕES EXAMINADORAS</p>
              </div>

              <form onSubmit={handleRegisterAssessment} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Curso de Destino</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      {teacherCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Módulo de Referência (Opcional)</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      {modules.length === 0 ? (
                        <option value="">Sem módulos registados</option>
                      ) : (
                        modules.map(mod => (
                          <option key={mod.id} value={mod.id}>{mod.titulo}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

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

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Instruções / Descrição Completa</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escreva os requisitos detalhados e o cenário prático para os juristas..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Data Limite de Resolução</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gold-600 hover:bg-[#b58b35] border-0 text-cream-100 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={14} />
                  <span>Publicar Avaliação no LMS das Turmas</span>
                </button>

              </form>
            </div>
          )}

        </div>

        {/* RIGHT ANALYTICS COLUMN BAR */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-4">
            <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Banco de Provas Vigentes</span>
            
            <div className="space-y-3.5">
              {loadingEvaluations ? (
                <div className="py-8 text-center text-2xs text-neutral-400 font-mono">
                  Carregando avaliações...
                </div>
              ) : assignments.length === 0 ? (
                <div className="p-4 text-center text-2xs text-neutral-400 font-mono border border-dashed border-gray-150 dark:border-ink-800 rounded-2xl">
                  Nenhuma prova vigente registada no Supabase.
                </div>
              ) : (
                assignments.map((asm) => (
                  <div key={asm.id} className="p-3 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-150 dark:border-ink-800/60 rounded-2xl text-left space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gold-600 font-bold">
                      <span>Avaliação Prática</span>
                      <span className="text-neutral-400 dark:text-cream-200/40 font-semibold">100% Peso</span>
                    </div>
                    <h5 className="font-serif font-black text-ink-900 dark:text-cream-100 text-2xs m-0 leading-tight">
                      {asm.titulo}
                    </h5>
                    <span className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60">
                      Limite: {asm.due_date ? new Date(asm.due_date).toLocaleDateString('pt-AO') : 'Sem prazo'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
