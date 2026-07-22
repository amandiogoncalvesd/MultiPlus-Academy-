# Consolidação Supabase: schema, migrations e configuração

**Status:** base versionada consolidada pela migration `005_schema_reconciliation.sql`.

## Fonte de verdade

A fonte de verdade do banco da aplicação é exclusivamente:

```text
supabase/migrations/*.sql
```

As migrations devem ser aplicadas em ordem numérica. O arquivo `supabase_schema.sql` é uma cópia histórica do schema inicial e **não deve ser usado para provisionar ambientes**. Ele não contém as evoluções das migrations 002–005.

## Sequência atual de migrations

| Migration | Responsabilidade |
|---|---|
| `001_initial_schema.sql` | Utilizadores, perfis, cursos, matrículas, módulos, aulas, materiais, mensagens, notificações, certificados, progresso e RLS inicial. |
| `002_lms_premium_features.sql` | Renomeia progresso, agenda de aula, alvo de aula, quiz, certificados PDF, anúncios, notificações e view de progresso. |
| `003_messages_whatsapp_features.sql` | Edição/remoção/resposta de mensagem e limpeza de conversa. |
| `004_video_notes_assignments.sql` | Progresso de vídeo, notas, tarefas e submissões. |
| `005_schema_reconciliation.sql` | Completa colunas, tabelas, índices, buckets e Realtime que já eram consultados pelo front-end mas não estavam versionados. |
| `006_security_rbac_and_lesson_access.sql` | Fecha cadastro público, RLS por curso/matrícula, RPCs mínimos e janela de acesso de aula. |

## Entidades reconciliadas pela migration 005

### Colunas existentes usadas pelo código

- `users.status`, `users.notif_email_certificados`;
- `courses.price`, `courses.updated_at`;
- `enrollments.data_inicio`, `enrollments.progress_percent`;
- `lessons.module_id`;
- `notifications.type`, `notifications.link`;
- certificado: `final_grade`, `revoked_at`, `revoked_reason`;
- mensagem: `status`, `forwarded_from`, `voice_data`.

### Tabelas que passam a existir na fonte de verdade

- `applications` — candidatura pública;
- `institution_settings` — configuração institucional única;
- `audit_logs` — base para trilha de auditoria persistente;
- `user_presence` — estado de presença/atividade;
- `message_deletions`, `message_reactions`, `pinned_messages`, `chat_media` — persistência do chat.

## Storage atual e migração futura

A migration cria os buckets esperados pelo código existente:

- `media`;
- `avatars`;
- `chat-media`.

Eles permanecem **públicos temporariamente** porque os serviços atuais gravam e consomem URLs públicas por `getPublicUrl`. Isto é compatibilidade, não o desenho final para conteúdo sensível.

Na fase de segurança/certificados, serão criados buckets privados para certificados e materiais protegidos, com URLs assinadas e policies por curso/matrícula. Não se deve colocar arquivo confidencial em `media` até essa migração.

## Realtime

As tabelas abaixo são adicionadas à publication `supabase_realtime`:

- `notifications`;
- `messages`;
- `user_presence`.

Isso sustenta as subscriptions já existentes no cliente. RLS ainda é aplicada às leituras/subscrições conforme a configuração Supabase.

## Configuração local

O arquivo `supabase/config.toml` representa a configuração de desenvolvimento local. Para iniciar localmente, é necessário instalar a Supabase CLI e Docker:

```bash
supabase start
supabase db reset
```

> Não execute `db reset` em um projeto remoto ou de produção. Em staging/produção, as migrations devem ser aplicadas pelo pipeline/agente autorizado da organização, com backup e registro do deploy.

## Variáveis do front-end

O Vite recebe somente valores públicos:

```dotenv
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-key>"
```

Nunca incluir no Vite, no GitHub ou em commits:

- `SUPABASE_SERVICE_ROLE_KEY`;
- segredos de Edge Functions;
- tokens de banco;
- credenciais de administrador.

Esses valores pertencem aos secrets do Supabase/Vercel/GitHub Actions, conforme o ambiente.

## Próxima migration: segurança por escopo acadêmico

A migration 006 já fecha as policies das tabelas centrais e o cadastro público. O próximo passo é aplicar as regras de janela de aula na UI/serviços e migrar certificados/materiais sensíveis para Storage privado com URLs assinadas.
