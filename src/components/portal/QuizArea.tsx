import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/supabase/academicService';
import { CheckCircle2, AlertTriangle, RefreshCw, Trophy, ArrowRight, Loader2 } from 'lucide-react';

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
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadQuizAndSubmission = async () => {
    if (!lessonId || !userId) return;
    setLoading(true);
    setHasError(false);
    setHasSubmitted(false);
    setSelectedOption(null);
    setAlreadyPassed(false);
    setCurrentQuestionIdx(0);
    
    try {
      // 1. Check existing submissions to see if already completed
      const submissions = await academicService.getQuizSubmissions(userId);
      const pastSubmission = submissions.find(s => s.lesson_id === lessonId);
      if (pastSubmission && pastSubmission.score >= 100) {
        setAlreadyPassed(true);
      }

      // 2. Fetch quiz questions for this lesson from Supabase
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

  const handleSubmit = async () => {
    if (selectedOption === null || !userId || !lessonId || questions.length === 0) return;

    setSaving(true);
    const currentQ = questions[currentQuestionIdx];
    const correct = selectedOption === currentQ.correctAnswer;
    setIsCorrect(correct);
    setHasSubmitted(true);

    try {
      if (correct) {
        // Submit 100 score to database
        await academicService.submitQuizResponse(userId, lessonId, 100, {
          question: currentQ.question,
          selectedOption,
          correctOption: currentQ.correctAnswer
        });

        // Trigger CSS Confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        setAlreadyPassed(true);
        // Notify parent to unlock course checklist / progress percent
        onQuizPassed();
      } else {
        // Submit 0 score
        await academicService.submitQuizResponse(userId, lessonId, 0, {
          question: currentQ.question,
          selectedOption,
          correctOption: currentQ.correctAnswer
        });
      }
    } catch (err) {
      console.error('Error saving quiz submission:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
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

  const currentQuestion = questions[currentQuestionIdx];

  return (
    <div id="quiz-container" className="p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs">
      
      {/* Visual Confetti Explosion (pure CSS) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="animate-ping bg-indigo-500/10 w-40 h-40 rounded-full" />
          <div className="absolute top-10 left-10 bg-rose-400 w-2 h-2 rounded-full animate-bounce" />
          <div className="absolute top-20 right-20 bg-amber-400 w-3 h-3 rounded-full animate-bounce" />
          <div className="absolute bottom-10 left-1/3 bg-emerald-400 w-2 h-2 rounded-full animate-pulse" />
          <div className="absolute top-5 right-1/3 bg-sky-400 w-3 h-3 rounded-full animate-pulse" />
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
          Questão {currentQuestionIdx + 1} de {questions.length}
        </span>
      </div>

      {alreadyPassed && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold m-0">✓ Parabéns! Já concluiu este quiz com distinção.</p>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 m-0">
              O seu progresso foi sincronizado com o Supabase e esta lição está oficialmente dada como concluída.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-serif font-bold text-slate-800 dark:text-cream-100 leading-snug">
          {currentQuestion.question}
        </h4>

        <div className="space-y-2">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyle = 'border-gray-100 dark:border-ink-800 hover:border-gray-300 dark:hover:border-slate-700 bg-cream-200/50 dark:bg-slate-800/40';
            
            if (isSelected) {
              optionStyle = 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400';
            }
            if (hasSubmitted) {
              if (idx === currentQuestion.correctAnswer) {
                optionStyle = 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400';
              } else if (isSelected) {
                optionStyle = 'border-rose-600 bg-rose-50/20 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400';
              }
            }

            return (
              <button
                key={idx}
                disabled={hasSubmitted || alreadyPassed}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${optionStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        {hasSubmitted ? (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Resposta Correta!
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Resposta Incorreta. Tente novamente.
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          {hasSubmitted && !isCorrect && (
            <button
              onClick={() => {
                setHasSubmitted(false);
                setSelectedOption(null);
              }}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-ink-800 hover:bg-cream-200 dark:hover:bg-slate-800 text-neutral-400 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Novamente
            </button>
          )}

          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || saving || alreadyPassed}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 hover:text-slate-100 disabled:opacity-50 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              {saving ? 'A guardar...' : 'Submeter Resposta'}
            </button>
          ) : currentQuestionIdx < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 hover:text-slate-900 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              Seguinte <ArrowRight className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
