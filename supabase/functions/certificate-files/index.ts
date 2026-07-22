import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const createCode = () => `MPA-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } } },
  );
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Não autenticado.' }, 401);

    const action = new URL(request.url).searchParams.get('action') || request.headers.get('x-certificate-action');

    if (action === 'download') {
      const { certificateId } = await request.json();
      const { data: certificate, error } = await admin
        .from('certificates')
        .select('id, student_id, course_id, storage_path')
        .eq('id', certificateId)
        .maybeSingle();
      if (error || !certificate?.storage_path) return json({ error: 'Certificado não encontrado.' }, 404);

      const { data: requester } = await admin.from('users').select('role').eq('id', user.id).maybeSingle();
      const isOwner = certificate.student_id === user.id;
      const isAdmin = requester?.role === 'ADMIN';
      const { data: course } = await admin.from('courses').select('teacher_id').eq('id', certificate.course_id).maybeSingle();
      const isTeacher = requester?.role === 'PROFESSOR' && course?.teacher_id === user.id;
      if (!isOwner && !isAdmin && !isTeacher) return json({ error: 'Sem permissão para descarregar este certificado.' }, 403);

      const { data: signed, error: signedError } = await admin.storage
        .from('certificates')
        .createSignedUrl(certificate.storage_path, 60);
      if (signedError || !signed) throw signedError ?? new Error('Não foi possível assinar o ficheiro.');
      return json({ url: signed.signedUrl });
    }

    if (action !== 'issue') return json({ error: 'Ação inválida.' }, 400);

    const formData = await request.formData();
    const studentId = String(formData.get('studentId') || '');
    const courseId = String(formData.get('courseId') || '');
    const file = formData.get('file');
    if (!studentId || !courseId || !(file instanceof File)) return json({ error: 'Aluno, curso e PDF são obrigatórios.' }, 400);
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) return json({ error: 'Envie um PDF de até 10 MB.' }, 400);

    const { data: issuer } = await admin.from('users').select('role').eq('id', user.id).maybeSingle();
    const { data: course } = await admin.from('courses').select('id, teacher_id').eq('id', courseId).maybeSingle();
    const canIssue = issuer?.role === 'ADMIN' || (issuer?.role === 'PROFESSOR' && course?.teacher_id === user.id);
    if (!course || !canIssue) return json({ error: 'Sem permissão para emitir neste curso.' }, 403);

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .in('status', ['ACTIVE', 'COMPLETED'])
      .maybeSingle();
    if (!enrollment) return json({ error: 'O aluno não está matriculado neste curso.' }, 422);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${courseId}/${studentId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from('certificates').upload(storagePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const code = createCode();
    const { data: certificate, error: insertError } = await admin
      .from('certificates')
      .insert({
        student_id: studentId,
        course_id: courseId,
        codigo_validacao: code,
        issued_by: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select('id, codigo_validacao, emitido_em, student_id, course_id, file_name')
      .single();
    if (insertError) {
      await admin.storage.from('certificates').remove([storagePath]);
      throw insertError;
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'CERTIFICATE_ISSUED',
      entity_type: 'certificate',
      entity_id: certificate.id,
      metadata: { courseId, studentId, fileName: file.name },
    });

    return json({ data: certificate }, 201);
  } catch (error) {
    console.error('certificate-files error:', error);
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado.' }, 500);
  }
});
