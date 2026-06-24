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
import { COURSES_LIST } from './data';
import { X, GraduationCap, CheckCircle2, Phone, Award, Scale } from 'lucide-react';
import { useAuth } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);
  
  // Sign up modal states
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpCourse, setSignUpCourse] = useState(COURSES_LIST[0].id);
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

  // Initialize the local database once on mounting
  useEffect(() => {
    const isInitialized = localStorage.getItem('multiplus_academic_db_initialized');
    if (!isInitialized) {
      const initialDb = {
        users: [
          {
            id: 'per_student',
            email: 'antonio@advogados.ao',
            firstName: 'António',
            lastName: 'Ferreira Carvalho',
            role: 'STUDENT',
            status: 'ACTIVE',
            streak: 5,
            longestStreak: 12,
            totalHoursLearned: 24,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
            phone: '+244 923 456 789'
          },
          {
            id: 'per_instructor',
            email: 'esmeralda@gmail.com',
            firstName: 'Esmeralda',
            lastName: 'Sumbelelo',
            role: 'INSTRUCTOR',
            status: 'ACTIVE',
            streak: 0,
            longestStreak: 0,
            totalHoursLearned: 0,
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
          },
          {
            id: 'per_admin',
            email: 'isabel@empresas.ao',
            firstName: 'Isabel',
            lastName: 'Nascimento (Empresas)',
            role: 'ADMIN',
            status: 'ACTIVE',
            streak: 0,
            longestStreak: 0,
            totalHoursLearned: 0,
            avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150',
          }
        ],
        enrollments: [
          {
            userId: 'per_student',
            courseId: 'eng-legal-angola',
            progressPercent: 66,
            status: 'ACTIVE',
            enrolledAt: '2026-06-01'
          }
        ],
        certificates: [
          {
            certificateNumber: 'MPA-2026-001',
            courseName: 'English for the Legal Field in Angola',
            recipientName: 'Dr. António Ferreira Carvalho',
            completionDate: '2026-06-01',
            instructorName: 'Esmeralda Bruno Sumbelelo',
            finalGrade: '92/100',
            validUntil: 'Sem limite',
            isValid: true,
            institution: 'MultiPlus Academy (Huambo, Angola)',
            verificationCode: 'MPA-2026-001',
          }
        ]
      };
      
      localStorage.setItem('multiplus_academic_db', JSON.stringify(initialDb));
      localStorage.setItem('multiplus_academic_db_initialized', 'true');
    }

    // Auto load session if exists
    if (!user) {
      const localUser = localStorage.getItem('multiplus_current_session');
      if (localUser) {
        try {
          setCurrentUser(JSON.parse(localUser));
        } catch (e) {}
      }
    }
  }, [user]);

  // Save changes to session storage for safety
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('multiplus_current_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('multiplus_current_session');
    }
  }, [currentUser]);

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
      
      // Store dynamic signup interest in local storage DB
      const localGrads = localStorage.getItem('multiplus_academic_db');
      if (localGrads) {
        try {
          const db = JSON.parse(localGrads);
          if (!db.leads) db.leads = [];
          db.leads.push({
            name: signUpName,
            email: signUpEmail,
            phone: signUpPhone,
            courseId: signUpCourse,
            modality: signUpModality,
            date: new Date().toISOString().replace('T', ' ').slice(0, 16)
          });
          localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
        } catch (err) {}
      }
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
          <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
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
          <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
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
      default:
        return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    }
  };

  return (
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
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png"
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
      {!['student-dashboard', 'instructor-dashboard', 'admin-dashboard'].includes(currentPage) && (
        <Navbar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onOpenSignUp={() => {
            setSignUpCourse(COURSES_LIST[0].id);
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
      {!['student-dashboard', 'instructor-dashboard', 'admin-dashboard'].includes(currentPage) && (
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
              className="absolute inset-0 bg-[#0A2E5D]/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#C89B3C]/30 text-left"
            >
              
              <div className="bg-[#0A2E5D] text-white p-6 sm:p-8 relative">
                <button
                  onClick={closeSignUpModal}
                   className="absolute right-6 top-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-all"
                  aria-label="Voltar"
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-lg text-[#C89B3C] border border-white/10">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block">Admissão Académica</span>
                    <h3 className="text-lg sm:text-xl font-serif font-black text-white m-0">Formulário de Candidatura</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                
                <AnimatePresence mode="wait">
                  {signUpSuccess ? (
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 space-y-4"
                    >
                      <div className="w-16 h-16 bg-[#C89B3C]/10 text-[#C89B3C] border border-[#C89B3C] rounded-full flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 size={32} />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-xl font-serif font-bold text-[#0A2E5D]">Candidatura Pré-Registada!</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                          Estimado(a) formando(a), registámos com sucesso o seu pedido interesse letivo para o curso <strong>{COURSES_LIST.find(c => c.id === signUpCourse)?.title}</strong>.
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 inline-block text-left text-xs text-gray-600 space-y-2 max-w-sm">
                        <p className="font-semibold text-[#0A2E5D] flex items-center gap-1.5 border-b border-gray-250 pb-1.5">
                          <Award size={14} className="text-[#C89B3C]" />
                          Próximos Passos Pedagógicos:
                        </p>
                        <p>1. A nossa secretaria letiva entrará em contacto para agendamento de entrevista de nivelamento linguístico oral.</p>
                        <p>2. Envio da guia de confirmação de vaga e ementa do workshop programático.</p>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={closeSignUpModal}
                          className="w-full sm:w-auto px-8 py-3 bg-[#0A2E5D] text-white hover:bg-[#123C73] text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all"
                        >
                          Concluir e Fechar
                        </button>
                      </div>
                    </motion.div>

                  ) : (
                    
                    <form onSubmit={handleSignUpSubmit} className="space-y-4 text-left">
                      
                      <div>
                        <label htmlFor="modal-name-input" className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          id="modal-name-input"
                          type="text"
                          required
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="Ex: Dra. Teresa Domingos"
                          className="w-full neo-input rounded-xl py-2.5 px-4 text-sm"
                          disabled={loading}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div>
                          <label htmlFor="modal-email-input" className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                            Correio Eletrónico Coletivo *
                          </label>
                          <input
                            id="modal-email-input"
                            type="email"
                            required
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="exemplo@advogados.ao"
                            className="w-full neo-input rounded-xl py-2.5 px-4 text-sm"
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label htmlFor="modal-phone-input" className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                            Contacto Telefónico *
                          </label>
                          <input
                            id="modal-phone-input"
                            type="tel"
                            required
                            value={signUpPhone}
                            onChange={(e) => setSignUpPhone(e.target.value)}
                            placeholder="+244 9xx xxx xxx"
                            className="w-full neo-input rounded-xl py-2.5 px-4 text-sm"
                            disabled={loading}
                          />
                        </div>

                      </div>

                      <div>
                        <label htmlFor="modal-course-select" className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">
                          Formação Pretendida *
                        </label>
                        <select
                          id="modal-course-select"
                          value={signUpCourse}
                          onChange={(e) => setSignUpCourse(e.target.value)}
                          className="w-full neo-input rounded-xl py-2.5 px-4 text-sm bg-white text-[#1C1C1C]"
                          disabled={loading}
                        >
                          {COURSES_LIST.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title} ({course.duration})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-2">
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
                                  ? 'bg-[#0A2E5D]/5 text-[#0A2E5D] border-[#C89B3C]/50'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                              disabled={loading}
                            >
                              {mod}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-400 leading-normal pt-2">
                        * Ao submeter, declara autorização para contacto telefónico da nossa diretoria técnica da MultiPlus Academy Huambo para confirmação dos critérios linguísticos.
                      </p>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 bg-[#C89B3C] text-white rounded-xl uppercase tracking-wider text-xs font-bold neo-button-gold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      </div>

                    </form>
                  )}
                </AnimatePresence>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
