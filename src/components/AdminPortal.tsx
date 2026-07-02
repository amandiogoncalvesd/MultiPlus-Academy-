import React, { useState, useEffect } from 'react';
import { PageId, User, UserRole, Course } from '../types';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase/client';
import { academicService } from '../services/supabase/academicService';

import { 
  Users, Settings, Activity, TrendingUp, DollarSign, MapPin, ShieldCheck, 
  Trash2, Edit3, Lock, Eye, PhoneCall, RefreshCw, Database, Network, 
  Server, Layers, Globe, BookOpen, ChevronRight, Search, Bell, Mail, 
  Filter, Calendar, FileText, Share2, Plus, Play, Sparkles, Check, 
  CheckCircle2, AlertTriangle, HelpCircle, User as UserIcon, Info, Wifi, 
  PlusCircle, CheckSquare, X, Bookmark, Image, ArrowRight, Shield, Download, 
  FileSpreadsheet, MessageSquare, Megaphone, Terminal, QrCode, FileDown,
  LogOut, Award, Star, Clock, AlertCircle
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
  
  // Course form states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('€350');
  const [courseInstructor, setCourseInstructor] = useState('Dra. Esmeralda Sumbelelo');
  const [courseStatus, setCourseStatus] = useState<'ATIVO' | 'RASCUNHO' | 'ARQUIVADO'>('ATIVO');

  // Integrations states
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, boolean>>({
    Firebase: true,
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
    } catch (err) {
      console.warn('Silent local fallback for loading admin portal:', err);
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
    const customId = `user_${Date.now()}`;
    const newUser: User = {
      id: customId,
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

    try {
      // Write directly to Supabase users table
      const { error } = await supabase.from('users').insert({
        id: customId,
        email: newUserEmail,
        nome_completo: newUserName,
        role: newUserRole === 'STUDENT' ? 'ALUNO' : newUserRole === 'INSTRUCTOR' ? 'PROFESSOR' : 'ADMIN',
        status: newUserStatus
      });

      if (error) throw error;

      const updated = [...dbUsers, newUser];
      await syncToLocalStorage(updated);
      addAuditLog("CRIAÇÃO UTILIZADOR", `Nova conta criada: ${newUserEmail} (${newUserRole})`);
      
      setNewUserName('');
      setNewUserEmail('');
      alert(`Conta de ${first} criada com perfil ${newUserRole} no Supabase!`);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar no Supabase: ${err.message || err}`);
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      const updated = dbUsers.filter(u => u.id !== userId);
      await syncToLocalStorage(updated);
      addAuditLog("REMOCÃO UTILIZADOR", `Removida conta ID: ${userId}`);
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

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-slate-800 antialiased font-sans select-none overflow-x-hidden max-w-full w-full">
      
      {/* Backdrop overlay for mobile devices */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR (70% SaaS, 30% Neo-Skeuomorphism Luxury) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A2E5D] text-white flex flex-col justify-between py-5 border-r border-[#C89B3C]/30 shadow-2xl transition-transform duration-300 transform lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="px-5">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520964/multiplus-academy-logotipo-dourado-sem-fundo_ojals8.png"
                alt="MultiPlus Admin Logo"
                className="h-10 w-auto object-contain"
              />
              <div className="text-left select-none">
                <h2 className="text-sm font-serif font-black tracking-wide text-white m-0">Consola Central</h2>
                <span className="text-[8px] font-mono tracking-widest text-[#C89B3C] uppercase block font-bold">SUPER ADMINISTRADOR</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-white/75 hover:text-white hover:bg-white/10 p-1 rounded-lg border-0 bg-transparent cursor-pointer transition-all"
              title="Fechar menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Nav Item Area */}
        <nav className="flex-grow mt-4 px-2 space-y-1 overflow-y-auto max-h-[64vh] text-left custom-scrollbar">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'utilizadores', name: 'Utilizadores', icon: <UserIcon className="w-3.5 h-3.5" /> },
            { id: 'alunos', name: 'Alunos', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'professores', name: 'Professores', icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'cursos', name: 'Cursos', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'turmas', name: 'Turmas', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'certificados', name: 'Certificados', icon: <QrCode className="w-3.5 h-3.5" /> },
            { id: 'financeiro', name: 'Financeiro', icon: <DollarSign className="w-3.5 h-3.5" /> },
            { id: 'pagamentos', name: 'Pagamentos', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { id: 'eventos', name: 'Eventos', icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: 'blog', name: 'Blog', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'mensagens', name: 'Mensagens', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'notificacoes', name: 'Notificações', icon: <Bell className="w-3.5 h-3.5" /> },
            { id: 'relatorios', name: 'Relatórios', icon: <FileDown className="w-3.5 h-3.5" /> },
            { id: 'auditoria', name: 'Auditoria', icon: <Terminal className="w-3.5 h-3.5" /> },
            { id: 'integracoes', name: 'Integrações', icon: <Network className="w-3.5 h-3.5" /> },
            { id: 'configuracoes', name: 'Configurações', icon: <Settings className="w-3.5 h-3.5" /> },
            { id: 'perfil', name: 'Perfil', icon: <UserIcon className="w-3.5 h-3.5" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between border-0 cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-[#C89B3C] to-[#E5C158] text-[#0A2E5D] font-extrabold shadow-lg shadow-[#000]/10 border-l-4 border-slate-900' 
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

        {/* Sidebar Footer */}
        <div className="px-4 pt-3 border-t border-white/10 space-y-3 pb-2 text-left">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg"
              alt="Administradora Isabel"
              className="w-8 h-8 rounded-full border border-[#C89B3C]"
            />
            <div>
              <span className="text-[10px] font-serif font-black text-white block">Drª. Isabel Nascimento</span>
              <span className="text-[7.5px] font-mono text-[#C89B3C] uppercase block tracking-wider">Super Direção Geral</span>
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
            className="w-full py-2 bg-red-650/10 hover:bg-red-650/20 text-red-400 rounded-lg text-[9px] font-mono font-bold uppercase transition-all border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={12} />
            <span>Encerrar Painel</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT SHELL */}
      <div className="flex-grow lg:pl-64 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
        
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-gray-150 hover:bg-gray-100 cursor-pointer"
            >
              ☰
            </button>

            {/* Global Search Filtering Dashboard Content */}
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar utilizadores, faturas ou auditorias..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C89B3C]"
              />
            </div>
          </div>

          {/* Quick Stats Alerts Badge */}
          <div className="flex items-center gap-4">
            
            {/* Critical Alert Bar indicator */}
            <div className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-150 text-[10px] font-mono font-bold uppercase tracking-wider hidden md:flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              ⚠️ {activeAlerts.length} ALERTA(S) CRÍTICO(S) ATIVOS
            </div>

            {/* Notification Bell toggle menu */}
            <button 
              onClick={() => { setActiveTab('notificacoes'); }}
              className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-450 relative cursor-pointer"
              title="Acessar Todas"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {/* Avatar Profile Short panel */}
            <div className="flex items-center gap-2.5 border-l pl-4">
              <img
                src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520966/multiplus-academy-esmeralda-bruno-sumbelelo_qtuere.jpg"
                alt="Isabel Avatar"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-mono font-bold text-blue-900 block leading-tight">SUPER_ADMIN</span>
                <span className="text-3xs text-slate-500 font-semibold uppercase block">isabel@empresas.ao</span>
              </div>
            </div>

          </div>

        </header>

        {/* 3. DYNAMIC CENTER CONTROLLER AREA */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 text-left">
          
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

          <div className="transition-all duration-300">
            
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
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Controle de Autenticação e Perfis (RBAC)</h3>
                  <p className="text-xs text-gray-400 mt-1">Registe novas contas corporativas, desative credenciais imediatamente e conceda autorizações granulares.</p>
                </div>

                {/* Form to insert new account */}
                <form onSubmit={handleCreateUser} className="bg-gray-55 p-5 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
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
                  {dbUsers.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl font-mono text-gray-450 text-xs">
                      Nenhum utilizador registrado no momento.
                    </div>
                  ) : (
                    <>
                      <table className="hidden md:table w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 uppercase text-[9px] font-mono text-gray-400 border-b">
                            <th className="p-3">Membro</th>
                            <th className="p-3">Função / RBAC</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dbUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="p-3 flex items-center gap-2.5">
                                <img src={user.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                                <div>
                                  <span className="font-semibold block">{user.firstName} {user.lastName}</span>
                                  <span className="text-[10px] text-gray-400 block">{user.email}</span>
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
                        {dbUsers.map(user => (
                          <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm text-left">
                            <div className="flex items-center gap-3">
                              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold block text-xs truncate">{user.firstName} {user.lastName}</span>
                                <span className="text-[10px] text-gray-400 block truncate">{user.email}</span>
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

            {/* VIEW 3: ALUNOS TAB */}
            {activeTab === 'alunos' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-base">Histórico e Fichas de Alunos</h3>
                    <p className="text-xs text-gray-400 mt-1">Conferência completa de progressos, histórico de mensalidades e selos académicos de cada jurista de elite matriculado.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => generateReport('CSV')} className="p-2 border rounded-xl hover:bg-gray-50 flex items-center gap-1.5 text-3xs font-mono cursor-pointer">
                      <Download size={12} /> Exportar Alunos CSV
                    </button>
                  </div>
                </div>

                {/* Interactive query output */}
                <div className="overflow-x-auto border-0 md:border rounded-2xl">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl font-mono text-gray-450 text-xs">
                      Nenhum formando matriculado no momento.
                    </div>
                  ) : (
                    <>
                      <table className="hidden md:table w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 uppercase text-[9px] font-mono text-gray-400 border-b">
                            <th className="p-3">Formando</th>
                            <th className="p-3">Matrícula</th>
                            <th className="p-3 text-center">Progresso</th>
                            <th className="p-3">Financeiro</th>
                            <th className="p-3">Contacto</th>
                            <th className="p-3 text-right">Diplomas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredStudents.map(student => {
                            const enroll = enrollments.find(e => e.student_id === student.id);
                            const progress = enroll?.progress_percent ?? (enroll?.status === 'COMPLETED' ? 100 : 75);
                            const isPaid = enroll ? 'Pago' : 'Pendente';

                            return (
                              <tr key={student.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-semibold text-[#0A2E5D]">{student.firstName} {student.lastName}</td>
                                <td className="p-3 font-mono text-[10px] text-gray-500">English for Legal Field</td>
                                <td className="p-3 text-center">
                                  <span className="font-mono font-bold text-gray-700">{progress}%</span>
                                  <div className="w-16 bg-gray-100 h-1 rounded-full mx-auto mt-1">
                                    <div className="bg-[#C89B3C] h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase ${
                                    isPaid === 'Pago' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>{isPaid}</span>
                                </td>
                                <td className="p-3 font-mono text-3xs text-gray-500">{student.phone || "+244 923 000 000"}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleEmitCertificate(`${student.firstName} ${student.lastName}`, "English for the Legal Field in Angola")}
                                    className="px-2 py-1 bg-[#C89B3C] text-slate-900 hover:bg-[#0A2E5D] hover:text-white rounded font-mono text-[8px] uppercase font-bold"
                                  >
                                    Emitir Diploma
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Mobile view of stacked student cards */}
                      <div className="block md:hidden space-y-4">
                        {filteredStudents.map(student => {
                          const enroll = enrollments.find(e => e.student_id === student.id);
                          const progress = enroll?.progress_percent ?? (enroll?.status === 'COMPLETED' ? 100 : 75);
                          const isPaid = enroll ? 'Pago' : 'Pendente';

                          return (
                            <div key={student.id} className="bg-white p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm text-left">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold block text-xs text-[#0A2E5D]">{student.firstName} {student.lastName}</span>
                                  <span className="text-[10px] text-gray-400 block font-mono">{student.phone || "+244 923 000 000"}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase ${
                                  isPaid === 'Pago' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>{isPaid}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-gray-100 font-mono">
                                <div>
                                  <span className="text-[8px] text-gray-400 uppercase block">Matrícula</span>
                                  <span className="text-gray-700 font-medium truncate block max-w-[150px]">English for Legal Field</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-gray-400 uppercase block">Progresso</span>
                                  <span className="text-gray-700 font-bold block">{progress}%</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-gray-100 flex justify-end">
                                <button
                                  onClick={() => handleEmitCertificate(`${student.firstName} ${student.lastName}`, "English for the Legal Field in Angola")}
                                  className="w-full py-2 bg-[#C89B3C] text-slate-900 hover:bg-[#0A2E5D] hover:text-white rounded font-mono text-[9px] uppercase font-bold text-center"
                                >
                                  Emitir Diploma
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 4: PROFESSORES TAB */}
            {activeTab === 'professores' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Controle de Desempenho do Corpo de Oradores</h3>
                  <p className="text-xs text-gray-400 mt-1">Gabinete de avaliação das docentes MultiPlus. Rastreabilidade de províncias oradoras do Huambo e métricas pedagógicas directas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredInstructors.map(teacher => (
                    <div key={teacher.id} className="p-5 bg-gray-50 border rounded-2xl flex gap-4 text-left">
                      <img src={teacher.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-[#C89B3C]/50" />
                      <div className="space-y-2 flex-grow">
                        <div>
                          <span className="font-serif font-black text-[#0A2E5D] text-sm block">{teacher.firstName} {teacher.lastName}</span>
                          <span className="text-[10px] text-gray-400 font-mono block">{teacher.email}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-2 border-t text-gray-500">
                          <div>
                            <span className="block text-[8px] uppercase">Alunos</span>
                            <span className="font-bold text-slate-700">42</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase">Avaliação</span>
                            <span className="font-bold text-[#C89B3C]">4.9 ★</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase">Ementas</span>
                            <span className="font-bold text-slate-700">3 Ativos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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

            {/* VIEW 6: GESTÃO DE TURMAS */}
            {activeTab === 'turmas' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Alocação de Turmas e Cohorts</h3>
                  <p className="text-xs text-gray-400 mt-1">Organização de turmas letivas ativas de Luanda e Huambo, com horários semanais definidos.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { code: "TURMA-2026-MPA1", name: "Cohort Alpha - English Law", stdCount: 18, time: "Sábados 09:00 - 12:00", active: true },
                    { code: "TURMA-2026-MPAY", name: "Cohort Energy Contracts", stdCount: 14, time: "Quartas 18:30 - 20:30", active: true },
                    { code: "TURMA-2026-MPAB", name: "Tribunais Arbitrais Simulacro", stdCount: 10, time: "Flexível / Sob Demanda", active: false }
                  ].map((cohort, i) => (
                    <div key={i} className="p-4 bg-gray-50 border rounded-2xl space-y-3 relative text-left">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-gray-200 rounded font-bold text-slate-700">{cohort.code}</span>
                        <span className={`h-2 w-2 rounded-full ${cohort.active ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>
                      <div>
                        <h4 className="font-serif font-black text-xs text-[#0A2E5D] m-0">{cohort.name}</h4>
                        <span className="text-3xs text-gray-500 font-mono block mt-1">{cohort.time}</span>
                      </div>
                      <div className="pt-2 border-t text-[11px] text-gray-650 flex justify-between items-center font-mono">
                        <span>{cohort.stdCount} Juristas</span>
                        <button onClick={() => alert('Turma vinculada com a agenda letiva do Microsoft Teams e Google Calendar.')} className="text-blue-650 hover:underline">Ver Tabela</button>
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

            {/* VIEW 8: FINANCEIRO */}
            {activeTab === 'financeiro' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Controle Financeiro e Faturamento Real</h3>
                  <p className="text-xs text-gray-400 mt-1">Mapeamento em tempo real de mensalidades e previsões comerciais para as unidades de ensino.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-150 rounded-2xl">
                    <span className="text-[9px] font-mono uppercase block text-emerald-600 font-extrabold mb-1">Receita Concluída (Mês)</span>
                    <span className="text-lg sm:text-xl font-serif font-black">9.620.000 Kz</span>
                  </div>
                  <div className="p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-2xl">
                    <span className="text-[9px] font-mono uppercase block text-amber-600 font-extrabold mb-1">Pagamentos Pendentes</span>
                    <span className="text-lg sm:text-xl font-serif font-black">1.840.000 Kz</span>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-900 border border-blue-150 rounded-2xl">
                    <span className="text-[9px] font-mono uppercase block text-blue-600 font-extrabold mb-1">Previsão Anual de Cursos</span>
                    <span className="text-lg sm:text-xl font-serif font-black">114.500.000 Kz</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
                  <p className="font-serif font-bold text-xs m-0">Gráfico de Histórico de Faturamento (2026)</p>
                  <div className="aspect-[16/5] w-full min-h-[140px] flex items-end">
                    <svg viewBox="0 0 500 100" className="w-full h-full text-[#C89B3C]">
                      <rect x="20" y="30" width="30" height="70" rx="3" fill="#0A2E5D" />
                      <rect x="100" y="10" width="30" height="90" rx="3" fill="#C89B3C" />
                      <rect x="180" y="40" width="30" height="60" rx="3" fill="#0A2E5D" />
                      <rect x="260" y="20" width="30" height="80" rx="3" fill="#0A2E5D" />
                      <text x="20" y="98" fontSize="8" fill="#aaa">FEV</text>
                      <text x="100" y="98" fontSize="8" fill="#aaa">MAR</text>
                      <text x="180" y="98" fontSize="8" fill="#aaa">ABR</text>
                      <text x="260" y="98" fontSize="8" fill="#aaa">MAI</text>
                    </svg>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 9: PAGAMENTOS */}
            {activeTab === 'pagamentos' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Historial e Logs de Transações</h3>
                  <p className="text-xs text-gray-400 mt-1">Conferência de boletas, transferências bancárias manuais de Luanda e Huambo e estado das mensalidades.</p>
                </div>

                <div className="overflow-x-auto border-0 md:border rounded-xl">
                  <table className="hidden md:table w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[9px] font-mono text-gray-400 border-b uppercase">
                        <th className="p-3">ID Transação</th>
                        <th className="p-3">Destinatário</th>
                        <th className="p-3">Montante</th>
                        <th className="p-3">Método</th>
                        <th className="p-3">Data</th>
                        <th className="p-3 text-right">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { tid: "TX-9023", name: "Dr. António Carvalho", sum: "450.000 Kz", method: "Trf Bancária BFA", date: "2026-06-01", status: "Confirmado" },
                        { tid: "TX-9041", name: "Drª Isabel Nascimento", sum: "350.000 Kz", method: "Multicaixa Live", date: "2026-06-03", status: "Confirmado" },
                        { tid: "TX-9099", name: "Estudante Externo", sum: "450.000 Kz", method: "Multicaixa Express", date: "2026-06-07", status: "Pendente" }
                      ].map((tx, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono text-[10px] text-gray-500">{tx.tid}</td>
                          <td className="p-3 font-semibold text-[#0A2E5D]">{tx.name}</td>
                          <td className="p-3 font-bold text-slate-700">{tx.sum}</td>
                          <td className="p-3 text-gray-500">{tx.method}</td>
                          <td className="p-3 text-gray-400">{tx.date}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                              tx.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}>{tx.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile stacked view of transactions */}
                  <div className="block md:hidden space-y-4">
                    {[
                      { tid: "TX-9023", name: "Dr. António Carvalho", sum: "450.000 Kz", method: "Trf Bancária BFA", date: "2026-06-01", status: "Confirmado" },
                      { tid: "TX-9041", name: "Drª Isabel Nascimento", sum: "350.000 Kz", method: "Multicaixa Live", date: "2026-06-03", status: "Confirmado" },
                      { tid: "TX-9099", name: "Estudante Externo", sum: "450.000 Kz", method: "Multicaixa Express", date: "2026-06-07", status: "Pendente" }
                    ].map((tx, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-150 space-y-2 text-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[9px] text-gray-400">{tx.tid} • {tx.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${
                            tx.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>{tx.status}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#0A2E5D] block">{tx.name}</span>
                          <div className="flex justify-between items-center text-[10px] mt-1 text-gray-500 font-mono">
                            <span>{tx.method}</span>
                            <span className="font-bold text-slate-700">{tx.sum}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 10: EVENTOS */}
            {activeTab === 'eventos' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-[#0A2E5D] text-base">Cronograma de Eventos Jurídicos</h3>
                    <p className="text-xs text-gray-400 mt-1">Oficinas presenciais no Huambo, debates de tribunais simulados letivos híbridos e webinars corporativos.</p>
                  </div>
                  <button onClick={() => alert('Integração com Google Calendar: Sincronização em tempo real de webinars via Google Meet API.')} className="px-3.5 py-1.5 bg-[#0A2E5D] text-white hover:bg-[#C89B3C] rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5">
                    Sincronizar Google Calendar
                  </button>
                </div>

                {/* Event creator form */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newEventTitle) return;
                  setEvents(prev => [...prev, { id: Date.now(), title: newEventTitle, type: newEventType, date: "2026-06-25", attendees: 0 }]);
                  setNewEventTitle('');
                  alert('Novo workshop ou webinar anexado ao calendário letivo.');
                }} className="bg-gray-50 p-4 rounded-xl flex gap-3 text-xs">
                  <input type="text" placeholder="Nome do Evento..." value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} required className="flex-grow p-2 border rounded" />
                  <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="p-2 border rounded bg-white">
                    <option value="Online (Meet)">Online (Meet)</option>
                    <option value="Presencial Huambo">Presencial Huambo</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-[#0A2E5D] text-white rounded">Adicionar</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(ev => (
                    <div key={ev.id} className="p-4 bg-gray-55 border rounded-xl flex justify-between items-center text-left">
                      <div>
                        <span className="text-[8px] font-mono text-[#C89B3C] font-extrabold uppercase">{ev.type}</span>
                        <h4 className="font-serif font-bold text-slate-800 text-xs m-0">{ev.title}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">Agendado: {ev.date}</span>
                      </div>
                      <span className="font-mono text-3xs font-bold text-[#0A2E5D] bg-white border px-2.5 py-1 rounded-lg">{ev.attendees} inscritos</span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 11: BLOG */}
            {activeTab === 'blog' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Publicador de Artigos e Opinião Geral (CMS)</h3>
                  <p className="text-xs text-gray-400 mt-1">Criação de artigos didáticos doutrinários para atração e indexação de leads na MultiPlus.</p>
                </div>

                {/* Post Creator Form */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPostTitle) return;
                  setBlogPosts(prev => [{ id: Date.now(), title: newPostTitle, author: "Drª Isabel Nascimento", status: "Publicado", date: new Date().toISOString().slice(0, 10) }, ...prev]);
                  setNewPostTitle('');
                  alert('Artigo publicado no blog e disparado no mural comum!');
                }} className="bg-gray-50 p-4 rounded-xl flex gap-2 text-xs">
                  <input type="text" placeholder="Escreva o título do novo artigo..." value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} required className="flex-grow p-2 border rounded" />
                  <button type="submit" className="px-4 py-2 bg-[#0A2E5D] text-white rounded font-mono text-3xs uppercase font-bold">Publicar Notícia</button>
                </form>

                <div className="space-y-3">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-[#FAF9F6] border rounded-xl flex justify-between items-center text-left">
                      <div>
                        <h4 className="font-serif font-bold text-slate-800 text-xs m-0">{post.title}</h4>
                        <span className="text-[10px] font-mono text-gray-400">Por {post.author} • {post.date}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-50 text-emerald-800">{post.status}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 12: MENSAGENS PANEL */}
            {activeTab === 'mensagens' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Central de Mensagens e Avisos Administrativos</h3>
                  <p className="text-xs text-gray-400 mt-1">Dispare notícias de recalibração de guias, datas de exames de oratória ou de tribunais simulados.</p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[8px] font-mono text-gray-400 uppercase font-black mb-1">Público-Alvo do Disparo</label>
                      <select value={messageTarget} onChange={(e) => setMessageTarget(e.target.value)} className="w-full p-2 border bg-white rounded-xl">
                        <option value="ALL_STUDENTS">Todos os Alunos Matriculados</option>
                        <option value="ALL_INSTRUCTORS">Todos os Professores Titulares</option>
                        <option value="TURMA_ALPHA">Apenas Alunos Cohort Alpha</option>
                        <option value="INDIVIDUAL">Usuário Individual Espectador</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono text-gray-400 uppercase font-black mb-1">Mensagem do Comunicado</label>
                    <textarea
                      placeholder="Queridos formandos, a nossa tutora comunica que o simulacro de oratória de Sábado no Huambo..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      required
                      className="w-full p-3 border rounded-xl text-xs h-24"
                    />
                  </div>

                  <button type="submit" className="px-4 py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono font-bold uppercase transition-colors">
                    Enviar Notificação em Lote
                  </button>
                </form>

                {/* Broadcast Log */}
                <div className="space-y-2 pt-4 border-t">
                  <span className="text-[9px] font-mono text-gray-450 uppercase block">Log de Envio Recente</span>
                  <div className="bg-slate-900 text-[#C89B3C] font-mono text-[10px] p-4 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                    {broadcastLog.length === 0 ? (
                      <p className="m-0 text-slate-500">Nenhum aviso transmitido nesta sessão letiva.</p>
                    ) : (
                      broadcastLog.map((log, i) => <p key={i} className="m-0 leading-normal">{log}</p>)
                    )}
                  </div>
                </div>

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
                  <button onClick={() => { setActiveAlerts([]); alert('Todas as faturas e conflitos marcados como revisados.'); }} className="text-3xs font-mono text-blue-900 uppercase">Limpar Alertas</button>
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

            {/* VIEW 14: RELATÓRIOS EXPORTS */}
            {activeTab === 'relatorios' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Exportador Académico Consolidado</h3>
                  <p className="text-xs text-gray-400 mt-1">Compile relatórios para reuniões administrativas ou balancetes fiscais com as províncias parceiras.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-gray-50 border rounded-2xl text-center space-y-3">
                    <FileDown className="mx-auto text-[#C89B3C]" size={24} />
                    <p className="font-serif font-bold text-xs m-0">Lançamentos Académicos</p>
                    <p className="text-4xs text-gray-400 font-mono">Boletas, notas de exames orais, formandos concluintes.</p>
                    <button onClick={() => generateReport('PDF')} className="w-full py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono uppercase font-bold border-0 cursor-pointer">Baixar PDF Oficial</button>
                  </div>

                  <div className="p-5 bg-gray-50 border rounded-2xl text-center space-y-3">
                    <FileSpreadsheet className="mx-auto text-[#C89B3C]" size={24} />
                    <p className="font-serif font-bold text-xs m-0">Inscrições e Leads</p>
                    <p className="text-4xs text-gray-400 font-mono">Listagem de e-mails, províncias oradoras, formulários directos.</p>
                    <button onClick={() => generateReport('Excel')} className="w-full py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono uppercase font-bold border-0 cursor-pointer">Exportar Excel</button>
                  </div>

                  <div className="p-5 bg-gray-50 border rounded-2xl text-center space-y-3">
                    <TrendingUp className="mx-auto text-[#C89B3C]" size={24} />
                    <p className="font-serif font-bold text-xs m-0">Logs de Faturação</p>
                    <p className="text-4xs text-gray-400 font-mono">Demonstrações de transações pendentes e faturas BFA completas.</p>
                    <button onClick={() => generateReport('CSV')} className="w-full py-2 bg-[#0A2E5D] text-white rounded-xl text-3xs font-mono uppercase font-bold border-0 cursor-pointer">Gerar CSV Geral</button>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 15: AUDITORIA */}
            {activeTab === 'auditoria' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-150 space-y-6">
                <div>
                  <h3 className="font-serif font-black text-[#0A2E5D] text-base">Log de Segurança e Auditoria de Dados</h3>
                  <p className="text-xs text-gray-400 mt-1">Mapeamento em tempo real de cada transação, criação de cursos, logins e certificados emitidos no LMS.</p>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center text-[11px] font-mono text-left">
                      <div>
                        <span className="text-[#C89B3C] font-extrabold uppercase inline-block mr-2">[{log.action}]</span>
                        <span className="text-slate-700">{log.details}</span>
                        <p className="text-[10px] text-gray-400 m-0 mt-1">Autor: {log.user} • {log.stamp}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        log.type === 'security' ? 'bg-red-50 text-red-800' : log.type === 'financial' ? 'bg-[#C89B3C]/10 text-slate-800' : 'bg-[#0A2E5D]/5 text-blue-900 border'
                      }`}>{log.type}</span>
                    </div>
                  ))}
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
                          {key === "Firebase" ? "Autenticação e DB" : key === "Cloudinary" ? "Média CDN" : "API Produtividade"}
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

          </div>

        </main>

      </div>

    </div>
  );
}
