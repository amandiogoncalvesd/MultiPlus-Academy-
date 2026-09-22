import { ReactNode, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, GraduationCap, Inbox, Mail, MessageSquare, Phone, Search, UserPlus, X } from 'lucide-react';
import {
  Application,
  APPLICATION_STATUS_META,
  ApplicationStatus,
  listApplications,
  updateApplicationStatus,
} from '../../services/supabase/applicationService';
import { useToast } from '../ui/Toast';

interface Props {
  onRegisterApplicant: (application: Application) => void;
  onPendingCount: (count: number) => void;
}

const STATUS_ORDER: Array<'ALL' | ApplicationStatus> = ['ALL', 'PENDING', 'CONTACTED', 'APPROVED', 'REJECTED', 'ARCHIVED'];

/** Normaliza telefones angolanos para o formato internacional usado no WhatsApp. */
function whatsappNumber(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('244') && digits.length === 9) digits = `244${digits}`;
  return digits;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase() || 'C';
}

export default function AdminApplicationsPanel({ onRegisterApplicant, onPendingCount }: Props) {
  const toast = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | ApplicationStatus>('ALL');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await listApplications();
        if (!active) return;
        setApplications(rows);
        onPendingCount(rows.filter((a) => a.status === 'PENDING').length);
      } catch {
        if (active) toast.error('Não foi possível carregar as candidaturas.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => applications.filter((app) => {
    const matchesStatus = filter === 'ALL' || app.status === filter;
    const haystack = `${app.nome_completo} ${app.email} ${app.telefone ?? ''} ${app.courses?.titulo ?? ''}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  }), [applications, filter, query]);

  const counts = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
  }), [applications]);

  const changeStatus = async (app: Application, status: ApplicationStatus) => {
    if (app.status === status) return;
    const previous = app.status;
    setSavingId(app.id);
    setApplications((current) => current.map((item) => (item.id === app.id ? { ...item, status } : item)));
    try {
      await updateApplicationStatus(app.id, status);
      setSelected((current) => (current && current.id === app.id ? { ...current, status } : current));
      toast.success(`Candidatura de ${app.nome_completo} marcada como ${APPLICATION_STATUS_META[status].label.toLowerCase()}.`);
    } catch {
      setApplications((current) => current.map((item) => (item.id === app.id ? { ...item, status: previous } : item)));
      toast.error('Não foi possível atualizar o estado. Verifique se a migração 015 foi aplicada.');
    } finally {
      setSavingId(null);
    }
  };

  const StatusSelect = ({ app, compact }: { app: Application; compact?: boolean }) => (
    <select
      aria-label={`Estado da candidatura de ${app.nome_completo}`}
      value={app.status}
      disabled={savingId === app.id}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => changeStatus(app, event.target.value as ApplicationStatus)}
      className={`rounded-lg border px-2 py-1.5 font-mono text-[10px] font-bold outline-none transition-colors focus:border-[#A16207] disabled:opacity-60 ${APPLICATION_STATUS_META[app.status].tone} ${compact ? '' : 'min-w-32'}`}
    >
      {(Object.keys(APPLICATION_STATUS_META) as ApplicationStatus[]).map((status) => (
        <option key={status} value={status}>{APPLICATION_STATUS_META[status].label}</option>
      ))}
    </select>
  );

  return <div className="mx-auto max-w-[1440px] space-y-5 text-left">
    <section className="ledger-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="ledger-eyebrow">Admissões</p>
          <h1 className="mt-2 font-serif text-2xl font-black text-[#1C1917] dark:text-white">Candidaturas</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#78716C]">
            Pedidos de inscrição recebidos pelo formulário público do site. Contacte o candidato, atualize o tratamento e conclua a matrícula criando a conta institucional.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Pendentes" value={counts.pending} icon={<Clock size={13} className="text-amber-600" />} detail="Aguardam contacto" />
          <Metric label="Aprovadas" value={counts.approved} icon={<CheckCircle2 size={13} className="text-emerald-600" />} detail="Matrícula concluída" />
          <Metric label="Total" value={counts.total} icon={<Inbox size={13} className="text-[#A16207]" />} detail="Histórico completo" />
        </div>
      </div>
    </section>

    <section className="ledger-panel overflow-hidden">
      <div className="space-y-3 border-b border-[#E7E5E4] p-4 dark:border-[#273244]">
        <label className="relative block">
          <span className="sr-only">Pesquisar candidaturas</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="ledger-input pl-10" placeholder="Pesquisar por nome, e-mail, telefone ou curso" />
        </label>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar candidaturas por estado">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              role="tab"
              aria-selected={filter === status}
              onClick={() => setFilter(status)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
                filter === status
                  ? 'border-[#0B1629] bg-[#0B1629] text-white dark:border-[#A16207] dark:bg-[#A16207]'
                  : 'border-[#E7E5E4] bg-white text-[#78716C] hover:border-[#A16207]/50 dark:border-[#273244] dark:bg-[#101827]'
              }`}
            >
              {status === 'ALL' ? `Todas (${applications.length})` : `${APPLICATION_STATUS_META[status].label} (${applications.filter((a) => a.status === status).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-[#A16207] border-t-transparent" aria-label="A carregar" /></div>
      ) : <>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1080px]">
            <thead className="bg-[#FAFAF9] dark:bg-[#0B111C]">
              <tr className="text-left font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#78716C]">
                <th className="px-5 py-3.5">Candidato</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Curso pretendido</th>
                <th className="px-5 py-3.5">Modalidade</th>
                <th className="px-5 py-3.5">Recebida</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] dark:divide-[#273244]">
              {rows.map((app) => (
                <tr key={app.id} className="cursor-pointer transition-colors hover:bg-[#FAFAF9] dark:hover:bg-[#0B111C]" onClick={() => setSelected(app)}>
                  <td className="px-5 py-4">
                    <div className="flex min-w-[210px] items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-xs font-bold text-[#A16207]">{initials(app.nome_completo)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1C1917] dark:text-white">{app.nome_completo}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-[#78716C]">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                      <a href={`mailto:${app.email}`} aria-label={`Enviar e-mail a ${app.nome_completo}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] text-[#78716C] hover:border-[#A16207] hover:text-[#A16207] dark:border-[#273244]"><Mail size={13} /></a>
                      {whatsappNumber(app.telefone) && (
                        <a href={`https://wa.me/${whatsappNumber(app.telefone)}`} target="_blank" rel="noopener noreferrer" aria-label={`Contactar ${app.nome_completo} no WhatsApp`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E5E4] text-[#78716C] hover:border-emerald-500 hover:text-emerald-600 dark:border-[#273244]"><MessageSquare size={13} /></a>
                      )}
                      <span className="ml-1 text-[11px] text-[#78716C]">{app.telefone || 'Sem telefone'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><p className="max-w-[190px] truncate text-xs font-medium text-[#1C1917] dark:text-white">{app.courses?.titulo || 'Curso não indicado'}</p></td>
                  <td className="px-5 py-4"><p className="text-xs text-[#78716C]">{app.modalidade || '—'}</p></td>
                  <td className="px-5 py-4"><p className="font-mono text-[10px] text-[#78716C]">{new Date(app.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</p></td>
                  <td className="px-5 py-4"><StatusSelect app={app} /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={(event) => { event.stopPropagation(); onRegisterApplicant(app); }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#A16207]/40 px-2.5 text-[10px] font-bold text-[#A16207] transition-colors hover:bg-[#F5F0E8]"
                      >
                        <UserPlus size={13} />Registrar usuário
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-2 p-3 xl:hidden">
          {rows.map((app) => (
            <button key={app.id} onClick={() => setSelected(app)} className="w-full rounded-xl border border-[#E7E5E4] p-3 text-left transition-colors hover:bg-[#FAFAF9] dark:border-[#273244] dark:hover:bg-[#0B111C]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-xs font-bold text-[#A16207]">{initials(app.nome_completo)}</span>
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-[#1C1917] dark:text-white">{app.nome_completo}</b>
                  <span className="mt-0.5 block truncate text-[11px] text-[#78716C]">{app.courses?.titulo || 'Curso não indicado'} · {new Date(app.created_at).toLocaleDateString('pt-PT')}</span>
                </span>
                <StatusSelect app={app} compact />
              </div>
            </button>
          ))}
        </div>

        {!rows.length && (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <GraduationCap className="text-[#A16207]" size={24} />
            <p className="mt-3 text-sm font-semibold text-[#1C1917] dark:text-white">Sem candidaturas neste filtro</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#78716C]">
              As submissões do formulário público de inscrição (botão “Inscrição” do site) aparecem aqui automaticamente e também notificam <span className="font-semibold">multiplusacademy@gmail.com</span> por e-mail.
            </p>
          </div>
        )}
      </>}
    </section>

    {selected && <ApplicationDetails app={applications.find((a) => a.id === selected.id) ?? selected} onClose={() => setSelected(null)} onRegister={() => { onRegisterApplicant(selected); setSelected(null); }} statusControl={<StatusSelect app={applications.find((a) => a.id === selected.id) ?? selected} />} />}
  </div>;
}

function Metric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: ReactNode }) {
  return <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-3 dark:border-[#273244] dark:bg-[#0B111C]">
    <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#78716C]">{icon}{label}</p>
    <p className="mt-1 font-serif text-xl font-black text-[#1C1917] dark:text-white">{value}</p>
    <p className="mt-0.5 text-[10px] text-[#78716C]">{detail}</p>
  </div>;
}

function ApplicationDetails({ app, onClose, onRegister, statusControl }: { app: Application; onClose: () => void; onRegister: () => void; statusControl: ReactNode }) {
  return <div className="fixed inset-0 z-[90] flex justify-end">
    <button onClick={onClose} aria-label="Fechar detalhes da candidatura" className="absolute inset-0 cursor-default bg-[#0B1629]/50 backdrop-blur-sm" />
    <aside role="dialog" aria-modal="true" aria-label="Detalhes da candidatura" className="relative h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl dark:bg-[#101827] sm:p-6">
      <div className="flex items-start justify-between">
        <p className="ledger-eyebrow">Pedido de inscrição</p>
        <button onClick={onClose} className="rounded-lg p-2 text-[#78716C] hover:bg-[#F5F0E8]" aria-label="Fechar"><X size={17} /></button>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8] text-lg font-black text-[#A16207]">{initials(app.nome_completo)}</span>
        <div>
          <h2 className="font-serif text-xl font-black text-[#1C1917] dark:text-white">{app.nome_completo}</h2>
          <div className="mt-2">{statusControl}</div>
        </div>
      </div>
      <dl className="mt-7 space-y-4">
        <Detail icon={<Mail size={15} />} label="Correio eletrónico" value={app.email} />
        <Detail icon={<Phone size={15} />} label="Telefone" value={app.telefone || 'Não informado'} />
        <Detail icon={<GraduationCap size={15} />} label="Curso pretendido" value={app.courses?.titulo || 'Curso não indicado'} />
        <Detail icon={<Clock size={15} />} label="Modalidade" value={app.modalidade || 'Não indicada'} />
        <Detail icon={<Inbox size={15} />} label="Recebida em" value={new Date(app.created_at).toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })} />
      </dl>
      <div className="mt-8 grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <a href={`mailto:${app.email}`} className="ledger-secondary inline-flex items-center justify-center gap-2"><Mail size={14} />Responder por e-mail</a>
          {whatsappNumber(app.telefone)
            ? <a href={`https://wa.me/${whatsappNumber(app.telefone)}`} target="_blank" rel="noopener noreferrer" className="ledger-secondary inline-flex items-center justify-center gap-2"><MessageSquare size={14} />WhatsApp</a>
            : <span className="ledger-secondary inline-flex items-center justify-center gap-2 opacity-50"><MessageSquare size={14} />Sem WhatsApp</span>}
        </div>
        <button onClick={onRegister} className="ledger-primary inline-flex items-center justify-center gap-2"><UserPlus size={15} />Registrar usuário com estes dados</button>
      </div>
    </aside>
  </div>;
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3">
    <span className="mt-0.5 text-[#A16207]">{icon}</span>
    <div>
      <dt className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#78716C]">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-relaxed text-[#1C1917] dark:text-white">{value}</dd>
    </div>
  </div>;
}
