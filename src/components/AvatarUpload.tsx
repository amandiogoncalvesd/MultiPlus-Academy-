import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { avatarService } from '../services/supabase/avatarService';
import { useToast } from './ui/Toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onAvatarUpdated?: (newUrl: string) => void;
}

export default function AvatarUpload({ 
  userId, currentAvatarUrl, userName, size = 'md', onAvatarUpdated 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    setAvatarUrl(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploading) return; // Prevent concurrent uploads
    
    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    
    setUploading(true);
    try {
      const url = await avatarService.uploadAvatar(userId, file);
      setAvatarUrl(url);
      onAvatarUpdated?.(url);
    } catch (err) {
      console.error('Erro ao carregar foto de perfil:', err);
      toast.error('Erro ao carregar foto de perfil.');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  return (
    <button
      type="button"
      className="relative group cursor-pointer rounded-full border-0 bg-transparent p-0"
      onClick={() => fileInputRef.current?.click()}
      aria-label="Alterar foto de perfil"
      disabled={uploading}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={userName || 'Avatar'} 
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gold-600/30 shadow-md`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gold-600/20 text-gold-600 flex items-center justify-center font-serif font-bold border-2 border-gold-600/30 shadow-md`}>
          {initials}
        </div>
      )}
      
      {/* Overlay de edição ao passar o mouse */}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 size={16} className="text-cream-100 animate-spin" />
        ) : (
          <Camera size={16} className="text-cream-100" />
        )}
      </div>
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </button>
  );
}
