# 019 — Análise Completa do Dashboard do Professor

> **Projeto:** MultiPlus Academy  
> **Data:** 16 de Julho de 2026  
> **Escopo:** Componentes do dashboard do professor (`InstructorPortal` + sub-componentes)  
> **Objetivo:** Identificar dados fictícios, dados não flexíveis e falta de sincronia com o Supabase para posterior refatoração

---

## 1. Arquitetura Geral

O dashboard do professor é composto por **8 ficheiros de componentes** (~3.800+ linhas no total):

| Ficheiro | Linhas | Função |
|----------|--------|--------|
| `InstructorPortal.tsx` | 1.114 | Shell principal — sidebar, topbar, 5 tabs inline, orquestração de dados |
| `InstructorDashboardTab.tsx` | 243 | Visão geral com KPIs, gráfico SVG e fila de alertas |
| `InstructorCoursesTab.tsx` | 608 | Gestão de cursos — CRUD, matrículas, editor de curso |
| `InstructorStudentsTab.tsx` | 617 | Diretório de alunos — filtros, progresso, notas, emissão de certificados |
| `InstructorEvaluationsTab.tsx` | 381 | Correção de trabalhos e criação de avaliações |
| `InstructorCalendarTab.tsx` | 458 | Agenda letiva — agendamento de aulas síncronas |
| `InstructorMessagesTab.tsx` | 177 | Chat e mural de avisos |
| `StudentSelector.tsx` | 225 | Modal de seleção múltipla de alunos para matrícula |

### Fluxo de Dados Atual

```
InstructorPortal (loadDatabase)
  ├── courses  → supabase.from('courses') / courseService.getTeacherCourses()
  ├── students → supabase.from('users').eq('role','ALUNO')
  ├── enrollments → supabase.from('enrollments')
  ├── certificatesCount → supabase.from('certificates').select('*', {count:'exact'})
  ├── lessonsCount → supabase.from('lessons').select('*', {count:'exact'})
  └── unreadMessagesCount → messageService + Realtime subscription
```

**Problema central:** Apenas o `messages` tem subscrição Realtime. Todas as outras entidades são carregadas uma vez na montagem e **nunca atualizadas automaticamente**.

---

## 2. Inventário Detalhado de Dados Fictícios

### 2.1 `InstructorDashboardTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `alertsQueue` | Array estático com 3 alertas hardcoded: "Dr. António Carvalho submeteu...", "Dra. Patrícia Santos registou-se...", "Sessão ao Vivo agendada..." | 43-47 | **ALTA** |
| Gráfico SVG (completion) | Path hardcoded `M 0,100 C 50,85 100,50 150,70...` — dados de curva não provêm de nenhuma consulta | 156 | **ALTA** |
| Gráfico SVG (engagement) | Path hardcoded `M 0,90 C 50,95 100,80 150,60...` | 174 | **ALTA** |
| Rótulos do eixo X | "SEMANA 1", "SEMANA 4 (DRAFTING)", "SEMANA 8 (ORAL EXAM)", "SEMANA 12 (HOJE)" — não são dinâmicos | 191-194 | **MÉDIA** |
| Caixa INSIGHT | Texto estático: "O pico de envolvimento letivo aumentou após a introdução de áudios e vídeos indexados..." | 200-203 | **MÉDIA** |
| Percentual no INSIGHT | `94%` hardcoded | 201 | **ALTA** |
| `completionRate` (prop) | Recebe `95%` hardcoded do `InstructorPortal.tsx` linha 398 | — | **ALTA** |

**Resumo:** Nenhum dado analítico do dashboard é real. Tudo é estático/decorativo.

---

### 2.2 `InstructorEvaluationsTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `submissions` state | 2 submissões hardcoded com nomes, emails, textos de redação jurídica completos | 40-60 | **CRÍTICA** |
| `quizzesList` state | 3 avaliações hardcoded com títulos específicos de direito angolano | 62-66 | **CRÍTICA** |
| `handleRegisterAssessment` | Apenas faz `setQuizzesList([...])` — **não persiste no Supabase** | 68-85 | **CRÍTICA** |
| `handleGradeSubmit` | Apenas faz `setSubmissions(prev => prev.map(...))` — **não salva nota no Supabase** | 87-99 | **CRÍTICA** |
| `handleBroadcastCollectiveFeedback` | Usa `alert()` — **não envia para nenhuma tabela** | 101-105 | **CRÍTICA** |
| Opções de "Vínculo de Módulo" | 3 opções hardcoded: "Mês I: Common Law vs. Civil Law", etc. | 332-335 | **MÉDIA** |
| Opções de "Tipo de Instrumento" | 3 opções hardcoded no `<select>` | 307-310 | **MÉDIA** |
| Título do anúncio | `titulo: 'Aviso do Professor'` fixo em `InstructorMessagesTab` | 46 | **BAIXA** |

**Resumo:** O tab de avaliações é **inteiramente fictício**. Nenhuma operação CRUD persiste no banco de dados. As tabelas `assignments` e `assignment_submissions` (criadas na Migration 004) **não são utilizadas**.

---

### 2.3 `InstructorCalendarTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `eventsList` state | 3 eventos hardcoded: "Drafting Workshop I", "Exame Intermédio", "Sessão Conversacional Síncrona" | 48-52 | **ALTA** |
| Fallback de lições | Quando não há aulas no DB: "Aula 1 - Introdução Geral", "Aula 2 - Redação Avançada", "Aula 3 - Drafting Comercial" | 256-259 | **MÉDIA** |
| Cabeçalho do mês | "Mês Coerente (Junho 2026)" hardcoded | 395 | **MÉDIA** |
| `combinedEvents` | Mistura eventos fictícios `eventsList` com reais `scheduledLessons` | 147-161 | **ALTA** |
| "GOOGLE SYNC ACTIVE" | Claim falso — não existe integração Google Calendar | 447 | **MÉDIA** |

**Resumo:** O calendário mistura dados reais do Supabase com eventos fictícios, criando confusão sobre o que é real.

---

### 2.4 `InstructorPortal.tsx` (Shell Principal)

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `pendingGreads = 3` | Valor hardcoded para avaliações pendentes | 398 | **CRÍTICA** |
| `completionRate` passado como `95` | Não é calculado a partir de dados reais | 398 (implícito) | **CRÍTICA** |
| `profileBio` inicial | Bio hardcoded da Esmeralda | 136 | **ALTA** |
| `profileCredentials` inicial | Credenciais hardcoded | 137 | **ALTA** |
| `newCoursePrice` default | `'450.000 Kz'` | 143 | **MÉDIA** |
| `newCourseCategory` default | `'Direito Corporativo'` | 144 | **MÉDIA** |
| `newCourseDuration` default | `'12 Semanas (3 Meses)'` | 145 | **MÉDIA** |
| `handleAddPlannerModule` | Não salva no Supabase `modules` — apenas local | 333-347 | **ALTA** |
| `handleUploadLibraryFile` | Simulação de upload — sem Storage real | 350-368 | **ALTA** |
| Preview de certificado | "Dr. António Ferreira Carvalho", "92 / 100", "MPA-2026-UNLOCKED-PER_" | 821-832 | **ALTA** |
| Tab "Métricas & SVGs" | Dois gráficos SVG com valores hardcoded (78%, barras estáticas) | 912-963 | **ALTA** |
| Tab "Configurações" integrações | "Google Meet: CONECTADO", "Google Calendar: ATIVO" — falso | 1063-1083 | **MÉDIA** |
| `loadDatabase()` | Executa apenas 1x no mount — sem refresh nem Realtime | 163-165 | **ALTA** |

**Resumo:** O shell principal contém 5 tabs inline (criar-curso, certificados, relatorios, perfil, configuracoes) com dados predominantemente fictícios. A recarga de dados é apenas inicial.

---

### 2.5 `InstructorStudentsTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `metricsDB` state | `{ grade: 92, presence: 95 }`, `{ grade: 78, presence: 82 }`, `{ grade: 85, presence: 90 }` — notas e presença simuladas | 89-95 | **ALTA** |
| `handleSendInstantAlert` | Usa `alert()` — não persiste em `notifications` | 102+ | **ALTA** |
| `editScore` default | `88` hardcoded | 50 | **MÉDIA** |

**Nota positiva:** Este componente já consulta `vw_student_progress` do Supabase para métricas de progresso. É o componente mais adiantado em termos de integração real.

---

### 2.6 `InstructorCoursesTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| Nenhum dado fictício significativo | — | — | — |

**Nota positiva:** Este componente utiliza `courseService`, `enrollmentService` e `StudentSelector` corretamente. Apenas carece de subscrições Realtime.

---

### 2.7 `InstructorMessagesTab.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| `titulo: 'Aviso do Professor'` | Título fixo em vez de campo editável | 46 | **BAIXA** |

**Nota positiva:** Já utiliza `messageService.getAnnouncements()` e `messageService.createAnnouncement()` com persistência real no Supabase.

---

### 2.8 `StudentSelector.tsx`

| Localização | Dado Fictício | Linha | Gravidade |
|---|---|---|---|
| Avatar fallback | URL Unsplash genérico | 161 | **BAIXA** |

**Nota positiva:** Já utiliza `enrollmentService.getAllStudents()` com dados reais.

---

## 3. Inventário de Falta de Sincronia (Realtime)

### Subscrições Realtime Existentes

| Tabela | Subscrita? | Componente |
|--------|-----------|------------|
| `messages` | ✅ Sim | `InstructorPortal.tsx` (unread count) |
| `courses` | ❌ Não | — |
| `enrollments` | ❌ Não | — |
| `certificates` | ❌ Não | — |
| `lessons` | ❌ Não | — |
| `assignment_submissions` | ❌ Não | — |
| `notifications` | ❌ Não | — |
| `lesson_targets` | ❌ Não | — |

### Consequências da Falta de Sincronia

1. **Professor não vê novas submissões em tempo real** — precisa recarregar a página manualmente
2. **Contadores de KPI ficam desatualizados** — certificados emitidos por outros meios não refletem
3. **Novos alunos matriculados não aparecem** sem refresh
4. **Agendamentos criados por outros não são visíveis** em tempo real
5. **Notificações não são empurradas** — o sino de notificações nunca mostra nada novo

---

## 4. Problemas Arquiteturais

### 4.1 Monolito no InstructorPortal

O `InstructorPortal.tsx` tem **1.114 linhas** com 5 tabs inline (criar-curso, certificados, relatorios, perfil, configuracoes) que deveriam ser componentes separados, como os outros 6 tabs.

### 4.2 Ausência de Custom Hooks

Não existem hooks customizados para lógica de dados. Toda a lógica de fetch está inline nos componentes, causando duplicação e dificultando testes.

### 4.3 Uso de `alert()` como Feedback

Pelo menos **8 locais** usam `alert()` para feedback de sucesso/erro em vez de um sistema de toast/notificação. Isto é:
- Bloqueante (o utilizador tem de clicar OK)
- Não persiste visualmente
- Inconsistente com a UI premium

### 4.4 Tabelas da Migration 004 Não Utilizadas

As tabelas `assignments` e `assignment_submissions` criadas na Migration 004 **não são consumidas** em nenhum componente do dashboard do professor. O `InstructorEvaluationsTab` opera inteiramente com estado local.

### 4.5 Dados Estáticos em `data.ts`

O ficheiro `data.ts` contém `COURSES_LIST`, `MAIN_INSTRUCTOR` e `BLOG_POSTS` com dados hardcoded. Alguns destes dados são usados como fallback quando o Supabase retorna vazio, criando uma experiência mista.

---

## 5. Resumo Quantitativo

| Categoria | Quantidade |
|-----------|-----------|
| Componentes com dados fictícios | 5 de 8 |
| Dados fictícios identificados | 25+ |
| Operações CRUD sem persistência | 4 (criar avaliação, atribuir nota, broadcast feedback, adicionar módulo) |
| Tabs inline no shell (não modularizadas) | 5 |
| Tabelas Supabase não utilizadas | 2 (`assignments`, `assignment_submissions`) |
| Subscrições Realtime em falta | 7 de 8 |
| Usos de `alert()` | 8+ |

---

## 6. Priorização de Gravidade

### CRÍTICA (bloqueia funcionalidade real)
1. `InstructorEvaluationsTab` — **100% fictício**, nenhuma operação persiste no banco
2. `pendingGreads` e `completionRate` hardcoded — KPIs do dashboard são falsos
3. Tabelas `assignments` e `assignment_submissions` não integradas

### ALTA (dados incorretos/misleading)
4. `alertsQueue` no DashboardTab — notificações falsas
5. Gráficos SVG com dados hardcoded — métricas falsas
6. `eventsList` no CalendarTab — eventos fictícios misturados com reais
7. `metricsDB` no StudentsTab — notas e presença simuladas
8. Preview de certificado com dados hardcoded
9. `loadDatabase()` sem Realtime — dados ficam obsoletos

### MÉDIA (qualidade/experiência)
10. Profile/CV sem persistência no Supabase
11. Calendário com mês hardcoded
12. Integrações falsas no settings
13. `alert()` como mecanismo de feedback
14. Tabs inline não modularizadas

---

*Fim da Análise — Próximo passo: Plano de Refatoração (020-PLANO-REFACTORIZACAO-PROFESSOR.md)*
