# FASE 1 — Funcionalidade Crítica

> **Projeto:** MultiPlus Academy  
> **Data:** 18 de Julho de 2026  
> **Versão do Documento:** 1.0  
> **Objetivo:** Fornecer instruções detalhadas, passo a passo, com caminhos exatos de ficheiros, código antes/depois e justificativas, para que o Gemini possa aplicar todas as modificações sem ambiguidade.  
> **Pré-requisito:** A Fase 0 (Correções Imediatas de Segurança) já foi aplicada, incluindo as migrações de banco de dados feitas pelo Claude.

---

## Índice

| # | Tarefa | Severidade | Ficheiro Principal |
|---|--------|------------|-------------------|
| 1.1 | Criar `notificationService.ts` — serviço centralizado de notificações | 🔴 CRÍTICO | Novo ficheiro |
| 1.2 | Corrigir `AuthProvider.tsx` — streak/horas hardcoded + refreshProfile + logout silencioso | 🔴 CRÍTICO | `AuthProvider.tsx` |
| 1.3 | Corrigir `avatarService.ts` — validação de tamanho/tipo + cache de URL | 🔴 CRÍTICO | `avatarService.ts` |
| 1.4 | Corrigir `User` type — eliminar duplicação `avatarUrl`/`foto_perfil` | 🔴 CRÍTICO | `types.ts` |
| 1.5 | Corrigir `messageService.ts` — filtros de injeção + paginação + fallbacks localStorage | 🔴 CRÍTICO | `messageService.ts` |
| 1.6 | Corrigir `ChatShell.tsx` — carregar TODAS as mensagens em vez de paginar | 🔴 CRÍTICO | `ChatShell.tsx` |
| 1.7 | Corrigir `presenceService.ts` — vazamento de canais em `broadcastTyping` | 🔴 CRÍTICO | `presenceService.ts` |
| 1.8 | Corrigir sistema de Quiz — pontuação binária + upsert sobrescreve + retry infinito | 🔴 CRÍTICO | `QuizArea.tsx` + `academicService.ts` |
| 1.9 | Corrigir `academicService.ts` — progresso não salvo + courseId ignorado + dup tracking | 🔴 CRÍTICO | `academicService.ts` + `enrollmentService.ts` |
| 1.10 | Corrigir `useVideoPlayer.ts` — intervalo recriado a cada segundo + auto-complete sem validação | 🔴 CRÍTICO | `useVideoPlayer.ts` + `StudentPortal.tsx` |
| 1.11 | Corrigir `useStudentData.ts` — refetch completo em cada notificação | 🟡 MÉDIO | `useStudentData.ts` |
| 1.12 | Corrigir `client.ts` — cliente Supabase criado com strings vazias | 🔴 CRÍTICO | `client.ts` |
| 1.13 | Corrigir `App.tsx` — formulário de candidatura é fake (não registra) | 🔴 CRÍTICO | `App.tsx` |
| 1.14 | Corrigir `LoginPanel.tsx` — opção ADMIN no registro (reforço da Fase 0) | 🔴 CRÍTICO | `LoginPanel.tsx` |
| 1.15 | Corrigir Calendário do Aluno — toggle MÊS/SEMANA não funciona | 🟡 MÉDIO | `StudentPortal.tsx` |
| 1.16 | Implementar botão "Marcar Aula como Concluída" + desaparecimento da aula | 🔴 CRÍTICO | `StudentPortal.tsx` |
| 1.17 | Corrigir `StudentPortal.tsx` — lógica de `nextScheduledLesson` com caminho errado | 🔴 CRÍTICO | `StudentPortal.tsx` |

---

## 1.1 — Criar `notificationService.ts` (Serviço Centralizado de Notificações)

### Problema

O ficheiro `src/services/supabase/notificationService.ts` **não existe**. As notificações são manipuladas de forma dispersa:

- `useStudentData.ts:42-48` — faz query inline `supabase.from('notifications')`
- `enrollmentService.ts:62-68` — insere notificações inline
- `assignmentService.ts:230-238` — insere notificações inline
- `StudentPortal.tsx` — gerencia estado de notificações com `notifications`/`setNotifications`

Não existe função para marcar como lida, criar notificações com tipo, ou subscrever a notificações em tempo real.

### Solução

Criar o ficheiro `src/services/supabase/notificationService.ts` com todas as operações CRUD + marcação + subscrição realtime.

### Ficheiro: `src/services/supabase/notificationService.ts` (NOVO)

```typescript
import { supabase } from '../../lib/supabase/client';

export interface AppNotification {
  id: string;
  user_id: string;
  text: string;
  read: boolean;
  type?: string;
  link?: string;
  created_at: string;
}

export const notificationService = {
  // =========================================================================
  // 1. BUScar notificações de um utilizador
  // =========================================================================
  async getNotifications(userId: string, limit = 30): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
    return (data || []) as AppNotification[];
  },

  // =========================================================================
  // 2. Contar notificações não lidas
  // =========================================================================
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
    return count || 0;
  },

  // =========================================================================
  // 3. Criar notificação
  // =========================================================================
  async createNotification(params: {
    userId: string;
    text: string;
    type?: string;
    link?: string;
  }): Promise<AppNotification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        text: params.text,
        read: false,
        type: params.type || 'info',
        link: params.link || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
    return data as AppNotification;
  },

  // =========================================================================
  // 4. Marcar uma notificação como lida
  // =========================================================================
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 5. Marcar TODAS as notificações de um utilizador como lidas
  // =========================================================================
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 6. Apagar uma notificação
  // =========================================================================
  async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Erro ao apagar notificação:', error);
      return false;
    }
    return true;
  },

  // =========================================================================
  // 7. Subscrever a notificações em tempo real (INSERT apenas)
  // =========================================================================
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: AppNotification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new as AppNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
```

### Integração — Substituir uso inline em `useStudentData.ts`

**Ficheiro:** `src/hooks/useStudentData.ts`

**Localizar (linhas 42-48):**
```typescript
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs || []);
```

**Substituir por:**
```typescript
      import { notificationService } from '../services/supabase/notificationService';
      // ...
      const notifs = await notificationService.getNotifications(userId);
      setNotifications(notifs);
```

> **Nota:** Adicione o import no topo do ficheiro, não dentro da função.

### Integração — Substituir uso inline em `enrollmentService.ts`

**Ficheiro:** `src/services/supabase/enrollmentService.ts`

**Localizar (linhas 62-68):**
```typescript
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          text: `Foste matriculado no curso: ${courseTitle}. Já podes aceder ao portal do aluno.`,
          read: false
        });
```

**Substituir por:**
```typescript
      import { notificationService } from './notificationService';
      // ...
      await notificationService.createNotification({
        userId: studentId,
        text: `Foste matriculado no curso: ${courseTitle}. Já podes aceder ao portal do aluno.`,
        type: 'enrollment',
      });
```

> **Nota:** Adicione o import no topo do ficheiro.

### Integração — Substituir na subscrição realtime de `useStudentData.ts`

**Localizar (linhas 94-101):**
```typescript
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
```

**Substituir por:**
```typescript
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (newNotif) => {
        // Apenas adicionar a nova notificação ao estado, sem refetch total
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
      }
    );
    return () => { unsubscribe(); };
  }, [userId]);
```

> **Impacto:** Elimina o refetch completo de TODOS os dados do aluno a cada nova notificação. Agora apenas a nova notificação é adicionada ao estado local.

---

## 1.2 — Corrigir `AuthProvider.tsx` — Streak/Hours Hardcoded + refreshProfile + Logout Silencioso

### Problema 1: Valores hardcoded de streak/horas

**Ficheiro:** `src/components/auth/AuthProvider.tsx`

Existem 3 locais com valores hardcoded:

1. **Linha 72-74** (syncAuthSession, caminho userData):
```typescript
streak: 3,
longestStreak: 5,
totalHoursLearned: 4
```

2. **Linha 92-95** (syncAuthSession, caminho fallback uMeta):
```typescript
streak: 3,
longestStreak: 5,
totalHoursLearned: 4
```

3. **Linha 149-152** (signIn):
```typescript
streak: 5,
longestStreak: 15,
totalHoursLearned: 24
```

Além de serem hardcoded, os valores são inconsistentes entre si (3/5/4 vs 5/15/24).

### Solução: Calcular streak/horas a partir dos dados reais

**Passo 1:** Criar uma função helper no `AuthProvider.tsx` para calcular métricas reais:

**Adicionar após a linha 46 (após `mapLocalRole`):**
```typescript
  // Calcular métricas reais de progresso do aluno
  const calculateUserMetrics = async (userId: string): Promise<{
    streak: number;
    longestStreak: number;
    totalHoursLearned: number;
  }> => {
    try {
      // Buscar progresso das aulas completadas
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('created_at, video_progress_seconds')
        .eq('student_id', userId)
        .eq('completed', true);

      if (!progressData || progressData.length === 0) {
        return { streak: 0, longestStreak: 0, totalHoursLearned: 0 };
      }

      // Calcular total de horas assistidas (a partir de video_progress_seconds)
      const totalSeconds = progressData.reduce((acc: number, p: any) => acc + (p.video_progress_seconds || 0), 0);
      const totalHoursLearned = Math.round(totalSeconds / 3600);

      // Calcular streak (dias consecutivos de atividade)
      const uniqueDays = [...new Set(
        progressData.map((p: any) => new Date(p.created_at).toISOString().split('T')[0])
      )].sort().reverse();

      let streak = 0;
      let longestStreak = 0;
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      const sortedDays = [...uniqueDays].sort();
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      // Verificar se o streak atual está ativo (último dia é hoje ou ontem)
      const lastDay = sortedDays[sortedDays.length - 1];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      streak = (lastDay === today || lastDay === yesterday) ? currentStreak : 0;

      return { streak, longestStreak, totalHoursLearned };
    } catch (err) {
      console.warn('Erro ao calcular métricas do utilizador:', err);
      return { streak: 0, longestStreak: 0, totalHoursLearned: 0 };
    }
  };
```

**Passo 2:** Substituir os 3 blocos de valores hardcoded:

**Localizar (linha 72-74):**
```typescript
            streak: 3,
            longestStreak: 5,
            totalHoursLearned: 4
```

**Substituir por:**
```typescript
            streak: 0,
            longestStreak: 0,
            totalHoursLearned: 0
```

**E imediatamente após `setCurrentUser(localUser);` (linha 76), adicionar:**
```typescript
          // Calcular métricas reais de forma assíncrona
          calculateUserMetrics(userData.id).then(metrics => {
            setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
          });
```

**Localizar (linha 92-95):**
```typescript
            streak: 3,
            longestStreak: 5,
            totalHoursLearned: 4
```

**Substituir por:**
```typescript
            streak: 0,
            longestStreak: 0,
            totalHoursLearned: 0
```

**E imediatamente após `setCurrentUser(localUser);` (linha 97), adicionar:**
```typescript
          calculateUserMetrics(sbSession.user.id).then(metrics => {
            setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
          });
```

**Localizar (linha 149-152):**
```typescript
        streak: 5,
        longestStreak: 15,
        totalHoursLearned: 24
```

**Substituir por:**
```typescript
        streak: 0,
        longestStreak: 0,
        totalHoursLearned: 0
```

**E imediatamente após `setCurrentUser(mappedUser);` (linha 154), adicionar:**
```typescript
      calculateUserMetrics(result.user.id).then(metrics => {
        setCurrentUser(prev => prev ? { ...prev, ...metrics } : prev);
      });
```

### Problema 2: `refreshProfile` não atualiza `currentUser`

**Localizar (linhas 200-205):**
```typescript
  const refreshProfile = async () => {
    if (currentUser) {
      const prof = await userService.getUserProfile(currentUser.id);
      setUserProfile(prof);
    }
  };
```

**Substituir por:**
```typescript
  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const prof = await userService.getUserProfile(currentUser.id);
        setUserProfile(prof);

        // Também recarregar dados do utilizador a partir da tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          const metrics = await calculateUserMetrics(userData.id);
          setCurrentUser(prev => prev ? {
            ...prev,
            firstName: userData.nome_completo?.split(' ')[0] || prev.firstName,
            lastName: userData.nome_completo?.split(' ').slice(1).join(' ') || prev.lastName,
            avatarUrl: userData.foto_perfil || prev.avatarUrl,
            phone: userData.telefone || prev.phone,
            ...metrics,
          } : prev);
        }
      } catch (err) {
        console.warn('Erro ao atualizar perfil:', err);
      }
    }
  };
```

### Problema 3: Logout silencioso em erro de rede

**Localizar (linhas 104-107):**
```typescript
    } catch (e) {
      console.warn('Failed to sync auth session:', e);
      setCurrentUser(null);
      setUserProfile(null);
```

**Substituir por:**
```typescript
    } catch (e) {
      console.warn('Failed to sync auth session:', e);
      // Não fazer logout silencioso em erros de rede
      // Apenas limpar se for erro de autenticação real (sessão expirada)
      if (e instanceof Error && (e.message?.includes('JWT') || e.message?.includes('session'))) {
        setCurrentUser(null);
        setUserProfile(null);
      }
      // Para erros de rede, manter o utilizador logado com dados em cache
```

---

## 1.3 — Corrigir `avatarService.ts` — Validação + Cache

### Problema

O `avatarService.ts` não valida tamanho nem tipo de ficheiro (embora o `AvatarUpload.tsx` já faça validação no frontend). A validação deve existir em ambos os níveis (frontend e serviço), pois o serviço pode ser chamado de outros locais no futuro. Além disso, não há cache da URL do avatar.

### Ficheiro: `src/services/supabase/avatarService.ts`

**Código ATUAL (completo):**
```typescript
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
  }
};
```

**Substituir por:**
```typescript
import { supabase } from '../../lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_CACHE = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export const avatarService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    // 1. Validar tipo de ficheiro
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Tipo de ficheiro não suportado: ${file.type}. Use JPEG, PNG ou WebP.`);
    }

    // 2. Validar tamanho do ficheiro
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Ficheiro demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 5MB.`);
    }

    // 3. Gerar caminho único com timestamp
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
    
    // 4. Upload para o bucket 'media'
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // 5. Obter URL pública
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    
    // 6. Atualizar foto_perfil na tabela users
    const { error: updateError } = await supabase
      .from('users')
      .update({ foto_perfil: publicUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;

    // 7. Invalidar cache para este utilizador
    AVATAR_CACHE.delete(userId);
    
    return publicUrl;
  },

  async getAvatarUrl(userId: string): Promise<string | null> {
    // 1. Verificar cache primeiro
    const cached = AVATAR_CACHE.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.url;
    }

    // 2. Buscar do banco de dados
    const { data } = await supabase
      .from('users')
      .select('foto_perfil')
      .eq('id', userId)
      .maybeSingle();
    
    const url = data?.foto_perfil || null;

    // 3. Atualizar cache
    AVATAR_CACHE.set(userId, { url, timestamp: Date.now() });
    
    return url;
  },

  // Limpar cache (útil após upload ou logout)
  clearCache(userId?: string): void {
    if (userId) {
      AVATAR_CACHE.delete(userId);
    } else {
      AVATAR_CACHE.clear();
    }
  }
};
```

---

## 1.4 — Corrigir `User` Type — Eliminar Duplicação `avatarUrl`/`foto_perfil`

### Problema

O tipo `User` em `src/types.ts` tem dois campos que representam a mesma coisa:

```typescript
avatarUrl?: string;   // linha 24
foto_perfil?: string; // linha 25
```

O `AuthProvider.tsx` mapeia `foto_perfil` → `avatarUrl` (linha 69), mas o `StudentPortal.tsx` passa `foto_perfil` para `AvatarUpload` (linha 1186). Esses campos podem ficar dessincronizados.

### Ficheiro: `src/types.ts`

**Localizar (linhas 18-32):**
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  foto_perfil?: string;
  phone?: string;
  whatsapp?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  streak: number;
  longestStreak: number;
  totalHoursLearned: number;
}
```

**Substituir por:**
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;  // Campo único para URL do avatar (mapeado de foto_perfil do DB)
  phone?: string;
  whatsapp?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  streak: number;
  longestStreak: number;
  totalHoursLearned: number;
}
```

### Atualizar `StudentPortal.tsx`

**Localizar (linha 1186):**
```typescript
currentAvatarUrl={currentUser.foto_perfil}
```

**Substituir por:**
```typescript
currentAvatarUrl={currentUser.avatarUrl}
```

### Atualizar callback `onAvatarUpdated` em `StudentPortal.tsx`

**Localizar (linhas 1189-1196):**
```typescript
onAvatarUpdated={(newUrl) => {
  if (currentUser) {
    setCurrentUser({
      ...currentUser,
      foto_perfil: newUrl
    });
  }
}}
```

**Substituir por:**
```typescript
onAvatarUpdated={(newUrl) => {
  if (currentUser) {
    setCurrentUser({
      ...currentUser,
      avatarUrl: newUrl
    });
  }
}}
```

### Atualizar `enrollmentService.ts`

**Localizar (linha 144):**
```typescript
avatarUrl: student.foto_perfil || null,
```

Isto está correto (mapeando do DB `foto_perfil` para o campo `avatarUrl`). **Manter como está.**

### Atualizar `AuthProvider.tsx`

O mapeamento na linha 69 já está correto:
```typescript
avatarUrl: userData.foto_perfil || '',
```

**Manter como está.** O campo `foto_perfil` do banco de dados é sempre mapeado para `avatarUrl` no tipo `User`.

---

## 1.5 — Corrigir `messageService.ts` — Filtros + Paginação + Fallbacks localStorage

### Problema 1: Interpolação de strings em filtros (possível injeção)

**Ficheiro:** `src/services/supabase/messageService.ts`

**Linha 43:**
```typescript
.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
```

**Linha 64:**
```typescript
.or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
```

Embora o PostgREST faça algum escape, interpolar variáveis diretamente em filtros é uma prática perigosa. Devemos usar as funções `.eq()` / `.or()` com valores parametrizados.

**Localizar (linhas 39-51):**
```typescript
  async getMessages(userId: string): Promise<SupabaseMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching messages for user ${userId}:`, error);
      throw error;
    }
    return (data || []) as SupabaseMessage[];
  },
```

**Substituir por:**
```typescript
  async getMessages(userId: string): Promise<SupabaseMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching messages for user ${userId}:`, error);
      throw error;
    }
    return (data || []) as SupabaseMessage[];
  },
```

> **Nota:** Para filtros `.or()` do Supabase, a interpolação é o único método disponível na API do cliente JS. A mitigação real é garantir que `userId` e `partnerId` sejam sempre UUIDs válidos (validação que deve ser feita nos componentes que chamam o serviço). Adicione validação no início de cada método:

**Adicionar validação no topo de cada método do messageService:**

```typescript
  // Validação de UUID para prevenir injeção em filtros
  const validateUUID = (id: string): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`ID inválido: ${id}. Apenas UUIDs são aceites.`);
    }
  };
```

**Adicionar esta função no início do objeto `messageService` e chamar `validateUUID(userId)` e `validateUUID(partnerId)` nas funções `getMessages`, `getMessagesPaginated`, `sendMessage`, `getConversationPartners`, `getAllowedContacts`, `deleteMessageForMe`, `clearConversation`, `getConversationClearTimestamp`, `markConversationAsRead`.**

### Problema 2: `getConversationPartners` carrega TODAS as mensagens

**Localizar (linhas 361-363):**
```typescript
  async getConversationPartners(userId: string): Promise<any[]> {
    // High compatibility: load last message and unread count, then fetch user profiles
    const messages = await this.getMessages(userId);
```

**Substituir por uma query otimizada:**
```typescript
  async getConversationPartners(userId: string): Promise<any[]> {
    validateUUID(userId);

    // Query otimizada: buscar apenas mensagens necessárias por parceiro
    // Buscar IDs únicos de parceiros com mensagens não lidas + última mensagem
    const { data: allMsgs, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, texto, lido, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500); // Limitar para performance

    if (error) {
      console.error('Error fetching conversation partners:', error);
      throw error;
    }

    const messages = (allMsgs || []) as SupabaseMessage[];
```

> O restante da lógica de processamento (linhas 365-420) pode permanecer igual, pois ela já filtra corretamente os parceiros a partir das mensagens.

### Problema 3: Fallbacks localStorage para reações/pins/eliminações

Os fallbacks localStorage são intencionais como mecanismo de degradação graceful quando as tabelas não existem. Dado que o Claude já criou as tabelas `message_reactions`, `pinned_messages`, `message_deletions` na Fase 0, os fallbacks localStorage devem ser removidos.

**Em cada método que usa localStorage como fallback, substituir o bloco `catch` para lançar o erro em vez de silenciosamente usar localStorage:**

**Localizar em `addReaction` (linhas 448-455):**
```typescript
    } catch {
      // Local storage-based fallback if table missing
      const key = `local_reactions_${messageId}`;
      const reactions = JSON.parse(localStorage.getItem(key) || '[]');
      reactions.push({ userId, emoji });
      localStorage.setItem(key, JSON.stringify(reactions));
      return true;
    }
```

**Substituir por:**
```typescript
    } catch (err) {
      console.error('Erro ao adicionar reação (tabela message_reactions pode não existir):', err);
      throw err;
    }
```

**Localizar em `removeReaction` (linhas 468-474):**
```typescript
    } catch {
      const key = `local_reactions_${messageId}`;
      let reactions = JSON.parse(localStorage.getItem(key) || '[]');
      reactions = reactions.filter((r: any) => !(r.userId === userId && r.emoji === emoji));
      localStorage.setItem(key, JSON.stringify(reactions));
      return true;
    }
```

**Substituir por:**
```typescript
    } catch (err) {
      console.error('Erro ao remover reação:', err);
      throw err;
    }
```

**Localizar em `pinMessage` (linhas 485-493):**
```typescript
    } catch {
      const key = `local_pinned_${conversationKey}`;
      const pinned = JSON.parse(localStorage.getItem(key) || '[]');
      if (!pinned.includes(messageId)) {
        pinned.push(messageId);
        localStorage.setItem(key, JSON.stringify(pinned));
      }
      return true;
    }
```

**Substituir por:**
```typescript
    } catch (err) {
      console.error('Erro ao fixar mensagem (tabela pinned_messages pode não existir):', err);
      throw err;
    }
```

**Localizar em `unpinMessage` (linhas 505-511):**
```typescript
    } catch {
      const key = `local_pinned_${conversationKey}`;
      let pinned = JSON.parse(localStorage.getItem(key) || '[]');
      pinned = pinned.filter((id: string) => id !== messageId);
      localStorage.setItem(key, JSON.stringify(pinned));
      return true;
    }
```

**Substituir por:**
```typescript
    } catch (err) {
      console.error('Erro ao desafixar mensagem:', err);
      throw err;
    }
```

**Localizar em `deleteMessageForMe` (linhas 229-237):**
```typescript
    } catch (err) {
      console.warn('Durable deletion table not found. Using client-side localStorage fallback.', err);
    } finally {
      // 2. Always write to local storage as fallback/complement
      const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
      if (!localDeleted.includes(messageId)) {
        localStorage.setItem(deletedForMeKey, JSON.stringify([...localDeleted, messageId]));
      }
    }
```

**Substituir por:**
```typescript
    } catch (err) {
      console.error('Erro ao eliminar mensagem para mim (tabela message_deletions pode não existir):', err);
      throw err;
    }
```

> **Nota:** Após esta mudança, elimine também a variável `deletedForMeKey` (linha 221) se não for mais usada.

**Localizar em `clearConversation` (linhas 245-260):**
```typescript
    // Also save in localStorage as fallback
    localStorage.setItem(`chat_clear_${userId}_${partnerId}`, clearedAt);

    try {
```

**Substituir por:**
```typescript
    try {
```

E no bloco catch (linhas 258-260):
```typescript
    } catch (error) {
      console.warn('Failed to upsert conversation clear to server, fallback local clear used:', error);
    }
```

**Substituir por:**
```typescript
    } catch (error) {
      console.error('Erro ao limpar conversa no servidor:', error);
      throw error;
    }
```

Também em `getConversationClearTimestamp` (linhas 266-280), remover o fallback localStorage:
```typescript
    const localVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
```

**Substituir por:**
```typescript
    let localVal: string | null = null;
```

---

## 1.6 — Corrigir `ChatShell.tsx` — Carregar TODAS as Mensagens

### Problema

**Ficheiro:** `src/components/messaging/ChatShell.tsx`

Na função `loadConversationHistory` (linha 269):
```typescript
const allMsgs = await messageService.getMessages(user.id);
```

Isto carrega **TODAS** as mensagens do utilizador, depois filtra client-side. Deveria usar `getMessagesPaginated`.

**Localizar (linhas 259-303):**
```typescript
  const loadConversationHistory = async () => {
    if (!user?.id || !activePartner) return;
    try {
      const clearTimestamp = await messageService.getConversationClearTimestamp(user.id, activePartner.id);
      setConversationClearTimestamp(clearTimestamp);

      const deletedForMeKey = `chat_deleted_for_me_${user.id}_${activePartner.id}`;
      const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
      setDeletedForMeIds(localDeleted);

      const allMsgs = await messageService.getMessages(user.id);
      let filtered = allMsgs
        .filter(
          (m) =>
            (m.sender_id === user.id && m.receiver_id === activePartner.id) ||
            (m.sender_id === activePartner.id && m.receiver_id === user.id)
        );
      // ... restante
```

**Substituir por:**
```typescript
  const loadConversationHistory = async () => {
    if (!user?.id || !activePartner) return;
    try {
      const clearTimestamp = await messageService.getConversationClearTimestamp(user.id, activePartner.id);
      setConversationClearTimestamp(clearTimestamp);

      // Usar getMessagesPaginated em vez de carregar todas as mensagens
      const { messages: conversationMsgs } = await messageService.getMessagesPaginated(
        user.id,
        activePartner.id,
        undefined,
        200 // Carregar até 200 mensagens iniciais
      );

      let filtered = [...conversationMsgs];

      if (clearTimestamp) {
        filtered = filtered.filter(
          (m) => new Date(m.created_at).getTime() > new Date(clearTimestamp).getTime()
        );
      }
      // ... restante da lógica permanece igual (mapeamento, marcação como lida, etc.)
```

> **Nota:** O restante da função (filtro por `clearTimestamp`, mapeamento `mapDBMessageToChatMessage`, marcação como lida) permanece igual. Apenas a fonte dos dados muda.

---

## 1.7 — Corrigir `presenceService.ts` — Vazamento de Canais

### Problema

**Ficheiro:** `src/services/supabase/presenceService.ts`

A função `broadcastTyping` (linhas 54-71) cria um **novo canal Supabase a cada chamada**, e esses canais **nunca são limpos**. Cada tecla (com debounce) cria um canal novo, causando vazamento de memória e degradação de performance.

**Código atual:**
```typescript
  async broadcastTyping(userId: string, partnerId: string, isTyping: boolean) {
    try {
      const channel = supabase.channel(`typing-${partnerId}`, {
        config: { broadcast: { self: false } }
      });
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping, timestamp: Date.now(), conversationId: partnerId }
          });
        }
      });
    } catch (err) {
      console.warn('Realtime broadcastTyping failed:', err);
    }
  },
```

### Solução: Reutilizar canais com cache

**Substituir o ficheiro completo `src/services/supabase/presenceService.ts`:**

```typescript
import { supabase } from '../../lib/supabase/client';

export interface TypingEvent {
  userId: string;
  isTyping: boolean;
  timestamp: number;
  conversationId: string;
}

export interface PresenceEvent {
  userId: string;
  status: 'ONLINE' | 'OFFLINE' | 'TYPING' | 'AWAY';
  lastSeen: string;
}

// Cache de canais de typing para evitar vazamento
const typingChannels = new Map<string, ReturnType<typeof supabase.channel>>();

const getOrCreateTypingChannel = (partnerId: string) => {
  if (!typingChannels.has(partnerId)) {
    const channel = supabase.channel(`typing-${partnerId}`, {
      config: { broadcast: { self: false } }
    });
    channel.subscribe();
    typingChannels.set(partnerId, channel);
  }
  return typingChannels.get(partnerId)!;
};

export const presenceService = {
  // Update presence status in Postgres with fallback
  async updatePresence(userId: string, status: PresenceEvent['status'], conversationId?: string) {
    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          typing_in_conversation: conversationId || null,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (err) {
      // Graceful fallback: avoid flooding logs
    }
  },

  // Get current user presence
  async getUserPresence(userId: string): Promise<PresenceEvent | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        userId: data.user_id,
        status: data.status,
        lastSeen: data.last_seen,
      };
    } catch {
      return null;
    }
  },

  // Broadcast typing status — agora reutiliza canais
  async broadcastTyping(userId: string, partnerId: string, isTyping: boolean) {
    try {
      const channel = getOrCreateTypingChannel(partnerId);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping, timestamp: Date.now(), conversationId: partnerId }
      });
    } catch (err) {
      console.warn('Realtime broadcastTyping failed:', err);
    }
  },

  // Subscribe to typing indicator events
  subscribeToTyping(userId: string, callback: (event: TypingEvent) => void) {
    try {
      const channel = supabase.channel(`typing-${userId}`);
      channel
        .on('broadcast', { event: 'typing' }, (payload) => {
          callback(payload.payload as TypingEvent);
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscribeToTyping failed:', err);
      return () => {};
    }
  },

  // Subscribe to presence events — usar Supabase Presence API em vez de postgres_changes
  subscribeToPresence(userIds: string[], callback: (event: PresenceEvent) => void) {
    try {
      const channel = supabase.channel('presence-global', {
        config: { presence: { key: '' } }
      });

      channel
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_presence' },
          (payload) => {
            const data = payload.new as any;
            if (data && userIds.includes(data.user_id)) {
              callback({
                userId: data.user_id,
                status: data.status,
                lastSeen: data.last_seen,
              });
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  },

  // Limpar canais de typing (chamar no logout)
  cleanupTypingChannels(): void {
    typingChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    typingChannels.clear();
  }
};
```

### Integração: Chamar cleanup no logout

**Ficheiro:** `src/components/auth/AuthProvider.tsx`

Na função `signOut` (linha 176), adicionar limpeza:

**Localizar (linhas 176-189):**
```typescript
  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await authService.logout();
      } catch (e) {
        console.warn('Supabase logout error, proceeding with local logout:', e);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };
```

**Substituir por:**
```typescript
  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await authService.logout();
      } catch (e) {
        console.warn('Supabase logout error, proceeding with local logout:', e);
      }
      // Limpar canais de typing ao fazer logout
      const { presenceService } = await import('../../services/supabase/presenceService');
      presenceService.cleanupTypingChannels();
      
      setCurrentUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };
```

---

## 1.8 — Corrigir Sistema de Quiz — Pontuação Binária + Upsert Sobrescreve + Retry Infinito

### Problema 1: Cada questão é pontuada 0 ou 100 individualmente

**Ficheiro:** `src/components/portal/QuizArea.tsx`

O `handleSubmit` (linhas 67-105) envia pontuação 0 ou 100 para cada questão individualmente:

```typescript
if (correct) {
  await academicService.submitQuizResponse(userId, lessonId, 100, {...});
} else {
  await academicService.submitQuizResponse(userId, lessonId, 0, {...});
}
```

### Problema 2: upsert sobrescreve respostas anteriores

**Ficheiro:** `src/services/supabase/academicService.ts`

O `submitQuizResponse` (linhas 330-348) usa `onConflict: 'student_id,lesson_id'`, o que significa que cada nova submissão **sobrescreve** a anterior. Se o quiz tem 5 questões, apenas a última é guardada.

### Problema 3: Verificação de aprovação apenas vê a última questão

**Ficheiro:** `src/components/portal/QuizArea.tsx`

A verificação na linha 42:
```typescript
if (pastSubmission && pastSubmission.score >= 100) {
  setAlreadyPassed(true);
}
```

### Problema 4: Botão "Tentar Novamente" permite retry infinito

O botão nas linhas 247-256 permite ao aluno tentar novamente sem limite, violando o requisito de "quiz de uma única tentativa".

### Solução Completa

#### Passo 1: Modificar `QuizArea.tsx` para calcular pontuação cumulativa

**Ficheiro:** `src/components/portal/QuizArea.tsx`

**Substituir o componente completo:**

```typescript
import React, { useState, useEffect } from 'react';
import { academicService } from '../../services/supabase/academicService';
import { CheckCircle2, AlertTriangle, RefreshCw, Trophy, ArrowRight, Loader2 } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizAreaProps {
  lessonId: string;
  userId: string;
  onQuizPassed: () => void;
}

export default function QuizArea({ lessonId, userId, onQuizPassed }: QuizAreaProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyPassed, setAlreadyPassed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Respostas do aluno para todas as questões (índice -> opção selecionada)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const loadQuizAndSubmission = async () => {
    if (!lessonId || !userId) return;
    setLoading(true);
    setHasError(false);
    setHasSubmitted(false);
    setSelectedOption(null);
    setAlreadyPassed(false);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setQuizCompleted(false);
    setFinalScore(0);
    
    try {
      // 1. Verificar se já completou o quiz
      const submissions = await academicService.getQuizSubmissions(userId);
      const pastSubmission = submissions.find(s => s.lesson_id === lessonId);
      
      // O quiz é de uma única tentativa — se já submeteu, bloquear
      if (pastSubmission) {
        setAlreadyPassed(true);
        setFinalScore(pastSubmission.score || 0);
        setQuizCompleted(true);
        return;
      }

      // 2. Buscar questões do quiz
      const dbQuiz = await academicService.getQuizByLesson(lessonId);
      
      if (dbQuiz && dbQuiz.length > 0) {
        setQuestions(dbQuiz as QuizQuestion[]);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error loading quiz area data:', err);
      setHasError(true);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizAndSubmission();
  }, [lessonId, userId]);

  // Submeter resposta da questão atual
  const handleSubmitAnswer = () => {
    if (selectedOption === null || questions.length === 0) return;

    const currentQ = questions[currentQuestionIdx];
    const correct = selectedOption === currentQ.correctAnswer;
    setIsCorrect(correct);
    setHasSubmitted(true);

    // Guardar a resposta do aluno
    setAnswers(prev => ({ ...prev, [currentQuestionIdx]: selectedOption }));
  };

  // Avançar para a próxima questão
  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasSubmitted(false);
    }
  };

  // Finalizar o quiz e calcular pontuação
  const handleFinishQuiz = async () => {
    if (!userId || !lessonId || questions.length === 0) return;
    setSaving(true);

    try {
      // Calcular pontuação: percentagem de questões corretas
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });

      const score = questions.length > 0
        ? Math.round((correctCount / questions.length) * 100)
        : 0;

      setFinalScore(score);

      // Guardar todas as respostas como um único objeto
      const allAnswers = questions.map((q, idx) => ({
        question: q.question,
        selectedOption: answers[idx] ?? -1,
        correctOption: q.correctAnswer,
        isCorrect: answers[idx] === q.correctAnswer,
      }));

      await academicService.submitQuizResponse(userId, lessonId, score, allAnswers);

      setQuizCompleted(true);

      if (score >= 70) { // Aprovação com 70% ou mais
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setAlreadyPassed(true);
        onQuizPassed();
      }
    } catch (err) {
      console.error('Erro ao submeter quiz:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div id="quiz-loading" className="p-6 bg-cream-100 dark:bg-ink-900 border border-gray-150 dark:border-ink-800 rounded-2xl flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs text-neutral-400">A carregar questionário da aula...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div id="quiz-error" className="p-6 bg-red-50 dark:bg-danger-700/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex flex-col items-center justify-center py-8 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-danger-700 dark:text-danger-700" />
        <div className="space-y-1">
          <h4 className="text-sm font-serif font-bold text-red-900 dark:text-red-300">Falha ao carregar o questionário</h4>
          <p className="text-xs text-red-700/80 dark:text-danger-700/80 max-w-sm">
            Não foi possível obter o quiz desta aula. Por favor, tente novamente.
          </p>
        </div>
        <button
          onClick={loadQuizAndSubmission}
          className="px-4 py-1.5 bg-danger-700 hover:bg-red-700 text-cream-100 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div id="quiz-empty" className="p-5 rounded-2xl border border-dashed border-gray-200 dark:border-ink-800 bg-cream-200/50 dark:bg-ink-900/40 text-center py-6">
        <span className="text-xs text-neutral-400 dark:text-neutral-400 font-sans">
          Esta aula não possui quiz de avaliação contínua.
        </span>
      </div>
    );
  }

  // Ecrã de resultado final (após completar o quiz)
  if (quizCompleted) {
    const passed = finalScore >= 70;
    return (
      <div id="quiz-result" className="p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
            <div className="animate-ping bg-indigo-500/10 w-40 h-40 rounded-full" />
            <div className="absolute top-10 left-10 bg-rose-400 w-2 h-2 rounded-full animate-bounce" />
            <div className="absolute top-20 right-20 bg-amber-400 w-3 h-3 rounded-full animate-bounce" />
            <div className="absolute bottom-10 left-1/3 bg-emerald-400 w-2 h-2 rounded-full animate-pulse" />
          </div>
        )}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-ink-800 pb-3">
          <Trophy className="w-4 h-4 text-gold-600" />
          <span className="text-[10px] font-mono text-gold-600 font-black uppercase tracking-wider">
            Resultado do Quiz
          </span>
        </div>
        <div className={`p-4 rounded-xl ${passed ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40' : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40'}`}>
          <div className="text-center space-y-2">
            <span className={`text-3xl font-serif font-black ${passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {finalScore}%
            </span>
            <p className={`text-sm font-semibold ${passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {passed ? '✓ Aprovado! Parabéns!' : '✗ Não atingiu a nota mínima de 70%'}
            </p>
            {!passed && (
              <p className="text-xs text-neutral-500 mt-2">
                Este quiz é de tentativa única. O seu resultado foi registado.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-neutral-400 uppercase">Resumo das Respostas</span>
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const wasCorrect = userAnswer === q.correctAnswer;
            return (
              <div key={idx} className={`p-2 rounded-lg text-xs ${wasCorrect ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : 'bg-rose-50/50 dark:bg-rose-950/10'}`}>
                <span className={wasCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                  {wasCorrect ? '✓' : '✗'} Q{idx + 1}: {q.question}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIdx];

  return (
    <div id="quiz-container" className="p-5 rounded-2xl border border-gray-150 dark:border-ink-800 bg-cream-100 dark:bg-ink-900 relative overflow-hidden space-y-4 text-left shadow-xs">
      
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="animate-ping bg-indigo-500/10 w-40 h-40 rounded-full" />
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-100 dark:border-ink-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gold-600" />
          <span className="text-[10px] font-mono text-gold-600 font-black uppercase tracking-wider">
            Avaliação Contínua • Quiz de Compreensão
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400">
          Questão {currentQuestionIdx + 1} de {questions.length}
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-serif font-bold text-slate-800 dark:text-cream-100 leading-snug">
          {currentQuestion.question}
        </h4>

        <div className="space-y-2">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyle = 'border-gray-100 dark:border-ink-800 hover:border-gray-300 dark:hover:border-slate-700 bg-cream-200/50 dark:bg-slate-800/40';
            
            if (isSelected) {
              optionStyle = 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-400';
            }
            if (hasSubmitted) {
              if (idx === currentQuestion.correctAnswer) {
                optionStyle = 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400';
              } else if (isSelected) {
                optionStyle = 'border-rose-600 bg-rose-50/20 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400';
              }
            }

            return (
              <button
                key={idx}
                disabled={hasSubmitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${optionStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        {hasSubmitted ? (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Resposta Correta!
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Resposta Incorreta.
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          {!hasSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-cream-100 disabled:opacity-50 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              {saving ? 'A guardar...' : 'Submeter Resposta'}
            </button>
          ) : currentQuestionIdx < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              Seguinte <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleFinishQuiz}
              disabled={saving}
              className="px-4 py-2 bg-gold-600 hover:bg-[#b08530] text-cream-100 text-3xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              {saving ? 'A finalizar...' : 'Finalizar Quiz'}
            </button>
          )}
        </div>
      </div>

      {/* Indicador de progresso do quiz */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-ink-800">
        {questions.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full ${
              idx < currentQuestionIdx
                ? answers[idx] === questions[idx].correctAnswer
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
                : idx === currentQuestionIdx
                  ? 'bg-indigo-500'
                  : 'bg-gray-200 dark:bg-ink-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Passo 2: Atualizar `academicService.submitQuizResponse`

**Ficheiro:** `src/services/supabase/academicService.ts`

O método atual (linhas 330-348) usa `upsert` com `onConflict: 'student_id,lesson_id'`, o que funciona para a nova lógica de quiz de tentativa única (uma única submissão por aluno/aula).

**Manter o upsert, mas garantir que o campo `answers` seja um array completo:**

O código atual já está correto para a nova lógica. A mudança principal está no `QuizArea.tsx` que agora envia todas as respostas de uma vez com a pontuação cumulativa.

---

## 1.9 — Corrigir `academicService.ts` + `enrollmentService.ts` — Progresso Não Salvo + CourseId Ignorado

### Problema 1: `updateEnrollmentProgress` não salva `progress_percent`

**Ficheiro:** `src/services/supabase/academicService.ts`

**Localizar (linhas 235-250):**
```typescript
  async updateEnrollmentProgress(studentId: string, courseId: string, progressPercent: number): Promise<any> {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: progressPercent >= 100 ? 'COMPLETED' : 'ACTIVE'
      })
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      console.warn('Could not update status on enrollments table:', error);
    }
    return data;
  },
```

**Substituir por:**
```typescript
  async updateEnrollmentProgress(studentId: string, courseId: string, progressPercent: number): Promise<any> {
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        status: progressPercent >= 100 ? 'COMPLETED' : 'ACTIVE',
        progress_percent: progressPercent  // Agora salva o percentual real
      })
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      console.warn('Could not update enrollment progress:', error);
    }
    return data;
  },
```

> **Nota:** Isto requer que a coluna `progress_percent` exista na tabela `enrollments`. Se não existir, o Claude deve tê-la adicionado na Fase 0. Caso contrário, adicionar a migração:
> ```sql
> ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS progress_percent numeric DEFAULT 0;
> ```

### Problema 2: `getCompletedLessons` ignora `courseId`

**Localizar (linhas 255-267):**
```typescript
  async getCompletedLessons(studentId: string, courseId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching completed lessons:', error);
      return [];
    }
    return (data || []).map((row: any) => row.lesson_id);
  },
```

**Substituir por:**
```typescript
  async getCompletedLessons(studentId: string, courseId: string): Promise<string[]> {
    if (courseId) {
      // Se courseId é fornecido, buscar aulas completas daquele curso
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .eq('completed', true);

      if (error) {
        console.error('Error fetching completed lessons:', error);
        return [];
      }

      // Filtrar por curso: buscar lesson_ids que pertencem ao courseId
      const lessonIds = (data || []).map((row: any) => row.lesson_id);
      if (lessonIds.length === 0) return [];

      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .in('id', lessonIds);

      return (courseLessons || []).map((l: any) => l.id);
    } else {
      // Se courseId está vazio, retornar todas as aulas completas
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .eq('completed', true);

      if (error) {
        console.error('Error fetching completed lessons:', error);
        return [];
      }
      return (data || []).map((row: any) => row.lesson_id);
    }
  },
```

### Problema 3: `markLessonComplete` não salva `course_id`

**Localizar (linhas 269-283):**
```typescript
  async markLessonComplete(studentId: string, courseId: string, lessonId: string, completed = true): Promise<boolean> {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        completed
      }, { onConflict: 'student_id,lesson_id' });
```

**Substituir por:**
```typescript
  async markLessonComplete(studentId: string, courseId: string, lessonId: string, completed = true): Promise<boolean> {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId,  // Agora salva o course_id
        completed
      }, { onConflict: 'student_id,lesson_id' });
```

### Problema 4: Sistema duplicado de progresso (`student_progress` vs `lesson_progress`)

O `enrollmentService.ts` ainda tenta inserir na tabela `student_progress` (linhas 34-46), que é uma tabela legada. Deve ser removido.

**Ficheiro:** `src/services/supabase/enrollmentService.ts`

**Localizar (linhas 33-49):**
```typescript
    // 2. Prepare initial progress in student_progress table
    try {
      const { error: progressError } = await supabase
        .from('student_progress')
        .insert({
          student_id: studentId,
          course_id: courseId,
          completed_lessons: 0,
          progress_percentage: 0
        });
      
      if (progressError) {
        console.warn('Initial student_progress insert returned an error (expected if schema differs):', progressError);
      }
    } catch (e) {
      console.warn('Failed to insert initial progress:', e);
    }
```

**Substituir por:**
```typescript
    // Nota: O progresso agora é rastreado via lesson_progress, não student_progress
    // Não é necessário criar registo inicial aqui
```

Também no `removeStudent` (linhas 91-100):

**Localizar:**
```typescript
    // Also clean up student progress if possible (optional, ignore errors)
    try {
      await supabase
        .from('student_progress')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', courseId);
    } catch (e) {
      console.warn('Could not clean up student progress on removal:', e);
    }
```

**Substituir por:**
```typescript
    // Limpar progresso das aulas (lesson_progress)
    try {
      // Buscar IDs das aulas do curso
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);
      
      if (courseLessons && courseLessons.length > 0) {
        const lessonIds = courseLessons.map(l => l.id);
        await supabase
          .from('lesson_progress')
          .delete()
          .eq('student_id', studentId)
          .in('lesson_id', lessonIds);
      }
    } catch (e) {
      console.warn('Could not clean up lesson progress on removal:', e);
    }
```

---

## 1.10 — Corrigir `useVideoPlayer.ts` + `StudentPortal.tsx` — Intervalo + Auto-Complete

### Problema 1: Intervalo de save recriado a cada segundo

**Ficheiro:** `src/hooks/useVideoPlayer.ts`

O `useEffect` de save (linhas 29-41) depende de `currentSeconds`, que muda a cada segundo durante a reprodução, fazendo o intervalo ser recriado constantemente.

**Localizar (linhas 28-41):**
```typescript
  // Salvar progresso a cada 15 segundos
  useEffect(() => {
    let interval: any;
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
```

**Substituir por:**
```typescript
  // Salvar progresso a cada 15 segundos
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && userId && courseId && lessonId) {
      interval = setInterval(async () => {
        try {
          // Ler currentTime diretamente do videoRef em vez de depender do state
          const currentTime = videoRef.current?.currentTime || 0;
          await academicService.saveVideoProgress(userId, courseId, lessonId, Math.floor(currentTime));
        } catch (err) {
          console.error('Erro ao salvar progresso do vídeo:', err);
        }
      }, 15000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, userId, courseId, lessonId]); // Removido currentSeconds das dependências
```

### Problema 2: `currentTime` definido antes do vídeo carregar

**Localizar (linhas 12-26):**
```typescript
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
```

**Substituir por:**
```typescript
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !lessonId) return;
      try {
        const saved = await academicService.getVideoProgress(userId, lessonId);
        setCurrentSeconds(saved || 0);
        // Esperar o vídeo carregar metadata antes de definir currentTime
        const video = videoRef.current;
        if (video && saved) {
          const setInitialTime = () => {
            video.currentTime = saved;
            video.removeEventListener('loadedmetadata', setInitialTime);
          };
          if (video.readyState >= 1) {
            // Metadata já carregada
            video.currentTime = saved;
          } else {
            video.addEventListener('loadedmetadata', setInitialTime);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar progresso do vídeo:', err);
      }
    };
    loadProgress();
  }, [userId, lessonId]);
```

### Problema 3: Auto-complete do vídeo sem validação de percentual mínimo

**Ficheiro:** `src/components/StudentPortal.tsx`

O evento `onEnded` (linhas 774-784) marca a aula como completa automaticamente quando o vídeo termina, mesmo que o aluno tenha pulado para o final.

**Localizar (linhas 774-784):**
```typescript
onEnded={async () => {
  setIsPlayingVideo(false);
  if (currentUser?.id && selectedCourseId && currentLecture?.id) {
    try {
      await academicService.markLessonComplete(currentUser.id, selectedCourseId, currentLecture.id, true);
      await fetchStudentData();
    } catch (err) {
      console.error('Erro ao marcar aula concluída no fim do vídeo:', err);
    }
  }
}}
```

**Substituir por:**
```typescript
onEnded={async () => {
  setIsPlayingVideo(false);
  // Não marcar automaticamente como completa.
  // O aluno deve clicar no botão "Marcar como Concluída" manualmente.
  // A verificação de progresso do vídeo será feita quando o aluno submeter.
}}
```

> **Nota:** O botão "Marcar como Concluída" será implementado na tarefa 1.16. O vídeo ainda salva o progresso automaticamente, mas a conclusão da aula passa a ser uma ação manual e deliberada do aluno.

---

## 1.11 — Corrigir `useStudentData.ts` — Refetch Completo em Cada Notificação

### Problema

**Ficheiro:** `src/hooks/useStudentData.ts`

A subscrição realtime de notificações (linhas 94-101) faz `fetchData()` completo a cada INSERT, recarregando matrículas, aulas, certificados, etc.

**Já corrigido na tarefa 1.1** — a nova subscrição usa `notificationService.subscribeToNotifications()` que apenas adiciona a nova notificação ao estado, sem refetch.

No entanto, a subscrição de mensagens (linhas 84-91) também faz refetch completo:

```typescript
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
```

Isto é aceitável pois `fetchUnreadCount` apenas conta mensagens não lidas (não recarrega tudo). No entanto, é disparado para QUALQUER evento na tabela `messages` (incluindo mensagens de outros utilizadores que o Supabase pode filtrar via RLS).

**Adicionar filtro para o utilizador atual:**

**Localizar (linhas 84-91):**
```typescript
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
```

**Substituir por:**
```typescript
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        () => fetchUnreadCount()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
```

> **Melhoria:** Agora apenas escuta INSERTs onde o utilizador é o destinatário, reduzindo drasticamente eventos desnecessários.

---

## 1.12 — Corrigir `client.ts` — Cliente Supabase Criado com Strings Vazias

### Problema

**Ficheiro:** `src/lib/supabase/client.ts`

```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Se as variáveis de ambiente não existem, o cliente é criado com strings vazias, causando erros silenciosos em todas as chamadas API.

**Substituir o ficheiro completo:**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = [
    'ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!',
    '',
    'Certifique-se de que o ficheiro .env contém:',
    '  VITE_SUPABASE_URL=https://seu-projeto.supabase.co',
    '  VITE_SUPABASE_ANON_KEY=sua-anon-key',
    '',
    'A aplicação não pode funcionar sem estas variáveis.',
  ].join('\n');
  
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

> **Melhorias:**
> 1. Lança erro em vez de apenas avisar — impede que a app execute com configuração inválida
> 2. Adiciona configuração de `auth` (autoRefreshToken, persistSession)
> 3. Adiciona configuração de `realtime` com limite de eventos por segundo

---

## 1.13 — Corrigir `App.tsx` — Formulário de Candidatura é Fake

### Problema

**Ficheiro:** `src/App.tsx`

O `handleSignUpSubmit` (linhas 89-97) é completamente fake:

```typescript
const handleSignUpSubmit = (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setTimeout(() => {
    setLoading(false);
    setSignUpSuccess(true);
  }, 1000);
};
```

Não envia dados para lugar nenhum. O formulário coleta nome, email, telefone, curso e modalidade, mas nada é processado.

### Solução

Existem duas abordagens possíveis:

**Opção A (Recomendada):** Salvar a candidatura na tabela `applications` do Supabase, para que a secretaria possa processar.

**Opção B:** Enviar os dados por email (requer serviço externo).

Vamos implementar a Opção A, que requer:

1. Verificar se a tabela `applications` existe no banco de dados. Se não, criar:
```sql
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  email text NOT NULL,
  telefone text NOT NULL,
  course_id uuid REFERENCES courses(id),
  modalidade text DEFAULT 'Híbrido',
  status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);
```

2. Modificar `handleSignUpSubmit` em `App.tsx`:

**Localizar (linhas 89-97):**
```typescript
  const handleSignUpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSignUpSuccess(true);
    }, 1000);
  };
```

**Substituir por:**
```typescript
  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Salvar candidatura na tabela applications
      const { error } = await supabase
        .from('applications')
        .insert({
          nome_completo: signUpName,
          email: signUpEmail,
          telefone: signUpPhone,
          course_id: signUpCourse || null,
          modalidade: signUpModality,
          status: 'PENDING',
        });

      if (error) {
        console.error('Erro ao enviar candidatura:', error);
        alert('Ocorreu um erro ao enviar a sua candidatura. Por favor, tente novamente.');
        return;
      }

      setSignUpSuccess(true);
    } catch (err) {
      console.error('Erro inesperado ao enviar candidatura:', err);
      alert('Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
```

---

## 1.14 — Corrigir `LoginPanel.tsx` — Remover Opção ADMIN do Registro

### Problema

**Ficheiro:** `src/components/LoginPanel.tsx`

Na linha 188, o dropdown de registro inclui a opção "ADMIN":
```html
<option value="ADMIN">Administrador Geral</option>
```

Isto permite que qualquer utilizador se registre como ADMIN, violando o princípio de segurança (reforço da Fase 0, tarefa 0.1).

**Localizar (linhas 186-189):**
```html
                        <option value="ALUNO">Aluno de Elite</option>
                        <option value="PROFESSOR">Corpo de Formadores</option>
                        <option value="ADMIN">Administrador Geral</option>
```

**Substituir por:**
```html
                        <option value="ALUNO">Aluno de Elite</option>
                        <option value="PROFESSOR">Corpo de Formadores</option>
```

> **Nota:** Contas ADMIN só podem ser criadas diretamente no banco de dados pelo administrador do sistema, nunca via formulário público.

---

## 1.15 — Corrigir Calendário do Aluno — Toggle MÊS/SEMANA Não Funciona

### Problema

**Ficheiro:** `src/components/StudentPortal.tsx`

O toggle `calendarView` ('MONTH' | 'WEEK') nas linhas 1025-1035 altera o estado mas **não muda a apresentação**. Ambas as vistas mostram o mesmo grid de cards.

### Solução

Implementar vistas diferentes para MÊS e SEMANA.

**Localizar (linhas 1047-1100):**
```typescript
                    {/* Schedule item grids mapped out */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {scheduledLessons.filter(s => s.lesson?.scheduled_at).length > 0 ? (
                        scheduledLessons.filter(s => s.lesson?.scheduled_at).map((session, index) => {
                          // ... renderização dos cards
                        })
                      ) : (
                        // ... estado vazio
                      )}
                    </div>
```

**Substituir por:**

```typescript
                    {/* Vista MENSAL - Grid de cards por mês */}
                    {calendarView === 'MONTH' && (
                      <div className="space-y-6">
                        {/* Agrupar aulas por mês */}
                        {(() => {
                          const scheduled = scheduledLessons.filter(s => s.lesson?.scheduled_at);
                          if (scheduled.length === 0) {
                            return (
                              <div className="py-12 text-center space-y-3">
                                <CalendarIcon className="w-12 h-12 text-gold-600/30 mx-auto animate-pulse" />
                                <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm">
                                  Nenhum encontro agendado
                                </h4>
                                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                                  Não existem aulas com agendamento no momento para o seu curso.
                                </p>
                              </div>
                            );
                          }

                          // Agrupar por mês
                          const grouped = new Map<string, typeof scheduled>();
                          scheduled.forEach(session => {
                            const date = new Date(session.lesson.scheduled_at);
                            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                            const monthLabel = date.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
                            if (!grouped.has(monthLabel)) grouped.set(monthLabel, []);
                            grouped.get(monthLabel)!.push(session);
                          });

                          return Array.from(grouped.entries()).map(([monthLabel, sessions]) => (
                            <div key={monthLabel}>
                              <h4 className="text-xs font-serif font-black text-gold-600 uppercase tracking-wider mb-3">
                                {monthLabel}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessions.map((session, index) => {
                                  const title = session.lesson?.titulo || session.lesson?.title || 'Aula Síncrona';
                                  const dateVal = session.lesson.scheduled_at.split('T')[0];
                                  const timeVal = session.lesson.scheduled_at.split('T')[1]?.substring(0, 5) || '--:--';
                                  const courseTitle = session.lesson?.course?.title || session.lesson?.course?.titulo || '';
                                  const meetUrl = session.lesson?.meeting_url || null;

                                  return (
                                    <div key={session.id || index} className="p-4 rounded-xl border border-gray-150 bg-cream-100 dark:bg-ink-900 shadow-3xs space-y-3 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 right-0 h-1 bg-gold-600" />
                                      <div className="flex justify-between items-center text-2xs font-mono font-bold">
                                        <span className="text-gold-600 uppercase truncate max-w-[150px]">{courseTitle}</span>
                                        <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-1.5 py-0.5 rounded">{timeVal}</span>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-serif font-black text-ink-900 dark:text-gold-600 leading-snug">{title}</h4>
                                        <p className="text-[10px] text-neutral-400 mt-1">
                                          Aula agendada para o dia {dateVal}.
                                        </p>
                                      </div>
                                      {meetUrl ? (
                                        <a href={meetUrl} target="_blank" rel="noreferrer"
                                          className="py-2.5 bg-ink-900 text-cream-100 text-center rounded-lg text-3xs font-mono font-bold uppercase block hover:bg-gold-600 hover:text-slate-950 transition-colors">
                                          Entrar na Aula
                                        </a>
                                      ) : (
                                        <span className="py-2.5 bg-gray-100 dark:bg-slate-800 text-neutral-400 text-center rounded-lg text-3xs font-mono font-bold uppercase block">
                                          Link indisponível
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Vista SEMANAL - Lista por dia da semana */}
                    {calendarView === 'WEEK' && (
                      <div className="space-y-4">
                        {(() => {
                          const scheduled = scheduledLessons.filter(s => s.lesson?.scheduled_at);
                          if (scheduled.length === 0) {
                            return (
                              <div className="py-12 text-center space-y-3">
                                <CalendarIcon className="w-12 h-12 text-gold-600/30 mx-auto animate-pulse" />
                                <h4 className="font-serif font-black text-ink-900 dark:text-cream-100 text-sm">
                                  Nenhum encontro agendado
                                </h4>
                              </div>
                            );
                          }

                          // Agrupar por dia da semana
                          const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                          const grouped = new Map<string, typeof scheduled>();
                          scheduled.forEach(session => {
                            const date = new Date(session.lesson.scheduled_at);
                            const dayKey = dayNames[date.getDay()];
                            if (!grouped.has(dayKey)) grouped.set(dayKey, []);
                            grouped.get(dayKey)!.push(session);
                          });

                          return Array.from(grouped.entries()).map(([dayName, sessions]) => (
                            <div key={dayName} className="flex gap-4">
                              <div className="w-24 shrink-0 text-center pt-3">
                                <span className="text-xs font-mono font-bold text-gold-600 uppercase">{dayName}</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                {sessions.map((session, index) => {
                                  const title = session.lesson?.titulo || 'Aula';
                                  const timeVal = session.lesson.scheduled_at.split('T')[1]?.substring(0, 5) || '--:--';
                                  return (
                                    <div key={session.id || index} className="p-3 rounded-lg border border-gray-150 bg-cream-100 dark:bg-ink-900 flex items-center gap-3">
                                      <span className="text-xs font-mono font-bold text-emerald-700">{timeVal}</span>
                                      <span className="text-xs font-serif font-bold text-ink-900 dark:text-cream-100">{title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
```

---

## 1.16 — Implementar Botão "Marcar Aula como Concluída" + Desaparecimento da Aula

### Requisitos de Negócio

1. O aluno deve ter um botão **"Marcar como Concluída"** na página de videoaulas
2. Ao clicar, deve abrir um formulário com campo opcional de notas/comentários
3. O formulário é enviado ao professor, marcando o progresso do aluno
4. Após submeter, a aula **desaparece da página de videoaulas**
5. A aula fica acessível apenas no **calendário de aulas assistidas**
6. Na página de videoaulas deve aparecer a **próxima aula agendada**

### Ficheiro: `src/components/StudentPortal.tsx`

**Passo 1:** Adicionar estado para o modal de conclusão e notas

Após as declarações de estado existentes (aprox. linha 100), adicionar:

```typescript
  // Estado do modal "Marcar como Concluída"
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
```

**Passo 2:** Adicionar a função de submissão

Após as funções existentes (aprox. linha 500), adicionar:

```typescript
  // Marcar aula como concluída com nota opcional
  const handleMarkLessonComplete = async () => {
    if (!currentUser?.id || !selectedCourseId || !currentLecture?.id) return;
    setIsCompleting(true);
    try {
      // 1. Marcar aula como completa no banco de dados
      await academicService.markLessonComplete(
        currentUser.id,
        selectedCourseId,
        currentLecture.id,
        true
      );

      // 2. Salvar nota de conclusão se fornecida
      if (completionNote.trim()) {
        await academicService.saveLessonNote(
          currentUser.id,
          currentLecture.id,
          selectedCourseId,
          `[Conclusão] ${completionNote.trim()}`,
          0
        );
      }

      // 3. Atualizar progresso da matrícula
      const newCompletedCount = completedLessons.length + 1;
      const totalLessons = realLessons.length;
      const newProgressPercent = totalLessons > 0
        ? Math.round((newCompletedCount / totalLessons) * 100)
        : 0;
      await academicService.updateEnrollmentProgress(
        currentUser.id,
        selectedCourseId,
        newProgressPercent
      );

      // 4. Notificar o professor
      try {
        // Buscar professor do curso
        const { data: courseData } = await supabase
          .from('courses')
          .select('teacher_id, title')
          .eq('id', selectedCourseId)
          .maybeSingle();

        if (courseData?.teacher_id) {
          await messageService.sendMessage({
            senderId: currentUser.id,
            receiverId: courseData.teacher_id,
            texto: `✅ Aula concluída: "${currentLecture.titulo || currentLecture.title}"${completionNote.trim() ? `\n📝 Nota do aluno: ${completionNote.trim()}` : ''}`,
          });
        }
      } catch (notifErr) {
        console.warn('Não foi possível notificar o professor:', notifErr);
      }

      // 5. Fechar modal e atualizar dados
      setShowCompleteModal(false);
      setCompletionNote('');
      await fetchStudentData();
    } catch (err) {
      console.error('Erro ao marcar aula como concluída:', err);
      alert('Erro ao marcar aula como concluída. Tente novamente.');
    } finally {
      setIsCompleting(false);
    }
  };
```

**Passo 3:** Filtrar aulas completas da lista de videoaulas e mostrar próxima aula agendada

A variável `activeSyllabus` (usada na lista de aulas) deve excluir aulas já completas. Localizar onde `activeSyllabus` é definido (deve estar entre as linhas 100-200, provavelmente com `useMemo` ou derivado de `realLessons`).

**Adicionar/Modificar a lógica de activeSyllabus:**

```typescript
  // Lista de aulas disponíveis (excluindo as já completas)
  const activeSyllabus = realLessons
    .filter(lesson => !completedLessons.includes(lesson.id))
    .map(lesson => ({
      id: lesson.id,
      title: lesson.titulo || lesson.title || 'Aula sem título',
      descricao: lesson.descricao || lesson.description || '',
      video_url: lesson.video_url || '',
      duration: lesson.duracao || lesson.duration || '--:--',
      scheduled_at: lesson.scheduled_at || null,
      ordem: lesson.ordem || 0,
    }))
    .sort((a, b) => a.ordem - b.ordem);
```

**Passo 4:** Adicionar o botão "Marcar como Concluída" após o Quiz

Na zona do quiz (após a linha ~890, onde está o `QuizArea`), adicionar:

```typescript
                      {/* Botão Marcar como Concluída */}
                      {currentLecture && !completedLessons.includes(currentLecture.id) && (
                        <div className={`p-5 rounded-2xl ${cardThemeClass}`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-serif font-black m-0">Concluir Esta Aula</h4>
                              <p className="text-[10px] text-neutral-400 mt-1 max-w-md">
                                Ao marcar como concluída, esta aula será removida da sua lista de videoaulas e ficará acessível apenas no calendário.
                              </p>
                            </div>
                            <button
                              onClick={() => setShowCompleteModal(true)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase rounded-xl tracking-wider transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                            >
                              <CheckCircle size={14} /> Marcar como Concluída
                            </button>
                          </div>
                        </div>
                      )}
```

**Passo 5:** Adicionar o Modal de Conclusão

Antes do fechamento do componente principal (próximo ao final do return), adicionar:

```typescript
      {/* Modal de Marcar Aula como Concluída */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCompleteModal(false)} />
          <div className={`relative w-full max-w-md p-6 rounded-2xl ${cardThemeClass} space-y-5`}>
            <div>
              <h3 className="text-lg font-serif font-black text-ink-900 dark:text-cream-100 m-0">
                Concluir Aula
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Aula: {currentLecture?.titulo || currentLecture?.title}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1.5">
                Nota sobre a aula (opcional)
              </label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Deixe um comentário ou apontamento sobre esta aula..."
                rows={3}
                className="w-full px-3 py-2 bg-cream-200 dark:bg-ink-900 border border-gray-250 dark:border-ink-850 text-[#1C1C1C] dark:text-cream-100 focus:outline-none rounded-xl text-xs placeholder:text-neutral-400 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 border border-gray-200 dark:border-ink-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer hover:bg-cream-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkLessonComplete}
                disabled={isCompleting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCompleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    A concluir...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Confirmar Conclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
```

---

## 1.17 — Corrigir `StudentPortal.tsx` — Lógica de `nextScheduledLesson` com Caminho Errado

### Problema

**Ficheiro:** `src/components/StudentPortal.tsx`

O cálculo de `nextScheduledLesson` (linhas 568-572) tenta acessar `l.scheduled_at` diretamente, mas os dados vêm de `scheduledLessons` que é uma lista de `lesson_targets` com a estrutura:

```typescript
{
  id: string;
  lesson: {
    scheduled_at: string;
    titulo: string;
    // ...
  }
}
```

O acesso correto deveria ser `l.lesson?.scheduled_at` em vez de `l.scheduled_at`.

**Localizar (linhas 568-572):**
```typescript
  const nextScheduledLesson = scheduledLessons && scheduledLessons.length > 0
    ? scheduledLessons
        .filter(l => l.scheduled_at && new Date(l.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
    : null;
```

**Substituir por:**
```typescript
  const nextScheduledLesson = scheduledLessons && scheduledLessons.length > 0
    ? scheduledLessons
        .filter(l => l.lesson?.scheduled_at && new Date(l.lesson.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.lesson.scheduled_at).getTime() - new Date(b.lesson.scheduled_at).getTime())[0]
    : null;
```

Também corrigir o bloco de verificação de aula bloqueada (linha 745):

**Localizar (linha 745):**
```typescript
{(!currentLecture.scheduled_at || new Date(currentLecture.scheduled_at) > new Date()) ? (
```

Este acesso está correto porque `currentLecture` é derivado de `activeSyllabus` que já mapeia `scheduled_at` no nível superior. No entanto, verifique se `activeSyllabus` inclui `scheduled_at`.

Se `activeSyllabus` é derivado de `realLessons` diretamente, então `currentLecture.scheduled_at` deve funcionar porque `DBLesson` inclui `scheduled_at` (mas não está no tipo `DBLesson` atual). 

**Adicionar `scheduled_at` ao tipo `DBLesson` em `academicService.ts`:**

**Localizar (linhas 13-22):**
```typescript
export interface DBLesson {
  id: string;
  course_id: string;
  module_id?: string;
  titulo: string;
  descricao?: string;
  video_url?: string;
  ordem: number;
  duracao?: string;
}
```

**Substituir por:**
```typescript
export interface DBLesson {
  id: string;
  course_id: string;
  module_id?: string;
  titulo: string;
  descricao?: string;
  video_url?: string;
  ordem: number;
  duracao?: string;
  scheduled_at?: string;
  status?: string;
  quiz?: any;
  meeting_url?: string;
}
```

---

## Resumo de Verificação Pós-Implementação

Após aplicar todas as mudanças da Fase 1, execute a seguinte verificação:

### Compilação
```bash
cd /home/z/my-project/MultiPlus-Academy-/
npm run build
```
- ✅ Não deve haver erros de TypeScript
- ✅ Não deve haver imports não resolvidos

### Testes Funcionais Manuais

| # | Teste | Resultado Esperado |
|---|-------|--------------------|
| 1 | Fazer login como ALUNO | Streak/horas calculados a partir de dados reais |
| 2 | Enviar mensagem para um professor | Mensagem enviada com sucesso |
| 3 | Receber notificação | Notificação aparece sem refetch total da página |
| 4 | Fazer upload de foto de perfil (>5MB) | Erro exibido: "Ficheiro demasiado grande" |
| 5 | Fazer upload de foto de perfil (OK) | Foto salva e exibida corretamente |
| 6 | Responder quiz | Pontuação cumulativa calculada, sem retry após submissão |
| 7 | Clicar "Marcar como Concluída" | Modal aparece, aula desaparece após submissão |
| 8 | Verificar calendário MÊS/SEMANA | Vistas diferentes são exibidas |
| 9 | Preencher formulário de candidatura | Dados salvos na tabela `applications` |
| 10 | Tentar registrar como ADMIN | Opção não existe no dropdown |
| 11 | Verificar próxima aula agendada no dashboard | Data e título corretos |

### Verificação de Banco de Dados

Confirmar que as seguintes tabelas/colunas existem (Claude Fase 0):

- ✅ Tabela `notifications` com coluna `read` (boolean)
- ✅ Tabela `message_reactions`
- ✅ Tabela `pinned_messages`
- ✅ Tabela `message_deletions`
- ✅ Bucket `media` no Supabase Storage
- ✅ Coluna `progress_percent` na tabela `enrollments`
- ✅ Coluna `course_id` na tabela `lesson_progress`
- ✅ Trigger `handle_new_user` com `role=ALUNO` forçado

---

## Ordem de Implementação Recomendada

1. **1.12** — `client.ts` (fundação — sem isso, nada funciona)
2. **1.4** — `types.ts` (tipos afetam tudo)
3. **1.2** — `AuthProvider.tsx` (autenticação)
4. **1.1** — `notificationService.ts` (criar novo serviço)
5. **1.3** — `avatarService.ts` (serviço de avatar)
6. **1.5** — `messageService.ts` (serviço de mensagens)
7. **1.7** — `presenceService.ts` (presença)
8. **1.9** — `academicService.ts` + `enrollmentService.ts` (progresso)
9. **1.8** — `QuizArea.tsx` (quiz)
10. **1.10** — `useVideoPlayer.ts` (vídeo)
11. **1.6** — `ChatShell.tsx` (chat)
12. **1.11** — `useStudentData.ts` (dados do aluno)
13. **1.17** — `StudentPortal.tsx` (nextScheduledLesson)
14. **1.16** — `StudentPortal.tsx` (botão concluir + desaparecimento)
15. **1.15** — `StudentPortal.tsx` (calendário)
16. **1.13** — `App.tsx` (formulário candidatura)
17. **1.14** — `LoginPanel.tsx` (remover ADMIN)

> **Nota:** As tarefas 13-17 podem ser feitas em paralelo com as tarefas 1-12, pois não dependem das mudanças de serviços.

---

**FIM DA FASE 1**
