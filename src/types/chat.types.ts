import { SupabaseMessage as DBMessage } from '../services/supabase/messageService';

export type ChatRole = 'ALUNO' | 'PROFESSOR' | 'ADMIN';

export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  lido: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  replyToId?: string;
  replyTo?: ChatMessage | null;
  status: MessageStatus;
  forwardedFrom?: {
    id: string;
    senderName: string;
  } | null;
  media?: ChatMedia[] | null;
  reactions?: MessageReaction[] | null;
  voiceData?: VoiceData | null;
}

export interface ChatMedia {
  id: string;
  messageId: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'voice';
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  userName?: string;
}

export interface VoiceData {
  url: string;
  duration: number;
  waveform?: number[];
}

export interface ChatPartner {
  id: string;
  email: string;
  nome_completo: string;
  role: string;
  foto_perfil?: string;
  lastMessage?: DBMessage;
  unreadCount: number;
  status?: 'ONLINE' | 'OFFLINE' | 'TYPING' | 'AWAY';
  lastSeen?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
}

export interface ChatTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgOverlay: string;

    bubbleMe: string;
    bubbleMeText: string;
    bubbleOther: string;
    bubbleOtherText: string;
    bubbleReply: string;
    bubbleReplyBorder: string;

    online: string;
    offline: string;
    typing: string;
    unread: string;

    hover: string;
    selected: string;
    danger: string;
    success: string;

    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textLink: string;

    border: string;
    borderLight: string;

    scrollbarTrack: string;
    scrollbarThumb: string;
  };
  shadows: {
    bubble: string;
    modal: string;
    sidebar: string;
  };
  borderRadius: {
    bubble: string;
    button: string;
    modal: string;
    avatar: string;
  };
}
