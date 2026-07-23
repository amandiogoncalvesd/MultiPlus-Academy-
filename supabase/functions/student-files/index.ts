import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } });
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  try {
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return json({ error: 'Não autenticado.' }, 401);
    const action = new URL(request.url).searchParams.get('action');
    if (action === 'upload-submission') {
      const form = await request.formData(); const assignmentId = String(form.get('assignmentId') || ''); const file = form.get('file'); const text = String(form.get('text') || '');
      if (!assignmentId || !(file instanceof File)) return json({ error: 'Tarefa e ficheiro são obrigatórios.' }, 422);
      if (file.size > 20 * 1024 * 1024) return json({ error: 'O ficheiro deve ter no máximo 20 MB.' }, 422);
      const { data: assignment } = await admin.from('assignments').select('id, course_id, status').eq('id', assignmentId).maybeSingle();
      if (!assignment || assignment.status !== 'PUBLISHED') return json({ error: 'Tarefa indisponível.' }, 404);
      const { data: enrollment } = await admin.from('enrollments').select('id').eq('student_id', user.id).eq('course_id', assignment.course_id).eq('status', 'ACTIVE').maybeSingle();
      if (!enrollment) return json({ error: 'Sem matrícula ativa para esta tarefa.' }, 403);
      const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const path = `${assignment.course_id}/${assignmentId}/${user.id}/${Date.now()}-${name}`;
      const { error: uploadError } = await admin.storage.from('student-submissions').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (uploadError) throw uploadError;
      const { data, error } = await admin.from('assignment_submissions').upsert({ assignment_id: assignmentId, student_id: user.id, submission_text: text || null, storage_path: path, file_name: file.name, file_size: file.size, mime_type: file.type || null, submission_url: null }, { onConflict: 'assignment_id,student_id' }).select().single();
      if (error) { await admin.storage.from('student-submissions').remove([path]); throw error; }
      return json({ data }, 201);
    }
    if (action === 'download-material') {
      const { materialId } = await request.json();
      const { data: material } = await admin.from('materials').select('id, storage_path, arquivo_url, lesson:lessons!inner(course_id, access_starts_at, access_ends_at)').eq('id', materialId).maybeSingle();
      if (!material) return json({ error: 'Material não encontrado.' }, 404);
      const lesson: any = material.lesson;
      const { data: enrollment } = await admin.from('enrollments').select('id').eq('student_id', user.id).eq('course_id', lesson.course_id).eq('status', 'ACTIVE').maybeSingle();
      if (!enrollment) return json({ error: 'Sem matrícula ativa.' }, 403);
      const now = Date.now(); const start = lesson.access_starts_at ? new Date(lesson.access_starts_at).getTime() : 0; const end = lesson.access_ends_at ? new Date(lesson.access_ends_at).getTime() : 0;
      if (!start || !end || now < start || now >= end) return json({ error: 'Este material está fora da janela de acesso da aula.' }, 403);
      if (material.storage_path) { const { data: signed, error } = await admin.storage.from('course-materials').createSignedUrl(material.storage_path, 60); if (error || !signed) throw error ?? new Error('Não foi possível assinar o material.'); return json({ url: signed.signedUrl }); }
      if (material.arquivo_url?.startsWith('https://')) return json({ url: material.arquivo_url, legacy: true });
      return json({ error: 'Material sem ficheiro privado configurado.' }, 404);
    }
    return json({ error: 'Ação inválida.' }, 400);
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500); }
});
