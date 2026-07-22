import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { authService } from '../../services/supabase/authService';
import { userService, SupabaseUserProfile } from '../../services/supabase/userService';
import { User, UserRole } from '../../types';
import { mapSupabaseUserToAppUser } from '../../lib/utils/userMapper';

interface AuthContextType {
  user: User | null;
  session: any;
  profile: SupabaseUserProfile | null;
  role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<User> | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, onPageRedirect }: { children: React.ReactNode, onPageRedirect?: (page: any) => void }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<SupabaseUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Map local UserRole to Supabase role
  const mapLocalRole = (localRole: UserRole): 'ADMIN' | 'PROFESSOR' | 'ALUNO' => {
    if (localRole === 'ADMIN') return 'ADMIN';
    if (localRole === 'PROFESSOR') return 'PROFESSOR';
    return 'ALUNO';
  };

  const updateUser = (updates: Partial<User> | null) => {
    setCurrentUser(prev => updates === null ? null : (prev ? { ...prev, ...updates } : prev));
  };

  // Calcular métricas reais de progresso do aluno
  const calculateUserMetrics = async (userId: string): Promise<{
    streak: number;
    longestStreak: number;
    totalHoursLearned: number;
  }> => {
    try {
      // Buscar progresso das aulas completadas
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('created_at, video_progress_seconds')
        .eq('student_id', userId)
        .eq('completed', true);

      if (!progressData || progressData.length === 0) {
        return { streak: 0, longestStreak: 0, totalHoursLearned: 0 };
      }

      // Calcular total de horas assistidas (a partir de video_progress_seconds)
      const totalSeconds = progressData.reduce((acc: number, p: any) => acc + (p.video_progress_seconds || 0), 0);
      const totalHoursLearned = Math.round(totalSeconds / 3600);

      // Calcular streak (dias consecutivos de atividade)
      const uniqueDays = [...new Set(
        progressData.map((p: any) => new Date(p.created_at).toISOString().split('T')[0])
      )].sort().reverse();

      let longestStreak = 0;
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      const sortedDays = [...uniqueDays].sort();
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      // Verificar se o streak atual está ativo (último dia é hoje ou ontem)
      const lastDay = sortedDays[sortedDays.length - 1];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const streak = (lastDay === today || lastDay === yesterday) ? currentStreak : 0;

      return { streak, longestStreak, totalHoursLearned };
    } catch (err) {
      console.warn('Erro ao calcular métricas do utilizador:', err);
      return { streak: 0, longestStreak: 0, totalHoursLearned: 0 };
    }
  };

  const syncAuthSession = async () => {
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      setSession(sbSession);
      
      if (sbSession?.user) {
        // Fetch custom user profile info
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', sbSession.user.id)
          .single();

        if (userData) {
          const localUser = mapSupabaseUserToAppUser(userData);
          setCurrentUser(localUser);
          
          // Calcular métricas reais de forma assíncrona
          calculateUserMetrics(userData.id).then(metrics => {
            setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
          });

          // Load extra profile
          const profileData = await userService.getUserProfile(userData.id);
          setUserProfile(profileData);
        } else {
          // SECURITY: Never trust user_metadata.role — always default to ALUNO
          // The public.users row may not exist yet if the trigger hasn't fired.
          // On next sync, the correct role will be read from public.users.
          const uMeta = sbSession.user.user_metadata;
          const fallbackUser = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            nome_completo: uMeta?.nome_completo || `${uMeta?.firstName || ''} ${uMeta?.lastName || ''}`.trim(),
            role: 'ALUNO',
            foto_perfil: uMeta?.foto_perfil || null,
            telefone: uMeta?.telefone || '',
            status: 'ACTIVE'
          };
          const localUser = mapSupabaseUserToAppUser(fallbackUser);
          setCurrentUser(localUser);

          calculateUserMetrics(sbSession.user.id).then(metrics => {
            setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
          });
        }
      } else {
        // No active Supabase session
        setCurrentUser(null);
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Failed to sync auth session:', e);
      // Não fazer logout silencioso em erros de rede
      // Apenas limpar se for erro de autenticação real (sessão expirada)
      if (e instanceof Error && (e.message?.includes('JWT') || e.message?.includes('session'))) {
        setCurrentUser(null);
        setUserProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAuthSession();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
      setSession(sbSession);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await syncAuthSession();
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUserProfile(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (!result || !result.user) {
        throw new Error('Falha na autenticação.');
      }
      
      const mappedUser = mapSupabaseUserToAppUser(result.user);
      setCurrentUser(mappedUser);

      calculateUserMetrics(result.user.id).then(metrics => {
        setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
      });
      const prof = await userService.getUserProfile(result.user.id);
      setUserProfile(prof);
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<any> => {
    setLoading(true);
    try {
      return await authService.register(email, password, name);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await authService.logout();
      } catch (e) {
        console.warn('Supabase logout error, proceeding with local logout:', e);
      }
      // Limpar canais de typing ao fazer logout
      const { presenceService } = await import('../../services/supabase/presenceService');
      presenceService.cleanupTypingChannels();
      
      setCurrentUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    return await authService.recoverPassword(email);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const prof = await userService.getUserProfile(currentUser.id);
        setUserProfile(prof);

        // Também recarregar dados do utilizador a partir da tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          const metrics = await calculateUserMetrics(userData.id);
          setCurrentUser(prev => prev ? {
            ...prev,
            firstName: userData.nome_completo?.split(' ')[0] || prev.firstName,
            lastName: userData.nome_completo?.split(' ').slice(1).join(' ') || prev.lastName,
            avatarUrl: userData.foto_perfil || prev.avatarUrl,
            phone: userData.telefone || prev.phone,
            ...metrics,
          } : prev);
        }
      } catch (err) {
        console.warn('Erro ao atualizar perfil:', err);
      }
    }
  };

  // Convert current user role back to Supabase naming
  const mappedRole = currentUser ? mapLocalRole(currentUser.role) : null;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        session,
        profile: userProfile,
        role: mappedRole,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
