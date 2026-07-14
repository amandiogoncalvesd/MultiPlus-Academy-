import { supabase } from '../../lib/supabase/client';

export interface SupabaseMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  texto: string;
  lido: boolean;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  reply_to_message_id?: string;
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

  async sendMessage(senderId: string, receiverId: string, texto: string, replyToMessageId?: string): Promise<SupabaseMessage> {
    const payload: any = {
      sender_id: senderId,
      receiver_id: receiverId,
      texto,
      lido: false
    };
    
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message in Supabase:', error);
      throw error;
    }
    return data as SupabaseMessage;
  },

  async editMessage(messageId: string, novoTexto: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        texto: novoTexto, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error editing message:', error);
      throw error;
    }
    return true;
  },

  async deleteMessageForEveryone(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        texto: 'Mensagem eliminada'
      })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error deleting message for everyone:', error);
      throw error;
    }
    return true;
  },

  async clearConversation(userId: string, partnerId: string): Promise<boolean> {
    const clearedAt = new Date().toISOString();
    
    // Also save in localStorage as fallback
    localStorage.setItem(`chat_clear_${userId}_${partnerId}`, clearedAt);

    const { error } = await supabase
      .from('conversation_clears')
      .upsert({
        user_id: userId,
        partner_id: partnerId,
        cleared_at: clearedAt
      }, { onConflict: 'user_id,partner_id' });
    
    if (error) {
      console.warn('Failed to upsert conversation clear, fallback used:', error);
      return false;
    }
    return true;
  },

  async getConversationClearTimestamp(userId: string, partnerId: string): Promise<string | null> {
    const localVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
    
    const { data, error } = await supabase
      .from('conversation_clears')
      .select('cleared_at')
      .eq('user_id', userId)
      .eq('partner_id', partnerId)
      .maybeSingle();
    
    if (error || !data) return localVal;
    return data.cleared_at;
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
  },

  async getConversationPartners(userId: string): Promise<any[]> {
    // 1. Get all messages for the user
    const messages = await this.getMessages(userId);
    
    // 2. Group by partner
    const partnerMap = new Map<string, { lastMessage: SupabaseMessage; unreadCount: number }>();
    
    messages.forEach((msg) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!partnerId) return;
      
      const isUnread = msg.receiver_id === userId && !msg.lido;
      
      const existing = partnerMap.get(partnerId);
      if (!existing) {
        partnerMap.set(partnerId, {
          lastMessage: msg,
          unreadCount: isUnread ? 1 : 0
        });
      } else {
        existing.unreadCount += isUnread ? 1 : 0;
      }
    });
    
    if (partnerMap.size === 0) return [];
    
    // 3. Fetch partners profiles
    const partnerIds = Array.from(partnerMap.keys());
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, nome_completo, role, foto_perfil')
      .in('id', partnerIds);
      
    if (error) {
      console.error('Error fetching partner profiles:', error);
      throw error;
    }
    
    return users.map((u) => {
      const entry = partnerMap.get(u.id)!;
      return {
        id: u.id,
        email: u.email,
        nome_completo: u.nome_completo,
        role: u.role,
        foto_perfil: u.foto_perfil,
        lastMessage: entry.lastMessage,
        unreadCount: entry.unreadCount
      };
    });
  },

  async getAllowedContacts(userId: string, role: string): Promise<any[]> {
    let query = supabase.from('users').select('id, email, nome_completo, role, foto_perfil');
    
    if (role === 'ALUNO') {
      // Aluno can only start conversation with Professors
      query = query.eq('role', 'PROFESSOR');
    } else {
      // Admin and Professor can see all other users, except themselves
      query = query.neq('id', userId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching allowed contacts:', error);
      throw error;
    }
    return data || [];
  }
};
