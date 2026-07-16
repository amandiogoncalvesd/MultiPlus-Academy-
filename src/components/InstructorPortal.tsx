import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User, Course } from '../types';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';
import { useTheme } from '../contexts/ThemeContext';
import { messageService } from '../services/supabase/messageService';
import { MessageSquare, Bell, Sun, Moon } from 'lucide-react';

import { 
  Award, 
  Users, 
  BookOpen, 
  ClipboardList, 
  Plus, 
  CheckCircle, 
  Briefcase, 
  Activity, 
  ShieldAlert, 
  Send, 
  Lock, 
  Clock, 
  PlusCircle, 
  Search, 
  CheckCheck,
  Smartphone,
  Video,
  FileText,
  Calendar,
  BarChart2,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronRight,
  Trash2,
  Edit2,
  Eye,
  FileDown,
  Upload,
  Layers,
  Settings2,
  Sparkles,
  QrCode,
  ExternalLink,
  HelpCircle,
  Copy,
  FolderOpen,
  Filter,
  Menu,
  ChevronDown,
  X
} from 'lucide-react';

// Import modular panels
import InstructorDashboardTab from './instructor/InstructorDashboardTab';
import InstructorCoursesTab from './instructor/InstructorCoursesTab';
import InstructorStudentsTab from './instructor/InstructorStudentsTab';
import InstructorEvaluationsTab from './instructor/InstructorEvaluationsTab';
import InstructorCalendarTab from './instructor/InstructorCalendarTab';
import InstructorMessagesTab from './instructor/InstructorMessagesTab';
import { courseService } from '../services/supabase/courseService';
import CertificateIssueModal from './certificates/CertificateIssueModal';

interface InstructorPortalProps {
  setCurrentPage: (page: PageId) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export default function InstructorPortal({
  setCurrentPage,
  currentUser,
  setCurrentUser,
}: InstructorPortalProps) {
  const { signOut } = useAuth();
  
  // Navigation active tab index
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Global Sync variables reading from MultiPlus database with fallbacks
  const [courses, setCourses] = useState<Course[]>([]);

  const [students, setStudents] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificatesCount, setCertificatesCount] = useState<number>(0);
  const [lessonsCount, setLessonsCount] = useState<number>(0);

  // Preference settings & notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Quick access unread messages count
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchUnreadMessagesCount = async () => {
    if (!currentUser?.id) return;
    try {
      const parts = await messageService.getConversationPartners(currentUser.id);
      const totalUnread = parts.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (err) {
      console.warn('Error fetching unread message count:', err);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchUnreadMessagesCount();

    const channel = supabase
      .channel('instructor-unread-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadMessagesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Search input of global top tracker bar
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // 1. Accessibility State Settings
  const { isDarkMode, toggleTheme } = useTheme();
  const [highContrast, setHighContrast] = useState(false);

  // 2. Custom CV Bio Profile Form States
  const [profileBio, setProfileBio] = useState('Esmeralda Bruno Sumbelelo é advogada licenciada associada e diretora académica titular dos programas jurídicos internacionais da MultiPlus Academy.');
  const [profileCredentials, setProfileCredentials] = useState('Licenciada em Direito pela UAN, Oradora Huambo, Especialista em Compliance.');

  // 3. New Course creation Form States
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('450.000 Kz');
  const [newCourseCategory, setNewCourseCategory] = useState('Direito Corporativo');
  const [newCourseDuration, setNewCourseDuration] = useState('12 Semanas (3 Meses)');

  // 4. Curriculum planner tree modular states
  const [selectedPlannerCourse, setSelectedPlannerCourse] = useState('');
  const [plannerModules, setPlannerModules] = useState<any[]>([]);
  const [newPlannerModuleTitle, setNewPlannerModuleTitle] = useState('');

  // 5. Library files repository states
  const [libraryCategory, setLibraryCategory] = useState<'all' | 'pdf' | 'docx' | 'audio'>('all');
  const [libraryFiles, setLibraryFiles] = useState<any[]>([]);
  const [newLibraryFileName, setNewLibraryFileName] = useState('');

  // 6. Certificados code verification states
  const [inputHashVerify, setInputHashVerify] = useState('');
  const [hashResultText, setHashResultText] = useState('');
  const [showCertificateIssueModal, setShowCertificateIssueModal] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState('');

  // Synchronize base academic states
  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = async () => {
    try {
      // 1. Load Courses
      const liveCourses = currentUser 
        ? (currentUser.role === 'ADMIN' 
            ? (await supabase.from('courses').select('*').then(({ data }) => data || []))
            : await courseService.getTeacherCourses(currentUser.id))
        : [];

      setCourses(liveCourses.map((c: any) => ({
        id: c.id,
        slug: c.slug || c.id,
        title: c.title,
        subtitle: c.description || '',
        summary: c.description || '',
        duration: c.duration || '12 Semanas',
        hours: '72 Horas Letivas',
        language: 'Inglês',
        modality: 'Híbrido',
        schedule: 'Terças e Quintas',
        startDate: 'Em breve',
        price: 'Grátis',
        targetAudience: [],
        modules: [],
        teacher_id: c.teacher_id,
        status: c.status,
        level: c.level || 'Intermédio',
        category: c.category || 'Geral'
      })));

      // 2. Load Students (ALUNO role)
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'ALUNO');
      
      if (usersData && usersData.length > 0) {
        const studentList = usersData.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.nome_completo?.split(' ')[0] || '',
          lastName: u.nome_completo?.split(' ').slice(1).join(' ') || '',
          role: 'ALUNO' as const,
          status: u.status || 'ACTIVE',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: u.foto_perfil || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
          phone: u.telefone || ''
        }));
        setStudents(studentList);
      } else {
        setStudents([]);
      }

      // 3. Load Enrollments
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('*');
      
      if (enrollData) {
        setEnrollments(enrollData.map((e: any) => ({
          userId: e.student_id,
          courseId: e.course_id,
          progressPercent: e.progress_percent || 0,
          status: e.status,
          enrolledAt: e.data_inicio?.slice(0, 10) || ''
        })));
      } else {
        setEnrollments([]);
      }

      // 4. Load certificates count
      const { count: certsCount, error: certsErr } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });
      if (!certsErr && certsCount !== null) {
        setCertificatesCount(certsCount);
      }

      // 5. Load lessons count
      const { count: totalLessons, error: lessonsErr } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });
      if (!lessonsErr && totalLessons !== null) {
        setLessonsCount(totalLessons);
      } else {
        setLessonsCount(0);
      }
    } catch (err) {
      console.warn('Error fetching instructor data from Supabase:', err);
    }
  };

  // Callback to adjust accounts
  const toggleStudentStatus = async (userId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', userId);

      if (error) throw error;
      await loadDatabase();
      alert(`Estado da matrícula reajustado no Supabase para ${nextStatus}.`);
    } catch (e: any) {
      console.error('Erro ao reajustar matrícula:', e);
      alert(`Erro ao reajustar matrícula: ${e.message || e}`);
    }
  };

  // Dynamic certificate issuer
  const emitCertificateForStudent = async (userId: string) => {
    setPreselectedStudentId(userId);
    setShowCertificateIssueModal(true);
  };

  // Add course from wizard creator
  const handleAddNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    try {
      const liveCourse = await academicService.createCourse({
        title: newCourseTitle,
        subtitle: newCourseSubtitle || 'Formação complementar acelerada.',
        duration: newCourseDuration,
        category: newCourseCategory,
        status: 'DRAFT',
        teacher_id: currentUser?.id
      });

      const dynamicCourse: Course = {
        id: liveCourse.id,
        slug: liveCourse.slug,
        title: liveCourse.title || liveCourse.titulo,
        subtitle: liveCourse.description || liveCourse.descricao || '',
        summary: liveCourse.description || liveCourse.descricao || '',
        duration: liveCourse.duration || liveCourse.duracao || '12 Semanas',
        hours: '24 Horas Letivas',
        language: 'Inglês',
        modality: 'Online',
        schedule: 'A definir',
        startDate: 'Agendado',
        price: newCoursePrice,
        targetAudience: ['Juristas Corporativos', 'Formandos Gerais'],
        modules: [],
        status: 'DRAFT',
        teacher_id: currentUser?.id
      };

      setCourses(prev => [...prev, dynamicCourse]);
      alert(`Sucesso! O curso "${newCourseTitle}" está indexado sob estado "Rascunho" no Supabase.`);
      
      setNewCourseTitle('');
      setNewCourseSubtitle('');
      loadDatabase();
      setActiveTab('cursos');
    } catch (err: any) {
      console.error('Erro ao registrar curso no Supabase:', err);
      alert(`Falha ao registrar curso: ${err.message || err}`);
    }
  };

  // Add module to planner
  const handleAddPlannerModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlannerModuleTitle.trim()) return;

    setPlannerModules([
      ...plannerModules,
      {
        number: `Mês ${plannerModules.length + 1}`,
        title: newPlannerModuleTitle,
        lessonsCount: 0
      }
    ]);
    setNewPlannerModuleTitle('');
    alert('Nova categoria de ementa anexada no mapa lógico.');
  };

  // File Repository uploads simulator
  const handleUploadLibraryFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibraryFileName.trim()) return;
    const isPDF = newLibraryFileName.toLowerCase().endsWith('.pdf');
    const isDocx = newLibraryFileName.toLowerCase().endsWith('.docx');

    setLibraryFiles([
      {
        id: Date.now(),
        name: newLibraryFileName,
        type: isPDF ? 'pdf' : isDocx ? 'docx' : 'audio',
        size: '1.2 MB',
        date: new Date().toISOString().slice(0, 10)
      },
      ...libraryFiles
    ]);
    setNewLibraryFileName('');
    alert('Documento adicionado à biblioteca comum dos formandos!');
  };

  // Certificados validation hash test
  const testValidateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHashVerify.trim()) return;

    setHashResultText('Processando verificação eletrônica com carimbo digital...');
    try {
      const match = await academicService.verifyCertificate(inputHashVerify);
      if (match) {
        const studentName = match.student?.nome_completo || 'Aluno MultiPlus';
        const courseTitle = match.course?.titulo || 'Curso Jurídico';
        const dateStr = match.emitido_em ? new Date(match.emitido_em).toLocaleDateString() : '---';
        setHashResultText(`DIPLOMA RECONHECIDO NO SUPABASE! Outorgado para ${studentName} em ${dateStr}. Curso: ${courseTitle}.`);
      } else {
        // Fallback for mock preview
        if (inputHashVerify.trim().toUpperCase() === 'MPA-2026-UNLOCKED-PER_') {
          setHashResultText('DIPLOMA RECONHECIDO (SIMULADO)! Outorgado para Dr. António Ferreira Carvalho por Esmeralda Sumbelelo.');
        } else {
          setHashResultText('CÓDIGO INEXISTENTE. Nenhuma apólice registada sob este carimbo fiscal no LMS do Supabase.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setHashResultText('Erro de conexão ao validar diploma com o servidor Supabase.');
    }
  };

  // Derived variables
  const pendingGreads = 3;

  // Accessibility theme class selections
  const containerThemeClass = highContrast 
    ? 'bg-black text-yellow-300 font-extrabold border-yellow-500' 
    : isDarkMode 
      ? 'bg-ink-900 text-cream-100 border-ink-800' 
      : 'bg-slate-50 text-slate-800 border-slate-200/60';

  const cardThemeClass = highContrast
    ? 'border-4 border-yellow-500 bg-black text-cream-100'
    : isDarkMode
      ? 'bg-ink-800 border border-ink-800/40 shadow-xs text-cream-100'
      : 'bg-white border border-slate-200/80 shadow-xs text-slate-800';

  return (
    <div id="multiplus-instructor-portal" className={`min-h-screen flex items-stretch transition-colors duration-200 ${containerThemeClass}`}>
      
      {/* Backdrop overlay for mobile devices */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR (Collapsible on Mobile, Fixed on Desktop) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          highContrast ? 'bg-black border-r-4 border-yellow-500' : isDarkMode ? 'bg-ink-900 border-ink-800' : 'bg-ink-900 text-white border-r border-ink-800/10'
        } transition-transform duration-300 transform lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full">
          {/* Superior Header Logo Brand */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Logo"
                className="h-9 w-auto object-contain shrink-0"
              />
              <div className="text-left">
                <h1 className="text-sm font-serif font-black m-0 tracking-wide text-cream-100">MultiPlus</h1>
                <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-bold">Teacher Portal</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-cream-100/70 hover:text-cream-100 rounded bg-transparent border-0 cursor-pointer"
              aria-label="Fechar lateral"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto max-h-[64vh]">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: <Activity size={15} /> },
              { id: 'cursos', name: 'Meus Cursos', icon: <BookOpen size={15} /> },
              { id: 'criar-curso', name: 'Criar Curso', icon: <Plus size={15} /> },
              { id: 'alunos', name: 'Diretório Alunos', icon: <Users size={15} /> },
              { id: 'avaliacoes', name: 'Correção & Provas', icon: <ClipboardList size={15} /> },
              { id: 'certificados', name: 'Emissão Diplomas', icon: <Award size={15} /> },
              { id: 'calendario', name: 'Agenda Letiva', icon: <Calendar size={15} /> },
              { id: 'mensagens', name: 'Chat & Mural', icon: <MessageSquare size={15} /> },
              { id: 'relatorios', name: 'Métricas & SVGs', icon: <BarChart2 size={15} /> },
              { id: 'perfil', name: 'Curriculum Vitae', icon: <UserIcon size={15} /> },
              { id: 'configuracoes', name: 'Configurações', icon: <Settings size={15} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'mensagens') {
                    setCurrentPage('messages');
                  } else {
                    setActiveTab(item.id);
                  }
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-left transition-all cursor-pointer border-0 ${
                  activeTab === item.id
                    ? 'bg-gold-600 text-ink-900 shadow-sm font-bold'
                    : 'text-cream-100/80 hover:text-cream-100 hover:bg-cream-100/10'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gold-600 text-ink-900 rounded-full flex items-center justify-center font-bold text-xs shadow-sm capitalize">
                {currentUser?.firstName?.[0] || 'E'}
              </div>
              <div className="text-left truncate max-w-[130px]">
                <h4 className="text-xs font-bold text-cream-100 m-0 tracking-wide truncate">
                  {currentUser?.firstName || 'Esmeralda'} {currentUser?.lastName || 'Sumbelelo'}
                </h4>
                <span className="text-[10px] font-mono text-gold-600 font-semibold uppercase">Professor</span>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await signOut();
                } catch (e) {}
                setCurrentUser(null);
                setCurrentPage('login');
              }}
              className="w-full py-2 bg-danger-700 hover:bg-red-700 text-cream-100 text-[10px] font-mono font-bold uppercase rounded-lg border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={11} />
              <span>Sair do Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main outer shell (adjusted for fixed sidebar space) */}
      <div className="flex-grow flex flex-col overflow-hidden lg:pl-64 relative">
        {/* Subtle premium background glow effects matching the Home page layout */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-[#C89B3C]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-slate-200/10 dark:bg-slate-800/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* 2. TOPBAR HEADER FIXA */}
        <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors ${
          highContrast ? 'bg-black border-yellow-500 text-yellow-300' : isDarkMode ? 'bg-ink-900 border-ink-800 text-cream-100' : 'bg-white border-slate-200/60 text-slate-800'
        }`}>
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all bg-transparent border-0 cursor-pointer text-current"
              aria-label="Abrir lateral"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-left">
              <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block">MultiPlus LMS</span>
              <h2 className="text-sm font-serif font-black tracking-wide m-0 capitalize">{activeTab} • Portal do Professor</h2>
            </div>
          </div>

          {/* Center Search bar */}
          <div className="hidden md:flex relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar arquivos..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 placeholder:text-neutral-400 text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600 dark:bg-slate-800/50 dark:border-ink-800"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 text-xs">
            {/* Accessibility swift switch */}
            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-all text-gold-600 border-0 cursor-pointer"
              title="Mudar visual cor"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Quick Access Messages Page icon with unread badge */}
            <button
              onClick={() => setCurrentPage('messages')}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-all text-ink-900 dark:text-blue-400 border-0 cursor-pointer relative"
              title="Abrir Mensagens"
            >
              <MessageSquare size={14} className="text-gold-600" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Notification Bell toggle menu */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-all text-ink-900 dark:text-blue-400 border-0 cursor-pointer relative"
              >
                <Bell size={14} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger-700" />
              </button>

              <AnimatePresence>
                {showNotificationsMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`absolute right-0 mt-2 w-72 rounded-2xl p-4 shadow-xl text-left ${cardThemeClass} z-50`}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="font-mono text-2xs font-bold text-neutral-400">NOTIFICAÇÕES DA TURMA</span>
                    </div>
                    <div className="space-y-2 mt-2 divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <p className="text-2xs text-neutral-400 m-0 py-2">Sem novas notificações.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="pt-2 text-2xs text-neutral-400 dark:text-gray-300">
                            <p className="m-0 leading-snug">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tutor Assistant info help icon */}
            <button
              onClick={() => {
                alert('Tutor assistente MultiPlus: Por favor envie um e-mail para: suporte@multiplus.ao com a sua credencial Huambo.');
              }}
              className="p-2 bg-cream-200 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-neutral-400 border-0 cursor-pointer"
              title="Ajuda ao Docente"
            >
              <HelpCircle size={14} />
            </button>

            {/* Profile menu widget */}
            <div className="flex items-center gap-2.5 border-l pl-4">
              <img
                src={currentUser?.avatarUrl || "https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg"}
                alt="Formadora Avatar"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-mono font-bold text-blue-900 dark:text-blue-300 block leading-tight">PROFESSOR</span>
                <span className="text-3xs text-slate-500 font-semibold uppercase block truncate max-w-[100px]">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT AREA BLOCK */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >
          
          {/* RENDER MODULAR SUB-COMPONENTS & DIRECT CUSTOM SECTIONS */}
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <InstructorDashboardTab
              currentUser={currentUser}
              courses={courses}
              students={students}
              evaluationsPendingCount={pendingGreads}
              certificatesIssuedCount={certificatesCount}
              completionRate={95}
              onNavigate={(tab) => setActiveTab(tab)}
              lessonsCount={lessonsCount}
            />
          )}

          {/* TAB 2: MEUS CURSOS */}
          {activeTab === 'cursos' && (
            <InstructorCoursesTab
              courses={courses}
              onNavigateToCreate={() => setActiveTab('criar-curso')}
              onUpdateCourses={(updated) => setCourses(updated)}
              onRefresh={loadDatabase}
            />
          )}

          {/* TAB 3: CRIAR CURSO */}
          {activeTab === 'criar-curso' && (
            <div className={`p-6 rounded-3xl text-left space-y-6 ${cardThemeClass}`}>
              <div>
                <span className="text-[9px] font-mono text-gold-600 font-black tracking-widest block uppercase">Formulário Ministerial</span>
                <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg mt-1 m-0">Criar Novo Curso de Extensão Linguística</h3>
                <p className="text-xs text-neutral-400">Preencha o programa para disponibilizar matrículas diretas aos juristas de Luanda e Huambo.</p>
              </div>

              <form onSubmit={handleAddNewCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Título do Curso</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: English for Contract Negotiation in Oil & Gas"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl focus:outline-none focus:border-gold-600 text-slate-800 dark:text-cream-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Subtítulo Resumido</label>
                    <input
                      type="text"
                      placeholder="Ex: Técnicas de debate oral em disputas energéticas angolanas"
                      value={newCourseSubtitle}
                      onChange={(e) => setNewCourseSubtitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl focus:outline-none focus:border-gold-600 text-slate-800 dark:text-cream-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Mensalidade Mínima Sugerida</label>
                    <input
                      type="text"
                      value={newCoursePrice}
                      onChange={(e) => setNewCoursePrice(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl text-center font-bold text-slate-800 dark:text-cream-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Categoria Programática</label>
                    <select
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                    >
                      <option value="Direito Corporativo">Direito Corporativo & Negócios</option>
                      <option value="Setor Extrativo">Setor de Petróleo, Gás & Minas</option>
                      <option value="Oratória Escrita">Redação e Escrita Processual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Duração da ementa</label>
                    <input
                      type="text"
                      value={newCourseDuration}
                      onChange={(e) => setNewCourseDuration(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl text-center text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 hover:text-slate-900 dark:hover:bg-gold-500 text-xs font-mono font-extrabold uppercase rounded-xl border-0 cursor-pointer transition-all"
                >
                  Registrar Curso Ativo
                </button>
              </form>
            </div>
          )}



          {/* TAB 6: DIRETÓRIO ALUNOS */}
          {activeTab === 'alunos' && (
            <InstructorStudentsTab
              students={students}
              enrollments={enrollments}
              courses={courses}
              onToggleStatus={toggleStudentStatus}
              onEmitCertificate={emitCertificateForStudent}
              onUpdateStudentsList={(updated) => setStudents(updated)}
            />
          )}



          {/* TAB 8: CORREÇÃO & PROVAS */}
          {activeTab === 'avaliacoes' && (
            <InstructorEvaluationsTab
              students={students}
              courses={courses}
            />
          )}

          {/* TAB 9: EMISSÃO DIPLOMAS */}
          {activeTab === 'certificados' && (
            <div className={`p-6 rounded-3xl text-left space-y-6 ${cardThemeClass}`}>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Visual diploma view templates (Gold Styled, Neo-Skeuomorphic) */}
                <div className="lg:col-span-8 p-6 sm:p-10 bg-cream-100 dark:bg-ink-900/60 border-8 border-double border-gold-600/80 rounded-3xl shadow-xl space-y-6 text-center select-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/5 rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-1.5">
                    <img
                      src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520970/multiplus-academy-logo-sem-fundo_d7gqbs.png"
                      alt="MultiPlus Logo"
                      className="h-14 w-auto mx-auto object-contain"
                    />
                    <h5 className="font-mono text-4xs tracking-widest text-gold-600 font-bold">MULTIPLUS ACADEMY • ANGOLA</h5>
                    <h3 className="font-serif font-black text-slate-800 dark:text-cream-100 text-lg sm:text-xl m-0">CERTIFICADO DE MÉRITO ACADÉMICO</h3>
                  </div>

                  <p className="text-2xs text-neutral-400 leading-relaxed font-serif italic max-w-lg mx-auto">
                    Certificamos por via deste carimbo de modulação fiscal que o formando outorgado concluiu satisfatoriamente todas as 72 horas letivas teóricas e simulacros práticos orais correspondentes ao programa intensivo.
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 block">NOME DO MERECEDOR JURISTA</span>
                    <span className="font-serif font-black text-ink-900 dark:text-cream-100 text-md sm:text-lg block underline decoration-[#BB8533] decoration-2">
                      Dr. António Ferreira Carvalho
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-ink-800 max-w-md mx-auto text-center font-mono">
                    <div>
                      <span className="text-[8px] text-neutral-400 block uppercase">Avaliação</span>
                      <span className="font-extrabold text-slate-850 dark:text-cream-200 text-2xs block">92 / 100</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-neutral-400 block uppercase">Código Hash</span>
                      <span className="font-extrabold text-slate-850 dark:text-cream-200 text-[9px] block text-gold-600">MPA-2026-UNLOCKED-PER_</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-neutral-400 block uppercase">Diretora</span>
                      <span className="font-extrabold text-ink-900 dark:text-cream-100 text-3xs block">Esmeralda Sumbelelo</span>
                    </div>
                  </div>

                  {/* Mock QR Code representation */}
                  <div className="pt-2 flex flex-col items-center space-y-1.5">
                    <div className="p-2 border border-gray-200 dark:border-ink-800 bg-cream-100 dark:bg-ink-950 inline-block rounded-xl shadow-inner">
                      <QrCode className="text-slate-800 dark:text-cream-100" size={54} />
                    </div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block font-black">Scan to Validate Registry Authenticity</span>
                  </div>

                </div>

                {/* Validation verification center right column */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-gray-55 dark:bg-ink-900/40 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4">
                    <h4 className="font-serif font-bold text-ink-900 dark:text-cream-100 text-xs m-0 border-b pb-2">Validação Fiscal de Chaves</h4>
                    <form onSubmit={testValidateCertificate} className="space-y-3">
                      <input
                        type="text"
                        required
                        placeholder="Insira código hash (Ex: MPA-2026-UNLOCKED-PER_)..."
                        value={inputHashVerify}
                        onChange={(e) => setInputHashVerify(e.target.value)}
                        className="w-full p-2.5 bg-cream-100 dark:bg-ink-900 border dark:border-ink-800 rounded text-xs select-text text-center text-slate-800 dark:text-cream-100 font-mono font-bold focus:outline-none focus:border-gold-600"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 border-0 rounded text-3xs font-mono font-bold uppercase transition-all cursor-pointer"
                      >
                        Autenticar Código
                      </button>
                    </form>

                    {hashResultText && (
                      <div className="p-3 bg-cream-100 dark:bg-ink-900 border dark:border-ink-800 rounded text-2xs font-mono text-ink-900 dark:text-cream-100 font-bold leading-normal">
                        {hashResultText}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: AGENDA LETIVA */}
          {activeTab === 'calendario' && (
            <InstructorCalendarTab
              students={students}
              courses={courses}
            />
          )}

          {/* TAB 11: MENSAGENS & MURAL */}
          {activeTab === 'mensagens' && (
            <InstructorMessagesTab
              students={students}
              courses={courses}
              setCurrentPage={setCurrentPage}
            />
          )}

          {/* TAB 12: MÉTRICAS & SVGS */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6 text-left">
              
              <div className={`p-5 rounded-3xl ${cardThemeClass}`}>
                <span className="text-[9px] font-mono text-gold-600 font-black uppercase block tracking-widest">Relatório Académico Geral</span>
                <h3 className="font-serif font-black text-lg text-ink-900 dark:text-cream-100 m-0 leading-tight">Taxas de Retenção & Notas Gerais</h3>
                <p className="text-xs text-neutral-400 mt-1">Dados estatísticos sincronizados diretos do Sistema de Gestão Escolar (LMS).</p>
              </div>

              {/* Rich Visual SVGs grids stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* SVG 1: Distribuição de Alunos por Nível Letivo */}
                <div className={`p-6 rounded-3xl flex flex-col justify-between align-stretch text-left ${cardThemeClass}`}>
                  <div className="border-b pb-2 mb-3 border-gray-150 dark:border-ink-800/60">
                    <span className="text-[8px] font-mono text-neutral-400 block uppercase">KPI - Nível Geral</span>
                    <h4 className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 m-0">Inscritos por Módulo Curricular</h4>
                  </div>
                  
                  {/* Visual SVG Circular or Stacked bars */}
                  <div className="py-4 flex justify-center">
                    <svg width="150" height="150" className="overflow-visible" viewBox="0 0 100 100">
                      {/* Circle arcs mock */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke={isDarkMode ? "#1B222E" : "#e1e1e1"} strokeWidth="8" />
                      {/* Active arc */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#BB8533" strokeWidth="8" strokeDasharray="180 250" strokeLinecap="round" transform="rotate(-90 50 50)" />
                      <text x="50" y="55" textAnchor="middle" className="font-serif font-black text-lg fill-[#151D29] dark:fill-cream-100 text-xs">78%</text>
                    </svg>
                  </div>
                  <span className="text-[9px] font-mono text-center text-neutral-400">78% de frequência conclutiva de exercícios práticos</span>
                </div>

                {/* SVG 2: Engajamento por dia de semana */}
                <div className={`p-6 rounded-3xl flex flex-col justify-between align-stretch text-left ${cardThemeClass}`}>
                  <div className="border-b pb-2 mb-3 border-gray-150 dark:border-ink-800/60">
                    <span className="text-[8px] font-mono text-neutral-400 block uppercase">KPI - Atividade LMS</span>
                    <h4 className="font-serif font-black text-xs text-ink-900 dark:text-cream-100 m-0">Acessos dos Juristas por Dia</h4>
                  </div>
                  
                  {/* SVG Vertical Charts bars */}
                  <div className="py-4">
                    <svg viewBox="0 0 100 40" className="w-full h-24">
                      {/* Bars */}
                      <rect x="5" y="10" width="8" height="30" fill={isDarkMode ? "#C89B3C" : "#151D29"} rx="2" />
                      <rect x="25" y="5" width="8" height="35" fill="#BB8533" rx="2" />
                      <rect x="45" y="15" width="8" height="25" fill={isDarkMode ? "#C89B3C" : "#151D29"} rx="2" />
                      <rect x="65" y="2" width="8" height="38" fill="#BB8533" rx="2" />
                      <rect x="85" y="20" width="8" height="20" fill={isDarkMode ? "#C89B3C" : "#151D29"} rx="2" />
                    </svg>
                    <div className="flex justify-between text-[7px] font-mono text-neutral-400 pt-2 border-t border-gray-150 dark:border-ink-800/60">
                      <span>SEG</span>
                      <span>TER (AULA)</span>
                      <span>QUA</span>
                      <span>QUI (AULA)</span>
                      <span>SAB (WSHOP)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 13: PERFIL DO DOCENTE CP */}
          {activeTab === 'perfil' && (
            <div className={`p-6 rounded-3xl text-left space-y-6 ${cardThemeClass}`}>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-ink-800/60">
                <img
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg"
                  alt="Esmeralda Foto"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gold-600"
                />
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block">Docente Titular</span>
                  <h3 className="font-serif font-black text-slate-805 dark:text-cream-100 text-xl m-0 leading-tight">Drª. Esmeralda Bruno Sumbelelo</h3>
                  <span className="text-2xs font-mono text-neutral-400 block mt-1">Diretora da Cadeia de Inglês Jurídico • Huambo, Angola</span>
                </div>
              </div>

              {/* CV bio form edits */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-black block">Resumo do Currículo Vitae (Exposto no site)</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-mono text-neutral-400 uppercase mb-1">Apresentação Curta (Bio)</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-800 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-neutral-400 uppercase mb-1">Instruções de Credenciamento</label>
                    <input
                      type="text"
                      value={profileCredentials}
                      onChange={(e) => setProfileCredentials(e.target.value)}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-800 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                    />
                  </div>

                  <button
                    onClick={() => {
                      alert('O seu currículo e perfil de oradora titular foram guardados. O site institucional atualizará as informações na próxima sincronização pública.');
                    }}
                    className="px-4 py-2 bg-ink-900 dark:bg-gold-600 text-cream-100 dark:text-slate-950 hover:bg-gold-600 hover:text-slate-900 border-0 text-xs font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Guardar Currículo
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 14: CONFIGURAÇÕES ACCESSIBILITY */}
          {activeTab === 'configuracoes' && (
            <div className={`p-6 rounded-3xl text-left space-y-6 ${cardThemeClass}`}>
              <div>
                <span className="text-[9px] font-mono text-gold-600 font-black uppercase tracking-widest block">LMS Access Control</span>
                <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg mt-1 m-0">Acessibilidade, Layout & Integrações</h3>
                <p className="text-xs text-neutral-400">Ative configurações de voz, painéis térmicos ou conecte APIs externas.</p>
              </div>

              {/* Adjusts selectors */}
              <div className="space-y-4">
                
                <div className="flex justify-between items-center p-3.5 bg-cream-200 dark:bg-ink-900/60 rounded-xl border border-transparent dark:border-ink-850">
                  <div>
                    <span className="text-xs font-serif font-bold text-ink-900 dark:text-cream-100 block">Modo Escuro / Noturno de Leitura</span>
                    <span className="text-4xs text-neutral-400 font-mono">Modera cores do painel para evitar desgaste visual</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    className="w-4 h-4 accent-[#BB8533] cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center p-3.5 bg-cream-200 dark:bg-ink-900/60 rounded-xl border border-transparent dark:border-ink-850">
                  <div>
                    <span className="text-xs font-serif font-bold text-ink-900 dark:text-cream-100 block">Contraste de Acessibilidade Académico</span>
                    <span className="text-4xs text-neutral-400 font-mono">Realça bordas de tabelas para leitores com deficiências visuais</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => {
                      setHighContrast(e.target.checked);
                      alert('Modo alto contraste ativado com integridade estrutural.');
                    }}
                    className="w-4 h-4 accent-[#BB8533] cursor-pointer"
                  />
                </div>

                <div className="p-5 border border-dashed border-gray-200 dark:border-ink-800 rounded-2xl bg-slate-900 text-cream-100 font-mono space-y-2 select-none">
                  <span className="text-[8px] text-gold-600 font-black uppercase">SYSTEM INTEGRATIONS REGISTRY LOG</span>
                  <div className="grid grid-cols-2 gap-4 pt-1 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Google Meet: CONECTADO</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Google Calendar: ATIVO</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Supabase (Auth): ATIVO</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Cloudinary Storage: PRONTO</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {showCertificateIssueModal && (
        <CertificateIssueModal
          initialStudentId={preselectedStudentId}
          onClose={() => {
            setShowCertificateIssueModal(false);
            setPreselectedStudentId('');
          }}
          onSave={() => {
            loadDatabase();
            setShowCertificateIssueModal(false);
            setPreselectedStudentId('');
          }}
        />
      )}

    </div>
  );
}
