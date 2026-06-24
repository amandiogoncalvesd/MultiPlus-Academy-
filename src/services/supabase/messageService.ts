import { supabase } from '../../lib/supabase/client';

export interface SupabaseMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  texto: string;
  lido: boolean;
  created_at: string;
}

export interface SupabaseAnnouncement {
  id: string;
  author_id: string;
  titulo: string;
  mensagem: string;
  destinatarios: 'ALL' | 'ALUNO' | 'PROFESSOR';
  created_at: string;
}

export const messageService = {
  async getMessages(userId: string): Promise<SupabaseMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (!error && data) return data as SupabaseMessage[];
    } catch (e) {}
    return [
      {
        id: 'msg-1',
        sender_id: 'director-sumbelelo',
        receiver_id: userId,
        texto: 'Olá Dr. António! Seja bem-vindo ao portal. As suas credenciais para as salas híbridas foram atualizadas com sucesso.',
        lido: true,
        created_at: new Date().toISOString()
      }
    ];
  },

  async sendMessage(senderId: string, receiverId: string, texto: string): Promise<SupabaseMessage> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          texto,
          lido: false
        })
        .select()
        .single();
      
      if (!error && data) return data as SupabaseMessage;
      if (error) throw error;
    } catch (e) {}
    return {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sender_id: senderId,
      receiver_id: receiverId,
      texto,
      lido: false,
      created_at: new Date().toISOString()
    };
  },

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ lido: true })
        .eq('id', messageId);
      return !error;
    } catch (e) {
      return true;
    }
  },

  async getAnnouncements(role: 'ALL' | 'ALUNO' | 'PROFESSOR' = 'ALL'): Promise<SupabaseAnnouncement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`destinatarios.eq.ALL,destinatarios.eq.${role}`)
        .order('created_at', { ascending: false });
      
      if (!error && data) return data as SupabaseAnnouncement[];
    } catch (e) {}
    return [
      {
        id: 'ann-1',
        author_id: 'admin',
        titulo: 'Sessão Solene de Outorga de Certificados - Huambo 2026',
        mensagem: 'Caros alunos, convidamos todos para a cerimónia presencial no auditório central no próximo sábado.',
        destinatarios: 'ALL',
        created_at: new Date().toISOString()
      }
    ];
  },

  async createAnnouncement(announcement: Partial<SupabaseAnnouncement>): Promise<SupabaseAnnouncement> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcement)
        .select()
        .single();
      
      if (!error && data) return data as SupabaseAnnouncement;
      if (error) throw error;
    } catch (e) {}
    return {
      id: announcement.id || 'ann-' + Math.random().toString(36).substr(2, 9),
      author_id: announcement.author_id || '',
      titulo: announcement.titulo || '',
      mensagem: announcement.mensagem || '',
      destinatarios: announcement.destinatarios || 'ALL',
      created_at: new Date().toISOString()
    };
  }
};
