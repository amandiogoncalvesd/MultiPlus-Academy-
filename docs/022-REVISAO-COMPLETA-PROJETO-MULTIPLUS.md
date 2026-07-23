# 022 — Revisão Completa do Projeto MultiPlus Academy

> **Projeto:** MultiPlus Academy  
> **Data:** 17 de Julho de 2026  
> **Escopo:** Análise de todo o código-fonte, infraestrutura, serviços, dashboards, páginas públicas, autenticação, RLS e mensagens  
> **Objetivo:** Identificar o que funciona, o que está quebrado, o que falta e definir o plano de próximos passos

---

## 1. Visão Geral do Projeto

| Atributo | Valor |
|----------|-------|
| **Stack** | React 19 + Vite 6 + Tailwind 4 + Supabase + TypeScript |
| **Linhas de Código** | ~32.600 (22.167 em `src/`) |
| **Ficheiros em `src/`** | 71 ficheiros |
| **Migrations Supabase** | 4 (001–004), 688 linhas SQL |
| **Componentes React** | 40+ componentes |
| **Serviços** | 9 serviços Supabase |
| **Hooks** | 4 hooks customizados |
| **API Backend** | NestJS (em `apps/api/`) — **não integrado ao frontend** |
| **Monorepo** | Turborepo + pnpm workspaces |

---

## 2. Arquitetura e Roteamento

### 2.1 Navegação Baseada em Estado (SEM react-router)

O projeto **não usa react-router-dom**. Toda a navegação é feita via `useState<PageId>('home')` com `switch/case`. Isto significa:

- ❌ Sem URLs reais — `/about`, `/courses` não existem como URLs
- ❌ Sem deep-linking — refresh volta sempre à home
- ❌ Sem botão voltar/avançar do browser
- ❌ Sem SEO indexável
- ❌ Prop drilling profundo — `setCurrentPage` é passado por toda a árvore

### 2.2 Páginas e Proteção

| Página | Componente | Protegida? | Funcional? |
|--------|-----------|-----------|-----------|
| `home` | HomePanel | ❌ Pública | ❌ Decorativa, 100% hardcoded |
| `about` | AboutPanel | ❌ Pública | ❌ Decorativa, 100% hardcoded |
| `courses` | CoursesPanel | ❌ Pública | ⚠️ Híbrida — DB + fallback hardcoded |
| `instructors` | InstructorsPanel | ❌ Pública | ❌ Decorativa, 1 instrutor hardcoded |
| `blog` | BlogPanel | ❌ Pública | ⚠️ Leitura funciona, dados hardcoded |
| `contact` | ContactPanel | ❌ Pública | ❌ Formulário FAKE (setTimeout) |
| `login` | LoginPanel | ❌ Pública | ✅ Funcional com Supabase Auth |
| `verify-certificate` | VerifyCertificatePanel | ❌ Pública | ✅ Funcional |
| `register` | — | ❌ | 🔴 **BUG**: Definido no tipo mas sem case no switch |
| `student-dashboard` | StudentPortal | ✅ ALUNO+ | ⚠️ Parcial — dados mistos |
| `instructor-dashboard` | InstructorPortal | ✅ PROFESSOR+ | ❌ 25+ dados fictícios (ver doc 019) |
| `admin-dashboard` | AdminPortal | ✅ ADMIN | ⚠️ Parcial — 17 alert(), funcionalidades fake |
| `messages` | MessagesPage | ✅ Autenticado | ✅ Melhor componente do projeto |

### 2.3 Problemas Arquiteturais

1. **Monólitos de 1.000+ linhas** — `StudentPortal.tsx` (1.924), `AdminPortal.tsx` (1.773), `HomePanel.tsx` (1.359), `CourseEditorModal.tsx` (1.135)
2. **Sem code splitting** — Todos os 40+ componentes são importados eagerly
3. **`currentUser` duplicado** — `App.tsx` mantém estado próprio sincronizado do `AuthProvider`
4. **Sem lazy loading** — Nenhum `React.lazy()` usado
5. **NestJS não integrado** — `apps/api/` existe mas o frontend usa apenas Supabase diretamente

---

## 3. Análise por Dashboard

### 3.1 StudentPortal (1.924 linhas) — ⚠️ PARCIAL

**O que funciona bem:**
- ✅ Player de vídeo com progresso salvo a cada 15s
- ✅ Quiz com persistência de score no Supabase
- ✅ Apontamentos de aula com timestamp
- ✅ Upload de submissões de tarefas (Storage real)
- ✅ Certificados lidos do Supabase
- ✅ Exportação .ics de agendamentos
- ✅ Perfil editável com upload de avatar

**Problemas identificados:**

| Problema | Gravidade |
|----------|-----------|
| `streakCount` default = 5 — nunca calculado do DB | MÉDIA |
| `hours` hardcoded = 0 — nunca calculado | MÉDIA |
| PDF export com fallback para "antonio" | BAIXA |
| Sem fluxo de auto-matrícula — aluno não pode inscrever-se | ALTA |
| Calendário é apenas lista plana — sem grid mensal real | MÉDIA |
| Tab mensagens é só redirecionamento | BAIXA |
| 4 chamadas `alert()` | MÉDIA |
| Search é keyword router, não busca real | BAIXA |
| Sem paginação em nenhuma lista | MÉDIA |

### 3.2 InstructorPortal (1.113 linhas) — ❌ CRÍTICO

**Análise detalhada já existe no documento 019.** Resumo:

- 25+ dados fictícios identificados
- 4 operações CRUD sem persistência
- 7/8 subscrições Realtime em falta
- 5 tabs inline não modularizados
- `pendingGreads = 3`, `completionRate = 95%` hardcoded
- `InstructorEvaluationsTab` é 100% fictício
- Tabelas `assignments` e `assignment_submissions` não integradas

### 3.3 AdminPortal (1.773 linhas) — ⚠️ PARCIAL

**O que funciona bem:**
- ✅ CRUD de utilizadores via Edge Function
- ✅ Gestão de cursos via CourseEditorModal
- ✅ Emissão de certificados real
- ✅ Notificações lidas do Supabase
- ✅ Settings institucionais salvos
- ✅ Perfil admin editável

**Problemas identificados:**

| Problema | Gravidade |
|----------|-----------|
| Audit logs são 100% locais — perdidos no refresh | ALTA |
| Broadcast é fake — `broadcastLog` é só state local | ALTA |
| Geração de relatórios é fake — só `alert()` | ALTA |
| Status de integrações hardcoded "Conectado" | MÉDIA |
| `loadDatabase()` roda a CADA troca de tab | ALTA (performance) |
| 17 chamadas `alert()` + 3 `confirm()` | MÉDIA |
| Impersonation sem audit trail | ALTA (segurança) |
| Sem gestão de matrículas (add/remove) | ALTA |
| Sem tracking de pagamentos | MÉDIA |
| Tabela `institution_settings` SEM migration | CRÍTICA |

---

## 4. Análise das Páginas Públicas

| Página | Dados Reais? | Formulários? | Pronta para Produção? |
|--------|-------------|-------------|----------------------|
| **Home** | ❌ 100% hardcoded | Nenhum | ❌ Precisa de CMS |
| **Courses** | ⚠️ Híbrida (DB+fallback) | ❌ Inscrição fake | ⚠️ Parcial |
| **About** | ❌ 100% hardcoded | Nenhum | ❌ Precisa de CMS |
| **Blog** | ❌ 100% hardcoded | Share = `alert()` | ❌ Precisa de CMS |
| **Contact** | ❌ Dados hardcoded | ❌ **FAKE** (setTimeout) | ❌ Sem backend |
| **Instructors** | ❌ 1 instrutor hardcoded | Nenhum | ❌ Precisa de DB |
| **Footer** | ❌ 100% hardcoded | ❌ Newsletter fake | ❌ Sem backend |
| **Login** | ✅ Supabase Auth | ✅ Funcional | ⚠️ Sem reset password |
| **Verify Cert** | ✅ Supabase | ✅ Funcional | ⚠️ Dados fallback |

### Funcionalidades Faltantes Críticas nas Páginas Públicas

1. **Formulário de Contacto** — Simula envio com `setTimeout`, dados vão apenas para `console.log`
2. **Newsletter do Footer** — Estado local apenas, nada é enviado
3. **Blog** — Artigos hardcoded em `data.ts`, sem CMS
4. **Inscrição em Cursos** — "Inscrever-se" abre modal de signup, não matricula
5. **Página de Registro** — Definida no tipo mas sem implementação (bug)

---

## 5. Análise do Sistema de Mensagens

### 5.1 O que Funciona ✅

O sistema de chat é **o componente mais production-ready** do projeto:

- ✅ Mensagens em tempo real via Supabase Realtime (`postgres_changes`)
- ✅ Indicadores de digitação via `presenceService`
- ✅ Edição e exclusão de mensagens (soft delete)
- ✅ Resposta a mensagens (threading)
- ✅ Reações emoji
- ✅ Envio bulk (ADMIN)
- ✅ Limpar conversação
- ✅ Novas conversas
- ✅ Agrupamento por dia
- ✅ Contadores de não lidas

### 5.2 Problemas do Chat

| Problema | Gravidade |
|----------|-----------|
| **5 tabelas SEM migration**: `user_presence`, `message_deletions`, `chat_media`, `message_reactions`, `pinned_messages` | CRÍTICA |
| Reações são **localStorage-only** — outros utilizadores não veem | ALTA |
| Channel leak em `presenceService.broadcastTyping()` — novo canal a cada keystroke | ALTA |
| Sem paginação — carrega TODAS as mensagens | MÉDIA |
| Sem anexos de ficheiros (apenas texto) | MÉDIA |
| Sem mensagens de voz | BAIXA |
| Sem pesquisa dentro de conversas | BAIXA |
| `getConversationPartners()` carrega TODAS as mensagens e filtra client-side | ALTA (performance) |

---

## 6. Análise dos Serviços Supabase

### 6.1 Matriz de Sobreposição de Serviços

| Operação | `courseService` | `academicService` | `enrollmentService` |
|----------|:-:|:-:|:-:|
| `getCourses()` | ✅ | ✅ | — |
| `createCourse()` | ✅ | ✅ | — |
| `updateCourse()` | ✅ | ✅ | — |
| `deleteCourse()` | ✅ | ✅ | — |
| `enrollStudent()` | ✅ | ✅ | ✅ |
| `getLessons()` | — | ✅ | — |
| `createLesson()` | — | ✅ | — |

**Problema:** 3 serviços duplicam lógica de cursos e matrículas com implementações diferentes. `academicService` é um "god object" com 28 métodos.

### 6.2 Bug CRÍTICO: `student_progress` vs `lesson_progress`

`enrollmentService.ts` usa `supabase.from('student_progress')` mas a Migration 002 **renomeou** a tabela para `lesson_progress`. Isto **falha em runtime** silenciosamente.

### 6.3 Tratamento de Erros Inconsistente

| Padrão | Serviços | Problema |
|--------|----------|----------|
| Retorna `[]` em erro | courseService, academicService (reads) | Swallows errors |
| Retorna `null` em erro | courseService (getById), avatarService | Swallows errors |
| Faz `throw` | academicService (writes), authService | ✅ Correto |
| `console.error` + swallow | academicService (videoProgress) | Erro silencioso |
| Zero error handling | avatarService (getAvatarUrl), academicService (getVideoProgress) | 🔴 Perigoso |

---

## 7. Análise de Autenticação e Segurança

### 7.1 🔴 VULNERABILIDADE CRÍTICA: Escalação de Role

No signup, o `role` é passado em `user_metadata` (client-writable). O trigger `handle_new_user()` copia diretamente:

```sql
COALESCE(new.raw_user_meta_data->>'role', 'ALUNO')
```

**Qualquer pessoa pode registar-se como ADMIN ou PROFESSOR.** Isto é uma vulnerabilidade de segurança crítica.

**Correção necessária:**
```sql
-- Forçar sempre ALUNO no trigger:
'ALUNO'  -- Apenas ADMIN pode promover utilizadores
```

### 7.2 RLS — Políticas Problemáticas

| Tabela | Problema |
|--------|----------|
| `users` | SELECT com `USING (true)` — **qualquer pessoa pode ler todos os emails e telefones** |
| `profiles` | SELECT com `USING (true)` — **PII acessível por todos** |
| `notifications` | Alunos **não podem marcar notificações como lidas** (política só permite PROF/ADMIN) |
| `modules` | `course_id = course_id` ambíguo — pode vazar módulos de cursos não matriculados |

### 7.3 Tabelas SEM Migration

| Tabela | Referenciada em | Impacto |
|--------|----------------|---------|
| `institution_settings` | AdminPortal | Settings page falha |
| `user_presence` | presenceService | Online status falha |
| `message_deletions` | messageService | "Delete for me" falha (localStorage fallback) |
| `chat_media` | messageService | Anexos de chat falham |
| `message_reactions` | messageService | Reações falham (localStorage fallback) |
| `pinned_messages` | messageService | Mensagens fixas falham |

### 7.4 Buckets de Storage SEM Migration

| Bucket | Referenciado em |
|--------|----------------|
| `chat-media` | messageService |
| `media` | avatarService, CourseEditorModal, CertificateIssueModal |
| `avatars` | AdminPortal |

---

## 8. Análise de UI/UX e Design System

### 8.1 O que está Bom ✅

- Design premium com paleta consistente (gold-600, ink-900, cream-100)
- Sistema de tema dark/light/high-contrast funcional
- Tailwind 4 com custom tokens (ink, cream, gold, espresso)
- Animações suaves com Framer Motion
- Componentes UI reutilizáveis (StarBorder, PillNav, GooeyNav, Carousel, TextType)
- Toast system já existe e funciona (`src/components/ui/Toast.tsx`)
- Responsividade mobile com sidebar colapsável

### 8.2 Problemas de UX

| Problema | Impacto |
|----------|---------|
| 30+ chamadas `alert()` e `confirm()` | UX não-profissional, bloqueante |
| Sem loading skeletons | Parece que a app está "pendurada" |
| Sem error boundaries | Erro num componente pode crashar toda a app |
| Sem estados vazios consistentes | Utilizador vê ecrãs em branco |
| Formulário de contacto fake | Utilizador pensa que enviou mas nada acontece |
| Newsletter fake | Idem |
| Sem onboarding para novos utilizadores | Primeira experiência é confusa |

---

## 9. Resumo Quantitativo de Problemas

| Categoria | Quantidade | Gravidade |
|-----------|-----------|-----------|
| **Vulnerabilidades de segurança** | 3 | 🔴 CRÍTICA |
| **Tabelas sem migration** | 6 | 🔴 CRÍTICA |
| **Buckets sem migration** | 3 | 🔴 CRÍTICA |
| **Dados fictícios no Instructor Dashboard** | 25+ | 🔴 CRÍTICA |
| **Chamadas `alert()` em todo o projeto** | 30+ | 🟡 ALTA |
| **Funcionalidades fake (forms, reports, broadcast)** | 5 | 🟡 ALTA |
| **Serviços duplicados** | 7+ métodos | 🟡 ALTA |
| **Bug `student_progress`** | 1 | 🔴 CRÍTICA |
| **Bug página `register`** | 1 | 🟡 MÉDIA |
| **Falta de Realtime subscriptions** | 7/8 | 🟡 ALTA |
| **Channel leak em presenceService** | 1 | 🟡 ALTA |
| **Páginas 100% hardcoded** | 5 | 🟠 MÉDIA |
| **Sem paginação** | Global | 🟠 MÉDIA |
| **Sem react-router** | Global | 🟠 MÉDIA |

---

## 10. Plano de Próximos Passos — 6 Fases

### FASE 0 — Correções Críticas de Segurança e Infraestrutura (1-2 dias)

**Prioridade máxima. Sem isto, o sistema é inseguro e funcionalidades quebram.**

| # | Ação | Ficheiros |
|---|------|-----------|
| 0.1 | **Corrigir vulnerabilidade de escalação de role** — Forçar `role = 'ALUNO'` no trigger `handle_new_user()` | `supabase/migrations/005_*.sql` |
| 0.2 | **Criar Migration 005** com tabelas faltantes: `institution_settings`, `user_presence`, `message_deletions`, `chat_media`, `message_reactions`, `pinned_messages` | Nova migration |
| 0.3 | **Criar storage buckets** via migration: `chat-media`, `media`, `avatars` com políticas de acesso | Migration 005 |
| 0.4 | **Corrigir `enrollmentService.ts`** — Trocar `student_progress` → `lesson_progress` e corrigir colunas | `src/services/supabase/enrollmentService.ts` |
| 0.5 | **Corrigir RLS de notifications** — Adicionar política UPDATE para `auth.uid() = user_id` | Migration 005 |
| 0.6 | **Corrigir RLS de users/profiles** — Remover `USING (true)`, restringir a utilizadores autenticados | Migration 005 |
| 0.7 | **Corrigir RLS ambígua de modules** — Disambiguar `course_id` | Migration 005 |
| 0.8 | **Corrigir channel leak** em `presenceService.broadcastTyping()` — reutilizar canal | `src/services/supabase/presenceService.ts` |
| 0.9 | **Atualizar `supabase_schema.sql`** raiz para incluir migrations 002-004 | `supabase_schema.sql` |

### FASE 1 — Fundação do Frontend (3-4 dias)

**Resolver débito técnico arquitetural.**

| # | Ação | Prioridade |
|---|------|-----------|
| 1.1 | **Adicionar react-router-dom** — Implementar roteamento real com URLs, browser history, deep-linking | ALTA |
| 1.2 | **Eliminar `alert()` e `confirm()`** — Usar o Toast system existente + diálogos modais customizados | ALTA |
| 1.3 | **Code splitting** — `React.lazy()` para cada página/dashboard | MÉDIA |
| 1.4 | **Error boundaries** — Envolver dashboards e páginas públicas | MÉDIA |
| 1.5 | **Loading skeletons** — Componentes placeholder para carregamento | MÉDIA |
| 1.6 | **Consolidar serviços duplicados** — Eliminar sobreposição entre `courseService`, `academicService`, `enrollmentService` | ALTA |
| 1.7 | **Corrigir bug da página `register`** — Adicionar case no switch ou remover do tipo | BAIXA |
| 1.8 | **Criar hook `useEnrollments`** — Para gestão de matrículas | MÉDIA |

### FASE 2 — Refatoração do Dashboard do Professor (3-4 dias)

**Já planeado no documento 021. Aplicar as correções do Gemini.**

| # | Ação | Detalhes |
|---|------|---------|
| 2.1 | Criar `assignmentService.ts` | Ver doc 021, Fase 1 |
| 2.2 | Criar hooks do professor | `useTeacherCourses`, `useTeacherStudents`, `useTeacherEvaluations`, `useTeacherNotifications` |
| 2.3 | Refatorar `InstructorEvaluationsTab` | 100% Supabase — ver doc 021, Fase 2 |
| 2.4 | Refatorar `InstructorDashboardTab` | KPIs reais, alertas reais — ver doc 021, Fase 3 |
| 2.5 | Refatorar `InstructorCalendarTab` | Remover fictícios — ver doc 021, Fase 4 |
| 2.6 | Refatorar `InstructorStudentsTab` | Notas/presença reais — ver doc 021, Fase 5 |
| 2.7 | Refatorar `InstructorPortal` shell | Hooks, Realtime, profile — ver doc 021, Fase 6 |
| 2.8 | Adicionar Realtime consolidado | Canal unificado — ver doc 021, Fase 8 |

### FASE 3 — Melhorias do Dashboard do Aluno (2-3 dias)

| # | Ação | Prioridade |
|---|------|-----------|
| 3.1 | **Calcular streak real** — Criar trigger/tabela para tracking de login diário | ALTA |
| 3.2 | **Calcular horas estudadas** — Soma de `video_progress_seconds` do `lesson_progress` | ALTA |
| 3.3 | **Implementar componente de calendário real** — Grid mensal com dias e eventos | MÉDIA |
| 3.4 | **Adicionar fluxo de auto-matrícula** — Aluno pode inscrever-se em cursos publicados | ALTA |
| 3.5 | **Remover dados hardcoded de PDF** — Eliminar fallback "antonio" | BAIXA |
| 3.6 | **Inline messages tab** — Mini-chat sem redirecionamento | BAIXA |
| 3.7 | **Progresso visual por curso** — Barra de progresso na lista de cursos | MÉDIA |

### FASE 4 — Melhorias do Dashboard Admin (2-3 dias)

| # | Ação | Prioridade |
|---|------|-----------|
| 4.1 | **Persistir audit logs** — Criar tabela `audit_logs` com trigger em operações sensíveis | ALTA |
| 4.2 | **Implementar broadcast real** — Enviar notificações/email para utilizadores alvo | ALTA |
| 4.3 | **Gerar relatórios reais** — PDF/CSV export com jsPDF ou servidor | ALTA |
| 4.4 | **Health checks reais** — Testar conectividade com Supabase, Storage, etc. | MÉDIA |
| 4.5 | **Otimizar `loadDatabase()`** — Cache com hooks, não rodar a cada tab switch | ALTA |
| 4.6 | **Gestão de matrículas** — Admin pode adicionar/remover alunos de cursos | ALTA |
| 4.7 | **Impersonation com audit** — Registar quem impersonou quem e quando | ALTA |

### FASE 5 — Páginas Públicas e CMS (3-4 dias)

| # | Ação | Prioridade |
|---|------|-----------|
| 5.1 | **Conectar formulário de contacto** — Salvar em `contact_messages` no Supabase | ALTA |
| 5.2 | **Conectar newsletter** — Tabela `newsletter_subscriptions` + confirmação | ALTA |
| 5.3 | **Blog com Supabase** — Criar tabela `blog_posts`, CRUD no admin | MÉDIA |
| 5.4 | **Instrutores do DB** — Listar `users` com `role = 'PROFESSOR'` | MÉDIA |
| 5.5 | **Estatísticas reais na Home** — Contar alunos, cursos, certificados do DB | MÉDIA |
| 5.6 | **Páginas legais** — Termos de Uso e Política de Privacidade | BAIXA |
| 5.7 | **SEO metadata** — OpenGraph tags, sitemap, robots.txt | MÉDIA |
| 5.8 | **Analytics** — Tracking de eventos em CTAs e conversões | BAIXA |

### FASE 6 — Sistema de Mensagens Completo (2-3 dias)

| # | Ação | Prioridade |
|---|------|-----------|
| 6.1 | **Criar migrations para tabelas faltantes** — `message_reactions`, `message_deletions`, `chat_media`, `pinned_messages`, `user_presence` | ALTA (FASE 0) |
| 6.2 | **Reações sincronizadas** — Ler/escrever do Supabase em vez de localStorage | ALTA |
| 6.3 | **Anexos de ficheiros** — Upload para `chat-media` bucket | MÉDIA |
| 6.4 | **Paginação de mensagens** — Infinite scroll com cursor | MÉDIA |
| 6.5 | **Otimizar `getConversationPartners`** — Query dedicada em vez de carregar tudo | ALTA |
| 6.6 | **Pesquisa em conversas** — Full-text search ou ILIKE | BAIXA |
| 6.7 | **Notificações push** — Service worker + push API | BAIXA |

---

## 11. Cronograma Proposto

| Fase | Duração | Dependências | Entregável |
|------|---------|-------------|-----------|
| **Fase 0** — Segurança & Infra | 1-2 dias | Nenhuma | Migration 005, fixes críticos |
| **Fase 1** — Fundação Frontend | 3-4 dias | Fase 0 | react-router, sem alert(), services consolidados |
| **Fase 2** — Dashboard Professor | 3-4 dias | Fase 0 + 1 (parcial) | Dashboard 100% real (doc 021) |
| **Fase 3** — Dashboard Aluno | 2-3 dias | Fase 0 | Streak, horas, calendário, auto-matrícula |
| **Fase 4** — Dashboard Admin | 2-3 dias | Fase 0 | Audit logs, broadcast, relatórios reais |
| **Fase 5** — Páginas Públicas | 3-4 dias | Fase 0 + 1 | Contacto, newsletter, blog, instrutores reais |
| **Fase 6** — Mensagens | 2-3 dias | Fase 0 | Reações sync, anexos, paginação |

**Total estimado:** 16-23 dias (3-5 semanas)

**Ordem de prioridade:** Fase 0 → Fase 2 (já planeada) → Fase 1 → Fase 3 → Fase 4 → Fase 5 → Fase 6

---

## 12. Componentes por Estado de Prontidão

### ✅ Production-Ready (funcionais com Supabase)

| Componente | Linhas | Observação |
|-----------|--------|-----------|
| ChatShell | 646 | Melhor componente — Realtime, CRUD completo |
| ChatSidebar | 189 | Bom |
| ChatWindow | 217 | Bom |
| ChatInput | 108 | Bom |
| MessageBubble | 199 | Bom (reações em localStorage) |
| BulkSendModal | 157 | Bom |
| NewConversationModal | 83 | Bom |
| LoginPanel | 301 | Funcional (sem reset password) |
| VerifyCertificatePanel | 239 | Funcional |
| CourseEditorModal | 1135 | Funcional (com alert()) |
| AvatarUpload | 97 | Funcional |
| CertificateIssueModal | 324 | Funcional |
| StudentTasksTab | 396 | Funcional |
| QuizArea | 280 | Funcional (scoring limitado) |
| StudentCertificatesTab | 214 | Funcional |
| StudentMaterialsTab | 238 | Funcional |
| Toast (UI) | 169 | Funcional |
| AuthProvider | 240 | Funcional (vulnerabilidade de role) |

### ⚠️ Parcialmente Funcionais

| Componente | Linhas | Problema Principal |
|-----------|--------|-------------------|
| StudentPortal | 1924 | Streak/horas fake, sem auto-matrícula |
| StudentProgressTab | 236 | Dados estimados não reais |
| AdminPortal | 1773 | Audit/broadcast/relatórios fake, 17 alert() |
| CoursesPanel | 506 | Dados híbridos (DB + fallback) |
| BlogPanel | 381 | Dados hardcoded, share com alert() |
| InstructorCoursesTab | 608 | Bom — carece Realtime |
| InstructorStudentsTab | 541 | Melhor — notas/presença parciais |
| InstructorMessagesTab | 177 | Bom — título fixo |
| InstructorCalendarTab | 458 | Mistura fictícios com reais |

### ❌ Não Funcionais / Decorativos

| Componente | Linhas | Problema |
|-----------|--------|---------|
| InstructorEvaluationsTab | 381 | 100% fictício |
| InstructorDashboardTab | 243 | Dados analíticos 100% hardcoded |
| InstructorPortal (shell) | 1113 | 5 tabs inline com dados fictícios |
| HomePanel | 1359 | 100% hardcoded |
| AboutPanel | 372 | 100% hardcoded |
| ContactPanel | 365 | Formulário FAKE |
| InstructorsPanel | 254 | 1 instrutor hardcoded |
| Footer (newsletter) | 200 | Formulário FAKE |

---

## 13. Funcionalidades Faltantes para Produção

### Críticas (bloqueantes)

1. **Segurança de role** — Qualquer um pode registar-se como ADMIN
2. **Migration 005** — 6 tabelas + 3 buckets sem migration
3. **Auto-matrícula** — Alunos não podem inscrever-se em cursos
4. **Formulário de contacto** — Não persiste nada
5. **Dashboard do professor** — 100% fictício no evaluations tab

### Altas (impactam experiência)

6. **React Router** — Sem URLs reais, sem deep-linking
7. **Toast em vez de alert()** — 30+ alert() no projeto
8. **Audit logs** — Zero persistência de logs de admin
9. **Broadcast real** — Notificações não são entregues
10. **Streak/horas reais** — Métricas do aluno são falsas
11. **Calendar componente real** — Apenas lista plana

### Médias (qualidade)

12. **Blog com CMS** — Conteúdo hardcoded em data.ts
13. **Instrutores do DB** — Apenas 1 hardcoded
14. **Newsletter** — Não funciona
15. **Paginação** — Nenhuma lista é paginada
16. **Reações de chat sincronizadas** — localStorage apenas
17. **Anexos no chat** — Apenas texto
18. **Reset password** — Sem fluxo

### Baixas (nice-to-have)

19. **Code splitting** — Performance
20. **Error boundaries** — Resiliência
21. **SEO** — OpenGraph, sitemap
22. **Analytics** — Event tracking
23. **Páginas legais** — Termos, privacidade
24. **QR codes reais** — Nos certificados
25. **Mensagens de voz** — No chat

---

*Fim da Revisão Completa — Próximo passo: Executar Fase 0 (Correções Críticas de Segurança)*
