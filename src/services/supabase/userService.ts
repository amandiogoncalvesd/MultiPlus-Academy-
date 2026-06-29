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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
      throw error;
    }
    return data as SupabaseUserProfile | null;
  },

  async updateUserProfile(userId: string, profileUpdates: Partial<SupabaseUserProfile>): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating user profile for ${userId}:`, error);
      throw error;
    }
    return data;
  },

  async updateUserRole(userId: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO'): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
    
    if (error) {
      console.error(`Error updating role for user ${userId}:`, error);
      throw error;
    }
    return true;
  }
};
