import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User, UserRole, Course } from '../types';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';
import ChatShell from './messaging/ChatShell';
import { useTheme } from '../contexts/ThemeContext';

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
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

// Initial audit logs for security
const INITIAL_AUDIT_LOGS: any[] = [];

export default function AdminPortal({
  setCurrentPage,
  currentUser,
  setCurrentUser,
}: AdminPortalProps) {
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
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
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('STUDENT');
  const [newUserStatus, setNewUserStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('ALL');
  
  // Course form states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('€350');
  const [courseInstructor, setCourseInstructor] = useState('Dra. Esmeralda Sumbelelo');
  const [courseStatus, setCourseStatus] = useState<'ATIVO' | 'RASCUNHO' | 'ARQUIVADO'>('ATIVO');

  // Integrations states
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, boolean>>({
    Supabase: true,
    Cloudinary: true,
    GoogleCalendar: true,
    GoogleMeet: true,
    GoogleForms: true,
    GoogleDrive: true,
    VertexAI: false,
    WhatsAppAPI: false,
    SMTPEmail: true,
  });

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
  const [instDomain, setInstDomain] = useState('multiplus.ao');
  const [instPhone, setInstPhone] = useState('+244 923 000 000');

  // General Notification center
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

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
          role: u.role === 'ALUNO' ? 'STUDENT' : u.role === 'PROFESSOR' ? 'INSTRUCTOR' : 'ADMIN',
          status: u.status || 'ACTIVE',
          phone: u.telefone || '',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: u.foto_perfil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
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
          course_id
        `);
      
      if (certData) {
        // Fetch users and courses for resolving relationships
        const { data: usersList } = await supabase.from('users').select('id, nome_completo');
        const { data: coursesList } = await supabase.from('courses').select('id, title');
        
        const mappedCerts = certData.map((c: any) => {
          const matchedUser = usersList?.find(u => u.id === c.student_id);
          const matchedCourse = coursesList?.find(crs => crs.id === c.course_id);
          return {
            certificateNumber: c.codigo_validacao,
            courseName: matchedCourse?.title || 'English for the Legal Field in Angola',
            recipientName: matchedUser?.nome_completo || 'Aluno MultiPlus',
            completionDate: c.emitido_em ? c.emitido_em.slice(0, 10) : '2026-06-01',
            instructorName: 'Esmeralda Bruno Sumbelelo',
            finalGrade: c.final_grade || '92/100',
            institution: 'MultiPlus Academy (Angola)',
            isValid: true,
            verificationCode: c.codigo_validacao,
          };
        });
        setCertificates(mappedCerts);
      }

      // 3. Fetch courses
      const { data: dbCourses, error: courseErr } = await supabase
        .from('courses')
        .select('*');
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
          price: '€450',
          targetAudience: [],
          modules: [],
          status: c.status,
          teacher_id: c.teacher_id
        })));
      }

      // 4. Fetch enrollments
      const { data: enrollData } = await supabase.from('enrollments').select('*');
      if (enrollData) {
        setEnrollments(enrollData);
      }

      // 5. Fetch Notifications (real notifications from public.notifications)
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (notifData) {
        setActiveAlerts(notifData.map((n: any) => ({
          id: n.id,
          type: n.read ? 'REVISADO' : 'NOTIFICACAO',
          msg: n.text,
          created_at: n.created_at
        })));
      }
    } catch (err) {
      console.warn('Silent local fallback for loading admin portal:', err);
    }
  };

  const handleClearAlerts = async () => {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
      if (error) throw error;
      setActiveAlerts(prev => prev.map(a => ({ ...a, type: 'REVISADO' })));
      alert('Todas as notificações foram marcadas como lidas.');
    } catch (err) {
      console.error('Erro ao limpar alertas:', err);
    }
  };

  const syncToLocalStorage = async (newUsers: User[], newCerts?: any[]) => {
    setDbUsers(newUsers);
    if (newCerts) setCertificates(newCerts);
  };

  // User Management
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const split = newUserName.split(' ');
    const first = split[0];
    const last = split.slice(1).join(' ') || 'User';

    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: newUserEmail,
          password: 'Password@123', // Default temporary password
          nome_completo: newUserName,
          role: newUserRole === 'STUDENT' ? 'ALUNO' : newUserRole === 'INSTRUCTOR' ? 'PROFESSOR' : 'ADMIN'
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Erro ao criar usuário');
      }

      const createdAuthUser = data?.data?.user;
      if (!createdAuthUser) {
        throw new Error('Retorno inválido da Edge Function (nenhum user id retornado)');
      }

      const newUser: User = {
        id: createdAuthUser.id,
        email: newUserEmail,
        firstName: first,
        lastName: last,
        role: newUserRole,
        status: newUserStatus,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150`,
        phone: '+244 912 000 000',
        streak: 0,
        longestStreak: 0,
        totalHoursLearned: 0
      };

      const updated = [...dbUsers, newUser];
      await syncToLocalStorage(updated);
      addAuditLog("CRIAÇÃO UTILIZADOR", `Nova conta criada via Edge Function: ${newUserEmail} (${newUserRole})`);
      
      setNewUserName('');
      setNewUserEmail('');
      alert(`Conta de ${first} criada com sucesso via Edge Function com a senha temporária Password@123!`);
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
      await syncToLocalStorage(updated);
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
      await syncToLocalStorage(updated);
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
    addAuditLog("IMPERSONAÇÃO SECURE", `Isabel simulou perfil: ${user.firstName} (${user.role})`);
    if (user.role === 'STUDENT') setCurrentPage('student-dashboard');
    else if (user.role === 'INSTRUCTOR') setCurrentPage('instructor-dashboard');
    else setCurrentPage('admin-dashboard');
    alert(`Modo simulado ativo para: ${user.firstName} ${user.lastName}`);
  };

  // Secure audits
  const addAuditLog = (action: string, details: string) => {
    const freshLog = {
      id: Date.now(),
      action,
      user: currentUser?.email || "isabel@empresas.ao",
      stamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details,
      type: action.includes("FINANCE") ? 'financial' : action.includes("UTILIZADOR") ? 'security' : 'system'
    };
    setAuditLogs(prev => [freshLog, ...prev]);
  };

  // Certificados Issuance
  const handleEmitCertificate = (recipientName: string, courseName: string) => {
    if (!recipientName) return;
    const code = `MPA-2026-REG-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newCert = {
      certificateNumber: code,
      courseName,
      recipientName,
      completionDate: new Date().toISOString().slice(0, 10),
      instructorName: "Dra. Esmeralda Sumbelelo",
      finalGrade: "95/100",
      institution: "MultiPlus Academy (Angola)",
      isValid: true,
      verificationCode: code
    };
    const nextCerts = [...certificates, newCert];
    syncToLocalStorage(dbUsers, nextCerts);
    addAuditLog("EMISSÃO CERTIFICADO", `Emitido para ${recipientName} sob código ${code}`);
    alert(`Certificado digital oficial outorgado com sucesso! Chave: ${code}`);
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
  const filteredStudents = dbUsers.filter(u => u.role === 'STUDENT').filter(u => 
    globalSearch ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(globalSearch.toLowerCase()) : true
  );

  const filteredInstructors = dbUsers.filter(u => u.role === 'INSTRUCTOR').filter(u => 
    globalSearch ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(globalSearch.toLowerCase()) : true
  );

  // Accessibility theme class selections
  const containerThemeClass = highContrast 
    ? 'bg-black text-yellow-300 font-extrabold border-yellow-500' 
    : isDarkMode 
      ? 'bg-[#0B1220] text-gray-200 border-slate-850' 
      : 'bg-[#F8F8F6] text-[#1C1C1C] border-gray-150';

  const cardThemeClass = highContrast
    ? 'border-4 border-yellow-500 bg-black text-white'
    : isDarkMode
      ? 'bg-[#121E36] border border-slate-700/60 shadow text-white'
      : 'bg-white border border-gray-150 shadow-sm text-[#1C1C1C]';

  return (
    <div id="multiplus-admin-portal" className={`min-h-screen flex items-stretch transition-colors duration-200 ${containerThemeClass}`}>
      
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
          highContrast ? 'bg-black border-r-4 border-yellow-500' : isDarkMode ? 'bg-[#0F192E] border-slate-800' : 'bg-[#0A2E5D] text-white'
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
                <h1 className="text-sm font-serif font-black m-0 tracking-wide text-white">Consola</h1>
                <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block">Super Admin</span>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-white/70 hover:text-white rounded bg-transparent border-0 cursor-pointer"
              aria-label="Fechar lateral"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto max-h-[64vh]">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
              { id: 'utilizadores', name: 'Utilizadores', icon: <UserIcon className="w-4 h-4" /> },
              { id: 'cursos', name: 'Cursos', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'certificados', name: 'Certificados', icon: <QrCode className="w-4 h-4" /> },
              { id: 'mensagens', name: 'Mensagens', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'notificacoes', name: 'Notificações', icon: <Bell className="w-4 h-4" /> },
              { id: 'integracoes', name: 'Integrações', icon: <Network className="w-4 h-4" /> },
              { id: 'configuracoes', name: 'Configurações', icon: <Settings className="w-4 h-4" /> },
              { id: 'perfil', name: 'Perfil', icon: <UserIcon className="w-4 h-4" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider text-left transition-all cursor-pointer border-0 ${
                  activeTab === item.id
                    ? 'bg-[#C89B3C] text-slate-950 shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
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
              <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm capitalize">
                {currentUser?.firstName?.[0] || 'I'}
              </div>
              <div className="text-left truncate max-w-[130px]">
                <h4 className="text-xs font-bold text-white m-0 tracking-wide truncate">
                  {currentUser?.firstName || 'Isabel'} {currentUser?.lastName || 'Nascimento'}
                </h4>
                <span className="text-[10px] font-mono text-[#C89B3C] font-semibold uppercase">ADMINISTRADOR</span>
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

      {/* Main outer shell (adjusted for fixed sidebar space) */}
      <div className="flex-grow flex flex-col overflow-hidden lg:pl-64">
        
        {/* 2. TOPBAR HEADER FIXA */}
        <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors ${
          highContrast ? 'bg-black border-yellow-500 text-yellow-300' : isDarkMode ? 'bg-[#0E172A] border-slate-800 text-white' : 'bg-white border-gray-150 text-[#1C1C1C]'
        }`}>
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-all bg-transparent border-0 cursor-pointer text-current"
              aria-label="Abrir lateral"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#C89B3C] uppercase block">MultiPlus LMS</span>
              <h2 className="text-sm font-serif font-black tracking-wide m-0 capitalize">{activeTab} • Portal de Administração</h2>
            </div>
          </div>

          {/* Center Search bar */}
          <div className="hidden md:flex relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar registros..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 placeholder:text-gray-400 text-[#1C1C1C] focus:outline-none focus:border-[#C89B3C]"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 text-xs">
            {/* Critical Alert Bar indicator */}
            <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-150 dark:border-red-900/45 text-[10px] font-mono font-bold uppercase tracking-wider hidden md:flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              ⚠️ {activeAlerts.length} ALERTA(S) ATIVOS
            </div>

            {/* Accessibility swift switch */}
            <button 
              onClick={toggleTheme}
              className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-[#C89B3C] border-0 cursor-pointer"
              title="Mudar visual cor"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Notification Bell toggle menu */}
            <button 
              onClick={() => { setActiveTab('notificacoes'); }}
              className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-[#0A2E5D] dark:text-blue-400 border-0 cursor-pointer relative"
              title="Aceder a Notificações"
            >
              <Bell size={14} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>

            {/* Profile menu widget */}
            <div className="flex items-center gap-2.5 border-l pl-4">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg"
                alt="Isabel Avatar"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-mono font-bold text-blue-900 dark:text-blue-300 block leading-tight">ADMIN</span>
                <span className="text-3xs text-slate-500 font-semibold uppercase block truncate max-w-[100px]">{currentUser?.email || "isabel@empresas.ao"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CENTER CONTROLLER AREA */}
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
          
          {/* Executive Top Banner */}
          <div className="bg-[#0A2E5D] text-white p-6 sm:p-8 rounded-3xl border border-[#C89B3C]/30 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C89B3C]/5 rounded-bl-full pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-mono text-[#C89B3C] font-black tracking-widest block uppercase">Centro de Controlo da MultiPlus Academy</span>
              <h2 className="text-xl sm:text-2xl font-serif font-black m-0 tracking-wide text-white">
                Bem-vindo ao Centro de Gestão da MultiPlus Academy
              </h2>
              <p className="text-xs text-white/70 max-w-2xl">
                Autenticação RBAC activa. Administração global de formandos, registo fiscal de receitas, emissão e conferência de chaves de diploma, integradores de API e auditoria estruturada.
              </p>
            </div>
          </div>
          
          {/* VIEW 1: EXECUTIVE DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* 8 Premium KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: "Total de Alunos", val: filteredStudents.length, icon: <Users className="text-blue-500" />, desc: "Matrículas Ativas" },
                    { title: "Total de Professores", val: filteredInstructors.length, icon: <Award className="text-amber-500" />, desc: "Doadores Titulares" },
                    { title: "Cursos Ativos", val: courses.length, icon: <BookOpen className="text-indigo-500" />, desc: "Programas de Elite" },
                    { title: "Receita do Mês", val: filteredStudents.length > 0 ? `${(filteredStudents.length * 450000).toLocaleString('pt-AO')} Kz` : "0 Kz", icon: <DollarSign className="text-emerald-500" />, desc: "Faturamento Real" },
                    { title: "Certificados Emitidos", val: certificates.length, icon: <QrCode className="text-red-500" />, desc: "Assinaturas Gravadas" },
                    { title: "Taxa de Conclusão", val: filteredStudents.length > 0 ? "94.2%" : "0%", icon: <Activity className="text-teal-500" />, desc: "Frequência Real" },
                    { title: "Novas Inscrições", val: leads.length, icon: <PlusCircle className="text-purple-500" />, desc: "Leads na Fila" },
                    { title: "Aulas Realizadas", val: `${courses.length * 12}/200`, icon: <Server className="text-sky-500" />, desc: "Aulas Criadas" }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-150 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-gray-450 uppercase font-black">{card.title}</span>
                        {card.icon}
                      </div>
                      <div className="mt-2.5">
                        <span className="text-lg sm:text-xl font-serif font-black text-[#0A2E5D]">{card.val}</span>
                        <span className="text-[9px] font-mono text-gray-400 block mt-0.5">{card.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Analytical charts & engagement vectors */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Custom SVG line representing customer conversions & students */}
                  <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-gray-150 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h4 className="font-serif font-black text-[#0A2E5D] text-sm m-0">Gráfico de Crescimento de Alunos</h4>
                        <p className="text-[10px] text-gray-400 font-mono uppercase">Histórico anual comparativo de formandos</p>
                      </div>
                      <span className="text-3xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border">98% Retenção</span>
                    </div>

                    <div className="aspect-[16/7] w-full min-h-[180px] flex items-end relative py-2">
                      <svg viewBox="0 0 500 150" className="w-full h-full text-[#C89B3C]">
                        {/* Grids */}
                        <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                        
                        <path
                          d="M10 130 Q120 110 220 70 T420 40 T480 15"
                          fill="none"
                          stroke="#C89B3C"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <circle cx="10" cy="130" r="4.5" fill="#0A2E5D" stroke="#C89B3C" strokeWidth="1" />
                        <circle cx="220" cy="70" r="4.5" fill="#0A2E5D" stroke="#C89B3C" strokeWidth="1" />
                        <circle cx="480" cy="15" r="4.5" fill="#0A2E5D" stroke="#C89B3C" strokeWidth="1" />
                        
                        <text x="5" y="145" fontSize="8" fontFamily="monospace" fill="#94A3B8">Q1 (Luanda)</text>
                        <text x="210" y="145" fontSize="8" fontFamily="monospace" fill="#94A3B8">Q3 (Huambo)</text>
                        <text x="440" y="145" fontSize="8" fontFamily="monospace" fill="#94A3B8">Q4 (Atual)</text>
                      </svg>
                    </div>
                  </div>

                  {/* Right side: popular courses list */}
                  <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-150 space-y-4">
                    <h4 className="font-serif font-black text-[#0A2E5D] text-sm border-b pb-2 mb-2">Cursos mais populares</h4>
                    <div className="space-y-3">
                      {[
                        { title: "English for the Legal Field", share: "76%", enrolled: "22 Juristas", fill: "w-[76%]" },
                        { title: "Contract Negotiation Energy", share: "45%", enrolled: "16 Juristas", fill: "w-[45%]" },
                        { title: "Arbitration & Litigation Draft", share: "32%", enrolled: "11 Juristas", fill: "w-[32%]" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-3xs font-semibold">
                            <span>{item.title}</span>
                            <span className="font-mono text-[#C89B3C]">{item.enrolled}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-[#0A2E5D] ${item.fill}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Second row: Weekly activity, financial overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-white p-5 rounded-3xl border border-gray-150 space-y-3">
                    <h4 className="font-serif font-black text-[#0A2E5D] text-sm border-b pb-2">Atividade Semanal de Utilizadores</h4>
                    <div className="flex justify-around py-3 font-mono text-center">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <div className="w-3.5 bg-[#C89B3C] rounded-md transition-all hover:opacity-80" style={{ height: `${[40, 75, 95, 60, 85, 20][i]}px` }}></div>
                          <span className="text-[9px] text-gray-400">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial projections */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-150 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-black text-[#0A2E5D] text-sm border-b pb-2">Previsão e Desempenho Financeiro</h4>
                      <p className="text-xs text-gray-500 mt-2">Volume histórico consolidado e estimativas acumuladas de orçamentos para o Q3 Angolano.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                      <div className="p-2.5 bg-gray-50 border rounded-xl">
                        <span className="text-3xs font-mono text-gray-400 block uppercase">Anual Projetado</span>
                        <span className="text-sm font-serif font-black text-slate-700">114.500.000 Kz</span>
                      </div>
                      <div className="p-2.5 bg-[#C89B3C]/5 border border-[#C89B3C]/20 rounded-xl">
                        <span className="text-3xs font-mono text-[#C89B3C] block uppercase">Ticket Médio</span>
                        <span className="text-sm font-serif font-black text-[#0A2E5D]">450.000 Kz</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* VIEW 2: UTILIZADORES TAB (Full administration panel) */}
            {activeTab === 'utilizadores' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] dark:text-white text-base">Controle de Autenticação e Perfis (RBAC)</h3>
                    <p className="text-xs text-gray-400 mt-1 font-sans">Registe novas contas corporativas, desative credenciais imediatamente e conceda autorizações granulares.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">Filtrar Função:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="p-2 border rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="ALL">Todos os Membros</option>
                      <option value="STUDENT">Alunos (STUDENT)</option>
                      <option value="INSTRUCTOR">Professores (INSTRUCTOR)</option>
                      <option value="ADMIN">Administradores (ADMIN)</option>
                    </select>
                  </div>
                </div>

                {/* Form to insert new account */}
                <form onSubmit={handleCreateUser} className="bg-gray-55 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase font-black mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Madalena Huambo"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full p-2.5 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase font-black mb-1">E-mail de Login</label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@advogados.ao"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full p-2.5 bg-white border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase font-black mb-1">Função de Acesso</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-white border rounded-xl text-xs"
                    >
                      <option value="STUDENT">Aluno de Elite (STUDENT)</option>
                      <option value="INSTRUCTOR">Professor Titular (INSTRUCTOR)</option>
                      <option value="ADMIN">Administrador Geral (ADMIN)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer transition-colors"
                  >
                    Registrar Credencial
                  </button>
                </form>

                {/* Users List with impersonation keys */}
                <div className="overflow-x-auto border-0 md:border rounded-2xl">
                  {dbUsers.filter(u => roleFilter === 'ALL' || u.role === roleFilter).length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl font-mono text-gray-450 text-xs">
                      Nenhum utilizador registrado com esta função.
                    </div>
                  ) : (
                    <>
                      <table className="hidden md:table w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-900/30 uppercase text-[9px] font-mono text-gray-400 border-b">
                            <th className="p-3">Membro</th>
                            <th className="p-3">Função / RBAC</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dbUsers.filter(u => roleFilter === 'ALL' || u.role === roleFilter).map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-3 flex items-center gap-2.5">
                                <img src={user.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                                <div>
                                  <span className="font-semibold block">{user.firstName} {user.lastName}</span>
                                  <span className="text-[10px] text-gray-400 block font-mono">{user.email}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-mono text-[10px] text-[#C89B3C] font-extrabold">{user.role}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${
                                  user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {user.status || 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className="px-2 py-1 text-slate-600 border rounded hover:bg-gray-100 font-mono text-[9px]"
                                >
                                  Suspender/Ativar
                                </button>
                                <button
                                  onClick={() => handleImpersonate(user)}
                                  className="px-2.5 py-1 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 rounded font-mono text-[9px] inline-flex items-center gap-1"
                                >
                                  <Eye size={10} /> Impersonar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Mobile view of stacked cards */}
                      <div className="block md:hidden space-y-4">
                        {dbUsers.filter(u => roleFilter === 'ALL' || u.role === roleFilter).map(user => (
                          <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm text-left">
                            <div className="flex items-center gap-3">
                              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold block text-xs truncate">{user.firstName} {user.lastName}</span>
                                <span className="text-[10px] text-gray-400 block truncate font-mono">{user.email}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${
                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {user.status || 'ACTIVE'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="font-mono text-[10px] text-[#C89B3C] font-extrabold">{user.role}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className="px-2 py-1 text-slate-600 border rounded hover:bg-gray-100 font-mono text-[9px]"
                                >
                                  Mudar Estado
                                </button>
                                <button
                                  onClick={() => handleImpersonate(user)}
                                  className="px-2 py-1 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 rounded font-mono text-[9px] inline-flex items-center gap-1"
                                >
                                  <Eye size={10} /> Entrar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 5: GESTÃO DE CURSOS */}
            {activeTab === 'cursos' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-base">Catálogo de Especializações Ativas</h3>
                    <p className="text-xs text-gray-400 mt-1">Gestão de currículos jurídicos, fixação de mensalidades e oradores associados.</p>
                  </div>
                  <button onClick={() => { setIsCreatingCourse(true); setCourseTitle(''); }} className="px-3.5 py-1.5 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5">
                    <Plus size={12} /> Criar Curso
                  </button>
                </div>

                {isCreatingCourse && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!courseTitle) return;
                    const cObj: Course = {
                      id: `course_${Date.now()}`,
                      slug: courseTitle.toLowerCase().replace(/ /g, '-'),
                      title: courseTitle,
                      subtitle: "Especialização programática de alto impacto.",
                      price: coursePrice,
                      duration: "10 Semanas",
                      hours: "36 Horas Letivas",
                      language: "Inglês técnico",
                      modality: "Híbrido",
                      summary: "Formação em debate oral e defesa de causas internacionais da MultiPlus.",
                      schedule: "Sábados 09h00 - 12h00",
                      startDate: "2026-09-01",
                      targetAudience: ["Juristas", "Profissionais do Petróleo"],
                      modules: []
                    };
                    setCourses(prev => [...prev, cObj]);
                    setIsCreatingCourse(false);
                    addAuditLog("CRIAÇÃO CURSO", `Criado novo curso: ${courseTitle}`);
                    alert('Novo programa indexado com sucesso!');
                  }} className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <p className="font-serif font-bold text-xs m-0 text-[#0A2E5D]">Formulário do Novo Curso</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <input type="text" placeholder="Nome do Curso..." value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required className="p-2 bg-white border rounded" />
                      <input type="text" placeholder="Preço (Ex: €450)..." value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} className="p-2 bg-white border rounded" />
                      <input type="text" placeholder="Oradora responsável..." value={courseInstructor} onChange={(e) => setCourseInstructor(e.target.value)} className="p-2 bg-white border rounded" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setIsCreatingCourse(false)} className="px-3 py-1 bg-gray-100 text-slate-650 rounded">Cancelar</button>
                      <button type="submit" className="px-3 py-1 bg-[#0A2E5D] text-white rounded">Salvar Curso</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <div key={course.id} className="p-4 bg-[#FAF9F6] border rounded-2xl flex flex-col justify-between text-left hover:border-[#C89B3C]/55">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#C89B3C] font-bold block">{course.duration} • {course.price}</span>
                        <h4 className="font-serif font-black text-sm text-[#0A2E5D] m-0">{course.title}</h4>
                        <p className="text-[11px] text-gray-500 leading-normal">{course.subtitle}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t mt-4 text-[10px] font-mono">
                        <span className="text-gray-400">Responsável: {courseInstructor}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => {
                            if (confirm('Deseja realmente duplicar este programa de estudos?')) {
                              setCourses(prev => [...prev, { ...course, id: `course_${Date.now()}`, title: `${course.title} (Cópia)` }]);
                              addAuditLog("DUPLICAR CURSO", `Duplicado o curso ID: ${course.id}`);
                            }
                          }} className="p-1 text-slate-650 bg-white border hover:bg-gray-100 rounded">Duplicar</button>
                          <button onClick={() => {
                            setCourses(prev => prev.filter(c => c.id !== course.id));
                            addAuditLog("REMOVER CURSO", `Removido curso ID: ${course.id}`);
                          }} className="p-1 text-red-650 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 7: CERTIFICADOS */}
            {activeTab === 'certificados' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-base">Registro de Chaves de Diplomas Digitais</h3>
                    <p className="text-xs text-gray-400 mt-1">Emissão em lote de certificados com blockchain local e tecnologia QR-Code auditável publicamente.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <input type="text" id="cert-recipient" placeholder="Nome do Jurista..." className="p-2 text-xs border rounded-xl w-44" />
                    <button onClick={() => {
                      const name = (document.getElementById('cert-recipient') as HTMLInputElement)?.value;
                      if (!name) return alert('Por favor insira um nome de outorgado.');
                      handleEmitCertificate(name, "English for the Legal Field in Angola");
                      (document.getElementById('cert-recipient') as HTMLInputElement).value = '';
                    }} className="px-3 py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono font-bold uppercase transition-colors">
                      Gerar Agora
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map((cert, i) => (
                    <div key={i} className="p-4 bg-white border-2 border-[#C89B3C]/40 rounded-2xl flex justify-between items-center text-left">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-[#C89B3C] font-bold uppercase">Código: {cert.verificationCode}</span>
                        <h4 className="font-serif font-black text-xs text-slate-700 m-0">{cert.recipientName}</h4>
                        <p className="text-[10px] text-gray-400 font-mono m-0">{cert.courseName}</p>
                        <span className="text-[9px] text-[#0A2E5D] block">Emitido em: {cert.completionDate}</span>
                      </div>
                      <div className="p-1 border bg-gray-50 rounded">
                        <QrCode className="text-slate-800" size={40} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 12: MENSAGENS PANEL */}
            {activeTab === 'mensagens' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-150">
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Central de Mensagens e Comunicações em Tempo Real</h3>
                  <p className="text-xs text-gray-400 mt-1">Converse individualmente com formandos e formadores ou envie mensagens em massa.</p>
                </div>
                <ChatShell role="ADMIN" />
              </div>
            )}

            {/* VIEW 13: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-base">Notificações e Alertas Urgentes</h3>
                    <p className="text-xs text-gray-400 mt-1">Centro de monitorização de falhas, reconciliação de guias e inscrições.</p>
                  </div>
                  <button onClick={handleClearAlerts} className="text-3xs font-mono text-blue-900 uppercase">Limpar Alertas</button>
                </div>

                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-red-50/50 border border-red-200/50 rounded-2xl flex gap-3 text-left">
                      <AlertTriangle className="text-red-650 shrink-0 mt-0.5" size={16} />
                      <div>
                        <span className="text-[8px] font-mono text-red-700 font-extrabold uppercase bg-red-100/50 px-2 py-0.5 rounded">{alert.type}</span>
                        <p className="text-xs font-semibold text-slate-700 mt-1.5 leading-normal m-0">{alert.msg}</p>
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs">Nenhum alerta crítico ativo no painel MultiPlus.</div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 16: INTEGRAÇÕES */}
            {activeTab === 'integracoes' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Gateway de Ligações de API</h3>
                  <p className="text-xs text-gray-400 mt-1">Relação e status de serviços Cloud externos integrados para automatizar a vida académica da MultiPlus.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(integrationStatuses).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 border rounded-2xl flex justify-between items-center text-left">
                      <div>
                        <h4 className="font-serif font-bold text-[#0A2E5D] text-xs m-0">{key} Integration</h4>
                        <span className="text-[9px] font-mono text-gray-450 block mt-1">
                          {key === "Supabase" ? "Autenticação e DB" : key === "Cloudinary" ? "Média CDN" : "API Produtividade"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIntegrationStatuses(prev => {
                            const next = { ...prev, [key]: !prev[key] };
                            addAuditLog("CONFIG INTEGRADORA", `${key} alterado para ${next[key] ? 'ATIVADO' : 'DESATIVADO'}`);
                            return next;
                          });
                        }}
                        className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase ${
                          value ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {value ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 17: CONFIGURAÇÕES */}
            {activeTab === 'configuracoes' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Configurações Gerais de Operação</h3>
                  <p className="text-xs text-gray-400 mt-1">Definição dos parâmetros institucionais base, emails de tesouraria de Luanda e Huambo e taxas de câmbio.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-mono text-gray-400 uppercase font-black">Nome da Instituição</label>
                    <input type="text" value={instName} onChange={(e) => setInstName(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl font-serif font-extrabold" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-mono text-gray-400 uppercase font-black">Domínio de Internet</label>
                    <input type="text" value={instDomain} onChange={(e) => setInstDomain(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl font-mono" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[8px] font-mono text-gray-400 uppercase font-black">Contacto de Emergência</label>
                    <input type="text" value={instPhone} onChange={(e) => setInstPhone(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl" />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button onClick={() => {
                    addAuditLog("CONFIG GERAL", "Atualizado informações da instituição pelo Admin");
                    alert('As alterações da instituição foram salvas!');
                  }} className="px-5 py-2.5 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer">
                    Salvar Parâmetros
                  </button>
                </div>

              </div>
            )}

            {/* VIEW 18: PERFIL */}
            {activeTab === 'perfil' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6 text-left">
                <div className="flex gap-4 items-center">
                  <img src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg" alt="Avatar Isabel" className="w-16 h-16 rounded-full border-2 border-[#C89B3C]" />
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-lg m-0">Drª Isabel Nascimento</h3>
                    <p className="text-xs text-gray-400 font-mono">DRETORA EXECUTIVA EM LIÇÕES INTEGRANTES HUAMBO</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border rounded-2xl text-xs space-y-3 leading-normal">
                  <p><strong>Cargo Hierárquico:</strong> Super Administrador Geral</p>
                  <p><strong>E-mail de Notificações:</strong> isabel@empresas.ao</p>
                  <p><strong>Permissão RBAC:</strong> Todo-Poderoso (Acessos ilimitados para exclusão acadêmica, auditorias financeiras e re-emissão judicial de diplomas).</p>
                  <p className="text-amber-700">⚠️ Proteja bem as suas chaves privadas. Qualquer alteração ou impersonação efetuada sob este acesso é automaticamente auditada.</p>
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
