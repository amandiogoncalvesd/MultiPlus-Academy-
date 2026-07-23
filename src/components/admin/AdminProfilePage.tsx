import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import AvatarUpload from '../AvatarUpload';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../ui/Toast';

interface AdminProfilePageProps {
  user: User | null;
  onUserUpdated: (updates: Partial<User>) => void;
}

export default function AdminProfilePage({ user, onUserUpdated }: AdminProfilePageProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [certificateEmail, setCertificateEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(`${user.firstName} ${user.lastName}`.trim());
    setPhone(user.phone || '');
    const load = async () => {
      const { data: userRow } = await supabase.from('users').select('notif_email_certificados').eq('id', user.id).maybeSingle();
      const { data: profile } = await supabase.from('profiles').select('biografia').eq('user_id', user.id).maybeSingle();
      setCertificateEmail(Boolean(userRow?.notif_email_certificados));
      setBio(profile?.biografia || '');
    };
    load();
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !name.trim()) return;
    setSaving(true);
    try {
      const { error: userError } = await supabase.from('users').update({ nome_completo: name.trim(), telefone: phone.trim() || null, notif_email_certificados: certificateEmail }).eq('id', user.id);
      if (userError) throw userError;
      const { error: profileError } = await supabase.from('profiles').upsert({ user_id: user.id, biografia: bio.trim() || null }, { onConflict: 'user_id' });
      if (profileError) throw profileError;
      const [firstName, ...lastName] = name.trim().split(/\s+/);
      onUserUpdated({ firstName, lastName: lastName.join(' '), phone });
      toast.success('Perfil administrativo atualizado.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível guardar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  return <div className="mx-auto max-w-4xl space-y-6 text-left">
    <section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <AvatarUpload userId={user.id} currentAvatarUrl={user.avatarUrl} userName={name} size="xl" onAvatarUpdated={(avatarUrl) => onUserUpdated({ avatarUrl })} />
        <div className="min-w-0"><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Identidade administrativa</p><h2 className="mt-1 text-2xl font-serif font-black text-ink-900 dark:text-cream-100">{name || 'Administrador'}</h2><p className="mt-1 text-sm text-neutral-400">{user.email}</p></div>
        <div className="sm:ml-auto"><span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-mono font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400"><ShieldCheck size={15} /> ADMINISTRADOR</span></div>
      </div>
    </section>

    <form onSubmit={save} className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <div className="mb-6"><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Dados pessoais</p><h3 className="mt-1 font-serif text-xl font-black text-ink-900 dark:text-cream-100">Perfil e preferências</h3></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-ink-900 dark:text-cream-100">Nome completo<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 min-h-11 w-full rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></label>
        <label className="text-xs font-semibold text-ink-900 dark:text-cream-100">Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" className="mt-2 min-h-11 w-full rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></label>
        <label className="text-xs font-semibold text-ink-900 dark:text-cream-100 sm:col-span-2">Biografia<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-gray-250 bg-cream-200 p-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" placeholder="Breve apresentação profissional." /></label>
      </div>
      <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-150 bg-cream-200 p-3 dark:border-ink-800 dark:bg-ink-950"><input checked={certificateEmail} onChange={(event) => setCertificateEmail(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#BB8533]" /><span className="flex-1 text-sm text-ink-900 dark:text-cream-100"><Bell className="mr-2 inline text-gold-600" size={15} />Receber aviso por e-mail sobre novos certificados</span></label>
      <div className="mt-6 flex justify-end"><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-xs font-mono font-bold uppercase text-white transition hover:bg-gold-600 hover:text-ink-900 disabled:opacity-50 dark:bg-gold-600 dark:text-ink-900"><CheckCircle2 size={15} />{saving ? 'A guardar…' : 'Guardar perfil'}</button></div>
    </form>
  </div>;
}
