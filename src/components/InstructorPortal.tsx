import React, { useState, useEffect, FormEvent } from 'react';
import { PageId, User, Course } from '../types';
import { COURSES_LIST } from '../data';
import { useAuth } from './auth/AuthProvider';
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
  MessageSquare,
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
  Bell,
  Sun,
  Moon,
  ExternalLink,
  HelpCircle,
  Copy,
  FolderOpen,
  Filter
} from 'lucide-react';

// Import modular panels
import InstructorDashboardTab from './instructor/InstructorDashboardTab';
import InstructorCoursesTab from './instructor/InstructorCoursesTab';
import InstructorStudentsTab from './instructor/InstructorStudentsTab';
import InstructorEvaluationsTab from './instructor/InstructorEvaluationsTab';
import InstructorCalendarTab from './instructor/InstructorCalendarTab';
import InstructorMessagesTab from './instructor/InstructorMessagesTab';

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
  const [courses, setCourses] = useState<Course[]>(() => {
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (localGrads) {
      try {
        const db = JSON.parse(localGrads);
        if (db.courses && db.courses.length > 0) return db.courses;
      } catch (e) {}
    }
    return COURSES_LIST;
  });

  const [students, setStudents] = useState<User[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Simple Alerts counts mock
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Submissão de avaliação de António C.', read: false },
    { id: 2, text: 'Novo jurista solicitando matrícula direta.', read: false }
  ]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Search input of global top tracker bar
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // 1. Accessibility State Settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // 2. Custom CV Bio Profile Form States
  const [profileBio, setProfileBio] = useState('Esmeralda Bruno Sumbelelo é advogada licenciada associada e diretora académica titular dos programas jurídicos internacionais da MultiPlus Academy.');
  const [profileCredentials, setProfileCredentials] = useState('Licenciada em Direito pela UAN, Oradora Huambo, Especialista em Compliance.');

  // 3. New Course creation Form States
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('€450');
  const [newCourseCategory, setNewCourseCategory] = useState('Direito Corporativo');
  const [newCourseDuration, setNewCourseDuration] = useState('12 Semanas (3 Meses)');

  // 4. Curriculum planner tree modular states
  const [selectedPlannerCourse, setSelectedPlannerCourse] = useState('eng-legal-angola');
  const [plannerModules, setPlannerModules] = useState([
    { number: 'Mês I', title: 'Fundamentos e Civil Law de Luanda', lessonsCount: 4 },
    { number: 'Mês II', title: 'Elaboração e Drafting de Isenções', lessonsCount: 6 },
    { number: 'Mês III', title: 'Simulacros de Tribunais Arbitrais', lessonsCount: 4 }
  ]);
  const [newPlannerModuleTitle, setNewPlannerModuleTitle] = useState('');

  // 5. Library files repository states
  const [libraryCategory, setLibraryCategory] = useState<'all' | 'pdf' | 'docx' | 'audio'>('all');
  const [libraryFiles, setLibraryFiles] = useState([
    { id: 1, name: 'Lei do Processo Administrativo Angolano.pdf', type: 'pdf', size: '1.4 MB', date: '2026-06-01' },
    { id: 2, name: 'Template - Liability Exclusions Clauses (SaaS).docx', type: 'docx', size: '280 KB', date: '2026-06-04' },
    { id: 3, name: 'Audio Aula 3 - Exercício de Pronúncia Jurídica.mp3', type: 'audio', size: '14.2 MB', date: '2026-06-08' }
  ]);
  const [newLibraryFileName, setNewLibraryFileName] = useState('');

  // 6. Certificados code verification states
  const [inputHashVerify, setInputHashVerify] = useState('');
  const [hashResultText, setHashResultText] = useState('');

  // Synchronize base academic states
  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = () => {
    const localGrads = localStorage.getItem('multiplus_academic_db');
    let db: any = {};
    if (localGrads) {
      try { db = JSON.parse(localGrads); } catch (e) {}
    }

    // Default Students if empty
    if (!db.users || db.users.length === 0) {
      db.users = [
        {
          id: 'per_student',
          email: 'antonio@advogados.ao',
          firstName: 'António',
          lastName: 'Ferreira Carvalho',
          role: 'STUDENT',
          status: 'ACTIVE',
          streak: 4,
          longestStreak: 9,
          totalHoursLearned: 38,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
          phone: '+244 923 456 789'
        },
        {
          id: 'user_temp_1',
          email: 'isabel@empresas.ao',
          firstName: 'Isabel',
          lastName: 'Nascimento (Empresas)',
          role: 'STUDENT',
          status: 'ACTIVE',
          streak: 2,
          longestStreak: 5,
          totalHoursLearned: 12,
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
          phone: '+244 912 300 400'
        },
        {
          id: 'prof_esmeralda_sumbelelo',
          email: 'esmeralda@multiplus.ao',
          firstName: 'Esmeralda',
          lastName: 'Sumbelelo',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150'
        }
      ];
    }

    // Default enrollments
    if (!db.enrollments) {
      db.enrollments = [
        {
          userId: 'per_student',
          courseId: 'eng-legal-angola',
          progressPercent: 78,
          status: 'ACTIVE',
          enrolledAt: '2026-06-01'
        },
        {
          userId: 'user_temp_1',
          courseId: 'eng-legal-angola',
          progressPercent: 32,
          status: 'ACTIVE',
          enrolledAt: '2026-06-03'
        }
      ];
    }

    localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
    
    // Filter out only students
    const studentList = db.users.filter((u: any) => u.role === 'STUDENT');
    setStudents(studentList);
    setEnrollments(db.enrollments);
  };

  // Callback to adjust accounts
  const toggleStudentStatus = (userId: string, currentStatus: string) => {
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (!localGrads) return;
    try {
      const db = JSON.parse(localGrads);
      const idx = db.users?.findIndex((u: any) => u.id === userId);
      if (idx > -1) {
        db.users[idx].status = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
        loadDatabase();
        alert(`Estado da matrícula reajustado.`);
      }
    } catch (e) {}
  };

  // Dynamic certificate issuer
  const emitCertificateForStudent = (userId: string) => {
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (!localGrads) return;
    try {
      const db = JSON.parse(localGrads);
      const enrollmentIdx = db.enrollments?.findIndex((e: any) => e.userId === userId && e.courseId === 'eng-legal-angola');
      
      if (enrollmentIdx > -1) {
        db.enrollments[enrollmentIdx].status = 'COMPLETED';
        db.enrollments[enrollmentIdx].progressPercent = 100;
      }

      if (!db.certificates) db.certificates = [];
      const studentMatch = db.users?.find((u: any) => u.id === userId);
      const studentFullName = studentMatch ? `${studentMatch.firstName} ${studentMatch.lastName}` : 'Dr. Aluno MultiPlus';
      const hashVer = `MPA-2026-UNLOCKED-${userId.substring(0, 4).toUpperCase()}`;

      db.certificates.push({
        certificateNumber: hashVer,
        courseName: 'English for the Legal Field in Angola',
        recipientName: studentFullName,
        completionDate: new Date().toISOString().slice(0, 10),
        instructorName: 'Esmeralda Bruno Sumbelelo',
        finalGrade: '92/100',
        validUntil: 'Sem limite',
        isValid: true,
        institution: 'MultiPlus Academy (Huambo, Angola)',
        verificationCode: hashVer
      });

      localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
      loadDatabase();
      alert(`Outorga jurídica concluída para ${studentFullName}! Certificado gerado sob hash "${hashVer}".`);
    } catch (e) {}
  };

  // Add course from wizard creator
  const handleAddNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const newSlug = newCourseTitle.toLowerCase().replace(/ /g, '-');
    const customId = `course-${Date.now()}`;
    const dynamicCourse: Course = {
      id: customId,
      slug: newSlug,
      title: newCourseTitle,
      subtitle: newCourseSubtitle || 'Formação complementar acelerada.',
      summary: 'Esta emente foi formulada síncronamente pela diretora pedagógica para extensão rápida.',
      duration: newCourseDuration,
      hours: '24 Horas Letivas',
      language: 'Inglês',
      modality: 'Online',
      schedule: 'A definir',
      startDate: 'Agendado',
      price: newCoursePrice,
      targetAudience: ['Juristas Corporativos', 'Formandos Gerais'],
      modules: [
        { number: 'Mês I', title: 'Boilerplate e Metas Iniciais', topics: ['Introdução Geral', 'Conceitos Básicos'] }
      ]
    };

    const updated = [...courses, dynamicCourse];
    setCourses(updated);

    // Save in shared database
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (localGrads) {
      try {
        const db = JSON.parse(localGrads);
        if (!db.courses) db.courses = [];
        db.courses.push(dynamicCourse);
        localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
      } catch (e) {}
    }

    alert(`Sucesso! O curso "${newCourseTitle}" está indexado sob estado "Ativo".`);
    setNewCourseTitle('');
    setNewCourseSubtitle('');
    setActiveTab('cursos');
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
  const testValidateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHashVerify.trim()) return;

    const localGrads = localStorage.getItem('multiplus_academic_db');
    let validated = false;
    if (localGrads) {
      try {
        const db = JSON.parse(localGrads);
        const match = db.certificates?.find((c: any) => c.verificationCode === inputHashVerify.trim());
        if (match) {
          setHashResultText(`DIPLOMA RECONHECIDO! Outorgado para ${match.recipientName} em ${match.completionDate}. Curso: ${match.courseName}.`);
          validated = true;
        }
      } catch (e) {}
    }

    if (!validated) {
      if (inputHashVerify.trim().toUpperCase() === 'MPA-2026-UNLOCKED-PER_') {
        setHashResultText('DIPLOMA RECONHECIDO! Outorgado para Dr. António Ferreira Carvalho por Esmeralda Sumbelelo.');
      } else {
        setHashResultText('CÓDIGO INEXISTENTE. Nenhuma apólice registada sob este carimbo fiscal no LMS.');
      }
    }
  };

  // Derived variables
  const pendingGreads = 1; 
  const certificatesCount = letCertificatesCount();

  function letCertificatesCount() {
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (localGrads) {
      try {
        const db = JSON.parse(localGrads);
        if (db.certificates) return db.certificates.length;
      } catch (e) {}
    }
    return 1;
  }

  return (
    <div className={`flex min-h-screen text-[#1C1C1C] font-sans ${isDarkMode ? 'dark bg-slate-900 text-white-100' : 'bg-[#FAF9F6]'}`}>
      
      {/* 1. SIDEBAR (70% Professional SaaS, 30% Neo-Skeuomorphism Premium) */}
      <aside 
        id="instructor-fixed-sidebar" 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A2E5D] text-white border-r border-[#C89B3C]/20 flex flex-col justify-between py-6 transition-transform lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Superior Header Logo Brand */}
        <div className="px-6 flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png"
              alt="MultiPlus Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="text-left select-none">
              <h1 className="text-sm font-serif font-black tracking-wide text-white m-0">MultiPlus</h1>
              <span className="text-[8px] font-mono tracking-widest text-[#C89B3C] uppercase block">ACADEMY INSTRUCTOR</span>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white border-0 bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 15 Sidebar Tab Navigation list */}
        <nav className="flex-grow mt-5 px-3 space-y-1 overflow-y-auto max-h-[60vh] text-left">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: <Activity size={14} /> },
            { id: 'cursos', name: 'Meus Cursos', icon: <BookOpen size={14} /> },
            { id: 'criar-curso', name: 'Criar Curso', icon: <Plus size={14} /> },
            { id: 'aulas', name: 'Gerir Aulas', icon: <Video size={14} /> },
            { id: 'modulos', name: 'Estruturação/Syllabus', icon: <Layers size={14} /> },
            { id: 'alunos', name: 'Diretório Alunos', icon: <Users size={14} /> },
            { id: 'biblioteca', name: 'Biblioteca Digital', icon: <FolderOpen size={14} /> },
            { id: 'avaliacoes', name: 'Correção & Provas', icon: <ClipboardList size={14} /> },
            { id: 'certificados', name: 'Emissão Diplomas', icon: <Award size={14} /> },
            { id: 'calendario', name: 'Agenda Letiva', icon: <Calendar size={14} /> },
            { id: 'mensagens', name: 'Chat & Mural', icon: <MessageSquare size={14} /> },
            { id: 'relatorios', name: 'Métricas & SVGs', icon: <BarChart2 size={14} /> },
            { id: 'perfil', name: 'Curriculum Vitae', icon: <UserIcon size={14} /> },
            { id: 'configuracoes', name: 'Configurações', icon: <Settings size={14} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-4 py-2.5 rounded-xl text-2xs font-mono font-bold uppercase transition-all flex items-center justify-between border-0 cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-[#C89B3C] text-slate-950 font-black shadow-inner border-l-4 border-slate-900' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              <ChevronRight size={10} className="opacity-40" />
            </button>
          ))}
        </nav>

        {/* Footer actions of Sidebar */}
        <div className="px-5 pt-4 border-t border-white/10 space-y-3.5 text-left">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150"}
              alt="Avatar Esmeralda"
              className="w-9 h-9 rounded-full object-cover border border-[#C89B3C]/50"
            />
            <div>
              <span className="text-2xs font-serif font-black text-white block">Drª. Esmeralda</span>
              <span className="text-[8px] font-mono text-[#C89B3C] uppercase block">Oradora Associada</span>
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
            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-3xs font-mono font-black uppercase tracking-wider transition-all border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Encerrar Sessão</span>
          </button>
        </div>

      </aside>

      {/* Main outer shell (adjusted for fixed sidebar space) */}
      <div className="flex-grow lg:pl-64 flex flex-col min-h-screen">
        
        {/* 2. TOPBAR HEADER FIXA */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-150 px-4 sm:px-6 flex items-center justify-between select-none">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-gray-150 hover:bg-gray-100 cursor-pointer"
            >
              ☰
            </button>

            {/* Global Search box in academic archives */}
            <div className="relative hidden sm:block w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar nos arquivos da MultiPlus..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-2xs focus:outline-none focus:border-[#C89B3C]"
              />
            </div>
          </div>

          {/* Indicators Shortcuts Right Side */}
          <div className="flex items-center gap-3.5">
            
            {/* Dark Mode toggle trigger */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 border border-gray-150 rounded-xl hover:bg-gray-50 text-gray-400 cursor-pointer"
              title="Alternar Tema Escuro de Leitura"
            >
              {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Quick Notify bells dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                className="p-2 border border-gray-150 rounded-xl hover:bg-gray-50 text-gray-400 relative cursor-pointer"
                title="Centro de Alertas Síncronos"
              >
                <Bell size={13} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>

              {showNotificationsMenu && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white border border-gray-200 p-3 rounded-2xl shadow-xl text-left z-50">
                  <span className="text-[8px] font-mono font-bold text-gray-450 uppercase block border-b pb-1.5 mb-2">NOTIFICAÇÕES DA TURMA</span>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <p key={n.id} className="text-4xs text-[#0a2e5d] leading-normal m-0">{n.text}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Public Help Desk Trigger Link */}
            <button
              onClick={() => {
                alert('Tutor assistente MultiPlus: Por favor envie um e-mail para: suporte@multiplus.ao com a sua credencial Huambo.');
              }}
              className="p-2 border border-gray-150 rounded-xl hover:bg-gray-50 text-gray-400 cursor-pointer"
              title="Ajuda ao Docente"
            >
              <HelpCircle size={13} />
            </button>

            {/* Short Profiler */}
            <div className="flex items-center gap-2 border-l pl-3.5">
              <img
                src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150"}
                alt="Formadora Avatar"
                className="w-8 h-8 rounded-full border border-gray-200"
              />
              <span className="text-[10px] font-mono tracking-wider font-extrabold text-blue-900 uppercase">Esmeralda Sumbelelo</span>
            </div>

          </div>

        </header>

        {/* 3. DYNAMIC CONTENT AREA BLOCK */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
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
            />
          )}

          {/* TAB 2: MEUS CURSOS */}
          {activeTab === 'cursos' && (
            <InstructorCoursesTab
              courses={courses}
              onNavigateToCreate={() => setActiveTab('criar-curso')}
              onUpdateCourses={(updated) => setCourses(updated)}
            />
          )}

          {/* TAB 3: CRIAR CURSO */}
          {activeTab === 'criar-curso' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              <div>
                <span className="text-[9px] font-mono text-[#C89B3C] font-black tracking-widest block uppercase">Formulário Ministerial</span>
                <h3 className="font-serif font-black text-[#0A2E5D] text-lg mt-1 m-0">Criar Novo Curso de Extensão Linguística</h3>
                <p className="text-xs text-gray-400">Preencha o programa para disponibilizar matrículas diretas aos juristas de Luanda e Huambo.</p>
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
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C89B3C] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Subtítulo Resumido</label>
                    <input
                      type="text"
                      placeholder="Ex: Técnicas de debate oral em disputas energéticas angolanas"
                      value={newCourseSubtitle}
                      onChange={(e) => setNewCourseSubtitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C89B3C] text-slate-800"
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
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-center font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-450 uppercase mb-1">Categoria Programática</label>
                    <select
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-slate-805"
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
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-center text-slate-808"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 text-xs font-mono font-extrabold uppercase rounded-xl border-0 cursor-pointer transition-all"
                >
                  Registrar Curso Ativo
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: GERIR AULAS */}
          {activeTab === 'aulas' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              <div>
                <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-widest block">INTEGRAÇÃO CLOUDINARY CLOUD</span>
                <h3 className="font-serif font-black text-[#0A2E5D] text-lg mt-1 m-0">Videoteca de Transcrições de Oratória</h3>
                <p className="text-xs text-gray-400">Anexe materiais lúdicos (PDFs), apresentações de slides (PPT), determine tempos estimados e marque regras de acesso.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Upload Simulated Area */}
                <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-3">
                  <Upload size={30} className="text-gray-400" />
                  <div>
                    <h4 className="font-serif font-bold text-slate-700 text-sm m-0">Arraste seu arquivo mp4 ou srt aqui</h4>
                    <span className="text-[10px] text-gray-400 block mt-1">Capacidade de processamento de até 1 GB por vídeo</span>
                  </div>
                  <button 
                    onClick={() => alert('Selecione vídeo de simulação: O lms carrega as legendas automáticas via Cloudinary.')}
                    className="px-3.5 py-1.5 bg-[#0D2644] text-white rounded-lg text-3xs font-mono font-bold uppercase transition-all cursor-pointer"
                  >
                    Navegar Arquivos Físicos
                  </button>
                </div>

                {/* Video list mock and privacy configurations */}
                <div className="space-y-4">
                  <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase tracking-wider block">Videoaulas Carregadas Recentes</span>
                  
                  {[
                    { title: 'Conceito e Diferenciação de Indemnisation', duration: '24M', status: 'Livre' },
                    { title: 'Precedentes Judiciais e Casos de Arbitragem em Luanda', duration: '44M', status: 'Apenas Membros' }
                  ].map((vid, vidIdx) => (
                    <div key={vidIdx} className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video size={14} className="text-[#C89B3C]" />
                        <div>
                          <span className="font-serif font-black text-xs text-slate-700 block">{vid.title}</span>
                          <span className="text-[9px] font-mono text-gray-400">{vid.duration} • Legendas em Português</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                        {vid.status}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ESTRUTURAÇÃO / SYLLABUS */}
          {activeTab === 'modulos' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              <div>
                <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-widest block">Course Structure Tree / Planner</span>
                <h3 className="font-serif font-black text-[#0A2E5D] text-lg mt-1 m-0">Planeador Modular de Ementas</h3>
                <p className="text-xs text-gray-400">Arraste temas, crie novos pilares e estipule cronogramas em tempo real antes do lançamento letivo.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Form to insert module */}
                <div className="lg:col-span-5 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                  <h4 className="text-2xs font-mono font-bold text-gray-500 uppercase block mb-3 border-b pb-1.5">ANEXAR CATEGORIA DE CONTEÚDO</h4>
                  <form onSubmit={handleAddPlannerModule} className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-mono text-gray-400 uppercase mb-1">Título do Segmento Académico</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Módulo IV - Fusões Internacionais e Joint Ventures"
                        value={newPlannerModuleTitle}
                        onChange={(e) => setNewPlannerModuleTitle(e.target.value)}
                        className="w-full p-2 bg-white border rounded text-xs text-slate-809"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#0A2E5D] text-white rounded text-3xs font-mono font-extrabold uppercase cursor-pointer"
                    >
                      Acrescentar Eixo Letivo
                    </button>
                  </form>
                </div>

                {/* Structure visual representations */}
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-[9px] font-mono text-gray-400 font-extrabold uppercase block text-left">PILARES DA GRADE DE PORTFOLIO JURÍDICO</span>
                  {plannerModules.map((pm, pmIdx) => (
                    <div key={pmIdx} className="p-3 bg-white border border-gray-150 rounded-xl flex justify-between items-center text-left">
                      <div>
                        <span className="text-[8px] font-mono text-[#C89B3C] font-bold block">{pm.number}</span>
                        <h5 className="font-serif font-black text-slate-700 text-xs m-0">{pm.title}</h5>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 font-semibold">{pm.lessonsCount} Tópicos Indexados</span>
                    </div>
                  ))}
                </div>

              </div>
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

          {/* TAB 7: BIBLIOTECA DIGITAL */}
          {activeTab === 'biblioteca' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-wider block">Library Common Repository</span>
                  <p className="font-serif font-black text-md text-[#0A2E5D] m-0 leading-tight">Materiais Complementares das Classes</p>
                  <p className="text-xs text-gray-400 mt-1">Carregue manuais (PDF), cartilhas de vocabulário, rascunhos em docx e gabaritos de apoio.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setLibraryCategory('all')}
                    className={`px-3 py-1 text-4xs font-mono uppercase rounded-lg border cursor-pointer ${
                      libraryCategory === 'all' ? 'bg-[#0A2E5D] text-white' : 'bg-transparent text-gray-500'
                    }`}
                  >
                    Ver Todos
                  </button>
                  <button
                    onClick={() => setLibraryCategory('pdf')}
                    className={`px-3 py-1 text-4xs font-mono uppercase rounded-lg border cursor-pointer ${
                      libraryCategory === 'pdf' ? 'bg-[#0A2E5D] text-white' : 'bg-transparent text-gray-500'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setLibraryCategory('docx')}
                    className={`px-3 py-1 text-4xs font-mono uppercase rounded-lg border cursor-pointer ${
                      libraryCategory === 'docx' ? 'bg-[#0A2E5D] text-white' : 'bg-transparent text-gray-500'
                    }`}
                  >
                    DOCX
                  </button>
                </div>
              </div>

              {/* Upload dynamic form bar */}
              <form onSubmit={handleUploadLibraryFile} className="bg-gray-50 p-4 rounded-xl border border-gray-150 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome do novo arquivo (Ex: Dicionário-de-Termos-Comuns.pdf)..."
                  value={newLibraryFileName}
                  onChange={(e) => setNewLibraryFileName(e.target.value)}
                  className="flex-grow p-2 text-xs bg-white rounded border focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A2E5D] text-white rounded text-3xs font-mono font-bold uppercase cursor-pointer"
                >
                  Anexar à Pasta
                </button>
              </form>

              {/* Grid List representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {libraryFiles
                  .filter(f => libraryCategory === 'all' || f.type === libraryCategory)
                  .map((file) => (
                    <div key={file.id} className="p-4 bg-white border border-gray-150 rounded-2xl space-y-2 flex flex-col justify-between hover:border-[#C89B3C]/40 hover:shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <FileText className="text-[#C89B3C] shrink-0 mt-0.5" size={16} />
                        <div className="truncate">
                          <h6 className="font-serif font-bold text-xs text-slate-800 m-0 truncate leading-tight" title={file.name}>
                            {file.name}
                          </h6>
                          <span className="text-[9px] font-mono text-gray-400 block mt-0.5">{file.size} • {file.date}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => alert('A descarregar arquivo emulado do repositório da MultiPlus...')}
                          className="px-2 py-1 text-4xs font-mono uppercase border hover:bg-gray-55 text-slate-600 rounded bg-transparent cursor-pointer"
                        >
                          Baixar
                        </button>
                        <button 
                          onClick={() => {
                            setLibraryFiles(prev => prev.filter(f => f.id !== file.id));
                            alert('Ficheiro eliminado.');
                          }}
                          className="px-2 py-1 text-4xs font-mono uppercase bg-red-50 text-red-650 hover:bg-red-100 rounded border-0 cursor-pointer"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

            </div>
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
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Visual diploma view templates (Gold Styled, Neo-Skeuomorphic) */}
                <div className="lg:col-span-8 p-6 sm:p-10 bg-white border-8 border-double border-[#C89B3C]/80 rounded-3xl shadow-xl space-y-6 text-center select-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C89B3C]/5 rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-1.5">
                    <img
                      src="https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png"
                      alt="MultiPlus Logo Gold"
                      className="h-14 w-auto mx-auto object-contain"
                    />
                    <h5 className="font-mono text-4xs tracking-widest text-[#C89B3C] font-bold">MULTIPLUS ACADEMY • ANGOLA</h5>
                    <h3 className="font-serif font-black text-slate-800 text-lg sm:text-xl m-0">CERTIFICADO DE MÉRITO ACADÉMICO</h3>
                  </div>

                  <p className="text-2xs text-gray-500 leading-relaxed font-serif italic max-w-lg mx-auto">
                    Certificamos por via deste carimbo de modulação fiscal que o formando outorgado concluiu satisfatoriamente todas as 72 horas letivas teóricas e simulacros práticos orais correspondentes ao programa intensivo.
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-gray-400 block">NOME DO MERECEDOR JURISTA</span>
                    <span className="font-serif font-black text-[#0A2E5D] text-md sm:text-lg block underline decoration-[#C89B3C] decoration-2">
                      Dr. António Ferreira Carvalho
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 max-w-md mx-auto text-center font-mono">
                    <div>
                      <span className="text-[8px] text-gray-400 block uppercase">Avaliação</span>
                      <span className="font-extrabold text-slate-850 text-2xs block">92 / 100</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block uppercase">Código Hash</span>
                      <span className="font-extrabold text-slate-850 text-[9px] block text-[#C89B3C]">MPA-2026-UNLOCKED-PER_</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 block uppercase">Diretora</span>
                      <span className="font-extrabold text-[#0A2E5D] text-3xs block">Esmeralda Sumbelelo</span>
                    </div>
                  </div>

                  {/* Mock QR Code representation */}
                  <div className="pt-2 flex flex-col items-center space-y-1.5">
                    <div className="p-2 border border-gray-200 bg-white inline-block rounded-xl shadow-inner">
                      <QrCode className="text-slate-800" size={54} />
                    </div>
                    <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block font-black">Scan to Validate Registry Authenticity</span>
                  </div>

                </div>

                {/* Validation verification center right column */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-gray-55 p-5 rounded-3xl border border-gray-150 space-y-4">
                    <h4 className="font-serif font-bold text-[#0A2E5D] text-xs m-0 border-b pb-2">Validação Fiscal de Chaves</h4>
                    <form onSubmit={testValidateCertificate} className="space-y-3">
                      <input
                        type="text"
                        required
                        placeholder="Insira código hash (Ex: MPA-2026-UNLOCKED-PER_)..."
                        value={inputHashVerify}
                        onChange={(e) => setInputHashVerify(e.target.value)}
                        className="w-full p-2.5 bg-white border rounded text-xs select-text text-center text-slate-800 font-mono font-bold"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#0A2E5D] hover:bg-[#C89B3C] text-white hover:text-slate-900 border-0 rounded text-3xs font-mono font-bold uppercase transition-all cursor-pointer"
                      >
                        Autenticar Código
                      </button>
                    </form>

                    {hashResultText && (
                      <div className="p-3 bg-white border rounded text-2xs font-mono text-[#0A2E5D] font-bold leading-normal">
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
            />
          )}

          {/* TAB 12: MÉTRICAS & SVGS */}
          {activeTab === 'relatorios' && (
            <div className="space-y-6 text-left">
              
              <div className="bg-white p-5 rounded-3xl border border-gray-150">
                <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase block tracking-widest">Relatório Académico Geral</span>
                <h3 className="font-serif font-black text-lg text-[#0A2E5D] m-0 leading-tight">Taxas de Retenção & Notas Gerais</h3>
                <p className="text-xs text-gray-400 mt-1">Dados estatísticos sincronizados diretos do Sistema de Gestão Escolar (LMS).</p>
              </div>

              {/* Rich Visual SVGs grids stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* SVG 1: Distribuição de Alunos por Nível Letivo */}
                <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col justify-between align-stretch text-left">
                  <div className="border-b pb-2 mb-3">
                    <span className="text-[8px] font-mono text-gray-400 block uppercase">KPI - Nível Geral</span>
                    <h4 className="font-serif font-black text-xs text-[#0A2E5D] m-0">Inscritos por Módulo Curricular</h4>
                  </div>
                  
                  {/* Visual SVG Circular or Stacked bars */}
                  <div className="py-4 flex justify-center">
                    <svg width="150" height="150" className="overflow-visible" viewBox="0 0 100 100">
                      {/* Circle arcs mock */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e1e1e1" strokeWidth="8" />
                      {/* Active arc */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#C89B3C" strokeWidth="8" strokeDasharray="180 250" strokeLinecap="round" transform="rotate(-90 50 50)" />
                      <text x="50" y="55" textAnchor="middle" className="font-serif font-black text-lg fill-[#0A2E5D] text-xs">78%</text>
                    </svg>
                  </div>
                  <span className="text-[9px] font-mono text-center text-gray-400">78% de frequência conclutiva de exercícios práticos</span>
                </div>

                {/* SVG 2: Engajamento por dia de semana */}
                <div className="bg-white p-6 rounded-3xl border border-gray-150 flex flex-col justify-between align-stretch text-left">
                  <div className="border-b pb-2 mb-3">
                    <span className="text-[8px] font-mono text-gray-400 block uppercase">KPI - Atividade LMS</span>
                    <h4 className="font-serif font-black text-xs text-[#0A2E5D] m-0">Acessos dos Juristas por Dia</h4>
                  </div>
                  
                  {/* SVG Vertical Charts bars */}
                  <div className="py-4">
                    <svg viewBox="0 0 100 40" className="w-full h-24">
                      {/* Bars */}
                      <rect x="5" y="10" width="8" height="30" fill="#0A2E5D" rx="2" />
                      <rect x="25" y="5" width="8" height="35" fill="#C89B3C" rx="2" />
                      <rect x="45" y="15" width="8" height="25" fill="#0A2E5D" rx="2" />
                      <rect x="65" y="2" width="8" height="38" fill="#C89B3C" rx="2" />
                      <rect x="85" y="20" width="8" height="20" fill="#0A2E5D" rx="2" />
                    </svg>
                    <div className="flex justify-between text-[7px] font-mono text-gray-400 pt-2 border-t">
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
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150"
                  alt="Esmeralda Foto"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#C89B3C]"
                />
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block">Docente Titular</span>
                  <h3 className="font-serif font-black text-slate-805 text-xl m-0 leading-tight">Drª. Esmeralda Bruno Sumbelelo</h3>
                  <span className="text-2xs font-mono text-gray-400 block mt-1">Diretora da Cadeia de Inglês Jurídico • Huambo, Angola</span>
                </div>
              </div>

              {/* CV bio form edits */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-black block">Resumo do Currículo Vitae (Exposto no site)</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-mono text-gray-400 uppercase mb-1">Apresentação Curta (Bio)</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="w-full p-2.5 text-xs bg-gray-50 border rounded text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-400 uppercase mb-1">Instruções de Credenciamento</label>
                    <input
                      type="text"
                      value={profileCredentials}
                      onChange={(e) => setProfileCredentials(e.target.value)}
                      className="w-full p-2.5 text-xs bg-gray-50 border rounded text-slate-808"
                    />
                  </div>

                  <button
                    onClick={() => {
                      alert('O seu currículo e perfil de oradora titular foram guardados. O site institucional atualizará as informações na próxima sincronização pública.');
                    }}
                    className="px-4 py-2 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 border-0 text-xs font-mono font-bold uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Guardar Currículo
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 14: CONFIGURAÇÕES ACCESSIBILITY */}
          {activeTab === 'configuracoes' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-150 text-left space-y-6">
              <div>
                <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-widest block">LMS Access Control</span>
                <h3 className="font-serif font-black text-[#0A2E5D] text-lg mt-1 m-0">Acessibilidade, Layout & Integrações</h3>
                <p className="text-xs text-gray-400">Ative configurações de voz, painéis térmicos ou conecte APIs externas.</p>
              </div>

              {/* Adjusts selectors */}
              <div className="space-y-4">
                
                <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-xs font-serif font-bold text-[#0A2E5D] block">Modo Escuro / Noturno de Leitura</span>
                    <span className="text-4xs text-gray-400 font-mono">Modera cores do painel para evitar desgaste visual</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                    className="w-4 h-4 accent-[#C89B3C] cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-xs font-serif font-bold text-[#0A2E5D] block">Contraste de Acessibilidade Académico</span>
                    <span className="text-4xs text-gray-400 font-mono">Realça bordas de tabelas para leitores com deficiências visuais</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => {
                      setHighContrast(e.target.checked);
                      alert('Modo alto contraste ativado com integridade estrutural.');
                    }}
                    className="w-4 h-4 accent-[#C89B3C] cursor-pointer"
                  />
                </div>

                <div className="p-5 border border-dashed border-gray-200 rounded-2xl bg-slate-900 text-white font-mono space-y-2 select-none">
                  <span className="text-[8px] text-[#C89B3C] font-black uppercase">SYSTEM INTEGRATIONS REGISTRY LOG</span>
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
                      <span>Firebase (Auth): ATIVO</span>
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

        </main>

      </div>

    </div>
  );
}
