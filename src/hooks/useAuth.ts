import { useState, useEffect } from 'react';
import { authService, SupabaseAuthUser } from '../services/supabase/authService';

export function useAuth() {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Fallback check on standard local storage
          const localUser = localStorage.getItem('multiplus_academic_user');
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              const roleMapping = parsed.role === 'INSTRUCTOR' ? 'PROFESSOR' : (parsed.role === 'ADMIN' ? 'ADMIN' : 'ALUNO');
              setUser({
                id: parsed.id,
                email: parsed.email,
                nome_completo: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.email,
                role: roleMapping as any,
                telefone: parsed.phone,
                foto_perfil: parsed.avatarUrl
              });
            } catch (err) {}
          }
        }
      } catch (err) {
        console.warn('Error loading core auth session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result?.user) {
        setUser(result.user);
        setSession(result.session);
        return result.user;
      }
      throw new Error('Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' = 'ALUNO') => {
    setLoading(true);
    try {
      const result = await authService.register(email, password, name, role);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    return await authService.recoverPassword(email);
  };

  return {
    user,
    session,
    loading,
    login,
    register,
    logout,
    recoverPassword
  };
}
