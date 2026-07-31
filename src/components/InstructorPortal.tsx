import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User, Course } from '../types';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';
import { useTheme } from '../contexts/ThemeContext';
import { messageService } from '../services/supabase/messageService';
import { useToast } from './ui/Toast';
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
import InstructorAcademicWorkspace from './instructor/InstructorAcademicWorkspace';
import InstructorProgressTab from './instructor/InstructorProgressTab';
import InstructorMessagesTab from './instructor/InstructorMessagesTab';
import { courseService } from '../services/supabase/courseService';
import { useTeacherEvaluations } from '../hooks/useTeacherEvaluations';
import CertificateIssueModal from './certificates/CertificateIssueModal';
import InstructorShell from './instructor/InstructorShell';
import InstructorSidebar, { InstructorTab } from './instructor/InstructorSidebar';
import InstructorTopbar from './instructor/InstructorTopbar';
import InstructorProfilePage from './instructor/InstructorProfilePage';
import InstructorNotificationPopover from './instructor/InstructorNotificationPopover';

interface InstructorPortalProps {
  setCurrentPage: (page: PageId) => void;
}

export default function InstructorPortal({
  setCurrentPage
}: InstructorPortalProps) {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
  const { signOut } = useAuth();
  const toast = useToast();
  
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

  // 8. Consolidated Realtime subscription
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchUnreadMessagesCount();

    const channel = supabase
      .channel('instructor-portal-realtime')
      // Listen to messages table to update unread count and fetch database
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadMessagesCount();
        }
      )
      // Listen to notifications table for user specific notifications
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        () => {
          // Re-load notifications
          supabase.from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20)
            .then(({ data }) => {
              setNotifications(data || []);
            });
        }
      )
      // Listen to courses table to update courses list
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          loadDatabase();
        }
      )
      // Listen to enrollments table to update students and enrollments
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments' },
        () => {
          loadDatabase();
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

      // 2. Load only enrollments and students from the teacher's own courses.
      const courseIds = liveCourses.map((course: any) => course.id);
      if (courseIds.length) {
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('student_id, course_id, progress_percent, status, data_inicio, student:users(id, email, nome_completo, foto_perfil, telefone, status)')
          .in('course_id', courseIds);
        const uniqueStudents = new Map<string, User>();
        (enrollData || []).forEach((enrollment: any) => {
          const student = enrollment.student;
          if (student && !uniqueStudents.has(student.id)) uniqueStudents.set(student.id, {
            id: student.id, email: student.email, firstName: student.nome_completo?.split(' ')[0] || '', lastName: student.nome_completo?.split(' ').slice(1).join(' ') || '', role: 'ALUNO', status: student.status || 'ACTIVE', streak: 0, longestStreak: 0, totalHoursLearned: 0, avatarUrl: student.foto_perfil || '', phone: student.telefone || ''
          });
        });
        setStudents([...uniqueStudents.values()]);
        setEnrollments((enrollData || []).map((enrollment: any) => ({ userId: enrollment.student_id, courseId: enrollment.course_id, progressPercent: enrollment.progress_percent || 0, status: enrollment.status, enrolledAt: enrollment.data_inicio?.slice(0, 10) || '' })));
      } else {
        setStudents([]);
        setEnrollments([]);
      }

      // 4. Load certificates count
      const { count: certsCount, error: certsErr } = courseIds.length ? await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds) : { count: 0, error: null };
      if (!certsErr && certsCount !== null) {
        setCertificatesCount(certsCount);
      }

      // 5. Load lessons count
      const { count: totalLessons, error: lessonsErr } = courseIds.length ? await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds) : { count: 0, error: null };
      if (!lessonsErr && totalLessons !== null) {
        setLessonsCount(totalLessons);
      } else {
        setLessonsCount(0);
      }

      // 6. Load notifications
      if (currentUser?.id) {
        const { data: notifsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setNotifications(notifsData || []);
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
      toast.success(`Estado da matrícula reajustado no Supabase para ${nextStatus}.`);
    } catch (e: any) {
      console.error('Erro ao reajustar matrícula:', e);
      toast.error(`Erro ao reajustar matrícula: ${e.message || e}`);
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
      toast.success(`Sucesso! O curso "${newCourseTitle}" está indexado sob estado "Rascunho" no Supabase.`);
      
      setNewCourseTitle('');
      setNewCourseSubtitle('');
      loadDatabase();
      setActiveTab('cursos');
    } catch (err: any) {
      console.error('Erro ao registrar curso no Supabase:', err);
      toast.error(`Falha ao registrar curso: ${err.message || err}`);
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
    toast.success('Nova categoria de ementa anexada no mapa lógico.');
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
    toast.success('Documento adicionado à biblioteca comum dos formandos!');
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
  const { pendingCount: pendingGreads } = useTeacherEvaluations(currentUser?.id);
  const completionRate = enrollments.length ? Math.round(enrollments.reduce((sum: number, enrollment: any) => sum + (Number(enrollment.progressPercent) || 0), 0) / enrollments.length) : 0;

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
    <>
    <InstructorShell
      isDarkMode={isDarkMode}
      highContrast={highContrast}
      sidebar={<InstructorSidebar
        activeTab={activeTab as InstructorTab}
        open={mobileSidebarOpen}
        user={currentUser}
        onClose={() => setMobileSidebarOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onMessages={() => setCurrentPage('messages')}
        onSignOut={async () => { await signOut().catch(() => undefined); setCurrentUser(null); setCurrentPage('login'); }}
      />}
      topbar={<InstructorTopbar
        activeTab={activeTab as InstructorTab}
        user={currentUser}
        isDark={isDarkMode}
        search={globalSearchTerm}
        unreadMessages={unreadMessagesCount}
        notificationCount={notifications.filter((notification) => !notification.read).length}
        onSearch={setGlobalSearchTerm}
        onMenu={() => setMobileSidebarOpen(true)}
        onTheme={toggleTheme}
        onMessages={() => setCurrentPage('messages')}
        onNotifications={() => setShowNotificationsMenu(true)}
        onProfile={() => setActiveTab('perfil')}
      />}
    >
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
              enrollments={enrollments}
              recentNotifications={notifications}
              evaluationsPendingCount={pendingGreads}
              certificatesIssuedCount={certificatesCount}
              completionRate={completionRate}
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
              currentUser={currentUser}
            />
          )}

          {activeTab === 'academico' && <InstructorAcademicWorkspace />}

          {/* TAB 9: EMISSÃO DIPLOMAS */}
          {activeTab === 'certificados' && (
            <section className={`mx-auto max-w-4xl rounded-2xl p-5 text-left sm:p-6 ${cardThemeClass}`}>
              <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gold-600">Credenciais acadêmicas</p>
              <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Emitir certificado</h2><p className="mt-2 max-w-xl text-xs leading-relaxed text-neutral-400">Emita certificados a partir dos dados reais de aluno, curso e conclusão. Os PDFs são tratados pelo fluxo privado de documentos da MultiPlus.</p></div><button onClick={() => { setPreselectedStudentId(''); setShowCertificateIssueModal(true); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gold-600 px-4 text-xs font-mono font-bold uppercase text-ink-900 hover:bg-[#E2B755]"><Award size={15}/>Emitir certificado</button></div>
              <div className="mt-6 rounded-xl border border-dashed border-gray-150 p-6 text-center dark:border-ink-800"><QrCode className="mx-auto text-gold-600" size={22}/><h3 className="mt-3 text-sm font-semibold text-ink-900 dark:text-cream-100">Sem modelo fictício de certificado</h3><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-neutral-400">Certificados emitidos aparecerão no registro institucional e poderão ser verificados pelo código oficial.</p></div>
            </section>
          )}

          {/* TAB 10: AGENDA LETIVA */}
          {activeTab === 'calendario' && (
            <InstructorCalendarTab courses={courses} />
          )}

          {/* TAB 11: MENSAGENS & MURAL */}
          {activeTab === 'mensagens' && (
            <InstructorMessagesTab
              students={students}
              courses={courses}
              setCurrentPage={setCurrentPage}
            />
          )}

          {/* TAB 12: PROGRESSO POR CURSO E AULA */}
          {activeTab === 'relatorios' && (
            <InstructorProgressTab courses={courses} />
          )}

          {/* TAB 13: PERFIL DO DOCENTE CP */}
          {activeTab === 'perfil' && (
            <InstructorProfilePage user={currentUser} onUpdated={setCurrentUser} />
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
                      if (e.target.checked) {
                        toast.info('Modo alto contraste ativado com integridade estrutural.');
                      }
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
    </InstructorShell>

      {showNotificationsMenu && <InstructorNotificationPopover userId={currentUser?.id} notifications={notifications} onChange={setNotifications} onClose={() => setShowNotificationsMenu(false)} />}

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

    </>
  );
}
