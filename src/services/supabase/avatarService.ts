import { supabase } from '../../lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_CACHE = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // 1. Validar tipo de ficheiro
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Tipo de ficheiro não suportado: ${file.type}. Use JPEG, PNG ou WebP.`);
    }

    // 2. Validar tamanho do ficheiro
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Ficheiro demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 5MB.`);
    }

    // 3. Gerar caminho único com timestamp
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
    
    // 4. Upload para o bucket 'media'
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // 5. Obter URL pública
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    // Add cache-busting timestamp to ensure browser fetches the latest avatar
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    
    // 6. Atualizar foto_perfil na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ foto_perfil: publicUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;

    // 7. Invalidar cache para este utilizador
    AVATAR_CACHE.delete(userId);
    
    // 8. Clean up old avatars (best effort — don't block on failure)
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
    // 1. Verificar cache primeiro
    const cached = AVATAR_CACHE.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.url;
    }

    // 2. Buscar do banco de dados
    const { data } = await supabase
      .from('users')
      .select('foto_perfil')
      .eq('id', userId)
      .maybeSingle();
    
    const url = data?.foto_perfil || null;

    // 3. Atualizar cache
    AVATAR_CACHE.set(userId, { url, timestamp: Date.now() });
    
    return url;
  },

  // Limpar cache (útil após upload ou logout)
  clearCache(userId?: string): void {
    if (userId) {
      AVATAR_CACHE.delete(userId);
    } else {
      AVATAR_CACHE.clear();
    }
  }
};
