import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Upload,
  Paperclip,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { academicService } from '../../services/supabase/academicService';
import { supabase } from '../../lib/supabase/client';

interface StudentTasksTabProps {
  userId?: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  submittedFile?: string;
  feedback?: {
    score: number;
    text: string;
  };
}

export default function StudentTasksTab({ userId }: StudentTasksTabProps) {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'OVERDUE'>('PENDING');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const fetchTasksAndSubmissions = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Buscar tarefas ativas dos cursos matriculados
      const rawAssignments = await academicService.getStudentAssignments(userId);
      
      // 2. Buscar submissões do aluno para estas tarefas
      const { data: submissions, error: subError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', userId);

      if (subError) throw subError;

      const submissionsMap = new Map<string, any>();
      if (submissions) {
        submissions.forEach(sub => {
          submissionsMap.set(sub.assignment_id, sub);
        });
      }

      const formattedTasks: TaskItem[] = rawAssignments.map(asm => {
        const submission = submissionsMap.get(asm.id);
        const hasSubmission = !!submission;
        
        let status: 'PENDING' | 'COMPLETED' | 'OVERDUE' = 'PENDING';
        if (hasSubmission) {
          status = 'COMPLETED';
        } else if (asm.due_date && new Date(asm.due_date) < new Date()) {
          status = 'OVERDUE';
        }

        // Formatar data
        let formattedDate = '';
        if (asm.due_date) {
          const d = new Date(asm.due_date);
          formattedDate = d.toLocaleDateString('pt-AO') + ' ' + d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
        }

        return {
          id: asm.id,
          title: asm.titulo,
          description: asm.descricao || 'Nenhuma instrução complementar fornecida.',
          dueDate: formattedDate,
          points: 100, // Pontuação padrão recomendada
          status,
          submittedFile: submission?.submission_url 
            ? submission.submission_url.split('/').pop() || 'Ficheiro de Submissão'
            : undefined,
          feedback: submission?.feedback || submission?.grade !== null && submission?.grade !== undefined
            ? {
                score: Number(submission.grade) || 0,
                text: submission.feedback || 'Tarefa avaliada pelo corpo docente.'
              }
            : undefined
        };
      });

      setTasks(formattedTasks);
      
      if (formattedTasks.length > 0 && !selectedTaskId) {
        setSelectedTaskId(formattedTasks[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar tarefas do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSubmissions();
  }, [userId]);

  const filteredTasks = tasks.filter(t => t.status === activeTab);

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFileToUpload(file);
      setUploadedFileName(file.name);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileToUpload(file);
      setUploadedFileName(file.name);
    }
  };

  const handleSubmitTask = async () => {
    if (!fileToUpload || !selectedTaskId || !userId) return;
    
    setSuccessAnimation(true);
    try {
      // 1. Upload do arquivo para o Supabase Storage no bucket 'media'
      const fileExt = fileToUpload.name.split('.').pop();
      const filePath = `assignments/${userId}/${selectedTaskId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obter a URL pública do arquivo
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. Registrar a submissão de tarefa no banco
      await academicService.submitAssignment(selectedTaskId, userId, {
        url: publicUrl,
        text: `Submissão do ficheiro ${fileToUpload.name}`
      });

      // 4. Sucesso! Recarregar
      setTimeout(async () => {
        await fetchTasksAndSubmissions();
        setFileToUpload(null);
        setUploadedFileName(null);
        setIsSubmitOpen(false);
        setSuccessAnimation(false);
        setActiveTab('COMPLETED');
      }, 1000);
      
    } catch (err) {
      console.error('Erro ao submeter tarefa para o Supabase:', err);
      alert('Erro ao submeter arquivo: ' + (err as any).message);
      setSuccessAnimation(false);
    }
  };

  const currentUploadTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative text-left">
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Left Columns - Tasks Folder Directory List */}
      <div className="lg:col-span-8 space-y-4">
        
        <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,155,60,0.04),transparent_50%)] pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Avaliações Letivas</span>
            <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Minhas Tarefas Académicas</h3>
          </div>

          <div className="flex gap-1 border border-gray-150 dark:border-ink-850 bg-cream-200 dark:bg-ink-800/60 p-1 rounded-xl relative z-10 shrink-0">
            {(['PENDING', 'COMPLETED', 'OVERDUE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-3xs font-mono font-bold uppercase transition-all whitespace-nowrap border-0 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-gold-600 text-cream-100 shadow-xs' 
                    : 'text-neutral-400 hover:text-neutral-500 dark:text-cream-200 dark:hover:text-cream-100'
                }`}
              >
                {tab === 'PENDING' ? 'Pendentes' : tab === 'COMPLETED' ? 'Concluídas' : 'Em Atraso'}
              </button>
            ))}
          </div>
        </div>

        {/* Display tasks mapping */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
              <p className="m-0">A carregar tarefas académicas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
              <CheckCircle size={24} className="text-emerald-600 mb-2" />
              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm mb-1">Sem tarefas nesta pasta</h4>
              <p className="m-0 max-w-xs text-center text-[11px] text-neutral-400">
                Tudo em ordem em sua agenda académica para esta secção!
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-cream-100 dark:bg-ink-900 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 hover:border-gold-600/35 dark:hover:border-gold-600/50 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-gold-600/[0.01] to-transparent pointer-events-none" />
                <div className="space-y-2 flex-1 relative z-10">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.status === 'PENDING' && <ClipboardList className="text-gold-600 w-4 h-4 shrink-0" />}
                    {task.status === 'COMPLETED' && <CheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />}
                    {task.status === 'OVERDUE' && <AlertTriangle className="text-red-600 w-4 h-4 shrink-0" />}
                    <span className="text-[9px] font-mono font-bold bg-cream-200 dark:bg-ink-800 text-ink-900 dark:text-cream-100 px-2 py-0.5 rounded border border-gray-150 dark:border-ink-750">
                      VALOR: {task.points} PONTOS
                    </span>
                    {task.status === 'PENDING' && (
                      <span className="text-[9px] font-mono text-amber-600 dark:text-[#E2B755] font-bold">
                        ⏱ {task.dueDate ? `EXPIRA EM: ${task.dueDate}` : 'Sem prazo definido'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 mb-1 leading-snug">{task.title}</h4>
                  <p className="text-[11px] text-neutral-400 dark:text-cream-100/70 font-sans leading-normal m-0">{task.description}</p>
                  
                  {task.submittedFile && (
                    <div className="pt-2 flex items-center gap-1.5 text-2xs text-emerald-700 dark:text-emerald-400 font-mono">
                      <Paperclip size={10} />
                      <span>Ficheiro submetido: {task.submittedFile}</span>
                    </div>
                  )}

                  {task.feedback && (
                    <div className="mt-3 p-3 bg-cream-250 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-cream-200/60">
                        <span>AURA DE CORREÇÃO DOCENTE:</span>
                        <span className="font-bold text-gold-600">{task.feedback.score} / 100</span>
                      </div>
                      <p className="text-2xs text-slate-600 dark:text-cream-100/70 italic m-0">"{task.feedback.text}"</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full sm:w-auto relative z-10">
                  {task.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setIsSubmitOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gold-600 hover:bg-[#b58b35] text-cream-100 text-[10px] font-mono font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border-0 shadow-sm"
                    >
                      <span>Submeter Minuta</span>
                      <ArrowRight size={10} />
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-3xs font-mono font-bold uppercase rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-1 select-none">
                      <Check size={10} />
                      <span>Enviado</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Right Column: Submit Form Drawer Section */}
      <div className="lg:col-span-4 relative z-10">
        {isSubmitOpen && currentUploadTask ? (
          <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gold-600/30 dark:border-gold-600/40 shadow-md text-left space-y-4 sticky top-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gold-600/[0.02] to-transparent pointer-events-none" />
            <div className="border-b border-gray-150 dark:border-ink-800/60 pb-3 flex justify-between items-center relative z-10">
              <div>
                <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest font-bold">SUBMISSÃO DIGITAL MPA</span>
                <h4 className="text-xs font-serif font-black text-ink-900 dark:text-cream-100 m-0">Enviar Minuta Jurídica</h4>
              </div>
              <button 
                onClick={() => { setIsSubmitOpen(false); setUploadedFileName(null); setFileToUpload(null); }}
                className="text-neutral-400 hover:text-gold-600 text-xs font-mono font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="p-3 bg-cream-200 dark:bg-ink-800 rounded-xl space-y-1 relative z-10">
              <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 block uppercase">TAREFA EM FOCO:</span>
              <p className="text-2xs font-serif font-bold text-neutral-400 dark:text-cream-100 m-0 leading-normal">{currentUploadTask.title}</p>
            </div>

            {/* Interactive Drag and Drop Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center min-h-[140px] z-10 ${
                dragOver ? 'border-gold-600 bg-amber-50/20 dark:bg-gold-600/10 shadow-inner' : 'border-gray-200 dark:border-ink-800 hover:border-gold-600/50 dark:hover:border-gold-600/50'
              }`}
            >
              <input
                type="file"
                id="file-task-upload"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc"
              />
              <Upload size={24} className="text-gold-600 mb-2 fill-transparent" />
              <p className="text-xs font-medium text-neutral-400 dark:text-cream-100/80 m-0">Arraste a minuta em PDF ou DOCX</p>
              <p className="text-[10px] font-mono text-neutral-400 dark:text-cream-150 mt-1 m-0">ou clique para selecionar do computador</p>
            </div>

            {uploadedFileName && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-400 rounded-xl flex items-center justify-between relative z-10">
                <span className="font-mono truncate max-w-[170px] block">{uploadedFileName}</span>
                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
              </div>
            )}

            <button
              onClick={handleSubmitTask}
              disabled={!fileToUpload || successAnimation}
              className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-[#E2B755] text-cream-100 hover:scale-[1.02] active:scale-95 disabled:opacity-40 rounded-xl text-2xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 relative z-10"
            >
              {successAnimation ? (
                <>
                  <Loader2 size={14} className="animate-spin text-cream-100 mr-1" />
                  Salvando Cópia no LMS...
                </>
              ) : (
                <>
                  <Check size={12} />
                  Confirmar Submissão Digital
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs text-center py-10 space-y-3 sticky top-28 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gold-600/[0.01] to-transparent pointer-events-none" />
            <ClipboardList size={28} className="text-gold-600 mx-auto opacity-75 relative z-10" />
            <h4 className="text-xs font-serif font-black text-ink-900 dark:text-cream-100 m-0 relative z-10">Submissão Facilitada</h4>
            <p className="text-2xs text-neutral-400 dark:text-cream-100/70 font-sans leading-relaxed max-w-[190px] mx-auto m-0 relative z-10">Selecione o botão <strong>Submeter Minuta</strong> em qualquer tarefa ativa para carregar suas respostas.</p>
          </div>
        )}
      </div>

    </div>
  );
}
