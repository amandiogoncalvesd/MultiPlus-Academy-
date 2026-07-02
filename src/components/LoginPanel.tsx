import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { PageId, User, UserRole } from '../types';
import { ShieldCheck, Mail, Lock, UserCheck, Key, RefreshCw, GraduationCap, ArrowRight, UserPlus, FileCheck } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface LoginPanelProps {
  setCurrentPage: (page: PageId) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export default function LoginPanel({ setCurrentPage, currentUser, setCurrentUser }: LoginPanelProps) {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState('');

  const handleTestUserClick = async (emailAddr: string, pass: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => {
    setErrorMsg('');
    setSeedingStatus(`A verificar conta ${emailAddr}...`);
    setLoading(true);
    try {
      // Try to sign in
      try {
        const authUser = await signIn(emailAddr, pass);
        setSeedingStatus('');
        routeAccordingToRole(authUser.role);
      } catch (loginErr: any) {
        console.log(`Test user ${emailAddr} not found or login failed. Attempting registration...`, loginErr);
        setSeedingStatus(`A criar conta de teste para ${name}...`);
        
        await signUp(emailAddr, pass, name, role);
        
        // Wait 1.5s to let the database trigger complete user mapping
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        setSeedingStatus(`A autenticar ${emailAddr}...`);
        const authUser = await signIn(emailAddr, pass);
        setSeedingStatus('');
        routeAccordingToRole(authUser.role);
      }
    } catch (err: any) {
      console.error('Error seeding test user:', err);
      setErrorMsg(`Erro ao preparar ou aceder à conta de teste: ${err?.message || err}`);
      setSeedingStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        // Registration Flow
        if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
          setErrorMsg('Preencha todos os campos obrigatórios.');
          setLoading(false);
          return;
        }

        const dbRole: 'ALUNO' | 'PROFESSOR' | 'ADMIN' = 
          userRole === 'STUDENT' ? 'ALUNO' : 
          userRole === 'INSTRUCTOR' ? 'PROFESSOR' : 'ADMIN';

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        // Attempt real Supabase sign up
        await signUp(email.trim(), password, fullName, dbRole);
        // Automate sign-in right after registration
        const authUser = await signIn(email.trim(), password);
        routeAccordingToRole(authUser.role);
      } else {
        // Login Flow
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Preencha o correio eletrónico e palavra-passe.');
          setLoading(false);
          return;
        }
        const authUser = await signIn(email.trim(), password);
        routeAccordingToRole(authUser.role);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erro inesperado durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const routeAccordingToRole = (role: UserRole) => {
    if (role === 'STUDENT') {
      setCurrentPage('student-dashboard');
    } else if (role === 'INSTRUCTOR') {
      setCurrentPage('instructor-dashboard');
    } else if (role === 'ADMIN') {
      setCurrentPage('admin-dashboard');
    }
  };

  return (
    <div id="login-panel-root" className="bg-[#F8F8F6] text-[#1C1C1C] pt-28 pb-16 min-h-screen flex flex-col justify-center items-center">
      <div className="max-w-6xl w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        
        {/* Left Column: Traditional Form */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="neo-card p-8 sm:p-10 rounded-3xl bg-white border border-gray-150 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C89B3C]" />
            
            <div className="space-y-6 text-left">
              <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <img
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520965/multiplus-academy-logo-com-fundo-branco_wy9sw4.jpg"
                  alt="MultiPlus Academy"
                  className="h-20 w-auto object-contain rounded-xl mb-4 p-1 border border-gray-100 bg-white"
                />
                <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1">Acesso Restrito</span>
                <h1 className="text-2xl font-serif font-black text-[#0A2E5D] leading-tight m-0">
                  {isRegister ? 'Criar Conta Académica' : 'Área de Membros'}
                </h1>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Nome</label>
                      <input
                        type="text"
                        required
                        placeholder="António"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full neo-input rounded-xl py-2.5 px-4 text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Sobrenome</label>
                      <input
                        type="text"
                        required
                        placeholder="Carvalho"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full neo-input rounded-xl py-2.5 px-4 text-xs font-sans"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Correio Eletrónico</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@gabinete.ao"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full neo-input rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Palavra-passe</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      placeholder="Senha do portal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full neo-input rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans"
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Telemóvel (Opcional)</label>
                      <input
                        type="tel"
                        placeholder="+244 9xx xxx xxx"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        className="w-full neo-input rounded-xl py-2.5 px-4 text-xs font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider mb-1.5">Tipo de Acesso</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value as UserRole)}
                        className="w-full neo-input rounded-xl py-2.5 px-4 text-xs font-sans bg-white"
                      >
                        <option value="STUDENT">Aluno de Elite</option>
                        <option value="INSTRUCTOR">Corpo de Formadores</option>
                        <option value="ADMIN">Administrador Geral</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono font-bold uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      A Autenticar no Supabase Auth...
                    </>
                  ) : (
                    <>
                      {isRegister ? <UserPlus size={14} /> : <UserCheck size={14} />}
                      {isRegister ? 'Criar Conta de Membro' : 'Aceder à Minha Vaga'}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Trigger */}
              <div className="pt-6 border-t border-gray-150 flex items-center justify-between text-xs font-sans text-gray-500">
                <span>
                  {isRegister ? 'Já possui conta letiva?' : 'Novo por estas paragens?'}
                </span>
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-mono uppercase font-bold text-[#C89B3C] hover:underline"
                >
                  {isRegister ? 'Inicie Sessão' : 'Registar Conta'}
                </button>
              </div>

              {/* Ambiente de Desenvolvimento: Contas de Teste */}
              <div className="pt-6 border-t border-gray-150 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#C89B3C]" />
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider">
                    Ambiente de Testes / Desenvolvimento
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-500 leading-normal font-sans">
                  Clique para aceder instantaneamente. Se a conta não existir no Supabase Auth, ela será criada e vinculada automaticamente com as permissões corretas.
                </p>

                {seedingStatus && (
                  <div className="p-3 rounded-xl bg-[#0A2E5D]/5 border border-[#0A2E5D]/10 flex items-center gap-2 text-xs text-[#0A2E5D] font-mono">
                    <RefreshCw size={12} className="animate-spin text-[#C89B3C]" />
                    <span>{seedingStatus}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      label: 'Administrador',
                      email: 'admin@multiplusacademy.com',
                      pass: 'Admin@12345',
                      name: 'Administrador Geral',
                      role: 'ADMIN' as const,
                      color: 'border-red-100 bg-red-50/10 text-red-700'
                    },
                    {
                      label: 'Formador (Professor)',
                      email: 'professor@multiplusacademy.com',
                      pass: 'Professor@12345',
                      name: 'Professor MultiPlus',
                      role: 'PROFESSOR' as const,
                      color: 'border-blue-100 bg-blue-50/10 text-blue-700'
                    },
                    {
                      label: 'Formando (Aluno)',
                      email: 'aluno@multiplusacademy.com',
                      pass: 'Aluno@12345',
                      name: 'Aluno de Elite',
                      role: 'ALUNO' as const,
                      color: 'border-emerald-100 bg-emerald-50/10 text-emerald-700'
                    }
                  ].map((testUser) => (
                    <button
                      key={testUser.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleTestUserClick(testUser.email, testUser.pass, testUser.name, testUser.role)}
                      className="w-full text-left p-3 rounded-xl border border-gray-150 hover:border-[#C89B3C] hover:bg-gray-50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${testUser.color}`}>
                            {testUser.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            {testUser.pass}
                          </span>
                        </div>
                        <div className="text-[11px] font-sans font-medium text-gray-700">
                          {testUser.email}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#C89B3C] flex items-center gap-1 self-end sm:self-auto">
                        Aceder <ArrowRight size={10} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Informação Institucional */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C]">Portal Académico</span>
            <h2 className="text-3xl font-serif font-black text-[#0A2E5D] leading-tight">MultiPlus Academy LMS</h2>
            <p className="text-sm text-gray-500 leading-relaxed font-sans">
              O portal institucional de ensino letivo para juristas e profissionais de elite em Angola. Através de uma autenticação robusta integrada ao Supabase, garantimos privacidade de dados e conformidade pedagógica total.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Acompanhamento de Elite',
                desc: 'Acompanhe as suas aulas assistidas, faça anotações em tempo real e descarregue materiais exclusivos anexados.',
                icon: <GraduationCap size={18} className="text-[#C89B3C]" />
              },
              {
                title: 'Secretaria Digital',
                desc: 'Gerencie o seu histórico escolar, consulte as ementas dos cursos e comprove as suas notas diretamente online.',
                icon: <FileCheck size={18} className="text-[#C89B3C]" />
              },
              {
                title: 'Certificados Verificáveis',
                desc: 'Ao concluir as disciplinas, obtenha certificados com código único de validação e verificação criptográfica por QR Code.',
                icon: <ShieldCheck size={18} className="text-[#C89B3C]" />
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-start gap-4 text-left"
              >
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-black text-[#0A2E5D] text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#0A2E5D]/5 border border-[#0A2E5D]/10 rounded-2xl flex items-start gap-2 text-xs text-gray-500 leading-normal">
            <Key size={14} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
            <span>
              <strong>Padrão de Segurança Estrito:</strong> A plataforma utiliza criptografia ponta a ponta e Row Level Security (RLS) PostgreSQL para manter os dados de estudantes e formadores 100% privados e em conformidade corporativa.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
