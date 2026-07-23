# 📘 Documento de Orientação 015 — Relações Aluno-Professor e Refatoração dos Dashboards

**Projeto:** MultiPlus Academy LMS  
**Destinatário:** Google Gemini (Google AI Studio)  
**Autor:** Super Z (Orientador de Desenvolvimento)  
**Data:** 16 de Julho de 2026  
**Prioridade:** 🔴 CRÍTICA — Refatoração estrutural completa  

---

## Sumário Executivo

Este documento define a arquitetura de interação entre o Dashboard do Professor e o Dashboard do Aluno, estabelece o fluxo completo de criação de cursos → aulas → agendamento → consumo pelo aluno, e identifica todos os dados fictícios e funcionalidades simuladas que devem ser substituídas por integração real com o Supabase. O dashboard do aluno necessita de uma refatoração completa, e o sistema de biblioteca/manuais deve ser correlacionado com o professor. Adicionalmente, todo utilizador deve possuir foto de perfil persistida no banco de dados.

---

## Índice

1. [Visão Geral da Arquitetura de Relacionamento](#1-visão-geral-da-arquitetura-de-relacionamento)
2. [Fluxo Completo: Professor Cria Curso → Aluno Consome Aula](#2-fluxo-completo-professor-cria-curso--aluno-consome-aula)
3. [Refatoração do Dashboard do Aluno](#3-refatoração-do-dashboard-do-aluno)
4. [Sistema de Videoaulas no Dashboard do Aluno](#4-sistema-de-videoaulas-no-dashboard-do-aluno)
5. [Sistema de Biblioteca/Manuais Correlacionado ao Professor](#5-sistema-de-bibliotecamanuais-correlacionado-ao-professor)
6. [Sistema de Fotos de Perfil para Todos os Utilizadores](#6-sistema-de-fotos-de-perfil-para-todos-os-utilizadores)
7. [Dados Fictícios a Remover — Lista Completa](#7-dados-fictícios-a-remover--lista-completa)
8. [Alterações Necessárias no Banco de Dados (Supabase)](#8-alterações-necessárias-no-banco-de-dados-supabase)
9. [Alterações Necessárias nos Services (academicService, lessonService, etc.)](#9-alterações-necessárias-nos-services-academicservice-lessionservice-etc)
10. [Critérios de Aceitação](#10-critérios-de-aceitação)

---

## 1. Visão Geral da Arquitetura de Relacionamento

### 1.1 Entidades Principais e Suas Relações

A plataforma MultiPlus Academy possui três papéis de utilizador (ADMIN, PROFESSOR, ALUNO) que interagem através das seguintes entidades centrais:

```
PROFESSOR ──cria──▶ CURSO ──contém──▶ AULAS (lessons)
    │                    │                  │
    │                    │                  ├── video_url (Cloudinary)
    │                    │                  ├── descricao (transcrição textual)
    │                    │                  ├── quiz (JSONB - perguntas e respostas)
    │                    │                  ├── scheduled_at (data/hora de disponibilização)
    │                    │                  ├── status (DRAFT / PUBLISHED)
    │                    │                  └── materiais (arquivos anexos)
    │                    │
    │                    └──◀──matrícula── ALUNO (enrollments)
    │                                          │
    │                                          ├── lesson_progress (aulas concluídas)
    │                                          ├── quiz_submissions (respostas ao quiz)
    │                                          ├── lesson_notes (apontamentos do aluno)
    │                                          └── certificates (certificados emitidos)
    │
    └──envia──▶ MANUAIS/MATERIAIS ──▶ materials (tabela Supabase)
                     │
                     └──disponibiliza──▶ ALUNO faz download na Biblioteca
```

### 1.2 Princípios Fundamentais

1. **Nenhum dado fictício**: Se não existe no banco de dados, não se mostra. Se a biblioteca está vazia, mostra-se um estado vazio elegante — nunca se inventam manuais falsos.
2. **A aula só é reproduzida no dia agendado**: O campo `scheduled_at` na tabela `lessons` define quando a aula fica disponível. Se a data atual é anterior ao `scheduled_at`, a aula aparece como bloqueada (🔒) para o aluno.
3. **O professor é a fonte de conteúdo**: Todo conteúdo (cursos, aulas, manuais, quizzes) é criado pelo professor. O aluno consome e interage; não cria conteúdo.
4. **Progresso é rastreado em tempo real**: Cada ação do aluno (assistir vídeo, responder quiz, marcar aula como concluída) é persistida imediatamente no Supabase e fica visível para o professor e o administrador.
5. **Foto de perfil é obrigatória e persistida**: Cada utilizador (ADMIN, PROFESSOR, ALUNO) deve ter uma foto de perfil armazenada no Supabase Storage e referenciada na tabela `users.foto_perfil`.

---

## 2. Fluxo Completo: Professor Cria Curso → Aluno Consome Aula

### 2.1 Passo a Passo do Fluxo Completo

```
PASSO 1: Professor abre "Criar Curso" (CourseEditorModal)
   → Preenche: título, descrição, preço (Kz), categoria, nível, duração
   → Seleciona status: DRAFT ou PUBLISHED
   → Clica "Salvar Curso"
   → Registro inserido na tabela "courses" com teacher_id = professor.id

PASSO 2: Professor adiciona aulas ao curso (aba "Aulas" do CourseEditorModal)
   → Para cada aula, preenche:
     - título (lessonTitle → lessons.titulo)
     - descrição/transcrição (lessonDesc → lessons.descricao)
     - URL do vídeo (lessonVideo → lessons.video_url, preferencialmente Cloudinary)
     - duração (lessonDuration → lessons.duracao)
     - data de agendamento (lessonScheduled → lessons.scheduled_at)
     - status (DRAFT ou PUBLISHED → lessons.status)
   → Opcionalmente, adiciona quiz:
     - Array de objetos {question, options[], correctAnswer} → lessons.quiz (JSONB)
   → Registros inseridos na tabela "lessons" com course_id = curso.id
   → Se targetType = 'ALL', insere em lesson_targets para todos os alunos matriculados
   → Se targetType = 'SPECIFIC', insere em lesson_targets apenas para os alunos selecionados

PASSO 3: Professor matricula alunos no curso (aba "Alunos" do CourseEditorModal)
   → Utiliza StudentSelector para escolher alunos
   → Registros inseridos na tabela "enrollments" com student_id + course_id

PASSO 4: Aluno acessa "Videoaulas" no seu dashboard
   → Sistema carrega enrollments do aluno (enrollments onde student_id = aluno.id e status = 'ACTIVE')
   → Para cada enrollment, carrega as aulas do curso (lessons onde course_id = curso.id)
   → Para cada aula, verifica:
     - Se scheduled_at > NOW() → aula BLOQUEADA (🔒), não pode ser reproduzida
     - Se scheduled_at <= NOW() ou scheduled_at IS NULL → aula DISPONÍVEL para reprodução
   → Aluno seleciona uma aula disponível e:
     a) Reproduz o vídeo (video_url renderizada num player real)
     b) Lê a transcrição da aula (lessons.descricao)
     c) Responde ao quiz, se existir (QuizArea component)
     d) Escreve apontamentos/notas sobre a aula (opcional)
     e) Marca aula como concluída (lesson_progress.upsert)

PASSO 5: Progresso é sincronizado com o banco de dados
   → lesson_progress: {student_id, lesson_id, course_id, completed: true}
   → quiz_submissions: {student_id, lesson_id, answers, score, submitted_at}
   → enrollments: progress_percent recalculado (via vw_student_progress)

PASSO 6: Professor e Administrador visualizam o progresso
   → Professor vê: quais alunos completaram quais aulas, pontuação dos quizzes, tempo de visualização
   → Administrador vê: visão consolidada de todos os cursos e alunos
```

### 2.2 Regras de Negócio para Agendamento de Aulas

| Regra | Descrição | Implementação |
|-------|-----------|---------------|
| **R1** | A aula só pode ser reproduzida pelo aluno no dia em que foi agendada | Comparar `new Date(lesson.scheduled_at)` com `new Date()`. Se `scheduled_at > now`, exibir overlay de bloqueio com a data de disponibilização |
| **R2** | Se `scheduled_at` for NULL, a aula está sempre disponível | Manter comportamento atual para aulas sem data de agendamento |
| **R3** | O aluno deve estar matriculado no curso para ver as aulas | Verificar enrollment ativo antes de carregar aulas |
| **R4** | A aula deve ter status PUBLISHED para ser visível ao aluno | Filtrar `lessons.status = 'PUBLISHED'` nas queries do aluno |
| **R5** | O aluno só pode marcar aula como concluída se a aula estiver desbloqueada | Verificar `scheduled_at <= now` antes de permitir `markLessonComplete` |
| **R6** | O quiz é opcional — se `lessons.quiz` for NULL ou vazio, não exibir quiz | O componente `QuizArea` já trata isso corretamente |
| **R7** | O progresso do aluno no vídeo deve ser rastreado | **NOVO**: Adicionar campo `video_progress_seconds` à tabela `lesson_progress` para guardar até onde o aluno assistiu |

---

## 3. Refatoração do Dashboard do Aluno

### 3.1 Problemas Atuais Identificados

O `StudentPortal.tsx` (1781 linhas) necessita de uma refatoração completa pelos seguintes motivos:

1. **Dados fictícios na biblioteca**: `StudentMaterialsTab.tsx` tem 7 manuais hardcoded (linhas 31-94) — nenhum é real, nenhum pode ser descarregado
2. **Tarefas fictícias**: `StudentTasksTab.tsx` tem 4 tarefas hardcoded (linhas 38-76) com datas e feedbacks falsos
3. **Certificados fictícios**: `StudentCertificatesTab.tsx` tem 2 certificados hardcoded (linhas 33-52)
4. **Fallbacks falsos no calendário**: Quando não há aulas agendadas, são exibidos 3 cards de sessões fictícias (linhas 1482-1535 do StudentPortal.tsx) com links falsos do Google Meet
5. **Marca d'água falsa**: Email hardcoded `'antonio@advogados.ao'` na linha 1205 do StudentPortal.tsx
6. **Transcrição hardcoded**: A transcrição da aula é um texto fixo sobre "Diferenças fundamentais entre o modelo codificado..." (linha 1275) em vez de vir de `lessons.descricao`
7. **Sincronização falsa com Google Calendar**: A função `handleSyncGoogleCalendar` (linhas 605-608) apenas faz `setIsGoogleSynced(true)` — não sincroniza nada de verdade
8. **Progresso falso**: Fallback `progressPercent: 66` no InstructorStudentsTab (linha 99) e `streakCount = currentUser.streak || 5` (linha 250)

### 3.2 Itens de Refatoração

#### Item 3.1 — Remover dados fictícios da biblioteca (StudentMaterialsTab.tsx)

**Arquivo:** `src/components/portal/StudentMaterialsTab.tsx`  
**Problema:** O array `materials` (linhas 31-94) contém 7 manuais fictícios com `sourceUrl: '#download-...'` que não apontam para nenhum arquivo real. A função `handleDownload` (linhas 96-103) simula um download com `setTimeout` e mostra uma mensagem de sucesso falsa.

**Correção:**
1. Remover completamente o array `materials` hardcoded
2. Adicionar estado de carregamento e integração com o Supabase
3. Buscar materiais da tabela `materials` onde `lesson_id` pertence a uma aula de um curso em que o aluno está matriculado
4. Implementar download real usando o `arquivo_url` do Supabase Storage
5. Se não houver materiais, mostrar estado vazio elegante

**Antes (linhas 31-94):**
```tsx
const materials: AcademicMaterial[] = [
  {
    id: 'mat_1',
    title: 'Glossary of International Legal English terms',
    description: 'Dicionário científico bilíngue...',
    category: 'PDF',
    fileSize: '3.4 MB',
    downloadCount: 142,
    sourceUrl: '#download-glossary'
  },
  // ... mais 6 itens fictícios
];
```

**Depois:**
```tsx
const [materials, setMaterials] = useState<AcademicMaterial[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchMaterials = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // 1. Buscar enrollments do aluno
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', userId)
        .eq('status', 'ACTIVE');

      if (!enrollments || enrollments.length === 0) {
        setMaterials([]);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // 2. Buscar aulas desses cursos
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('course_id', courseIds);

      if (!lessons || lessons.length === 0) {
        setMaterials([]);
        return;
      }

      const lessonIds = lessons.map(l => l.id);

      // 3. Buscar materiais associados a essas aulas
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .in('lesson_id', lessonIds);

      setMaterials(materialsData || []);
    } catch (err) {
      console.error('Erro ao carregar materiais:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };
  fetchMaterials();
}, [userId]);
```

**Para o download real:**
```tsx
const handleDownload = async (material: AcademicMaterial) => {
  if (!material.arquivo_url) return;
  setDownloadingId(material.id);
  try {
    // Se for URL do Supabase Storage, gerar URL assinada
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(material.arquivo_url, 3600); // 1 hora
    
    if (error) throw error;
    
    // Abrir URL de download em nova aba
    window.open(data.signedUrl, '_blank');
  } catch (err) {
    console.error('Erro ao descarregar material:', err);
    // Fallback: tentar URL direta
    window.open(material.arquivo_url, '_blank');
  } finally {
    setDownloadingId(null);
  }
};
```

---

#### Item 3.2 — Remover tarefas fictícias (StudentTasksTab.tsx)

**Arquivo:** `src/components/portal/StudentTasksTab.tsx`  
**Problema:** O array `tasks` (linhas 38-76) contém 4 tarefas hardcoded com datas, feedbacks e status falsos.

**Correção:**
1. Remover o array `tasks` hardcoded
2. Buscar tarefas/assignments do Supabase — se não existir tabela de tarefas, criar uma (ver Secção 8)
3. Se não houver tarefas, mostrar estado vazio: "Nenhuma tarefa atribuída neste momento."

**Nota:** A tabela `materials` já pode servir como base para "tarefas" se o professor atribuir materiais como "obrigatórios". Alternativamente, criar tabela `assignments` com `due_date` e `submission_url`.

---

#### Item 3.3 — Remover certificados fictícios (StudentCertificatesTab.tsx)

**Arquivo:** `src/components/portal/StudentCertificatesTab.tsx`  
**Problema:** O array `certificates` (linhas 33-52) contém 2 certificados hardcoded.

**Correção:**
1. Remover o array `certificates` hardcoded
2. Buscar certificados reais da tabela `certificates` onde `student_id = userId`
3. Implementar download real do PDF usando `certificate_pdf_url`
4. Se não houver certificados, mostrar estado vazio

**Código de referência:**
```tsx
const [certificates, setCertificates] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchCertificates = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, course:courses(title)')
        .eq('student_id', userId);
      
      if (error) throw error;
      setCertificates(data || []);
    } catch (err) {
      console.error('Erro ao carregar certificados:', err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };
  fetchCertificates();
}, [userId]);
```

---

#### Item 3.4 — Remover sessões fictícias do calendário (StudentPortal.tsx, linhas 1482-1535)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Problema:** Quando `scheduledLessons.length === 0`, são exibidos 3 cards de sessões fictícias com links falsos do Google Meet (`https://meet.google.com/lookup/mock-multiplus`). Isso engana o utilizador.

**Correção:**
1. Remover completamente o bloco de fallback (linhas 1482-1535)
2. Quando não há aulas agendadas, mostrar um estado vazio elegante:

```tsx
{scheduledLessons.length > 0 ? (
  scheduledLessons.map((session, index) => (
    // ... cards reais das aulas agendadas
  ))
) : (
  <div className="col-span-3 py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
    <Calendar size={32} className="text-neutral-400 mx-auto mb-3" />
    <h4 className="text-sm font-serif font-bold text-neutral-400">Nenhuma aula agendada</h4>
    <p className="text-xs text-neutral-400 mt-1">
      As suas aulas síncronas aparecerão aqui assim que o professor as agendar.
    </p>
  </div>
)}
```

---

#### Item 3.5 — Corrigir marca d'água falsa (StudentPortal.tsx, linha 1205)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 1205  
**Problema:** Email hardcoded `'antonio@advogados.ao'` na marca d'água do vídeo.

**Antes:**
```tsx
🛡 {currentUser?.email || 'antonio@advogados.ao'} • MULTIPLUS
```

**Depois:**
```tsx
🛡 {currentUser?.email || currentUser?.firstName || 'Utilizador'} • MULTIPLUS
```

---

#### Item 3.6 — Corrigir transcrição hardcoded (StudentPortal.tsx, linha 1275)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 1275  
**Problema:** A transcrição da aula é um texto fixo em vez de vir do campo `lessons.descricao`.

**Antes (linha 1275):**
```tsx
"Diferenças fundamentais entre o modelo codificado Civil Law vigente em toda a República de Angola e o sistema do Common Law anglo-saxónico com enfoque em precedentes e regimentos para contratos de extração petrolífera de joint ventures."
```

**Depois:**
```tsx
{currentLecture.descricao || currentLecture.description || 'Transcrição não disponível para esta aula.'}
```

---

#### Item 3.7 — Remover sincronização falsa com Google Calendar (StudentPortal.tsx, linhas 605-608)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Problema:** A função `handleSyncGoogleCalendar` apenas faz `setIsGoogleSynced(true)` sem integração real.

**Correção (duas opções):**

**Opção A — Remover completamente:**
Remover o botão "Sincronizar Google Calendar" e a função `handleSyncGoogleCalendar`. Manter apenas o botão "Exportar .ICS" que gera um arquivo de calendário real.

**Opção B — Implementar integração real (fase futura):**
Adicionar integração com Google Calendar API via OAuth. Isto é complexo e deve ser deixado para uma fase posterior. Por agora, usar a Opção A.

---

#### Item 3.8 — Remover link falso do Google Meet (StudentPortal.tsx, linha 1454)

**Arquivo:** `src/components/StudentPortal.tsx`  
**Linha:** 1454  
**Problema:** URL hardcoded `'https://meet.google.com/lookup/mock-multiplus'` que não aponta para nenhuma reunião real.

**Correção:**
1. Adicionar campo `meeting_url` à tabela `lessons` (ver Secção 8)
2. Buscar o link real da aula: `session.lesson?.meeting_url`
3. Se não houver link, não mostrar o botão "Entrar na Aula Meet"

**Depois:**
```tsx
{session.lesson?.meeting_url ? (
  <a 
    href={session.lesson.meeting_url}
    target="_blank"
    className="py-2.5 bg-ink-900 text-cream-100 text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-ink-900 transition-colors"
  >
    Entrar na Aula
  </a>
) : (
  <span className="py-2.5 bg-gray-100 dark:bg-slate-800 text-neutral-400 text-center rounded-lg text-3xs font-mono font-bold uppercase block">
    Link da aula indisponível
  </span>
)}
```

---

## 4. Sistema de Videoaulas no Dashboard do Aluno

### 4.1 Arquitetura do Player de Vídeo

O sistema de videoaulas deve funcionar de forma semelhante a plataformas como Coursera e FreeCodeCamp, com a seguinte estrutura:

```
┌──────────────────────────────────────────────────────────────┐
│  CURSO: [Seletor de curso]          ▼                        │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│   PLAYER DE VÍDEO              │   LISTA DE AULAS            │
│   (área principal)             │   (sidebar lateral)         │
│                                │                             │
│   ┌──────────────────────┐     │   □ Aula 1 - Introdução    │
│   │                      │     │     ✓ Concluída             │
│   │   [VÍDEO REAL]       │     │                             │
│   │   Cloudinary URL     │     │   ▶ Aula 2 - Contratos     │
│   │   reproduzindo       │     │     ← Aula atual           │
│   │                      │     │                             │
│   └──────────────────────┘     │   🔒 Aula 3 - Arbitragem   │
│                                │     Agendada: 20/07/2026    │
│   ─── Controles do Player ───  │                             │
│   [▶/⏸] [1x 1.25x 1.5x 2x]   │   🔒 Aula 4 - Quiz Final   │
│   03:45 / 45:00                │     Agendada: 25/07/2026    │
│                                │                             │
├────────────────────────────────┴─────────────────────────────┤
│                                                              │
│   📄 TRANSCRIÇÃO DA AULA                                     │
│   Texto completo da transcrição carregado de lessons.descricao│
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   🏆 QUIZ DE AVALIAÇÃO (se existir)                         │
│   [QuizArea component — já funcional]                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   📝 APONTAMENTOS DO ALUNO                                   │
│   Caderno de notas vinculado ao timestamp do vídeo            │
│   [Salvar nota → lesson_notes no Supabase]                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ✅ MARCAR AULA COMO CONCLUÍDA                              │
│   [lesson_progress.upsert({completed: true})]                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Implementação do Player de Vídeo Real

O player atual é um placeholder visual que não reproduz vídeo nenhum. Deve ser substituído por um player real.

**Componente sugerido: `VideoPlayer.tsx`**

```tsx
interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  userId: string;
  courseId: string;
  onProgress: (secondsWatched: number) => void;
  onComplete: () => void;
}

export default function VideoPlayer({ videoUrl, lessonId, userId, courseId, onProgress, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // Salvar progresso do vídeo a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        const currentSec = Math.floor(videoRef.current.currentTime);
        if (currentSec - lastSavedProgress >= 15) {
          saveVideoProgress(userId, lessonId, courseId, currentSec);
          setLastSavedProgress(currentSec);
          onProgress(currentSec);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, lastSavedProgress]);

  // Retomar de onde o aluno parou
  useEffect(() => {
    const loadSavedProgress = async () => {
      const { data } = await supabase
        .from('lesson_progress')
        .select('video_progress_seconds')
        .eq('student_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (data?.video_progress_seconds && videoRef.current) {
        videoRef.current.currentTime = data.video_progress_seconds;
      }
    };
    loadSavedProgress();
  }, [lessonId, userId]);

  return (
    <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={onComplete}
      />
      {/* Controles customizados: play/pause, velocidade, barra de progresso */}
    </div>
  );
}
```

### 4.3 Rastreamento de Progresso do Vídeo

**Novo campo na tabela `lesson_progress`:** `video_progress_seconds INTEGER DEFAULT 0`

```sql
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0;
```

**Atualização no academicService:**
```ts
async saveVideoProgress(studentId: string, courseId: string, lessonId: string, secondsWatched: number): Promise<void> {
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: studentId,
      lesson_id: lessonId,
      course_id: courseId,
      video_progress_seconds: secondsWatched,
    }, { onConflict: 'student_id,lesson_id' });

  if (error) {
    console.error('Erro ao salvar progresso do vídeo:', error);
  }
}
```

### 4.4 Lógica de Desbloqueio de Aulas por Data

A lógica já existe parcialmente no StudentPortal.tsx (linha 1209), mas precisa de refinamento:

```tsx
// Verificar se a aula está bloqueada por agendamento
const isLessonLocked = (lesson: any): boolean => {
  // Se não tem data de agendamento, não está bloqueada
  if (!lesson.scheduled_at) return false;
  // Se a data de agendamento é futura, está bloqueada
  return new Date(lesson.scheduled_at) > new Date();
};

// Verificar se o aluno está matriculado no curso da aula
const isEnrolled = (courseId: string): boolean => {
  return enrollments.some(e => e.course_id === courseId && e.status === 'ACTIVE');
};

// Verificar se a aula está publicada
const isPublished = (lesson: any): boolean => {
  return lesson.status === 'PUBLISHED';
};

// Aula só é visível e reproduzível se:
// 1. O aluno está matriculado no curso
// 2. A aula está publicada (status = 'PUBLISHED')
// 3. A data de agendamento já passou (ou não tem data)
const canAccessLesson = (lesson: any, courseId: string): boolean => {
  return isEnrolled(courseId) && isPublished(lesson) && !isLessonLocked(lesson);
};
```

### 4.5 Fluxo de Conclusão de Aula pelo Aluno

```
1. Aluno reproduz o vídeo → progresso salvo a cada 15 segundos
2. Aluno lê a transcrição → apenas visualização, sem ação necessária
3. Se existe quiz → aluno responde ao quiz:
   a. Se acertou → quiz_submissions.score = 100
   b. Se errou → quiz_submissions.score = 0, pode tentar novamente
4. Aluno escreve apontamentos (opcional) → salvos na tabela lesson_notes
5. Aluno marca aula como concluída:
   - lesson_progress.upsert({student_id, lesson_id, course_id, completed: true})
   - Progresso do curso recalculado via vw_student_progress
6. Se TODAS as aulas do curso estão concluídas → enrollment.status = 'COMPLETED'
7. Aluno aguarda a próxima aula agendada (se houver)
```

---

## 5. Sistema de Biblioteca/Manuais Correlacionado ao Professor

### 5.1 Problema Atual

O `StudentMaterialsTab.tsx` é um componente isolado com 7 manuais fictícios que não têm qualquer correlação com o professor. O aluno não pode descarregar nenhum arquivo real porque todos os `sourceUrl` são hashes falsos (`#download-glossary`, etc.).

### 5.2 Nova Arquitetura de Manuais/Materiais

O sistema de materiais deve funcionar assim:

```
PROFESSOR:
  1. Ao criar/editar uma aula no CourseEditorModal, pode anexar materiais:
     - Upload de arquivo (PDF, DOCX, PPT, etc.) para o Supabase Storage
     - O arquivo é registrado na tabela "materials" com:
       - lesson_id: aula à qual o material pertence
       - titulo: nome do material
       - arquivo_url: URL pública ou assinada do Supabase Storage
       - tipo: categoria do material (PDF, DOCX, PPT, Audio, Video, Link)
  2. O material fica automaticamente disponível para todos os alunos
     matriculados no curso que contém essa aula

ALUNO:
  1. Na aba "Biblioteca" (StudentMaterialsTab), o aluno vê TODOS os materiais
     de TODOS os cursos em que está matriculado
  2. O aluno pode filtrar por categoria, pesquisar por título
  3. O aluno pode descarregar cada material (download real do arquivo)
  4. Se não houver materiais, mostra estado vazio — NÃO inventar dados falsos
```

### 5.3 Upload de Materiais pelo Professor

**No `CourseEditorModal.tsx`, aba "Aulas":**

Adicionar seção de upload de materiais ao salvar/editar uma aula:

```tsx
// Estado para materiais da aula
const [lessonMaterials, setLessonMaterials] = useState<SupabaseMaterial[]>([]);
const [newMaterialTitle, setNewMaterialTitle] = useState('');
const [newMaterialType, setNewMaterialType] = useState('PDF');
const [uploadingMaterial, setUploadingMaterial] = useState(false);

// Carregar materiais existentes quando editar aula
const loadLessonMaterials = async (lessonId: string) => {
  const materials = await lessonService.getMaterials(lessonId);
  setLessonMaterials(materials);
};

// Upload de novo material
const handleUploadMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !editingLesson?.id) return;
  
  setUploadingMaterial(true);
  try {
    const filePath = `materials/${editingLesson.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    
    await lessonService.addMaterial({
      lesson_id: editingLesson.id,
      titulo: newMaterialTitle || file.name,
      arquivo_url: data.publicUrl,
      tipo: newMaterialType
    });
    
    // Recarregar materiais
    await loadLessonMaterials(editingLesson.id);
    setNewMaterialTitle('');
  } catch (err) {
    console.error('Erro ao carregar material:', err);
    alert('Erro ao carregar material: ' + (err as any).message);
  } finally {
    setUploadingMaterial(false);
  }
};
```

### 5.4 Interface do Professor para Gerir Materiais

Dentro do `CourseEditorModal`, ao editar uma aula, mostrar a lista de materiais anexados:

```tsx
{/* Seção de Materiais da Aula */}
<div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-ink-800">
  <h5 className="text-xs font-serif font-bold mb-3">Materiais Anexos</h5>
  
  {/* Lista de materiais existentes */}
  {lessonMaterials.map(mat => (
    <div key={mat.id} className="flex items-center justify-between py-2 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-gold-600" />
        <span className="text-xs">{mat.titulo}</span>
        <span className="text-2xs text-neutral-400">({mat.tipo})</span>
      </div>
      <button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 hover:text-red-700">
        <Trash2 size={14} />
      </button>
    </div>
  ))}
  
  {/* Upload de novo material */}
  <div className="mt-3 flex gap-2 items-end">
    <div className="flex-1">
      <input
        type="text"
        placeholder="Nome do material"
        value={newMaterialTitle}
        onChange={e => setNewMaterialTitle(e.target.value)}
        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-ink-800"
      />
    </div>
    <select
      value={newMaterialType}
      onChange={e => setNewMaterialType(e.target.value)}
      className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-ink-800"
    >
      <option value="PDF">PDF</option>
      <option value="DOCX">DOCX</option>
      <option value="PPT">PPT</option>
      <option value="Audio">Áudio</option>
      <option value="Video">Vídeo</option>
      <option value="Link">Link</option>
    </select>
    <label className="px-4 py-2 bg-gold-600 text-cream-100 rounded-xl text-xs font-bold cursor-pointer">
      {uploadingMaterial ? 'A carregar...' : 'Carregar Arquivo'}
      <input type="file" onChange={handleUploadMaterial} className="hidden" />
    </label>
  </div>
</div>
```

---

## 6. Sistema de Fotos de Perfil para Todos os Utilizadores

### 6.1 Requisitos

1. Cada utilizador (ADMIN, PROFESSOR, ALUNO) deve ter uma foto de perfil
2. A foto pode ser introduzida no momento em que o administrador cria o utilizador
3. A foto é guardada no Supabase Storage e referenciada em `users.foto_perfil`
4. Qualquer utilizador pode alterar sua própria foto de perfil
5. A foto deve aparecer em todos os locais onde o avatar do utilizador é exibido

### 6.2 Alterações no Banco de Dados

A tabela `users` já possui a coluna `foto_perfil TEXT` (definida na migration 001). Não é necessária alteração no schema.

### 6.3 Upload de Foto de Perfil

**Criar novo service:** `src/services/supabase/avatarService.ts`

```ts
import { supabase } from '../../lib/supabase/client';

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    
    // Atualizar foto_perfil na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ foto_perfil: publicUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return publicUrl;
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('foto_perfil')
      .eq('id', userId)
      .maybeSingle();
    
    return data?.foto_perfil || null;
  }
};
```

### 6.4 Componente Reutilizável: `AvatarUpload.tsx`

Criar um componente de upload de avatar que pode ser usado em qualquer dashboard:

```tsx
import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { avatarService } from '../../services/supabase/avatarService';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  onAvatarUpdated?: (newUrl: string) => void;
}

export default function AvatarUpload({ 
  userId, currentAvatarUrl, userName, size = 'md', onAvatarUpdated 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-24 h-24 text-2xl'
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    // Validar tipo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    
    setUploading(true);
    try {
      const url = await avatarService.uploadAvatar(userId, file);
      setAvatarUrl(url);
      onAvatarUpdated?.(url);
    } catch (err) {
      console.error('Erro ao carregar foto de perfil:', err);
      alert('Erro ao carregar foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  const initials = userName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={userName || 'Avatar'} 
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gold-600/30`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gold-600/20 text-gold-600 flex items-center justify-center font-serif font-bold border-2 border-gold-600/30`}>
          {initials}
        </div>
      )}
      
      {/* Overlay de edição ao passar o mouse */}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 size={16} className="text-cream-100 animate-spin" />
        ) : (
          <Camera size={16} className="text-cream-100" />
        )}
      </div>
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
```

### 6.5 Locais onde o Avatar Deve Ser Atualizado

| Componente | Localização | Ação |
|-----------|-------------|------|
| `StudentPortal.tsx` | Header do sidebar, perfil | Substituir avatar hardcoded pelo `AvatarUpload` |
| `InstructorPortal.tsx` | Header do sidebar, perfil | Substituir avatar hardcoded pelo `AvatarUpload` |
| `AdminPortal.tsx` | Header do sidebar | Substituir avatar hardcoded pelo `AvatarUpload` |
| `MessagesPage.tsx` | Header | Substituir avatar hardcoded pelo `AvatarUpload` |
| `ChatSidebar.tsx` | Lista de conversas | Usar `foto_perfil` do utilizador |
| `InstructorStudentsTab.tsx` | Lista de alunos | Usar `foto_perfil` do aluno |
| `CourseEditorModal.tsx` | Seção de alunos matriculados | Usar `foto_perfil` do aluno |
| `AdminPortal.tsx` | Gestão de utilizadores | Adicionar campo de upload de foto ao criar utilizador |

### 6.6 Foto de Perfil na Criação de Utilizador pelo Administrador

No `AdminPortal.tsx`, ao criar um novo utilizador (ADMIN, PROFESSOR ou ALUNO), deve haver um campo de upload de foto de perfil:

```tsx
<div className="space-y-2">
  <label className="text-xs font-mono font-bold text-neutral-400 uppercase">Foto de Perfil</label>
  <div className="flex items-center gap-4">
    <AvatarUpload
      userId={newUserId} // ID do utilizador recém-criado
      currentAvatarUrl={null}
      userName={newUserName}
      size="lg"
      onAvatarUpdated={(url) => setNewUserAvatar(url)}
    />
    <div className="text-xs text-neutral-400">
      Clique na imagem para carregar uma foto de perfil.<br/>
      Formatos: JPG, PNG ou WebP. Máximo: 5MB.
    </div>
  </div>
</div>
```

---

## 7. Dados Fictícios a Remover — Lista Completa

### 7.1 Tabela Resumo de Todos os Dados Fictícios

| # | Arquivo | Linhas | Dado Fictício | Prioridade | Ação |
|---|---------|--------|---------------|------------|------|
| 1 | `StudentMaterialsTab.tsx` | 31-94 | 7 manuais fictícios | 🔴 Crítica | Substituir por dados do Supabase |
| 2 | `StudentMaterialsTab.tsx` | 96-103 | Download simulado com setTimeout | 🔴 Crítica | Implementar download real |
| 3 | `StudentTasksTab.tsx` | 38-76 | 4 tarefas fictícias | 🟡 Alta | Substituir por dados do Supabase |
| 4 | `StudentCertificatesTab.tsx` | 33-52 | 2 certificados fictícios | 🔴 Crítica | Substituir por dados do Supabase |
| 5 | `StudentPortal.tsx` | 1205 | Email `'antonio@advogados.ao'` | 🔴 Crítica | Usar `currentUser.email` |
| 6 | `StudentPortal.tsx` | 1275 | Transcrição hardcoded | 🔴 Crítica | Usar `lesson.descricao` |
| 7 | `StudentPortal.tsx` | 1482-1535 | 3 sessões de calendário falsas | 🔴 Crítica | Mostrar estado vazio |
| 8 | `StudentPortal.tsx` | 1454 | URL falsa do Google Meet | 🔴 Crítica | Usar `lesson.meeting_url` ou ocultar |
| 9 | `StudentPortal.tsx` | 605-608 | Sincronização falsa com Google Calendar | 🟡 Alta | Remover ou implementar |
| 10 | `StudentPortal.tsx` | 250 | `streakCount = currentUser.streak \|\| 5` | 🟡 Alta | Remover fallback `5` |
| 11 | `InstructorStudentsTab.tsx` | 99 | `progressPercent: 66` | 🔴 Crítica | Remover fallback |
| 12 | `InstructorDashboardTab.tsx` | 43-47 | 3 alertas falsos | 🟡 Alta | Substituir por dados reais |
| 13 | `InstructorEvaluationsTab.tsx` | 40-66 | 2 submissões + 3 quizzes falsos | 🟡 Alta | Substituir por dados do Supabase |
| 14 | `InstructorCalendarTab.tsx` | 48-52 | 3 eventos de calendário falsos | 🟡 Alta | Substituir por dados do Supabase |
| 15 | `InstructorPortal.tsx` | 142 | `newCoursePrice = '€450'` | 🔴 Crítica | Usar Kz (Kwanza) sem valor pré-definido |
| 16 | `InstructorPortal.tsx` | 183-195 | Campos hardcoded no mapeamento de cursos | 🟡 Alta | Buscar do banco de dados |
| 17 | `StudentPortal.tsx` | 413-436 | Dados fallback do PDF export | 🔴 Crítica | Usar dados reais do Supabase |
| 18 | `src/data.ts` | 3-230 | Todos os dados hardcoded (cursos, instrutores, blog, testemunhos) | 🟡 Alta | Remover após migração completa |

---

## 8. Alterações Necessárias no Banco de Dados (Supabase)

### 8.1 Migration 004 — Novas Colunas e Tabelas

```sql
-- =============================================================
-- MIGRATION 004: Suporte a videoaulas, apontamentos, 
--                 progresso de vídeo e link de reunião
-- =============================================================

-- 1. Adicionar campo de progresso do vídeo na tabela lesson_progress
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0;

-- 2. Adicionar campo de link de reunião (Google Meet, Zoom, etc.) na tabela lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- 3. Adicionar campo de transcrição/descrição detalhada na tabela lessons
-- (a coluna "descricao" já existe, mas verificar se está sendo usada corretamente)
-- Se a coluna não existir:
-- ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 4. Criar tabela de apontamentos/notas do aluno
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  video_timestamp INTEGER DEFAULT 0, -- Segundos do vídeo quando a nota foi criada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON public.lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON public.lesson_notes(lesson_id);

-- RLS: Aluno pode ver e criar suas próprias notas; Professor/Admin podem ver de alunos dos seus cursos
DROP POLICY IF EXISTS "lesson_notes_select_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_select_own" ON public.lesson_notes FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "lesson_notes_insert_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_insert_own" ON public.lesson_notes FOR INSERT
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "lesson_notes_update_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_update_own" ON public.lesson_notes FOR UPDATE
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "lesson_notes_delete_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_delete_own" ON public.lesson_notes FOR DELETE
USING (auth.uid() = student_id);

-- 5. Criar tabela de tarefas/assignments (para substituir dados fictícios do StudentTasksTab)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')) DEFAULT 'PUBLISHED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select_published" ON public.assignments;
CREATE POLICY "assignments_select_published" ON public.assignments FOR SELECT
USING (
  (status = 'PUBLISHED' AND EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.course_id = assignments.course_id
  )) OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN')
);

DROP POLICY IF EXISTS "assignments_manage_staff" ON public.assignments;
CREATE POLICY "assignments_manage_staff" ON public.assignments FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 6. Criar tabela de submissões de tarefas
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  submission_url TEXT,
  submission_text TEXT,
  feedback TEXT,
  grade NUMERIC,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_submissions_select_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_select_own" ON public.assignment_submissions FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "assignment_submissions_insert_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_insert_own" ON public.assignment_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "assignment_submissions_update_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_update_own" ON public.assignment_submissions FOR UPDATE
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 7. Trigger para notificar alunos sobre novas tarefas
CREATE OR REPLACE FUNCTION public.notify_new_assignment()
RETURNS trigger AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT student_id FROM public.enrollments 
    WHERE course_id = NEW.course_id AND status = 'ACTIVE'
  LOOP
    INSERT INTO public.notifications (user_id, text) 
    VALUES (rec.student_id, 'Nova tarefa atribuída: ' || NEW.titulo);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_new_assignment ON public.assignments;
CREATE TRIGGER trg_notify_new_assignment AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_assignment();
```

### 8.2 Atualizar tipos TypeScript

**Arquivo:** `src/services/supabase/lessonService.ts`

Adicionar novos campos à interface `SupabaseLesson`:

```ts
export interface SupabaseLesson {
  id: string;
  course_id: string;
  titulo: string;
  descricao: string;
  video_url: string;
  ordem: number;
  duracao: string;
  quiz?: any[] | null;
  scheduled_at?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  meeting_url?: string | null;      // NOVO
  created_by?: string | null;        // NOVO
}
```

---

## 9. Alterações Necessárias nos Services (academicService, lessonService, etc.)

### 9.1 Novos Métodos no `academicService`

```ts
// Salvar progresso do vídeo
async saveVideoProgress(studentId: string, courseId: string, lessonId: string, secondsWatched: number): Promise<void> {
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: studentId,
      lesson_id: lessonId,
      course_id: courseId,
      video_progress_seconds: secondsWatched,
    }, { onConflict: 'student_id,lesson_id' });
  if (error) console.error('Erro ao salvar progresso do vídeo:', error);
}

// Buscar progresso do vídeo de uma aula
async getVideoProgress(studentId: string, lessonId: string): Promise<number> {
  const { data } = await supabase
    .from('lesson_progress')
    .select('video_progress_seconds')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  return data?.video_progress_seconds || 0;
}

// Buscar apontamentos do aluno para uma aula
async getLessonNotes(studentId: string, lessonId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .order('video_timestamp', { ascending: true });
  if (error) { console.error('Erro ao buscar apontamentos:', error); return []; }
  return data || [];
}

// Salvar apontamento do aluno
async saveLessonNote(studentId: string, lessonId: string, courseId: string, content: string, videoTimestamp: number): Promise<any> {
  const { data, error } = await supabase
    .from('lesson_notes')
    .insert({
      student_id: studentId,
      lesson_id: lessonId,
      course_id: courseId,
      content,
      video_timestamp: videoTimestamp
    })
    .select()
    .single();
  if (error) { console.error('Erro ao salvar apontamento:', error); throw error; }
  return data;
}

// Buscar materiais de todos os cursos matriculados do aluno
async getStudentMaterials(studentId: string): Promise<any[]> {
  // 1. Buscar cursos matriculados
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId)
    .eq('status', 'ACTIVE');
  
  if (!enrollments || enrollments.length === 0) return [];
  
  const courseIds = enrollments.map(e => e.course_id);
  
  // 2. Buscar aulas desses cursos
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, course_id, titulo as lesson_title')
    .in('course_id', courseIds);
  
  if (!lessons || lessons.length === 0) return [];
  
  const lessonIds = lessons.map(l => l.id);
  
  // 3. Buscar materiais associados
  const { data: materials, error } = await supabase
    .from('materials')
    .select('*')
    .in('lesson_id', lessonIds);
  
  if (error) { console.error('Erro ao buscar materiais:', error); return []; }
  
  // Enriquecer com informações do curso
  return (materials || []).map(m => ({
    ...m,
    course_id: lessons.find(l => l.id === m.lesson_id)?.course_id,
    lesson_title: lessons.find(l => l.id === m.lesson_id)?.lesson_title
  }));
}

// Buscar tarefas do aluno
async getStudentAssignments(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id, course:courses(id, title)')
    .eq('student_id', studentId)
    .eq('status', 'ACTIVE');
  
  if (error || !data) return [];
  
  const courseIds = data.map(e => e.course_id);
  
  const { data: assignments, error: aError } = await supabase
    .from('assignments')
    .select('*')
    .in('course_id', courseIds)
    .eq('status', 'PUBLISHED');
  
  if (aError) { console.error('Erro ao buscar tarefas:', aError); return []; }
  return assignments || [];
}

// Submeter tarefa
async submitAssignment(assignmentId: string, studentId: string, submission: { text?: string; url?: string }): Promise<any> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .upsert({
      assignment_id: assignmentId,
      student_id: studentId,
      submission_text: submission.text || null,
      submission_url: submission.url || null,
    }, { onConflict: 'assignment_id,student_id' })
    .select()
    .single();
  if (error) { console.error('Erro ao submeter tarefa:', error); throw error; }
  return data;
}
```

### 9.2 Novos Métodos no `lessonService`

```ts
// Deletar material
async deleteMaterial(materialId: string): Promise<boolean> {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId);
  if (error) { console.error('Erro ao deletar material:', error); throw error; }
  return true;
}
```

### 9.3 Novo Service: `avatarService.ts`

Conforme detalhado na Secção 6.3.

---

## 10. Critérios de Aceitação

### 10.1 Critérios de Aceitação — Dashboard do Aluno

| # | Critério | Como Verificar |
|---|----------|---------------|
| AC-1 | A aba "Biblioteca" mostra APENAS materiais reais vindos do Supabase | Criar um material no CourseEditorModal → verificar que aparece na Biblioteca do aluno |
| AC-2 | O download de materiais funciona com arquivos reais do Supabase Storage | Clicar em "Descarregar" → o arquivo real é descarregado |
| AC-3 | Se não há materiais, a Biblioteca mostra estado vazio (sem dados falsos) | Matricular aluno em curso sem materiais → ver mensagem de vazio |
| AC-4 | A aba "Tarefas" mostra APENAS tarefas reais do professor | Professor cria tarefa → aluno vê a tarefa |
| AC-5 | Os certificados mostrados são APENAS os emitidos real | Emitir certificado → verificar que aparece na aba do aluno |
| AC-6 | A transcrição da aula vem de `lessons.descricao` (não hardcoded) | Criar aula com descrição → verificar que a transcrição no player reflete a descrição |
| AC-7 | A marca d'água do vídeo usa o email real do utilizador | Fazer login como aluno → verificar que o email na marca d'água é o do aluno |
| AC-8 | Aulas com `scheduled_at` futuro aparecem bloqueadas | Criar aula agendada para amanhã → verificar que aparece 🔒 para o aluno |
| AC-9 | Aulas com `scheduled_at` passado ou nulo são reproduzíveis | Verificar que aula sem data ou com data passada não mostra 🔒 |
| AC-10 | O vídeo é reproduzido a partir da `video_url` (Cloudinary) | Inserir URL válida do Cloudinary → verificar reprodução |
| AC-11 | O progresso do vídeo é salvo e retomado | Assistir 30s do vídeo → sair → voltar → vídeo retoma dos 30s |
| AC-12 | O quiz funciona com dados reais do `lessons.quiz` | Criar quiz no CourseEditorModal → verificar que o aluno pode responder |
| AC-13 | Apontamentos do aluno são salvos no banco de dados | Escrever apontamento → recarregar página → apontamento persiste |
| AC-14 | Marcar aula como concluída salva no `lesson_progress` | Marcar aula como concluída → verificar no Supabase que `completed = true` |
| AC-15 | O calendário mostra APENAS aulas agendadas reais | Verificar que não há cards de sessões fictícias |
| AC-16 | Não há links falsos do Google Meet | Verificar que `meet.google.com/lookup/mock-multiplus` não existe no código |

### 10.2 Critérios de Aceitação — Dashboard do Professor

| # | Critério | Como Verificar |
|---|----------|---------------|
| AC-17 | Professor pode criar curso e adicionar aulas com vídeo, descrição, quiz e data | Fluxo completo no CourseEditorModal |
| AC-18 | Professor pode fazer upload de materiais (manuais) para as aulas | Anexar PDF → verificar que aparece no Supabase |
| AC-19 | Professor pode agendar aulas com `scheduled_at` e `meeting_url` | Agendar aula → verificar que o aluno vê a data |
| AC-20 | Professor pode criar tarefas/assignments para os cursos | Criar tarefa → verificar que o aluno vê a tarefa |
| AC-21 | Professor visualiza progresso real dos alunos (aulas concluídas, quiz scores) | Ver painel de alunos → dados reais do Supabase |

### 10.3 Critérios de Aceitação — Fotos de Perfil

| # | Critério | Como Verificar |
|---|----------|---------------|
| AC-22 | Qualquer utilizador pode alterar sua foto de perfil | Clicar no avatar → carregar nova foto → foto atualizada |
| AC-23 | A foto de perfil é salva no Supabase Storage e referenciada em `users.foto_perfil` | Verificar no Supabase que a URL está na coluna `foto_perfil` |
| AC-24 | A foto aparece em todos os componentes que exibem avatar | Verificar sidebar, chat, lista de alunos, etc. |
| AC-25 | O administrador pode definir a foto ao criar um utilizador | Criar utilizador → carregar foto → foto aparece no perfil |
| AC-26 | Se não há foto, mostrar iniciais do nome (fallback elegante) | Criar utilizador sem foto → verificar que as iniciais aparecem |

### 10.4 Critérios de Aceitação — Dados Fictícios

| # | Critério | Como Verificar |
|---|----------|---------------|
| AC-27 | Nenhum componente possui arrays hardcoded de dados fictícios | Procurar por `mat_1`, `task_`, `cert_` no código-fonte |
| AC-28 | Nenhum email hardcoded aparece como fallback | Procurar por `antonio@advogados.ao` no código-fonte |
| AC-29 | Nenhum link falso do Google Meet existe | Procurar por `mock-multiplus` no código-fonte |
| AC-30 | Todas as listas vazias mostram estados vazios elegantes | Verificar cada aba sem dados → mensagem amigável |

---

## Notas Finais

1. **Ordem de implementação recomendada:**
   - Fase 1: Executar migration 004 no Supabase (Claude/MCP)
   - Fase 2: Criar `avatarService.ts` e `AvatarUpload.tsx`
   - Fase 3: Refatorar `StudentMaterialsTab.tsx` (biblioteca com dados reais)
   - Fase 4: Refatorar `StudentTasksTab.tsx` (tarefas com dados reais)
   - Fase 5: Refatorar `StudentCertificatesTab.tsx` (certificados com dados reais)
   - Fase 6: Implementar player de vídeo real no StudentPortal
   - Fase 7: Corrigir transcrição, marca d'água e links falsos
   - Fase 8: Adicionar upload de materiais no CourseEditorModal
   - Fase 9: Adicionar gestão de tarefas no dashboard do professor
   - Fase 10: Integrar fotos de perfil em todos os componentes

2. **O Claude é responsável por executar as migrations no Supabase via MCP.** O Gemini deve aguardar a confirmação de que a migration 004 foi executada antes de implementar os services que dependem das novas tabelas.

3. **Comunicação entre equipes:** O Gemini implementa o código frontend. O Claude gere o banco de dados. O Super Z orienta e valida. Qualquer dúvida sobre o schema ou relacionamentos deve ser encaminhada ao Super Z.

4. **Teste manual:** Após cada fase, testar o fluxo completo: professor cria conteúdo → aluno acessa → progresso é salvo → professor visualiza progresso.

---

*Documento gerado por Super Z — Orientador de Desenvolvimento MultiPlus Academy*  
*Versão: 015 | Data: 16/07/2026 | Idioma: Português (com acentuação)*
