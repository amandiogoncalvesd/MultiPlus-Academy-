import { supabase } from '../../lib/supabase/client';

export interface TypingEvent {
  userId: string;
  isTyping: boolean;
  timestamp: number;
  conversationId: string;
}

export interface PresenceEvent {
  userId: string;
  status: 'ONLINE' | 'OFFLINE' | 'TYPING' | 'AWAY';
  lastSeen: string;
}

// Cache de canais de typing para evitar vazamento
const typingChannels = new Map<string, ReturnType<typeof supabase.channel>>();

const getOrCreateTypingChannel = (partnerId: string) => {
  if (!typingChannels.has(partnerId)) {
    const channel = supabase.channel(`typing-${partnerId}`, {
      config: { broadcast: { self: false } }
    });
    channel.subscribe();
    typingChannels.set(partnerId, channel);
  }
  return typingChannels.get(partnerId)!;
};

export const presenceService = {
  // Update presence status in Postgres with fallback
  async updatePresence(userId: string, status: PresenceEvent['status'], conversationId?: string) {
    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          typing_in_conversation: conversationId || null,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (err) {
      // Graceful fallback: avoid flooding logs
    }
  },

  // Get current user presence
  async getUserPresence(userId: string): Promise<PresenceEvent | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        userId: data.user_id,
        status: data.status,
        lastSeen: data.last_seen,
      };
    } catch {
      return null;
    }
  },

  // Broadcast typing status — agora reutiliza canais
  async broadcastTyping(userId: string, partnerId: string, isTyping: boolean) {
    try {
      const channel = getOrCreateTypingChannel(partnerId);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping, timestamp: Date.now(), conversationId: partnerId }
      });
    } catch (err) {
      console.warn('Realtime broadcastTyping failed:', err);
    }
  },

  // Subscribe to typing indicator events
  subscribeToTyping(userId: string, callback: (event: TypingEvent) => void) {
    try {
      const channel = supabase.channel(`typing-${userId}`);
      channel
        .on('broadcast', { event: 'typing' }, (payload) => {
          callback(payload.payload as TypingEvent);
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscribeToTyping failed:', err);
      return () => {};
    }
  },

  // Subscribe to presence events — usar Supabase Presence API em vez de postgres_changes
  subscribeToPresence(userIds: string[], callback: (event: PresenceEvent) => void) {
    try {
      const channel = supabase.channel('presence-global', {
        config: { presence: { key: '' } }
      });

      channel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_presence' },
          (payload) => {
            const data = payload.new as any;
            if (data && userIds.includes(data.user_id)) {
              callback({
                userId: data.user_id,
                status: data.status,
                lastSeen: data.last_seen,
              });
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },

  // Limpar canais de typing (chamar no logout)
  cleanupTypingChannels(): void {
    typingChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    typingChannels.clear();
  }
};
