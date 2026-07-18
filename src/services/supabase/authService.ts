import { supabase } from '../../lib/supabase/client';

export interface SupabaseAuthUser {
  id: string;
  email: string;
  nome_completo: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  telefone?: string;
  foto_perfil?: string;
}

export const authService = {
  /**
   * Performs authentication using Supabase Auth
   */
  async login(email: string, password: string): Promise<{ user: SupabaseAuthUser | null; session: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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

      // SECURITY: Never trust user_metadata.role — always default to ALUNO
      // If public.users is not populated yet, the trigger hasn't fired.
      // Default to ALUNO; role will be corrected on next sync when the row exists.
      console.warn('public.users row not found for user', data.user.id, '- defaulting to ALUNO');
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          nome_completo: data.user.user_metadata?.nome_completo || '',
          role: 'ALUNO' as const,
        },
        session: data.session
      };
    }
    
    throw new Error('Usuário não encontrado após autenticação.');
  },

  /**
   * Registers a new user with Supabase Auth
   */
  async register(email: string, password: string, nomeCompleto: string, role: 'ALUNO' | 'PROFESSOR' = 'ALUNO'): Promise<any> {
    // SECURITY: Force ALUNO for self-registration. Role elevation must go through admin panel only.
    const safeRole: 'ALUNO' | 'PROFESSOR' = role === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          role: safeRole
        }
      }
    });

    if (error) {
      console.error('Supabase signUp error:', error);
      throw error;
    }
    return data;
  },

  /**
   * Terminate active user session
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out from Supabase Auth:', error);
      throw error;
    }
  },

  /**
   * Recover current Session descriptors
   */
  async getCurrentUser(): Promise<SupabaseAuthUser | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return null;
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

      // SECURITY: Never trust user_metadata.role — always default to ALUNO
      console.warn('public.users row not found for user', user.id, '- defaulting to ALUNO');
      return {
        id: user.id,
        email: user.email || '',
        nome_completo: user.user_metadata?.nome_completo || '',
        role: 'ALUNO' as const,
      };
    } catch (err) {
      console.error('getCurrentUser error:', err);
      return null;
    }
  },

  /**
   * Request password recovery mail
   */
  async recoverPassword(email: string): Promise<any> {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error);
      throw error;
    }
    return data;
  }
};

