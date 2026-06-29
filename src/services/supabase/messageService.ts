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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching messages for user ${userId}:`, error);
      throw error;
    }
    return (data || []) as SupabaseMessage[];
  },

  async sendMessage(senderId: string, receiverId: string, texto: string): Promise<SupabaseMessage> {
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
    
    if (error) {
      console.error('Error sending message in Supabase:', error);
      throw error;
    }
    return data as SupabaseMessage;
  },

  async markAsRead(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ lido: true })
      .eq('id', messageId);
    
    if (error) {
      console.error(`Error marking message ${messageId} as read:`, error);
      throw error;
    }
    return true;
  },

  async getAnnouncements(role: 'ALL' | 'ALUNO' | 'PROFESSOR' = 'ALL'): Promise<SupabaseAnnouncement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or(`destinatarios.eq.ALL,destinatarios.eq.${role}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching announcements for role ${role}:`, error);
      throw error;
    }
    return (data || []) as SupabaseAnnouncement[];
  },

  async createAnnouncement(announcement: Partial<SupabaseAnnouncement>): Promise<SupabaseAnnouncement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating announcement in Supabase:', error);
      throw error;
    }
    return data as SupabaseAnnouncement;
  }
};
