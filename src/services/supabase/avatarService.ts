import { supabase } from '../../lib/supabase/client';

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    
    // Atualizar foto_perfil na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ foto_perfil: publicUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return publicUrl;
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('foto_perfil')
      .eq('id', userId)
      .maybeSingle();
    
    return data?.foto_perfil || null;
  }
};
