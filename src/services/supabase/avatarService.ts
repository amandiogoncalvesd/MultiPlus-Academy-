import { supabase } from '../../lib/supabase/client';

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // SECURITY: Validate file extension against whitelist
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new Error('Extensão de ficheiro não permitida. Use JPG, PNG ou WebP.');
    }
    const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    // Add cache-busting timestamp to ensure browser fetches the latest avatar
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    
    // Atualizar foto_perfil na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ foto_perfil: publicUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    // Clean up old avatars (best effort — don't block on failure)
    try {
      const { data: oldFiles } = await supabase.storage
        .from('media')
        .list(`avatars/${userId}`);
      if (oldFiles && oldFiles.length > 0) {
        const filesToDelete = oldFiles
          .filter(f => f.name !== filePath.split('/').pop()) // Keep the new file
          .map(f => `avatars/${userId}/${f.name}`);
        if (filesToDelete.length > 0) {
          await supabase.storage.from('media').remove(filesToDelete);
        }
      }
    } catch (cleanupErr) {
      console.warn('Failed to clean up old avatars:', cleanupErr);
      // Non-blocking — avatar update still succeeds
    }
    
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
