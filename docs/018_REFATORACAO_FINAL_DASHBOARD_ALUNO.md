# 📋 Documento de Orientação 018 — Refatoração Final do Dashboard do Aluno

**Projeto:** MultiPlus Academy LMS  
**Destinatário:** Google Gemini (Google AI Studio)  
**Autor:** Super Z (Orientador de Desenvolvimento)  
**Data:** 16 de Julho de 2026  
**Prioridade:** 🔴 Alta — Refatoração completa e finalização do dashboard do aluno  

---

## Sumário

Este documento contém duas secções: (A) Correções de bugs e dados fictícios remanescentes no StudentPortal, e (B) Refatoração de performance — extrair lógica do componente monolítico de 1925 linhas em sub-componentes e hooks customizados.

---

## SECÇÃO A — Correções de Bugs e Dados Fictícios Remanescentes

### A1. BUG CRÍTICO: Aulas sem `scheduled_at` aparecem como bloqueadas

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 1509  
**Problema:** A lógica de bloqueio está invertida para aulas sem data de agendamento:

```tsx
// ATUAL (INCORRETO — bloqueia aulas que NÃO têm data):
const isLocked = syll.scheduled_at ? new Date(syll.scheduled_at) > new Date() : true;
```

Quando `scheduled_at` é `null`, a aula deveria estar **DESBLOQUEADA** (disponível imediatamente). A lógica atual marca como `true` (bloqueada) quando `scheduled_at` é null, o que impede o aluno de ver QUALQUER aula que não tenha data agendada.

**Corrigir para:**
```tsx
const isLocked = syll.scheduled_at ? new Date(syll.scheduled_at) > new Date() : false;
```

### A2. Dados fictícios no PDF Export (handleExportPDF)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linhas:** 414-437  
**Problema:** A função `handleExportPDF` contém dois blocos de dados fictícios como fallback:

1. **Linha 414-421:** Enrollment fallback com `courseId: 'eng-legal-angola'` e `progressPercent: 66`
2. **Linha 424-437:** Certificado fictício para utilizador com email contendo "antonio"

**Localizar:**
```tsx
let pdfEnrollments = enrollments && enrollments.length > 0 ? enrollments : [
  {
    courseId: 'eng-legal-angola',
    progressPercent: 66,
    status: 'ACTIVE',
    enrolledAt: '2026-06-01'
  }
];
let pdfCertificates = certificates && certificates.length > 0 ? certificates : [];

if (pdfCertificates.length === 0 && currentUser.email.includes('antonio')) {
  pdfCertificates = [
    {
      certificateNumber: 'MPA-2026-001',
      courseName: 'English for the Legal Field in Angola',
      recipientName: 'Dr. Antonio Ferreira Carvalho',
      completionDate: '2026-06-01',
      instructorName: 'Esmeralda Bruno Sumbelelo',
      finalGrade: '92/100',
      isValid: true,
      verificationCode: 'MPA-2026-001'
    }
  ];
}
```

**Substituir por:**
```tsx
let pdfEnrollments = enrollments && enrollments.length > 0 ? enrollments : [];
let pdfCertificates = certificates && certificates.length > 0 ? certificates : [];
```

**Também corrigir a linha 453** que tem fallback `progressPercent: 66`:
```tsx
// ATUAL:
const progress = enroll.progress_percent || enroll.progressPercent || 66;
// CORRIGIR PARA:
const progress = enroll.progress_percent || enroll.progressPercent || 0;
```

### A3. Fallbacks fictícios no StudentProgressTab

**Arquivo:** `src/components/portal/StudentProgressTab.tsx`  
**Linhas:** 44-45, 48-49  
**Problema:** Valores hardcoded como fallback:

```tsx
// ATUAL:
const streak = currentUser?.streak || 5;
const hours = currentUser?.totalHoursLearned || 24;
const totalLessons = metrics?.total_lessons ?? 3;
const progressPct = metrics?.progress_percent ?? Math.min(100, Math.round((completedCount / (totalLessons || 3)) * 100));
```

**Substituir por:**
```tsx
const streak = currentUser?.streak || 0;
const hours = currentUser?.totalHoursLearned || 0;
const totalLessons = metrics?.total_lessons ?? 0;
const progressPct = metrics?.progress_percent ?? (totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0);
```

### A4. Telefone fictício no formulário de perfil

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 245  
**Problema:** Telefone hardcoded como fallback:

```tsx
// ATUAL:
phone: currentUser.phone || '+244 923 000 000',
// CORRIGIR PARA:
phone: currentUser.phone || '',
```

### A5. Streak fictício no formulário de perfil

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 251  
**Problema:**

```tsx
// ATUAL:
setStreakCount(currentUser.streak || 5);
// CORRIGIR PARA:
setStreakCount(currentUser.streak || 0);
```

### A6. Remover Google Calendar Sync falso (se ainda existir)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Problema:** Verificar se ainda existe a função `handleSyncGoogleCalendar` que apenas faz `setIsGoogleSynced(true)`. Se existir, remover completamente o botão e a função, mantendo apenas o botão "Exportar .ICS" que funciona de verdade.

### A7. Notificações vazias (nunca carregadas do Supabase)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 149  
**Problema:** O estado `notifications` é inicializado como `any[]` vazio e nunca é preenchido com dados reais. O dropdown de notificações mostra sempre vazio.

**Corrigir:** Adicionar busca de notificações reais da tabela `notifications` no `fetchStudentData`:

```tsx
// Dentro do fetchStudentData, após buscar scheduledLessons:
const { data: notifs } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', currentUser.id)
  .order('created_at', { ascending: false })
  .limit(20);
setNotifications(notifs || []);
```

E implementar "Marcar tudo lido":
```tsx
onClick={async () => {
  if (!currentUser?.id) return;
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', currentUser.id)
    .eq('read', false);
  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
}}
```

**Também** adicionar subscrição em tempo real para notificações (semelhante ao que já existe para mensagens).

### A8. Imagens Unsplash como fallback de avatar em múltiplos componentes

**Localizações (NÃO no StudentPortal, mas relacionadas ao dashboard do aluno):**
- `src/components/auth/AuthProvider.tsx` linha 91: avatar Unsplash fallback
- `src/services/supabase/enrollmentService.ts` linhas 144, 231: avatar Unsplash fallback
- `src/services/supabase/courseService.ts` linha 97: thumbnail Unsplash fallback

**Corrigir TODOS:** Substituir URLs Unsplash por `null` ou string vazia. Quando o avatar for null, a interface já mostra as iniciais do utilizador (fallback elegante já implementado no AvatarUpload e no sidebar).

**Em AuthProvider.tsx (linha 91):**
```tsx
// ANTES:
avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
// DEPOIS:
avatarUrl: null,
```

**Em enrollmentService.ts (linhas 144, 231):**
```tsx
// ANTES:
avatarUrl: student.foto_perfil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?...',
// DEPOIS:
avatarUrl: student.foto_perfil || null,
```

**Em courseService.ts (linha 97):**
```tsx
// ANTES:
thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?...',
// DEPOIS:
thumbnail: course.thumbnail || null,
```

---

## SECÇÃO B — Refatoração de Performance: Extrair Sub-componentes e Hooks

O `StudentPortal.tsx` tem **1925 linhas** com toda a lógica inline. Isto causa:
- Re-renderizações desnecessárias (qualquer mudança de estado refaz TUDO)
- Dificuldade de manutenção
- Código duplicado

### B1. Criar Hook Customizado: `useStudentData.ts`

**Criar arquivo:** `src/hooks/useStudentData.ts`

Extrair toda a lógica de busca de dados do Supabase para um hook customizado:

```tsx
import { useState, useEffect } from 'react';
import { academicService } from '../services/supabase/academicService';
import { supabase } from '../lib/supabase/client';
import { messageService } from '../services/supabase/messageService';

export function useStudentData(userId: string | undefined) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const enrollData = await academicService.getStudentEnrollments(userId);
      setEnrollments(enrollData || []);

      if (enrollData && enrollData.length > 0) {
        const activeCourseId = selectedCourseId || enrollData[0].course_id;
        setSelectedCourseId(activeCourseId);
        const lessonsData = await academicService.getLessons(activeCourseId);
        setRealLessons(lessonsData || []);
        const completions = await academicService.getCompletedLessons(userId, activeCourseId);
        setCompletedLessons(completions || []);
      } else {
        setRealLessons([]);
        setCompletedLessons([]);
      }

      const certs = await academicService.getStudentCertificates(userId);
      setCertificates(certs || []);

      const schedules = await academicService.getScheduledLessonsForStudent(userId);
      setScheduledLessons(schedules || []);

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn('Erro ao carregar dados do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId) return;
    try {
      const parts = await messageService.getConversationPartners(userId);
      setUnreadMessagesCount(parts.reduce((acc, p) => acc + (p.unreadCount || 0), 0));
    } catch {}
  };

  const changeCourse = async (courseId: string) => {
    if (!userId) return;
    setSelectedCourseId(courseId);
    try {
      setLoading(true);
      const lessonsData = await academicService.getLessons(courseId);
      setRealLessons(lessonsData || []);
      const completions = await academicService.getCompletedLessons(userId, courseId);
      setCompletedLessons(completions || []);
    } catch (err) {
      console.error('Erro ao trocar de curso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);
  useEffect(() => { fetchUnreadCount(); }, [userId]);

  // Real-time subscription para mensagens
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Real-time subscription para notificações
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return {
    enrollments, certificates, realLessons, completedLessons,
    scheduledLessons, notifications, unreadMessagesCount,
    loading, selectedCourseId, changeCourse,
    refetch: fetchData
  };
}
```

### B2. Criar Hook Customizado: `useVideoPlayer.ts`

**Criar arquivo:** `src/hooks/useVideoPlayer.ts`

Extrair toda a lógica do player de vídeo:

```tsx
import { useState, useEffect, useRef } from 'react';
import { academicService } from '../services/supabase/academicService';

export function useVideoPlayer(userId: string | undefined, courseId: string | undefined, lessonId: string | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [randomWatermark, setRandomWatermark] = useState({ top: '30%', left: '40%' });

  // Carregar progresso salvo quando muda de aula
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !lessonId) return;
      try {
        const saved = await academicService.getVideoProgress(userId, lessonId);
        setCurrentSeconds(saved || 0);
        if (videoRef.current) {
          videoRef.current.currentTime = saved || 0;
        }
      } catch (err) {
        console.error('Erro ao carregar progresso do vídeo:', err);
      }
    };
    loadProgress();
  }, [userId, lessonId]);

  // Salvar progresso a cada 15 segundos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && userId && courseId && lessonId) {
      interval = setInterval(async () => {
        try {
          await academicService.saveVideoProgress(userId, courseId, lessonId, currentSeconds);
        } catch (err) {
          console.error('Erro ao salvar progresso do vídeo:', err);
        }
      }, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, currentSeconds, userId, courseId, lessonId]);

  // Mover marca d'água a cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const topPct = Math.floor(Math.random() * 55) + 15;
      const leftPct = Math.floor(Math.random() * 55) + 15;
      setRandomWatermark({ top: `${topPct}%`, left: `${leftPct}%` });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return {
    videoRef, isPlaying, setIsPlaying, playbackSpeed, changeSpeed,
    currentSeconds, setCurrentSeconds, randomWatermark
  };
}
```

### B3. Criar Hook Customizado: `useLessonNotes.ts`

**Criar arquivo:** `src/hooks/useLessonNotes.ts`

```tsx
import { useState, useEffect } from 'react';
import { academicService } from '../services/supabase/academicService';

interface NoteItem {
  id: string;
  timestamp: number;
  text: string;
  date: string;
}

export function useLessonNotes(userId: string | undefined, courseId: string | undefined, lessonId: string | undefined) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const loadNotes = async () => {
      if (!userId || !lessonId) return;
      try {
        const savedNotes = await academicService.getLessonNotes(userId, lessonId);
        setNotes(savedNotes.map((n: any) => ({
          id: n.id,
          timestamp: n.video_timestamp,
          text: n.content,
          date: new Date(n.created_at).toISOString().replace('T', ' ').slice(0, 16)
        })));
      } catch (err) {
        console.error('Erro ao carregar apontamentos:', err);
      }
    };
    loadNotes();
  }, [userId, lessonId]);

  const saveNote = async (videoTimestamp: number) => {
    if (!newNote.trim() || !userId || !lessonId || !courseId) return;
    try {
      const saved = await academicService.saveLessonNote(userId, lessonId, courseId, newNote.trim(), videoTimestamp);
      setNotes(prev => [{
        id: saved.id,
        timestamp: saved.video_timestamp,
        text: saved.content,
        date: new Date(saved.created_at).toISOString().replace('T', ' ').slice(0, 16)
      }, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error('Erro ao salvar apontamento:', err);
    }
  };

  return { notes, newNote, setNewNote, saveNote };
}
```

### B4. Extrair Componente: `StudentSidebar.tsx`

**Criar arquivo:** `src/components/portal/StudentSidebar.tsx`

Extrair o sidebar inteiro (linhas 764-868 do StudentPortal.tsx) para um componente separado que recebe props:

```tsx
interface StudentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMessagesClick: () => void;
  currentUser: User | null;
  onSignOut: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}
```

### B5. Extrair Componente: `StudentTopbar.tsx`

**Criar arquivo:** `src/components/portal/StudentTopbar.tsx`

Extrair o header/topbar (linhas 877-1040 do StudentPortal.tsx) incluindo busca, streak, notificações, dropdown de perfil.

### B6. Extrair Componente: `StudentDashboardView.tsx`

**Criar arquivo:** `src/components/portal/StudentDashboardView.tsx`

Extrair a aba "dashboard" com os cards de boas-vindas, próxima aula agendada, estatísticas.

### B7. Estrutura Final do StudentPortal Refatorado

Após a refatoração, o `StudentPortal.tsx` ficaria assim (estrutura simplificada):

```tsx
import { useStudentData } from '../hooks/useStudentData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useLessonNotes } from '../hooks/useLessonNotes';
import StudentSidebar from './portal/StudentSidebar';
import StudentTopbar from './portal/portal/StudentTopbar';
import StudentDashboardView from './portal/StudentDashboardView';
// ... demais imports

export default function StudentPortal(props) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { enrollments, certificates, realLessons, ... } = useStudentData(currentUser?.id);
  const { videoRef, isPlaying, ... } = useVideoPlayer(currentUser?.id, selectedCourseId, currentLecture?.id);
  const { notes, newNote, saveNote } = useLessonNotes(currentUser?.id, selectedCourseId, currentLecture?.id);

  return (
    <div className="min-h-screen flex">
      <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} ... />
      <div className="flex-grow flex flex-col">
        <StudentTopbar ... />
        <main>
          {activeTab === 'dashboard' && <StudentDashboardView ... />}
          {activeTab === 'courses' && <StudentCoursesView ... />}
          {activeTab === 'calendar' && <StudentCalendarView ... />}
          {activeTab === 'materials' && <StudentMaterialsTab ... />}
          {activeTab === 'tasks' && <StudentTasksTab ... />}
          {activeTab === 'certificates' && <StudentCertificatesTab ... />}
          {activeTab === 'progress' && <StudentProgressTab ... />}
          {activeTab === 'profile' && <StudentProfileView ... />}
          {activeTab === 'settings' && <StudentSettingsView ... />}
        </main>
      </div>
    </div>
  );
}
```

---

## ORDEM DE EXECUÇÃO

1. **Correções A1-A8** (bugs e dados fictícios) — PRIORIDADE MÁXIMA
2. **Criar hooks B1-B3** (`useStudentData.ts`, `useVideoPlayer.ts`, `useLessonNotes.ts`)
3. **Criar sub-componentes B4-B6** (`StudentSidebar.tsx`, `StudentTopbar.tsx`, `StudentDashboardView.tsx`)
4. **Refatorar StudentPortal.tsx** para usar os novos hooks e componentes
5. **Executar `npm run build`** e confirmar compilação sem erros

---

## Checklist de Verificação Final

| # | Verificação | Critério |
|---|------------|---------|
| 1 | Aulas sem `scheduled_at` aparecem desbloqueadas | `isLocked` retorna `false` quando `scheduled_at` é null |
| 2 | Nenhum dado fictício no PDF export | Procurar `eng-legal-angola`, `antonio`, `progressPercent: 66` |
| 3 | Nenhum fallback fictício em StudentProgressTab | `streak || 0`, `hours || 0`, `totalLessons ?? 0` |
| 4 | Nenhuma URL Unsplash em services e auth | Procurar `images.unsplash.com` em `src/services/` e `src/components/auth/` |
| 5 | Notificações carregadas do Supabase | Dropdown mostra notificações reais |
| 6 | Hooks customizados criados | `useStudentData.ts`, `useVideoPlayer.ts`, `useLessonNotes.ts` existem |
| 7 | Sub-componentes criados | `StudentSidebar.tsx`, `StudentTopbar.tsx`, `StudentDashboardView.tsx` existem |
| 8 | StudentPortal refatorado | Arquivo principal tem < 300 linhas |
| 9 | Build passa | `npm run build` sem erros |

---

*Documento gerado por Super Z — Orientador de Desenvolvimento MultiPlus Academy*  
*Versão: 018 | Data: 16/07/2026 | Idioma: Português (com acentuação)*
