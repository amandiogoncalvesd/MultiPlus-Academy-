import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/supabase/academicService';
import { CheckCircle2, AlertTriangle, RefreshCw, Trophy, ArrowRight, Loader2, Award, Play } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizAreaProps {
  lessonId: string;
  userId: string;
  onQuizPassed: () => void;
}

export default function QuizArea({ lessonId, userId, onQuizPassed }: QuizAreaProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  
  // Quiz statistics
  const [correctCount, setCorrectCount] = useState(0);
  const [answersLog, setAnswersLog] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // DB States
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadQuizAndSubmission = async () => {
    if (!lessonId || !userId) return;
    setLoading(true);
    setHasError(false);
    setQuizStarted(false);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setHasSubmittedCurrent(false);
    setCorrectCount(0);
    setAnswersLog([]);
    setAlreadyPassed(false);
    setLastScore(null);
    
    try {
      // 1. Check existing submissions
      const submissions = await academicService.getQuizSubmissions(userId);
      const pastSubmission = submissions.find(s => s.lesson_id === lessonId);
      if (pastSubmission) {
        setLastScore(pastSubmission.score);
        if (pastSubmission.score >= 100) {
          setAlreadyPassed(true);
        }
      }

      // 2. Fetch quiz questions
      const dbQuiz = await academicService.getQuizByLesson(lessonId);
      
      if (dbQuiz && dbQuiz.length > 0) {
        setQuestions(dbQuiz as QuizQuestion[]);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error loading quiz area data:', err);
      setHasError(true);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizAndSubmission();
  }, [lessonId, userId]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setHasSubmittedCurrent(false);
    setCorrectCount(0);
    setAnswersLog([]);
  };

  const handleSubmitQuestion = () => {
    if (selectedOption === null || questions.length === 0) return;

    const currentQ = questions[currentQuestionIdx];
    const correct = selectedOption === currentQ.correctAnswer;
    
    setIsCurrentCorrect(correct);
    setHasSubmittedCurrent(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }

    // Log this response
    setAnswersLog(prev => [
      ...prev,
      {
        question: currentQ.question,
        selectedOption,
        correctOption: currentQ.correctAnswer,
        correct
      }
    ]);
  };

  const handleNextOrFinish = async () => {
    if (currentQuestionIdx < questions.length - 1) {
      // Avançar para a próxima questão
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasSubmittedCurrent(false);
    } else {
      // Fim do quiz: submeter pontuação cumulativa
      setSaving(true);
      const finalCorrect = isCurrentCorrect ? correctCount + 1 : correctCount;
      const scorePercent = Math.round((finalCorrect / questions.length) * 100);

      try {
        await academicService.submitQuizResponse(userId, lessonId, scorePercent, {
          totalQuestions: questions.length,
          correctAnswers: finalCorrect,
          scorePercent,
          responses: [...answersLog, {
            question: questions[currentQuestionIdx].question,
            selectedOption,
            correctOption: questions[currentQuestionIdx].correctAnswer,
            correct: isCurrentCorrect
          }]
        });

        setLastScore(scorePercent);

        if (scorePercent >= 100) {
          setAlreadyPassed(true);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          onQuizPassed();
        }

        setQuizStarted(false);
      } catch (err) {
        console.error('Error saving final quiz score:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div id="quiz-loading" className="p-6 bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800 rounded-2xl flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs text-neutral-400">A carregar questionário da aula...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div id="quiz-error" className="p-6 bg-red-50 dark:bg-danger-700/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex flex-col items-center justify-center py-8 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-danger-700 dark:text-danger-700" />
        <div className="space-y-1">
          <h4 className="text-sm font-serif font-bold text-red-900 dark:text-red-300">Falha ao carregar o questionário</h4>
          <p className="text-xs text-red-700/80 dark:text-danger-700/80 max-w-sm">
            Não foi possível obter o quiz desta aula. Por favor, tente novamente.
          </p>
        </div>
        <button
          onClick={loadQuizAndSubmission}
          className="px-4 py-1.5 bg-danger-700 hover:bg-red-700 text-cream-100 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div id="quiz-empty" className="p-5 rounded-2xl border border-dashed border-gray-200 dark:border-ink-800 bg-cream-200/50 dark:bg-ink-900/40 text-center py-6">
        <span className="text-xs text-neutral-400 dark:text-neutral-400 font-sans">
          Esta aula não possui quiz de avaliação contínua.
        </span>
      </div>
    );
  }

  // Ecrã inicial antes de começar o quiz
  if (!quizStarted) {
    return (
      <div id="quiz-welcome" className="p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 space-y-4 text-left shadow-xs relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
            <div className="animate-ping bg-indigo-500/10 w-40 h-40 rounded-full" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-gray-100 dark:border-ink-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold-600" />
            <span className="text-[10px] font-mono text-gold-600 font-black uppercase tracking-wider">
              Avaliação Contínua • Quiz de Compreensão
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            {questions.length} {questions.length === 1 ? 'Questão' : 'Questões'}
          </span>
        </div>

        {alreadyPassed ? (
          <div className="space-y-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <div>
                <p className="font-semibold m-0">✓ Parabéns! Concluiu este quiz com distinção (100%).</p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 m-0">
                  O seu progresso foi sincronizado e esta lição está oficialmente concluída.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Pode rever as questões iniciando uma nova sessão de estudo a qualquer momento, sem afetar o seu progresso aprovado.
            </p>
            <button
              onClick={handleStartQuiz}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 font-mono text-3xs font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Praticar Novamente
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-serif font-bold text-slate-800 dark:text-cream-100">
                Preparado para testar os seus conhecimentos?
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Para marcar esta aula como concluída, precisa de obter 100% de aproveitamento neste quiz.
              </p>
            </div>

            {lastScore !== null && (
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-250 dark:border-amber-900/30 p-3 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-400 text-xs">
                <Award className="w-4.5 h-4.5 shrink-0 text-gold-600" />
                <div>
                  <p className="font-semibold m-0">Último aproveitamento: {lastScore}%</p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-500/80 m-0">
                    Precisa de acertar todas as {questions.length} questões na mesma tentativa para obter os 100% requeridos.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleStartQuiz}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 font-mono text-3xs font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Questionário
            </button>
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIdx];

  return (
    <div id="quiz-container" className="p-4 sm:p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs">
      
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-ink-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gold-600" />
          <span className="text-[10px] font-mono text-gold-600 font-black uppercase tracking-wider">
            Quiz de Compreensão • Questão {currentQuestionIdx + 1} de {questions.length}
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          Acertos: {correctCount}/{questions.length}
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="text-base sm:text-sm font-serif font-bold text-slate-800 dark:text-cream-100 leading-snug">
          {currentQuestion.question}
        </h4>

        <div className="space-y-2">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyle = 'border-gray-100 dark:border-ink-800 hover:border-gray-300 dark:hover:border-slate-700 bg-cream-200/50 dark:bg-slate-800/40';
            
            if (isSelected) {
              optionStyle = 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400';
            }
            if (hasSubmittedCurrent) {
              if (idx === currentQuestion.correctAnswer) {
                optionStyle = 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400';
              } else if (isSelected) {
                optionStyle = 'border-rose-600 bg-rose-50/20 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400';
              }
            }

            return (
              <button
                key={idx}
                disabled={hasSubmittedCurrent}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-3.5 sm:p-3 rounded-xl border text-sm sm:text-xs leading-relaxed transition-all cursor-pointer min-h-[44px] ${optionStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div>
          {hasSubmittedCurrent && (
            <span className={`text-xs font-semibold flex items-center gap-1 ${isCurrentCorrect ? 'text-emerald-600 animate-pulse' : 'text-rose-600'}`}>
              {isCurrentCorrect ? (
                <><CheckCircle2 className="w-4 h-4" /> Correto!</>
              ) : (
                <><AlertTriangle className="w-4 h-4" /> Incorreto.</>
              )}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {!hasSubmittedCurrent ? (
            <button
              onClick={handleSubmitQuestion}
              disabled={selectedOption === null}
              className="px-5 py-2.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 disabled:opacity-50 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              Confirmar Resposta
            </button>
          ) : (
            <button
              onClick={handleNextOrFinish}
              disabled={saving}
              className="px-5 py-2.5 sm:px-4 sm:py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 hover:text-slate-950 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {saving ? 'A calcular...' : currentQuestionIdx < questions.length - 1 ? (
                <>Seguinte <ArrowRight className="w-3 h-3" /></>
              ) : (
                'Finalizar Quiz'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
