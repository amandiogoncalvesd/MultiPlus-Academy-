import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Upload,
  Paperclip,
  Check,
  Award
} from 'lucide-react';

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

export default function StudentTasksTab() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'OVERDUE'>('PENDING');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('task_1');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task_1',
      title: 'Structural translation: Oil and Gas Concession regulations',
      description: 'Traduzir os artigos 5 a 12 da regulamentação nacional de Conteúdo Local (Lei 27/21 de Angola) para inglês técnico, justificando a escolha dos verbos modais (shall, may, must).',
      dueDate: '2026-06-15',
      points: 100,
      status: 'PENDING'
    },
    {
      id: 'task_2',
      title: 'Minuting draft: Indemnification and Limitation of Liability Boilerplates',
      description: 'Estruturar rascunho de compromisso de isenção mútua de perdas comerciais entre um consórcio contratual no Porto do Huambo e operadora marítima transnacional.',
      dueDate: '2026-06-25',
      points: 100,
      status: 'PENDING'
    },
    {
      id: 'task_3',
      title: 'Quiz 1: Civil Law vs Common Law foundational concepts',
      description: 'Questionário de fixação automatizado cobrindo as origens, Stare Decisis, doutrinas e diferenças estruturais para juristas de países lusófonos.',
      dueDate: '2026-06-05',
      points: 50,
      status: 'COMPLETED',
      submittedFile: 'quiz_1_submission_dr_antonio.pdf',
      feedback: {
        score: 48,
        text: 'Excelente clareza conceitual demonstrada ao diferenciar a codificação estrita do nosso direito e a maleabilidade das cortes judiciais saxónicas.'
      }
    },
    {
      id: 'task_4',
      title: 'Grammar exercise: Formal Legal Advisory Writing Ethics',
      description: 'Análise de e-mails formais e substituição de expressões redundantes ou coloquiais por verbos latinos aceitáveis no direito internacional.',
      dueDate: '2026-05-28',
      points: 100,
      status: 'OVERDUE'
    }
  ]);

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
      setUploadedFile(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0].name);
    }
  };

  // Process task upload state change
  const handleSubmitTask = () => {
    if (!uploadedFile) return;
    
    setSuccessAnimation(true);
    setTimeout(() => {
      // update task state
      setTasks(prev => prev.map(t => {
        if (t.id === selectedTaskId) {
          return {
            ...t,
            status: 'COMPLETED',
            submittedFile: uploadedFile
          };
        }
        return t;
      }));

      // reset upload drawer helper variables
      setUploadedFile(null);
      setIsSubmitOpen(false);
      setSuccessAnimation(false);
      setActiveTab('COMPLETED');
    }, 1500);
  };

  const currentUploadTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Columns - Tasks Folder Directory List */}
      <div className="lg:col-span-8 space-y-4">
        
        <div className="bg-cream-100 p-5 rounded-3xl border border-gray-150 shadow-sm text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Avaliações Letivas</span>
            <h3 className="text-lg font-serif font-black text-ink-900 m-0">Minhas Tarefas Académicas</h3>
          </div>

          <div className="flex gap-1 border border-gray-100 bg-cream-200 p-1 rounded-xl">
            {(['PENDING', 'COMPLETED', 'OVERDUE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-3xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-ink-900 text-cream-100 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-400'
                }`}
              >
                {tab === 'PENDING' ? 'Pendentes' : tab === 'COMPLETED' ? 'Concluídas' : 'Em Atraso'}
              </button>
            ))}
          </div>
        </div>

        {/* Display tasks mapping */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-16 bg-cream-100 rounded-3xl border border-gray-150 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
              <CheckCircle size={24} className="text-emerald-600 mb-2" />
              <p className="m-0">Sem tarefas nesta pasta. Tudo em ordem em sua agenda acadêmica!</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-cream-100 p-5 rounded-2xl border border-gray-150 hover:border-gold-600/35 transition-all text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    {task.status === 'PENDING' && <ClipboardList className="text-gold-600 w-4 h-4 shrink-0" />}
                    {task.status === 'COMPLETED' && <CheckCircle className="text-emerald-600 w-4 h-4 shrink-0" />}
                    {task.status === 'OVERDUE' && <AlertTriangle className="text-danger-700 w-4 h-4 shrink-0" />}
                    <span className="text-[9px] font-mono font-bold bg-ink-900/5 text-ink-900 px-2 py-0.5 rounded">
                      VALOR: {task.points} PONTOS
                    </span>
                    {task.status === 'PENDING' && (
                      <span className="text-[9px] font-mono text-amber-600 font-bold">⏱ EXPIRA EM: {task.dueDate}</span>
                    )}
                  </div>

                  <h4 className="text-sm font-serif font-black text-ink-900 mb-1">{task.title}</h4>
                  <p className="text-[11px] text-neutral-400 font-sans leading-normal m-0">{task.description}</p>
                  
                  {task.submittedFile && (
                    <div className="pt-2 flex items-center gap-1.5 text-2xs text-emerald-700 font-mono">
                      <Paperclip size={10} />
                      <span>Ficheiro submetido: {task.submittedFile}</span>
                    </div>
                  )}

                  {task.feedback && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>AURA DE CORREÇÃO DOCENTE:</span>
                        <span className="font-bold text-gold-600">{task.feedback.score} / 100</span>
                      </div>
                      <p className="text-2xs text-slate-600 italic m-0">"{task.feedback.text}"</p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {task.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setIsSubmitOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-ink-900 hover:bg-ink-900 text-cream-100 text-[10px] font-mono font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Submeter Minuta</span>
                      <ArrowRight size={10} />
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-3xs font-mono font-bold uppercase rounded-lg border border-emerald-200 flex items-center justify-center gap-1 select-none">
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
      <div className="lg:col-span-4">
        {isSubmitOpen && currentUploadTask ? (
          <div className="bg-cream-100 p-5 rounded-3xl border border-gold-600/30 shadow-md text-left space-y-4 sticky top-28">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest font-bold">SUBMISSÃO DIGITAL MPA</span>
                <h4 className="text-xs font-serif font-black text-ink-900 m-0">Enviar Minuta Jurídica</h4>
              </div>
              <button 
                onClick={() => { setIsSubmitOpen(false); setUploadedFile(null); }}
                className="text-neutral-400 hover:text-neutral-400 text-xs font-mono font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="p-3 bg-cream-200 rounded-xl space-y-1">
              <span className="text-[9px] font-mono text-neutral-400 block uppercase">TAREFA EM FOCO:</span>
              <p className="text-2xs font-serif font-bold text-neutral-400 m-0 leading-normal">{currentUploadTask.title}</p>
            </div>

            {/* Interactive Drag and Drop Mock Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center min-h-[140px] ${
                dragOver ? 'border-gold-600 bg-amber-50/20 shadow-inner' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="file"
                id="file-task-upload"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload size={24} className="text-gold-600 mb-2 fill-neutral-50" />
              <p className="text-xs font-medium text-neutral-400 m-0">Arraste a minuta em PDF ou DOCX</p>
              <p className="text-[10px] font-mono text-neutral-400 mt-1 m-0">ou clique para selecionar do computador</p>
            </div>

            {uploadedFile && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span className="font-mono truncate max-w-[170px] block">{uploadedFile}</span>
                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
              </div>
            )}

            <button
              onClick={handleSubmitTask}
              disabled={!uploadedFile || successAnimation}
              className="w-full py-2.5 bg-gold-600 text-cream-100 hover:bg-[#b58b35] disabled:opacity-40 rounded-xl text-2xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {successAnimation ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
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
          <div className="bg-cream-100 p-5 rounded-3xl border border-gray-150 shadow-sm text-center py-10 space-y-3 sticky top-28">
            <ClipboardList size={28} className="text-gold-600 mx-auto opacity-75" />
            <h4 className="text-xs font-serif font-black text-ink-900 m-0">Submissão Facilitada</h4>
            <p className="text-2xs text-neutral-400 font-sans leading-relaxed max-w-[190px] mx-auto m-0">Selecione o botão <strong>Submeter Minuta</strong> em qualquer tarefa ativa para carregar suas respostas.</p>
          </div>
        )}
      </div>

    </div>
  );
}
