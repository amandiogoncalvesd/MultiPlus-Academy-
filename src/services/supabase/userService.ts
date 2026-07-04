import { supabase, isSupabaseMock } from '../../lib/supabase/client';

export interface SupabaseUserProfile {
  id: string;
  user_id: string;
  biografia?: string;
  data_nascimento?: string;
  endereco?: string;
  nivel_ingles?: string;
  objetivos?: string;
}

const getMockProfiles = (): SupabaseUserProfile[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('multiplus_mock_profiles');
  if (!stored) {
    const initial = [
      { id: 'mock-prof-p1', user_id: 'mock-admin-id', biografia: 'Administrador do sistema', nivel_ingles: 'C2 - Mastery' },
      { id: 'mock-prof-p2', user_id: 'mock-professor-id', biografia: 'Formador de contratos na MultiPlus', nivel_ingles: 'C1 - Advanced' },
      { id: 'mock-prof-p3', user_id: 'mock-aluno-id', biografia: 'Estudante de Engenharia Informática', nivel_ingles: 'B2 - Upper Intermediate' }
    ];
    localStorage.setItem('multiplus_mock_profiles', JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

const saveMockProfile = (profile: SupabaseUserProfile) => {
  if (typeof window === 'undefined') return;
  const profiles = getMockProfiles();
  const idx = profiles.findIndex(p => p.user_id === profile.user_id);
  if (idx !== -1) {
    profiles[idx] = { ...profiles[idx], ...profile };
  } else {
    profiles.push(profile);
  }
  localStorage.setItem('multiplus_mock_profiles', JSON.stringify(profiles));
};

export const userService = {
  async getUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
    if (isSupabaseMock) {
      const profiles = getMockProfiles();
      const found = profiles.find(p => p.user_id === userId);
      if (found) return found;
      // create lazy profile
      const newProf = { id: `mock-p-${Date.now()}`, user_id: userId, biografia: '', nivel_ingles: 'B1' };
      saveMockProfile(newProf);
      return newProf;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        if (error.message?.includes('API key') || error.message?.includes('Invalid API key')) {
          const profiles = getMockProfiles();
          return profiles.find(p => p.user_id === userId) || null;
        }
        console.error(`Error fetching user profile for ${userId}:`, error);
        throw error;
      }
      return data as SupabaseUserProfile | null;
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('Invalid API key')) {
        const profiles = getMockProfiles();
        return profiles.find(p => p.user_id === userId) || null;
      }
      throw err;
    }
  },

  async updateUserProfile(userId: string, profileUpdates: Partial<SupabaseUserProfile>): Promise<any> {
    if (isSupabaseMock) {
      const profiles = getMockProfiles();
      let found = profiles.find(p => p.user_id === userId);
      if (!found) {
        found = { id: `mock-p-${Date.now()}`, user_id: userId, ...profileUpdates };
      } else {
        found = { ...found, ...profileUpdates };
      }
      saveMockProfile(found);
      return found;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        if (error.message?.includes('API key') || error.message?.includes('Invalid API key')) {
          const profiles = getMockProfiles();
          let found = profiles.find(p => p.user_id === userId);
          if (!found) {
            found = { id: `mock-p-${Date.now()}`, user_id: userId, ...profileUpdates };
          } else {
            found = { ...found, ...profileUpdates };
          }
          saveMockProfile(found);
          return found;
        }
        console.error(`Error updating user profile for ${userId}:`, error);
        throw error;
      }
      return data;
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('Invalid API key')) {
        const profiles = getMockProfiles();
        let found = profiles.find(p => p.user_id === userId);
        if (!found) {
          found = { id: `mock-p-${Date.now()}`, user_id: userId, ...profileUpdates };
        } else {
          found = { ...found, ...profileUpdates };
        }
        saveMockProfile(found);
        return found;
      }
      throw err;
    }
  },

  async updateUserRole(userId: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO'): Promise<boolean> {
    if (isSupabaseMock) {
      // Mock role update
      const stored = localStorage.getItem('multiplus_mock_users');
      if (stored) {
        try {
          const users = JSON.parse(stored);
          const idx = users.findIndex((u: any) => u.id === userId);
          if (idx !== -1) {
            users[idx].role = role;
            localStorage.setItem('multiplus_mock_users', JSON.stringify(users));
          }
        } catch {}
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      
      if (error) {
        if (error.message?.includes('API key') || error.message?.includes('Invalid API key')) {
          return true;
        }
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
      }
      return true;
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('Invalid API key')) {
        return true;
      }
      throw err;
    }
  }
};
