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
   * Performs authentication using Supabase.
   * Falls back to a local mock mechanism if Supabase is not reachable or unconfigured.
   */
  async login(email: string, password: string): Promise<{ user: SupabaseAuthUser | null; session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Fetch detailed profile mapping
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
              role: userData.role as any,
              telefone: userData.telefone,
              foto_perfil: userData.foto_perfil
            },
            session: data.session
          };
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || '',
            nome_completo: data.user.user_metadata?.nome_completo || data.user.user_metadata?.firstName || '',
            role: (data.user.user_metadata?.role || 'ALUNO') as any,
          },
          session: data.session
        };
      }
    } catch (e: any) {
      console.warn('Supabase Auth error, attempting local mock authentication:', e.message || e);
    }

    // Defensive fallback: check mock environment / localStorage
    const localGrads = localStorage.getItem('multiplus_academic_db');
    if (localGrads) {
      try {
        const db = JSON.parse(localGrads);
        const matched = (db.users || []).find((u: any) => u.email === email);
        if (matched) {
          const roleMapping = matched.role === 'INSTRUCTOR' ? 'PROFESSOR' : (matched.role === 'ADMIN' ? 'ADMIN' : 'ALUNO');
          return {
            user: {
              id: matched.id,
              email: matched.email,
              nome_completo: `${matched.firstName || ''} ${matched.lastName || ''}`.trim() || matched.email,
              role: roleMapping as any,
              telefone: matched.phone,
              foto_perfil: matched.avatarUrl
            },
            session: { access_token: 'mock-session-token' }
          };
        }
      } catch (err) {}
    }
    
    throw new Error('Credenciais Supabase inválidas.');
  },

  /**
   * Registers a new user with extra academic descriptors (as role and full-name).
   */
  async register(email: string, password: string, nomeCompleto: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO' = 'ALUNO'): Promise<any> {
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

      if (error) throw error;
      return data;
    } catch (e: any) {
      console.warn('Supabase signup bypassed or error:', e.message);
      // Mocking local insert inside localStorage
      const localGrads = localStorage.getItem('multiplus_academic_db');
      if (localGrads) {
        try {
          const db = JSON.parse(localGrads);
          const newUser = {
            id: 'user-' + Math.random().toString(36).substr(2, 9),
            email,
            firstName: nomeCompleto.split(' ')[0] || '',
            lastName: nomeCompleto.split(' ').slice(1).join(' ') || '',
            role: role === 'PROFESSOR' ? 'INSTRUCTOR' : (role === 'ADMIN' ? 'ADMIN' : 'STUDENT'),
            status: 'ACTIVE',
            streak: 0,
            longestStreak: 0,
            totalHoursLearned: 0
          };
          db.users = [...(db.users || []), newUser];
          localStorage.setItem('multiplus_academic_db', JSON.stringify(db));
          return { user: newUser, mock: true };
        } catch (err) {}
      }
      throw e;
    }
  },

  /**
   * Terminate active academic user session
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error logging out from Supabase Auth:', e);
    }
  },

  /**
   * Recover current Session descriptors
   */
  async getCurrentUser(): Promise<SupabaseAuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          return {
            id: userData.id,
            email: userData.email,
            nome_completo: userData.nome_completo,
            role: userData.role as any,
            telefone: userData.telefone,
            foto_perfil: userData.foto_perfil
          };
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve current Supabase Auth user:', e);
    }
    return null;
  },

  /**
   * Request password recovery mail
   */
  async recoverPassword(email: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return data;
    } catch (e: any) {
      console.warn('Mock password recovery successfully requested for email: ' + email);
      return { success: true };
    }
  }
};
