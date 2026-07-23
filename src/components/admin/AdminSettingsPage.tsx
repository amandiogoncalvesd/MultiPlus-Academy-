import { useEffect, useState } from 'react';
import { Building2, MonitorCog, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../ui/Toast';

interface AdminSettingsPageProps {
  isDarkMode: boolean;
  onThemeMode: (mode: 'light' | 'dark') => void;
}

export default function AdminSettingsPage({ isDarkMode, onThemeMode }: AdminSettingsPageProps) {
  const toast = useToast();
  const [name, setName] = useState('MultiPlus Academy');
  const [domain, setDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('institution_settings').select('nome, dominio, contacto').eq('id', 1).maybeSingle().then(({ data, error }) => {
      if (error) return;
      setName(data?.nome || 'MultiPlus Academy');
      setDomain(data?.dominio || '');
      setPhone(data?.contacto || '');
    });
  }, []);

  const saveInstitution = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-settings', { body: { action: 'update-institution', name: name.trim(), domain: domain.trim(), phone: phone.trim() } });
      if (error || data?.error) throw new Error(error?.message || data?.error || 'Não foi possível salvar as configurações.');
      toast.success('Configurações institucionais atualizadas.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-4xl space-y-6 text-left">
    <section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-600/15 text-gold-600"><Building2 size={20} /></span><div><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Instituição</p><h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Configurações institucionais</h2><p className="mt-1 text-xs text-neutral-400">Dados exibidos no portal e utilizados em comunicações oficiais.</p></div></div>
      <form onSubmit={saveInstitution} className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-xs font-semibold text-ink-900 dark:text-cream-100 sm:col-span-2">Nome da instituição<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 min-h-11 w-full rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></label><label className="text-xs font-semibold text-ink-900 dark:text-cream-100">Domínio<input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="academy.ao" className="mt-2 min-h-11 w-full rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></label><label className="text-xs font-semibold text-ink-900 dark:text-cream-100">Contato institucional<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-gray-250 bg-cream-200 px-3 text-sm outline-none focus:border-gold-600 dark:border-ink-800 dark:bg-ink-950 dark:text-cream-100" /></label><div className="sm:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-xs font-mono font-bold uppercase text-white transition hover:bg-gold-600 hover:text-ink-900 disabled:opacity-50 dark:bg-gold-600 dark:text-ink-900"><Save size={15} />{saving ? 'A guardar…' : 'Guardar instituição'}</button></div></form>
    </section>
    <section className="rounded-3xl border border-gray-150 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8"><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><MonitorCog size={20} /></span><div><p className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-gold-600">Preferência pessoal</p><h2 className="font-serif text-xl font-black text-ink-900 dark:text-cream-100">Aparência do painel</h2></div></div><div className="mt-6 flex flex-wrap gap-2"><button onClick={() => onThemeMode('light')} className={`min-h-11 rounded-xl px-4 text-xs font-mono font-bold uppercase ${!isDarkMode ? 'bg-ink-900 text-white' : 'border border-gray-250 text-neutral-500 dark:border-ink-800 dark:text-cream-200'}`}>Claro</button><button onClick={() => onThemeMode('dark')} className={`min-h-11 rounded-xl px-4 text-xs font-mono font-bold uppercase ${isDarkMode ? 'bg-gold-600 text-ink-900' : 'border border-gray-250 text-neutral-500 dark:border-ink-800 dark:text-cream-200'}`}>Escuro</button></div></section>
  </div>;
}
