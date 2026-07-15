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
  status?: string; // 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  forwarded_from?: string;
  voice_data?: any;
}

export interface SupabaseAnnouncement {
  id: string;
  author_id: string;
  titulo: string;
  mensagem: string;
  destinatarios: 'ALL' | 'ALUNO' | 'PROFESSOR';
  created_at: string;
}

export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  texto: string;
  replyToMessageId?: string;
  attachments?: File[];
  forwardedFrom?: string;
  voiceData?: any;
}

export const messageService = {
  // 1. Get all messages (fallback / global fetch)
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

  // 2. Get messages paginated (cursor-based for high-performance)
  async getMessagesPaginated(
    userId: string, 
    partnerId: string, 
    cursor?: string, 
    limit: number = 50
  ): Promise<{ messages: SupabaseMessage[]; nextCursor: string | null }> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;
      if (error) throw error;

      const messages = (data || []).reverse(); // order chronologically for the client
      const nextCursor = data && data.length === limit 
        ? data[data.length - 1].created_at 
        : null;

      return { messages, nextCursor };
    } catch (err) {
      console.warn('getMessagesPaginated failed, falling back to client-side filter:', err);
      // Fallback: load all messages and paginate locally
      const all = await this.getMessages(userId);
      const filtered = all
        .filter(m => 
          (m.sender_id === userId && m.receiver_id === partnerId) || 
          (m.sender_id === partnerId && m.receiver_id === userId)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      return {
        messages: filtered,
        nextCursor: null
      };
    }
  },

  // 3. Send message supporting both positional arguments (for legacy compatibility) and an options payload object
  async sendMessage(
    senderIdOrPayload: string | SendMessagePayload,
    receiverId?: string,
    texto?: string,
    replyToMessageId?: string
  ): Promise<SupabaseMessage> {
    let payloadObj: SendMessagePayload;

    if (typeof senderIdOrPayload === 'string') {
      payloadObj = {
        senderId: senderIdOrPayload,
        receiverId: receiverId || '',
        texto: texto || '',
        replyToMessageId
      };
    } else {
      payloadObj = senderIdOrPayload;
    }

    const insertPayload: any = {
      sender_id: payloadObj.senderId,
      receiver_id: payloadObj.receiverId,
      texto: payloadObj.texto,
      lido: false,
    };

    // Add extra optional fields with safe dynamic checking
    if (payloadObj.replyToMessageId) {
      insertPayload.reply_to_message_id = payloadObj.replyToMessageId;
    }
    if (payloadObj.forwardedFrom) {
      insertPayload.forwarded_from = payloadObj.forwardedFrom;
    }
    if (payloadObj.voiceData) {
      insertPayload.voice_data = payloadObj.voiceData;
    }

    // Attempt to set status if column is supported
    insertPayload.status = 'SENT';

    const { data, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message in Supabase:', error);
      throw error;
    }

    // Handle optional attachments if provided
    if (payloadObj.attachments && payloadObj.attachments.length > 0) {
      try {
        await Promise.all(
          payloadObj.attachments.map(async (file) => {
            const filePath = `${payloadObj.senderId}/${data.id}/${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('chat-media')
              .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('chat-media')
              .getPublicUrl(filePath);

            await supabase.from('chat_media').insert({
              message_id: data.id,
              file_name: file.name,
              file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
              mime_type: file.type,
              file_size: file.size,
              url: publicUrl,
            });
          })
        );
      } catch (attachErr) {
        console.warn('Failed to upload attachments (table or storage bucket might not exist):', attachErr);
      }
    }

    return data as SupabaseMessage;
  },

  // 4. Edit message
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

  // 5. Delete message for everyone (Soft Delete: wipes text content for compliance/privacy)
  async deleteMessageForEveryone(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        texto: 'Mensagem eliminada' // Nulified or substituted for compliance
      })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error deleting message for everyone:', error);
      throw error;
    }
    return true;
  },

  // 6. Delete message for me (Durable or Local-based fallback delete)
  async deleteMessageForMe(userId: string, messageId: string, partnerId: string): Promise<boolean> {
    const deletedForMeKey = `chat_deleted_for_me_${userId}_${partnerId}`;
    try {
      // 1. Try PostgreSQL message_deletions table
      const { error } = await supabase
        .from('message_deletions')
        .upsert({ user_id: userId, message_id: messageId }, { onConflict: 'user_id,message_id' });
      
      if (error) throw error;
    } catch (err) {
      console.warn('Durable deletion table not found. Using client-side localStorage fallback.', err);
    } finally {
      // 2. Always write to local storage as fallback/complement
      const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
      if (!localDeleted.includes(messageId)) {
        localStorage.setItem(deletedForMeKey, JSON.stringify([...localDeleted, messageId]));
      }
    }
    return true;
  },

  // 7. Clear conversation
  async clearConversation(userId: string, partnerId: string): Promise<boolean> {
    const clearedAt = new Date().toISOString();
    
    // Also save in localStorage as fallback
    localStorage.setItem(`chat_clear_${userId}_${partnerId}`, clearedAt);

    try {
      const { error } = await supabase
        .from('conversation_clears')
        .upsert({
          user_id: userId,
          partner_id: partnerId,
          cleared_at: clearedAt
        }, { onConflict: 'user_id,partner_id' });
      
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to upsert conversation clear to server, fallback local clear used:', error);
    }
    return true;
  },

  // 8. Get conversation clear timestamp
  async getConversationClearTimestamp(userId: string, partnerId: string): Promise<string | null> {
    const localVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
    try {
      const { data, error } = await supabase
        .from('conversation_clears')
        .select('cleared_at')
        .eq('user_id', userId)
        .eq('partner_id', partnerId)
        .maybeSingle();
      
      if (error || !data) return localVal;
      return data.cleared_at;
    } catch {
      return localVal;
    }
  },

  // 9. Mark a single message as read
  async markAsRead(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ lido: true, status: 'READ' })
      .eq('id', messageId);
    
    if (error) {
      // Retry with only lido if status is unprovisioned
      const { error: retryError } = await supabase
        .from('messages')
        .update({ lido: true })
        .eq('id', messageId);
      
      if (retryError) {
        console.error(`Error marking message ${messageId} as read:`, retryError);
        throw retryError;
      }
    }
    return true;
  },

  // 10. Mark all messages in a conversation as read
  async markConversationAsRead(userId: string, partnerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ lido: true, status: 'READ' })
        .eq('receiver_id', userId)
        .eq('sender_id', partnerId)
        .eq('lido', false);
      
      if (error) {
        const { error: retryError } = await supabase
          .from('messages')
          .update({ lido: true })
          .eq('receiver_id', userId)
          .eq('sender_id', partnerId)
          .eq('lido', false);
        if (retryError) throw retryError;
      }
      return true;
    } catch (err) {
      console.error('Error marking conversation as read:', err);
      return false;
    }
  },

  // 11. Fetch announcements
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

  // 12. Create announcement
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

  // 13. Get conversation partners
  async getConversationPartners(userId: string): Promise<any[]> {
    // High compatibility: load last message and unread count, then fetch user profiles
    const messages = await this.getMessages(userId);
    
    const partnerMap = new Map<string, { lastMessage: SupabaseMessage; unreadCount: number }>();
    
    messages.forEach((msg) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!partnerId) return;
      
      // Filter out deleted messages or clear boundaries if loaded
      const localClearVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
      if (localClearVal && new Date(msg.created_at).getTime() <= new Date(localClearVal).getTime()) {
        return;
      }
      
      const localDeleted = JSON.parse(localStorage.getItem(`chat_deleted_for_me_${userId}_${partnerId}`) || '[]');
      if (localDeleted.includes(msg.id)) {
        return;
      }

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

  // 14. Get contacts allowed to message based on user role
  async getAllowedContacts(userId: string, role: string): Promise<any[]> {
    let query = supabase.from('users').select('id, email, nome_completo, role, foto_perfil');
    
    if (role === 'ALUNO') {
      query = query.eq('role', 'PROFESSOR');
    } else {
      query = query.neq('id', userId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching allowed contacts:', error);
      throw error;
    }
    return data || [];
  },

  // 15. Reactions Support (Graceful mockable layer)
  async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
      if (error) throw error;
      return true;
    } catch {
      // Local storage-based fallback if table missing
      const key = `local_reactions_${messageId}`;
      const reactions = JSON.parse(localStorage.getItem(key) || '[]');
      reactions.push({ userId, emoji });
      localStorage.setItem(key, JSON.stringify(reactions));
      return true;
    }
  },

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
      if (error) throw error;
      return true;
    } catch {
      const key = `local_reactions_${messageId}`;
      let reactions = JSON.parse(localStorage.getItem(key) || '[]');
      reactions = reactions.filter((r: any) => !(r.userId === userId && r.emoji === emoji));
      localStorage.setItem(key, JSON.stringify(reactions));
      return true;
    }
  },

  // 16. Pin Support (Graceful mockable layer)
  async pinMessage(conversationKey: string, messageId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .insert({ conversation_key: conversationKey, message_id: messageId, pinned_by: userId });
      if (error) throw error;
      return true;
    } catch {
      const key = `local_pinned_${conversationKey}`;
      const pinned = JSON.parse(localStorage.getItem(key) || '[]');
      if (!pinned.includes(messageId)) {
        pinned.push(messageId);
        localStorage.setItem(key, JSON.stringify(pinned));
      }
      return true;
    }
  },

  async unpinMessage(conversationKey: string, messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('conversation_key', conversationKey)
        .eq('message_id', messageId);
      if (error) throw error;
      return true;
    } catch {
      const key = `local_pinned_${conversationKey}`;
      let pinned = JSON.parse(localStorage.getItem(key) || '[]');
      pinned = pinned.filter((id: string) => id !== messageId);
      localStorage.setItem(key, JSON.stringify(pinned));
      return true;
    }
  }
};
