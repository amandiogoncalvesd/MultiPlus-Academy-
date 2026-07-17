import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePanel from './components/HomePanel';
import AboutPanel from './components/AboutPanel';
import CoursesPanel from './components/CoursesPanel';
import InstructorsPanel from './components/InstructorsPanel';
import BlogPanel from './components/BlogPanel';
import ContactPanel from './components/ContactPanel';
import LoginPanel from './components/LoginPanel';
import StudentPortal from './components/StudentPortal';
import InstructorPortal from './components/InstructorPortal';
import AdminPortal from './components/AdminPortal';
import VerifyCertificatePanel from './components/VerifyCertificatePanel';
import MessagesPage from './components/MessagesPage';
import { X, GraduationCap, CheckCircle2, Phone, Award, Scale } from 'lucide-react';
import { useAuth } from './components/auth/AuthProvider';
import { supabase } from './lib/supabase/client';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [previousDashboardPage, setPreviousDashboardPage] = useState<PageId>('admin-dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);
  
  // Sign up modal states
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpCourse, setSignUpCourse] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpModality, setSignUpModality] = useState('Híbrido');
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Splash Screen timeout trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Track previous dashboard page for the messages page return button
  useEffect(() => {
    if (['admin-dashboard', 'instructor-dashboard', 'student-dashboard'].includes(currentPage)) {
      setPreviousDashboardPage(currentPage);
    }
  }, [currentPage]);

  // Load real courses dynamically on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'PUBLISHED');
        if (!error && data) {
          setCourses(data);
          if (data.length > 0) {
            setSignUpCourse(data[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading dynamic courses in App.tsx:', err);
      }
    };
    loadCourses();
  }, []);

  // Scroll to top when page changes list
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentPage]);

  const handleSignUpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSignUpSuccess(true);
    }, 1000);
  };

  const closeSignUpModal = () => {
    setIsSignUpOpen(false);
    // Reset form states
    setTimeout(() => {
      setSignUpSuccess(false);
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPhone('');
    }, 300);
  };

  // Render Page selector
  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
      case 'about':
        return <AboutPanel setCurrentPage={setCurrentPage} />;
      case 'courses':
        return <CoursesPanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
      case 'instructors':
        return <InstructorsPanel setCurrentPage={setCurrentPage} />;
      case 'blog':
        return <BlogPanel setCurrentPage={setCurrentPage} />;
      case 'contact':
        return <ContactPanel setCurrentPage={setCurrentPage} />;
      case 'login':
        return <LoginPanel setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />;
      case 'student-dashboard':
        return (
          <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
            <StudentPortal 
              setCurrentPage={setCurrentPage} 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
              setVerificationCode={setVerificationCode}
            />
          </ProtectedRoute>
        );
      case 'instructor-dashboard':
        return (
          <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
            <InstructorPortal setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />
          </ProtectedRoute>
        );
      case 'admin-dashboard':
        return (
          <ProtectedRoute allowedRoles={['ADMIN']} setCurrentPage={setCurrentPage}>
            <AdminPortal setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />
          </ProtectedRoute>
        );
      case 'verify-certificate':
        return (
          <VerifyCertificatePanel 
            setCurrentPage={setCurrentPage} 
            verificationCode={verificationCode} 
            setVerificationCode={setVerificationCode}
          />
        );
      case 'messages':
        return (
          <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
            <MessagesPage setCurrentPage={setCurrentPage} previousDashboardPage={previousDashboardPage} />
          </ProtectedRoute>
        );
      default:
        return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    }
  };

  return (
    <ToastProvider>
      <div id="multiplus-portal-root" className="min-h-screen bg-[#F8F8F6] text-[#1C1C1C] flex flex-col font-sans select-none antialiased">
      
      {/* Premium Luxury Splash Screen on First Visit */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] bg-[#0A2E5D] flex flex-col items-center justify-center text-white"
          >
            {/* Soft luxury ambient highlights */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#C89B3C]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-950/20 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md px-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Visual shimmer background */}
                <div className="absolute inset-0 bg-[#C89B3C]/10 rounded-full blur-xl animate-pulse" />
                <img
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                  alt="MultiPlus Academy"
                  className="h-28 w-auto object-contain relative z-10"
                />
              </motion.div>

              <div className="space-y-2">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-lg font-serif font-black tracking-wider text-[#C89B3C] uppercase"
                >
                  MultiPlus Academy
                </motion.h2>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '40px' }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="h-0.5 bg-[#C89B3C] mx-auto rounded"
                />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-[10px] font-mono tracking-widest uppercase text-white/40"
                >
                  Excelência Académica • Angola 2026
                </motion.p>
              </div>

              {/* Shimmer loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative"
              >
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 bg-[#C89B3C] w-1/2 rounded-full"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Navigation with auth */}
      {!['student-dashboard', 'instructor-dashboard', 'admin-dashboard', 'messages'].includes(currentPage) && (
        <Navbar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onOpenSignUp={() => {
            setSignUpCourse(courses[0]?.id || '');
            setIsSignUpOpen(true);
          }} 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}

      {/* 2. Main Visual Body */}
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-grow flex flex-col"
          >
            {renderActivePage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Global Footer */}
      {!['student-dashboard', 'instructor-dashboard', 'admin-dashboard', 'messages'].includes(currentPage) && (
        <Footer setCurrentPage={setCurrentPage} />
      )}

      {/* 4. WORKSHOP / REGISTRATION DYNAMIC MODAL */}
      <AnimatePresence>
        {isSignUpOpen && (
          <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSignUpModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
            />

            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.5 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#C89B3C]/40 text-left shadow-[#C89B3C]/10"
            >
              {/* Premium golden visual bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C89B3C] via-[#E2B755] to-[#C89B3C]" />

              <div className="bg-gradient-to-b from-[#0A2E5D] to-[#08254c] text-white p-6 sm:p-8 relative pt-8">
                <button
                  onClick={closeSignUpModal}
                  className="absolute right-6 top-8 p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-all focus:outline-none focus:ring-2 focus:ring-[#C89B3C]"
                  aria-label="Voltar"
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl text-[#C89B3C] border border-white/10 shadow-inner">
                    <GraduationCap size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block font-semibold">Admissão Académica</span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-white m-0">Formulário de Candidatura</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 bg-radial from-white to-slate-50/50">
                
                <AnimatePresence mode="wait">
                  {signUpSuccess ? (
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 space-y-5"
                    >
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                        <CheckCircle2 size={32} />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-xl font-serif font-bold text-[#0A2E5D]">Candidatura Pré-Registada!</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                          Estimado(a) formando(a), registámos com sucesso o seu pedido interesse letivo para o curso <strong>{courses.find(c => c.id === signUpCourse)?.titulo || 'Curso Selecionado'}</strong>.
                        </p>
                      </div>

                      <div className="p-5 bg-[#0A2E5D]/5 rounded-2xl border border-[#0A2E5D]/10 inline-block text-left text-xs text-slate-600 space-y-2.5 max-w-sm shadow-xs">
                        <p className="font-semibold text-[#0A2E5D] flex items-center gap-1.5 border-b border-[#0A2E5D]/10 pb-2">
                          <Award size={15} className="text-[#C89B3C]" />
                          Próximos Passos Pedagógicos:
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="font-bold text-[#0A2E5D] shrink-0">1.</span>
                          <span>A nossa secretaria letiva entrará em contacto para agendamento de entrevista de nivelamento linguístico oral.</span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="font-bold text-[#0A2E5D] shrink-0">2.</span>
                          <span>Envio da guia de confirmação de vaga e ementa do workshop programático.</span>
                        </p>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={closeSignUpModal}
                          className="w-full sm:w-auto px-10 py-3 bg-[#0A2E5D] text-white hover:bg-[#123C73] text-xs font-mono uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Concluir e Fechar
                        </button>
                      </div>
                    </motion.div>

                  ) : (
                    
                    <motion.form 
                      onSubmit={handleSignUpSubmit} 
                      className="space-y-4 text-left"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.06
                          }
                        }
                      }}
                    >
                      
                      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <label htmlFor="modal-name-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          id="modal-name-input"
                          type="text"
                          required
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Ex: Dra. Teresa Domingos"
                          className="w-full neo-input rounded-xl py-2.5 px-4 text-sm font-medium transition-all"
                          disabled={loading}
                        />
                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div>
                          <label htmlFor="modal-email-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Correio Eletrónico Coletivo *
                          </label>
                          <input
                            id="modal-email-input"
                            type="email"
                            required
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="exemplo@advogados.ao"
                            className="w-full neo-input rounded-xl py-2.5 px-4 text-sm font-medium transition-all"
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label htmlFor="modal-phone-input" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                            Contacto Telefónico *
                          </label>
                          <input
                            id="modal-phone-input"
                            type="tel"
                            required
                            value={signUpPhone}
                            onChange={(e) => setSignUpPhone(e.target.value)}
                            placeholder="+244 9xx xxx xxx"
                            className="w-full neo-input rounded-xl py-2.5 px-4 text-sm font-medium transition-all"
                            disabled={loading}
                          />
                        </div>

                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <label htmlFor="modal-course-select" className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                          Formação Pretendida *
                        </label>
                        <select
                          id="modal-course-select"
                          value={signUpCourse}
                          onChange={(e) => setSignUpCourse(e.target.value)}
                          className="w-full neo-input rounded-xl py-2.5 px-4 text-sm bg-white text-slate-800 font-medium transition-all"
                          disabled={loading}
                        >
                          {courses.length > 0 ? (
                            courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.titulo || course.title} ({course.duracao || course.duration})
                              </option>
                            ))
                          ) : (
                            <option value="">Nenhum curso disponível para candidatura</option>
                          )}
                        </select>
                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                        <span className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-2">
                          Modalidade de Estudo Selecionada
                        </span>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {['Híbrido (Huambo/Live)', 'Online Completo'].map((mod, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSignUpModality(mod)}
                              className={`py-3 text-center rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                                signUpModality === mod
                                  ? 'bg-[#0A2E5D]/5 text-[#0A2E5D] border-[#C89B3C]/60 shadow-xs'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                              disabled={loading}
                            >
                              {mod}
                            </button>
                          ))}
                        </div>
                      </motion.div>

                      <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="text-[10px] text-slate-400 leading-normal pt-1">
                        * Ao submeter, declara autorização para contacto telefónico da nossa diretoria técnica da MultiPlus Academy Huambo para confirmação dos critérios linguísticos.
                      </motion.p>

                      <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 bg-[#C89B3C] text-white rounded-xl uppercase tracking-widest text-xs font-bold neo-button-gold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#C89B3C]/10 hover:scale-[1.01] active:scale-[0.99]"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              A Efetuar Reserva Curricular...
                            </>
                          ) : (
                            <>
                              <GraduationCap size={15} />
                              Finalizar Solicitação de Vaga
                            </>
                          )}
                        </button>
                      </motion.div>

                    </motion.form>
                  )}
                </AnimatePresence>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </ToastProvider>
  );
}
