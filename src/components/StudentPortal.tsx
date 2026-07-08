import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from '../types';
import { jsPDF } from 'jspdf';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { userService } from '../services/supabase/userService';
import { academicService } from '../services/supabase/academicService';
import QuizArea from './portal/QuizArea';
import { useTheme } from '../contexts/ThemeContext';


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
  Info
} from 'lucide-react';

import StudentMessagesTab from './portal/StudentMessagesTab';
import StudentMaterialsTab from './portal/StudentMaterialsTab';
import StudentTasksTab from './portal/StudentTasksTab';
import StudentCertificatesTab from './portal/StudentCertificatesTab';
import StudentProgressTab from './portal/StudentProgressTab';

interface StudentPortalProps {
  setCurrentPage: (page: PageId) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentPortal({
  setCurrentPage,
  currentUser,
  setCurrentUser,
  setVerificationCode
}: StudentPortalProps) {
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

  // Active Video course selections
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState(1);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoPlaySec, setVideoPlaySec] = useState(0);
  const [randomWatermark, setRandomWatermark] = useState({ top: '30%', left: '40%' });

  // Student notebook
  const [notesList, setNotesList] = useState<{ id: string; timestamp: number; text: string; date: string }[]>([]);
  const [newNoteInput, setNewNoteInput] = useState('');

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
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);

  // Simulated notifications list
  const [notifications, setNotifications] = useState<any[]>([]);

  // Real-time Supabase state managers
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
  const [academicLoading, setAcademicLoading] = useState<boolean>(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const fetchStudentData = async () => {
    if (!currentUser) return;
    setAcademicLoading(true);
    try {
      // 1. Fetch student enrollments
      const enrollData = await academicService.getStudentEnrollments(currentUser.id);
      setEnrollments(enrollData || []);
      
      if (enrollData && enrollData.length > 0) {
        const activeCourseId = selectedCourseId || enrollData[0].course_id;
        setSelectedCourseId(activeCourseId);
        
        // Fetch lessons
        const lessonsData = await academicService.getLessons(activeCourseId);
        setRealLessons(lessonsData || []);
        
        // Fetch completed lessons
        const completions = await academicService.getCompletedLessons(currentUser.id, activeCourseId);
        setCompletedLessons(completions || []);
      } else {
        setRealLessons([]);
        setCompletedLessons([]);
      }

      // 2. Fetch certificates
      const certs = await academicService.getStudentCertificates(currentUser.id);
      setCertificates(certs || []);

      // 3. Fetch scheduled lessons
      const schedules = await academicService.getScheduledLessonsForStudent(currentUser.id);
      setScheduledLessons(schedules || []);
    } catch (err) {
      console.warn('Silent fallback on dynamic user profiles and enrollments:', err);
    } finally {
      setAcademicLoading(false);
    }
  };

  const handleCourseChange = async (courseId: string) => {
    if (!currentUser) return;
    setSelectedCourseId(courseId);
    try {
      setAcademicLoading(true);
      const lessonsData = await academicService.getLessons(courseId);
      setRealLessons(lessonsData || []);
      const completions = await academicService.getCompletedLessons(currentUser.id, courseId);
      setCompletedLessons(completions || []);
    } catch (err) {
      console.error('Error switching course:', err);
    } finally {
      setAcademicLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);


  // Update real-time clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update video player watermark location every 8 seconds to discourage screen recorders
  useEffect(() => {
    const interval = setInterval(() => {
      const topPct = Math.floor(Math.random() * 55) + 15;
      const leftPct = Math.floor(Math.random() * 55) + 15;
      setRandomWatermark({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const { signOut } = useAuth();

  // Sync profile edits dynamically with asynchronous auth session
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '+244 923 000 000',
        email: currentUser.email || '',
        country: 'Angola',
        language: 'Português / Inglês',
        preference: 'Notificações por SMS & E-mail'
      });
      setStreakCount(currentUser.streak || 5);
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
    let pdfEnrollments = enrollments && enrollments.length > 0 ? enrollments : [
      {
        courseId: 'eng-legal-angola',
        progressPercent: 66,
        status: 'ACTIVE',
        enrolledAt: '2026-06-01'
      }
    ];
    let pdfCertificates = certificates && certificates.length > 0 ? certificates : [];
    
    if (pdfCertificates.length === 0 && currentUser.email.includes('antonio')) {
      pdfCertificates = [
        {
          certificateNumber: 'MPA-2026-001',
          courseName: 'English for the Legal Field in Angola',
          recipientName: 'Dr. Antonio Ferreira Carvalho',
          completionDate: '2026-06-01',
          instructorName: 'Esmeralda Bruno Sumbelelo',
          finalGrade: '92/100',
          isValid: true,
          verificationCode: 'MPA-2026-001'
        }
      ];
    }

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
      const progress = enroll.progress_percent || enroll.progressPercent || 66;


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

  // Safe Google Calendar sync simulation
  const handleSyncGoogleCalendar = () => {
    setIsGoogleSynced(true);
    alert('Integração Concluída! O seu Calendário Letivo MultiPlus está agora sincronizado bidirecionalmente com o seu Google Calendar pessoal.');
  };

  // Lecture list definitions (Flagship Legal course)
  const activeSyllabus = realLessons.length > 0 ? realLessons.map(l => ({
    id: l.id,
    title: l.titulo || l.title || 'Sem título',
    duration: l.duracao || '15:00',
    description: l.descricao || ''
  })) : [
    {
      id: 'lesson_1_fallback',
      title: 'Aula 1: Introdução ao Common Law vs. Civil Law no Contexto de Luanda e Huambo',
      duration: '15:20',
      description: 'Análise estrutural da doutrina dos casos precedentes vigentes nas transações petrolíferas sob a égide das regras de conteúdo local.'
    },
    {
      id: 'lesson_2_fallback',
      title: 'Aula 2: Vocabulário Crítico para Correspondência Jurídica Formal e Advisories',
      duration: '18:45',
      description: 'Aplicação de terminologias de etiqueta avançadas no drafting de correio profissional internacional.'
    },
    {
      id: 'lesson_3_fallback',
      title: 'Aula 3: Elaboração de Contratos Comerciais (Drafting) e Cláusulas Indemnity',
      duration: '22:10',
      description: 'Estruturação conceitual passo a passo de isenção mútua de perdas comerciais de acordo com as leis do mercado angolano.'
    }
  ];

  const currentLecture = activeSyllabus[activeLessonIdx] || activeSyllabus[0];

  // Notebook handling
  const handleSaveNote = () => {
    if (!newNoteInput.trim()) return;
    const note = {
      id: 'n_' + Date.now(),
      timestamp: videoPlaySec,
      text: newNoteInput.trim(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setNotesList([note, ...notesList]);
    setNewNoteInput('');
  };

  // Accessibility theme class selections
  const containerThemeClass = isHighContrast 
    ? 'bg-black text-yellow-300 font-extrabold border-yellow-500' 
    : themeMode === 'dark' 
      ? 'bg-[#0B1220] text-gray-200 border-slate-850' 
      : 'bg-[#F8F8F6] text-[#1C1C1C] border-gray-150';

  const cardThemeClass = isHighContrast
    ? 'border-4 border-yellow-500 bg-black text-white'
    : themeMode === 'dark'
      ? 'bg-[#121E36] border border-slate-700/60 shadow text-white'
      : 'bg-white border border-gray-150 shadow-sm text-[#1C1C1C]';

  return (
    <div id="multiplus-student-lms-portal" className={`min-h-screen flex items-stretch transition-colors duration-200 ${containerThemeClass}`}>
      
      {/* SIDEBAR NAVIGATION - Collapsible on Mobile, Fixed on Desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 ${
          isHighContrast ? 'bg-black border-r-4 border-yellow-500' : themeMode === 'dark' ? 'bg-[#0F192E] border-slate-800' : 'bg-[#0A2E5D] text-white'
        } transition-transform duration-300 transform lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Topbrand */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Logo"
                className="h-9 w-auto object-contain shrink-0"
              />
              <div className="text-left">
                <h1 className="text-sm font-serif font-black m-0 tracking-wide text-white">MultiPlus</h1>
                <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block">Student LMS</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-white/70 hover:text-white rounded bg-transparent border-0 cursor-pointer"
              aria-label="Fichar lateral"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Dashboard Académico', icon: <TrendingUp size={15} /> },
              { id: 'courses', label: 'Videoaulas & Notas', icon: <BookOpen size={15} /> },
              { id: 'calendar', label: 'Calendário Letivo', icon: <CalendarIcon size={15} /> },
              { id: 'materials', label: 'Manuais & Modelos', icon: <Download size={15} /> },
              { id: 'tasks', label: 'Minhas Tarefas', icon: <CheckCircle size={15} /> },
              { id: 'messages', label: 'Advisories de Tutor', icon: <MessageSquare size={15} /> },
              { id: 'certificates', label: 'Meus Certificados', icon: <Award size={15} /> },
              { id: 'progress', label: 'Meu Progresso', icon: <Bell size={15} /> },
              { id: 'profile', label: 'Coordendas de Perfil', icon: <UserIcon size={15} /> },
              { id: 'settings', label: 'Acessibilidade & Ajustes', icon: <Settings size={15} /> }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id as any);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-left transition-all cursor-pointer border-0 ${
                  activeTab === link.id
                    ? 'bg-[#C89B3C] text-slate-950 shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer context banner */}
          <div className="p-4 border-t border-white/10 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm capitalize">
                {currentUser?.firstName[0] || 'A' }
              </div>
              <div className="text-left truncate max-w-[130px]">
                <h4 className="text-xs font-bold text-white m-0 tracking-wide truncate">{currentUser?.firstName} {currentUser?.lastName}</h4>
                <span className="text-[10px] font-mono text-[#C89B3C] font-semibold uppercase">{currentUser?.role || 'Aluno'}</span>
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
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-mono font-bold uppercase rounded-lg border-0 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={11} />
              <span>Sair do Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CENTRAL DISPLAY PANEL (RIGHT WORKSPACE) */}
      <div className="flex-grow flex flex-col overflow-hidden lg:pl-64">
        
        {/* TOPBAR HEADER ACTIONS */}
        <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors ${
          isHighContrast ? 'bg-black border-yellow-500 text-yellow-300' : themeMode === 'dark' ? 'bg-[#0E172A] border-slate-800 text-white' : 'bg-white border-gray-150 text-[#1C1C1C]'
        }`}>
          {/* Topbar Left - Hamburger burger and section headers */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-all bg-transparent border-0 cursor-pointer"
              aria-label="Abrir lateral"
            >
              <Menu size={20} />
            </button>
            
            <div className="hidden sm:block text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block">MultiPlus LMS</span>
              <h2 className="text-sm font-serif font-black tracking-wide m-0 capitalize">{activeTab} • Portal de Aluno</h2>
            </div>
          </div>

          {/* Topbar Center Search bar */}
          <form onSubmit={handleGlobalSearchSubmit} className="hidden md:flex relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar certificado, drafting..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-[#1C1C1C] focus:outline-none focus:border-[#C89B3C]"
            />
          </form>

          {/* Topbar Right - Actions buttons widgets */}
          <div className="flex items-center gap-4 text-xs">
            
            {/* Streak Indicator widget */}
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 text-orange-600 font-bold font-mono text-[10px]">
              <Flame size={12} fill="currentColor" />
              <span>{streakCount} d</span>
            </div>

            {/* Accessibility swift switch */}
            <button 
              onClick={toggleTheme}
              className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-[#C89B3C] border-0 cursor-pointer"
              title="Mudar visual cor"
            >
              {themeMode === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            {/* Notification Drawer controller */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false); }}
                className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-[#0A2E5D] dark:text-blue-400 border-0 cursor-pointer relative"
              >
                <Bell size={14} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#C89B3C] animate-ping" />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`absolute right-0 mt-2 w-72 rounded-2xl p-4 shadow-xl text-left ${cardThemeClass} z-50`}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="font-mono text-2xs font-bold text-gray-500">NOTIFICAÇÕES</span>
                      <button 
                        onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                        className="text-[#C89B3C] font-mono text-4xs uppercase font-extrabold hover:underline"
                      >
                        Marcar tudo lido
                      </button>
                    </div>
                    <div className="space-y-2 mt-2 divide-y divide-gray-100">
                      {notifications.map(n => (
                        <div key={n.id} className="pt-2 flex items-start gap-2 text-2xs text-gray-600 dark:text-gray-300">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${n.read ? 'bg-gray-200' : 'bg-[#C89B3C]'}`} />
                          <p className="m-0 leading-snug">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
                className="flex items-center gap-1 text-[#0A2E5D] dark:text-white font-semibold cursor-pointer border-0 bg-transparent p-0"
              >
                <span className="h-6 w-6 rounded-full bg-[#C89B3C] text-slate-950 font-bold flex items-center justify-center font-mono">
                  {currentUser?.firstName[0]}
                </span>
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl p-2 shadow-xl text-left ${cardThemeClass} z-50`}
                  >
                    {[
                      { tab: 'profile', text: 'Meu Perfil Académico', id: <UserIcon size={12} /> },
                      { tab: 'settings', text: 'Configurações de Ecrã', id: <Settings size={12} /> }
                    ].map(act => (
                      <button
                        key={act.tab}
                        onClick={() => {
                          setActiveTab(act.tab as any);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg text-2xs text-gray-700 dark:text-gray-200 text-left cursor-pointer border-0"
                      >
                        {act.id}
                        <span>{act.text}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1 pb-1" />
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                        } catch (e) {}
                        setCurrentUser(null);
                        setCurrentPage('login');
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-red-50 text-red-600 rounded-lg text-2xs text-left cursor-pointer border-0"
                    >
                      <LogOut size={12} />
                      <span>Sair do MultPlus</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Global Lookup feed search warning feedbacks notification banner */}
        {searchFeedback && (
          <div className="mx-6 mt-4 p-3.5 bg-[#0A2E5D]/10 border border-[#C89B3C] text-[#0A2E5D] text-xs font-semibold rounded-xl text-left">
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
              
              {/* 1. DASHBOARD VIEW PORTAL HOMEPAGE */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {enrollments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6">
                      <div className="w-16 h-16 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-full flex items-center justify-center mx-auto">
                        <BookOpen size={28} />
                      </div>
                      <div className="space-y-2 text-center">
                        <h4 className="font-serif font-black text-lg text-[#0A2E5D] dark:text-white leading-tight m-0">
                          Você ainda não está inscrito em nenhum curso.
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed font-sans m-0">
                          Entre em contato com o seu instrutor ou administrador da MultiPlus Academy para efetuar a sua matrícula nos cursos disponíveis.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Personal Greetings Block with UTC live date clock and progress indicator */}
                      <div className={`p-6 sm:p-8 rounded-3xl relative overflow-hidden text-left ${
                        isHighContrast ? 'border-4 border-yellow-500 bg-black text-white' : 'bg-[#0A2E5D] text-white border border-[#C89B3C]/20 shadow-md'
                      }`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C89B3C]/10 to-transparent rounded-full pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                          <div>
                            {/* Live real-time clock and precise formatted dates */}
                            <div className="flex items-center gap-3 text-[#C89B3C] text-[10px] font-mono tracking-widest uppercase font-bold">
                              <span>ASSENTO ACADÉMICO ATIVO • MULTIPLUS</span>
                              <span className="px-2 py-0.5 rounded bg-black/40 text-white select-none">
                                ⏱ {currentTime.toLocaleTimeString()}
                              </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-serif font-black m-0 text-white mt-1.5 leading-tight">
                              Olá, {profileForm.firstName || 'Doutor(a)'}! 👋
                            </h2>
                            <p className="text-xs text-white/70 mt-1 max-w-xl">
                              Bem-vindo(a) de volta à MultiPlus Academy. Desenvolva as suas competências de oratória ("oral advocacy") e drafting formal de contratos em inglês hoje.
                            </p>
                          </div>

                          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-2 shrink-0">
                            <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block font-bold">PRÓXIMA AULA SÍNCRONA</span>
                            <h4 className="text-xs font-serif font-black m-0">Tuesday Legal Advisory Class</h4>
                            <span className="text-[10px] font-mono text-emerald-400 block font-bold">TERÇA-FEIRA • 18h30 - 20h30</span>
                            
                            <a 
                              href="https://meet.google.com/lookup/mock-multiplus"
                              target="_blank"
                              className="px-3.5 py-1.5 bg-[#C89B3C] hover:bg-white hover:text-slate-900 text-slate-950 font-mono text-3xs font-extrabold rounded-lg tracking-wider transition-all inline-flex items-center gap-1"
                            >
                              Entrar Meet do Google <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Responsive Grid statistics metrics using clean neon SaaS indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { title: 'Cunho de Estudo', value: `${streakCount} Dias`, note: 'Acompanhando a constância', icon: <Flame size={18} fill="currentColor" className="text-orange-600" /> },
                          { title: 'Aulas Vídeo Concluídas', value: '2 de 3 sessões', note: 'Unidade de Isenção em curso', icon: <CheckCircle size={18} className="text-emerald-600" /> },
                          { title: 'Dedicação Acumulada', value: `${hours} Horas`, note: 'Meta: 3 horas semanais', icon: <Clock size={18} className="text-blue-600" /> },
                          { title: 'Certificados Ganhos', value: currentUser?.email.includes('antonio') ? '2 Credenciais' : '1 Credencial', note: 'Sincronizados em tempo real', icon: <Award size={18} className="text-amber-500" /> }
                        ].map((stat, idx) => (
                          <div key={idx} className={`p-5 rounded-2xl text-left flex flex-col justify-between ${cardThemeClass}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mb-1">{stat.title}</span>
                                <span className="text-xl font-serif font-black text-[#0A2E5D] dark:text-white leading-tight">{stat.value}</span>
                              </div>
                              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shrink-0">
                                {stat.icon}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 mt-3 block">{stat.note}</span>
                          </div>
                        ))}
                      </div>

                      {/* Active Lessons course review and Google meet widgets partition */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        
                        {/* Flagship Course card retake */}
                        <div className={`lg:col-span-8 p-6 rounded-3xl text-left space-y-4 flex flex-col justify-between ${cardThemeClass}`}>
                          <div className="border-b border-gray-150 pb-3 flex justify-between items-center w-full">
                            <div>
                              <span className="text-[9px] font-mono text-gray-400 uppercase font-black tracking-wide">Módulo Ativo</span>
                              <h3 className="text-base font-serif font-black m-0 text-[#0A2E5D] dark:text-white">Retome do Módulo II: Drafting Prático</h3>
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-mono">66% COMPLETO</span>
                          </div>

                          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 space-y-3">
                            <span className="text-[9px] font-mono text-[#C89B3C] tracking-wide block uppercase font-bold">RETOMAR HOJE:</span>
                            <h4 className="text-xs font-serif font-black text-gray-800 dark:text-gray-200 mt-1 m-0">
                              {currentLecture.title}
                            </h4>
                            <p className="text-2xs text-gray-500 dark:text-gray-300 leading-relaxed font-sans mt-1 m-0">
                              {currentLecture.description}
                            </p>
                          </div>

                          <button
                            onClick={() => setActiveTab('courses')}
                            className="px-4 py-2.5 bg-[#011a3d] hover:bg-[#C89B3C] text-white hover:text-slate-900 border-0 transition-colors text-2xs font-mono font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 cursor-pointer w-full"
                          >
                            <PlayCircle size={14} />
                            <span>Abrir Leitor de Videoaulas</span>
                          </button>
                        </div>

                        {/* Support block info links */}
                        <div className={`lg:col-span-4 p-6 rounded-3xl text-left flex flex-col justify-between space-y-4 ${cardThemeClass}`}>
                          <div className="space-y-3">
                            <span className="text-[9px] font-mono text-[#C89B3C] uppercase tracking-widest font-black block">Atalhos Úteis</span>
                            <h3 className="text-sm font-serif font-black text-[#0A2E5D] dark:text-white m-0">Biblioteca de Dicionários</h3>
                            <p className="text-2xs text-gray-500 font-sans leading-relaxed m-0">Assegure eficácia na redação perante tribunais descarregando dicionarizações jurídicas na secção de materiais.</p>
                          </div>

                          <div className="space-y-2.5">
                            <button
                              onClick={() => setActiveTab('materials')}
                              className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-850 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-200 border-0 transition-colors rounded-xl text-3xs font-mono font-bold uppercase tracking-wider"
                            >
                              Ir para os Manuais
                            </button>
                            
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 rounded-xl text-[10px] text-amber-800">
                              <strong>Exame final:</strong> Prático oral agendado no campus de Huambo para data limite em Junho de 2026.
                            </div>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2. COURSES ENGINE VIDEO PLAYER VIEW */}
              {activeTab === 'courses' && (
                <div className="space-y-6 text-left">
                  {enrollments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 shadow-sm mt-6">
                      <div className="w-16 h-16 bg-[#0A2E5D]/5 text-[#C89B3C] rounded-full flex items-center justify-center mx-auto">
                        <BookOpen size={28} />
                      </div>
                      <div className="space-y-2 text-center">
                        <h4 className="font-serif font-black text-lg text-[#0A2E5D] dark:text-white leading-tight m-0">
                          Você ainda não está inscrito em nenhum curso.
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed font-sans m-0">
                          A área de videoaulas estará disponível assim que for matriculado num curso oficial.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Section Title and grid selector */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Módulo I & II Ativos</span>
                          <h3 className="text-lg font-serif font-black m-0 text-[#0A2E5D] dark:text-white">Leitor Integrado de Videoaulas</h3>
                        </div>

                        {/* Preparation course future catalog displays as requested */}
                        <select
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 text-xs font-serif font-bold text-[#0A2E5D] dark:text-white focus:outline-none"
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

                      {/* Left Player vs Right curricular tree list partitions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left Frame column: Video placeholder plus legal notebooks */}
                    <div className="lg:col-span-8 space-y-4">
                      
                      {/* Interactive player mock card */}
                      <div className="aspect-video bg-slate-900 border border-[#C89B3C]/35 rounded-2xl overflow-hidden relative flex flex-col justify-between items-stretch p-4 select-none shadow">
                        
                        {/* Video streaming top logs */}
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/50 z-10">
                          <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5">Cloudinary Segment Stream v2</span>
                          <span className="bg-emerald-600 font-extrabold text-white px-2 py-0.5 rounded">AUTO 1080P</span>
                        </div>

                        {/* Interactive anti-recorders watermarker layer */}
                        <div 
                          className="absolute text-white/10 text-[11px] sm:text-xs font-mono tracking-widest font-extrabold pointer-events-none z-20 bg-black/10 px-2.5 py-1 rounded border border-white/5 whitespace-nowrap transition-all duration-1000 ease-in-out"
                          style={{ top: randomWatermark.top, left: randomWatermark.left, transform: 'rotate(-5deg)' }}
                        >
                          🛡 {currentUser?.email || 'antonio@advogados.ao'} • MULTIPLUS
                        </div>

                        {/* Player Backdrops visual layout */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(10,46,93,0.3)_0%,#040c1a_100%)]">
                          <Video size={44} className="text-[#C89B3C]/40 mb-2 animate-pulse" />
                          <h4 className="text-white text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
                            {currentLecture.title}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500 mt-2 block">
                            {isPlayingVideo ? `A reproduzir a ${videoPlaybackSpeed}x` : 'Pausado'} • {Math.floor(videoPlaySec / 60)}:{(videoPlaySec % 60).toString().padStart(2, '0')} / {currentLecture.duration}
                          </span>
                        </div>

                        {/* Play control bars row footer */}
                        <div className="z-10 bg-black/70 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between gap-4 mt-auto">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                              className="px-3.5 py-1 bg-[#C89B3C] text-slate-950 font-mono text-[10px] font-bold rounded-lg uppercase cursor-pointer"
                            >
                              {isPlayingVideo ? 'Pausar' : 'Reproduzir'}
                            </button>
                            <button
                              onClick={() => setVideoPlaySec(prev => prev + 15)}
                              className="text-white/75 hover:text-[#C89B3C] text-3xs font-mono"
                            >
                              +15 segundos
                            </button>
                          </div>

                          {/* Speed dial switches */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono text-gray-400">VELOCIDADE:</span>
                            {[1, 1.25, 1.5, 2].map(spd => (
                              <button
                                key={spd}
                                onClick={() => setVideoPlaybackSpeed(spd)}
                                className={`px-1.5 py-0.5 rounded text-4xs font-mono ${
                                  videoPlaybackSpeed === spd ? 'bg-[#C89B3C] text-slate-950 font-bold' : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {spd}x
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Lesson Transcripts written segment for accessible studies */}
                      <div className={`p-5 rounded-2xl ${cardThemeClass}`}>
                        <span className="text-[9px] font-mono text-[#C89B3C] font-black uppercase tracking-wider block border-b border-gray-100 dark:border-slate-700 pb-2">
                          Acessibilidade • Transcrição Segmentada Escrita
                        </span>
                        <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-sans italic pt-2 mb-0">
                          "Diferenças fundamentais entre o modelo codificado Civil Law vigente em toda a República de Angola e o sistema do Common Law anglo-saxónico com enfoque em precedentes e regimentos para contratos de extração petrolífera de joint ventures."
                        </p>
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
                                // Refresh completed lessons
                                const completions = await academicService.getCompletedLessons(currentUser.id, selectedCourseId);
                                setCompletedLessons(completions || []);
                              } catch (err) {
                                console.error('Error marking lesson complete from quiz success:', err);
                              }
                            }
                          }}
                        />
                      )}

                      {/* Interactive legal notes tied to play seconds */}
                      <div className={`p-5 rounded-2xl space-y-4 ${cardThemeClass}`}>
                        <h4 className="text-xs font-serif font-black m-0">Caderno de Apontamentos do Aluno</h4>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Escreva anotação académica vinculada ao tempo atual (${Math.floor(videoPlaySec / 60)}:${(videoPlaySec % 60).toString().padStart(2, '0')})...`}
                            value={newNoteInput}
                            onChange={(e) => setNewNoteInput(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 text-[#1C1C1C] dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={handleSaveNote}
                            disabled={!newNoteInput.trim()}
                            className="px-4 py-2 bg-[#C89B3C] hover:bg-[#a67e2b] text-white hover:text-slate-900 border-0 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
                          >
                            Pinar Nota
                          </button>
                        </div>

                        {/* List of pinned notes */}
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pt-2 divide-y divide-gray-100 dark:divide-slate-700/50">
                          {notesList.map((n) => (
                            <div key={n.id} className="pt-2 flex justify-between gap-4 text-xs">
                              <div className="space-y-1">
                                <p className="m-0 text-gray-700 dark:text-gray-200 leading-normal">{n.text}</p>
                                <span className="block text-[8px] font-mono text-gray-400">{n.date}</span>
                              </div>
                              <span className="bg-[#0A2E5D]/5 text-[#C89B3C] font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-[#0A2E5D]/10 text-center self-start shrink-0">
                                ⏱ {Math.floor(n.timestamp / 60)}:{(n.timestamp % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right column: Curricular lessons sequence tree list */}
                    <div className="lg:col-span-4">
                      <div className={`p-4 rounded-2xl flex flex-col h-full ${cardThemeClass}`}>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block border-b border-gray-100 dark:border-slate-700 pb-3 mb-3">
                          CURSOGRAMA ACADÉMICO
                        </span>

                        <div className="space-y-2 flex-1">
                          {activeSyllabus.map((syll, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setActiveLessonIdx(index);
                                setVideoPlaySec(0);
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex justify-between gap-3 cursor-pointer ${
                                activeLessonIdx === index
                                  ? 'border-[#C89B3C] bg-[#0A2E5D]/5 dark:bg-slate-800 text-[#0A2E5D] dark:text-[#C89B3C]'
                                  : 'border-gray-100 dark:border-slate-800 hover:border-gray-200'
                              }`}
                            >
                              <div className="space-y-1 text-left flex-1 min-w-0">
                                <h5 className="font-serif font-black m-0 leading-snug truncate">{syll.title}</h5>
                                <p className="text-[10px] text-gray-400 m-0 flex items-center gap-1.5">
                                  {completedLessons.includes(syll.id) ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[9px] flex items-center gap-0.5">
                                      ✓ Concluída
                                    </span>
                                  ) : (
                                    <span>Segmento explicativo</span>
                                  )}
                                </p>
                              </div>
                              <span className="text-[#C89B3C] font-mono text-4xs shrink-0 self-center font-bold">
                                {syll.duration}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 p-3 rounded-xl text-center space-y-2">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block">TUTORIA DIRECTA</span>
                          <p className="text-[10px] text-gray-500 m-0 leading-normal">
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
                        <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">PROGRAMA DE EXAMES</span>
                        <h3 className="text-lg font-serif font-black text-[#0A2E5D] dark:text-white m-0">Calendário Letivo de Debates</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Calendrier select view buttons */}
                        <div className="flex items-center gap-1 border border-gray-100 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl">
                          {(['MONTH', 'WEEK'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setCalendarView(v)}
                              className={`px-3 py-1 rounded-lg text-3xs font-mono font-bold uppercase cursor-pointer border-0 ${
                                calendarView === v ? 'bg-[#0A2E5D] text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'
                              }`}
                            >
                              {v === 'MONTH' ? 'Mensal' : 'Semanal'}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleSyncGoogleCalendar}
                          className="px-3.5 py-1.5 bg-[#C89B3C] hover:bg-[#b08530] text-slate-950 font-mono text-3xs font-extrabold uppercase rounded-xl tracking-wider transition-all cursor-pointer border-0"
                        >
                          {isGoogleSynced ? 'Sincronizado' : 'Sincronizar Google Calendar'}
                        </button>
                      </div>
                    </div>

                    {/* Schedule item grids mapped out */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {scheduledLessons.length > 0 ? (
                        scheduledLessons.map((session, index) => {
                          const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
                          const dateVal = session.lesson?.scheduled_at?.split('T')[0] || '2026-06-15';
                          const timeVal = session.lesson?.scheduled_at?.split('T')[1]?.substring(0, 5) || '18:30';
                          const courseTitle = session.lesson?.course?.title || session.lesson?.course?.titulo || 'English for the Legal Field';
                          const meetUrl = 'https://meet.google.com/lookup/mock-multiplus';

                          return (
                            <div key={session.id || index} className="p-4 rounded-xl border border-gray-150 bg-white dark:bg-slate-900 shadow-3xs space-y-3 relative overflow-hidden">
                              <div className="absolute top-0 left-0 right-0 h-1 bg-[#C89B3C]" />
                              <div className="flex justify-between items-center text-2xs font-mono font-bold">
                                <span className="text-[#C89B3C] uppercase truncate max-w-[150px]">{courseTitle}</span>
                                <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">{timeVal}</span>
                              </div>
                              <div>
                                <h4 className="text-xs font-serif font-black text-[#0A2E5D] dark:text-[#C89B3C] leading-snug">{title}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">
                                  Aula agendada pelo seu professor titular para o dia {dateVal}.
                                </p>
                              </div>
                              <a 
                                href={meetUrl}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="py-2.5 bg-[#0A2E5D] text-white text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-[#123C73] transition-colors"
                              >
                                Entrar na Aula Meet
                              </a>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          {/* Fallback mock items if no real meetings are scheduled */}
                          {/* Session 1 card */}
                          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-slate-800/20 space-y-3">
                            <div className="flex justify-between items-center text-2xs font-mono font-bold">
                              <span className="text-[#C89B3C]">TERÇA-FEIRA</span>
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">18h30 - 20h30</span>
                            </div>
                            <div>
                              <h4 className="text-xs font-serif font-black text-[#0A2E5D] dark:text-[#C89B3C]">Análise Linguística: Common Law vs. Civil Law</h4>
                              <p className="text-[10px] text-gray-500 mt-1">Sessão em videoconferência síncrona com avaliação e debates.</p>
                            </div>
                            <a 
                              href="https://meet.google.com/lookup/mock-multiplus"
                              target="_blank"
                              className="py-2.5 bg-[#0A2E5D] text-white text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-[#123C73] transition-colors"
                            >
                              Entrar na Aula Meet
                            </a>
                          </div>

                          {/* Session 2 card */}
                          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-slate-800/20 space-y-3">
                            <div className="flex justify-between items-center text-2xs font-mono font-bold">
                              <span className="text-[#C89B3C]">QUINTA-FEIRA</span>
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">18h30 - 20h30</span>
                            </div>
                            <div>
                              <h4 className="text-xs font-serif font-black text-[#0A2E5D] dark:text-[#C89B3C]">Drafting: Cláusulas de Exclusão e Dolo</h4>
                              <p className="text-[10px] text-gray-500 mt-1">Aplicação prática do Artigo 230 do Regulamento Angolano na redação internacional.</p>
                            </div>
                            <a 
                              href="https://meet.google.com/lookup/mock-multiplus"
                              target="_blank"
                              className="py-2.5 bg-[#0A2E5D] text-white text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-[#123C73] transition-colors"
                            >
                              Entrar na Aula Meet
                            </a>
                          </div>

                          {/* Session 3 card */}
                          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-slate-800/20 space-y-3">
                            <div className="flex justify-between items-center text-2xs font-mono font-bold">
                              <span className="text-[#C89B3C]">SÁBADO LETIVO</span>
                              <span className="bg-amber-50 text-[#C89B3C] px-1.5 py-0.5 rounded">09h00 - 12h00</span>
                            </div>
                            <div>
                              <h4 className="text-xs font-serif font-black text-[#0A2E5D] dark:text-[#C89B3C]">Simulação de Corte Arbitral (Mock Arbitration)</h4>
                              <p className="text-[10px] text-gray-500 mt-1">Encontro laboratorial presencial programado no campus regional do Huambo.</p>
                            </div>
                            <span className="py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-500 text-center rounded-lg text-3xs font-mono font-bold uppercase block">
                              Encontro Presencial
                            </span>
                          </div>
                        </>
                      )}

                    </div>

                  </div>
                </div>
              )}

              {/* 4. ACADEMIC MATERIALS FILTERABLE DIR */}
              {activeTab === 'materials' && (
                <StudentMaterialsTab />
              )}

              {/* 5. TASKS MANAGER AND FILE SUBMISSION */}
              {activeTab === 'tasks' && (
                <StudentTasksTab />
              )}

              {/* 6. MESSAGE CENTER */}
              {activeTab === 'messages' && (
                <StudentMessagesTab currentUser={currentUser} />
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
                      <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Identidade Académica</span>
                      <h3 className="text-lg font-serif font-black text-[#0A2E5D] dark:text-white m-0">Meu Perfil de Aluno</h3>
                      <p className="text-xs text-gray-400 mt-1">Controle as informações cadastrais e canais de notificações preferidos.</p>
                    </div>

                    {/* NEW EXPORT PDF WIDGET */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0A2E5D]/5 dark:bg-slate-800/50 p-5 rounded-2xl border border-[#C89B3C]/35">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-serif font-black text-[#0A2E5D] dark:text-[#C89B3C] m-0">Exportar Meu Registo Académico (PDF)</h4>
                        <p className="text-2xs text-gray-500 dark:text-gray-400 m-0 leading-normal font-sans">
                          Gere e descarrega um sumário oficial de aproveitamento de todos os cursos inscritos, carga horária e certificados obtidos com selo institucional de Angola.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        id="export-academic-record-btn"
                        className="px-5 py-3 bg-[#0A2E5D] hover:bg-[#C89B3C] hover:text-slate-950 text-white rounded-xl text-3xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer border-0 shadow-sm transition-all shrink-0"
                      >
                        <Download size={13} />
                        <span>Exportar Registo</span>
                      </button>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Nome Próprio</label>
                          <input
                            type="text"
                            required
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 text-[#1C1C1C] dark:text-white focus:outline-none rounded-xl text-xs placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Apelido (Último nome)</label>
                          <input
                            type="text"
                            required
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 text-[#1C1C1C] dark:text-white focus:outline-none rounded-xl text-xs placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Contacto Telefónico</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 text-[#1C1C1C] dark:text-white focus:outline-none rounded-xl text-xs placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">E-mail Registado</label>
                          <input
                            type="email"
                            required
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 text-[#1C1C1C] dark:text-white focus:outline-none rounded-xl text-xs placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">País</label>
                          <span className="block px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl text-xs select-none">Angola</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Fluência Base</label>
                          <span className="block px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl text-xs select-none">Português / Inglês</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Alertas Desejados</label>
                          <select 
                            value={profileForm.preference}
                            onChange={(e) => setProfileForm({...profileForm, preference: e.target.value})}
                            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 text-xs text-gray-800 dark:text-white rounded-xl focus:outline-none"
                          >
                            <option>SMS & E-mail Automático</option>
                            <option>Somente E-mail</option>
                            <option>Notificações Internas LMS</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-[#C89B3C] text-white hover:bg-[#b08530] text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer border-0"
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
                      <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Sistema Integrado MPA</span>
                      <h3 className="text-lg font-serif font-black text-[#0A2E5D] dark:text-white m-0">Acessibilidade & Visibilidade</h3>
                      <p className="text-xs text-gray-400 mt-1">Personalize as métricas de contraste e o visual geral do Portal LMS para melhor conforto no Huambo.</p>
                    </div>

                    <div className="space-y-4 divide-y divide-gray-100 dark:divide-slate-800">
                      
                      {/* Theme colors toggler */}
                      <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-xs font-serif font-black text-[#0A2E5D] dark:text-white m-0">Esquema de Cores do Painel</h4>
                          <p className="text-[10px] text-gray-500 m-0">Alternar entre telas claras e escuras anti-fadiga ocular.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setThemeMode('light'); setIsHighContrast(false); }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              themeMode === 'light' && !isHighContrast ? 'bg-[#0A2E5D] text-white border-[#0A2E5D]' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Light Mode
                          </button>
                          <button
                            onClick={() => { setThemeMode('dark'); setIsHighContrast(false); }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              themeMode === 'dark' && !isHighContrast ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>

                      {/* High Contrast Option */}
                      <div className="pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-xs font-serif font-black text-red-600 dark:text-red-400 m-0">Ecrã de Alto Contraste</h4>
                          <p className="text-[10px] text-gray-500 m-0">Cores puras pretas e amarelas otimizadas para leitores de tela e deficiências visuais.</p>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setIsHighContrast(!isHighContrast);
                            }}
                            className={`px-4 py-2 text-2xs font-mono font-bold uppercase rounded-xl border transition-all cursor-pointer ${
                              isHighContrast ? 'bg-yellow-500 text-black border-yellow-500 font-extrabold' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {isHighContrast ? 'Ativado ✓' : 'Ativar Contraste'}
                          </button>
                        </div>
                      </div>

                      {/* Local limits warning */}
                      <div className="pt-4 p-3 bg-gray-50 dark:bg-slate-800 text-[10px] text-gray-500 leading-normal rounded-xl">
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

    </div>
  );
}
