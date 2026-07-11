import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { User, Course } from '../../types';

interface InstructorEvaluationsTabProps {
  students: User[];
  courses: Course[];
}

export default function InstructorEvaluationsTab({
  students,
  courses
}: InstructorEvaluationsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'grade'>('grade');

  // Interactive states for assessment formulation
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Exame Prático');
  const [newMinGrade, setNewMinGrade] = useState(70);
  const [newScope, setNewScope] = useState('isencao-responsabilidade');

  // Interactive states for manual grading
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(1);
  const [gradeValue, setGradeValue] = useState(90);
  const [individualFeedbackText, setIndividualFeedbackText] = useState('');
  const [collectiveBroadcastText, setCollectiveBroadcastText] = useState('');

  // Sample pending student draft submissions for grading
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      studentName: 'Dr. António Ferreira Carvalho',
      studentEmail: 'antonio@advogados.ao',
      courseName: 'English for the Legal Field in Angola',
      taskTitle: 'Redação Prática de Cláusula de Isenção (Indemnity) - Mês II',
      submittedText: `ARTICLE 12 - INDEMNIFICATION AND LIABILITY EXCLUSION
The Pre-Contracting Party shall indemnify, defend, and hold harmless the Host Entity from and against any and all claims, liabilities, losses, damages, costs, and expenses (including reasonable attorneys' fees under the regulations of Huambo bar) arising out of or resulting from any material breach of representational warranty, negligence, or willful omission in executing the oil extraction services.`,
      status: 'Pendente'
    },
    {
      id: 2,
      studentName: 'Dra. Patrícia dos Santos (Pre-Registada)',
      studentEmail: 'patricia@gmail.com',
      courseName: 'Advanced Legal Writing',
      taskTitle: 'Drafting Contract Exclusions (Termination Trigger Clauses)',
      submittedText: `Any termination under clause 9.2 shall not trigger any loss of proprietary rights of the service provider, unless such termination has occurred through willful negligence or non-conclusive compliance audits.`,
      status: 'Pendente'
    }
  ]);

  const [quizzesList, setQuizzesList] = useState([
    { title: 'Exame Final de Oratória Legal (Mock Arbitration - Huambo)', type: 'Avaliação Prática', weight: '50% Peso', minGrade: 85 },
    { title: 'Trabalho Escrito: Tradução e Drafting de Concessões Petrolíferas', type: 'Trabalho de Pesquisa', weight: '30% Peso', minGrade: 70 },
    { title: 'Questionário Semanal: Boilerplate & Exclusões Gerais', type: 'Questionário Rápido', weight: '20% Peso', minGrade: 60 }
  ]);

  const handleRegisterAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setQuizzesList([
      {
        title: newTitle,
        type: newType,
        weight: 'Nota Complementar',
        minGrade: newMinGrade
      },
      ...quizzesList
    ]);

    alert(`Nova avaliação "${newTitle}" publicada com sucesso para toda a turma!`);
    setNewTitle('');
    setActiveSubTab('grade');
  };

  const handleGradeSubmit = (subId: number) => {
    setSubmissions(prev => prev.map(sub => {
      if (sub.id === subId) {
        return {
          ...sub,
          status: `Corrigido • Nota: ${gradeValue}/100`
        };
      }
      return sub;
    }));
    alert(`Rascunho jurídico avaliado! Nota de ${gradeValue}/100 atribuída com sucesso!`);
    setIndividualFeedbackText('');
  };

  const handleBroadcastCollectiveFeedback = () => {
    if (!collectiveBroadcastText.trim()) return;
    alert(`Nota informativa coletiva transmitida para todo o curso: "${collectiveBroadcastText}"`);
    setCollectiveBroadcastText('');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top selection navbar */}
      <div className="flex justify-between items-center bg-cream-100 p-4 rounded-3xl border border-gray-150">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('grade')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 ${
              activeSubTab === 'grade' ? 'bg-ink-900 text-cream-100 shadow' : 'text-neutral-400 hover:bg-cream-200'
            }`}
          >
            Corrigir Trabalhos Sometidos
          </button>
          
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 ${
              activeSubTab === 'create' ? 'bg-ink-900 text-cream-100 shadow' : 'text-neutral-400 hover:bg-cream-200'
            }`}
          >
            Formular Nova Avaliação
          </button>
        </div>

        <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase hidden md:inline">
          {submissions.filter(s => s.status === 'Pendente').length} JURISTAS AGUARDANDO NOTA
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT WORKSPACE VIEW */}
        <div className="lg:col-span-8">
          
          {/* TAB 1 - CORREÇÃO MANUAL */}
          {activeSubTab === 'grade' && (
            <div className="space-y-6">
              
              {/* Select submission trigger */}
              <div className="bg-cream-100 p-5 rounded-3xl border border-gray-150 space-y-4 text-left">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold border-b border-gray-100 pb-2">Seleccione o Rascunho Prático do Formando</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {submissions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubmissionId(sub.id);
                        setGradeValue(sub.status.includes('Nota:') ? Number(sub.status.split('Nota: ')[1].split('/')[0]) : 88);
                      }}
                      className={`p-3 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        selectedSubmissionId === sub.id
                          ? 'border-gold-600 bg-ink-900/5 text-ink-900'
                          : 'border-gray-100 hover:border-gray-200 text-neutral-400'
                      }`}
                    >
                      <div>
                        <h4 className="text-2xs font-serif font-black m-0 leading-tight">{sub.studentName}</h4>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">{sub.taskTitle}</span>
                      </div>
                      <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded mt-2.5 inline-block self-start ${
                        sub.status === 'Pendente' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {sub.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Selected Submission Document Content */}
              {selectedSubmissionId && (
                (() => {
                  const currentSub = submissions.find(s => s.id === selectedSubmissionId);
                  if (!currentSub) return null;

                  return (
                    <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 space-y-6 text-left">
                      <div className="border-b border-gray-100 pb-4">
                        <span className="text-[9px] font-mono text-gold-600 uppercase tracking-wider block font-bold">DRAFTING MANUSCRITO PARA DISCUSSÃO RECURSAL</span>
                        <h4 className="text-md font-serif font-black text-ink-900 mt-1 m-0">{currentSub.taskTitle}</h4>
                        <p className="text-2xs text-neutral-400 font-mono mt-0.5">ESTUDANTE: {currentSub.studentName} ({currentSub.studentEmail})</p>
                      </div>

                      {/* Display paper paper skeuomorphic */}
                      <div className="p-5 sm:p-7 bg-[#FAF9F5] border-l-4 border-gold-600 rounded-r-2xl font-mono text-xs text-neutral-400 leading-relaxed shadow-inner select-text">
                        {currentSub.submittedText}
                      </div>

                      {/* Manual Evaluation Score formulation */}
                      <div className="bg-cream-200 p-5 rounded-2xl border border-gray-150 space-y-4">
                        <span className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">PARECER RECURSAL DO TUTOR</span>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-[8px] font-mono text-neutral-400 uppercase mb-1">Nota Quantitativa (0 - 100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(Number(e.target.value))}
                              className="w-full p-2.5 text-xs bg-cream-100 rounded-xl border border-gray-200 font-serif font-black text-center text-slate-800"
                            />
                          </div>

                          <div className="w-full sm:w-2/3">
                            <label className="block text-[8px] font-mono text-neutral-400 uppercase mb-1">Feedback Corretivo Individual</label>
                            <input
                              type="text"
                              value={individualFeedbackText}
                              onChange={(e) => setIndividualFeedbackText(e.target.value)}
                              placeholder="Ex: Excelente precisão vocabular ao citar as regras locais de Luanda..."
                              className="w-full p-2.5 text-xs bg-cream-100 rounded-xl border border-gray-200 text-slate-800"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleGradeSubmit(currentSub.id)}
                          className="w-full py-2.5 bg-ink-900 hover:bg-gold-600 hover:text-slate-900 border-0 text-cream-100 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCheck size={14} />
                          <span>Guardar Notas e Notificar Jurista por SMS</span>
                        </button>
                      </div>

                    </div>
                  );
                })()
              )}

              {/* Collective Feedback module */}
              <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 space-y-4 text-left">
                <div>
                  <h4 className="font-serif font-black text-ink-900 text-sm m-0">Feedback e Aviso Coletivo (Todas as Turmas)</h4>
                  <p className="text-2xs text-neutral-400 font-mono mt-0.5 uppercase">MURAL DE NOTAS DE MODERAÇÃO</p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="Escreva orientações gerais válidas para todos (Ex: Lembrem-se que no Art. 230 do código civil angolano, ambiguidades se resolvem contra o redator)..."
                    value={collectiveBroadcastText}
                    onChange={(e) => setCollectiveBroadcastText(e.target.value)}
                    className="w-full p-3 text-xs bg-cream-200 border border-gray-200 rounded-xl text-slate-800"
                  />

                  <button
                    onClick={handleBroadcastCollectiveFeedback}
                    disabled={!collectiveBroadcastText.trim()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gold-600 text-neutral-400 hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Transmitir Feedback Coletivo
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2 - FORMULAR NOVA AVALIAÇÃO */}
          {activeSubTab === 'create' && (
            <div className="bg-cream-100 p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              <div>
                <h4 className="font-serif font-black text-ink-900 text-lg m-0">Criar Novo Instrumento de Avaliação</h4>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">GERADOR DE SESSÕES EXAMINADORAS</p>
              </div>

              <form onSubmit={handleRegisterAssessment} className="space-y-4">
                
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">Título Curricular da Prova</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Exame Escrito: Elaboração de Contratos de Concessão de Mineração"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl text-slate-800 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">Tipo de Instrumento</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 border border-gray-200 rounded-xl text-slate-800"
                    >
                      <option value="Questionário Rápido">Questionário Rápido (LMS)</option>
                      <option value="Trabalho de Pesquisa">Trabalho de Pesquisa / Documental</option>
                      <option value="Exame Prático">Exame Prático / Defesa Oral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5 font-sans">Nota de Corte Mínima (0-100)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newMinGrade}
                      onChange={(e) => setNewMinGrade(Number(e.target.value))}
                      className="w-full p-2.5 text-xs bg-cream-200 border border-gray-200 rounded-xl font-serif font-bold text-center text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider mb-1.5">Vinculo de Módulo</label>
                    <select
                      value={newScope}
                      onChange={(e) => setNewScope(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 border border-gray-200 rounded-xl text-slate-800"
                    >
                      <option value="sistema-legal">Mês I: Common Law vs. Civil Law</option>
                      <option value="isencao-responsabilidade">Mês II: Condições de Prova e Isenção</option>
                      <option value="compliances">Mês III: Defesa Escrita e Oral Fictícia</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-ink-900 hover:bg-gold-600 hover:text-slate-900 border-0 text-cream-100 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
          
          <div className="bg-cream-100 p-5 rounded-3xl border border-gray-150 text-left space-y-4">
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold border-b border-gray-100 pb-2">Banco de Provas Vigentes</span>
            
            <div className="space-y-3.5">
              {quizzesList.map((quiz, idx) => (
                <div key={idx} className="p-3 bg-cream-200/50 border border-gray-150 rounded-2xl text-left space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-gold-600 font-bold">
                    <span>{quiz.type}</span>
                    <span className="text-neutral-400 font-semibold">{quiz.weight}</span>
                  </div>
                  <h5 className="font-serif font-black text-ink-900 text-2xs m-0 leading-tight">
                    {quiz.title}
                  </h5>
                  <span className="block text-[8px] font-mono text-neutral-400">Pontuação Mínima: {quiz.minGrade}/100</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
