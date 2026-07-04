import { supabase, isSupabaseMock } from '../../lib/supabase/client';

export interface SupabaseAuthUser {
  id: string;
  email: string;
  nome_completo: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  telefone?: string;
  foto_perfil?: string;
}

// Overridable flag if a query fails at runtime with "Invalid API key"
let runtimeMockFallback = false;

const INITIAL_MOCK_USERS = [
  {
    id: 'mock-admin-id',
    email: 'admin@multiplusacademy.com',
    password: 'Admin@12345',
    nome_completo: 'Administrador Geral',
    role: 'ADMIN' as const
  },
  {
    id: 'mock-professor-id',
    email: 'professor@multiplusacademy.com',
    password: 'Professor@12345',
    nome_completo: 'Professor MultiPlus',
    role: 'PROFESSOR' as const
  },
  {
    id: 'mock-aluno-id',
    email: 'aluno@multiplusacademy.com',
    password: 'Aluno@12345',
    nome_completo: 'Aluno de Elite',
    role: 'ALUNO' as const
  }
];

function getMockUsers() {
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

function saveMockUser(user: any) {
  if (typeof window === 'undefined') return;
  const users = getMockUsers();
  if (!users.some((u: any) => u.email.toLowerCase() === user.email.toLowerCase())) {
    users.push(user);
    localStorage.setItem('multiplus_mock_users', JSON.stringify(users));
  }
}

async function mockLogin(email: string, pass: string): Promise<{ user: SupabaseAuthUser; session: any }> {
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

async function mockRegister(email: string, pass: string, name: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO'): Promise<any> {
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

async function mockLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('multiplus_mock_session');
  }
}

async function mockGetCurrentUser(): Promise<SupabaseAuthUser | null> {
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

export const authService = {
  /**
   * Performs authentication using Supabase Auth with Mock Fallback
   */
  async login(email: string, password: string): Promise<{ user: SupabaseAuthUser | null; session: any }> {
    if (isSupabaseMock || runtimeMockFallback) {
      console.log('Using Mock Auth Login fallback...');
      return await mockLogin(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Automatically switch to mock fallback if credentials are invalid or database is unconfigured
        if (error.message?.includes('API key') || error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          console.warn('Supabase returned API key error. Activating mock login fallback...');
          runtimeMockFallback = true;
          return await mockLogin(email, password);
        }
        console.error('Supabase signInWithPassword error:', error);
        throw error;
      }

      if (data?.user) {
        // Fetch detailed profile mapping from public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!userError && userData) {
          return {
            user: {
              id: userData.id,
              email: userData.email,
              nome_completo: userData.nome_completo || '',
              role: userData.role as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
              telefone: userData.telefone,
              foto_perfil: userData.foto_perfil
            },
            session: data.session
          };
        }

        // If public.users is not populated yet, build from user metadata
        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            nome_completo: data.user.user_metadata?.nome_completo || '',
            role: (data.user.user_metadata?.role || 'ALUNO') as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
          },
          session: data.session
        };
      }
      
      throw new Error('Usuário não encontrado após autenticação.');
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('Invalid API key')) {
        runtimeMockFallback = true;
        return await mockLogin(email, password);
      }
      throw err;
    }
  },

  /**
   * Registers a new user with Supabase Auth or Mock Fallback
   */
  async register(email: string, password: string, nomeCompleto: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO' = 'ALUNO'): Promise<any> {
    if (isSupabaseMock || runtimeMockFallback) {
      console.log('Using Mock Auth Register fallback...');
      return await mockRegister(email, password, nomeCompleto, role);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto,
            role: role
          }
        }
      });

      if (error) {
        if (error.message?.includes('API key') || error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          console.warn('Supabase returned API key error during sign up. Activating mock fallback...');
          runtimeMockFallback = true;
          return await mockRegister(email, password, nomeCompleto, role);
        }
        console.error('Supabase signUp error:', error);
        throw error;
      }
      return data;
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('Invalid API key')) {
        runtimeMockFallback = true;
        return await mockRegister(email, password, nomeCompleto, role);
      }
      throw err;
    }
  },

  /**
   * Terminate active user session
   */
  async logout(): Promise<void> {
    if (isSupabaseMock || runtimeMockFallback) {
      await mockLogout();
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out from Supabase Auth:', error);
        throw error;
      }
    } catch (err) {
      await mockLogout();
    }
  },

  /**
   * Recover current Session descriptors
   */
  async getCurrentUser(): Promise<SupabaseAuthUser | null> {
    if (isSupabaseMock || runtimeMockFallback) {
      return await mockGetCurrentUser();
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return await mockGetCurrentUser();
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!userError && userData) {
        return {
          id: userData.id,
          email: userData.email,
          nome_completo: userData.nome_completo,
          role: userData.role as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
          telefone: userData.telefone,
          foto_perfil: userData.foto_perfil
        };
      }

      return {
        id: user.id,
        email: user.email || '',
        nome_completo: user.user_metadata?.nome_completo || '',
        role: (user.user_metadata?.role || 'ALUNO') as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
      };
    } catch (err) {
      return await mockGetCurrentUser();
    }
  },

  /**
   * Request password recovery mail
   */
  async recoverPassword(email: string): Promise<any> {
    if (isSupabaseMock || runtimeMockFallback) {
      return { success: true, message: 'Recovery email simulated.' };
    }
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Supabase resetPasswordForEmail error:', error);
        throw error;
      }
      return data;
    } catch (err) {
      return { success: true, message: 'Recovery email simulated after error.' };
    }
  }
};
