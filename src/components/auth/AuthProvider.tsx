import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { authService, SupabaseAuthUser } from '../../services/supabase/authService';
import { userService, SupabaseUserProfile } from '../../services/supabase/userService';
import { User, UserRole } from '../../types';



interface AuthContextType {
  user: User | null;
  session: any;
  profile: SupabaseUserProfile | null;
  role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  register: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  recoverPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, onPageRedirect }: { children: React.ReactNode, onPageRedirect?: (page: any) => void }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<SupabaseUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Map Supabase role to local UserRole
  const mapSupabaseRole = (sbRole: string): UserRole => {
    if (sbRole === 'ADMIN') return 'ADMIN';
    if (sbRole === 'PROFESSOR') return 'PROFESSOR';
    return 'ALUNO';
  };

  // Map local UserRole to Supabase role
  const mapLocalRole = (localRole: UserRole): 'ADMIN' | 'PROFESSOR' | 'ALUNO' => {
    if (localRole === 'ADMIN') return 'ADMIN';
    if (localRole === 'PROFESSOR') return 'PROFESSOR';
    return 'ALUNO';
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
          const matchedRole = mapSupabaseRole(userData.role);
          const localUser: User = {
            id: userData.id,
            email: userData.email,
            firstName: userData.nome_completo?.split(' ')[0] || '',
            lastName: userData.nome_completo?.split(' ').slice(1).join(' ') || '',
            role: matchedRole,
            avatarUrl: userData.foto_perfil || '',
            phone: userData.telefone || '',
            status: 'ACTIVE',
            streak: 3,
            longestStreak: 5,
            totalHoursLearned: 4
          };
          setCurrentUser(localUser);

          // Load extra profile
          const profileData = await userService.getUserProfile(userData.id);
          setUserProfile(profileData);
        } else {
          // If public.users is slow, build from auth meta
          const uMeta = sbSession.user.user_metadata;
          const mappedRole = mapSupabaseRole(uMeta?.role || 'ALUNO');
          const localUser: User = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            firstName: uMeta?.nome_completo?.split(' ')[0] || uMeta?.firstName || '',
            lastName: uMeta?.nome_completo?.split(' ').slice(1).join(' ') || uMeta?.lastName || '',
            role: mappedRole,
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
            status: 'ACTIVE',
            streak: 3,
            longestStreak: 5,
            totalHoursLearned: 4
          };
          setCurrentUser(localUser);
        }
      } else {
        // No active Supabase session
        setCurrentUser(null);
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Failed to sync auth session:', e);
      setCurrentUser(null);
      setUserProfile(null);
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
      const localRole = mapSupabaseRole(result.user.role);
      const mappedUser: User = {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.nome_completo.split(' ')[0] || '',
        lastName: result.user.nome_completo.split(' ').slice(1).join(' ') || '',
        role: localRole,
        avatarUrl: result.user.foto_perfil || '',
        phone: result.user.telefone || '',
        status: 'ACTIVE',
        streak: 5,
        longestStreak: 15,
        totalHoursLearned: 24
      };
      setCurrentUser(mappedUser);
      const prof = await userService.getUserProfile(result.user.id);
      setUserProfile(prof);
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const login = signIn;

  const signUp = async (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN'): Promise<any> => {
    setLoading(true);
    try {
      return await authService.register(email, password, name, role);
    } finally {
      setLoading(false);
    }
  };

  const register = signUp;

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await authService.logout();
      } catch (e) {
        console.warn('Supabase logout error, proceeding with local logout:', e);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = signOut;

  const resetPassword = async (email: string) => {
    return await authService.recoverPassword(email);
  };

  const recoverPassword = resetPassword;

  const refreshProfile = async () => {
    if (currentUser) {
      const prof = await userService.getUserProfile(currentUser.id);
      setUserProfile(prof);
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
        login,
        signUp,
        register,
        signOut,
        logout,
        resetPassword,
        recoverPassword,
        refreshProfile
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
