# 021 — Guia de Correções do Dashboard do Professor para Google Gemini

> **Projeto:** MultiPlus Academy  
> **Data:** 16 de Julho de 2026  
> **Destinatário:** Google Gemini (AI Code Assistant)  
> **Objetivo:** Fornecer instruções precisas, ficheiro-a-ficheiro, linha-a-linha, para eliminar dados fictícios, integrar persistência Supabase e adicionar sincronia Realtime no dashboard do professor  
> **Stack:** Next.js + React + TypeScript + Supabase (Auth, DB, Storage, RLS, Realtime)  
> **Supabase Project ID:** `cufdcfzjhecvyjvzaisq`  
> **Repositório:** `MultiPlus-Academy-`

---

## Índice

1. [Contexto e Arquitetura Atual](#1-contexto-e-arquitetura-atual)
2. [Antes de Começar — Requisitos](#2-antes-de-começar--requisitos)
3. [Fase 1 — Infraestrutura (Novos Ficheiros)](#3-fase-1--infraestrutura)
4. [Fase 2 — InstructorEvaluationsTab (CRÍTICO)](#4-fase-2--instructorevaluationstab)
5. [Fase 3 — InstructorDashboardTab](#5-fase-3--instructordashboardtab)
6. [Fase 4 — InstructorCalendarTab](#6-fase-4--instructorcalendartab)
7. [Fase 5 — InstructorStudentsTab](#7-fase-5--instructorstudentstab)
8. [Fase 6 — InstructorPortal.tsx (Shell)](#8-fase-6--instructorportaltsx-shell)
9. [Fase 7 — InstructorMessagesTab](#9-fase-7--instructormessagestab)
10. [Fase 8 — Realtime Consolidado](#10-fase-8--realtime-consolidado)
11. [Verificação Final](#11-verificação-final)

---

## 1. Contexto e Arquitetura Atual

### 1.1 Mapa de Ficheiros

```
src/
├── lib/supabase/client.ts                     ← Supabase client (createClient)
├── types.ts                                    ← Tipos: User, Course, Assignment, AssignmentSubmission
├── hooks/
│   ├── useAuth.ts                             ← Hook de autenticação
│   ├── useCourses.ts                          ← Hook de cursos (básico)
│   ├── useLessons.ts                          ← Hook de lições
│   └── useMessages.ts                         ← Hook de mensagens
├── services/supabase/
│   ├── academicService.ts                     ← CRUD: cursos, módulos, lições, matrículas, certificados, quizzes, progresso, agendamentos, tarefas
│   ├── courseService.ts                       ← getTeacherCourses(), etc.
│   ├── enrollmentService.ts                   ← getAllStudents(), getCourseStudents(), etc.
│   ├── lessonService.ts                       ← Operações de lições
│   ├── messageService.ts                      ← Mensagens e avisos (já usa Supabase)
│   └── userService.ts                         ← Operações de utilizadores
├── components/
│   ├── InstructorPortal.tsx                   ← Shell principal (~1.114 linhas) — sidebar, topbar, 5 tabs inline, loadDatabase()
│   └── instructor/
│       ├── InstructorDashboardTab.tsx          ← KPIs, gráficos SVG, alertas (243 linhas)
│       ├── InstructorCoursesTab.tsx            ← Gestão de cursos (608 linhas) — MELHOR INTEGRADO
│       ├── InstructorStudentsTab.tsx           ← Diretório de alunos (541 linhas)
│       ├── InstructorEvaluationsTab.tsx        ← Correção e avaliações (381 linhas) — 100% FICTÍCIO
│       ├── InstructorCalendarTab.tsx           ← Agenda letiva (458 linhas)
│       ├── InstructorMessagesTab.tsx           ← Chat e mural (177 linhas)
│       └── StudentSelector.tsx                ← Seleção múltipla de alunos (225 linhas)
```

### 1.2 Tabelas Supabase Relevantes

| Tabela | Migration | Utilizada? | Observação |
|--------|-----------|-----------|------------|
| `users` | 001 | ✅ Sim | Dados de alunos/professores |
| `courses` | 001 | ✅ Sim | Cursos com `teacher_id` |
| `modules` | 001 | ✅ Sim | Módulos de curso |
| `lessons` | 001 | ✅ Sim | Lições com `scheduled_at`, `meeting_url` |
| `enrollments` | 001 | ✅ Sim | Matrículas `student_id`, `course_id`, `status` |
| `certificates` | 001 | ✅ Sim | Com `codigo_validacao` |
| `lesson_progress` | 001 | ✅ Sim | Progresso de lições |
| `lesson_targets` | 001 | ✅ Sim | Agendamentos (lesson_id, student_id) |
| `lesson_notes` | 004 | ✅ Sim | Apontamentos de aula |
| `quiz_submissions` | 001 | ✅ Sim | Submissões de quiz |
| `messages` | 001 | ✅ Sim | Chat entre utilizadores |
| `notifications` | 001 | ❌ NÃO | **Nunca consumida no frontend** |
| `assignments` | 004 | ❌ NÃO | **NÃO utilizada — dados fictícios no EvaluationsTab** |
| `assignment_submissions` | 004 | ❌ NÃO | **NÃO utilizada — dados fictícios no EvaluationsTab** |
| `vw_student_progress` | View | ✅ Parcial | Usada em `InstructorStudentsTab` apenas |
| `media` | Bucket 004 | ❌ NÃO | Upload simulado em `handleUploadLibraryFile` |

### 1.3 Problemas Quantificados

| Categoria | Quantidade |
|-----------|-----------|
| Dados fictícios identificados | 25+ |
| Operações CRUD sem persistência | 4 |
| Subscrições Realtime em falta | 7 de 8 |
| Tabs inline não modularizadas | 5 |
| Usos de `alert()` | 8+ |
| Tabelas não integradas | 2 (`assignments`, `assignment_submissions`) |

---

## 2. Antes de Começar — Requisitos

### 2.1 Tipos existentes em `src/types.ts`

Os tipos `Assignment` e `AssignmentSubmission` **já existem**:

```typescript
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

### 2.2 Serviços existentes em `src/services/supabase/academicService.ts`

O `academicService` já tem métodos para `assignments`:

```typescript
async getStudentAssignments(studentId: string): Promise<any[]>
async submitAssignment(assignmentId: string, studentId: string, submission: { text?: string; url?: string }): Promise<any>
```

**Mas FALTAM métodos para o professor:** criar assignments, listar submissões pendentes, atribuir notas, etc.

### 2.3 Supabase Client em `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2.4 Regras Gerais para Todas as Correções

1. **Nunca use `alert()`** — Substituir por `toast.success()`, `toast.error()`, `toast.info()` do sistema de toasts
2. **Nunca use dados hardcoded** — Tudo deve vir do Supabase ou ser calculado
3. **Estados vazios** — Quando não há dados, exibir mensagem informativa (nunca dados falsos)
4. **Importações** — Usar caminhos relativos como o projeto já usa (`../../lib/supabase/client`, etc.)
5. **Props** — Manter compatibilidade com props existentes durante a transição; adicionar novas props conforme necessário
6. **Realtime** — Todas as subscrições devem ser limpas no `useEffect` cleanup
7. **Loading states** — Adicionar estados de carregamento para todas as operações assíncronas
8. **Idioma** — Manter português em todas as strings de UI
9. **Estilo** — Manter as classes Tailwind existentes e o design system (gold-600, ink-900, cream-100, etc.)

---

## 3. Fase 1 — Infraestrutura

### 3.1 Criar `src/services/supabase/assignmentService.ts`

**Ficheiro NOVO.** Este serviço integra as tabelas `assignments` e `assignment_submissions` da Migration 004, que atualmente NÃO são usadas.

```typescript
import { supabase } from '../../lib/supabase/client';
import { Assignment, AssignmentSubmission } from '../../types';

export const assignmentService = {
  // ──────────────── PROFESSOR: ASSIGNMENTS ────────────────

  /**
   * Listar todas as avaliações criadas por um professor
   */
  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, course:courses(id, title)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teacher assignments:', error);
      return [];
    }
    return (data || []).map((a: any) => ({
      ...a,
      course_title: a.course?.title || ''
    }));
  },

  /**
   * Listar avaliações de um curso específico
   */
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course assignments:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Criar nova avaliação
   */
  async createAssignment(assignment: {
    course_id: string;
    teacher_id: string;
    titulo: string;
    descricao?: string;
    due_date?: string;
    lesson_id?: string;
    status?: 'DRAFT' | 'PUBLISHED';
  }): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignment,
        status: assignment.status || 'PUBLISHED'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
    return data;
  },

  /**
   * Atualizar avaliação existente
   */
  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
    return data;
  },

  /**
   * Eliminar avaliação
   */
  async deleteAssignment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
    return true;
  },

  // ──────────────── PROFESSOR: SUBMISSÕES ────────────────

  /**
   * Buscar submissões pendentes (sem nota) para o professor
   */
  async getPendingSubmissions(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner(id, titulo, course_id, teacher_id, course:courses(id, title)),
        student:users(id, nome_completo, email, foto_perfil)
      `)
      .is('grade', null)
      .eq('assignment.teacher_id', teacherId)
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Buscar TODAS as submissões (pendentes + corrigidas) para o professor
   */
  async getAllSubmissions(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner(id, titulo, course_id, teacher_id, course:courses(id, title)),
        student:users(id, nome_completo, email, foto_perfil)
      `)
      .eq('assignment.teacher_id', teacherId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Buscar submissões de uma avaliação específica
   */
  async getSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*, student:users(id, nome_completo, email, foto_perfil)')
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Error fetching submissions for assignment:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Atribuir nota e feedback a uma submissão
   */
  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<AssignmentSubmission> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        grade,
        feedback: feedback || null
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
    return data;
  },

  /**
   * Contar submissões pendentes (sem nota) para o professor
   */
  async getPendingSubmissionsCount(teacherId: string): Promise<number> {
    const { count, error } = await supabase
      .from('assignment_submissions')
      .select('id, assignment:assignments!inner(teacher_id)', { count: 'exact', head: true })
      .is('grade', null)
      .eq('assignment.teacher_id', teacherId);

    if (error) {
      console.error('Error counting pending submissions:', error);
      return 0;
    }
    return count || 0;
  },

  // ──────────────── BROADCAST FEEDBACK ────────────────

  /**
   * Enviar feedback coletivo como notificação para todos os alunos do curso
   */
  async broadcastFeedback(
    teacherId: string,
    courseId: string,
    message: string
  ): Promise<void> {
    // 1. Buscar todos os alunos matriculados no curso
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE');

    if (!enrollments || enrollments.length === 0) return;

    // 2. Criar notificação para cada aluno
    const notifications = enrollments.map(e => ({
      user_id: e.student_id,
      text: message,
      read: false
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error broadcasting feedback:', error);
      throw error;
    }
  }
};
```

### 3.2 Criar `src/hooks/useTeacherCourses.ts`

**Ficheiro NOVO.** Substitui o fetch inline em `InstructorPortal.loadDatabase()`.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { Course } from '../types';
import { courseService } from '../services/supabase/courseService';

export function useTeacherCourses(teacherId: string | undefined, isAdmin: boolean = false) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      let liveCourses: any[];
      if (isAdmin) {
        const { data } = await supabase.from('courses').select('*');
        liveCourses = data || [];
      } else {
        liveCourses = await courseService.getTeacherCourses(teacherId);
      }
      setCourses(liveCourses.map((c: any) => ({
        id: c.id,
        slug: c.slug || c.id,
        title: c.title,
        subtitle: c.description || '',
        summary: c.description || '',
        duration: c.duration || '12 Semanas',
        hours: '72 Horas Letivas',
        language: 'Inglês',
        modality: 'Híbrido',
        schedule: 'Terças e Quintas',
        startDate: 'Em breve',
        price: 'Grátis',
        targetAudience: [],
        modules: [],
        teacher_id: c.teacher_id,
        status: c.status,
        level: c.level || 'Intermédio',
        category: c.category || 'Geral',
        thumbnail: c.thumbnail
      })));
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId, isAdmin]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, refetch: fetchCourses };
}
```

### 3.3 Criar `src/hooks/useTeacherStudents.ts`

**Ficheiro NOVO.**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { User } from '../types';

export function useTeacherStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'ALUNO');

      if (error) throw error;

      if (data && data.length > 0) {
        setStudents(data.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.nome_completo?.split(' ')[0] || '',
          lastName: u.nome_completo?.split(' ').slice(1).join(' ') || '',
          role: 'ALUNO' as const,
          status: u.status || 'ACTIVE',
          streak: 0,
          longestStreak: 0,
          totalHoursLearned: 0,
          avatarUrl: u.foto_perfil || '',
          phone: u.telefone || '',
          foto_perfil: u.foto_perfil
        })));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, refetch: fetchStudents };
}
```

### 3.4 Criar `src/hooks/useTeacherEvaluations.ts`

**Ficheiro NOVO.** Dados para o `InstructorEvaluationsTab`.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../services/supabase/assignmentService';
import { Assignment } from '../types';

export function useTeacherEvaluations(teacherId: string | undefined) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [assigns, pending, count] = await Promise.all([
        assignmentService.getAssignmentsByTeacher(teacherId),
        assignmentService.getPendingSubmissions(teacherId),
        assignmentService.getPendingSubmissionsCount(teacherId)
      ]);
      setAssignments(assigns);
      setPendingSubmissions(pending);
      setPendingCount(count);
    } catch (err) {
      console.error('Error fetching teacher evaluations:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { assignments, pendingSubmissions, pendingCount, loading, refetch: fetchData };
}
```

### 3.5 Criar `src/hooks/useTeacherNotifications.ts`

**Ficheiro NOVO.** Substitui alertas hardcoded.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

interface Notification {
  id: string;
  user_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export function useTeacherNotifications(teacherId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', teacherId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, refetch: fetchNotifications, markAsRead };
}
```

### 3.6 Criar Sistema de Toast — `src/components/ui/Toast.tsx`

**Ficheiro NOVO.** Substitui todos os `alert()`.

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {}
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: ToastContextType = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info')
  };

  const iconMap = {
    success: <CheckCircle size={16} className="text-emerald-500" />,
    error: <XCircle size={16} className="text-red-500" />,
    info: <Info size={16} className="text-blue-500" />
  };

  const bgMap = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40'
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none" style={{ maxWidth: '380px' }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              className={`pointer-events-auto p-3 rounded-xl border shadow-lg flex items-start gap-2.5 ${bgMap[toast.type]}`}
            >
              <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
              <p className="text-xs text-ink-900 dark:text-cream-100 flex-1 leading-relaxed m-0">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-cream-200 border-0 bg-transparent cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
```

**ATENÇÃO:** O `ToastProvider` deve envolver a aplicação no ponto de entrada. No `App.tsx` ou no componente raiz, adicione:

```tsx
import { ToastProvider } from './components/ui/Toast';

// Envolva o conteúdo principal:
<ToastProvider>
  {/* ... conteúdo existente ... */}
</ToastProvider>
```

E em qualquer componente que antes usava `alert()`, substitua por:

```tsx
import { useToast } from '../ui/Toast';
// dentro do componente:
const toast = useToast();
// antes: alert('Sucesso!');
// depois: toast.success('Sucesso!');
```

---

## 4. Fase 2 — InstructorEvaluationsTab

**Ficheiro:** `src/components/instructor/InstructorEvaluationsTab.tsx` (381 linhas)  
**Prioridade:** CRÍTICA — Este componente é 100% fictício. Nenhuma operação persiste no banco de dados.

### 4.1 Problemas Identificados

| Linha | Problema | Gravidade |
|-------|----------|-----------|
| 40-60 | `submissions` state com 2 submissões hardcoded (nomes, emails, textos) | CRÍTICA |
| 62-66 | `quizzesList` state com 3 avaliações hardcoded | CRÍTICA |
| 68-85 | `handleRegisterAssessment` — apenas `setQuizzesList()`, NÃO persiste no Supabase | CRÍTICA |
| 87-99 | `handleGradeSubmit` — apenas `setSubmissions()`, NÃO salva nota | CRÍTICA |
| 101-105 | `handleBroadcastCollectiveFeedback` — usa `alert()`, NÃO envia para nenhuma tabela | CRÍTICA |
| 307-310 | Opções de "Tipo de Instrumento" hardcoded no `<select>` | MÉDIA |
| 332-335 | Opções de "Vínculo de Módulo" hardcoded (3 opções fixas) | MÉDIA |

### 4.2 Refatoração Completa

Substituir o conteúdo inteiro do ficheiro `InstructorEvaluationsTab.tsx` pela versão abaixo:

```typescript
import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  PlusCircle, 
  CheckCheck, 
  FileText, 
  TrendingUp, 
  Award, 
  HelpCircle,
  MessageSquare,
  Users,
  Loader2
} from 'lucide-react';
import { User, Course } from '../../types';
import { assignmentService } from '../../services/supabase/assignmentService';
import { academicService } from '../../services/supabase/academicService';
import { useToast } from '../ui/Toast';

interface InstructorEvaluationsTabProps {
  students: User[];
  courses: Course[];
  currentUser: User | null;
}

export default function InstructorEvaluationsTab({
  students,
  courses,
  currentUser
}: InstructorEvaluationsTabProps) {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'grade'>('grade');

  // ──────── ESTADOS DE CRIAÇÃO DE AVALIAÇÃO ────────
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Exame Prático');
  const [newMinGrade, setNewMinGrade] = useState(70);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  // ──────── DADOS REAIS DO SUPABASE ────────
  const [assignments, setAssignments] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ──────── MÓDULOS DINÂMICOS ────────
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  // ──────── ESTADOS DE CORREÇÃO ────────
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState(0);
  const [individualFeedbackText, setIndividualFeedbackText] = useState('');
  const [grading, setGrading] = useState(false);

  // ──────── FEEDBACK COLETIVO ────────
  const [collectiveBroadcastText, setCollectiveBroadcastText] = useState('');
  const [broadcastCourseId, setBroadcastCourseId] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // ──────── CARREGAR DADOS ────────
  const loadEvaluationData = async () => {
    if (!currentUser?.id) return;
    setLoadingData(true);
    try {
      const [assigns, subs] = await Promise.all([
        assignmentService.getAssignmentsByTeacher(currentUser.id),
        assignmentService.getPendingSubmissions(currentUser.id)
      ]);
      setAssignments(assigns || []);
      setPendingSubmissions(subs || []);
    } catch (err) {
      console.error('Error loading evaluation data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadEvaluationData();
  }, [currentUser?.id]);

  // Selecionar primeiro curso por defeito
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
      setBroadcastCourseId(courses[0].id);
    }
  }, [courses]);

  // Carregar módulos quando o curso muda
  useEffect(() => {
    if (!selectedCourseId) return;
    const loadModules = async () => {
      try {
        const mods = await academicService.getCourseModules(selectedCourseId);
        setAvailableModules(mods || []);
        if (mods.length > 0) setSelectedModuleId(mods[0].id);
      } catch (err) {
        console.error('Error loading modules:', err);
        setAvailableModules([]);
      }
    };
    loadModules();
  }, [selectedCourseId]);

  // Selecionar primeira submissão pendente
  useEffect(() => {
    if (pendingSubmissions.length > 0 && !selectedSubmissionId) {
      setSelectedSubmissionId(pendingSubmissions[0].id);
    }
  }, [pendingSubmissions]);

  // ──────── CRIAR AVALIAÇÃO ────────
  const handleRegisterAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedCourseId || !currentUser?.id) return;

    setCreatingAssignment(true);
    try {
      await assignmentService.createAssignment({
        course_id: selectedCourseId,
        teacher_id: currentUser.id,
        titulo: newTitle,
        descricao: `Tipo: ${newType} | Nota mínima: ${newMinGrade}/100`,
        due_date: null,
        lesson_id: selectedModuleId || undefined,
        status: 'PUBLISHED'
      });

      toast.success(`Avaliação "${newTitle}" publicada com sucesso!`);
      setNewTitle('');
      setActiveSubTab('grade');
      loadEvaluationData();
    } catch (err: any) {
      toast.error(`Erro ao publicar avaliação: ${err.message || err}`);
    } finally {
      setCreatingAssignment(false);
    }
  };

  // ──────── ATRIBUIR NOTA ────────
  const handleGradeSubmit = async (submissionId: string) => {
    setGrading(true);
    try {
      await assignmentService.gradeSubmission(submissionId, gradeValue, individualFeedbackText || undefined);
      toast.success(`Nota de ${gradeValue}/100 atribuída com sucesso!`);
      setIndividualFeedbackText('');
      setSelectedSubmissionId(null);
      loadEvaluationData();
    } catch (err: any) {
      toast.error(`Erro ao atribuir nota: ${err.message || err}`);
    } finally {
      setGrading(false);
    }
  };

  // ──────── FEEDBACK COLETIVO ────────
  const handleBroadcastCollectiveFeedback = async () => {
    if (!collectiveBroadcastText.trim() || !broadcastCourseId || !currentUser?.id) return;

    setBroadcasting(true);
    try {
      await assignmentService.broadcastFeedback(currentUser.id, broadcastCourseId, collectiveBroadcastText.trim());
      toast.success('Feedback coletivo transmitido para todos os alunos do curso!');
      setCollectiveBroadcastText('');
    } catch (err: any) {
      toast.error(`Erro ao transmitir feedback: ${err.message || err}`);
    } finally {
      setBroadcasting(false);
    }
  };

  // Submissão selecionada atual
  const currentSubmission = pendingSubmissions.find((s: any) => s.id === selectedSubmissionId);

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      
      {/* Top selection navbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 dark:bg-ink-900 p-4 rounded-3xl border border-gray-150 dark:border-ink-800/60 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-600/[0.01] to-transparent pointer-events-none" />
        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => setActiveSubTab('grade')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 transition-all ${
              activeSubTab === 'grade' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'text-neutral-400 dark:text-cream-200/60 hover:bg-cream-200 dark:hover:bg-ink-800 bg-transparent'
            }`}
          >
            Corrigir Trabalhos Submetidos
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-3xs font-mono font-bold uppercase cursor-pointer border-0 transition-all ${
              activeSubTab === 'create' 
                ? 'bg-gold-600 text-ink-900 shadow-sm shadow-gold-600/20' 
                : 'text-neutral-400 dark:text-cream-200/60 hover:bg-cream-200 dark:hover:bg-ink-800 bg-transparent'
            }`}
          >
            Formular Nova Avaliação
          </button>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-cream-200/60 font-bold uppercase hidden md:inline relative z-10">
          {pendingSubmissions.length} JURISTAS AGUARDANDO NOTA
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        <div className="lg:col-span-8">

          {/* ──── TAB: CORREÇÃO MANUAL ──── */}
          {activeSubTab === 'grade' && (
            <div className="space-y-6">

              {loadingData ? (
                <div className="flex items-center justify-center py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60">
                  <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
                  <span className="ml-3 text-xs text-neutral-400">A carregar submissões...</span>
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="bg-cream-100 dark:bg-ink-900 p-8 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-gold-600/40 mx-auto" />
                  <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Nenhuma submissão pendente</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">Todos os trabalhos foram corrigidos ou ainda não foram submetidos. Novas submissões aparecerão aqui em tempo real.</p>
                </div>
              ) : (
                <>
                  {/* Selecionar submissão */}
                  <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                    <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Seleccione o Rascunho Prático do Formando</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pendingSubmissions.map((sub: any) => {
                        const studentName = sub.student?.nome_completo || 'Aluno';
                        const taskTitle = sub.assignment?.titulo || 'Tarefa';
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setSelectedSubmissionId(sub.id);
                              setGradeValue(sub.grade || 0);
                            }}
                            className={`p-3 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              selectedSubmissionId === sub.id
                                ? 'border-gold-600 bg-ink-900/5 dark:bg-gold-600/5'
                                : 'border-cream-150 dark:border-ink-800/80 bg-transparent hover:border-cream-250 dark:hover:border-ink-700'
                            }`}
                          >
                            <div>
                              <h4 className="text-2xs font-serif font-black m-0 leading-tight text-ink-900 dark:text-cream-100">{studentName}</h4>
                              <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 block mt-0.5">{taskTitle}</span>
                            </div>
                            <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded mt-2.5 inline-block self-start bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                              Pendente
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ver submissão selecionada */}
                  {currentSubmission && (
                    <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-6 text-left">
                      <div className="border-b border-gray-150 dark:border-ink-800/60 pb-4">
                        <span className="text-[9px] font-mono text-gold-600 uppercase tracking-wider block font-bold">DRAFTING MANUSCRITO PARA DISCUSSÃO RECURSAL</span>
                        <h4 className="text-md font-serif font-black text-ink-900 dark:text-cream-100 mt-1 m-0">{currentSubmission.assignment?.titulo || 'Tarefa'}</h4>
                        <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">
                          ESTUDANTE: {currentSubmission.student?.nome_completo || 'Aluno'} ({currentSubmission.student?.email || ''})
                        </p>
                      </div>

                      {/* Texto submetido */}
                      {currentSubmission.submission_text && (
                        <div className="p-5 sm:p-7 bg-[#FAF9F5] dark:bg-ink-950/40 border-l-4 border-gold-600 rounded-r-2xl font-mono text-xs text-slate-800 dark:text-cream-100 leading-relaxed shadow-inner select-text">
                          {currentSubmission.submission_text}
                        </div>
                      )}

                      {currentSubmission.submission_url && (
                        <div className="p-3 bg-cream-200 dark:bg-ink-800 rounded-xl border border-gray-150 dark:border-ink-800/60">
                          <span className="text-[9px] font-mono text-neutral-400 uppercase block mb-1">Ficheiro Submetido:</span>
                          <a href={currentSubmission.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-600 hover:underline break-all">
                            {currentSubmission.submission_url}
                          </a>
                        </div>
                      )}

                      {/* Formulário de correção */}
                      <div className="bg-cream-200 dark:bg-ink-850 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 space-y-4">
                        <span className="text-[9.5px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold">PARECER RECURSAL DO TUTOR</span>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase mb-1">Nota Quantitativa (0 - 100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(Number(e.target.value))}
                              className="w-full p-2.5 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl font-serif font-black text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                            />
                          </div>
                          <div className="w-full sm:w-2/3">
                            <label className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase mb-1">Feedback Corretivo Individual</label>
                            <input
                              type="text"
                              value={individualFeedbackText}
                              onChange={(e) => setIndividualFeedbackText(e.target.value)}
                              placeholder="Ex: Excelente precisão vocabular ao citar as regras locais de Luanda..."
                              className="w-full p-2.5 text-xs bg-cream-100 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleGradeSubmit(currentSubmission.id)}
                          disabled={grading}
                          className="w-full py-2.5 bg-gold-600 hover:bg-[#b58b35] border-0 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {grading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>A GUARDAR NOTA...</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck size={14} />
                              <span>Guardar Notas e Notificar Jurista</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Feedback Coletivo */}
              <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 space-y-4 text-left">
                <div>
                  <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm m-0">Feedback e Aviso Coletivo (Todas as Turmas)</h4>
                  <p className="text-2xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5 uppercase">MURAL DE NOTAS DE MODERAÇÃO</p>
                </div>

                <div className="space-y-3">
                  <select
                    value={broadcastCourseId}
                    onChange={(e) => setBroadcastCourseId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                  >
                    <option value="">-- Selecione o Curso Destinatário --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <textarea
                    rows={3}
                    placeholder="Escreva orientações gerais válidas para todos os alunos do curso selecionado..."
                    value={collectiveBroadcastText}
                    onChange={(e) => setCollectiveBroadcastText(e.target.value)}
                    className="w-full p-3 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />

                  <button
                    onClick={handleBroadcastCollectiveFeedback}
                    disabled={!collectiveBroadcastText.trim() || !broadcastCourseId || broadcasting}
                    className="px-4 py-2 bg-cream-200 dark:bg-ink-800 hover:bg-gold-600 dark:hover:bg-gold-600 text-neutral-400 dark:text-cream-200 hover:text-ink-900 dark:hover:text-ink-900 border-0 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {broadcasting ? 'A ENVIAR...' : 'Transmitir Feedback Coletivo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──── TAB: CRIAR AVALIAÇÃO ──── */}
          {activeSubTab === 'create' && (
            <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-6">
              <div>
                <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-lg m-0">Criar Novo Instrumento de Avaliação</h4>
                <p className="text-xs text-neutral-400 dark:text-cream-200/60 font-mono mt-0.5">GERADOR DE SESSÕES EXAMINADORAS</p>
              </div>

              <form onSubmit={handleRegisterAssessment} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Título Curricular da Prova</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Exame Escrito: Elaboração de Contratos de Concessão de Mineração"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Curso */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Curso Associado</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="">-- Selecione --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Tipo de Instrumento</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="Questionário Rápido">Questionário Rápido (LMS)</option>
                      <option value="Trabalho de Pesquisa">Trabalho de Pesquisa / Documental</option>
                      <option value="Exame Prático">Exame Prático / Defesa Oral</option>
                    </select>
                  </div>

                  {/* Nota mínima */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Nota de Corte Mínima (0-100)</label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newMinGrade}
                      onChange={(e) => setNewMinGrade(Number(e.target.value))}
                      className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl font-serif font-bold text-center text-slate-800 dark:text-cream-100 focus:outline-none"
                    />
                  </div>

                  {/* Módulo — DINÂMICO */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 dark:text-cream-200/60 tracking-wider mb-1.5">Vínculo de Módulo</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full p-2.5 text-2xs bg-cream-200 dark:bg-ink-800 border border-gray-150 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none"
                    >
                      <option value="">-- Sem módulo específico --</option>
                      {availableModules.map((mod: any) => (
                        <option key={mod.id} value={mod.id}>{mod.titulo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingAssignment || !selectedCourseId}
                  className="w-full py-3 bg-gold-600 hover:bg-[#b58b35] border-0 text-ink-900 font-mono text-3xs font-black uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {creatingAssignment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A PUBLICAR NO SUPABASE...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      <span>Publicar Avaliação no LMS das Turmas</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ──── COLUNA DIREITA: BANCO DE PROVAS ──── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-cream-100 dark:bg-ink-900 p-5 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-left space-y-4">
            <span className="text-[9px] font-mono text-neutral-400 dark:text-cream-200/60 uppercase tracking-widest block font-bold border-b border-gray-150 dark:border-ink-800/60 pb-2">Banco de Provas Vigentes</span>
            
            {assignments.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">Nenhuma avaliação criada ainda.</p>
            ) : (
              <div className="space-y-3.5">
                {assignments.map((quiz: any) => (
                  <div key={quiz.id} className="p-3 bg-cream-200/50 dark:bg-ink-800/40 border border-gray-150 dark:border-ink-800/60 rounded-2xl text-left space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gold-600 font-bold">
                      <span>{quiz.course_title || 'Curso'}</span>
                      <span className="text-neutral-400 dark:text-cream-200/40 font-semibold uppercase">{quiz.status}</span>
                    </div>
                    <h5 className="font-serif font-black text-ink-900 dark:text-cream-100 text-2xs m-0 leading-tight">{quiz.titulo}</h5>
                    <span className="block text-[8px] font-mono text-neutral-400 dark:text-cream-200/60">{quiz.descricao || 'Sem descrição'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Alterações na Interface (Props)

A interface `InstructorEvaluationsTabProps` mudou:

```typescript
// ANTES:
interface InstructorEvaluationsTabProps {
  students: User[];
  courses: Course[];
}

// DEPOIS:
interface InstructorEvaluationsTabProps {
  students: User[];
  courses: Course[];
  currentUser: User | null;  // ← NOVO — necessário para teacher_id
}
```

**No `InstructorPortal.tsx`**, onde o `InstructorEvaluationsTab` é renderizado, adicione a prop:

```typescript
// ANTES:
<InstructorEvaluationsTab students={students} courses={courses} />

// DEPOIS:
<InstructorEvaluationsTab students={students} courses={courses} currentUser={currentUser} />
```

---

## 5. Fase 3 — InstructorDashboardTab

**Ficheiro:** `src/components/instructor/InstructorDashboardTab.tsx` (243 linhas)

### 5.1 Problemas Identificados

| Linha | Problema | Correção |
|-------|----------|----------|
| 43-47 | `alertsQueue` com 3 alertas hardcoded | Substituir por `notifications` reais via prop |
| 156 | SVG path hardcoded `M 0,100 C 50,85...` | Gerar SVG dinâmico a partir de dados ou usar placeholder informativo |
| 174 | SVG path hardcoded `M 0,90 C 50,95...` | Idem |
| 191-194 | Rótulos X estáticos "SEMANA 1"..."SEMANA 12" | Gerar rótulos dinâmicos ou usar texto genérico |
| 200-203 | Insight com `94%` hardcoded | Remover ou calcular dinamicamente |
| 34 | `evaluationsPendingCount` recebe `3` hardcoded do parent | Receber valor real do Supabase |

### 5.2 Nova Interface de Props

```typescript
// ANTES:
interface InstructorDashboardTabProps {
  currentUser: User | null;
  courses: Course[];
  students: User[];
  evaluationsPendingCount: number;
  certificatesIssuedCount: number;
  completionRate: number;
  onNavigate: (tab: string) => void;
  lessonsCount?: number;
}

// DEPOIS:
interface InstructorDashboardTabProps {
  currentUser: User | null;
  courses: Course[];
  students: User[];
  evaluationsPendingCount: number;      // Agora vem do Supabase (real)
  certificatesIssuedCount: number;
  completionRate: number;                // Agora calculado (real)
  onNavigate: (tab: string) => void;
  lessonsCount?: number;
  recentNotifications?: any[];           // ← NOVO — alertas reais
}
```

### 5.3 Correções Específicas

#### 5.3.1 Substituir `alertsQueue` (linhas 43-47)

```typescript
// ANTES:
const alertsQueue = [
  { id: 1, type: 'assignment', text: 'Dr. António Carvalho submeteu...', time: 'Há 15 mins' },
  { id: 2, type: 'enrollment', text: 'Dra. Patrícia Santos registou-se...', time: 'Há 2 horas' },
  { id: 3, type: 'live', text: 'Sessão ao Vivo agendada...', time: 'Agendado' }
];

// DEPOIS:
const alertsQueue = (recentNotifications || []).slice(0, 5).map((n: any, idx: number) => ({
  id: n.id || idx,
  type: n.text?.toLowerCase().includes('submeteu') ? 'assignment' 
      : n.text?.toLowerCase().includes('registou') ? 'enrollment' 
      : 'live',
  text: n.text,
  time: n.created_at ? new Date(n.created_at).toLocaleString('pt-AO', { hour: '2-digit', minute: '2-digit' }) : 'Agora'
}));
```

#### 5.3.2 Substituir Gráficos SVG Hardcoded (linhas 153-194)

Substituir todo o bloco SVG por uma mensagem informativa enquanto não há RPC para métricas semanais. **Não gerar gráficos falsos.**

```typescript
// SUBSTITUIR todo o bloco <svg viewBox="0 0 500 120"...> </svg> e seus contents por:
<div className="w-full h-48 flex flex-col items-center justify-center text-center space-y-3">
  <Activity className="w-10 h-10 text-gold-600/30" />
  <p className="text-xs text-neutral-400 max-w-sm">
    Os gráficos analíticos serão exibidos quando houver dados suficientes de progresso dos alunos. 
    As métricas serão calculadas automaticamente a partir das submissões e conclusões de aulas.
  </p>
</div>
```

#### 5.3.3 Substituir Insight Hardcoded (linhas 198-203)

```typescript
// ANTES:
<p className="text-2xs text-ink-900 dark:text-cream-100/80 leading-relaxed font-sans m-0">
  O pico de envolvimento letivo aumentou após a introdução de áudios e vídeos indexados... <strong>94%</strong>.
</p>

// DEPOIS:
<p className="text-2xs text-ink-900 dark:text-cream-100/80 leading-relaxed font-sans m-0">
  {completionRate > 0
    ? `A taxa de conclusão geral dos seus cursos é de ${completionRate}%. Continue acompanhando o progresso dos alunos para identificar oportunidades de melhoria.`
    : 'Os insights analíticos serão gerados automaticamente quando houver dados de progresso dos alunos registados no sistema.'}
</p>
```

#### 5.3.4 Remover Rótulos Estáticos (linhas 189-194)

Remover `<div className="absolute inset-x-0 bottom-0 flex justify-between...">` com os 4 `SEMANA` labels.

### 5.4 No InstructorPortal.tsx — Corrigir `pendingGreads` e `completionRate`

**Linha 398 do `InstructorPortal.tsx`:**

```typescript
// ANTES:
const pendingGreads = 3;

// DEPOIS (usar o hook):
const { pendingCount: pendingGreads } = useTeacherEvaluations(currentUser?.id);
```

**Calcular `completionRate` real:**

```typescript
// ANTES: completionRate = 95 (hardcoded na props passada ao DashboardTab)

// DEPOIS: Calcular a partir de vw_student_progress ou enrollments
const [completionRate, setCompletionRate] = useState(0);

// Dentro de loadDatabase ou useEffect:
const calculateCompletionRate = async () => {
  try {
    const { data: progressData } = await supabase
      .from('enrollments')
      .select('status')
      .in('course_id', courses.map(c => c.id));
    
    if (progressData && progressData.length > 0) {
      const completed = progressData.filter(e => e.status === 'COMPLETED').length;
      setCompletionRate(Math.round((completed / progressData.length) * 100));
    }
  } catch (err) {
    console.error('Error calculating completion rate:', err);
  }
};
```

**Passar notificações para o DashboardTab:**

```typescript
const { notifications: recentNotifications } = useTeacherNotifications(currentUser?.id);

// Na renderização:
<InstructorDashboardTab
  currentUser={currentUser}
  courses={courses}
  students={students}
  evaluationsPendingCount={pendingGreads}
  certificatesIssuedCount={certificatesCount}
  completionRate={completionRate}
  onNavigate={(tab) => setActiveTab(tab)}
  lessonsCount={lessonsCount}
  recentNotifications={recentNotifications}
/>
```

---

## 6. Fase 4 — InstructorCalendarTab

**Ficheiro:** `src/components/instructor/InstructorCalendarTab.tsx` (458 linhas)

### 6.1 Problemas Identificados

| Linha | Problema | Correção |
|-------|----------|----------|
| 48-52 | `eventsList` com 3 eventos hardcoded | **REMOVER** — usar apenas `scheduledLessons` |
| 147-161 | `combinedEvents` mistura fictícios com reais | Usar apenas `scheduledLessons` |
| 256-259 | Fallback "Aula 1 - Introdução Geral" | Exibir estado vazio informativo |
| 395 | "Mês Coerente (Junho 2026)" hardcoded | Calcular dinamicamente |
| 447 | "GOOGLE SYNC ACTIVE" falso | **REMOVER** completamente |

### 6.2 Correções Específicas

#### 6.2.1 Remover `eventsList` (linhas 48-52)

```typescript
// ANTES:
const [eventsList, setEventsList] = useState([
  { id: 'ev-1', title: 'Drafting Workshop I...', date: getRelativeDate(-3), ... },
  { id: 'ev-2', title: 'Exame Intermédio...', date: getRelativeDate(3), ... },
  { id: 'ev-3', title: 'Sessão Conversacional...', date: getRelativeDate(10), ... }
]);

// DEPOIS: REMOVER esta variável completamente. Não há substituto — usar apenas scheduledLessons.
```

#### 6.2.2 Substituir `combinedEvents` (linhas 147-161)

```typescript
// ANTES:
const combinedEvents = [
  ...eventsList,
  ...scheduledLessons.map((sl, index) => { ... })
];

// DEPOIS:
const calendarEvents = scheduledLessons.map((sl: any, index: number) => {
  const title = sl.lesson?.titulo || sl.lesson?.title || 'Aula Síncrona';
  const sUser = sl.student;
  const studentName = sUser ? `${sUser.firstName || ''} ${sUser.lastName || ''}`.trim() || sUser.email : 'Aluno';
  return {
    id: sl.id || `sl-${index}`,
    title: `${title} (${studentName})`,
    date: sl.lesson?.scheduled_at?.split('T')[0] || new Date().toISOString().slice(0, 10),
    time: sl.lesson?.scheduled_at?.split('T')[1]?.substring(0, 5) || '18:30',
    type: 'Síncrona'
  };
});
```

**Atualizar todas as referências a `combinedEvents` no JSX para `calendarEvents`.**

#### 6.2.3 Remover Fallback de Lições (linhas 256-259)

```typescript
// ANTES:
{dbLessons.length === 0 ? (
  <>
    <option value="fallback_lesson_1">Aula 1 - Introdução Geral</option>
    <option value="fallback_lesson_2">Aula 2 - Redação Avançada</option>
    <option value="fallback_lesson_3">Aula 3 - Drafting Comercial</option>
  </>
) : ( ... )}

// DEPOIS:
{dbLessons.length === 0 ? (
  <option value="" disabled>Nenhuma lição disponível para este curso</option>
) : ( ... )}
```

#### 6.2.4 Calendário Dinâmico (linha 395)

```typescript
// ANTES:
<h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 m-0 leading-tight">Mês Coerente (Junho 2026)</h4>

// DEPOIS:
const currentMonthLabel = new Date().toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
// No JSX:
<h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 m-0 leading-tight capitalize">{currentMonthLabel}</h4>
```

**Também atualizar o grid do calendário para usar o mês/ano atual em vez de hardcoded `2026-06`:**

```typescript
// ANTES (linha 408):
const formattedDate = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;

// DEPOIS:
const now = new Date();
const yearStr = now.getFullYear();
const monthStr = String(now.getMonth() + 1).padStart(2, '0');
const formattedDate = `${yearStr}-${monthStr}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
```

#### 6.2.5 Remover "GOOGLE SYNC ACTIVE" (linhas 446-451)

**REMOVER completamente este bloco:**

```typescript
// REMOVER:
<div className="bg-ink-900/5 dark:bg-ink-950/40 p-3 rounded-2xl border border-ink-900/10 dark:border-ink-800/60 text-left mt-4">
  <span className="text-[8px] font-mono text-ink-900 dark:text-cream-100 font-bold block uppercase mb-1">GOOGLE SYNC ACTIVE</span>
  <p className="text-4xs text-neutral-400 dark:text-cream-200/40 leading-relaxed m-0">
    Quaisquer alterações registadas serão replicadas e espelhadas...
  </p>
</div>
```

---

## 7. Fase 5 — InstructorStudentsTab

**Ficheiro:** `src/components/instructor/InstructorStudentsTab.tsx` (541 linhas)

### 7.1 Problemas Identificados

| Linha | Problema | Correção |
|-------|----------|----------|
| 50 | `editScore = 88` hardcoded | Inicializar com `0` ou valor do aluno |
| 89-95 | `metricsDB` com notas/presença hardcoded | Calcular a partir de `assignment_submissions` e `lesson_progress` |
| 102+ | `handleSendInstantAlert` usa `alert()` | Persistir na tabela `notifications` |

### 7.2 Correções Específicas

#### 7.2.1 `metricsDB` — Notas e Presença Reais

O componente já consulta `vw_student_progress`. O `metricsDB` com valores hardcoded precisa ser substituído por uma consulta que agregue dados reais.

**Localizar o estado `metricsDB` e a lógica que o popula. Substituir valores hardcoded por cálculos reais:**

```typescript
// ANTES (valores hardcoded no metricsDB):
// { grade: 92, presence: 95 }
// { grade: 78, presence: 82 }
// { grade: 85, presence: 90 }

// DEPOIS: Já existe fetch para vw_student_progress. Usar esses dados para calcular:
// grade = avg de assignment_submissions.grade + quiz_submissions.score
// presence = (completed_lessons / total_lessons) * 100 (do vw_student_progress)

// Para cada aluno, usar o progressMetrics que já é buscado:
const getMetricsForStudent = (studentId: string) => {
  const metrics = progressMetrics[studentId];
  if (metrics) {
    return {
      grade: metrics.avg_quiz_score || 0,
      presence: metrics.progress_percent || 0
    };
  }
  return { grade: 0, presence: 0 };
};
```

**Substituir todas as referências a `metricsDB[studentId]` por `getMetricsForStudent(studentId)`.**

#### 7.2.2 `handleSendInstantAlert` — Persistir Notificação

```typescript
// ANTES:
const handleSendInstantAlert = (studentId: string) => {
  alert(`Alerta enviado para ${studentId}: ${customAlertText}`);
};

// DEPOIS:
const handleSendInstantAlert = async (studentId: string) => {
  if (!customAlertText.trim()) return;
  try {
    await supabase.from('notifications').insert({
      user_id: studentId,
      text: customAlertText,
      read: false
    });
    toast.success(`Alerta enviado com sucesso para o aluno!`);
    setCustomAlertText('');
    setAlertingStudentId(null);
  } catch (err: any) {
    toast.error(`Erro ao enviar alerta: ${err.message || err}`);
  }
};
```

#### 7.2.3 `editScore` Default

```typescript
// ANTES:
const [editScore, setEditScore] = useState(88);

// DEPOIS:
const [editScore, setEditScore] = useState(0);
```

E ao abrir a edição de nota para um aluno, popular com a nota real:

```typescript
// Ao clicar para editar:
setEditScore(getMetricsForStudent(student.id).grade);
```

---

## 8. Fase 6 — InstructorPortal.tsx (Shell)

**Ficheiro:** `src/components/InstructorPortal.tsx` (1.114 linhas)

### 8.1 Problemas Identificados

| Linha | Problema | Correção |
|-------|----------|----------|
| 136 | `profileBio` hardcoded da Esmeralda | Ler do Supabase `profiles` ou `users` |
| 137 | `profileCredentials` hardcoded | Idem |
| 142-144 | `newCoursePrice`, `Category`, `Duration` defaults | Manter como defaults (não crítico) |
| 333-347 | `handleAddPlannerModule` não persiste | Usar `academicService.createModule()` |
| 350-368 | `handleUploadLibraryFile` simulado | Usar Supabase Storage bucket `media` |
| 398 | `pendingGreads = 3` hardcoded | Usar `useTeacherEvaluations().pendingCount` |
| 821-832 | Preview certificado com dados hardcoded | Usar dados reais do aluno selecionado |
| 912-963 | Tab "Métricas & SVGs" com gráficos hardcoded | Remover dados falsos, usar placeholder |
| 1063-1083 | "Google Meet: CONECTADO" falso | Remover claims falsos |
| 163-165 | `loadDatabase()` sem Realtime | Substituir por hooks com Realtime |

### 8.2 Correções Específicas

#### 8.2.1 Substituir `loadDatabase()` por Hooks

```typescript
// ANTES (linhas 163-259):
useEffect(() => { loadDatabase(); }, []);
const loadDatabase = async () => { /* 5 queries inline */ };

// DEPOIS:
const { courses, loading: loadingCourses, refetch: refetchCourses } = useTeacherCourses(currentUser?.id, currentUser?.role === 'ADMIN');
const { students, loading: loadingStudents, refetch: refetchStudents } = useTeacherStudents();
const { pendingCount: pendingGreads } = useTeacherEvaluations(currentUser?.id);
const { notifications: recentNotifications } = useTeacherNotifications(currentUser?.id);
```

**Manter `enrollments`, `certificatesCount`, `lessonsCount` e `completionRate` carregados inline mas com cálculo real:**

```typescript
const [enrollments, setEnrollments] = useState<any[]>([]);
const [certificatesCount, setCertificatesCount] = useState(0);
const [lessonsCount, setLessonsCount] = useState(0);
const [completionRate, setCompletionRate] = useState(0);

useEffect(() => {
  if (!currentUser) return;
  const loadAuxData = async () => {
    // Enrollments
    const { data: enrollData } = await supabase.from('enrollments').select('*');
    if (enrollData) setEnrollments(enrollData.map((e: any) => ({
      userId: e.student_id,
      courseId: e.course_id,
      progressPercent: e.progress_percent || 0,
      status: e.status,
      enrolledAt: e.data_inicio?.slice(0, 10) || ''
    })));

    // Certificates count
    const { count: certsCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
    if (certsCount !== null) setCertificatesCount(certsCount);

    // Lessons count
    const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
    if (totalLessons !== null) setLessonsCount(totalLessons);

    // Completion rate
    if (enrollData && enrollData.length > 0) {
      const completed = enrollData.filter((e: any) => e.status === 'COMPLETED').length;
      setCompletionRate(Math.round((completed / enrollData.length) * 100));
    }
  };
  loadAuxData();
}, [currentUser?.id]);
```

#### 8.2.2 Profile Persistente

```typescript
// ANTES (linhas 136-137):
const [profileBio, setProfileBio] = useState('Esmeralda Bruno Sumbelelo é advogada...');
const [profileCredentials, setProfileCredentials] = useState('Licenciada em Direito...');

// DEPOIS:
const [profileBio, setProfileBio] = useState('');
const [profileCredentials, setProfileCredentials] = useState('');

useEffect(() => {
  if (!currentUser?.id) return;
  const loadProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('biografia, credenciais')
      .eq('id', currentUser.id)
      .maybeSingle();
    if (data) {
      setProfileBio(data.biografia || '');
      setProfileCredentials(data.credenciais || '');
    }
  };
  loadProfile();
}, [currentUser?.id]);
```

**Salvar profile:**

```typescript
const handleSaveProfile = async () => {
  try {
    await supabase.from('users').update({
      biografia: profileBio,
      credenciais: profileCredentials
    }).eq('id', currentUser?.id);
    toast.success('Perfil atualizado com sucesso!');
  } catch (err: any) {
    toast.error(`Erro ao salvar perfil: ${err.message || err}`);
  }
};
```

#### 8.2.3 `handleAddPlannerModule` — Persistir no Supabase

```typescript
// ANTES (linhas 333-347):
const handleAddPlannerModule = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newPlannerModuleTitle.trim()) return;
  setPlannerModules([...plannerModules, { number: `Mês ${plannerModules.length + 1}`, title: newPlannerModuleTitle, lessonsCount: 0 }]);
  setNewPlannerModuleTitle('');
  alert('Nova categoria de ementa anexada...');
};

// DEPOIS:
const handleAddPlannerModule = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newPlannerModuleTitle.trim() || !selectedPlannerCourse) return;
  try {
    await academicService.createModule(selectedPlannerCourse, newPlannerModuleTitle, plannerModules.length + 1);
    // Recarregar módulos do curso
    const updatedModules = await academicService.getCourseModules(selectedPlannerCourse);
    setPlannerModules(updatedModules.map((m: any) => ({
      number: `Mês ${m.ordem}`,
      title: m.titulo,
      lessonsCount: 0
    })));
    setNewPlannerModuleTitle('');
    toast.success('Módulo adicionado ao curso com sucesso!');
  } catch (err: any) {
    toast.error(`Erro ao criar módulo: ${err.message || err}`);
  }
};
```

#### 8.2.4 `handleUploadLibraryFile` — Upload Real

```typescript
// ANTES (linhas 350-368): Simulação de upload

// DEPOIS:
const handleUploadLibraryFile = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newLibraryFileName.trim()) return;

  try {
    // Criar um ficheiro vazio como placeholder (na prática, o utilizador selecionaria um ficheiro real)
    const fileName = `${Date.now()}_${newLibraryFileName}`;
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`library/${fileName}`, new Blob(['']), {
        contentType: 'application/octet-stream',
        upsert: false
      });

    if (error) throw error;

    setLibraryFiles([{
      id: data?.path || Date.now().toString(),
      name: newLibraryFileName,
      type: newLibraryFileName.toLowerCase().endsWith('.pdf') ? 'pdf' 
          : newLibraryFileName.toLowerCase().endsWith('.docx') ? 'docx' : 'audio',
      size: 'Upload concluído',
      date: new Date().toISOString().slice(0, 10)
    }, ...libraryFiles]);
    
    setNewLibraryFileName('');
    toast.success('Documento carregado para a biblioteca com sucesso!');
  } catch (err: any) {
    toast.error(`Erro ao carregar ficheiro: ${err.message || err}`);
  }
};
```

#### 8.2.5 Preview de Certificado Dinâmico

**Substituir dados hardcoded no preview de certificado (perto da linha 821):**

```typescript
// ANTES:
// "Dr. António Ferreira Carvalho", "92 / 100", "MPA-2026-UNLOCKED-PER_"

// DEPOIS: Usar dados do aluno selecionado
const selectedStudent = students.find(s => s.id === preselectedStudentId);
const studentDisplayName = selectedStudent 
  ? `${selectedStudent.firstName} ${selectedStudent.lastName}` 
  : 'Selecionar aluno';
```

#### 8.2.6 Remover Claims Falsos de Integrações (linhas ~1063-1083)

```typescript
// ANTES:
// "Google Meet: CONECTADO"
// "Google Calendar: ATIVO"

// DEPOIS: Substituir por status real:
<div className="space-y-3">
  <div className="flex items-center justify-between p-3 bg-cream-200 dark:bg-ink-800 rounded-xl">
    <span className="text-xs font-mono text-neutral-400">Google Meet</span>
    <span className="text-[9px] font-mono text-neutral-400 uppercase">Não conectado</span>
  </div>
  <div className="flex items-center justify-between p-3 bg-cream-200 dark:bg-ink-800 rounded-xl">
    <span className="text-xs font-mono text-neutral-400">Google Calendar</span>
    <span className="text-[9px] font-mono text-neutral-400 uppercase">Não conectado</span>
  </div>
</div>
```

#### 8.2.7 Tab "Métricas & SVGs" — Remover Dados Falsos

**Substituir os gráficos SVG com valores hardcoded (78%, barras estáticas) por estado vazio informativo:**

```typescript
// Na tab relatorios, em vez de SVGs hardcoded:
<div className="text-center py-12">
  <BarChart2 className="w-12 h-12 text-gold-600/30 mx-auto mb-3" />
  <h4 className="font-serif font-bold text-ink-900 dark:text-cream-100">Relatórios Analíticos</h4>
  <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto">
    Os relatórios e métricas detalhadas serão disponibilizados assim que houver dados suficientes de progresso e submissões dos alunos.
  </p>
</div>
```

### 8.3 Substituir Todos os `alert()` por `toast`

**Localizar e substituir TODAS as ocorrências de `alert()` em `InstructorPortal.tsx`:**

| Linha | `alert()` | Substituição |
|-------|-----------|-------------|
| ~272 | `alert('Estado da matrícula reajustado...')` | `toast.success('Estado da matrícula reajustado no Supabase.')` |
| ~275 | `alert('Erro ao reajustar matrícula...')` | `toast.error('Erro ao reajustar matrícula.')` |
| ~320 | `alert('Sucesso! O curso...')` | `toast.success('Curso criado com sucesso!')` |
| ~328 | `alert('Falha ao registrar curso...')` | `toast.error('Falha ao registrar curso.')` |
| ~346 | `alert('Nova categoria...')` | `toast.success('Módulo adicionado!')` |
| ~367 | `alert('Documento adicionado...')` | `toast.success('Documento carregado!')` |

Adicionar import no topo do ficheiro:

```typescript
import { useToast } from './ui/Toast';
```

E dentro do componente:

```typescript
const toast = useToast();
```

---

## 9. Fase 7 — InstructorMessagesTab

**Ficheiro:** `src/components/instructor/InstructorMessagesTab.tsx` (177 linhas)

### 9.1 Problemas Identificados

| Linha | Problema | Correção |
|-------|----------|----------|
| 46 | `titulo: 'Aviso do Professor'` fixo | Transformar em campo editável |
| 50 | `alert('Mural de Avisos atualizado...')` | `toast.success(...)` |
| 54 | `alert('Erro ao publicar no mural...')` | `toast.error(...)` |

### 9.2 Correções

#### 9.2.1 Título Editável

```typescript
// ANTES:
const [muralAnnouncementText, setMuralAnnouncementText] = useState('');

// DEPOIS:
const [muralAnnouncementTitle, setMuralAnnouncementTitle] = useState('Aviso do Professor');
const [muralAnnouncementText, setMuralAnnouncementText] = useState('');
```

```typescript
// ANTES (linha 43-48):
await messageService.createAnnouncement({
  author_id: user.id,
  titulo: 'Aviso do Professor',
  mensagem: muralAnnouncementText.trim(),
  destinatarios: 'ALUNO'
});

// DEPOIS:
await messageService.createAnnouncement({
  author_id: user.id,
  titulo: muralAnnouncementTitle.trim() || 'Aviso do Professor',
  mensagem: muralAnnouncementText.trim(),
  destinatarios: 'ALUNO'
});
```

Adicionar campo de título no formulário (antes do textarea):

```html
<input
  type="text"
  value={muralAnnouncementTitle}
  onChange={(e) => setMuralAnnouncementTitle(e.target.value)}
  placeholder="Título do aviso..."
  className="w-full p-2.5 text-xs bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-750 rounded-xl text-slate-800 dark:text-cream-100 focus:outline-none focus:border-gold-600"
/>
```

#### 9.2.2 Substituir `alert()` por `toast`

```typescript
// Adicionar import:
import { useToast } from '../ui/Toast';

// Dentro do componente:
const toast = useToast();

// ANTES (linha 50):
alert('Mural de Avisos atualizado com sucesso no Supabase!');
// DEPOIS:
toast.success('Aviso publicado com sucesso no mural!');

// ANTES (linha 54):
alert(`Erro ao publicar no mural: ${err.message || err}`);
// DEPOIS:
toast.error(`Erro ao publicar no mural: ${err.message || err}`);
```

---

## 10. Fase 8 — Realtime Consolidado

### 10.1 Substituir Subscrição Única por Canal Unificado

**No `InstructorPortal.tsx`, atualmente existe UMA subscrição Realtime (messages). Substituir por um canal unificado que escuta múltiplas tabelas:**

```typescript
// ANTES (linhas ~107-126 do InstructorPortal.tsx):
useEffect(() => {
  if (!currentUser?.id) return;
  const channel = supabase
    .channel('instructor-messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, ...)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [currentUser?.id]);

// DEPOIS:
useEffect(() => {
  if (!currentUser?.id) return;

  const channel = supabase
    .channel('instructor-realtime-sync')
    
    // Messages
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` },
      () => { refetchUnreadCount(); }
    )
    
    // Courses (quando um curso é atualizado)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'courses', filter: `teacher_id=eq.${currentUser.id}` },
      () => { refetchCourses(); }
    )
    
    // Enrollments (novos alunos)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'enrollments' },
      () => { refetchStudents(); }
    )
    
    // Certificates
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'certificates' },
      () => { /* recarregar cert count */ }
    )
    
    // Assignment Submissions (novas submissões)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'assignment_submissions' },
      () => { /* recarregar pending count + notificações */ }
    )
    
    // Notifications
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
      (payload: any) => {
        toast.info('Nova notificação recebida.');
        /* recarregar notificações */
      }
    )
    
    // Lesson Targets (agendamentos)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'lesson_targets' },
      () => { /* recarregar agenda */ }
    )
    
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [currentUser?.id]);
```

### 10.2 Indicador de Sincronia (Opcional)

Adicionar um pequeno indicador na topbar do `InstructorPortal`:

```typescript
const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

// Dentro da subscrição Realtime:
channel.subscribe((status: string) => {
  if (status === 'SUBSCRIBED') setSyncStatus('connected');
  else if (status === 'RETRYING') setSyncStatus('reconnecting');
  else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSyncStatus('disconnected');
});
```

No JSX da topbar:

```html
<div className="flex items-center gap-1.5">
  <span className={`w-2 h-2 rounded-full ${
    syncStatus === 'connected' ? 'bg-emerald-500' :
    syncStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
  }`}></span>
  <span className="text-[9px] font-mono text-neutral-400 uppercase">
    {syncStatus === 'connected' ? 'Sincronizado' :
     syncStatus === 'reconnecting' ? 'Reconectando...' : 'Desconectado'}
  </span>
</div>
```

---

## 11. Verificação Final

### 11.1 Checklist de Correções

Após aplicar todas as fases, verifique:

- [ ] **Nenhum `alert()` restante** — Procurar globalmente por `alert(` no projeto
- [ ] **Nenhum dado hardcoded** — Procurar por strings como "Dr. António", "94%", "95", "450.000 Kz" que não sejam defaults de formulário
- [ ] **Tabela `assignments` integrada** — `assignmentService` é usado no `InstructorEvaluationsTab`
- [ ] **Tabela `assignment_submissions` integrada** — Submissões reais substituem dados fictícios
- [ ] **Tabela `notifications` integrada** — Alertas reais substituem `alertsQueue` e `handleSendInstantAlert`
- [ ] **Bucket `media` integrado** — Upload de ficheiros usa Storage real
- [ ] **Realtime ativo** — Canal unificado com 7+ subscrições
- [ ] **Toast funcional** — `ToastProvider` envolve a app, `useToast()` disponível em todos os componentes
- [ ] **Estados vazios** — Componentes exibem mensagens informativas quando não há dados
- [ ] **Calendário dinâmico** — Mês/ano atuais, sem eventos fictícios
- [ ] **KPIs reais** — `pendingGreads` e `completionRate` calculados do Supabase
- [ ] **Claims falsos removidos** — "GOOGLE SYNC ACTIVE", "Google Meet: CONECTADO" eliminados

### 11.2 Ficheiros Novos Criados

| Ficheiro | Tipo |
|----------|------|
| `src/services/supabase/assignmentService.ts` | Serviço |
| `src/hooks/useTeacherCourses.ts` | Hook |
| `src/hooks/useTeacherStudents.ts` | Hook |
| `src/hooks/useTeacherEvaluations.ts` | Hook |
| `src/hooks/useTeacherNotifications.ts` | Hook |
| `src/components/ui/Toast.tsx` | Componente UI |

### 11.3 Ficheiros Modificados

| Ficheiro | Tipo de Modificação |
|----------|-------------------|
| `src/components/InstructorPortal.tsx` | Substituir `loadDatabase()` por hooks, remover `pendingGreads=3`, calcular `completionRate`, Realtime unificado, toast, profile persistente, módulos persistentes, upload real |
| `src/components/instructor/InstructorEvaluationsTab.tsx` | **Refatoração completa** — 100% Supabase, remover dados fictícios |
| `src/components/instructor/InstructorDashboardTab.tsx` | Alertas reais, gráficos placeholder, insight dinâmico |
| `src/components/instructor/InstructorCalendarTab.tsx` | Remover eventos fictícios, calendário dinâmico, remover Google Sync |
| `src/components/instructor/InstructorStudentsTab.tsx` | Notas reais, presença real, notificações persistentes |
| `src/components/instructor/InstructorMessagesTab.tsx` | Título editável, toast |

### 11.4 Ordem de Execução Recomendada

1. **Criar ficheiros novos** (assignmentService, hooks, Toast) — Sem dependências, podem ser criados em paralelo
2. **Adicionar `ToastProvider` no App.tsx** — Necessário antes de substituir `alert()`
3. **Refatorar `InstructorEvaluationsTab`** — Prioridade CRÍTICA, componente 100% fictício
4. **Refatorar `InstructorPortal`** — Substituir `loadDatabase()`, adicionar hooks, Realtime
5. **Refatorar `InstructorDashboardTab`** — Depende dos novos dados do Portal
6. **Refatorar `InstructorCalendarTab`** — Remover fictícios
7. **Refatorar `InstructorStudentsTab`** — Notas/presença reais
8. **Refatorar `InstructorMessagesTab`** — Pequenas correções
9. **Testar e verificar** — Checklist acima

### 11.5 Notas sobre RLS (Row Level Security)

As tabelas `assignments` e `assignment_submissions` da Migration 004 já devem ter RLS policies. Se ao testar ocorrerem erros de permissão, verificar:

```sql
-- Permitir professor ler assignments que criou
CREATE POLICY "Teachers can read own assignments" ON assignments
  FOR SELECT USING (teacher_id = auth.uid());

-- Permitir professor ler submissões dos seus assignments
CREATE POLICY "Teachers can read submissions of own assignments" ON assignment_submissions
  FOR SELECT USING (
    assignment_id IN (SELECT id FROM assignments WHERE teacher_id = auth.uid())
  );

-- Permitir professor criar assignments
CREATE POLICY "Teachers can create assignments" ON assignments
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Permitir professor atualizar notas (grade) nas submissões
CREATE POLICY "Teachers can grade submissions" ON assignment_submissions
  FOR UPDATE USING (
    assignment_id IN (SELECT id FROM assignments WHERE teacher_id = auth.uid())
  );

-- Permitir notificações para o próprio utilizador
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
```

---

*Fim do Guia de Correções — Aplicar na ordem indicada, testando cada fase antes de prosseguir.*
