import { supabase, isSupabaseMock } from '../../lib/supabase/client';
import {
  SupabaseAuthUser,
  mockLogin,
  mockRegister,
  mockLogout,
  mockGetCurrentUser,
} from './mockAuth';

export type { SupabaseAuthUser };

// Overridable flag if a query fails at runtime with "Invalid API key"
let runtimeMockFallback = false;

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
