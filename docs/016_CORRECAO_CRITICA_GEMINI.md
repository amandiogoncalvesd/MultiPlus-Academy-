# 🔴 Documento de Orientação 016 — CORREÇÃO CRÍTICA: Gemini Não Implementou o Documento 015

**Projeto:** MultiPlus Academy LMS  
**Destinatário:** Google Gemini (Google AI Studio)  
**Autor:** Super Z (Orientador de Desenvolvimento)  
**Data:** 16 de Julho de 2026  
**Prioridade:** 🔴🔴🔴 URGENTE — Nenhuma alteração do documento 015 foi aplicada  

---

## ⚠️ PROBLEMA CRÍTICO

Após auditoria completa dos 10 arquivos que o Gemini informou ter editado, **VERIFICOU-SE QUE NENHUMA ALTERAÇÃO FOI APLICADA**. Todos os arquivos permanecem com dados fictícios, sem integração com o Supabase, e sem as funcionalidades especificadas no documento 015.

### O que NÃO foi feito (auditoria confirmou):

| # | Arquivo | Problema Confirmado |
|---|---------|-------------------|
| 1 | `supabase/migrations/004_video_notes_assignments.sql` | **ARQUIVO NÃO EXISTE** — Migration nunca foi criada |
| 2 | `src/services/supabase/avatarService.ts` | **ARQUIVO NÃO EXISTE** — Service nunca foi criado |
| 3 | `src/components/AvatarUpload.tsx` | **ARQUIVO NÃO EXISTE** — Componente nunca foi criado |
| 4 | `src/components/portal/StudentMaterialsTab.tsx` | **AINDA TEM 7 manuais fictícios** (linhas 31-94), zero integração Supabase |
| 5 | `src/components/portal/StudentTasksTab.tsx` | **AINDA TEM 4 tarefas fictícias** (linhas 38-76), zero integração Supabase |
| 6 | `src/components/portal/StudentCertificatesTab.tsx` | **AINDA TEM 2 certificados fictícios** (linhas 33-52), zero integração Supabase |
| 7 | `src/components/StudentPortal.tsx` | **AINDA TEM** email `'antonio@advogados.ao'` (linha 1205), 5 links falsos `'mock-multiplus'`, transcrição hardcoded (linha 1275), 3 cards de calendário falsos (linhas 1482-1535), player de vídeo placeholder (sem `<video>`), apontamentos não persistidos |
| 8 | `src/services/supabase/lessonService.ts` | Faltam métodos: video progress, lesson notes, assignments |
| 9 | `src/services/supabase/academicService.ts` | Faltam métodos e existem dados hardcoded: `total_lessons: 3` no fallback, thumbnail Unsplash hardcoded |
| 10 | `src/types.ts` | Faltam tipos: Assignment, VideoProgress |

---

## INSTRUÇÕES OBRIGATÓRIAS PARA O GEMINI

### REGRA #1: NÃO APENAS "EDITAR" — SUBSTITUIR ARQUIVOS COMPLETOS

O Gemini DEVE usar a abordagem de **substituir o conteúdo COMPLETO de cada arquivo**, não apenas editar trechos. Os arquivos que precisam ser CRIADOS do zero (não existem) devem ser criados com o conteúdo exato fornecido abaixo.

### REGRA #2: ORDEM DE EXECUÇÃO

Execute NA ORDEM EXATA abaixo. NÃO pule etapas:

1. Criar `supabase/migrations/004_video_notes_assignments.sql` (NOVO ARQUIVO)
2. Criar `src/services/supabase/avatarService.ts` (NOVO ARQUIVO)
3. Criar `src/components/AvatarUpload.tsx` (NOVO ARQUIVO)
4. Substituir COMPLETAMENTE `src/components/portal/StudentMaterialsTab.tsx`
5. Substituir COMPLETAMENTE `src/components/portal/StudentTasksTab.tsx`
6. Substituir COMPLETAMENTE `src/components/portal/StudentCertificatesTab.tsx`
7. Adicionar métodos a `src/services/supabase/academicService.ts`
8. Adicionar métodos a `src/services/supabase/lessonService.ts`
9. Adicionar tipos a `src/types.ts`
10. Corrigir `src/components/StudentPortal.tsx` (edições específicas)

### REGRA #3: O CLAUDE EXECUTA A MIGRATION

Após o Gemini criar o arquivo SQL da migration, o **Claude** deve executá-lo no Supabase via MCP. O Gemini NÃO pode executar migrations — apenas criar o arquivo.

---

## ARQUIVO 1: `supabase/migrations/004_video_notes_assignments.sql`

**CRIAR ESTE ARQUIVO NOVO.** Conteúdo completo:

```sql
-- =============================================================
-- MIGRATION 004: Suporte a videoaulas, apontamentos,
--                 progresso de vídeo, link de reunião e tarefas
-- MultiPlus Academy — 16/07/2026
-- =============================================================

-- 1. Adicionar campo de progresso do vídeo na tabela lesson_progress
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0;

-- 2. Adicionar campo de link de reunião na tabela lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- 3. Criar tabela de apontamentos/notas do aluno
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  video_timestamp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON public.lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON public.lesson_notes(lesson_id);

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

-- 4. Criar tabela de tarefas/assignments
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

-- 5. Criar tabela de submissões de tarefas
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

DROP POLICY IF EXISTS "assignment_submissions_update_staff" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_update_staff" ON public.assignment_submissions FOR UPDATE
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 6. Trigger: notificar alunos sobre novas tarefas
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

---

## ARQUIVO 2: `src/services/supabase/avatarService.ts`

**CRIAR ESTE ARQUIVO NOVO.** Conteúdo completo:

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
  },

  async removeAvatar(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ foto_perfil: null })
      .eq('id', userId);

    if (error) throw error;
  }
};
```

---

## ARQUIVO 3: `src/components/AvatarUpload.tsx`

**CRIAR ESTE ARQUIVO NOVO.** Conteúdo completo:

```tsx
import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { avatarService } from '../services/supabase/avatarService';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  onAvatarUpdated?: (newUrl: string) => void;
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  size = 'md',
  onAvatarUpdated
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-24 h-24 text-2xl'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

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

  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';

  return (
    <div
      className="relative group cursor-pointer inline-block"
      onClick={() => fileInputRef.current?.click()}
    >
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

      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 size={iconSizes[size]} className="text-cream-100 animate-spin" />
        ) : (
          <Camera size={iconSizes[size]} className="text-cream-100" />
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

---

## ARQUIVO 4: `src/components/portal/StudentMaterialsTab.tsx`

**SUBSTITUIR O ARQUIVO COMPLETO.** O arquivo atual tem 7 manuais fictícios (linhas 31-94) e download simulado. Substituir pelo conteúdo abaixo que usa dados reais do Supabase:

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileCheck,
  BookOpen,
  Headphones,
  Video,
  ExternalLink,
  Search,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface AcademicMaterial {
  id: string;
  titulo: string;
  tipo: string;
  arquivo_url: string;
  lesson_id: string;
  lesson_title?: string;
  course_title?: string;
}

export default function StudentMaterialsTab() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'PDF' | 'DOCX' | 'PPT' | 'Audio' | 'Video' | 'Links'>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [materials, setMaterials] = useState<AcademicMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        // 1. Buscar matrículas ativas do aluno
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id)
          .eq('status', 'ACTIVE');

        if (enrollErr) throw enrollErr;
        if (!enrollments || enrollments.length === 0) {
          setMaterials([]);
          return;
        }

        const courseIds = enrollments.map(e => e.course_id);

        // 2. Buscar aulas desses cursos
        const { data: lessons, error: lessonsErr } = await supabase
          .from('lessons')
          .select('id, course_id, titulo')
          .in('course_id', courseIds);

        if (lessonsErr) throw lessonsErr;
        if (!lessons || lessons.length === 0) {
          setMaterials([]);
          return;
        }

        const lessonIds = lessons.map(l => l.id);

        // 3. Buscar materiais associados a essas aulas
        const { data: materialsData, error: matErr } = await supabase
          .from('materials')
          .select('*')
          .in('lesson_id', lessonIds);

        if (matErr) throw matErr;

        // 4. Enriquecer com informações do curso e aula
        const enriched = (materialsData || []).map(m => {
          const lesson = lessons.find(l => l.id === m.lesson_id);
          return {
            ...m,
            lesson_title: lesson?.titulo || '',
            course_title: ''
          };
        });

        setMaterials(enriched);
      } catch (err) {
        console.error('Erro ao carregar materiais:', err);
        setError('Não foi possível carregar os materiais. Tente novamente.');
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [user?.id]);

  const handleDownload = async (material: AcademicMaterial) => {
    if (!material.arquivo_url) return;
    setDownloadingId(material.id);
    try {
      // Tentar URL direta (funciona para URLs públicas do Supabase Storage)
      window.open(material.arquivo_url, '_blank');
      setDownloadSuccessMessage(`Sucesso! A descarregar: "${material.titulo}"`);
      setTimeout(() => setDownloadSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao descarregar material:', err);
      setDownloadSuccessMessage('Erro ao descarregar o ficheiro.');
      setTimeout(() => setDownloadSuccessMessage(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.tipo === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'DOCX':
        return <FileCheck className="w-5 h-5 text-blue-500" />;
      case 'PPT':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      case 'Audio':
        return <Headphones className="w-5 h-5 text-emerald-500" />;
      case 'Video':
        return <Video className="w-5 h-5 text-gold-500" />;
      default:
        return <ExternalLink className="w-5 h-5 text-gold-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-cream-100 dark:bg-ink-900 p-12 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-600 mx-auto mb-3" />
          <span className="text-xs text-neutral-400">A carregar materiais académicos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-red-50 dark:bg-danger-700/20 p-8 rounded-3xl border border-red-200 dark:border-red-900/30 text-center">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] bg-gradient-to-br from-gold-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Search and Category Filter Toolbar */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,155,60,0.04),transparent_50%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Biblioteca Académica</span>
            <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Materiais de Estudo</h3>
          </div>

          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar manuais ou modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-700 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:border-gold-600 text-[#1C1C1C] dark:text-cream-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-150 dark:border-ink-800/60 relative z-10">
          {(['ALL', 'PDF', 'DOCX', 'PPT', 'Audio', 'Video', 'Links'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-0 ${
                selectedCategory === cat
                  ? 'bg-gold-600 text-cream-100 shadow-sm shadow-gold-600/20'
                  : 'bg-cream-200 dark:bg-ink-800 hover:bg-cream-250 dark:hover:bg-ink-750 text-neutral-400 dark:text-cream-200'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {downloadSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 shadow-sm text-left"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-cream-100 flex items-center justify-center text-[10px] shrink-0 font-bold">✓</div>
            <span>{downloadSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials Grid or Empty State */}
      {filteredMaterials.length === 0 ? (
        <div className="py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center">
          <AlertCircle size={24} className="text-yellow-500 mb-2" />
          {materials.length === 0 ? (
            <>
              <p className="m-0">Nenhum material disponível no momento.</p>
              <p className="m-0 mt-1 text-[10px]">Os materiais de estudo aparecerão aqui assim que o professor os adicionar às aulas.</p>
            </>
          ) : (
            <p className="m-0">Nenhum recurso académico corresponde à pesquisa solicitada.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map(mat => (
            <div
              key={mat.id}
              className="bg-cream-100 dark:bg-ink-900 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 hover:border-gold-600/35 dark:hover:border-gold-600/50 hover:shadow-lg hover:scale-[1.01] transition-all flex justify-between gap-4 text-left group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-600/[0.01] to-transparent pointer-events-none" />
              <div className="space-y-2 flex-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-100 dark:border-ink-700/40 shrink-0 block">
                    {getCategoryIcon(mat.tipo)}
                  </span>
                  <div>
                    <span className="inline-block text-[8px] font-mono tracking-widest font-bold uppercase bg-cream-200 dark:bg-ink-800 text-neutral-400 dark:text-cream-200 px-2 py-0.5 rounded">
                      {mat.tipo}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-serif font-black text-ink-900 dark:text-cream-100 leading-snug group-hover:text-gold-600 dark:group-hover:text-[#E2B755] transition-colors mt-1 mb-0 line-clamp-1">
                  {mat.titulo}
                </h4>
                {mat.lesson_title && (
                  <p className="text-[11px] text-neutral-400 dark:text-cream-100/70 leading-normal font-sans line-clamp-2 mt-1 mb-0">
                    Aula: {mat.lesson_title}
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-between shrink-0 relative z-10">
                <button
                  onClick={() => handleDownload(mat)}
                  disabled={downloadingId !== null}
                  className="p-3 rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-250 dark:border-ink-750 hover:border-gold-600 dark:hover:border-gold-600 text-neutral-400 hover:text-gold-600 dark:text-cream-200 dark:hover:text-gold-600 hover:bg-cream-100 dark:hover:bg-ink-900 transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Descarregar ficheiro"
                >
                  {downloadingId === mat.id ? (
                    <span className="h-4 w-4 border-2 border-gold-600 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ARQUIVO 5: `src/components/portal/StudentTasksTab.tsx`

**SUBSTITUIR O ARQUIVO COMPLETO.** O arquivo atual tem 4 tarefas fictícias. Substituir pelo conteúdo abaixo:

```tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Loader2,
  FileText,
  Send
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface Assignment {
  id: string;
  titulo: string;
  descricao: string | null;
  due_date: string | null;
  course_id: string;
  course_title?: string;
  status: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  submission_text: string | null;
  submission_url: string | null;
  feedback: string | null;
  grade: number | null;
  submitted_at: string;
}

export default function StudentTasksTab() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'OVERDUE'>('PENDING');
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        // 1. Buscar matrículas ativas
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select('course_id, course:courses(title)')
          .eq('student_id', user.id)
          .eq('status', 'ACTIVE');

        if (enrollErr) throw enrollErr;
        if (!enrollments || enrollments.length === 0) {
          setAssignments([]);
          return;
        }

        const courseIds = enrollments.map(e => e.course_id);

        // 2. Buscar tarefas publicadas desses cursos
        const { data: assignmentsData, error: assignErr } = await supabase
          .from('assignments')
          .select('*')
          .in('course_id', courseIds)
          .eq('status', 'PUBLISHED');

        if (assignErr) throw assignErr;

        // Enriquecer com título do curso
        const enriched = (assignmentsData || []).map(a => {
          const enrollment = enrollments.find(e => e.course_id === a.course_id);
          return {
            ...a,
            course_title: (enrollment?.course as any)?.title || ''
          };
        });

        setAssignments(enriched);

        // 3. Buscar submissões do aluno
        const { data: subsData } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', user.id);

        setSubmissions(subsData || []);
      } catch (err) {
        console.error('Erro ao carregar tarefas:', err);
        setError('Não foi possível carregar as tarefas.');
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.id]);

  const handleSubmitTask = async (assignmentId: string) => {
    if (!user?.id) return;
    const text = submissionText[assignmentId]?.trim();
    if (!text) return;

    setSubmittingId(assignmentId);
    try {
      const { data, error: subErr } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: user.id,
          submission_text: text,
          submitted_at: new Date().toISOString()
        }, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();

      if (subErr) throw subErr;

      // Atualizar lista de submissões
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.assignment_id !== assignmentId);
        return [...filtered, data];
      });

      setSubmissionText(prev => ({ ...prev, [assignmentId]: '' }));
    } catch (err) {
      console.error('Erro ao submeter tarefa:', err);
      alert('Erro ao submeter tarefa. Tente novamente.');
    } finally {
      setSubmittingId(null);
    }
  };

  const isSubmitted = (assignmentId: string) => {
    return submissions.some(s => s.assignment_id === assignmentId);
  };

  const getSubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const pendingAssignments = assignments.filter(a => !isSubmitted(a.id) && !isOverdue(a.due_date));
  const completedAssignments = assignments.filter(a => isSubmitted(a.id));
  const overdueAssignments = assignments.filter(a => !isSubmitted(a.id) && isOverdue(a.due_date));

  const currentList = activeTab === 'PENDING' ? pendingAssignments
    : activeTab === 'COMPLETED' ? completedAssignments
    : overdueAssignments;

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-cream-100 dark:bg-ink-900 p-12 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-600 mx-auto mb-3" />
          <span className="text-xs text-neutral-400">A carregar tarefas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-red-50 dark:bg-danger-700/20 p-8 rounded-3xl border border-red-200 dark:border-red-900/30 text-center">
          <AlertTriangle size={28} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Avaliações & Exercícios</span>
          <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Tarefas Atribuídas</h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border border-gray-150 dark:border-ink-800 p-1 bg-cream-200 dark:bg-ink-900 rounded-xl">
          {(['PENDING', 'COMPLETED', 'OVERDUE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-mono font-bold uppercase cursor-pointer border-0 transition-all ${
                activeTab === tab
                  ? 'bg-gold-600 text-cream-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-400'
              }`}
            >
              {tab === 'PENDING' ? `Pendentes (${pendingAssignments.length})`
                : tab === 'COMPLETED' ? `Concluídas (${completedAssignments.length})`
                : `Expiradas (${overdueAssignments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {currentList.length === 0 ? (
        <div className="py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
          <ClipboardList size={28} className="text-neutral-400 mx-auto mb-3" />
          <h4 className="text-sm font-serif font-bold text-neutral-400">
            {assignments.length === 0
              ? 'Nenhuma tarefa atribuída no momento.'
              : activeTab === 'PENDING'
                ? 'Todas as tarefas foram concluídas!'
                : activeTab === 'COMPLETED'
                  ? 'Ainda não concluiu nenhuma tarefa.'
                  : 'Nenhuma tarefa expirada.'}
          </h4>
          {assignments.length === 0 && (
            <p className="text-[10px] text-neutral-400 mt-1">
              As tarefas aparecerão aqui assim que o professor as atribuir.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(assignment => {
            const submission = getSubmission(assignment.id);
            const submitted = isSubmitted(assignment.id);
            const overdue = isOverdue(assignment.due_date);

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cream-100 dark:bg-ink-900 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-ink-900 dark:text-cream-100 m-0">
                      {assignment.titulo}
                    </h4>
                    {assignment.course_title && (
                      <span className="text-[10px] font-mono text-gold-600 uppercase">{assignment.course_title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted && (
                      <span className="flex items-center gap-1 text-emerald-600 text-2xs font-mono font-bold">
                        <CheckCircle2 size={12} /> Submetida
                      </span>
                    )}
                    {overdue && !submitted && (
                      <span className="flex items-center gap-1 text-red-500 text-2xs font-mono font-bold">
                        <AlertTriangle size={12} /> Expirada
                      </span>
                    )}
                    {assignment.due_date && (
                      <span className="flex items-center gap-1 text-neutral-400 text-2xs font-mono">
                        <Clock size={10} /> {new Date(assignment.due_date).toLocaleDateString('pt-AO')}
                      </span>
                    )}
                  </div>
                </div>

                {assignment.descricao && (
                  <p className="text-xs text-neutral-400 dark:text-cream-100/70 leading-relaxed m-0">
                    {assignment.descricao}
                  </p>
                )}

                {/* Submission area */}
                {submitted ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-xl space-y-1">
                    <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold m-0">
                      Submetido em {new Date(submission!.submitted_at).toLocaleDateString('pt-AO')}
                    </p>
                    {submission!.feedback && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 m-0">
                        Feedback: {submission!.feedback}
                      </p>
                    )}
                    {submission!.grade !== null && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 m-0">
                        Nota: {submission!.grade}/100
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escreva a sua resposta..."
                      value={submissionText[assignment.id] || ''}
                      onChange={e => setSubmissionText(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-700 text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
                    />
                    <button
                      onClick={() => handleSubmitTask(assignment.id)}
                      disabled={!submissionText[assignment.id]?.trim() || submittingId === assignment.id}
                      className="px-4 py-2 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 disabled:opacity-50 text-2xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {submittingId === assignment.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      Submeter
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

## ARQUIVO 6: `src/components/portal/StudentCertificatesTab.tsx`

**SUBSTITUIR O ARQUIVO COMPLETO.** O arquivo atual tem 2 certificados fictícios. Substituir pelo conteúdo abaixo:

```tsx
import { useState, useEffect } from 'react';
import {
  Award,
  Download,
  Shield,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../auth/AuthProvider';

interface Certificate {
  id: string;
  course_id: string;
  codigo_validacao: string;
  emitido_em: string;
  certificate_pdf_url: string | null;
  course?: {
    title: string;
  };
  final_grade?: string;
}

export default function StudentCertificatesTab() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: certErr } = await supabase
          .from('certificates')
          .select('*, course:courses(title)')
          .eq('student_id', user.id);

        if (certErr) throw certErr;
        setCertificates(data || []);
      } catch (err) {
        console.error('Erro ao carregar certificados:', err);
        setError('Não foi possível carregar os certificados.');
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user?.id]);

  const handleDownloadPDF = async (cert: Certificate) => {
    if (!cert.certificate_pdf_url) {
      alert('O PDF deste certificado ainda não está disponível.');
      return;
    }
    setDownloadingId(cert.id);
    try {
      window.open(cert.certificate_pdf_url, '_blank');
    } catch (err) {
      console.error('Erro ao descarregar certificado:', err);
      alert('Erro ao descarregar o certificado.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVerify = async () => {
    if (!verifyingCode.trim()) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const { data, error: verifyErr } = await supabase
        .from('certificates')
        .select('*, student:users(nome_completo), course:courses(title)')
        .eq('codigo_validacao', verifyingCode.trim().toUpperCase())
        .maybeSingle();

      if (verifyErr) throw verifyErr;
      setVerificationResult(data);
    } catch (err) {
      console.error('Erro ao verificar certificado:', err);
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-cream-100 dark:bg-ink-900 p-12 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold-600 mx-auto mb-3" />
          <span className="text-xs text-neutral-400">A carregar certificados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-red-50 dark:bg-danger-700/20 p-8 rounded-3xl border border-red-200 dark:border-red-900/30 text-center">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Certificates Header */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs">
        <span className="text-[10px] font-mono tracking-widest text-gold-600 uppercase block mb-1">Diplomas & Credenciais</span>
        <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">Certificados Académicos</h3>
      </div>

      {/* Certificates Grid or Empty State */}
      {certificates.length === 0 ? (
        <div className="py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
          <Award size={32} className="text-neutral-400 mx-auto mb-3" />
          <h4 className="text-sm font-serif font-bold text-neutral-400">Nenhum certificado emitido</h4>
          <p className="text-[10px] text-neutral-400 mt-1">
            Os seus certificados aparecerão aqui assim que completar os cursos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className="bg-cream-100 dark:bg-ink-900 p-5 rounded-2xl border border-gray-150 dark:border-ink-800/60 hover:border-gold-600/35 dark:hover:border-gold-600/50 transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-600/10 flex items-center justify-center">
                  <Award size={20} className="text-gold-600" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-ink-900 dark:text-cream-100 m-0">
                    {cert.course?.title || 'Curso'}
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Emitido em {new Date(cert.emitido_em).toLocaleDateString('pt-AO')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <Shield size={10} />
                <span>Código: {cert.codigo_validacao}</span>
              </div>

              <div className="flex gap-2">
                {cert.certificate_pdf_url && (
                  <button
                    onClick={() => handleDownloadPDF(cert)}
                    disabled={downloadingId === cert.id}
                    className="px-3 py-1.5 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 text-2xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    {downloadingId === cert.id ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    Descarregar PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Verification */}
      <div className="bg-cream-100 dark:bg-ink-900 p-6 rounded-3xl border border-gray-150 dark:border-ink-800/60 shadow-xs space-y-4">
        <h4 className="text-sm font-serif font-bold text-ink-900 dark:text-cream-100 m-0 flex items-center gap-2">
          <Shield size={14} className="text-gold-600" /> Verificar Autenticidade
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Introduza o código de validação (ex: MPA-2026-001)"
            value={verifyingCode}
            onChange={e => setVerifyingCode(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-cream-200 dark:bg-ink-800 border border-gray-200 dark:border-ink-700 text-ink-900 dark:text-cream-100 focus:outline-none focus:border-gold-600"
          />
          <button
            onClick={handleVerify}
            disabled={!verifyingCode.trim() || verifying}
            className="px-4 py-2 bg-gold-600 hover:bg-[#a67e2b] text-cream-100 disabled:opacity-50 text-2xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer"
          >
            {verifying ? <Loader2 size={12} className="animate-spin" /> : 'Verificar'}
          </button>
        </div>

        {verificationResult && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold m-0">
              ✓ Certificado autêntico
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 m-0 mt-1">
              Titular: {verificationResult.student?.nome_completo || 'N/A'} — Curso: {verificationResult.course?.title || 'N/A'}
            </p>
          </div>
        )}

        {verificationResult === null && verifyingCode && !verifying && verificationResult !== undefined && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
            <p className="text-xs text-red-800 dark:text-red-400 font-semibold m-0">
              ✗ Certificado não encontrado ou código inválido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## ARQUIVO 7: Adições ao `src/services/supabase/academicService.ts`

**ADICIONAR os seguintes métodos** ao objeto `academicService` existente (NÃO apagar os métodos existentes, apenas adicionar novos):

```ts
  // =========================================================================
  // N. VIDEO PROGRESS
  // =========================================================================
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
  },

  async getVideoProgress(studentId: string, lessonId: string): Promise<number> {
    const { data } = await supabase
      .from('lesson_progress')
      .select('video_progress_seconds')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    return data?.video_progress_seconds || 0;
  },

  // =========================================================================
  // O. LESSON NOTES
  // =========================================================================
  async getLessonNotes(studentId: string, lessonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('student_id', studentId)
      .eq('lesson_id', lessonId)
      .order('video_timestamp', { ascending: true });
    if (error) { console.error('Erro ao buscar apontamentos:', error); return []; }
    return data || [];
  },

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
  },

  async deleteLessonNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('id', noteId);
    if (error) { console.error('Erro ao deletar apontamento:', error); throw error; }
  },

  // =========================================================================
  // P. STUDENT MATERIALS (from all enrolled courses)
  // =========================================================================
  async getStudentMaterials(studentId: string): Promise<any[]> {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (!enrollments || enrollments.length === 0) return [];

    const courseIds = enrollments.map(e => e.course_id);

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id, titulo')
      .in('course_id', courseIds);

    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(l => l.id);

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .in('lesson_id', lessonIds);

    if (error) { console.error('Erro ao buscar materiais:', error); return []; }

    return (materials || []).map(m => ({
      ...m,
      course_id: lessons.find(l => l.id === m.lesson_id)?.course_id,
      lesson_title: lessons.find(l => l.id === m.lesson_id)?.titulo
    }));
  },

  // =========================================================================
  // Q. ASSIGNMENTS
  // =========================================================================
  async getStudentAssignments(studentId: string): Promise<any[]> {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, course:courses(title)')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE');

    if (!enrollments || enrollments.length === 0) return [];

    const courseIds = enrollments.map(e => e.course_id);

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .in('course_id', courseIds)
      .eq('status', 'PUBLISHED');

    if (error) { console.error('Erro ao buscar tarefas:', error); return []; }

    return (assignments || []).map(a => {
      const enrollment = enrollments.find(e => e.course_id === a.course_id);
      return {
        ...a,
        course_title: (enrollment?.course as any)?.title || ''
      };
    });
  },

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
  },

  async getAssignmentSubmissions(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', studentId);
    if (error) { console.error('Erro ao buscar submissões:', error); return []; }
    return data || [];
  },
```

**TAMBÉM CORRIGIR** no método `getStudentProgressMetrics` — substituir o bloco de fallback que tem `total_lessons: 3` hardcoded:

**Localizar este bloco (aproximadamente linhas 428-446):**
```ts
        return [{
          student_id: userId,
          total_lessons: 3,
          completed_lessons: completed.length,
          progress_percent: Math.min(100, Math.round((completed.length / 3) * 100)),
```

**Substituir por:**
```ts
        // Buscar contagem real de aulas
        const { count: totalLessonsCount } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .in('course_id', enrollments?.map(e => e.course_id) || []);

        const totalLessons = totalLessonsCount || 0;

        return [{
          student_id: userId,
          total_lessons: totalLessons,
          completed_lessons: completed.length,
          progress_percent: totalLessons > 0 ? Math.min(100, Math.round((completed.length / totalLessons) * 100)) : 0,
```

**TAMBÉM CORRIGIR** no método `createCourse` — remover a thumbnail Unsplash hardcoded:

**Localizar (aproximadamente linha 77):**
```ts
thumbnail: course.thumbnail || course.imagem || 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=300',
```

**Substituir por:**
```ts
thumbnail: course.thumbnail || course.imagem || null,
```

---

## ARQUIVO 8: Adições ao `src/services/supabase/lessonService.ts`

**ADICIONAR os seguintes métodos** ao objeto `lessonService` existente:

```ts
  async deleteMaterial(materialId: string): Promise<boolean> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);
    if (error) {
      console.error('Erro ao deletar material:', error);
      throw error;
    }
    return true;
  },

  async getMaterialsByCourses(courseIds: string[]): Promise<SupabaseMaterial[]> {
    if (courseIds.length === 0) return [];

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .in('course_id', courseIds);

    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(l => l.id);

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .in('lesson_id', lessonIds);

    if (error) {
      console.error('Erro ao buscar materiais por cursos:', error);
      return [];
    }
    return (data || []) as SupabaseMaterial[];
  },
```

**TAMBÉM atualizar** a interface `SupabaseLesson` para incluir os novos campos:

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

## ARQUIVO 9: Adições ao `src/types.ts`

**ADICIONAR** os seguintes tipos ao arquivo existente (não apagar os tipos existentes):

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

---

## ARQUIVO 10: Correções ao `src/components/StudentPortal.tsx`

As correções abaixo são **edições específicas** (localizar e substituir). NÃO substituir o arquivo completo — ele é muito grande.

### Correção 10.1 — Email hardcoded na marca d'água

**Localizar (linha ~1205):**
```tsx
🛡 {currentUser?.email || 'antonio@advogados.ao'} • MULTIPLUS
```

**Substituir por:**
```tsx
🛡 {currentUser?.email || currentUser?.firstName || 'Utilizador'} • MULTIPLUS
```

### Correção 10.2 — Transcrição hardcoded

**Localizar (linha ~1275):**
```tsx
"Diferenças fundamentais entre o modelo codificado Civil Law vigente em toda a República de Angola e o sistema do Common Law anglo-saxónico com enfoque em precedentes e regimentos para contratos de extração petrolífera de joint ventures."
```

**Substituir por:**
```tsx
{currentLecture.descricao || currentLecture.description || 'Transcrição não disponível para esta aula.'}
```

### Correção 10.3 — Remover links falsos do Google Meet

**Localizar TODAS as ocorrências (5 no total) de:**
```tsx
https://meet.google.com/lookup/mock-multiplus
```

**Substituir cada uma por:** A variável real da aula, que depende do contexto. Exemplos:

Se está dentro de um `scheduledLessons.map()`, usar:
```tsx
{session.lesson?.meeting_url || '#'}
```

Se está num card de fallback (que deve ser removido — ver Correção 10.4), simplesmente remover o card.

### Correção 10.4 — Remover cards de calendário fictícios

**Localizar o bloco de fallback (aproximadamente linhas 1482-1535)** que começa com:
```tsx
{/* Fallback mock items if no real meetings are scheduled */}
{/* Session 1 card */}
```

e termina antes de:
```tsx
)}
</div>
```

**Substituir TODO esse bloco de 3 cards fictícios por:**
```tsx
                        <div className="col-span-3 py-16 bg-cream-100 dark:bg-ink-900 rounded-3xl border border-gray-150 dark:border-ink-800/60 text-center">
                          <Calendar size={32} className="text-neutral-400 mx-auto mb-3" />
                          <h4 className="text-sm font-serif font-bold text-neutral-400 m-0">Nenhuma aula agendada</h4>
                          <p className="text-xs text-neutral-400 mt-1 m-0">
                            As suas aulas síncronas aparecerão aqui assim que o professor as agendar.
                          </p>
                        </div>
```

### Correção 10.5 — Substituir player placeholder por vídeo real

**Localizar o bloco do player de vídeo placeholder** (aproximadamente linhas 1192-1267) que contém:
```tsx
<div className="aspect-video bg-slate-900 border border-gold-600/35 rounded-2xl overflow-hidden relative flex flex-col justify-between items-stretch p-4 select-none shadow">
```

**Substituir o conteúdo INTERNO do player** (mantendo a div externa com aspect-video) por um player de vídeo HTML5 real. A lógica é:

Se `currentLecture.video_url` existe e a aula NÃO está bloqueada:
```tsx
<div className="aspect-video bg-slate-900 border border-gold-600/35 rounded-2xl overflow-hidden relative">
  {currentLecture.scheduled_at && new Date(currentLecture.scheduled_at) > new Date() ? (
    // Aula bloqueada
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(93,10,10,0.35)_0%,#1a0404_100%)]">
      <Lock size={44} className="text-red-500 mb-2 animate-bounce" />
      <h4 className="text-cream-100 text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
        {currentLecture.title}
      </h4>
      <span className="text-[10px] font-mono text-neutral-400 mt-2 block bg-black/40 px-3 py-1.5 rounded-lg border border-red-500/20">
        🔒 CONTEÚDO BLOQUEADO • Disponível a partir de {new Date(currentLecture.scheduled_at).toLocaleString('pt-AO')}
      </span>
    </div>
  ) : currentLecture.video_url ? (
    // Player de vídeo real
    <>
      <video
        src={currentLecture.video_url}
        className="w-full h-full object-contain"
        controls
        onTimeUpdate={(e) => {
          const sec = Math.floor((e.target as HTMLVideoElement).currentTime);
          setVideoPlaySec(sec);
        }}
        onLoadedMetadata={(e) => {
          // Retomar do progresso salvo (implementar depois)
        }}
      />
      {/* Marca d'água */}
      <div
        className="absolute text-cream-100/10 text-[11px] sm:text-xs font-mono tracking-widest font-extrabold pointer-events-none z-20 bg-black/10 px-2.5 py-1 rounded border border-white/5 whitespace-nowrap"
        style={{ top: randomWatermark.top, left: randomWatermark.left, transform: 'rotate(-5deg)' }}
      >
        🛡 {currentUser?.email || currentUser?.firstName || 'Utilizador'} • MULTIPLUS
      </div>
    </>
  ) : (
    // Sem vídeo disponível
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(10,46,93,0.3)_0%,#040c1a_100%)]">
      <Video size={44} className="text-gold-600/40 mb-2" />
      <h4 className="text-cream-100 text-xs sm:text-sm font-serif font-black text-center max-w-sm mt-1 mb-0 leading-snug">
        Vídeo não disponível
      </h4>
      <span className="text-[10px] font-mono text-neutral-400 mt-2 block">
        O professor ainda não adicionou o vídeo desta aula.
      </span>
    </div>
  )}
</div>
```

### Correção 10.6 — Persistir apontamentos no Supabase

**Localizar a função `handleSaveNote`** (aproximadamente linhas 689-699) que salva notas apenas no estado local.

**Substituir a lógica interna** para salvar no Supabase:

```tsx
const handleSaveNote = async () => {
  if (!newNoteInput.trim() || !currentUser?.id || !selectedCourseId || !currentLecture?.id) return;
  
  try {
    const savedNote = await academicService.saveLessonNote(
      currentUser.id,
      currentLecture.id,
      selectedCourseId,
      newNoteInput.trim(),
      videoPlaySec
    );
    
    setNotesList(prev => [...prev, {
      id: savedNote.id,
      text: savedNote.content,
      date: new Date(savedNote.created_at).toLocaleString('pt-AO'),
      timestamp: savedNote.video_timestamp
    }]);
    
    setNewNoteInput('');
  } catch (err) {
    console.error('Erro ao salvar apontamento:', err);
  }
};
```

**TAMBÉM** adicionar carregamento inicial das notas do Supabase. No `fetchStudentData` ou no `handleCourseChange`, adicionar:

```tsx
// Carregar apontamentos da aula atual
if (currentUser?.id && currentLecture?.id) {
  const notes = await academicService.getLessonNotes(currentUser.id, currentLecture.id);
  setNotesList(notes.map(n => ({
    id: n.id,
    text: n.content,
    date: new Date(n.created_at).toLocaleString('pt-AO'),
    timestamp: n.video_timestamp
  })));
}
```

### Correção 10.7 — Remover fallback de streakCount

**Localizar (linha ~250):**
```tsx
const streakCount = currentUser.streak || 5;
```

**Substituir por:**
```tsx
const streakCount = currentUser.streak || 0;
```

### Correção 10.8 — Remover sincronização falsa com Google Calendar

**Localizar a função `handleSyncGoogleCalendar`** (aproximadamente linhas 605-608) que faz apenas `setIsGoogleSynced(true)`.

**Substituir por:**
```tsx
const handleSyncGoogleCalendar = () => {
  alert('A sincronização com o Google Calendar será implementada numa futura atualização.');
};
```

**TAMBÉM**, remover o estado `isGoogleSynced` se existir, ou mantê-lo mas nunca definir como `true`.

### Correção 10.9 — Remover aulas fallback falsas

**Localizar o bloco de fallback** (aproximadamente linhas 665-684) que cria aulas com IDs `lesson_1_fallback`, `lesson_2_fallback`, `lesson_3_fallback`.

**Substituir por uma lista vazia ou remover completamente.** Se não há aulas reais, o aluno deve ver a mensagem "Nenhuma aula disponível" em vez de aulas fictícias.

---

## CHECKLIST FINAL — Verificar Após Implementação

Após implementar TODAS as correções acima, o Gemini DEVE:

1. ✅ Executar `npm run build` e confirmar que compila sem erros
2. ✅ Procurar por `antonio@advogados.ao` no código — não deve existir
3. ✅ Procurar por `mock-multiplus` no código — não deve existir
4. ✅ Procurar por `lesson_1_fallback` no código — não deve existir
5. ✅ Procurar por `#download-` no código — não deve existir
6. ✅ Procurar por `mat_1` no código — não deve existir
7. ✅ Procurar por `task_1` no código — não deve existir
8. ✅ Procurar por `cert_1` no código — não deve existir
9. ✅ Confirmar que `avatarService.ts` existe em `src/services/supabase/`
10. ✅ Confirmar que `AvatarUpload.tsx` existe em `src/components/`
11. ✅ Confirmar que `004_video_notes_assignments.sql` existe em `supabase/migrations/`
12. ✅ Confirmar que `StudentMaterialsTab.tsx` importa `supabase` e `useAuth`
13. ✅ Confirmar que `StudentTasksTab.tsx` importa `supabase` e `useAuth`
14. ✅ Confirmar que `StudentCertificatesTab.tsx` importa `supabase` e `useAuth`

---

*Documento gerado por Super Z — Orientador de Desenvolvimento MultiPlus Academy*  
*Versão: 016 | Data: 16/07/2026 | Idioma: Português (com acentuação)*  
*Este documento FORNECE o código completo para cada arquivo — basta copiar e colar.*
