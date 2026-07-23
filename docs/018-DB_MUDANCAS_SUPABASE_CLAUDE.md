# 🗄️ Documento de Orientação 018-DB — Mudanças no Banco de Dados (Supabase)

**Projeto:** MultiPlus Academy LMS  
**Destinatário:** Claude (Supabase MCP)  
**Autor:** Super Z (Orientador de Desenvolvimento)  
**Data:** 16 de Julho de 2026  
**Prioridade:** 🔴 Alta — Mudanças necessárias para suportar o dashboard do aluno refatorado  

---

## Contexto

O Gemini implementou as alterações de código no frontend, mas o banco de dados Supabase precisa ser atualizado para suportar as novas funcionalidades. A migration 004 já foi criada como arquivo (`supabase/migrations/004_video_notes_assignments.sql`) mas precisa ser **executada no Supabase** se ainda não foi.

Este documento lista TODAS as operações que o Claude precisa executar no Supabase, na ordem correta.

---

## Operação 1: Verificar se a Migration 004 já foi executada

**Executar no Supabase SQL Editor:**

```sql
-- Verificar se a tabela lesson_notes já existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lesson_notes'
);
```

- Se retornar `true` → Migration 004 já foi executada, pular para Operação 2.
- Se retornar `false` → Executar a Operação 1.1 abaixo.

### Operação 1.1: Executar Migration 004

O conteúdo completo da migration está no arquivo `supabase/migrations/004_video_notes_assignments.sql` do repositório. O Claude deve ler esse arquivo e executá-lo no Supabase via MCP.

**Resumo do que a migration cria:**

| Objeto | Tipo | Descrição |
|--------|------|-----------|
| `lesson_progress.video_progress_seconds` | Coluna nova | INTEGER DEFAULT 0 — guarda segundos assistidos do vídeo |
| `lessons.meeting_url` | Coluna nova | TEXT — link do Google Meet/Zoom da aula |
| `lesson_notes` | Tabela nova | Apontamentos do aluno vinculados ao vídeo (id, student_id, lesson_id, course_id, content, video_timestamp, created_at) |
| `assignments` | Tabela nova | Tarefas atribuídas pelo professor (id, course_id, lesson_id, teacher_id, titulo, descricao, due_date, status, created_at) |
| `assignment_submissions` | Tabela nova | Submissões de tarefas pelos alunos (id, assignment_id, student_id, submission_url, submission_text, feedback, grade, submitted_at) |
| RLS policies | Políticas | lesson_notes: aluno vê/salva suas notas; professor/admin vê tudo. assignments: alunos veem tarefas publicadas dos seus cursos; professor/admin gere tudo |
| `trg_notify_new_assignment` | Trigger | Notifica alunos quando nova tarefa é criada |

---

## Operação 2: Verificar integridade das tabelas existentes

**Executar no Supabase SQL Editor:**

```sql
-- Verificar se todas as tabelas necessárias existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Tabelas esperadas (17 no total):**

1. `users`
2. `profiles`
3. `courses`
4. `enrollments`
5. `modules`
6. `lessons`
7. `materials`
8. `messages`
9. `notifications`
10. `certificates`
11. `lesson_progress`
12. `lesson_targets`
13. `quiz_submissions`
14. `announcements`
15. `lesson_notes` ← NOVA (migration 004)
16. `assignments` ← NOVA (migration 004)
17. `assignment_submissions` ← NOVA (migration 004)

Se alguma tabela estiver faltando, reportar ao Super Z antes de continuar.

---

## Operação 3: Verificar se a coluna `foto_perfil` existe na tabela `users`

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
```

**Colunas esperadas na tabela `users`:**

| Coluna | Tipo | Not Null |
|--------|------|----------|
| id | UUID | YES (PK, FK→auth.users) |
| email | TEXT | YES |
| nome_completo | TEXT | |
| telefone | TEXT | |
| foto_perfil | TEXT | ← Deve existir |
| role | TEXT | YES (ADMIN/PROFESSOR/ALUNO) |
| created_at | TIMESTAMPTZ | YES |

Se `foto_perfil` não existir, executar:

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
```

---

## Operação 4: Verificar se a coluna `meeting_url` existe na tabela `lessons`

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lessons'
ORDER BY ordinal_position;
```

**Colunas esperadas na tabela `lessons`:**

| Coluna | Tipo |
|--------|------|
| id | UUID |
| course_id | UUID (FK→courses) |
| titulo | TEXT |
| descricao | TEXT |
| video_url | TEXT |
| ordem | INTEGER |
| duracao | TEXT |
| quiz | JSONB |
| scheduled_at | TIMESTAMPTZ |
| status | TEXT (DRAFT/PUBLISHED/ARCHIVED) |
| created_by | UUID (FK→users) |
| meeting_url | TEXT ← Deve existir (migration 004) |

Se `meeting_url` não existir, executar:

```sql
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS meeting_url TEXT;
```

---

## Operação 5: Verificar se a coluna `video_progress_seconds` existe na tabela `lesson_progress`

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lesson_progress'
ORDER BY ordinal_position;
```

**Colunas esperadas:**

| Coluna | Tipo |
|--------|------|
| id | UUID |
| student_id | UUID |
| course_id | UUID (nullable) |
| lesson_id | UUID |
| completed | BOOLEAN |
| video_progress_seconds | INTEGER ← Deve existir (migration 004) |
| created_at | TIMESTAMPTZ |

Se `video_progress_seconds` não existir, executar:

```sql
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0;
```

---

## Operação 6: Verificar a view `vw_student_progress`

```sql
SELECT definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'vw_student_progress';
```

A view deve calcular `progress_percent` corretamente com base nas aulas concluídas. Se a view não existir ou estiver desatualizada, recriar:

```sql
CREATE OR REPLACE VIEW public.vw_student_progress
WITH (security_invoker = true)
AS
SELECT
  e.student_id,
  e.course_id,
  c.title AS course_title,
  count(DISTINCT l.id) AS total_lessons,
  count(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed) AS completed_lessons,
  CASE WHEN count(DISTINCT l.id) = 0 THEN 0
       ELSE round(count(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed)::numeric / count(DISTINCT l.id) * 100)
  END AS progress_percent,
  avg(qs.score) AS avg_quiz_score,
  max(lp.created_at) AS last_activity
FROM public.enrollments e
JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.lessons l ON l.course_id = e.course_id
LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = e.student_id
LEFT JOIN public.quiz_submissions qs ON qs.lesson_id = l.id AND qs.student_id = e.student_id
GROUP BY e.student_id, e.course_id, c.title;
```

---

## Operação 7: Verificar o bucket de Storage `media`

O upload de avatares e materiais usa o bucket `media` no Supabase Storage. Verificar se existe:

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'media';
```

Se não existir, criar:

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
```

**Também verificar as políticas de storage:**

O bucket `media` precisa permitir:
- Upload autenticado (qualquer utilizador autenticado pode fazer upload)
- Leitura pública (qualquer um pode ler/ver os arquivos)

Se as políticas não existirem, criar:

```sql
-- Permitir upload para utilizadores autenticados
CREATE POLICY "media_upload_authenticated" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

-- Permitir leitura pública
CREATE POLICY "media_read_public" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'media');

-- Permitir update para o dono do arquivo
CREATE POLICY "media_update_owner" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir delete para o dono do arquivo
CREATE POLICY "media_delete_owner" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Operação 8: Verificar RLS em todas as tabelas

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Todas as tabelas devem ter `rowsecurity = true`.** Se alguma tiver `false`, ativar:

```sql
ALTER TABLE public.{nome_da_tabela} ENABLE ROW LEVEL SECURITY;
```

---

## Operação 9: Inserir dados de teste (OPCIONAL)

Para testar o dashboard do aluno, pode ser útil ter alguns dados de exemplo. **SOMENTE executar se o banco estiver vazio.**

```sql
-- Verificar se já existem cursos
SELECT count(*) FROM public.courses;
```

Se o count for 0 e você quiser dados de teste, solicitar ao Super Z o script de seed específico.

---

## Resumo das Operações

| # | Operação | Ação | Status |
|---|----------|------|--------|
| 1 | Migration 004 | Executar se `lesson_notes` não existir | ⬜ Pendente |
| 2 | Verificar tabelas | Confirmar 17 tabelas existem | ⬜ Pendente |
| 3 | Coluna `foto_perfil` | Adicionar se não existir em `users` | ⬜ Pendente |
| 4 | Coluna `meeting_url` | Adicionar se não existir em `lessons` | ⬜ Pendente |
| 5 | Coluna `video_progress_seconds` | Adicionar se não existir em `lesson_progress` | ⬜ Pendente |
| 6 | View `vw_student_progress` | Recriar se necessário | ⬜ Pendente |
| 7 | Bucket `media` | Criar bucket e políticas se necessário | ⬜ Pendente |
| 8 | RLS em todas as tabelas | Verificar e ativar | ⬜ Pendente |
| 9 | Dados de teste | Opcional, somente se banco vazio | ⬜ Pendente |

---

## Nota Importante

**A ordem de execução é crítica.** A Migration 004 (Operação 1) deve ser executada ANTES de verificar as colunas novas (Operações 4 e 5), pois a migration já adiciona essas colunas. Se a migration for executada com sucesso, as Operações 4 e 5 apenas confirmarão que as colunas existem.

Após completar todas as operações, reportar ao Super Z o resultado de cada verificação.

---

*Documento gerado por Super Z — Orientador de Desenvolvimento MultiPlus Academy*  
*Versão: 018-DB | Data: 16/07/2026 | Idioma: Português (com acentuação)*
