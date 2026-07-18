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

  // Shared map to track typing channels and prevent leaks
  typingChannels: new Map<string, any>() as Map<string, any>,

  // Broadcast typing status to active chat partner
  async broadcastTyping(userId: string, partnerId: string, isTyping: boolean) {
    try {
      const channelKey = `typing-${partnerId}`;
      
      // Reuse existing channel if available
      let channel = presenceService.typingChannels?.get(channelKey);
      
      if (!channel) {
        channel = supabase.channel(channelKey, {
          config: { broadcast: { self: false } }
        });
        presenceService.typingChannels?.set(channelKey, channel);
        
        // Subscribe once — channel stays alive for reuse
        await new Promise<void>((resolve) => {
          channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              resolve();
            }
          });
        });
      }
      
      // Send the typing event on the existing channel
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping, timestamp: Date.now(), conversationId: partnerId }
      });
    } catch (err) {
      console.warn('Realtime broadcastTyping failed:', err);
    }
  },

  cleanupTypingChannels() {
    if (presenceService.typingChannels) {
      presenceService.typingChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      presenceService.typingChannels.clear();
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

  // Subscribe to presence events
  subscribeToPresence(userIds: string[], callback: (event: PresenceEvent) => void) {
    try {
      const channel = supabase.channel('presence-global');
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
  }
};
