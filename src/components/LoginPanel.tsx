import { useState, FormEvent } from 'react';
import { PageId, User, UserRole } from '../types';
import { ShieldCheck, Mail, Lock, UserCheck, Key, RefreshCw, GraduationCap, UserPlus, FileCheck } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import StarBorder from './ui/StarBorder';

interface LoginPanelProps {
  setCurrentPage: (page: PageId) => void;
}

export default function LoginPanel({ setCurrentPage }: LoginPanelProps) {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('ALUNO');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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

        const dbRole: 'ALUNO' | 'PROFESSOR' = userRole === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';

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
    if (role === 'ALUNO') {
      setCurrentPage('student-dashboard');
    } else if (role === 'PROFESSOR') {
      setCurrentPage('instructor-dashboard');
    } else if (role === 'ADMIN') {
      setCurrentPage('admin-dashboard');
    }
  };

  return (
    <div id="login-panel-root" className="bg-white text-slate-800 pt-28 pb-16 min-h-screen flex flex-col justify-center items-center">
      <div className="max-w-6xl w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch text-left">
        
        {/* Left Column: Traditional Form */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <StarBorder
            as="div"
            speed="6s"
            thickness={2}
            className="w-full rounded-3xl overflow-hidden shadow-sm"
            innerClassName="relative z-1 p-8 sm:p-10 rounded-3xl bg-white w-full border border-slate-200"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#C89B3C]" />
            
            <div className="space-y-6 text-left">
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                <img
                  src="https://res.cloudinary.com/deeki0eou/image/upload/v1782520965/multiplus-academy-logo-com-fundo-branco_wy9sw4.jpg"
                  alt="MultiPlus Academy"
                  className="h-20 w-auto object-contain rounded-xl mb-4 p-1 border border-slate-200 bg-white"
                />
                <span className="text-[10px] font-mono tracking-widest text-[#C89B3C] uppercase block mb-1 font-bold">Acesso Restrito</span>
                <h1 className="text-2xl font-serif font-black text-slate-900 leading-tight m-0">
                  {isRegister ? 'Criar Conta Académica' : 'Área de Membros'}
                </h1>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Nome</label>
                      <input
                        type="text"
                        required
                        placeholder="António"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white text-slate-900 placeholder-slate-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Sobrenome</label>
                      <input
                        type="text"
                        required
                        placeholder="Carvalho"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white text-slate-900 placeholder-slate-400 shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Correio Eletrónico</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@gabinete.ao"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white text-slate-900 placeholder-slate-400 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Palavra-passe</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Senha do portal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white text-slate-900 placeholder-slate-400 shadow-2xs"
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Telemóvel (Opcional)</label>
                      <input
                        type="tel"
                        placeholder="+244 9xx xxx xxx"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] focus:bg-white text-slate-900 placeholder-slate-400 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Tipo de Acesso</label>
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value as UserRole)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-sans focus:outline-none focus:border-[#C89B3C] text-slate-900 shadow-2xs"
                      >
                        <option value="ALUNO">Aluno de Elite</option>
                        <option value="PROFESSOR">Corpo de Formadores</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <StarBorder
                    as="button"
                    type="submit"
                    disabled={loading}
                    speed="4s"
                    thickness={2}
                    className="w-full rounded-xl overflow-hidden cursor-pointer shadow-md"
                    innerClassName="relative z-1 w-full py-3.5 bg-[#0A2E5D] hover:bg-[#123C73] text-white text-xs font-mono font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-2"
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
                  </StarBorder>
                </div>
              </form>

              {/* Toggle Trigger */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-400 font-semibold">
                <span>
                  {isRegister ? 'Já possui conta letiva?' : 'Novo por estas paragens?'}
                </span>
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-mono uppercase font-bold text-[#C89B3C] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  {isRegister ? 'Inicie Sessão' : 'Registar Conta'}
                </button>
              </div>

            </div>
          </StarBorder>
        </div>

        {/* Right Column: Informação Institucional */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C89B3C] block">Portal Académico</span>
            <h2 className="text-3xl font-serif font-black text-slate-900 leading-tight m-0">MultiPlus Academy LMS</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-sans m-0 font-medium">
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
              <StarBorder
                key={idx}
                as="div"
                speed="8s"
                thickness={1.5}
                className="rounded-2xl overflow-hidden shadow-3xs text-left"
                innerClassName="relative z-1 bg-white p-5 rounded-2xl flex items-start gap-4 w-full h-full text-left"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 text-[#C89B3C]">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-black text-slate-900 text-sm m-0 leading-tight">{feature.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans m-0 font-medium">{feature.desc}</p>
                </div>
              </StarBorder>
            ))}
          </div>

          <StarBorder
            as="div"
            speed="12s"
            thickness={1.5}
            className="rounded-2xl overflow-hidden"
            innerClassName="relative z-1 p-4 bg-slate-50 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500 leading-normal text-left w-full"
          >
            <Key size={14} className="text-[#C89B3C] mt-0.5 flex-shrink-0" />
            <span className="font-medium">
              <strong>Padrão de Segurança Estrito:</strong> A plataforma utiliza criptografia ponta a ponta e Row Level Security (RLS) PostgreSQL para manter os dados de estudantes e formadores 100% privados e em conformidade corporativa.
            </span>
          </StarBorder>

        </div>

      </div>
    </div>
  );
}
