import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from '../types';
import { jsPDF } from 'jspdf';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { userService } from '../services/supabase/userService';
import { academicService } from '../services/supabase/academicService';
import QuizArea from './portal/QuizArea';
import VideoPlayer from './portal/VideoPlayer';
import AvatarUpload from './AvatarUpload';
import { useTheme } from '../contexts/ThemeContext';
import { messageService } from '../services/supabase/messageService';
import StudentSidebar from './portal/StudentSidebar';
import StudentTopbar from './portal/StudentTopbar';
import StudentDashboardView from './portal/StudentDashboardView';
import { useStudentData } from '../hooks/useStudentData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useLessonNotes } from '../hooks/useLessonNotes';


import { 
  Award, 
  Clock, 
  Calendar as CalendarIcon, 
  BookOpen, 
  PlayCircle, 
  MessageSquare, 
  User as UserIcon, 
  Flame, 
  TrendingUp, 
  CheckCircle, 
  Download, 
  Plus, 
  ChevronRight, 
  ExternalLink,
  Menu,
  X,
  Bell,
  Search,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Sliders,
  LogOut,
  Video,
  BookMarked,
  Info,
  Lock
} from 'lucide-react';

import StudentMaterialsTab from './portal/StudentMaterialsTab';
import StudentTasksTab from './portal/StudentTasksTab';
import StudentCertificatesTab from './portal/StudentCertificatesTab';
import StudentProgressTab from './portal/StudentProgressTab';

interface StudentPortalProps {
  setCurrentPage: (page: PageId) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentPortal({
  setCurrentPage,
  setVerificationCode
}: StudentPortalProps) {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'calendar' | 'materials' | 'tasks' | 'messages' | 'certificates' | 'progress' | 'profile' | 'settings'>('dashboard');
  
  // Mobile UI controls
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Search Engine
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Accessibility setups
  const { isDarkMode, toggleTheme, setThemeMode } = useTheme();
  const themeMode = isDarkMode ? 'dark' : 'light';
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Streak simulation helper
  const [streakCount, setStreakCount] = useState(0);
  const hours = 0;

  // 1. Centralized Student Data fetching & subscriptions
  const {
    enrollments, certificates, realLessons, completedLessons,
    scheduledLessons, notifications, setNotifications, unreadMessagesCount,
    loading: academicLoading, selectedCourseId, changeCourse: handleCourseChange,
    refetch: fetchStudentData
  } = useStudentData(currentUser?.id);

  // Active Video course selections
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Lecture list definitions (Flagship Legal course)
  const activeSyllabus = realLessons.length > 0 ? realLessons.map(l => ({
    id: l.id,
    title: l.titulo || l.title || 'Sem título',
    duration: l.duracao || '15:00',
    description: l.descricao || l.description || '',
    scheduled_at: l.scheduled_at,
    video_url: l.video_url
  })) : [];

  const currentLecture = activeSyllabus[activeLessonIdx] || activeSyllabus[0] || null;

  // 2. Video Player Integration
  const {
    videoRef, isPlaying: isPlayingVideo, setIsPlaying: setIsPlayingVideo,
    playbackSpeed: videoPlaybackSpeed, changeSpeed: setVideoPlaybackSpeed,
    currentSeconds: videoPlaySec, setCurrentSeconds: setVideoPlaySec,
    randomWatermark, duration: videoDuration
  } = useVideoPlayer(currentUser?.id, selectedCourseId, currentLecture?.id);

  // 3. Lesson Notes Notebook Integration
  const {
    notes: notesList, newNote: newNoteInput, setNewNote: setNewNoteInput,
    saveNote: handleSaveNote
  } = useLessonNotes(currentUser?.id, selectedCourseId, currentLecture?.id);

  // Editable Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    country: 'Angola',
    language: 'Português / Inglês',
    preference: 'Notificações por SMS & E-mail'
  });

  // Calendar toggle view (Month vs Week)
  const [calendarView, setCalendarView] = useState<'MONTH' | 'WEEK'>('MONTH');


  // Update real-time clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { signOut } = useAuth();

  // Sync profile edits dynamically with asynchronous auth session
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        country: 'Angola',
        language: 'Português / Inglês',
        preference: 'Notificações por SMS & E-mail'
      });
      setStreakCount(currentUser.streak || 0);
    }
  }, [currentUser]);

  // Sync profile edits globally state
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const updatedUser: User = {
      ...currentUser,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
      email: profileForm.email
    };
    
    try {
      // Update public.users
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      const { error: userError } = await supabase
        .from('users')
        .update({
          nome_completo: fullName,
          telefone: profileForm.phone
        })
        .eq('id', currentUser.id);
        
      if (userError) throw userError;
      
      // Update public.profiles
      await userService.updateUserProfile(currentUser.id, {
        biografia: `País: ${profileForm.country} | Idioma: ${profileForm.language} | Preferência: ${profileForm.preference}`
      });

      setCurrentUser(updatedUser);
      alert('As coordenadas do seu perfil académico foram sincronizadas e salvas com integridade no Supabase.');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil no Supabase:', err);
      alert(`Falha ao sincronizar perfil: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleExportPDF = () => {
    if (!currentUser) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [10, 46, 93];
    const goldColor = [200, 155, 60];
    const darkGray = [28, 28, 28];
    const lightGray = [120, 120, 120];

    // Helper functions for layouts
    const drawDivider = (yCoord: number) => {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(15, yCoord, 195, yCoord);
    };

    // Header Background Accent Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, 'F');

    // Title / Institution
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(0, 15, 210, 2, 'F');

    // Add Logo or Institutional Header Text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MULTIPLUS ACADEMY', 15, 30);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text('EXCELENCIA ACADEMICA • HUAMBO, ANGOLA', 15, 34);

    // Document Name and Date of Export
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('REGISTO DE APROVEITAMENTO ACADEMICO', 115, 30);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    const currentDateStr = new Date().toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Data de Emissao: ${currentDateStr} UTC`, 115, 34);

    drawDivider(39);

    // Section 1: Student Information
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. DADOS DE IDENTIFICACAO DO ESTUDANTE', 15, 45);

    // Card background for info
    doc.setFillColor(248, 248, 246);
    doc.rect(15, 49, 180, 28, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(15, 49, 180, 28, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    // Label-value pairs
    doc.text('Nome:', 20, 55);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${currentUser.firstName} ${currentUser.lastName}`, 45, 55);

    doc.setFont('Helvetica', 'bold');
    doc.text('E-mail:', 20, 61);
    doc.setFont('Helvetica', 'normal');
    doc.text(currentUser.email, 45, 61);

    doc.setFont('Helvetica', 'bold');
    doc.text('Contacto Tel.:', 20, 67);
    doc.setFont('Helvetica', 'normal');
    doc.text(currentUser.phone || 'N/D', 45, 67);

    doc.setFont('Helvetica', 'bold');
    doc.text('Nivel / Role:', 20, 73);
    doc.setFont('Helvetica', 'normal');
    doc.text('ALUNO REGISTADO / ACTIVE STUDENT MEMBER', 45, 73);

    // Right-aligned status in card
    doc.setFont('Helvetica', 'bold');
    doc.text('Estado Matricial:', 125, 55);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 120, 0); // Green
    doc.text('ATIVO / ATIVA', 155, 55);

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('Helvetica', 'bold');
    doc.text('Carga Horaria Total:', 125, 61);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${hours} Horas Registadas`, 158, 61);

    doc.setFont('Helvetica', 'bold');
    doc.text('Identificacao ID:', 125, 67);
    doc.setFont('Helvetica', 'normal');
    doc.text(currentUser.id, 155, 67);

    // Section 2: Matriculated & Completed Courses
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('2. CURSO PRINCIPAL E APROVEITAMENTO MODULAR', 15, 87);

    // Pull enrollments and certificates database from Supabase state
    let pdfEnrollments = enrollments && enrollments.length > 0 ? enrollments : [];
    let pdfCertificates = certificates && certificates.length > 0 ? certificates : [];

    let yOffset = 92;

    // Course detail outline
    // Loop through enrollments
    pdfEnrollments.forEach((enroll: any, index: number) => {
      const courseId = enroll.course_id || enroll.courseId;
      const title = enroll.course?.titulo || (courseId === 'eng-legal-angola' 
        ? 'English for the Legal Field in Angola' 
        : courseId === 'legal-writing'
          ? 'Advanced Legal Writing & Contract Drafting'
          : 'English for Oil, Gas & Energy in Angola');
      
      const duration = enroll.course?.duracao || (courseId === 'eng-legal-angola' ? '3 Meses (72h)' : '4 Semanas (24h)');
      const enrolledAt = enroll.data_inicio ? enroll.data_inicio.slice(0, 10) : (enroll.enrolledAt || '2026-06-01');
      const progress = enroll.progress_percent || enroll.progressPercent || 0;


      doc.setFillColor(255, 255, 255);
      doc.rect(15, yOffset, 180, 32, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.rect(15, yOffset, 180, 32, 'S');

      // Course summary title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${index + 1}. ${title}`, 18, yOffset + 6);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(`Matricula: ${enrolledAt}`, 18, yOffset + 12);
      doc.text(`Duracao Total: ${duration}`, 18, yOffset + 17);
      doc.text(`Modalidade de Aula: Hibrido Presencial / Live`, 18, yOffset + 22);

      // Progress bar visualization inside PDF
      doc.text(`Progresso Realizado:`, 115, yOffset + 12);
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(240, 240, 240);
      doc.rect(115, yOffset + 14, 60, 4, 'F');
      doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.rect(115, yOffset + 14, (progress / 100) * 60, 4, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.text(`${progress}% Concluido`, 115, yOffset + 22);

      // Check if certificate exists for this course
      const matchedCert = pdfCertificates.find((c: any) => (c.courseName || c.course?.titulo || '').toLowerCase().includes('legal') || (c.courseName || c.course?.titulo || '').toLowerCase().includes(courseId));
      if (progress >= 100 || matchedCert) {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(0, 120, 0);
        doc.text('✓ STATUS: APROVADO COM CERTIFICACAO', 115, yOffset + 27);
      } else {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(200, 100, 0);
        doc.text('• STATUS: EM CURSO / ESTUDANDO', 115, yOffset + 27);
      }

      yOffset += 37;
    });

    // Section 3: Certificate Details
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. CREDENCIAIS E CERTIFICACOES EXPEDIDAS', 15, yOffset);

    yOffset += 5;

    if (pdfCertificates.length === 0) {
      doc.setFillColor(248, 248, 246);
      doc.rect(15, yOffset, 180, 15, 'F');
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text('Nenhum certificado emitido ate ao momento. Complete 100% das sessoes e avaliacoes.', 20, yOffset + 9);
      yOffset += 20;
    } else {
      pdfCertificates.forEach((cert: any) => {
        doc.setFillColor(250, 247, 240);
        doc.rect(15, yOffset, 180, 26, 'F');
        doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
        doc.setLineWidth(0.3);
        doc.rect(15, yOffset, 180, 26, 'S');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Certificado N. ${cert.certificateNumber || 'MPA-2026-001'} (Valido)`, 18, yOffset + 6);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(`Curso: ${cert.courseName}`, 18, yOffset + 12);
        doc.text(`Aproveitamento pedagogico: Nota Final ${cert.finalGrade || '92/100'}`, 18, yOffset + 17);
        doc.text(`Docente do Curso: ${cert.instructorName || 'Prof. Esmeralda Bruno Sumbelelo'}`, 18, yOffset + 22);

        doc.setFont('Helvetica', 'bold');
        doc.text(`Verificacao QR Code / ID:`, 125, yOffset + 12);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text(cert.verificationCode || 'MPA-2026-001', 125, yOffset + 17);

        yOffset += 31;
      });
    }

    // Section 4: Academic Integrity / Institutional footer block & Stamps
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DECLARACAO DE QUALIDADE E AUTENTICIDADE', 15, yOffset);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('A MultiPlus Academy atesta para devidos efeitos juridicos, laborais e de promocao curricular que as', 15, yOffset + 5);
    doc.text('informacoes descritas neste documento correspondem integralmente ao rendimento do(a) estudante no nosso LMS central.', 15, yOffset + 9);
    doc.text('A conformidade das notas e certificados podera ser validada a qualquer momento no ecra de verificacao.', 15, yOffset + 13);

    yOffset += 26;

    // Signature stamp lines left / right
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(25, yOffset, 80, yOffset);
    doc.line(130, yOffset, 185, yOffset);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('Secretaria Academica', 40, yOffset + 4);
    doc.text('MultiPlus Academy Huambo', 37, yOffset + 8);

    doc.text('Diretoria Pedagogica', 147, yOffset + 4);
    doc.text('Prof. Esmeralda B. Sumbelelo', 143, yOffset + 8);

    const filenameStr = `${currentUser.firstName.toLowerCase()}_${currentUser.lastName.toLowerCase()}_academic_record.pdf`;
    doc.save(filenameStr);
  };

  // Global lookups search logic
  const handleGlobalSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;

    const term = globalSearch.toLowerCase();
    if (term.includes('certif') || term.includes('diploma')) {
      setActiveTab('certificates');
      setSearchFeedback('A redirecionar para o Acervo de Certificados com QR Code.');
    } else if (term.includes('cláusula') || term.includes('write') || term.includes('draft')) {
      setActiveTab('courses');
      setSearchFeedback('A redirecionar para o Módulo de Redação de Cláusulas.');
    } else if (term.includes('mensagem') || term.includes('prof') || term.includes('esmeralda')) {
      setActiveTab('messages');
      setSearchFeedback('A abrir canal direto de chat com a Profa. Esmeralda.');
    } else if (term.includes('material') || term.includes('pdf')) {
      setActiveTab('materials');
      setSearchFeedback('A abrir o arquivo de Manuais para descarga.');
    } else {
      setSearchFeedback(`A pesquisar no currículo por: "${globalSearch}". Nenhuma referência letiva directa correspondente.`);
    }

    setTimeout(() => setSearchFeedback(null), 3500);
    setGlobalSearch('');
  };

  // Export scheduled lessons as .ics file
  const handleExportICS = () => {
    const lessonsWithDate = (scheduledLessons || []).filter(
      session => session.lesson?.scheduled_at
    );

    if (lessonsWithDate.length === 0) {
      alert('Nenhuma aula agendada encontrada para exportação.');
      return;
    }

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MultiPlus Academy//NONSGML Calendar//PT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';

    lessonsWithDate.forEach((session, idx) => {
      const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
      const description = session.lesson?.descricao || 'Sessão em videoconferência síncrona com avaliação e debates.';
      const rawDate = session.lesson?.scheduled_at!;
      const courseTitle = session.lesson?.course?.title || session.lesson?.course?.titulo || 'Curso MultiPlus';
      
      const d = new Date(rawDate);
      const startStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Assume 2 hour duration for lessons
      const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
      const endStr = endD.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const uid = `lesson-${session.id || idx}@multiplus.academy`;

      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:${uid}\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icsContent += `DTSTART:${startStr}\n`;
      icsContent += `DTEND:${endStr}\n`;
      icsContent += `SUMMARY:${courseTitle} - ${title}\n`;
      icsContent += `DESCRIPTION:${description.replace(/\n/g, '\\n')}\n`;
      icsContent += `LOCATION:${session.lesson?.meeting_url || ''}\n`;
      icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aulas_multiplus.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Accessibility theme class selections
  const containerThemeClass = isHighContrast 
    ? 'bg-black text-yellow-300 font-extrabold border-yellow-500' 
    : themeMode === 'dark' 
      ? 'bg-ink-900 text-cream-100 border-ink-800' 
      : 'bg-slate-50 text-slate-800 border-slate-200/60';

  const cardThemeClass = isHighContrast
    ? 'border-4 border-yellow-500 bg-black text-cream-100'
    : themeMode === 'dark'
      ? 'bg-ink-800 border border-ink-800/40 shadow-xs text-cream-100'
      : 'bg-white border border-slate-200/80 shadow-xs text-slate-800';

  // Encontrar a próxima aula agendada futura síncrona real
  const nextScheduledLesson = scheduledLessons && scheduledLessons.length > 0
    ? scheduledLessons
        .filter(l => l.lesson?.scheduled_at && new Date(l.lesson.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.lesson!.scheduled_at!).getTime() - new Date(b.lesson!.scheduled_at!).getTime())[0]
    : null;

  return (
    <div id="multiplus-student-lms-portal" className={`min-h-screen flex items-stretch transition-colors duration-200 ${containerThemeClass}`}>
      
      {/* SIDEBAR NAVIGATION - Collapsible on Mobile, Fixed on Desktop */}
      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onSignOut={async () => {
          try {
            await signOut();
          } catch (e) {}
          setCurrentUser(null);
          setCurrentPage('login');
        }}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        isHighContrast={isHighContrast}
        themeMode={themeMode}
      />

      {/* CENTRAL DISPLAY PANEL (RIGHT WORKSPACE) */}
      <div className="flex-grow flex flex-col overflow-hidden lg:pl-64 relative">
        {/* Subtle premium background glow effects matching the Home page layout */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[60%] bg-gradient-to-br from-[#C89B3C]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-slate-200/10 dark:bg-slate-800/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* TOPBAR HEADER ACTIONS */}
        <StudentTopbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          onSignOut={async () => {
            try {
              await signOut();
            } catch (e) {}
            setCurrentUser(null);
            setCurrentPage('login');
          }}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          isHighContrast={isHighContrast}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          streakCount={streakCount}
          unreadMessagesCount={unreadMessagesCount}
          notifications={notifications}
          setNotifications={setNotifications}
          isNotificationsOpen={isNotificationsOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          handleGlobalSearchSubmit={handleGlobalSearchSubmit}
          cardThemeClass={cardThemeClass}
        />

        {/* Global Lookup feed search warning feedbacks notification banner */}
        {searchFeedback && (
          <div className="mx-6 mt-4 p-3.5 bg-ink-900/10 border border-gold-600 text-ink-900 text-xs font-semibold rounded-xl text-left">
            <span>🔎 {searchFeedback}</span>
          </div>
        )}

        {/* MAIN DISPLAY AREA COMPONENT WORKSPACE GRID */}
        <main className="flex-grow p-6 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              
              {activeTab === 'dashboard' && (
                <StudentDashboardView
                  enrollments={enrollments}
                  currentTime={currentTime}
                  profileForm={profileForm}
                  nextScheduledLesson={nextScheduledLesson}
                  streakCount={streakCount}
                  completedLessons={completedLessons}
                  realLessons={realLessons}
                  certificates={certificates}
                  currentLecture={currentLecture}
                  setActiveTab={setActiveTab}
                  cardThemeClass={cardThemeClass}
                  isHighContrast={isHighContrast}
                />
              )}

              {/* 2. COURSES ENGINE VIDEO PLAYER VIEW */}
              {activeTab === 'courses' && (
                <div className="space-y-6 text-left">
                  {enrollments.length === 0 ? (
                    <div className="bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6">
                      <div className="w-16 h-16 bg-ink-900/5 text-gold-600 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen size={28} />
                      </div>
                      <div className="space-y-2 text-center">
                        <h4 className="font-serif font-black text-lg text-ink-900 dark:text-cream-100 leading-tight m-0">
                          Você ainda não está inscrito em nenhum curso.
                        </h4>
                        <p className="text-xs text-neutral-400 dark:text-gray-450 leading-relaxed font-sans m-0">
                          A área de videoaulas estará disponível assim que for matriculado num curso oficial.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Section Title and grid selector */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Módulo I & II Ativos</span>
                          <h3 className="text-lg font-serif font-black m-0 text-ink-900 dark:text-cream-100">Leitor Integrado de Videoaulas</h3>
                        </div>

                        {/* Preparation course future catalog displays as requested */}
                        <select
                          className="px-3 py-1.5 rounded-xl bg-cream-100 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-xs font-serif font-bold text-ink-900 dark:text-cream-100 focus:outline-none"
                          value={selectedCourseId}
                          onChange={(e) => handleCourseChange(e.target.value)}
                        >
                          {enrollments.map((enroll: any) => (
                            <option key={enroll.course_id} value={enroll.course_id}>
                              {enroll.course?.title || enroll.course?.titulo || 'Curso Ativo'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seletor de aulas compacto para mobile */}
                      <div className="lg:hidden mb-4">
                        <select
                          value={activeLessonIdx}
                          onChange={(e) => {
                            setActiveLessonIdx(parseInt(e.target.value));
                            setVideoPlaySec(0);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-cream-100 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-sm font-serif font-bold text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                        >
                          {activeSyllabus.map((syll, idx) => {
                            const isLocked = syll.scheduled_at ? new Date(syll.scheduled_at) > new Date() : false;
                            const isCompleted = completedLessons.includes(syll.id);
                            return (
                              <option key={idx} value={idx} disabled={isLocked}>
                                {isLocked ? '🔒 ' : isCompleted ? '✓ ' : ''}{syll.title} ({syll.duration})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Left Player vs Right curricular tree list partitions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                    
                    {/* Left Frame column: Video placeholder plus legal notebooks */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                      
                      {/* Interactive player card */}
                      <div className="aspect-video bg-slate-900 border border-gold-600/35 rounded-2xl overflow-hidden relative flex flex-col justify-between items-stretch select-none shadow">
                        
                        {!currentLecture ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(93,93,93,0.15)_0%,#0F1520_100%)]">
                            <BookOpen className="w-12 h-12 text-gold-600/30 mb-2" />
                            <h4 className="text-cream-100 text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
                              Nenhuma aula disponível
                            </h4>
                            <p className="text-[10px] text-neutral-400 mt-2 text-center max-w-xs">
                              As aulas do seu curso aparecerão aqui assim que o professor as publicar.
                            </p>
                          </div>
                        ) : (
                          <>
                            {(!currentLecture.scheduled_at || new Date(currentLecture.scheduled_at) > new Date()) ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(93,10,10,0.35)_0%,#1a0404_100%)]">
                                <Lock size={44} className="text-red-500 mb-2 animate-bounce" />
                                <h4 className="text-cream-100 text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
                                  {currentLecture.title}
                                </h4>
                                <span className="text-[10px] font-mono text-neutral-400 mt-2 block bg-black/40 px-3 py-1.5 rounded-lg border border-red-500/20">
                                  {currentLecture.scheduled_at ? (
                                    `🔒 CONTEÚDO BLOQUEADO • Disponível apenas a partir de ${new Date(currentLecture.scheduled_at).toLocaleString('pt-AO')}`
                                  ) : (
                                    '🔒 CONTEÚDO BLOQUEADO • Esta aula ainda não foi agendada pelo professor'
                                  )}
                                </span>
                              </div>
                            ) : (
                              currentLecture.video_url ? (
                                <VideoPlayer
                                  videoRef={videoRef}
                                  src={currentLecture.video_url || ''}
                                  title={currentLecture.title || ''}
                                  isPlaying={isPlayingVideo}
                                  setIsPlaying={setIsPlayingVideo}
                                  currentSeconds={videoPlaySec}
                                  setCurrentSeconds={setVideoPlaySec}
                                  playbackSpeed={videoPlaybackSpeed}
                                  onSpeedChange={(spd) => {
                                    setVideoPlaybackSpeed(spd);
                                    if (videoRef.current) {
                                      videoRef.current.playbackRate = spd;
                                    }
                                  }}
                                  watermarkPosition={randomWatermark}
                                  watermarkText={`${currentUser?.email || currentUser?.firstName || 'Aluno'} • MULTIPLUS`}
                                  onEnded={() => {
                                    setIsPlayingVideo(false);
                                  }}
                                  onTimeUpdate={(ct) => {
                                    setVideoPlaySec(Math.floor(ct));
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(10,46,93,0.3)_0%,#040c1a_100%)]">
                                  <Video size={44} className="text-gold-600/40 mb-2 animate-pulse" />
                                  <h4 className="text-cream-100 text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
                                    {currentLecture.title}
                                  </h4>
                                  <span className="text-[10px] font-mono text-neutral-400 mt-2 block">
                                    Vídeo indisponível para esta aula.
                                  </span>
                                </div>
                              )
                            )}
                          </>
                        )}

                      </div>

                      {currentLecture && (
                        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 ${cardThemeClass}`}>
                          <div className="text-left">
                            <h4 className="text-xs font-serif font-black m-0">Aproveitamento Académico</h4>
                            <p className="text-[10px] text-neutral-450 dark:text-neutral-400 m-0 leading-normal">Marque a aula como concluída para computar no seu histórico escolar do Huambo.</p>
                          </div>
                          
                          {completedLessons.includes(currentLecture.id) ? (
                            <button
                              onClick={async () => {
                                if (currentUser?.id && selectedCourseId) {
                                  try {
                                    await academicService.markLessonComplete(currentUser.id, selectedCourseId, currentLecture.id, false);
                                    await fetchStudentData();
                                  } catch (err) {
                                    console.error('Erro ao reabrir aula:', err);
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              ✓ Aula Concluída (Reabrir)
                            </button>
                          ) : (
                            <button
                              onClick={() => setIsCompleteModalOpen(true)}
                              className="px-4 py-2 bg-gold-600 hover:bg-[#b58b35] text-cream-100 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer border-0 shadow-sm font-bold"
                            >
                              Marcar como Concluída
                            </button>
                          )}
                        </div>
                      )}

                      {/* Lesson Transcripts — Descrição da aula com design responsivo */}
                      <div className={`p-4 sm:p-5 rounded-2xl ${cardThemeClass}`}>
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-ink-800 pb-2 mb-3">
                          <BookOpen size={14} className="text-gold-600 shrink-0" />
                          <span className="text-[10px] sm:text-xs font-mono text-gold-600 font-black uppercase tracking-wider">
                            Descrição da Aula
                          </span>
                        </div>
                        <div className="text-sm sm:text-base text-slate-600 dark:text-gray-300 leading-relaxed font-sans">
                          {currentLecture?.descricao || currentLecture?.description || (
                            <span className="text-neutral-400 italic text-xs sm:text-sm">
                              Transcrição não disponível para esta aula.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Quiz Segment */}
                      {currentLecture && currentLecture.id && (
                        <QuizArea
                          lessonId={currentLecture.id}
                          userId={currentUser?.id || ''}
                          onQuizPassed={async () => {
                            if (currentUser?.id && selectedCourseId && currentLecture.id) {
                              try {
                                await academicService.markLessonComplete(currentUser.id, selectedCourseId, currentLecture.id, true);
                                await fetchStudentData();
                              } catch (err) {
                                console.error('Error marking lesson complete from quiz success:', err);
                              }
                            }
                          }}
                        />
                      )}

                      {/* Caderno de Apontamentos do Aluno — Design responsivo */}
                      <div className={`p-4 sm:p-5 rounded-2xl space-y-4 ${cardThemeClass}`}>
                        <div className="flex items-center gap-2">
                          <BookMarked size={14} className="text-gold-600 shrink-0" />
                          <h4 className="text-sm sm:text-xs font-serif font-black m-0">Caderno de Apontamentos</h4>
                        </div>
                        
                        {/* Input + Botão em stack vertical no mobile */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder={`Anotação em ${Math.floor(videoPlaySec / 60)}:${(videoPlaySec % 60).toString().padStart(2, '0')}...`}
                            value={newNoteInput}
                            onChange={(e) => setNewNoteInput(e.target.value)}
                            className="flex-1 px-3 py-2.5 sm:py-2 text-sm sm:text-xs rounded-xl bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none min-h-[44px]"
                          />
                          <button
                            onClick={handleSaveNote}
                            disabled={!newNoteInput.trim()}
                            className="px-4 py-2.5 sm:py-2 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 hover:text-slate-900 border-0 text-xs sm:text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap font-bold"
                          >
                            Guardar Nota
                          </button>
                        </div>

                        {/* Lista de notas */}
                        <div className="space-y-2.5 max-h-48 sm:max-h-56 overflow-y-auto pt-2 divide-y divide-gray-100 dark:divide-slate-700/50">
                          {notesList.map((n) => (
                            <div key={n.id} className="pt-2 flex justify-between gap-3 sm:gap-4 text-sm sm:text-xs">
                              <div className="space-y-1 flex-1 min-w-0">
                                <p className="m-0 text-slate-650 dark:text-gray-200 leading-normal">{n.text}</p>
                                <span className="block text-[10px] font-mono text-neutral-400">{n.date}</span>
                              </div>
                              <button
                                className="bg-ink-900/5 text-gold-600 font-mono text-[10px] sm:text-[9px] font-bold px-2.5 py-1 rounded-lg border border-ink-900/10 text-center self-start shrink-0 cursor-pointer hover:bg-gold-600 hover:text-white transition-colors"
                                onClick={() => {
                                  if (videoRef.current) {
                                    videoRef.current.currentTime = n.timestamp;
                                  }
                                }}
                                title="Saltar para este momento"
                              >
                                ⏱ {Math.floor(n.timestamp / 60)}:{(n.timestamp % 60).toString().padStart(2, '0')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right column: Curricular lessons sequence tree list */}
                    <div className="hidden lg:block lg:col-span-4">
                      <div className={`p-4 rounded-2xl flex flex-col h-full ${cardThemeClass}`}>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block border-b border-gray-100 dark:border-ink-800 pb-3 mb-3">
                          CURSOGRAMA ACADÉMICO
                        </span>

                        <div className="space-y-2 flex-1">
                           {activeSyllabus.length === 0 ? (
                             <div className="text-center py-12 space-y-3">
                               <BookOpen className="w-12 h-12 text-gold-600/30 mx-auto" />
                               <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm">
                                 Nenhuma aula disponível
                                </h4>
                               <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                                 As aulas do seu curso aparecerão aqui assim que o professor as publicar.
                               </p>
                             </div>
                           ) : (
                             activeSyllabus.map((syll, index) => {
                               const isLocked = syll.scheduled_at ? new Date(syll.scheduled_at) > new Date() : false;
                               return (
                                 <button
                                   key={index}
                                   onClick={() => {
                                     if (isLocked) {
                                       alert('Esta aula está bloqueada!');
                                       return;
                                     }
                                     setActiveLessonIdx(index);
                                     setVideoPlaySec(0);
                                   }}
                                   className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between gap-3 cursor-pointer ${
                                     activeLessonIdx === index
                                       ? 'border-gold-600 bg-ink-900/5 dark:bg-slate-800 text-ink-900 dark:text-gold-600'
                                       : 'border-gray-100 dark:border-ink-800 hover:border-gray-200'
                                   } ${isLocked ? 'opacity-70 cursor-not-allowed bg-cream-150 dark:bg-ink-950/20' : ''}`}
                                 >
                                   <div className="space-y-1 text-left flex-1 min-w-0">
                                     <h5 className="font-serif font-black m-0 leading-snug truncate flex items-center gap-1">
                                       {isLocked && <Lock size={12} className="text-red-500 shrink-0" />}
                                       {syll.title}
                                     </h5>
                                     <p className="text-[10px] text-neutral-400 m-0 flex items-center gap-1.5">
                                       {isLocked ? (
                                         <span className="text-red-650 dark:text-red-400 font-semibold font-mono text-[9px] flex items-center gap-0.5">
                                           {syll.scheduled_at ? `Agendada para ${new Date(syll.scheduled_at!).toLocaleDateString('pt-AO')}` : 'Não agendada'}
                                         </span>
                                       ) : completedLessons.includes(syll.id) ? (
                                         <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[9px] flex items-center gap-0.5">
                                           ✓ Concluída
                                         </span>
                                       ) : (
                                         <span>Segmento explicativo</span>
                                       )}
                                     </p>
                                   </div>
                                   <span className="text-gold-600 font-mono text-4xs shrink-0 self-center font-bold">
                                     {syll.duration}
                                   </span>
                                 </button>
                               );
                             })
                           )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-150 dark:border-ink-800 bg-cream-200 dark:bg-ink-900/40 p-3 rounded-xl text-center space-y-2">
                          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wide block">TUTORIA DIRECTA</span>
                          <p className="text-[10px] text-neutral-400 m-0 leading-normal">
                            Qualquer dúvida ortográfica, consulte o centro de mensagens para debater os rascunhos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

              {/* 3. CALENDAR VIEW PAGE PANEL */}
              {activeTab === 'calendar' && (
                <div className="space-y-6 text-left">
                  <div className={`p-6 rounded-3xl space-y-6 ${cardThemeClass}`}>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-1">PROGRAMA DE EXAMES</span>
                        <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Calendário Letivo de Debates</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Calendrier select view buttons */}
                        <div className="flex items-center gap-1 border border-gray-150 dark:border-ink-800 p-1 bg-cream-200 dark:bg-ink-900 rounded-xl">
                          {(['MONTH', 'WEEK'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setCalendarView(v)}
                              className={`px-3 py-1 rounded-lg text-3xs font-mono font-bold uppercase cursor-pointer border-0 ${
                                calendarView === v ? 'bg-ink-900 text-cream-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-400'
                              }`}
                            >
                              {v === 'MONTH' ? 'Mensal' : 'Semanal'}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleExportICS}
                          className="px-3.5 py-1.5 bg-cream-300 dark:bg-ink-800 hover:bg-gold-600 dark:hover:bg-gold-600 dark:hover:text-slate-950 text-ink-900 dark:text-cream-100 font-mono text-3xs font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer border-0 flex items-center gap-1"
                        >
                          <Download size={10} /> Exportar .ICS
                        </button>
                      </div>
                    </div>

                    {/* Schedule item grids mapped out */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {(() => {
                        const now = new Date();
                        const rawLessons = scheduledLessons.filter(s => s.lesson?.scheduled_at);
                        const filtered = rawLessons.filter(s => {
                          const date = new Date(s.lesson.scheduled_at);
                          if (calendarView === 'WEEK') {
                            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                            return date >= now && date <= oneWeekFromNow;
                          } else {
                            // Current month & year
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                          }
                        });
                        
                        // If filtered is empty, fall back to showing all scheduled lessons
                        const displayLessons = filtered.length > 0 ? filtered : rawLessons;

                        if (displayLessons.length > 0) {
                          return displayLessons.map((session, index) => {
                            const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
                            const dateVal = session.lesson.scheduled_at.split('T')[0];
                            const timeVal = session.lesson.scheduled_at.split('T')[1]?.substring(0, 5) || '--:--';
                            const courseTitle = session.lesson?.course?.title || session.lesson?.course?.titulo || 'English for the Legal Field';
                            const meetUrl = session.lesson?.meeting_url || null;

                            return (
                              <div key={session.id || index} className="p-4 rounded-xl border border-gray-150 bg-cream-100 dark:bg-ink-900 shadow-3xs space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gold-600" />
                                <div className="flex justify-between items-center text-2xs font-mono font-bold">
                                  <span className="text-gold-600 uppercase truncate max-w-[150px]">{courseTitle}</span>
                                  <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">{timeVal}</span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-serif font-black text-ink-900 dark:text-gold-600 leading-snug">{title}</h4>
                                  <p className="text-[10px] text-neutral-400 mt-1">
                                    Aula agendada pelo seu professor titular para o dia {dateVal}.
                                  </p>
                                </div>
                                {meetUrl ? (
                                  <a 
                                    href={meetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-2.5 bg-ink-900 text-cream-100 text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-gold-600 hover:text-slate-950 transition-colors"
                                  >
                                    Entrar na Aula
                                  </a>
                                ) : (
                                  <span className="py-2.5 bg-gray-100 dark:bg-slate-800 text-neutral-400 text-center rounded-lg text-3xs font-mono font-bold uppercase block">
                                    Link da aula indisponível
                                  </span>
                                )}
                              </div>
                            );
                          });
                        } else {
                          return (
                            <div className="col-span-full py-12 text-center space-y-3">
                              <CalendarIcon className="w-12 h-12 text-gold-600/30 mx-auto animate-pulse" />
                              <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm">
                                Nenhum encontro agendado
                              </h4>
                              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                                Não existem aulas com agendamento no momento para o seu curso.
                              </p>
                            </div>
                          );
                        }
                      })()}

                    </div>

                  </div>
                </div>
              )}

              {/* 4. ACADEMIC MATERIALS FILTERABLE DIR */}
              {activeTab === 'materials' && (
                <StudentMaterialsTab userId={currentUser?.id} />
              )}

              {/* 5. TASKS MANAGER AND FILE SUBMISSION */}
              {activeTab === 'tasks' && (
                <StudentTasksTab userId={currentUser?.id} />
              )}

              {/* 6. MESSAGE CENTER */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div className={`p-8 rounded-3xl ${cardThemeClass} text-center space-y-6 flex flex-col items-center justify-center`}>
                    <MessageSquare className="w-16 h-16 text-gold-600 animate-pulse" />
                    <div>
                      <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg">Central de Tutoria Direta</h3>
                      <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
                        A sua área de mensagens privadas com a professora titular agora abre num ecrã inteiro próprio, oferecendo mais espaço de digitação e visualização.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentPage('messages')}
                      className="px-6 py-3 bg-gold-600 hover:bg-[#b58b35] text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md border-0"
                    >
                      Abrir Chats em Tela Cheia
                    </button>
                  </div>
                </div>
              )}

              {/* 7. CERTIFICATES ACADEMIC VAULT */}
              {activeTab === 'certificates' && (
                <StudentCertificatesTab 
                  currentUser={currentUser}
                  setCurrentPage={setCurrentPage}
                  setVerificationCode={setVerificationCode}
                />
              )}

              {/* 8. DETAILED PROGRESS ANALYTICS GRAPH */}
              {activeTab === 'progress' && (
                <StudentProgressTab currentUser={currentUser} />
              )}

              {/* 9. DETAILED PROFILE EDITABLE COORDINATES FORM */}
              {activeTab === 'profile' && (
                <div className="space-y-6 text-left">
                  <div className={`p-6 rounded-3xl space-y-6 ${cardThemeClass}`}>
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Identidade Académica</span>
                      <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Meu Perfil de Aluno</h3>
                      <p className="text-xs text-neutral-400 mt-1">Controle as informações cadastrais e canais de notificações preferidos.</p>
                    </div>

                    {/* NEW EXPORT PDF WIDGET */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-ink-900/5 dark:bg-slate-800/50 p-5 rounded-2xl border border-gold-600/35">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-serif font-black text-ink-900 dark:text-gold-600 m-0">Exportar Meu Registo Académico (PDF)</h4>
                        <p className="text-2xs text-neutral-400 dark:text-neutral-400 m-0 leading-normal font-sans">
                          Gere e descarrega um sumário oficial de aproveitamento de todos os cursos inscritos, carga horária e certificados obtidos com selo institucional de Angola.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        id="export-academic-record-btn"
                        className="px-5 py-3 bg-ink-900 hover:bg-gold-600 hover:text-slate-950 text-cream-100 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer border-0 shadow-sm transition-all shrink-0"
                      >
                        <Download size={13} />
                        <span>Exportar Registo</span>
                      </button>
                    </div>

                    {/* FOTOGRAFIA DE PERFIL ACADÉMICO */}
                    <div className="flex flex-col items-center sm:items-start gap-3 bg-ink-900/5 dark:bg-slate-800/50 p-5 rounded-2xl border border-gold-600/10">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase block font-bold">Fotografia de Perfil Académico</span>
                      {currentUser?.id && (
                        <AvatarUpload
                          userId={currentUser.id}
                          currentAvatarUrl={currentUser.avatarUrl}
                          userName={`${currentUser.firstName} ${currentUser.lastName}`}
                          size="xl"
                          onAvatarUpdated={(newUrl) => {
                            if (currentUser) {
                              setCurrentUser({
                                ...currentUser,
                                avatarUrl: newUrl
                              });
                            }
                          }}
                        />
                      )}
                      <p className="text-3xs text-neutral-400 m-0 leading-normal">
                        Clique sobre o círculo acima para carregar ou atualizar a sua foto oficial de perfil académico (Formatos válidos: JPEG, PNG, WebP, máx. 5MB).
                      </p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Nome Próprio</label>
                          <input
                            type="text"
                            required
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            className="w-full px-3 py-2 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none rounded-xl text-xs placeholder:text-neutral-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Apelido (Último nome)</label>
                          <input
                            type="text"
                            required
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            className="w-full px-3 py-2 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none rounded-xl text-xs placeholder:text-neutral-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Contacto Telefónico</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="w-full px-3 py-2 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none rounded-xl text-xs placeholder:text-neutral-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">E-mail Registado</label>
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            className="w-full px-3 py-2 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none rounded-xl text-xs placeholder:text-neutral-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">País</label>
                          <span className="block px-3 py-2 bg-gray-100 dark:bg-slate-800 text-neutral-400 rounded-xl text-xs select-none">Angola</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Fluência Base</label>
                          <span className="block px-3 py-2 bg-gray-100 dark:bg-slate-800 text-neutral-400 rounded-xl text-xs select-none">Português / Inglês</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Alertas Desejados</label>
                          <select 
                            value={profileForm.preference}
                            onChange={(e) => setProfileForm({...profileForm, preference: e.target.value})}
                            className="w-full px-3 py-1.5 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-800 text-xs text-neutral-400 dark:text-cream-100 rounded-xl focus:outline-none"
                          >
                            <option>SMS & E-mail Automático</option>
                            <option>Somente E-mail</option>
                            <option>Notificações Internas LMS</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-ink-800 flex justify-end">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-gold-600 text-cream-100 hover:bg-[#b08530] text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer border-0"
                        >
                          Guardar Coordenadas
                        </button>
                      </div>
                    </form>

                  </div>
                </div>
              )}

              {/* 10. ACCESSIBILITY ADJUST PANEL */}
              {activeTab === 'settings' && (
                <div className="space-y-6 text-left">
                  <div className={`p-6 rounded-3xl space-y-6 ${cardThemeClass}`}>
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Sistema Integrado MPA</span>
                      <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Acessibilidade & Visibilidade</h3>
                      <p className="text-xs text-neutral-400 mt-1">Personalize as métricas de contraste e o visual geral do Portal LMS para melhor conforto no Huambo.</p>
                    </div>

                    <div className="space-y-4 divide-y divide-gray-100 dark:divide-slate-800">
                      
                      {/* Theme colors toggler */}
                      <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-xs font-serif font-black text-ink-900 dark:text-cream-100 m-0">Esquema de Cores do Painel</h4>
                          <p className="text-[10px] text-neutral-400 m-0">Alternar entre telas claras e escuras anti-fadiga ocular.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setThemeMode('light'); setIsHighContrast(false); }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              themeMode === 'light' && !isHighContrast ? 'bg-ink-900 text-cream-100 border-ink-900' : 'bg-cream-100 text-neutral-400 hover:bg-cream-200'
                            }`}
                          >
                            Light Mode
                          </button>
                          <button
                            onClick={() => { setThemeMode('dark'); setIsHighContrast(false); }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              themeMode === 'dark' && !isHighContrast ? 'bg-slate-800 text-cream-100 border-slate-800' : 'bg-cream-100 text-neutral-400 hover:bg-cream-200'
                            }`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>

                      {/* High Contrast Option */}
                      <div className="pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-xs font-serif font-black text-danger-700 dark:text-danger-700 m-0">Ecrã de Alto Contraste</h4>
                          <p className="text-[10px] text-neutral-400 m-0">Cores puras pretas e amarelas otimizadas para leitores de tela e deficiências visuais.</p>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setIsHighContrast(!isHighContrast);
                            }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              isHighContrast ? 'bg-yellow-500 text-black border-yellow-500 font-extrabold' : 'bg-cream-100 text-neutral-400 hover:bg-cream-200'
                            }`}
                          >
                            {isHighContrast ? 'Ativado ✓' : 'Ativar Contraste'}
                          </button>
                        </div>
                      </div>

                      {/* Local limits warning */}
                      <div className="pt-4 p-3 bg-cream-200 dark:bg-slate-800 text-[10px] text-neutral-400 leading-normal rounded-xl">
                        <p className="m-0 select-none">
                          ℹ️ <strong>Métricas de Acessibilidade:</strong> A nossa plataforma respeita integralmente os critérios internacionais WCAG 2.1 e dispõe de suportes para transposição de texto em áudios síncronos na moderação linguística.
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* 1.16 - CONFIRMATION MODAL FOR LESSON COMPLETION */}
      <AnimatePresence>
        {isCompleteModalOpen && currentLecture && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompleteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="relative w-full max-w-md bg-white dark:bg-ink-950 rounded-3xl overflow-hidden shadow-2xl border border-gold-600/30 p-6 space-y-6 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gold-600/10 text-gold-600 rounded-xl border border-gold-600/20">
                  <CheckCircle size={20} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-semibold">Progresso Académico</span>
                  <h3 className="text-sm font-serif font-black text-slate-900 dark:text-cream-100 m-0">Confirmar Conclusão de Aula</h3>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-650 dark:text-gray-300 leading-relaxed m-0 font-medium">
                  Tem a certeza que deseja marcar a aula <strong>{currentLecture.title}</strong> como concluída?
                </p>
                <p className="text-[10px] text-neutral-405 leading-relaxed m-0">
                  Ao confirmar, esta aula será catalogada como concluída no seu histórico escolar do Supabase, contando positivamente para a emissão do seu certificado final.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 font-mono text-3xs font-extrabold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (currentUser?.id && selectedCourseId && currentLecture.id) {
                      try {
                        await academicService.markLessonComplete(currentUser.id, selectedCourseId, currentLecture.id, true);
                        await fetchStudentData();
                      } catch (err) {
                        console.error('Erro ao marcar aula concluída:', err);
                      } finally {
                        setIsCompleteModalOpen(false);
                      }
                    }
                  }}
                  className="flex-1 py-3 bg-gold-600 hover:bg-[#b58b35] text-cream-100 font-mono text-3xs font-extrabold uppercase rounded-xl transition-all cursor-pointer border-0 shadow-sm"
                >
                  Confirmar Conclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
