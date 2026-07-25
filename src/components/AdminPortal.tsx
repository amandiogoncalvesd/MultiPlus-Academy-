import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User, UserRole, Course } from '../types';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';
import ChatShell from './messaging/ChatShell';
import { useTheme } from '../contexts/ThemeContext';
import CourseEditorModal from './course/CourseEditorModal';
import { messageService } from '../services/supabase/messageService';
import CertificateIssueModal from './certificates/CertificateIssueModal';
import AdminShell from './admin/AdminShell';
import AdminSidebar, { AdminTab } from './admin/AdminSidebar';
import AdminTopbar from './admin/AdminTopbar';
import AdminProfilePage from './admin/AdminProfilePage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import NotificationCenter from './admin/NotificationCenter';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminCoursesPage from './admin/AdminCoursesPage';
import AcademicStructurePage from './admin/AcademicStructurePage';
import AdminCertificatesPage from './admin/AdminCertificatesPage';
import AdminAuditLogPage from './admin/AdminAuditLogPage';
import AdminOverview from './admin/AdminOverview';

import { 
  Users, Settings, Activity, TrendingUp, DollarSign, MapPin, ShieldCheck, 
  Trash2, Edit3, Lock, Eye, PhoneCall, RefreshCw, Database, Network, 
  Server, Layers, Globe, BookOpen, ChevronRight, Search, Bell, Mail, 
  Filter, Calendar, FileText, Share2, Plus, Play, Sparkles, Check, 
  CheckCircle2, AlertTriangle, HelpCircle, User as UserIcon, Info, Wifi, 
  PlusCircle, CheckSquare, X, Bookmark, Image, ArrowRight, Shield, Download, 
  FileSpreadsheet, MessageSquare, Megaphone, Terminal, QrCode, FileDown,
  LogOut, Award, Star, Clock, AlertCircle, Menu, Sun, Moon
} from 'lucide-react';

interface AdminPortalProps {
  setCurrentPage: (page: PageId) => void;
}

// Initial audit logs for security
const INITIAL_AUDIT_LOGS: any[] = [];

// Helper to generate a strong yet easy-to-read password (Portuguese words + number + symbol)
function gerarSenhaForte(): string {
  const palavras = [
    'Justica', 'Direito', 'Lei', 'Tribunal', 'Causa', 'Defesa', 'Acordo', 'Norma',
    'Voto', 'Poder', 'Saber', 'Estudo', 'Curso', 'Chave', 'Forte', 'Uniao',
    'Luanda', 'Huambo', 'Angola', 'Elite', 'Foco', 'Mente', 'Valor', 'Etica'
  ];
  const p1 = palavras[Math.floor(Math.random() * palavras.length)];
  const p2 = palavras[Math.floor(Math.random() * palavras.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  const simbolos = ['!', '@', '#', '$', '%', '&', '*'];
  const symb = simbolos[Math.floor(Math.random() * simbolos.length)];
  return `${p1}${p2}${num}${symb}`;
}

export default function AdminPortal({
  setCurrentPage,
}: AdminPortalProps) {
  const { signOut, user: currentUser, updateUser: setCurrentUser } = useAuth();
  const { isDarkMode, toggleTheme, setThemeMode } = useTheme();
  
  // Theme and accessibility states
  const [highContrast, setHighContrast] = useState(false);
  
  // Tabs: 18 unique views required
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Database States
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>(INITIAL_AUDIT_LOGS);
  
  // Modals / Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCertificateIssueModal, setShowCertificateIssueModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('ALUNO');
  const [newUserStatus, setNewUserStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [newUserPhotoFile, setNewUserPhotoFile] = useState<File | null>(null);
  const [newUserPhotoPreview, setNewUserPhotoPreview] = useState<string>('');
  
  // Profile inputs & biography
  const [adminBio, setAdminBio] = useState('');
  const [adminPhone, setAdminPhone] = useState(currentUser?.phone || '');
  const [adminName, setAdminName] = useState('');

  // Preference Settings
  
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
      .channel('admin-unread-count')
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
  const [notifEmailCertificados, setNotifEmailCertificados] = useState(false);
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');

  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ALUNO' | 'PROFESSOR' | 'ADMIN'>('ALL');
  
  // Course form states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('350.000 Kz');
  const [courseStatus, setCourseStatus] = useState<'ATIVO' | 'RASCUNHO' | 'ARQUIVADO'>('ATIVO');

  // Blog states
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  
  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('Online (Meet)');

  // Broadcasting messages
  const [messageTarget, setMessageTarget] = useState('ALL_STUDENTS');
  const [messageContent, setMessageContent] = useState('');
  const [broadcastLog, setBroadcastLog] = useState<string[]>([]);

  // Config parameters
  const [instName, setInstName] = useState('MultiPlus Academy');
  const [instDomain, setInstDomain] = useState('');
  const [instPhone, setInstPhone] = useState('');

  // General Notification center
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Sync profile details when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setAdminName((currentUser as any).nome_completo || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim());
      setAdminPhone(currentUser.phone || (currentUser as any).telefone || '');
    }
  }, [currentUser]);

  // Load shared database
  useEffect(() => {
    loadDatabase();
  }, [activeTab]);

  const loadDatabase = async () => {
    try {
      // 1. Fetch Users
      const { data: uData } = await supabase.from('users').select('*');
      if (uData && uData.length > 0) {
        const mappedUsers = uData.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.nome_completo?.split(' ')[0] || '',
          lastName: u.nome_completo?.split(' ').slice(1).join(' ') || '',
          role: (u.role || 'ALUNO') as UserRole,
          status: u.status || 'ACTIVE',
          phone: u.telefone || '',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: u.foto_perfil || '',
        }));
        setDbUsers(mappedUsers);
      }

      // 2. Fetch Certificates
      const { data: certData } = await supabase
        .from('certificates')
        .select(`
          id,
          codigo_validacao,
          emitido_em,
          final_grade,
          student_id,
          course_id,
          certificate_pdf_url,
          issued_by
        `);
      
      if (certData) {
        // Fetch users and courses for resolving relationships
        const { data: usersList } = await supabase.from('users').select('id, nome_completo');
        const { data: coursesList } = await supabase.from('courses').select('id, title, teacher_id');
        
        const mappedCerts = certData.map((c: any) => {
          const matchedUser = usersList?.find(u => u.id === c.student_id);
          const matchedCourse = coursesList?.find(crs => crs.id === c.course_id);
          const matchedTeacher = usersList?.find(u => u.id === matchedCourse?.teacher_id);
          const matchedIssuer = usersList?.find(u => u.id === c.issued_by);
          return {
            certificateNumber: c.codigo_validacao,
            courseName: matchedCourse?.title || 'English for the Legal Field in Angola',
            recipientName: matchedUser?.nome_completo || 'Aluno MultiPlus',
            completionDate: c.emitido_em ? c.emitido_em.slice(0, 10) : '2026-06-01',
            instructorName: matchedTeacher?.nome_completo || matchedIssuer?.nome_completo || 'Docente MultiPlus',
            finalGrade: c.final_grade || '92/100',
            institution: 'MultiPlus Academy (Angola)',
            isValid: true,
            verificationCode: c.codigo_validacao,
            pdfUrl: c.certificate_pdf_url
          };
        });
        setCertificates(mappedCerts);
      }

      // 3. Fetch courses
      const { data: dbCourses, error: courseErr } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey (
            id,
            nome_completo,
            email
          )
        `)
        .order('created_at', { ascending: false });
      if (!courseErr && dbCourses) {
        setCourses(dbCourses.map((c: any) => ({
          id: c.id,
          slug: c.slug || c.id,
          title: c.title,
          subtitle: c.description || '',
          summary: c.description || '',
          duration: c.duration || '12 Semanas',
          hours: '72 Horas',
          language: 'Inglês / Português',
          modality: c.category === 'Online' ? 'Online' : 'Híbrido',
          schedule: 'Terças e Quintas, 18h30',
          startDate: 'Em breve',
          price: '450.000 Kz',
          targetAudience: [],
          modules: [],
          status: c.status,
          teacher_id: c.teacher_id,
          teacher: c.teacher
        })));
      }

      // 4. Fetch enrollments
      const { data: enrollData } = await supabase.from('enrollments').select('*');
      if (enrollData) {
        setEnrollments(enrollData);
      }

      // 5. Fetch Notifications (real notifications from public.notifications)
      if (currentUser?.id) {
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        if (notifData) {
          setActiveAlerts(notifData.map((n: any) => ({
            id: n.id,
            type: n.read ? 'REVISADO' : 'NOTIFICACAO',
            msg: n.text,
            created_at: n.created_at,
            read: n.read
          })));
        }

        // Fetch biography & preferences for current user
        const { data: profData } = await supabase
          .from('profiles')
          .select('biografia')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (profData) {
          setAdminBio(profData.biografia || '');
        }

        const { data: userData } = await supabase
          .from('users')
          .select('nome_completo, telefone, notif_email_certificados')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (userData) {
          setAdminName(userData.nome_completo || '');
          setAdminPhone(userData.telefone || '');
          setNotifEmailCertificados(!!userData.notif_email_certificados);
        }
      }

      // 6. Fetch institution settings
      try {
        const { data: instData } = await supabase
          .from('institution_settings')
          .select('*')
          .eq('id', 1)
          .single();
        if (instData) {
          setInstName(instData.nome || 'MultiPlus Academy');
          setInstDomain(instData.dominio || '');
          setInstPhone(instData.contacto || '');
        }
      } catch (instErr) {
        console.warn('Erro ao ler a tabela institution_settings:', instErr);
      }
    } catch (err) {
      console.warn('Silent local fallback for loading admin portal:', err);
    }
  };

  const handleClearAlerts = async () => {
    if (!currentUser?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);
      if (error) throw error;
      setActiveAlerts(prev => prev.map(a => ({ ...a, type: 'REVISADO', read: true })));
      alert('Todas as notificações foram marcadas como lidas.');
    } catch (err) {
      console.error('Erro ao limpar alertas:', err);
    }
  };

  // User Management
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    if (!newUserPassword || newUserPassword.length < 8) {
      alert('Defina uma senha de pelo menos 8 caracteres antes de criar a conta.');
      return;
    }

    const split = newUserName.split(' ');
    const first = split[0];
    const last = split.slice(1).join(' ') || 'User';

    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: newUserEmail,
          password: newUserPassword,
          nome_completo: newUserName,
          role: newUserRole
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Erro ao criar usuário');
      }

      const createdAuthUser = data?.data?.user;
      if (!createdAuthUser) {
        throw new Error('Retorno inválido da Edge Function (nenhum user id retornado)');
      }

      let avatarUrlVal = '';

      if (newUserPhotoFile) {
        try {
          const ext = newUserPhotoFile.name.split('.').pop();
          const filePath = `${createdAuthUser.id}/${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, newUserPhotoFile);

          if (uploadError) {
            console.error('Erro ao fazer upload da foto:', uploadError);
          } else {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatarUrlVal = urlData.publicUrl;

            // Update in the users table
            const { error: updateErr } = await supabase
              .from('users')
              .update({ foto_perfil: avatarUrlVal })
              .eq('id', createdAuthUser.id);

            if (updateErr) {
              console.error('Erro ao associar foto de perfil no utilizador:', updateErr);
            }
          }
        } catch (uploadErr) {
          console.warn('Falha silenciosa ao processar upload de foto:', uploadErr);
        }
      }

      const newUser: User = {
        id: createdAuthUser.id,
        email: newUserEmail,
        firstName: first,
        lastName: last,
        role: newUserRole,
        status: newUserStatus,
        avatarUrl: avatarUrlVal || '',
        phone: '', // Deixar vazio por padrão
        streak: 0,
        longestStreak: 0,
        totalHoursLearned: 0
      };

      const updated = [...dbUsers, newUser];
      setDbUsers(updated);
      addAuditLog("CRIAÇÃO UTILIZADOR", `Nova conta criada via Edge Function: ${newUserEmail} (${newUserRole})`);
      
      // Save created credentials so the admin can copy them
      setCreatedCredentials({
        email: newUserEmail,
        pass: newUserPassword
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhotoFile(null);
      setNewUserPhotoPreview('');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar no Supabase via Edge Function: ${err.message || err}`);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const targetUser = dbUsers.find(u => u.id === userId);
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', userId);

      if (error) throw error;

      const updated = dbUsers.map(u => {
        if (u.id === userId) {
          addAuditLog("STATUS UTILIZADOR", `ID ${userId} mudou para ${nextStatus}`);
          return { ...u, status: nextStatus as 'ACTIVE' | 'SUSPENDED' };
        }
        return u;
      });
      setDbUsers(updated);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao reajustar estado: ${err.message || err}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Deseja realmente remover permanentemente este registo do Supabase?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'delete',
          id: userId
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Erro ao remover usuário');
      }

      const updated = dbUsers.filter(u => u.id !== userId);
      setDbUsers(updated);
      addAuditLog("REMOCÃO UTILIZADOR", `Removida conta ID: ${userId}`);
      alert('Utilizador removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao remover utilizador: ${err.message || err}`);
    }
  };

  // Profile impersonation to switch roles
  const handleImpersonate = (user: User) => {
    setCurrentUser(user);
    addAuditLog("PRE-VISUALIZAÇÃO DE PORTAL", `${currentUser?.firstName || 'Administrador'} simulou perfil: ${user.firstName} (${user.role})`);
    if (user.role === 'ALUNO') setCurrentPage('student-dashboard');
    else if (user.role === 'PROFESSOR') setCurrentPage('instructor-dashboard');
    else setCurrentPage('admin-dashboard');
    alert(`Modo de pré-visualização activo para: ${user.firstName} ${user.lastName}`);
  };

  // Secure audits
  const addAuditLog = (action: string, details: string) => {
    const freshLog = {
      id: Date.now(),
      action,
      user: currentUser?.email || "sistema",
      stamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details,
      type: action.includes("FINANCE") ? 'financial' : action.includes("UTILIZADOR") ? 'security' : 'system'
    };
    setAuditLogs(prev => [freshLog, ...prev]);
  };

  // Reporting simulators
  const generateReport = (format: 'PDF' | 'Excel' | 'CSV') => {
    addAuditLog("EXPORTAÇÃO RELATÓRIO", `Gerou planilha académica de estatística em ${format}`);
    alert(`Relatório em lote compilado com sucesso! O descarregamento do arquivo .${format.toLowerCase()} foi indexado na fila.`);
  };

  // Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    setBroadcastLog(prev => [
      `[${new Date().toLocaleTimeString()}] Canal (${messageTarget}): "${messageContent}" despachado via gateway MultiPlus.`,
      ...prev
    ]);
    addAuditLog("ENVIO COMUNICAÇÃO", `Disparo de mensagem de marketing/aviso para: ${messageTarget}`);
    setMessageContent('');
    alert('Mensagem enviada com sucesso para toda a árvore de utilizadores correspondente!');
  };

  // Filtered lists
  const filteredStudents = dbUsers.filter(u => u.role === 'ALUNO').filter(u => 
    globalSearch ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(globalSearch.toLowerCase()) : true
  );

  const filteredInstructors = dbUsers.filter(u => u.role === 'PROFESSOR').filter(u => 
    globalSearch ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(globalSearch.toLowerCase()) : true
  );

  // Popular courses calculated dynamically from real enrollments and courses arrays
  const getPopularCourses = () => {
    const counts: Record<string, number> = {};
    enrollments.forEach((enr: any) => {
      const cid = enr.course_id || enr.courseId;
      if (cid) {
        counts[cid] = (counts[cid] || 0) + 1;
      }
    });

    const sorted = [...courses].map(c => {
      const count = counts[c.id] || 0;
      return {
        ...c,
        enrollmentCount: count
      };
    }).sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    return sorted.slice(0, 5);
  };

  const popularCoursesList = getPopularCourses();

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
    <AdminShell
      isDarkMode={isDarkMode}
      highContrast={highContrast}
      sidebar={<AdminSidebar
        activeTab={activeTab as AdminTab}
        isOpen={mobileSidebarOpen}
        user={currentUser}
        onClose={() => setMobileSidebarOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onMessages={() => setCurrentPage('messages')}
        onSignOut={async () => {
          await signOut().catch(() => undefined);
          setCurrentUser(null);
          setCurrentPage('login');
        }}
      />}
      topbar={<AdminTopbar
        activeTab={activeTab as AdminTab}
        user={currentUser}
        isDarkMode={isDarkMode}
        unreadMessages={unreadMessagesCount}
        unreadNotifications={activeAlerts.filter((alert) => !alert.read).length}
        search={globalSearch}
        onSearchChange={setGlobalSearch}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onToggleTheme={toggleTheme}
        onMessages={() => setCurrentPage('messages')}
        onNotifications={() => setActiveTab('notificacoes')}
        onProfile={() => setActiveTab('perfil')}
        onSettings={() => setActiveTab('configuracoes')}
        onSignOut={async () => {
          await signOut().catch(() => undefined);
          setCurrentUser(null);
          setCurrentPage('login');
        }}
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
          
          {activeTab === 'dashboard' && (
            <div className="relative overflow-hidden rounded-2xl border border-gold-600/30 bg-ink-900 p-5 text-cream-100 shadow-sm sm:p-6">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gold-600/5" />
              <div className="relative space-y-1">
                <span className="block font-mono text-[10px] font-black uppercase tracking-widest text-gold-600">Centro de controlo</span>
                <h2 className="m-0 font-serif text-xl font-black tracking-wide text-cream-100">Operação institucional da MultiPlus Academy</h2>
                <p className="max-w-2xl text-xs text-cream-100/70">Acompanhe pessoas, cursos, credenciais e saúde operacional sem perder o contexto acadêmico.</p>
              </div>
            </div>
          )}
          
          {/* VIEW 1: EXECUTIVE DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <AdminOverview users={dbUsers} courses={courses} enrollments={enrollments} certificates={certificates} onNavigate={setActiveTab} />
          )}

            {activeTab === 'utilizadores' && (
              <AdminUsersPage users={dbUsers} onRefresh={loadDatabase} />
            )}

            {activeTab === 'cursos' && (
              <AdminCoursesPage courses={courses} onRefresh={loadDatabase} />
            )}

            {activeTab === 'estrutura' && (
              <AcademicStructurePage courses={courses} users={dbUsers} />
            )}

            {activeTab === 'certificados' && (
              <AdminCertificatesPage certificates={certificates} onRefresh={loadDatabase} />
            )}

            {activeTab === 'mensagens' && (
              <div className="space-y-4">
                <div className={`p-8 rounded-3xl ${cardThemeClass} text-center space-y-6 flex flex-col items-center justify-center`}>
                  <MessageSquare className="w-16 h-16 text-gold-600 animate-pulse" />
                  <div>
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg">Central de Mensagens Independente</h3>
                    <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
                      As suas mensagens agora abrem num ecrã inteiro próprio, oferecendo mais espaço e evitando cortes visuais de cabeçalho.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentPage('messages')}
                    className="px-6 py-3 bg-gold-600 hover:bg-[#b58b35] text-cream-100 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-md border-0"
                  >
                    Abrir Chat em Tela Cheia
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 13: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <NotificationCenter notifications={activeAlerts} onNotificationsChange={setActiveAlerts} />
            )}

            {activeTab === 'auditoria' && <AdminAuditLogPage />}

            {/* VIEW 16: INTEGRAÇÕES */}
            {activeTab === 'integracoes' && (
              <div className={`p-6 rounded-3xl space-y-6 ${cardThemeClass}`}>
                <div>
                  <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Gateway de Ligações de API</h3>
                  <p className="text-xs text-neutral-400 mt-1">Relação e status de serviços Cloud externos integrados para automatizar a vida académica da MultiPlus (Painel de Monitorização).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "Supabase", desc: "Autenticação e Base de Dados", status: "Conectado" },
                    { name: "Vercel", desc: "Hospedagem e Deployment CDN", status: "Conectado" },
                    { name: "Cloudinary", desc: "Gestão e Otimização de Media", status: "Conectado" }
                  ].map((service) => (
                    <div key={service.name} className="p-4 bg-cream-200 dark:bg-ink-900/60 border border-gray-150 dark:border-ink-800 rounded-2xl flex justify-between items-center text-left">
                      <div>
                        <h4 className="font-serif font-bold text-ink-900 dark:text-cream-100 text-xs m-0">{service.name} Integration</h4>
                        <span className="text-[9px] font-mono text-gray-450 block mt-1">
                          {service.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        {service.status}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {activeTab === 'configuracoes' && (
              <AdminSettingsPage isDarkMode={isDarkMode} onThemeMode={setThemeMode} />
            )}

            {activeTab === 'perfil' && (
              <AdminProfilePage user={currentUser} onUserUpdated={setCurrentUser} />
            )}

            </motion.div>
          </AnimatePresence>
    </AdminShell>
  );
}
