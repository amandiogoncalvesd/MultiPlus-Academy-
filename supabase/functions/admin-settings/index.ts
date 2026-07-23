import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return reply({ error: 'Não autenticado.' }, 401);
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: account } = await admin.from('users').select('role').eq('id', user.id).maybeSingle();
    if (account?.role !== 'ADMIN') return reply({ error: 'Permissão de administrador necessária.' }, 403);
    const body = await request.json();
    if (body.action !== 'update-institution') return reply({ error: 'Ação inválida.' }, 400);
    if (!body.name?.trim()) return reply({ error: 'Nome institucional obrigatório.' }, 422);
    const { data, error } = await admin.from('institution_settings').upsert({ id: 1, nome: body.name.trim(), dominio: body.domain?.trim() || null, contacto: body.phone?.trim() || null, updated_at: new Date().toISOString(), updated_by: user.id }).select().single();
    if (error) throw error;
    await admin.from('audit_logs').insert({ actor_id: user.id, action: 'INSTITUTION_SETTINGS_UPDATED', entity_type: 'institution_settings', metadata: { domain: data.dominio, contact: data.contacto } });
    return reply({ data });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500); }
});
