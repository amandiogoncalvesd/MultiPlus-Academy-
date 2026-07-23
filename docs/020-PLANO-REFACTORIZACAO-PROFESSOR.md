# 020 — Plano de Refatoração do Dashboard do Professor

> **Projeto:** MultiPlus Academy  
> **Data:** 16 de Julho de 2026  
> **Pré-requisito:** Análise 019-ANALISE-DASHBOARD-PROFESSOR.md  
> **Objetivo:** Eliminar dados fictícios, integrar sincronias Realtime e modularizar o dashboard do professor

---

## Princípios Orientadores

1. **Sincronia primeiro** — Todos os dados devem vir do Supabase com subscrições Realtime
2. **Zero dados fictícios** — Remover todo conteúdo hardcoded; exibir estados vazios informativos quando não houver dados
3. **Modularização** — Extrair tabs inline do `InstructorPortal.tsx` para componentes separados
4. **Custom Hooks** — Criar hooks dedicados para cada domínio de dados
5. **Toast em vez de alert()** — Sistema de notificações não-bloqueante
6. **Incremental** — Cada fase deve ser funcional e testável independentemente

---

## Fase 1 — Infraestrutura e Hooks (Prioridade: CRÍTICA)

### 1.1 Criar Custom Hooks de Dados

**Ficheiros novos em `src/hooks/`:**

| Hook | Responsabilidade | Tabelas |
|------|-----------------|---------|
| `useTeacherCourses.ts` | Carregar e subscrever cursos do professor | `courses` |
| `useTeacherStudents.ts` | Carregar alunos com progresso | `users`, `enrollments`, `vw_student_progress` |
| `useTeacherEvaluations.ts` | Submissões pendentes e avaliações | `assignments`, `assignment_submissions` |
| `useTeacherCalendar.ts` | Agendamentos e aulas síncronas | `lesson_targets`, `lessons` |
| `useTeacherMetrics.ts` | KPIs e dados analíticos | Agregações de múltiplas tabelas |
| `useTeacherNotifications.ts` | Notificações em tempo real | `notifications` |

**Padrão de cada hook:**
```typescript
export function useTeacherCourses(teacherId: string | undefined) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    
    // 1. Fetch inicial
    const fetchCourses = async () => { ... };
    fetchCourses();

    // 2. Subscrição Realtime
    const channel = supabase
      .channel(`teacher-courses-${teacherId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'courses', filter: `teacher_id=eq.${teacherId}` },
        () => fetchCourses()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teacherId]);

  return { courses, loading, refetch: fetchCourses };
}
```

### 1.2 Criar Serviço de Toast

**Ficheiro novo:** `src/components/ui/Toast.tsx` (melhorar o existente)

Substituir todos os `alert()` por:
```typescript
toast.success('Avaliação publicada com sucesso!');
toast.error('Erro ao salvar nota.');
toast.info('Nova submissão recebida.');
```

### 1.3 Criar Serviço de Assignments

**Ficheiro novo:** `src/services/supabase/assignmentService.ts`

```typescript
export const assignmentService = {
  // Para o professor:
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>
  getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]>
  createAssignment(data: CreateAssignmentDTO): Promise<Assignment>
  updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment>
  deleteAssignment(id: string): Promise<boolean>
  
  // Submissões:
  getPendingSubmissions(teacherId: string): Promise<AssignmentSubmission[]>
  getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]>
  gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<AssignmentSubmission>
  
  // Broadcast:
  broadcastFeedback(teacherId: string, courseId: string, message: string): Promise<void>
};
```

---

## Fase 2 — Refatoração do InstructorEvaluationsTab (Prioridade: CRÍTICA)

> **Justificação:** Este é o componente 100% fictício. As tabelas `assignments` e `assignment_submissions` já existem desde a Migration 004 mas não são usadas.

### 2.1 Substituir Estado Local por Dados Reais

**Antes:**
```typescript
const [submissions, setSubmissions] = useState([
  { id: 1, studentName: 'Dr. António...', ... }  // FICTÍCIO
]);
const [quizzesList, setQuizzesList] = useState([
  { title: 'Exame Final de Oratória...', ... }  // FICTÍCIO
]);
```

**Depois:**
```typescript
const { pendingSubmissions, loading: loadingSubs } = useTeacherEvaluations(currentUser?.id);
const { assignments, loading: loadingAssign } = useTeacherCourses(currentUser?.id);
```

### 2.2 Persistir Operações no Supabase

| Operação | Antes | Depois |
|----------|-------|--------|
| Criar avaliação | `setQuizzesList([...])` | `assignmentService.createAssignment()` |
| Atribuir nota | `setSubmissions(prev => prev.map(...))` | `assignmentService.gradeSubmission()` |
| Feedback coletivo | `alert()` | `assignmentService.broadcastFeedback()` + `notifications` |

### 2.3 Vínculo de Módulo Dinâmico

Substituir as 3 opções hardcoded por consulta aos módulos reais do curso selecionado:
```typescript
const { modules } = useCourseModules(selectedCourseId);
// Renderizar <option> dinamicamente a partir de modules
```

---

## Fase 3 — Refatoração do InstructorDashboardTab (Prioridade: ALTA)

### 3.1 KPIs Reais

| KPI | Antes | Depois |
|-----|-------|--------|
| Total de Cursos | `courses.length` (✅ já real) | Manter + Realtime |
| Total de Alunos | `students.length` (✅ já real) | Manter + Realtime |
| Aulas Publicadas | `lessonsCount` (✅ já real) | Manter + Realtime |
| Avaliações Pendentes | `evaluationsPendingCount` (recebe `3` hardcoded) | Consultar `assignment_submissions` onde `grade IS NULL` |
| Certificados Emitidos | `certificatesIssuedCount` (✅ já real) | Manter + Realtime |
| Taxa de Conclusão | `95%` hardcoded | Calcular: `(completed_lessons / total_lessons) * 100` via `vw_student_progress` |

### 3.2 Alertas em Tempo Real

Substituir `alertsQueue` hardcoded por subscrição Realtime:

```typescript
const { recentNotifications } = useTeacherNotifications(currentUser?.id);
// Mapear notificações para o formato de alerta
```

Tabela `notifications` já existe. Adicionar trigger no Supabase para:
- Novo aluno matriculado → notificação para o professor
- Nova submissão de tarefa → notificação para o professor
- Aula agendada → notificação para o professor

### 3.3 Gráfico Analítico com Dados Reais

**Estratégia:** Criar uma RPC (Remote Procedure Call) no Supabase que retorne dados agregados por semana:

```sql
CREATE OR REPLACE FUNCTION get_teacher_weekly_metrics(p_teacher_id UUID)
RETURNS TABLE(week_start DATE, completion_rate NUMERIC, submission_rate NUMERIC) AS $$
  -- Agregação de lesson_progress e assignment_submissions por semana
$$ LANGUAGE sql STABLE;
```

No frontend, consumir via:
```typescript
const { data } = await supabase.rpc('get_teacher_weekly_metrics', { p_teacher_id: teacherId });
```

E renderizar o SVG dinamicamente com base nos dados retornados.

### 3.4 Insight Dinâmico

Gerar texto de insight com base em comparação de semanas:
- Se `submission_rate` desta semana > semana anterior → "As submissões aumentaram X% esta semana."
- Se `completion_rate` está abaixo do esperado → "A taxa de conclusão caiu para X%. Considere revisar o conteúdo do Módulo Y."

---

## Fase 4 — Refatoração do InstructorCalendarTab (Prioridade: ALTA)

### 4.1 Eliminar Eventos Fictícios

**Remover:** O estado `eventsList` com 3 eventos hardcoded.

**Substituir por:** Apenas `scheduledLessons` do Supabase + possivelmente `assignments` com `due_date`.

### 4.2 Calendário Dinâmico

Substituir "Mês Coerente (Junho 2026)" por cálculo dinâmico:
```typescript
const currentDate = new Date();
const monthName = currentDate.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
```

### 4.3 Remover Fallback de Lições

Em vez de mostrar "Aula 1 - Introdução Geral" quando não há lições no DB, exibir mensagem informativa:
```
"Nenhuma lição encontrada para este curso. Adicione lições no editor do curso."
```

### 4.4 Remover Claim Falso

Remover a caixa "GOOGLE SYNC ACTIVE". Quando a integração for implementada, pode ser adicionada de volta com estado real.

---

## Fase 5 — Refatoração do InstructorStudentsTab (Prioridade: ALTA)

### 5.1 Notas e Presença Reais

Substituir `metricsDB` hardcoded por consulta real:
- **Notas:** Média de `assignment_submissions.grade` + `quiz_submissions.score` por aluno
- **Presença:** Calcular a partir de `lesson_progress` (lições completadas vs. total de lições do curso)

### 5.2 Alertas Persistentes

Substituir `alert()` em `handleSendInstantAlert` por:
```typescript
await supabase.from('notifications').insert({
  user_id: studentId,
  text: customAlertText,
  read: false
});
```

---

## Fase 6 — Refatoração do InstructorPortal (Shell) (Prioridade: MÉDIA)

### 6.1 Extrair Tabs Inline para Componentes

| Tab Atual (inline) | Novo Componente | Dados a Sincronizar |
|---------------------|-----------------|---------------------|
| `criar-curso` | `InstructorCreateCourseTab.tsx` | `courses` (insert) |
| `certificados` | `InstructorCertificatesTab.tsx` | `certificates` (select, validate) |
| `relatorios` | `InstructorMetricsTab.tsx` | Agregações multi-tabela |
| `perfil` | `InstructorProfileTab.tsx` | `users`, `profiles` |
| `configuracoes` | `InstructorSettingsTab.tsx` | Configurações do utilizador |

### 6.2 Substituir `loadDatabase()` por Hooks

**Antes (InstructorPortal.tsx):**
```typescript
const loadDatabase = async () => {
  // 5 queries sequenciais inline
};
useEffect(() => { loadDatabase(); }, []);
```

**Depois:**
```typescript
const { courses, loading: loadingCourses } = useTeacherCourses(currentUser?.id);
const { students, loading: loadingStudents } = useTeacherStudents();
const { enrollments } = useTeacherEnrollments();
const { count: certificatesCount } = useTeacherCertificatesCount();
const { count: lessonsCount } = useTeacherLessonsCount();
const { pendingCount } = useTeacherEvaluations(currentUser?.id);
```

### 6.3 Profile Persistente

O `profileBio` e `profileCredentials` devem ser lidos/gravados na tabela `profiles`:
```typescript
// Ler
const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();

// Gravar
await supabase.from('profiles').upsert({ user_id: userId, biografia: profileBio, ... });
```

### 6.4 Certificado Preview Dinâmico

Quando o professor clica em emitir certificado para um aluno, o preview deve mostrar os dados reais do aluno em vez de "Dr. António Ferreira Carvalho".

### 6.5 Planner de Módulos → Supabase

`handleAddPlannerModule` deve chamar `academicService.createModule()` em vez de apenas atualizar estado local.

### 6.6 Upload de Biblioteca → Supabase Storage

`handleUploadLibraryFile` deve usar o bucket `media` (criado na Migration 004) para upload real de ficheiros.

---

## Fase 7 — Métricas e Relatórios (Prioridade: MÉDIA)

### 7.1 Criar RPCs no Supabase

```sql
-- Distribuição de alunos por nível/módulo
CREATE OR REPLACE FUNCTION get_students_by_module(p_teacher_id UUID)
RETURNS TABLE(module_title TEXT, student_count BIGINT, avg_progress NUMERIC) AS $$
  ...
$$ LANGUAGE sql STABLE;

-- Engajamento por dia da semana
CREATE OR REPLACE FUNCTION get_engagement_by_weekday(p_teacher_id UUID)
RETURNS TABLE(weekday TEXT, access_count BIGINT) AS $$
  ...
$$ LANGUAGE sql STABLE;

-- Taxa de retenção geral
CREATE OR REPLACE FUNCTION get_retention_rate(p_teacher_id UUID)
RETURNS TABLE(week_start DATE, active_students BIGINT, total_students BIGINT, retention_rate NUMERIC) AS $$
  ...
$$ LANGUAGE sql STABLE;
```

### 7.2 Gráficos SVG Dinâmicos

No novo `InstructorMetricsTab.tsx`, gerar paths SVG a partir dos dados reais:
```typescript
const points = weeklyMetrics.map((m, i) => ({
  x: (i / (weeklyMetrics.length - 1)) * 500,
  y: 120 - (m.completion_rate / 100) * 100
}));
const pathD = generateSmoothCurve(points); // Catmull-Rom ou Bezier
```

### 7.3 Integrações Reais (Settings)

No `InstructorSettingsTab.tsx`:
- Remover claims falsos de Google Meet/Calendar conectados
- Adicionar seção "Integrações Disponíveis" com status real
- Quando implementado, mostrar status de conexão real

---

## Fase 8 — Subscrições Realtime Consolidadas (Prioridade: ALTA)

### 8.1 Canal Unificado

Criar um canal Realtime unificado no `InstructorPortal` que escuta múltiplas tabelas:

```typescript
useEffect(() => {
  if (!currentUser?.id) return;

  const channel = supabase
    .channel('instructor-realtime-sync')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'courses', filter: `teacher_id=eq.${currentUser.id}` },
      () => refetchCourses()
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'enrollments' },
      () => { refetchStudents(); refetchEnrollments(); }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'certificates' },
      () => refetchCertCount()
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'assignment_submissions' },
      () => { refetchPendingCount(); refetchNotifications(); }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
      (payload) => { 
        addNotification(payload.new);
        toast.info('Nova notificação recebida.');
      }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'lesson_targets' },
      () => refetchSchedule()
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [currentUser?.id]);
```

### 8.2 Indicador de Sincronia

Adicionar um indicador visual na topbar mostrando o estado da conexão Realtime:
- 🟢 Conectado — dados sincronizados
- 🟡 Reconectando — dados podem estar desatualizados
- 🔴 Desconectado — modo offline

---

## Cronograma Proposto

| Fase | Semana | Duração Estimada | Dependências |
|------|--------|-------------------|--------------|
| Fase 1: Infraestrutura | 1 | 2-3 dias | Nenhuma |
| Fase 2: EvaluationsTab | 1-2 | 2 dias | Fase 1 |
| Fase 3: DashboardTab | 2 | 2 dias | Fase 1 |
| Fase 4: CalendarTab | 2-3 | 1 dia | Fase 1 |
| Fase 5: StudentsTab | 3 | 1 dia | Fase 1 |
| Fase 6: Portal Shell | 3-4 | 3 dias | Fases 1-5 |
| Fase 7: Metrics/RPCs | 4 | 2 dias | Fase 6 |
| Fase 8: Realtime | 4-5 | 2 dias | Fase 6 |

**Total estimado:** 4-5 semanas

---

## Estrutura de Ficheiros Resultante

```
src/
├── hooks/
│   ├── useAuth.ts                      (existente)
│   ├── useCourses.ts                   (existente, melhorar)
│   ├── useTeacherCourses.ts            ✨ NOVO
│   ├── useTeacherStudents.ts           ✨ NOVO
│   ├── useTeacherEvaluations.ts        ✨ NOVO
│   ├── useTeacherCalendar.ts           ✨ NOVO
│   ├── useTeacherMetrics.ts            ✨ NOVO
│   └── useTeacherNotifications.ts      ✨ NOVO
│
├── services/supabase/
│   ├── academicService.ts              (existente, melhorar)
│   ├── assignmentService.ts            ✨ NOVO
│   ├── courseService.ts                (existente)
│   ├── enrollmentService.ts            (existente)
│   ├── lessonService.ts                (existente)
│   ├── messageService.ts               (existente)
│   └── userService.ts                  (existente, melhorar)
│
├── components/
│   ├── InstructorPortal.tsx            (refatorado — ~300 linhas)
│   └── instructor/
│       ├── InstructorDashboardTab.tsx  (refatorado — dados reais)
│       ├── InstructorCoursesTab.tsx    (leve refatoração)
│       ├── InstructorStudentsTab.tsx   (refatorado — notas reais)
│       ├── InstructorEvaluationsTab.tsx (refatorado — 100% Supabase)
│       ├── InstructorCalendarTab.tsx   (refatorado — sem fictícios)
│       ├── InstructorMessagesTab.tsx   (leve refatoração)
│       ├── StudentSelector.tsx         (inalterado)
│       ├── InstructorCreateCourseTab.tsx ✨ NOVO
│       ├── InstructorCertificatesTab.tsx ✨ NOVO
│       ├── InstructorMetricsTab.tsx    ✨ NOVO
│       ├── InstructorProfileTab.tsx    ✨ NOVO
│       └── InstructorSettingsTab.tsx   ✨ NOVO
│
├── components/ui/
│   └── Toast.tsx                       (melhorado — sistema global)
│
└── queries/
    ├── teacher_weekly_metrics.sql       ✨ NOVO (RPC)
    ├── students_by_module.sql          ✨ NOVO (RPC)
    └── engagement_by_weekday.sql       ✨ NOVO (RPC)
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| RPCs complexas podem ter performance baixa | Média | Criar índices nas tabelas de progresso; cache no frontend com `useQuery` |
| Muitas subscrições Realtime podem sobrecarregar | Baixa | Usar canal unificado em vez de um por tabela; limitar eventos a INSERT/UPDATE |
| Migração incremental pode quebrar tabs existentes | Média | Cada fase deve ser testável isoladamente; manter compatibilidade com props atuais durante transição |
| Dados reais podem estar vazios em desenvolvimento | Alta | Implementar estados vazios informativos e dados seed no Supabase |

---

*Fim do Plano — Próximo passo: Iniciar Fase 1 (Infraestrutura e Hooks)*
