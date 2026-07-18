import { supabase } from '../../lib/supabase/client';

export interface AppNotification {
  id: string;
  user_id: string;
  text: string;
  read: boolean;
  type?: string;
  link?: string;
  created_at: string;
}

export const notificationService = {
  // =========================================================================
  // 1. BUScar notificações de um utilizador
  // =========================================================================
  async getNotifications(userId: string, limit = 30): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
    return (data || []) as AppNotification[];
  },

  // =========================================================================
  // 2. Contar notificações não lidas
  // =========================================================================
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
    return count || 0;
  },

  // =========================================================================
  // 3. Criar notificação
  // =========================================================================
  async createNotification(params: {
    userId: string;
    text: string;
    type?: string;
    link?: string;
  }): Promise<AppNotification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        text: params.text,
        read: false,
        type: params.type || 'info',
        link: params.link || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
    return data as AppNotification;
  },

  // =========================================================================
  // 4. Marcar uma notificação como lida
  // =========================================================================
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 5. Marcar TODAS as notificações de um utilizador como lidas
  // =========================================================================
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 6. Apagar uma notificação
  // =========================================================================
  async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao apagar notificação:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 7. Subscrever a notificações em tempo real (INSERT apenas)
  // =========================================================================
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: AppNotification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new as AppNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
