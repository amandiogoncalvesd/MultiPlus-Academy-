// Edge Function: notify-application
// Envia para a secretaria da MultiPlus Academy (multiplusacademy@gmail.com)
// os dados de candidaturas e contactos submetidos no site, via Resend.
// Aceita dois formatos:
//  1) Invocação direta do cliente: { kind: 'application' | 'contact', payload: {...} }
//  2) Webhook de base de dados:    { type: 'INSERT', record: {...} }

const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const ACADEMY_EMAIL = Deno.env.get('ACADEMY_EMAIL') || 'multiplusacademy@gmail.com';
const FROM_ADDRESS = 'MultiPlus Academy <onboarding@resend.dev>';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface LooseRecord {
  [key: string]: unknown;
}

function pick(record: LooseRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function courseTitle(record: LooseRecord): string {
  const direct = pick(record, ['course_title', 'courseTitle']);
  if (direct) return direct;
  const nested = record['courses'] as { titulo?: string } | null | undefined;
  if (nested && typeof nested.titulo === 'string' && nested.titulo) return nested.titulo;
  return 'Curso não especificado';
}

function buildEmail(kind: string, record: LooseRecord): { subject: string; text: string } {
  const now = new Date().toLocaleString('pt-PT');
  if (kind === 'contact') {
    const name = pick(record, ['name', 'nome_completo']);
    const subject = `[Contacto — ${pick(record, ['subject']) || 'Geral'}] ${name}`;
    const text = [
      'MENSAGEM RECEBIDA NO FORMULÁRIO DE CONTACTOS',
      '============================================',
      '',
      `Nome: ${name}`,
      `Correio eletrónico: ${pick(record, ['email'])}`,
      `Telefone: ${pick(record, ['phone', 'telefone'])}`,
      `Assunto: ${pick(record, ['subject'])}`,
      '',
      'Mensagem:',
      pick(record, ['message']),
      '',
      `Registado em: ${now}`,
    ].join('\n');
    return { subject, text };
  }
  const name = pick(record, ['nome_completo', 'name']);
  const subject = `Nova candidatura — ${name}`;
  const text = [
    'NOVA CANDIDATURA RECEBIDA NO SITE DA MULTIPLUS ACADEMY',
    '========================================================',
    '',
    `Nome completo: ${name}`,
    `Correio eletrónico: ${pick(record, ['email'])}`,
    `Telefone: ${pick(record, ['telefone', 'phone'])}`,
    `Curso pretendido: ${courseTitle(record)}`,
    `Modalidade: ${pick(record, ['modalidade'])}`,
    '',
    'Ação solicitada: contactar o candidato e concluir a inscrição no painel',
    'administrativo (separador Candidaturas).',
    '',
    `Registado em: ${now}`,
  ].join('\n');
  return { subject, text };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: LooseRecord = {};
  try {
    body = (await req.json()) as LooseRecord;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Normaliza os dois formatos aceites.
  let kind = 'application';
  let record: LooseRecord = {};
  if (body && typeof body['record'] === 'object' && body['record']) {
    record = body['record'] as LooseRecord;
  } else if (body && typeof body['payload'] === 'object' && body['payload']) {
    record = body['payload'] as LooseRecord;
    kind = typeof body['kind'] === 'string' ? (body['kind'] as string) : 'application';
  } else {
    record = body;
    kind = typeof body['kind'] === 'string' ? (body['kind'] as string) : 'application';
  }
  if (kind !== 'contact' && kind !== 'application') kind = 'application';

  const name = pick(record, ['nome_completo', 'name']);
  const email = pick(record, ['email']);
  if (!name || !email) return json({ error: 'missing_name_or_email' }, 422);

  if (!RESEND_KEY) return json({ error: 'resend_not_configured' }, 500);

  const { subject, text } = buildEmail(kind, record);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [ACADEMY_EMAIL],
        subject,
        text,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('resend_error', res.status, JSON.stringify(data));
      return json({ error: 'resend_failed', detail: data }, 502);
    }
    return json({ ok: true, email_id: (data as { id?: string }).id ?? null });
  } catch (err) {
    console.error('resend_exception', err);
    return json({ error: 'resend_exception' }, 502);
  }
});
