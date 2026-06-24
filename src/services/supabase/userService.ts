import { supabase } from '../../lib/supabase/client';

export interface SupabaseUserProfile {
  id: string;
  user_id: string;
  biografia?: string;
  data_nascimento?: string;
  endereco?: string;
  nivel_ingles?: string;
  objetivos?: string;
}

export const userService = {
  async getUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) return data as SupabaseUserProfile;
    } catch (e) {}

    // Mock fallback
    return {
      id: 'profile-1',
      user_id: userId,
      biografia: 'Estudante de advocacia interessado em contratos internacionais.',
      nivel_ingles: 'B2 - Upper-Intermediate',
      objetivos: 'Atuar na área de arbitragem empresarial internacional.'
    };
  },

  async updateUserProfile(userId: string, profileUpdates: Partial<SupabaseUserProfile>): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (!error && data) return data;
      if (error) throw error;
    } catch (e) {}
    return { user_id: userId, ...profileUpdates };
  },

  async updateUserRole(userId: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      return !error;
    } catch (e) {
      return true;
    }
  }
};
