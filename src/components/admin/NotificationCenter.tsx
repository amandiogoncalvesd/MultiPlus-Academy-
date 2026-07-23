import { Bell, CheckCheck, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../ui/Toast';

interface NotificationCenterProps {
  notifications: any[];
  onNotificationsChange: (notifications: any[]) => void;
}

export default function NotificationCenter({ notifications, onNotificationsChange }: NotificationCenterProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;

  const markAllRead = async () => {
    setSaving(true);
    try {
      const ids = notifications.filter((item) => !item.read).map((item) => item.id);
      if (ids.length) {
        const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids);
        if (error) throw error;
        onNotificationsChange(notifications.map((item) => ({ ...item, read: true })));
      }
      toast.success('Notificações marcadas como lidas.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar notificações.');
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-6 text-left"><section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-600/15 text-gold-600"><Bell size={20} /></span><div><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Central de notificações</p><h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Eventos administrativos</h2><p className="mt-1 text-xs text-neutral-400">{unread ? `${unread} notificação(ões) pendente(s)` : 'Tudo atualizado'}</p></div></div><button onClick={markAllRead} disabled={!unread || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-250 px-4 text-xs font-mono font-bold uppercase text-ink-900 hover:border-gold-600 disabled:opacity-50 dark:border-ink-800 dark:text-cream-100"><CheckCheck size={16} />{saving ? 'A guardar…' : 'Marcar todas lidas'}</button></div></section><section className="overflow-hidden rounded-3xl border border-gray-150 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">{notifications.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center"><Info className="text-gold-600" size={28} /><h3 className="mt-3 font-serif font-black text-ink-900 dark:text-cream-100">Sem notificações</h3><p className="mt-1 text-xs text-neutral-400">Eventos administrativos aparecerão aqui.</p></div> : <ul className="divide-y divide-gray-100 dark:divide-ink-800">{notifications.map((item) => <li key={item.id} className={`flex gap-3 p-4 sm:p-5 ${item.read ? '' : 'bg-gold-600/[0.04]'}`}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-gray-200' : 'bg-gold-600'}`} /><div className="min-w-0 flex-1"><p className="text-sm text-ink-900 dark:text-cream-100">{item.text}</p><time className="mt-1 block text-[10px] font-mono text-neutral-400">{item.created_at ? new Date(item.created_at).toLocaleString('pt-AO') : 'Agora'}</time></div>{!item.read && <span className="self-start rounded-lg bg-gold-600/15 px-2 py-1 text-[9px] font-mono font-bold text-gold-700 dark:text-gold-500">NOVA</span>}</li>)}</ul>}</section></div>;
}
