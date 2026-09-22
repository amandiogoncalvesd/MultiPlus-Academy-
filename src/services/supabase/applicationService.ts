import { supabase } from '../../lib/supabase/client';

/** E-mail oficial da secretaria da MultiPlus Academy (destinatário das candidaturas). */
export const ACADEMY_EMAIL = 'multiplusacademy@gmail.com';

export type ApplicationStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface Application {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  course_id: string | null;
  modalidade: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  courses?: { titulo: string | null } | null;
}

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Pendente', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONTACTED: { label: 'Contactado', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  APPROVED: { label: 'Aprovado', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejeitado', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  ARCHIVED: { label: 'Arquivado', tone: 'bg-stone-100 text-stone-600 border-stone-200' },
};

/** Lista todas as candidaturas (política RLS permite apenas ADMIN). */
export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, courses(titulo)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Application[];
}

/** Quantidade de candidaturas pendentes (para o badge do menu administrativo). */
export async function countPendingApplications(): Promise<number> {
  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PENDING');
  if (error) throw error;
  return count ?? 0;
}

/** Atualiza o estado de tratamento de uma candidatura (apenas ADMIN). */
export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}

export interface ApplicationEmailInput {
  name: string;
  email: string;
  phone: string;
  courseTitle: string;
  modality: string;
}

/**
 * Prepara o e-mail de notificação dirigido à secretaria da MultiPlus Academy.
 * Sem provedor SMTP/API configurado no projeto, o envio é feito através do
 * cliente de e-mail do candidato (mailto), garantindo que a candidatura chega
 * diretamente à caixa multiplusacademy@gmail.com.
 */
export function buildApplicationEmail(input: ApplicationEmailInput): { subject: string; body: string; url: string } {
  const subject = `Nova candidatura — ${input.name}`;
  const body = [
    'NOVA CANDIDATURA RECEBIDA NO SITE DA MULTIPLUS ACADEMY',
    '========================================================',
    '',
    `Nome completo: ${input.name}`,
    `Correio eletrónico: ${input.email}`,
    `Telefone: ${input.phone}`,
    `Curso pretendido: ${input.courseTitle}`,
    `Modalidade: ${input.modality}`,
    `Data do registo: ${new Date().toLocaleString('pt-PT')}`,
    '',
    'Ação solicitada: contactar o candidato e concluir a inscrição.',
  ].join('\n');
  const url = `mailto:${ACADEMY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, url };
}

/** Prepara um e-mail genérico para a secretaria (formulário de contactos). */
export function buildContactEmail(input: { name: string; email: string; phone: string; subject: string; message: string }): { url: string } {
  const subject = `[Contacto — ${input.subject}] ${input.name}`;
  const body = [
    'MENSAGEM RECEBIDA NO FORMULÁRIO DE CONTACTOS',
    '============================================',
    '',
    `Nome: ${input.name}`,
    `Correio eletrónico: ${input.email}`,
    `Telefone: ${input.phone}`,
    `Assunto: ${input.subject}`,
    '',
    'Mensagem:',
    input.message,
  ].join('\n');
  return { url: `mailto:${ACADEMY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
