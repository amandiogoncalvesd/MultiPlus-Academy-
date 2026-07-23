# 🟡 Documento de Orientação 017 — Correções Pendentes Pós-Auditoria (Doc 015/016)

**Projeto:** MultiPlus Academy LMS  
**Destinatário:** Google Gemini (Google AI Studio)  
**Autor:** Super Z (Orientador de Desenvolvimento)  
**Data:** 16 de Julho de 2026  
**Prioridade:** 🟡 Alta — Correções específicas pendentes  

---

## ✅ O que foi implementado com sucesso (Documento 015)

Antes de listar as correções, reconhecemos que a maioria das alterações foi aplicada corretamente:

| # | Item | Status |
|---|------|--------|
| 1 | `supabase/migrations/004_video_notes_assignments.sql` | ✅ Criado e completo |
| 2 | `src/services/supabase/avatarService.ts` | ✅ Criado e funcional |
| 3 | `src/components/AvatarUpload.tsx` | ✅ Criado e funcional |
| 4 | `StudentMaterialsTab.tsx` — 7 manuais fictícios removidos | ✅ Substituído por dados do Supabase |
| 5 | `StudentTasksTab.tsx` — 4 tarefas fictícias removidas | ✅ Substituído por dados do Supabase |
| 6 | `StudentCertificatesTab.tsx` — 2 certificados fictícios removidos | ✅ Substituído por dados do Supabase |
| 7 | `lesson_1_fallback` removido | ✅ Removido |
| 8 | Player de vídeo real com `<video>` HTML5 | ✅ Implementado |
| 9 | Transcrição usa `lesson.descricao` | ✅ Corrigido |
| 10 | Cards de calendário fictícios removidos | ✅ Substituído por dados do Supabase |
| 11 | Novos métodos em `academicService` (7 métodos) | ✅ Todos presentes |
| 12 | `SupabaseLesson` com `meeting_url` e `created_by` | ✅ Adicionados |
| 13 | `LessonNote` tipo adicionado ao `types.ts` | ✅ Presente |
| 14 | Build compila sem erros | ✅ `npm run build` passa |

---

## ❌ Correções Pendentes — 5 Itens

### Correção 1: Remover links falsos `mock-multiplus` (3 ocorrências no StudentPortal.tsx)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Problema:** A URL `https://meet.google.com/lookup/mock-multiplus` ainda aparece 3 vezes:

**Ocorrência 1 — Linha ~641 (ICS Export):**
```tsx
// ATUAL (incorreto):
LOCATION:https://meet.google.com/lookup/mock-multiplus
```
**Substituir por:**
```tsx
LOCATION:${enrolledLessons.find(l => l.id === lessonId)?.meeting_url || ''}
```
Ou, se não houver meeting_url, simplesmente omitir a linha LOCATION do ICS.

**Ocorrência 2 — Linha ~1121 (Botão "Entrar na Aula" da próxima aula):**
```tsx
// ATUAL (parcialmente correto — tem fallback para mock-multiplus):
nextScheduledLesson.meeting_url || "https://meet.google.com/lookup/mock-multiplus"
```
**Substituir por:**
```tsx
nextScheduledLesson.meeting_url || null
```
E condicionar a exibição do botão: só mostrar "Entrar na Aula" se `meeting_url` existir.

**Ocorrência 3 — Linha ~1612 (Card de calendário — a pior):**
```tsx
// ATUAL (incorreto — ignora meeting_url real):
const meetUrl = 'https://meet.google.com/lookup/mock-multiplus';
```
**Substituir por:**
```tsx
const meetUrl = session.lesson?.meeting_url || null;
```
E condicionar a exibição do link:
```tsx
{meetUrl ? (
  <a href={meetUrl} target="_blank" className="py-2.5 bg-ink-900 text-cream-100 text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-ink-900 transition-colors">
    Entrar na Aula
  </a>
) : (
  <span className="py-2.5 bg-gray-100 dark:bg-slate-800 text-neutral-400 text-center rounded-lg text-3xs font-mono font-bold uppercase block">
    Link da aula indisponível
  </span>
)}
```

**Também corrigir:** `src/components/instructor/InstructorCalendarTab.tsx` linha ~333 tem 1 ocorrência de `mock-multiplus`. Aplicar a mesma correção: usar `lesson.meeting_url` em vez de URL hardcoded.

---

### Correção 2: Remover `total_lessons: 3` hardcoded no academicService

**Arquivo:** `src/services/supabase/academicService.ts`  
**Linha:** ~437  
**Problema:** No fallback de `getStudentProgressMetrics()`, o número total de aulas está hardcoded como `3`:

```ts
// ATUAL (incorreto):
total_lessons: 3,
completed_lessons: completed.length,
progress_percent: Math.min(100, Math.round((completed.length / 3) * 100)),
```

**Substituir por:**
```ts
// Buscar contagem real de aulas dos cursos do aluno
const { data: studentEnrollments } = await supabase
  .from('enrollments')
  .select('course_id')
  .eq('student_id', userId)
  .eq('status', 'ACTIVE');

const enrolledCourseIds = (studentEnrollments || []).map((e: any) => e.course_id);

let totalLessons = 0;
if (enrolledCourseIds.length > 0) {
  const { count } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .in('course_id', enrolledCourseIds);
  totalLessons = count || 0;
}

return [{
  student_id: userId,
  total_lessons: totalLessons,
  completed_lessons: completed.length,
  progress_percent: totalLessons > 0 ? Math.min(100, Math.round((completed.length / totalLessons) * 100)) : 0,
  avg_quiz_score: avgScore || 0,
  last_activity: new Date().toISOString()
}];
```

---

### Correção 3: Remover thumbnail Unsplash hardcoded no createCourse

**Arquivo:** `src/services/supabase/academicService.ts`  
**Linha:** ~77  
**Problema:** Ao criar um curso sem thumbnail, é usada uma imagem Unsplash hardcoded:

```ts
// ATUAL (incorreto):
thumbnail: course.thumbnail || course.imagem || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=300',
```

**Substituir por:**
```ts
thumbnail: course.thumbnail || course.imagem || null,
```

Quando o thumbnail for `null`, a interface deve mostrar um placeholder genérico (ícone de livro ou graduação) em vez de uma foto aleatória do Unsplash.

---

### Correção 4: Adicionar tipos TypeScript faltantes (Assignment, AssignmentSubmission)

**Arquivo:** `src/types.ts`  
**Problema:** Os tipos `Assignment` e `AssignmentSubmission` não existem. O `StudentTasksTab.tsx` usa uma interface local `TaskItem` e o `academicService` usa `any`.

**Adicionar ao final do arquivo `src/types.ts`:**

```ts
export interface Assignment {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  teacher_id: string;
  titulo: string;
  descricao?: string | null;
  due_date?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  course_title?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_url?: string | null;
  submission_text?: string | null;
  feedback?: string | null;
  grade?: number | null;
  submitted_at: string;
}
```

**Depois**, atualizar `StudentTasksTab.tsx` para usar `Assignment` e `AssignmentSubmission` de `../../types` em vez da interface local `TaskItem`.

---

### Correção 5: Remover `antonio@advogados.ao` do InstructorEvaluationsTab

**Arquivo:** `src/components/instructor/InstructorEvaluationsTab.tsx`  
**Linha:** ~44  
**Problema:** Email hardcoded `'antonio@advogados.ao'` numa submissão fictícia.

Este arquivo ainda tem dados fictícios (2 submissões e 3 quizzes hardcoded). Mas para esta correção, basta:

**Localizar:**
```ts
email: 'antonio@advogados.ao'
// ou similar
```

**Substituir por:** Remover completamente o array de submissões hardcoded e buscar dados reais do Supabase (tabela `quiz_submissions` e `assignment_submissions`). Se não houver dados, mostrar estado vazio.

**Alternativa mínima:** Se a refatoração completa do InstructorEvaluationsTab for muito complexa agora, pelo menos substituir o email hardcoded por um valor dinâmico ou string genérica como `'aluno@multiplus.academy'`.

---

## Ordem de Execução

1. Correção 1 (mock-multiplus) — 4 edições localizar-e-substituir
2. Correção 2 (total_lessons: 3) — 1 edição no academicService
3. Correção 3 (Unsplash thumbnail) — 1 edição no academicService
4. Correção 4 (Tipos TypeScript) — Adicionar ao types.ts + atualizar import no StudentTasksTab
5. Correção 5 (antonio@advogados.ao) — 1 edição no InstructorEvaluationsTab

**Após implementar, executar:**
```bash
npm run build
```
E confirmar que compila sem erros.

---

## Checklist de Verificação

| # | Verificação | Comando |
|---|------------|---------|
| 1 | Nenhuma ocorrência de `mock-multiplus` | Procurar em todo o código-fonte |
| 2 | Nenhuma ocorrência de `total_lessons: 3` | Procurar em academicService |
| 3 | Nenhuma URL Unsplash hardcoded | Procurar `images.unsplash.com` em academicService |
| 4 | Tipos `Assignment` e `AssignmentSubmission` existem em types.ts | Verificar arquivo |
| 5 | Nenhuma ocorrência de `antonio@advogados.ao` | Procurar em todo o código-fonte |
| 6 | Build compila sem erros | `npm run build` |

---

*Documento gerado por Super Z — Orientador de Desenvolvimento MultiPlus Academy*  
*Versão: 017 | Data: 16/07/2026 | Idioma: Português (com acentuação)*
