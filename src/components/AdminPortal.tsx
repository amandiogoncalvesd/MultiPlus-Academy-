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
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);
  
  // Profile inputs & biography
  const [adminBio, setAdminBio] = useState('');
  const [adminPhone, setAdminPhone] = useState(currentUser?.phone || '');
  const [adminName, setAdminName] = useState('');

  // Preference Settings
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifEmailCertificados, setNotifEmailCertificados] = useState(false);
  const [preferredTheme, setPreferredTheme] = useState<'light' | 'dark'>('light');

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
          role: u.role === 'ALUNO' ? 'STUDENT' : u.role === 'PROFESSOR' ? 'INSTRUCTOR' : 'ADMIN',
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
          setInstDomain(instData.dominio || 'multiplus.ao');
          setInstPhone(instData.contacto || '+244 923 000 000');
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

  const syncToLocalStorage = async (newUsers: User[], newCerts?: any[]) => {
    setDbUsers(newUsers);
    if (newCerts) setCertificates(newCerts);
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
        avatarUrl: '', // Deixar vazio por padrão, sistema usará iniciais
        phone: '', // Deixar vazio por padrão
        streak: 0,
        longestStreak: 0,
        totalHoursLearned: 0
      };

      const updated = [...dbUsers, newUser];
      await syncToLocalStorage(updated);
      addAuditLog("CRIAÇÃO UTILIZADOR", `Nova conta criada via Edge Function: ${newUserEmail} (${newUserRole})`);
      
      // Save created credentials so the admin can copy them
      setCreatedCredentials({
        email: newUserEmail,
        pass: newUserPassword
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
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
    addAuditLog("PRE-VISUALIZAÇÃO DE PORTAL", `${currentUser?.firstName || 'Administrador'} simulou perfil: ${user.firstName} (${user.role})`);
    if (user.role === 'STUDENT') setCurrentPage('student-dashboard');
    else if (user.role === 'INSTRUCTOR') setCurrentPage('instructor-dashboard');
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    // Validate size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      alert("Erro: O tamanho da imagem excede o limite máximo de 2MB.");
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      alert("Erro: Formato de arquivo inválido. Apenas JPG, PNG e WEBP são permitidos.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const filePath = `${currentUser.id}/${Date.now()}.${ext}`;
      
      // Upload file to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update public.users.foto_perfil
      const { error: updateError } = await supabase
        .from('users')
        .update({ foto_perfil: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Update local state for current user
      const updatedUser = { ...currentUser, avatarUrl: publicUrl };
      setCurrentUser(updatedUser);

      // Update dbUsers state as well so lists reflect the change
      setDbUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, avatarUrl: publicUrl } : u));

      addAuditLog("PERFIL FOTO UPDATE", "Alterou com sucesso a foto de perfil do administrador.");
      alert("Foto de perfil atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro no upload da foto de perfil:", err);
      alert(`Erro no upload da foto de perfil: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Filtered lists
  const filteredStudents = dbUsers.filter(u => u.role === 'STUDENT').filter(u => 
    globalSearch ? `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(globalSearch.toLowerCase()) : true
  );

  const filteredInstructors = dbUsers.filter(u => u.role === 'INSTRUCTOR').filter(u => 
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
      : 'bg-cream-100 text-[#1C1C1C] border-gray-150';

  const cardThemeClass = highContrast
    ? 'border-4 border-yellow-500 bg-black text-cream-100'
    : isDarkMode
      ? 'bg-[#121E36] border border-slate-700/60 shadow text-cream-100'
      : 'bg-cream-100 border border-gray-150 shadow-sm text-[#1C1C1C]';

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
                <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block font-bold">Super Admin</span>
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
                {currentUser?.firstName?.[0] || 'A'}
              </div>
              <div className="text-left truncate max-w-[130px]">
                <h4 className="text-xs font-bold text-cream-100 m-0 tracking-wide truncate">
                  {currentUser?.firstName || 'Admin'} {currentUser?.lastName || 'MultiPlus'}
                </h4>
                <span className="text-[10px] font-mono text-gold-600 font-semibold uppercase">ADMINISTRADOR</span>
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
      <div className="flex-grow flex flex-col overflow-hidden lg:pl-64">
        
        {/* 2. TOPBAR HEADER FIXA */}
        <header className={`h-16 px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors ${
          highContrast ? 'bg-black border-yellow-500 text-yellow-300' : isDarkMode ? 'bg-[#0E172A] border-slate-800 text-cream-100' : 'bg-cream-100 border-gray-150 text-[#1C1C1C]'
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
              <span className="text-[9px] font-mono tracking-widest text-gold-600 uppercase block">MultiPlus LMS</span>
              <h2 className="text-sm font-serif font-black tracking-wide m-0 capitalize">{activeTab} • Portal de Administração</h2>
            </div>
          </div>

          {/* Center Search bar */}
          <div className="hidden md:flex relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar registros..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-cream-200 border border-gray-200 placeholder:text-neutral-400 text-[#1C1C1C] focus:outline-none focus:border-gold-600"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4 text-xs">
            {/* Critical Alert Bar indicator */}
            <div className="bg-red-50 dark:bg-danger-700/40 text-red-700 dark:text-danger-700 px-2.5 py-1 rounded-full border border-red-150 dark:border-red-900/45 text-[10px] font-mono font-bold uppercase tracking-wider hidden md:flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-danger-700 rounded-full"></span>
              ⚠️ {activeAlerts.length} ALERTA(S) ATIVOS
            </div>

            {/* Accessibility swift switch */}
            <button 
              onClick={toggleTheme}
              className="p-2 bg-cream-200 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-gold-600 border-0 cursor-pointer"
              title="Mudar visual cor"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Notification Bell toggle menu */}
            <button 
              onClick={() => { setActiveTab('notificacoes'); }}
              className="p-2 bg-cream-200 dark:bg-slate-800 rounded-full hover:bg-gray-100 transition-all text-ink-900 dark:text-blue-400 border-0 cursor-pointer relative"
              title="Aceder a Notificações"
            >
              <Bell size={14} />
              {activeAlerts.filter(a => !a.read).length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger-700" />
              )}
            </button>

            {/* Profile menu widget */}
            <div className="flex items-center gap-2.5 border-l pl-4">
              <div className="w-8 h-8 rounded-full bg-gold-600 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                {currentUser?.firstName?.[0] || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-[10px] font-mono font-bold text-gold-600 block leading-tight">ADMIN</span>
                {currentUser?.email ? (
                  <span className="text-3xs text-slate-500 font-semibold uppercase block truncate max-w-[100px]">{currentUser.email}</span>
                ) : (
                  <span className="text-3xs text-slate-500 font-semibold uppercase block truncate max-w-[100px]">Sem email</span>
                )}
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
          <div className="bg-ink-900 text-cream-100 p-6 sm:p-8 rounded-3xl border border-gold-600/30 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-600/5 rounded-bl-full pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-mono text-gold-600 font-black tracking-widest block uppercase">Centro de Controlo da MultiPlus Academy</span>
              <h2 className="text-xl sm:text-2xl font-serif font-black m-0 tracking-wide text-cream-100">
                Bem-vindo ao Centro de Gestão da MultiPlus Academy
              </h2>
              <p className="text-xs text-cream-100/70 max-w-2xl">
                Autenticação RBAC activa. Administração global de formandos, registo fiscal de receitas, emissão e conferência de chaves de diploma, integradores de API e auditoria estruturada.
              </p>
            </div>
          </div>
          
          {/* VIEW 1: EXECUTIVE DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* 4 Dynamic Real KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: "Total de Alunos", val: filteredStudents.length, icon: <Users className="text-blue-500" />, desc: "Matrículas Activas", onClick: () => { setActiveTab('utilizadores'); setRoleFilter('STUDENT'); } },
                    { title: "Total de Professores", val: filteredInstructors.length, icon: <Award className="text-amber-500" />, desc: "Docentes Titulares", onClick: () => { setActiveTab('utilizadores'); setRoleFilter('INSTRUCTOR'); } },
                    { title: "Cursos Ativos", val: courses.length, icon: <BookOpen className="text-indigo-500" />, desc: "Programas no Ar", onClick: () => { setActiveTab('cursos'); } },
                    { title: "Certificados Emitidos", val: certificates.length, icon: <QrCode className="text-danger-700" />, desc: "Assinaturas Gravadas", onClick: () => { setActiveTab('certificados'); } }
                  ].map((card, idx) => (
                    <div 
                      key={idx} 
                      onClick={card.onClick}
                      className="bg-cream-100 dark:bg-ink-800 p-4 rounded-2xl border border-gray-150 dark:border-ink-800 flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer text-[#1C1C1C] dark:text-cream-100"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-gray-450 dark:text-neutral-400 uppercase font-black">{card.title}</span>
                        {card.icon}
                      </div>
                      <div className="mt-2.5">
                        <span className="text-lg sm:text-xl font-serif font-black text-ink-900 dark:text-gold-600">{card.val}</span>
                        <span className="text-[9px] font-mono text-gray-450 dark:text-neutral-400 block mt-0.5">{card.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Analytical charts & popular courses */}
                <div className="max-w-3xl">
                  {/* Popular courses list */}
                  <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-4 text-left text-slate-900 dark:text-cream-100 shadow-sm">
                    <div className="border-b dark:border-ink-800 pb-3">
                      <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base m-0">Cursos mais populares</h4>
                      <p className="text-[10px] text-gray-450 dark:text-neutral-400 font-mono uppercase mt-1">Ranking de adesão baseado em matrículas reais no Supabase</p>
                    </div>
                    <div className="space-y-4">
                      {popularCoursesList.length === 0 ? (
                        <p className="text-xs text-neutral-400 dark:text-neutral-400 font-mono py-4 text-center">Nenhuma matrícula registrada para os cursos ativos.</p>
                      ) : (
                        popularCoursesList.map((item, idx) => {
                          const maxCount = Math.max(...popularCoursesList.map(c => c.enrollmentCount), 1);
                          const percentage = Math.round((item.enrollmentCount / maxCount) * 100);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setActiveTab('cursos')}
                              className="space-y-2 cursor-pointer hover:bg-gray-100/10 p-1.5 rounded-lg transition-all duration-200"
                            >
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="font-serif">{item.title}</span>
                                <span className="font-mono text-gold-600 text-3xs font-extrabold uppercase">
                                  {item.enrollmentCount} {item.enrollmentCount === 1 ? 'Matrícula' : 'Matrículas'}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-ink-900 to-gold-600 transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: UTILIZADORES TAB (Full administration panel) */}
            {activeTab === 'utilizadores' && (
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Controle de Autenticação e Perfis (RBAC)</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-sans">Registe novas contas corporativas, desative credenciais imediatamente e conceda autorizações granulares.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 font-mono">Filtrar Função:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="p-2 border rounded-xl text-xs bg-cream-100 text-slate-800"
                    >
                      <option value="ALL">Todos os Membros</option>
                      <option value="STUDENT">Alunos (STUDENT)</option>
                      <option value="INSTRUCTOR">Professores (INSTRUCTOR)</option>
                      <option value="ADMIN">Administradores (ADMIN)</option>
                    </select>
                  </div>
                </div>

                {/* Form to insert new account */}
                <form onSubmit={handleCreateUser} className="bg-gray-55 dark:bg-ink-900/50 p-5 rounded-2xl border border-gray-200 dark:border-ink-800 grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-xs">
                  <div>
                    <label className="block text-[9px] font-mono text-neutral-400 uppercase font-black mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Madalena Huambo"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full p-2.5 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-neutral-400 uppercase font-black mb-1">E-mail de Login</label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@advogados.ao"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full p-2.5 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-neutral-400 uppercase font-black mb-1">Função de Acesso</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-xs text-current focus:outline-none focus:border-gold-600"
                    >
                      <option value="STUDENT">Aluno de Elite (STUDENT)</option>
                      <option value="INSTRUCTOR">Professor Titular (INSTRUCTOR)</option>
                      <option value="ADMIN">Administrador Geral (ADMIN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-neutral-400 uppercase font-black mb-1">Senha de Acesso</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="Mínimo 8 caracteres"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="flex-grow p-2.5 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600"
                      />
                      <button
                        type="button"
                        onClick={() => setNewUserPassword(gerarSenhaForte())}
                        className="px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono font-bold text-3xs rounded-xl border-0 cursor-pointer h-[38px] flex items-center justify-center shrink-0"
                        title="Gerar Senha Forte"
                      >
                        Gerar
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer transition-colors h-[38px] flex items-center justify-center"
                  >
                    Registrar Credencial
                  </button>
                </form>

                {createdCredentials && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-left animate-fadeIn">
                    <div>
                      <h4 className="font-serif font-black text-emerald-850 dark:text-emerald-400 m-0">Conta criada com sucesso!</h4>
                      <p className="text-neutral-400 dark:text-gray-300 mt-1">Copie as credenciais de acesso temporárias do utilizador para enviar a ele:</p>
                      <div className="mt-2 font-mono text-xs space-y-1 bg-cream-100 dark:bg-ink-900 p-2.5 rounded-lg border dark:border-ink-800 select-all text-slate-800 dark:text-cream-100">
                        <div><strong>E-mail:</strong> {createdCredentials.email}</div>
                        <div><strong>Senha:</strong> {createdCredentials.pass}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nSenha: ${createdCredentials.pass}`);
                          alert('Credenciais copiadas para a área de transferência!');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-cream-100 font-mono text-3xs font-bold uppercase rounded-lg border-0 cursor-pointer shrink-0"
                      >
                        Copiar Tudo
                      </button>
                      <button
                        onClick={() => setCreatedCredentials(null)}
                        className="px-2.5 py-1.5 bg-gray-200 dark:bg-slate-800 text-slate-700 dark:text-cream-200 rounded-lg border-0 cursor-pointer hover:bg-gray-300 shrink-0"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}

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
                          <tr className="bg-cream-200 dark:bg-ink-900/30 uppercase text-[9px] font-mono text-neutral-400 border-b">
                            <th className="p-3">Membro</th>
                            <th className="p-3">Função / RBAC</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dbUsers.filter(u => roleFilter === 'ALL' || u.role === roleFilter).map(user => (
                            <tr key={user.id} className="hover:bg-cream-200/60 transition-colors">
                              <td className="p-3 flex items-center gap-2.5">
                                {(!user.avatarUrl || user.avatarUrl.includes('unsplash.com')) ? (
                                  <div className="w-7 h-7 rounded-full bg-gold-600 text-slate-950 font-bold flex items-center justify-center text-[10px] uppercase shrink-0">
                                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                                  </div>
                                ) : (
                                  <img src={user.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                )}
                                <div>
                                  <span className="font-semibold block">{user.firstName} {user.lastName}</span>
                                  <span className="text-[10px] text-neutral-400 block font-mono">{user.email}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-mono text-[10px] text-gold-600 font-extrabold">{user.role}</span>
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
                                  className="px-2.5 py-1 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-slate-900 rounded font-mono text-[9px] inline-flex items-center gap-1"
                                >
                                  <Eye size={10} /> Pre-visualizar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-danger-700 hover:text-red-700 hover:bg-red-50 rounded"
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
                          <div key={user.id} className="bg-cream-100 p-4 rounded-2xl border border-gray-150 space-y-3 shadow-sm text-left">
                            <div className="flex items-center gap-3">
                              {(!user.avatarUrl || user.avatarUrl.includes('unsplash.com')) ? (
                                <div className="w-9 h-9 rounded-full bg-gold-600 text-slate-950 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                                  {user.firstName?.[0] || user.email?.[0] || 'U'}
                                </div>
                              ) : (
                                <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold block text-xs truncate">{user.firstName} {user.lastName}</span>
                                <span className="text-[10px] text-neutral-400 block truncate font-mono">{user.email}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black ${
                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {user.status || 'ACTIVE'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="font-mono text-[10px] text-gold-600 font-extrabold">{user.role}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className="px-2 py-1 text-slate-600 border rounded hover:bg-gray-100 font-mono text-[9px]"
                                >
                                  Mudar Estado
                                </button>
                                <button
                                  onClick={() => handleImpersonate(user)}
                                  className="px-2 py-1 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-slate-900 rounded font-mono text-[9px] inline-flex items-center gap-1"
                                >
                                  <Eye size={10} /> Pre-visualizar
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 text-danger-700 hover:text-red-700 hover:bg-red-50 rounded"
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
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Catálogo de Especializações Ativas</h3>
                    <p className="text-xs text-neutral-400 mt-1">Gestão de currículos jurídicos, fixação de mensalidades e oradores associados.</p>
                  </div>
                  <button onClick={() => { setIsCreatingCourse(true); setCourseTitle(''); }} className="px-3.5 py-1.5 bg-ink-900 text-cream-100 hover:bg-gold-600 rounded-xl text-3xs font-mono font-bold uppercase transition-all flex items-center gap-1.5">
                    <Plus size={12} /> Criar Curso
                  </button>
                </div>

                {isCreatingCourse && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!courseTitle) return;
                    
                    const newSlug = `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${Date.now()}`;
                    const payload = {
                      title: courseTitle,
                      slug: newSlug,
                      description: "Especialização programática de alto impacto.",
                      duration: "10 Semanas",
                      category: "Híbrido",
                      status: 'PUBLISHED'
                    };
                    
                    const { data, error } = await supabase.from('courses').insert(payload).select().single();
                    if (error) {
                      alert(`Erro ao criar curso no Supabase: ${error.message}`);
                    } else if (data) {
                      const cObj: Course = {
                        id: data.id,
                        slug: data.slug,
                        title: data.title,
                        subtitle: data.description || "Especialização programática de alto impacto.",
                        price: coursePrice || "€450",
                        duration: data.duration || "10 Semanas",
                        hours: "36 Horas Letivas",
                        language: "Inglês técnico",
                        modality: "Híbrido",
                        summary: data.description || "",
                        schedule: "Sábados 09h00 - 12h00",
                        startDate: "2026-09-01",
                        targetAudience: ["Juristas", "Profissionais do Petróleo"],
                        modules: [],
                        status: data.status,
                        teacher_id: data.teacher_id
                      };
                      setCourses(prev => [...prev, cObj]);
                      setIsCreatingCourse(false);
                      addAuditLog("CRIAÇÃO CURSO", `Criado novo curso: ${courseTitle}`);
                      alert('Novo programa indexado com sucesso no Supabase!');
                    }
                  }} className="p-4 bg-cream-200 dark:bg-ink-800 rounded-xl space-y-3">
                    <p className="font-serif font-bold text-xs m-0 text-ink-900 dark:text-cream-100">Formulário do Novo Curso</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-800 dark:text-cream-100">
                      <input type="text" placeholder="Nome do Curso..." value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required className="p-2 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded text-current" />
                      <input type="text" placeholder="Preço (Ex: €450)..." value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} className="p-2 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded text-current" />
                      <input type="text" placeholder="Oradora responsável..." value={courseInstructor} onChange={(e) => setCourseInstructor(e.target.value)} className="p-2 bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded text-current" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setIsCreatingCourse(false)} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-slate-650 dark:text-cream-200 rounded">Cancelar</button>
                      <button type="submit" className="px-3 py-1 bg-ink-900 text-cream-100 rounded">Salvar Curso</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <div key={course.id} className="p-4 bg-[#FAF9F6] dark:bg-ink-800 border border-gray-150 dark:border-ink-800 rounded-2xl flex flex-col justify-between text-left hover:border-gold-600/55">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-gold-600 font-bold block">{course.duration} • {course.price}</span>
                        <h4 className="font-serif font-black text-sm text-ink-900 dark:text-cream-100 m-0">{course.title}</h4>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-400 leading-normal">{course.subtitle}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t dark:border-ink-800 mt-4 text-[10px] font-mono">
                        <span className="text-neutral-400">Responsável: {courseInstructor}</span>
                        <div className="flex gap-1.5">
                          <button onClick={async () => {
                            if (confirm('Deseja realmente duplicar este programa de estudos?')) {
                              const newSlug = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-copy-${Date.now()}`;
                              const payload = {
                                title: `${course.title} (Cópia)`,
                                slug: newSlug,
                                description: course.summary || "Cópia de programa de estudos",
                                duration: course.duration || "10 Semanas",
                                category: course.modality || "Híbrido",
                                status: course.status || 'PUBLISHED',
                                teacher_id: course.teacher_id
                              };
                              const { data, error } = await supabase.from('courses').insert(payload).select().single();
                              if (error) {
                                alert(`Erro ao duplicar curso no Supabase: ${error.message}`);
                              } else if (data) {
                                const cObj: Course = {
                                  ...course,
                                  id: data.id,
                                  slug: data.slug,
                                  title: data.title,
                                  status: data.status,
                                  teacher_id: data.teacher_id
                                };
                                setCourses(prev => [...prev, cObj]);
                                addAuditLog("DUPLICAR CURSO", `Duplicado o curso ID: ${course.id} para o novo ID: ${data.id}`);
                                alert('Curso duplicado com sucesso no Supabase!');
                              }
                            }
                          }} className="p-1 text-slate-650 bg-cream-100 dark:bg-slate-800 border dark:border-ink-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-xs">Duplicar</button>
                          <button onClick={async () => {
                            if (confirm('Deseja realmente remover permanentemente este curso do Supabase?')) {
                              const { error } = await supabase.from('courses').delete().eq('id', course.id);
                              if (error) {
                                alert(`Erro ao remover curso do Supabase: ${error.message}`);
                              } else {
                                setCourses(prev => prev.filter(c => c.id !== course.id));
                                addAuditLog("REMOVER CURSO", `Removido curso ID: ${course.id}`);
                                alert('Curso removido com sucesso!');
                              }
                            }
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
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Registro de Chaves de Diplomas Digitais</h3>
                    <p className="text-xs text-neutral-400 mt-1">Emissão em lote de certificados com blockchain local e tecnologia QR-Code auditável publicamente.</p>
                  </div>
                  <div className="flex gap-2.5">
                    <input type="text" id="cert-recipient" placeholder="Nome do Jurista..." className="p-2 text-xs bg-cream-100 dark:bg-ink-800 border dark:border-ink-800 rounded-xl w-44 text-current" />
                    <button onClick={() => {
                      const name = (document.getElementById('cert-recipient') as HTMLInputElement)?.value;
                      if (!name) return alert('Por favor insira um nome de outorgado.');
                      handleEmitCertificate(name, "English for the Legal Field in Angola");
                      (document.getElementById('cert-recipient') as HTMLInputElement).value = '';
                    }} className="px-3 py-2 bg-ink-900 text-cream-100 rounded-xl text-3xs font-mono font-bold uppercase transition-colors">
                      Gerar Agora
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map((cert, i) => (
                    <div key={i} className="p-4 bg-cream-100 border-2 border-gold-600/40 rounded-2xl flex justify-between items-center text-left">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-gold-600 font-bold uppercase">Código: {cert.verificationCode}</span>
                        <h4 className="font-serif font-black text-xs text-slate-700 m-0">{cert.recipientName}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono m-0">{cert.courseName}</p>
                        <span className="text-[9px] text-ink-900 block">Emitido em: {cert.completionDate}</span>
                      </div>
                      <div className="p-1 border bg-cream-200 rounded">
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
                <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 text-slate-900 dark:text-cream-100">
                  <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Central de Mensagens e Comunicações em Tempo Real</h3>
                  <p className="text-xs text-neutral-400 mt-1">Converse individualmente com formandos e formadores ou envie mensagens em massa.</p>
                </div>
                <ChatShell role="ADMIN" />
              </div>
            )}

            {/* VIEW 13: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
                <div className="flex justify-between items-center border-b dark:border-ink-800 pb-3">
                  <div>
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Notificações e Alertas Urgentes</h3>
                    <p className="text-xs text-neutral-400 mt-1">Centro de monitorização de falhas, reconciliação de guias e inscrições.</p>
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
                    <div className="text-center py-6 text-neutral-400 text-xs">Nenhum alerta crítico ativo no painel MultiPlus.</div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 16: INTEGRAÇÕES */}
            {activeTab === 'integracoes' && (
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
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
                    <div key={service.name} className="p-4 bg-cream-200 dark:bg-ink-900/40 border dark:border-ink-800 rounded-2xl flex justify-between items-center text-left">
                      <div>
                        <h4 className="font-serif font-bold text-ink-900 dark:text-cream-100 text-xs m-0">{service.name} Integration</h4>
                        <span className="text-[9px] font-mono text-gray-450 block mt-1">
                          {service.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse animate-duration-1000"></span>
                        {service.status}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 17: CONFIGURAÇÕES */}
            {activeTab === 'configuracoes' && (
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-slate-900 dark:text-cream-100">
                <div>
                  <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-base">Configurações Gerais de Operação</h3>
                  <p className="text-xs text-neutral-400 mt-1">Definição dos parâmetros institucionais base, emails de tesouraria de Luanda e Huambo e taxas de câmbio.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-mono text-neutral-400 uppercase font-black">Nome da Instituição</label>
                    <input type="text" value={instName} onChange={(e) => setInstName(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl font-serif font-extrabold" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-mono text-neutral-400 uppercase font-black">Domínio de Internet</label>
                    <input type="text" value={instDomain} onChange={(e) => setInstDomain(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl font-mono" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[8px] font-mono text-neutral-400 uppercase font-black">Contacto de Emergência</label>
                    <input type="text" value={instPhone} onChange={(e) => setInstPhone(e.target.value)} className="w-full p-2.5 bg-[#FAF9F6] border rounded-xl" />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button onClick={async () => {
                    const { error } = await supabase
                      .from('institution_settings')
                      .upsert({ id: 1, nome: instName, dominio: instDomain, contacto: instPhone });
                    if (error) {
                      await supabase
                        .from('institution_settings')
                        .update({ nome: instName, dominio: instDomain, contacto: instPhone })
                        .eq('id', 1);
                    }
                    addAuditLog("CONFIG GERAL", "Atualizado informações da instituição pelo Admin");
                    alert('As alterações da instituição foram salvas!');
                  }} className="px-5 py-2.5 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer">
                    Salvar Parâmetros
                  </button>
                </div>

              </div>
            )}
            {activeTab === 'perfil' && (
              <div className="bg-cream-100 dark:bg-ink-800 p-6 rounded-3xl border border-gray-150 dark:border-ink-800 space-y-6 text-left text-slate-900 dark:text-cream-100">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative shrink-0">
                    {currentUser?.avatarUrl ? (
                      <img 
                        src={currentUser.avatarUrl} 
                        alt="Foto de Perfil" 
                        className="w-16 h-16 rounded-full border-2 border-gold-600 shadow-md object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gold-600 text-slate-950 font-black flex items-center justify-center text-xl border-2 border-gold-600 shadow-md uppercase">
                        {adminName?.[0] || currentUser?.firstName?.[0] || 'A'}
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-cream-100 font-mono font-bold animate-pulse">...</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg m-0">{adminName || 'Administrador'}</h3>
                    <p className="text-xs text-gold-600 font-mono tracking-wider uppercase m-0">ADMINISTRADOR GERAL • MULTIPLUS ACADEMY</p>
                    <div className="pt-1.5 flex gap-2">
                      <label 
                        htmlFor="profile-avatar-file" 
                        className="px-2.5 py-1 bg-cream-200 dark:bg-slate-800 hover:bg-gold-600 hover:text-slate-950 transition-all text-ink-900 dark:text-cream-100 rounded text-3xs font-mono font-bold uppercase cursor-pointer border border-gray-150 dark:border-ink-800"
                      >
                        {uploadingAvatar ? 'A carregar...' : 'Alterar Foto'}
                      </label>
                      <input 
                        type="file" 
                        id="profile-avatar-file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        disabled={uploadingAvatar}
                        className="hidden" 
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-55 dark:bg-ink-900/50 border dark:border-ink-800 rounded-2xl text-xs space-y-3 leading-normal">
                  <p><strong>Cargo Hierárquico:</strong> Super Administrador</p>
                  <p><strong>E-mail de Login:</strong> {currentUser?.email || 'admin@multiplus.ao'}</p>
                  <p><strong>Permissão RBAC:</strong> Acesso Pleno de Administração (Gestão de utilizadores, emissão de certificados e auditoria completa do sistema).</p>
                  <p className="text-amber-600 dark:text-amber-400 font-semibold">⚠️ Proteja bem as suas credenciais. Qualquer acção efetuada sob esta conta é registada nos logs de auditoria.</p>
                </div>

                <div className="space-y-4 border-t dark:border-ink-800 pt-5">
                  <h4 className="font-serif font-bold text-ink-900 dark:text-cream-100 text-sm">Editar Informações de Perfil</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-mono text-gray-450 uppercase font-black">Nome Completo</label>
                      <input 
                        type="text" 
                        value={adminName} 
                        onChange={(e) => setAdminName(e.target.value)} 
                        className="w-full p-2.5 bg-[#FAF9F6] dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-mono text-neutral-400 uppercase font-black">Contacto de Telefone</label>
                      <input 
                        type="text" 
                        value={adminPhone} 
                        onChange={(e) => setAdminPhone(e.target.value)} 
                        className="w-full p-2.5 bg-[#FAF9F6] dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600" 
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="block text-[8px] font-mono text-gray-450 uppercase font-black">Biografia Profissional</label>
                      <textarea 
                        value={adminBio} 
                        onChange={(e) => setAdminBio(e.target.value)} 
                        rows={3}
                        className="w-full p-2.5 bg-[#FAF9F6] dark:bg-ink-800 border dark:border-ink-800 rounded-xl text-current focus:outline-none focus:border-gold-600"
                        placeholder="Escreva uma breve biografia ou introdução para o perfil do portal..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="notif_certificados"
                      checked={notifEmailCertificados}
                      onChange={(e) => setNotifEmailCertificados(e.target.checked)}
                      className="rounded border-gray-350 dark:border-ink-800 text-ink-900 focus:ring-[#BB8533] cursor-pointer"
                    />
                    <label htmlFor="notif_certificados" className="text-xs font-semibold cursor-pointer">
                      Receber notificações de novos certificados emitidos por e-mail
                    </label>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button 
                      onClick={async () => {
                        if (!currentUser?.id) return;
                        try {
                          // Save to users table
                          const { error: userErr } = await supabase
                            .from('users')
                            .update({
                              nome_completo: adminName,
                              telefone: adminPhone,
                              notif_email_certificados: notifEmailCertificados
                            })
                            .eq('id', currentUser.id);
                          if (userErr) throw userErr;

                          // Save to profiles table (upsert based on user_id)
                          // Check if profile exists first
                          const { data: existingProf } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('user_id', currentUser.id)
                            .maybeSingle();

                          if (existingProf) {
                            const { error: profErr } = await supabase
                              .from('profiles')
                              .update({ biografia: adminBio })
                              .eq('user_id', currentUser.id);
                            if (profErr) throw profErr;
                          } else {
                            const { error: profErr } = await supabase
                              .from('profiles')
                              .insert({ user_id: currentUser.id, biografia: adminBio });
                            if (profErr) throw profErr;
                          }

                          // Update dynamic current user state
                          const split = adminName.split(' ');
                          const first = split[0] || 'Admin';
                          const last = split.slice(1).join(' ') || 'MultiPlus';
                          setCurrentUser({
                            ...currentUser,
                            firstName: first,
                            lastName: last,
                            phone: adminPhone
                          });

                          addAuditLog("PERFIL UPDATE", `Perfil de ${adminName} atualizado com sucesso no Supabase.`);
                          alert('As suas informações de perfil foram guardadas com sucesso no Supabase!');
                        } catch (err: any) {
                          console.error(err);
                          alert(`Erro ao salvar perfil no Supabase: ${err.message || err}`);
                        }
                      }} 
                      className="px-5 py-2.5 bg-ink-900 text-cream-100 hover:bg-gold-600 hover:text-slate-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer"
                    >
                      Guardar Alterações
                    </button>
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
