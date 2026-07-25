import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from '../types';
import { jsPDF } from 'jspdf';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { userService } from '../services/supabase/userService';
import { academicService } from '../services/supabase/academicService';
import { InstitutionalCalendarEvent, institutionalService } from '../services/supabase/institutionalService';
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
import { getLessonAvailability, isLessonActive } from '../lib/academic/lessonAccess';


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
import StudentLessonsPage from './portal/StudentLessonsPage';
import StudentCalendarPage from './portal/StudentCalendarPage';
import StudentProfilePage from './portal/StudentProfilePage';
import StudentNotificationCenter from './portal/StudentNotificationCenter';
import StudentAcademicSpace from './portal/StudentAcademicSpace';
import StudentShell from './portal/StudentShell';
import { useToast } from './ui/Toast';
import ConfirmDialog from './admin/ConfirmDialog';

interface StudentPortalProps {
  setCurrentPage: (page: PageId) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentPortal({
  setCurrentPage,
  setVerificationCode
}: StudentPortalProps) {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
  const toast = useToast();
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'calendar' | 'materials' | 'tasks' | 'academic' | 'messages' | 'certificates' | 'progress' | 'notifications' | 'profile' | 'settings'>('dashboard');
  
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
  const courseSyllabus = realLessons.length > 0 ? realLessons.map(l => ({
    id: l.id,
    title: l.titulo || l.title || 'Sem título',
    duration: l.duracao || '15:00',
    description: l.descricao || l.description || '',
    scheduled_at: l.scheduled_at,
    access_starts_at: l.access_starts_at || l.scheduled_at,
    access_ends_at: l.access_ends_at,
    video_url: l.video_url
  })) : [];

  // “Minhas aulas” deliberately contains only the lessons whose access
  // window is open. Future and ended lessons stay in the calendar timeline.
  const activeSyllabus = courseSyllabus.filter(lesson => isLessonActive(lesson));
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
  const [institutionalEvents, setInstitutionalEvents] = useState<InstitutionalCalendarEvent[]>([]);


  // Update real-time clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { signOut } = useAuth();

  useEffect(() => {
    if (!currentUser?.id) return;
    institutionalService.getCalendarEvents().then(setInstitutionalEvents).catch((error) => {
      console.warn('Não foi possível carregar o calendário institucional:', error);
    });
  }, [currentUser?.id]);

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
      toast.success('Perfil acadêmico sincronizado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil no Supabase:', err);
      toast.error(`Falha ao sincronizar perfil: ${err.message || 'Erro desconhecido'}`);
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
      session => session.lesson?.access_starts_at || session.lesson?.scheduled_at
    );

    if (lessonsWithDate.length === 0) {
      toast.info('Nenhuma aula agendada encontrada para exportação.');
      return;
    }

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MultiPlus Academy//NONSGML Calendar//PT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';

    lessonsWithDate.forEach((session, idx) => {
      const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
      const description = session.lesson?.descricao || 'Sessão em videoconferência síncrona com avaliação e debates.';
      const rawDate = session.lesson?.access_starts_at || session.lesson?.scheduled_at;
      if (!rawDate) return;
      const courseTitle = session.lesson?.course?.title || session.lesson?.course?.titulo || 'Curso MultiPlus';
      
      const d = new Date(rawDate);
      const startStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const endD = session.lesson?.access_ends_at ? new Date(session.lesson.access_ends_at) : new Date(d.getTime() + 60 * 60 * 1000);
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
        .filter((item) => {
          const startsAt = item.lesson?.access_starts_at || item.lesson?.scheduled_at;
          return startsAt && new Date(startsAt) > new Date();
        })
        .sort((a, b) => new Date(a.lesson!.access_starts_at || a.lesson!.scheduled_at!).getTime() - new Date(b.lesson!.access_starts_at || b.lesson!.scheduled_at!).getTime())[0]?.lesson || null
    : null;
  const selectedCourseTitle = enrollments.find((enrollment: any) => enrollment.course_id === selectedCourseId)?.course?.title;

  return (
    <>
    <StudentShell
      isDark={isDarkMode}
      highContrast={isHighContrast}
      sidebar={<StudentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onSignOut={async () => { await signOut().catch(() => undefined); setCurrentUser(null); setCurrentPage('login'); }}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        isHighContrast={isHighContrast}
        themeMode={themeMode}
      />}
      topbar={<StudentTopbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        onSignOut={async () => { await signOut().catch(() => undefined); setCurrentUser(null); setCurrentPage('login'); }}
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
      />}
    >
      {searchFeedback && <div className="mb-5 rounded-xl border border-[#A16207]/30 bg-[#F5F0E8] px-4 py-3 text-sm text-[#5F3A08] dark:bg-[#A16207]/10 dark:text-[#E8C77C]">{searchFeedback}</div>}
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
                  selectedCourseTitle={selectedCourseTitle}
                  totalHoursLearned={currentUser?.totalHoursLearned || 0}
                  notifications={notifications}
                  setActiveTab={setActiveTab}
                  cardThemeClass={cardThemeClass}
                  isHighContrast={isHighContrast}
                />
              )}

              {/* AULAS DISPONÍVEIS */}
              {activeTab === 'courses' && (
                <StudentLessonsPage
                  user={currentUser}
                  enrollments={enrollments}
                  selectedCourseId={selectedCourseId}
                  lessons={realLessons}
                  completedLessons={completedLessons}
                  onCourseChange={handleCourseChange}
                  onRefresh={fetchStudentData}
                />
              )}

              {/* CALENDÁRIO LETIVO */}
              {activeTab === 'calendar' && (
                <StudentCalendarPage timeline={scheduledLessons} institutionalEvents={institutionalEvents} onExport={handleExportICS} />
              )}

              {/* 4. ACADEMIC MATERIALS FILTERABLE DIR */}
              {activeTab === 'materials' && (
                <StudentMaterialsTab userId={currentUser?.id} />
              )}

              {/* 5. TASKS MANAGER AND FILE SUBMISSION */}
              {activeTab === 'tasks' && (
                <StudentTasksTab userId={currentUser?.id} />
              )}

              {activeTab === 'academic' && currentUser?.id && (
                <StudentAcademicSpace userId={currentUser.id} />
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

              {activeTab === 'notifications' && (
                <StudentNotificationCenter notifications={notifications} setNotifications={setNotifications} setActiveTab={setActiveTab} setCurrentPage={setCurrentPage} />
              )}

              {/* 9. DETAILED PROFILE EDITABLE COORDINATES FORM */}
              {activeTab === 'profile' && (
                <StudentProfilePage user={currentUser} onUpdated={setCurrentUser} />
              )}

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
    </StudentShell>

      <ConfirmDialog
        open={isCompleteModalOpen && Boolean(currentLecture)}
        title="Confirmar conclusão de aula"
        description={currentLecture ? `Deseja marcar “${currentLecture.title}” como concluída? Esta ação entra no seu progresso acadêmico.` : ''}
        confirmLabel="Concluir aula"
        onCancel={() => setIsCompleteModalOpen(false)}
        onConfirm={async () => {
          if (!currentUser?.id || !selectedCourseId || !currentLecture?.id) return;
          try {
            await academicService.markLessonComplete(currentUser.id, selectedCourseId, currentLecture.id, true);
            await fetchStudentData();
            toast.success('Aula marcada como concluída.');
          } catch (error: any) {
            toast.error(error?.message || 'Não foi possível concluir a aula.');
          } finally { setIsCompleteModalOpen(false); }
        }}
      />
    </>
  );
}
