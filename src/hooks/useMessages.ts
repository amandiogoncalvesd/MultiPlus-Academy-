import { useState, useEffect } from 'react';
import { messageService, SupabaseMessage, SupabaseAnnouncement } from '../services/supabase/messageService';

export function useMessages(userId?: string) {
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SupabaseAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async (uId: string) => {
    setLoading(true);
    try {
      const data = await messageService.getMessages(uId);
      setMessages(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async (role: 'ALL' | 'ALUNO' | 'PROFESSOR' = 'ALL') => {
    setLoading(true);
    try {
      const data = await messageService.getAnnouncements(role);
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (senderId: string, receiverId: string, texto: string) => {
    try {
      const msg = await messageService.sendMessage(senderId, receiverId, texto);
      setMessages(prev => [msg, ...prev]);
      return msg;
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
      throw err;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const success = await messageService.markAsRead(messageId);
      if (success) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, lido: true } : m))
        );
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao marcar mensagem como lida');
      return false;
    }
  };

  const createAnnouncement = async (ann: Partial<SupabaseAnnouncement>) => {
    try {
      const newAnn = await messageService.createAnnouncement(ann);
      setAnnouncements(prev => [newAnn, ...prev]);
      return newAnn;
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar aviso');
      throw err;
    }
  };

  return {
    messages,
    announcements,
    loading,
    error,
    fetchMessages,
    fetchAnnouncements,
    sendMessage,
    markAsRead,
    createAnnouncement
  };
}
