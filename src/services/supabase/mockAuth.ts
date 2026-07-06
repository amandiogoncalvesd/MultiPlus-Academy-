export interface SupabaseAuthUser {
  id: string;
  email: string;
  nome_completo: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  telefone?: string;
  foto_perfil?: string;
}

export const INITIAL_MOCK_USERS = [
  {
    id: 'mock-admin-id',
    email: 'admin@multiplusacademy.com',
    password: 'Admin@123',
    nome_completo: 'Administrador Geral',
    role: 'ADMIN' as const
  },
  {
    id: 'mock-professor-id',
    email: 'professor@multiplusacademy.com',
    password: 'Professor@123',
    nome_completo: 'Professor MultiPlus',
    role: 'PROFESSOR' as const
  },
  {
    id: 'mock-aluno-id',
    email: 'aluno@multiplusacademy.com',
    password: 'Aluno@123',
    nome_completo: 'Aluno de Elite',
    role: 'ALUNO' as const
  }
];

export function getMockUsers() {
  if (typeof window === 'undefined') return INITIAL_MOCK_USERS;
  const stored = localStorage.getItem('multiplus_mock_users');
  if (!stored) {
    localStorage.setItem('multiplus_mock_users', JSON.stringify(INITIAL_MOCK_USERS));
    return INITIAL_MOCK_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_MOCK_USERS;
  }
}

export function saveMockUser(user: any) {
  if (typeof window === 'undefined') return;
  const users = getMockUsers();
  if (!users.some((u: any) => u.email.toLowerCase() === user.email.toLowerCase())) {
    users.push(user);
    localStorage.setItem('multiplus_mock_users', JSON.stringify(users));
  }
}

export async function mockLogin(email: string, pass: string): Promise<{ user: SupabaseAuthUser; session: any }> {
  const users = getMockUsers();
  const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
  if (!found) {
    throw new Error('As credenciais introduzidas estão incorretas ou a conta não existe no ambiente de testes.');
  }
  
  const mockUser: SupabaseAuthUser = {
    id: found.id,
    email: found.email,
    nome_completo: found.nome_completo,
    role: found.role
  };
  
  const mockSession = {
    user: {
      id: found.id,
      email: found.email,
      user_metadata: {
        nome_completo: found.nome_completo,
        role: found.role
      }
    },
    access_token: 'mock-jwt-token'
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('multiplus_mock_session', JSON.stringify(mockSession));
  }
  
  return { user: mockUser, session: mockSession };
}

export async function mockRegister(email: string, pass: string, name: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO'): Promise<any> {
  const users = getMockUsers();
  if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Este endereço de correio eletrónico já está registado.');
  }
  
  const newId = `mock-user-${Date.now()}`;
  const newUser = {
    id: newId,
    email: email.toLowerCase(),
    password: pass,
    nome_completo: name,
    role: role
  };
  
  saveMockUser(newUser);
  return {
    user: {
      id: newId,
      email: email.toLowerCase(),
      user_metadata: {
        nome_completo: name,
        role: role
      }
    }
  };
}

export async function mockLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('multiplus_mock_session');
  }
}

export async function mockGetCurrentUser(): Promise<SupabaseAuthUser | null> {
  if (typeof window === 'undefined') return null;
  const sessionStr = localStorage.getItem('multiplus_mock_session');
  if (!sessionStr) return null;
  try {
    const session = JSON.parse(sessionStr);
    const users = getMockUsers();
    const found = users.find((u: any) => u.id === session.user.id);
    if (found) {
      return {
        id: found.id,
        email: found.email,
        nome_completo: found.nome_completo,
        role: found.role
      };
    }
    return {
      id: session.user.id,
      email: session.user.email || '',
      nome_completo: session.user.user_metadata?.nome_completo || '',
      role: session.user.user_metadata?.role || 'ALUNO'
    };
  } catch {
    return null;
  }
}
