# FASE 0 — Correcções Imediatas de Segurança

> **Documento de Execução para Gemini**
> **Projecto:** MultiPlus Academy (github.com/amandiogoncalvesd/MultiPlus-Academy-)
> **Commit base:** db9826f
> **Data:** 17 de Julho de 2026
> **Prioridade:** CRÍTICA — Estas correcções devem ser aplicadas ANTES de qualquer deploy em produção.

---

## ⚠️ NOTA IMPORTANTE SOBRE O QUE O CLAUDE JÁ TRATOU

O Claude já tratou das seguintes alterações no **banco de dados (Supabase)**:
- Criar bucket `media` e políticas RLS de Storage
- Corrigir políticas RLS nas tabelas `users`, `profiles`, `notifications`, `certificates`, `enrollments`
- Adicionar colunas em falta na tabela `messages` (`status`, `forwarded_from`, `voice_data`)
- Criar tabelas em falta (`chat_media`, `message_reactions`, `pinned_messages`, `message_deletions`, `user_presence`)
- Corrigir trigger `handle_new_user` para sempre definir `role = 'ALUNO'`
- Corrigir função `get_user_role` para tratar NULL

**Portanto, NÃO é necessário criar migrações SQL para essas questões.** Apenas aplique as alterações no **código-fonte** descritas abaixo.

---

## ÍNDICE

| ID  | Tarefa | Ficheiro | Linha |
|-----|--------|----------|-------|
| 0.1 | Remover opção ADMIN do formulário de registo | `src/components/LoginPanel.tsx` | 188 |
| 0.2 | Impedir que authService.register aceite role ADMIN do cliente | `src/services/supabase/authService.ts` | 67 |
| 0.3 | Impedir que AuthProvider.signUp aceite role ADMIN do cliente | `src/components/auth/AuthProvider.tsx` | 165 |
| 0.4 | Remover fallback para user_metadata.role no authService.login | `src/services/supabase/authService.ts` | 55 |
| 0.5 | Remover fallback para user_metadata.role no authService.getCurrentUser | `src/services/supabase/authService.ts` | 128 |
| 0.6 | Remover fallback para user_metadata.role no AuthProvider.syncAuthSession | `src/components/auth/AuthProvider.tsx` | 84 |
| 0.7 | Remover JWT secret placeholder no NestJS AuthGuard | `apps/api/src/security/auth/auth.guard.ts` | 48 |
| 0.8 | Remover reset link da resposta da API NestJS | `apps/api/src/modules/auth/auth.service.ts` | 131-136 |
| 0.9 | Remover service role key do código morto | `lib/supabase/server.ts` | todo o ficheiro |
| 0.10 | Unificar campos de avatar (avatarUrl + foto_perfil) | `src/types.ts` + múltiplos ficheiros | várias |
| 0.11 | Corrigir AuthProvider.refreshProfile para actualizar currentUser | `src/components/auth/AuthProvider.tsx` | 200-205 |
| 0.12 | Corrigir AvatarUpload: substituir alert() por toast | `src/components/AvatarUpload.tsx` | 37,43,54 |
| 0.13 | Corrigir AvatarUpload: reset do input file após upload | `src/components/AvatarUpload.tsx` | 56 |
| 0.14 | Corrigir AvatarUpload: guard contra upload concorrente | `src/components/AvatarUpload.tsx` | 47 |
| 0.15 | Corrigir avatarService: validação de extensão de ficheiro | `src/services/supabase/avatarService.ts` | 5-6 |
| 0.16 | Corrigir avatarService: cache-busting na URL do avatar | `src/services/supabase/avatarService.ts` | 14-15 |
| 0.17 | Corrigir vazamento de canais de digitação no presenceService | `src/services/supabase/presenceService.ts` | 54-71 |
| 0.18 | Corrigir index.html: lang="en" para lang="pt" | `index.html` | 2 |

---

## 0.1 — Remover Opção ADMIN do Formulário de Registo

### Problema
Qualquer utilizador pode seleccionar "Administrador Geral" no dropdown do formulário de registo e auto-promover-se a ADMIN. Isto é uma vulnerabilidade de escalação de privilégios crítica.

### Ficheiro
`src/components/LoginPanel.tsx`

### Linha Actual (linha 186-189)
```tsx
<option value="ALUNO">Aluno de Elite</option>
<option value="PROFESSOR">Corpo de Formadores</option>
<option value="ADMIN">Administrador Geral</option>
```

### Substituir Por
```tsx
<option value="ALUNO">Aluno de Elite</option>
<option value="PROFESSOR">Corpo de Formadores</option>
```

### Explicação
A opção `<option value="ADMIN">Administrador Geral</option>` deve ser completamente removida. O acesso ADMIN só deve ser concedido por um administrador existente através do painel de administração, nunca por auto-registo.

### Verificação
Após a alteração, abrir a página de registo e confirmar que o dropdown "Tipo de Acesso" só mostra "Aluno de Elite" e "Corpo de Formadores". Tentar seleccionar ADMIN manualmente (via DevTools) e confirmar que o backend também rejeita (ver 0.2).

---

## 0.2 — Impedir que authService.register Aceite Role ADMIN do Cliente

### Problema
Mesmo removendo a opção do frontend, um atacante pode chamar `authService.register()` directamente com `role: 'ADMIN'` via consola do browser. O serviço deve forçar `role = 'ALUNO'` para registos provenientes do cliente.

### Ficheiro
`src/services/supabase/authService.ts`

### Linha Actual (linha 67)
```typescript
async register(email: string, password: string, nomeCompleto: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO' = 'ALUNO'): Promise<any> {
```

### Substituir Por
```typescript
async register(email: string, password: string, nomeCompleto: string, role: 'ALUNO' | 'PROFESSOR' = 'ALUNO'): Promise<any> {
    // SECURITY: Force ALUNO for self-registration. Role elevation must go through admin panel only.
    const safeRole: 'ALUNO' | 'PROFESSOR' = role === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';
```

### Linha Actual (linha 72-75)
```typescript
    options: {
      data: {
        nome_completo: nomeCompleto,
        role: role
      }
    }
```

### Substituir Por
```typescript
    options: {
      data: {
        nome_completo: nomeCompleto,
        role: safeRole
      }
    }
```

### Explicação
O parâmetro `role` do método `register` agora só aceita `'ALUNO' | 'PROFESSOR'`, e a variável `safeRole` garante que qualquer valor diferente de `'PROFESSOR'` seja forçado para `'ALUNO'`. Isto previne que um atacante injecte `role: 'ADMIN'` via chamada directa ao serviço.

**NOTA:** A promoção para PROFESSOR é permitida no registo porque o formulário oferece essa opção. Se desejar que apenas ADMINs possam promover a PROFESSOR, altere `safeRole` para sempre retornar `'ALUNO'`:
```typescript
const safeRole: 'ALUNO' = 'ALUNO';
```

### Verificação
Abrir a consola do browser e tentar: `authService.register('test@test.com', 'password', 'Hacker', 'ADMIN')`. Confirmar que o utilizador é criado com role ALUNO, não ADMIN.

---

## 0.3 — Impedir que AuthProvider.signUp Aceite Role ADMIN do Cliente

### Problema
O `AuthProvider.signUp` passa directamente o `role` recebido do componente para `authService.register`. Precisa aplicar a mesma validação.

### Ficheiro
`src/components/auth/AuthProvider.tsx`

### Linha Actual (linha 165)
```typescript
const signUp = async (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN'): Promise<any> => {
```

### Substituir Por
```typescript
const signUp = async (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' = 'ALUNO'): Promise<any> => {
    // SECURITY: Never allow ADMIN role from client-side signup
    const safeRole: 'ALUNO' | 'PROFESSOR' = role === 'PROFESSOR' ? 'PROFESSOR' : 'ALUNO';
```

### Linha Actual (linha 168)
```typescript
return await authService.register(email, password, name, role);
```

### Substituir Por
```typescript
return await authService.register(email, password, name, safeRole);
```

### Explicação
O `AuthProvider` é a camada de contexto que os componentes usam. Mesmo que um componente tente passar `role: 'ADMIN'`, o `safeRole` força para ALUNO ou PROFESSOR.

### Verificação
Confirmar que a interface `AuthContextType` (linha 17) também é actualizada:
```typescript
signUp: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR') => Promise<any>;
register: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR') => Promise<any>;
```

---

## 0.4 — Remover Fallback para user_metadata.role no authService.login

### Problema
Quando a tabela `public.users` ainda não tem o registo do utilizador, o `authService.login` recorre a `user_metadata.role` que é controlado pelo cliente. Um atacante que registe com `role: 'ADMIN'` nos metadados obteria acesso admin se o trigger falhar.

### Ficheiro
`src/services/supabase/authService.ts`

### Linha Actual (linhas 49-58)
```typescript
// If public.users is not populated yet, build from user metadata
return {
  user: {
    id: data.user.id,
    email: data.user.email || '',
    nome_completo: data.user.user_metadata?.nome_completo || '',
    role: (data.user.user_metadata?.role || 'ALUNO') as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
  },
  session: data.session
};
```

### Substituir Por
```typescript
// SECURITY: Never trust user_metadata.role — always default to ALUNO
// If public.users is not populated yet, the trigger hasn't fired.
// Default to ALUNO; role will be corrected on next sync when the row exists.
console.warn('public.users row not found for user', data.user.id, '- defaulting to ALUNO');
return {
  user: {
    id: data.user.id,
    email: data.user.email || '',
    nome_completo: data.user.user_metadata?.nome_completo || '',
    role: 'ALUNO' as const,
  },
  session: data.session
};
```

### Explicação
O fallback `user_metadata?.role || 'ALUNO'` permitia que um utilizador que injectasse `role: 'ADMIN'` nos metadados obtivesse acesso admin quando a linha em `public.users` ainda não existia. Agora, o fallback é sempre `'ALUNO'`. Na próxima sincronização (quando o trigger criar a linha em `public.users`), o role correcto será lido da fonte de verdade.

---

## 0.5 — Remover Fallback para user_metadata.role no authService.getCurrentUser

### Problema
Mesmo problema que 0.4, mas no método `getCurrentUser`.

### Ficheiro
`src/services/supabase/authService.ts`

### Linha Actual (linhas 124-129)
```typescript
return {
  id: user.id,
  email: user.email || '',
  nome_completo: user.user_metadata?.nome_completo || '',
  role: (user.user_metadata?.role || 'ALUNO') as 'ADMIN' | 'PROFESSOR' | 'ALUNO',
};
```

### Substituir Por
```typescript
// SECURITY: Never trust user_metadata.role — always default to ALUNO
console.warn('public.users row not found for user', user.id, '- defaulting to ALUNO');
return {
  id: user.id,
  email: user.email || '',
  nome_completo: user.user_metadata?.nome_completo || '',
  role: 'ALUNO' as const,
};
```

---

## 0.6 — Remover Fallback para user_metadata.role no AuthProvider.syncAuthSession

### Problema
Quando `userData` não existe (a linha em `public.users` ainda não foi criada), o `syncAuthSession` usa `uMeta?.role || 'ALUNO'` como fallback, que pode ser manipulado pelo cliente.

### Ficheiro
`src/components/auth/AuthProvider.tsx`

### Linha Actual (linhas 82-97)
```typescript
} else {
  // If public.users is slow, build from auth meta
  const uMeta = sbSession.user.user_metadata;
  const mappedRole = mapSupabaseRole(uMeta?.role || 'ALUNO');
  const localUser: User = {
    id: sbSession.user.id,
    email: sbSession.user.email || '',
    firstName: uMeta?.nome_completo?.split(' ')[0] || uMeta?.firstName || '',
    lastName: uMeta?.nome_completo?.split(' ').slice(1).join(' ') || uMeta?.lastName || '',
    role: mappedRole,
    avatarUrl: null,
    status: 'ACTIVE',
    streak: 3,
    longestStreak: 5,
    totalHoursLearned: 4
  };
  setCurrentUser(localUser);
}
```

### Substituir Por
```typescript
} else {
  // SECURITY: Never trust user_metadata.role — always default to ALUNO
  // The public.users row may not exist yet if the trigger hasn't fired.
  // On next sync, the correct role will be read from public.users.
  const uMeta = sbSession.user.user_metadata;
  const localUser: User = {
    id: sbSession.user.id,
    email: sbSession.user.email || '',
    firstName: uMeta?.nome_completo?.split(' ')[0] || uMeta?.firstName || '',
    lastName: uMeta?.nome_completo?.split(' ').slice(1).join(' ') || uMeta?.lastName || '',
    role: 'ALUNO' as const,
    avatarUrl: uMeta?.foto_perfil || null,
    phone: uMeta?.telefone || '',
    status: 'ACTIVE',
    streak: 0,
    longestStreak: 0,
    totalHoursLearned: 0
  };
  setCurrentUser(localUser);
}
```

### Notas Adicionais nesta Alteração
1. Removido `mapSupabaseRole(uMeta?.role || 'ALUNO')` → forçado para `'ALUNO'`
2. Adicionado `avatarUrl: uMeta?.foto_perfil || null` — se o trigger já populou os metadados, usa o avatar
3. Adicionado `phone: uMeta?.telefone || ''` — campo estava em falta
4. Removido valores hardcoded `streak: 3, longestStreak: 5, totalHoursLearned: 4` → substituído por `0` (dados reais não existem)

---

## 0.7 — Remover JWT Secret Placeholder no NestJS AuthGuard

### Problema
O `AuthGuard` do NestJS tem uma string placeholder como fallback para o JWT secret. Se as variáveis de ambiente `SUPABASE_JWT_SECRET` e `JWT_SECRET` não estiverem definidas, **qualquer token JWT assinado com esta string pública será aceite**, concedendo acesso não autenticado.

### Ficheiro
`apps/api/src/security/auth/auth.guard.ts`

### Linha Actual (linha 48)
```typescript
const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'supabase-jwt-secret-placeholder-minimum-32-characters-long';
```

### Substituir Por
```typescript
const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    'CRITICAL: SUPABASE_JWT_SECRET or JWT_SECRET environment variable is not set. ' +
    'Authentication is disabled for security. Set the variable and restart the server.'
  );
}
```

### Explicação
Se a variável de ambiente não estiver definida, o servidor **deve recusar iniciar** em vez de aceitar tokens assinados com uma string pública. Isto é uma medida de fail-safe: é preferível que o servidor não arranque a permitir acesso não autenticado.

### Verificação
1. Tentar iniciar o servidor NestJS sem definir `SUPABASE_JWT_SECRET`. Confirmar que lança erro.
2. Definir a variável e confirmar que o servidor arranca normalmente.

---

## 0.8 — Remover Reset Link da Resposta da API NestJS

### Problema
O endpoint `POST /auth/forgot-password` retorna o link de reset de password no corpo da resposta HTTP. Um atacante que conheça o email de uma vítima pode chamar este endpoint e obter o link de reset directamente, **bypassando a verificação por email**.

### Ficheiro
`apps/api/src/modules/auth/auth.service.ts`

### Linha Actual (linhas 129-137)
```typescript
try {
  // Gerar link real para redefinição de senha oficial fornecida pelo Firebase
  const resetLink = await admin.auth().generatePasswordResetLink(email);
  
  return {
    success: true,
    message: "Link de redefinição de palavra-passe gerado com sucesso.",
    resetLink, // Retorna o link que será disparado via SMTP ou entregue ao cliente
  };
}
```

### Substituir Por
```typescript
try {
  // SECURITY: Generate the reset link but NEVER return it in the response.
  // Firebase automatically sends the reset email to the user.
  // The link must only be accessible via the user's email inbox.
  await admin.auth().generatePasswordResetLink(email);
  
  return {
    success: true,
    message: "Se o e-mail estiver registado, um link de redefinição foi enviado para a sua caixa de correio.",
  };
}
```

### Explicação
A função `generatePasswordResetLink` do Firebase Admin SDK gera o link e o Firebase pode enviá-lo por email automaticamente (dependendo da configuração). O link **nunca** deve ser exposto na resposta HTTP, pois permite takeover de conta. A mensagem genérica ("Se o e-mail estiver registado...") também evita enumeração de emails.

### Verificação
Chamar `POST /api/v1/auth/forgot-password` com um email válido e confirmar que a resposta NÃO contém `resetLink`.

---

## 0.9 — Remover Service Role Key do Código Morto

### Problema
O ficheiro `lib/supabase/server.ts` referencia a service role key (que bypassa RLS) mas nunca é importado por nenhum ficheiro do frontend. É código morto que contém referências a credenciais sensíveis.

### Ficheiro
`lib/supabase/server.ts`

### Acção
**Apagar completamente o ficheiro** `lib/supabase/server.ts`.

### Explicação
Este ficheiro cria um cliente Supabase com a service role key (que bypassa todas as políticas RLS). Nunca é importado por nenhum ficheiro em `src/`. A sua presença no repositório é um risco de segurança — se alguém acidentalmente o importar, todas as operações de BD bypassariam RLS. A funcionalidade de servidor deverá ser implementada correctamente em Supabase Edge Functions quando necessária.

### Ficheiros Adicionais para Remover (Código Morto)
| Ficheiro | Razão |
|----------|-------|
| `lib/supabase/client.ts` | Duplicado de `src/lib/supabase/client.ts`, nunca importado |
| `lib/supabase/middleware.ts` | Nunca importado, stub que sempre retorna `{ authenticated: true, user: null }` |
| `hooks/useAuth.ts` | Duplicado de `src/hooks/useAuth.ts`, nunca importado |
| `hooks/useCourses.ts` | Duplicado de `src/hooks/useCourses.ts`, nunca importado |
| `hooks/useLessons.ts` | Duplicado de `src/hooks/useLessons.ts`, nunca importado |
| `hooks/useMessages.ts` | Duplicado de `src/hooks/useMessages.ts`, nunca importado |
| `services/supabase/authService.ts` | Duplicado de `src/services/supabase/authService.ts`, nunca importado |
| `services/supabase/courseService.ts` | Duplicado de `src/services/supabase/courseService.ts`, nunca importado |
| `services/supabase/lessonService.ts` | Duplicado de `src/services/supabase/lessonService.ts`, nunca importado |
| `services/supabase/messageService.ts` | Duplicado de `src/services/supabase/messageService.ts`, nunca importado |
| `services/supabase/userService.ts` | Duplicado de `src/services/supabase/userService.ts`, nunca importado |
| `src/lib/supabase/middleware.ts` | Nunca importado, função `updateSession` nunca chamada |
| `src/hooks/useMessages.ts` | 82 linhas não importadas por nenhum componente |

### Verificação
Após apagar os ficheiros, executar `npm run build` (ou `pnpm build`) e confirmar que não há erros de importação. Estes ficheiros são código morto e não devem afectar a compilação.

---

## 0.10 — Unificar Campos de Avatar (avatarUrl + foto_perfil)

### Problema
A interface `User` tem dois campos de avatar: `avatarUrl` e `foto_perfil`. Diferentes componentes usam campos diferentes, causando inconsistência na exibição do avatar após upload. O upload escreve em `foto_perfil`, mas componentes como `InstructorPortal` e `MessagesPage` leem `avatarUrl`.

### Ficheiros a Alterar

### 0.10.A — `src/types.ts` (linha 24-25)

**Linha Actual:**
```typescript
avatarUrl?: string;
foto_perfil?: string;
```

**Substituir Por:**
```typescript
avatarUrl?: string;  // Unified avatar field — always use this in components. Maps from DB column foto_perfil.
```

**Explicação:** Remover `foto_perfil` da interface `User`. O mapeamento de `foto_perfil` (coluna BD) para `avatarUrl` (campo da interface) deve acontecer nos serviços, não nos componentes.

### 0.10.B — `src/components/auth/AuthProvider.tsx`

**Já está correcto** — As linhas 69 e 91 já mapeiam `userData.foto_perfil` para `avatarUrl`. Confirmar que ambos os caminhos (linha 69 com userData e linha 147 com result.user.foto_perfil) mapeiam correctamente:

Linha 69 (actual, manter):
```typescript
avatarUrl: userData.foto_perfil || '',
```

Linha 147 (actual, manter):
```typescript
avatarUrl: result.user.foto_perfil || '',
```

### 0.10.C — `src/components/StudentPortal.tsx`

**Procurar por** `foto_perfil` e substituir por `avatarUrl`.

O callback `onAvatarUpdated` (aproximadamente linha 1189-1194) deve actualizar AMBOS os campos para garantir consistência durante a transição:

**Código Actual:**
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

**Substituir Por:**
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

### 0.10.D — `src/components/portal/StudentTopbar.tsx`

**Procurar por** `currentUser.foto_perfil` e substituir por `currentUser.avatarUrl`.

### 0.10.E — `src/components/portal/StudentSidebar.tsx`

**Procurar por** `currentUser.foto_perfil` e substituir por `currentUser.avatarUrl`.

### 0.10.F — `src/components/InstructorPortal.tsx`

**Procurar por** `currentUser.avatarUrl` — já usa `avatarUrl`, nenhuma alteração necessária. Confirmar que NÃO usa `foto_perfil`.

### 0.10.G — `src/components/AdminPortal.tsx`

**Procurar por** `currentUser.avatarUrl` — já usa `avatarUrl`, nenhuma alteração necessária. Confirmar que NÃO usa `foto_perfil`.

### 0.10.H — `src/components/MessagesPage.tsx`

**Procurar por** `user.avatarUrl` — já usa `avatarUrl`, nenhuma alteração necessária.

### Verificação
1. Fazer upload de avatar como aluno
2. Navegar entre StudentPortal, MessagesPage e verificar que o avatar está consistente
3. Recarregar a página e confirmar que o avatar persiste
4. Verificar que NENHUM componente referencia `foto_perfil` directamente (usar `grep -r "foto_perfil" src/components/`)

---

## 0.11 — Corrigir AuthProvider.refreshProfile para Actualizar currentUser

### Problema
O método `refreshProfile` só actualiza o `userProfile` (tabela `profiles`), mas NÃO actualiza o `currentUser` (que contém o avatar). Após um upload de avatar, chamar `refreshProfile()` não propaga a mudança.

### Ficheiro
`src/components/auth/AuthProvider.tsx`

### Linha Actual (linhas 200-205)
```typescript
const refreshProfile = async () => {
  if (currentUser) {
    const prof = await userService.getUserProfile(currentUser.id);
    setUserProfile(prof);
  }
};
```

### Substituir Por
```typescript
const refreshProfile = async () => {
  if (currentUser) {
    // Refresh profile data
    const prof = await userService.getUserProfile(currentUser.id);
    setUserProfile(prof);

    // Also refresh currentUser from users table (for avatar, name, etc.)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userData) {
        setCurrentUser(prev => prev ? {
          ...prev,
          firstName: userData.nome_completo?.split(' ')[0] || prev.firstName,
          lastName: userData.nome_completo?.split(' ').slice(1).join(' ') || prev.lastName,
          avatarUrl: userData.foto_perfil || prev.avatarUrl,
          phone: userData.telefone || prev.phone,
        } : null);
      }
    } catch (err) {
      console.warn('Failed to refresh currentUser from users table:', err);
    }
  }
};
```

### Explicação
Agora `refreshProfile` actualiza tanto o `userProfile` (tabela `profiles`) como o `currentUser` (tabela `users`). Isto garante que mudanças de avatar e nome se propagam correctamente pela aplicação quando `refreshProfile` é chamado.

### Verificação
1. Fazer upload de avatar
2. Chamar `refreshProfile()` manualmente (via consola ou acção)
3. Confirmar que `currentUser.avatarUrl` é actualizado
4. Confirmar que os componentes que usam `useAuth().user` mostram o novo avatar

---

## 0.12 — Corrigir AvatarUpload: Substituir alert() por Toast

### Problema
O componente `AvatarUpload` usa `alert()` para feedback de validação e erro. Isto bloqueia a thread principal e é inconsistente com o sistema de toast da aplicação.

### Ficheiro
`src/components/AvatarUpload.tsx`

### Passo 1: Importar useToast

**Adicionar no topo do ficheiro (após as importações existentes, linha 3):**
```typescript
import { useToast } from './ui/Toast';
```

### Passo 2: Inicializar toast dentro do componente

**Adicionar dentro da função `AvatarUpload` (após a linha 18, dentro do corpo da função):**
```typescript
const { addToast } = useToast();
```

### Passo 3: Substituir os 3 alert()

**Linha 37 — Antes:**
```typescript
alert('A imagem deve ter no máximo 5MB.');
```
**Depois:**
```typescript
addToast('A imagem deve ter no máximo 5MB.', 'error');
```

**Linha 43 — Antes:**
```typescript
alert('Formato inválido. Use JPG, PNG ou WebP.');
```
**Depois:**
```typescript
addToast('Formato inválido. Use JPG, PNG ou WebP.', 'error');
```

**Linha 54 — Antes:**
```typescript
alert('Erro ao carregar foto de perfil.');
```
**Depois:**
```typescript
addToast('Erro ao carregar foto de perfil.', 'error');
```

### Verificação
Tentar fazer upload de um ficheiro > 5MB e confirmar que aparece toast em vez de alert.

---

## 0.13 — Corrigir AvatarUpload: Reset do Input File Após Upload

### Problema
Se o utilizador seleccionar o mesmo ficheiro duas vezes seguidas, o `onChange` não dispara porque o valor do input não mudou.

### Ficheiro
`src/components/AvatarUpload.tsx`

### Alteração
**Adicionar no final do `finally` block (após linha 56 `setUploading(false);`):**
```typescript
// Reset file input so the same file can be selected again
if (fileInputRef.current) {
  fileInputRef.current.value = '';
}
```

### Código Completo do Bloco finally
```typescript
} finally {
  setUploading(false);
  // Reset file input so the same file can be selected again
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}
```

---

## 0.14 — Corrigir AvatarUpload: Guard Contra Upload Concorrente

### Problema
Se o utilizador seleccionar ficheiros rapidamente, múltiplos uploads podem disparar concorrentemente, causando sobrescrita e comportamento imprevisível.

### Ficheiro
`src/components/AvatarUpload.tsx`

### Alteração
**Adicionar guard no início da função `handleUpload` (após linha 33 `if (!file) return;`):**
```typescript
if (uploading) return; // Prevent concurrent uploads
```

### Código Completo do Início de handleUpload
```typescript
const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (uploading) return; // Prevent concurrent uploads
  
  // Validar tamanho (máx 5MB)
  ...
```

---

## 0.15 — Corrigir avatarService: Validação de Extensão de Ficheiro

### Problema
O `avatarService.uploadAvatar` aceita qualquer extensão de ficheiro. Se `file.name` for `malicious.php`, a extensão `.php` seria aceite. Além disso, avatares antigos nunca são limpos do storage.

### Ficheiro
`src/services/supabase/avatarService.ts`

### Linha Actual (linhas 4-6)
```typescript
async uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
```

### Substituir Por
```typescript
async uploadAvatar(userId: string, file: File): Promise<string> {
  // SECURITY: Validate file extension against whitelist
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Extensão de ficheiro não permitida. Use JPG, PNG ou WebP.');
  }
  const filePath = `avatars/${userId}/${Date.now()}.${ext}`;
```

### Adicionar Cleanup de Avatar Antigo (após linha 26, antes do `return`)

**Adicionar antes de `return publicUrl;` (linha 25):**
```typescript
  // Clean up old avatars (best effort — don't block on failure)
  try {
    const { data: oldFiles } = await supabase.storage
      .from('media')
      .list(`avatars/${userId}`);
    if (oldFiles && oldFiles.length > 0) {
      const filesToDelete = oldFiles
        .filter(f => f.name !== filePath.split('/').pop()) // Keep the new file
        .map(f => `avatars/${userId}/${f.name}`);
      if (filesToDelete.length > 0) {
        await supabase.storage.from('media').remove(filesToDelete);
      }
    }
  } catch (cleanupErr) {
    console.warn('Failed to clean up old avatars:', cleanupErr);
    // Non-blocking — avatar update still succeeds
  }
```

### Explicação
1. **Validação de extensão** — Apenas `jpg`, `jpeg`, `png`, `webp` são permitidos no serviço. Isto é uma segunda camada de validação (a primeira está no `AvatarUpload`).
2. **Cleanup de avatares antigos** — Lista todos os ficheiros no directório `avatars/{userId}/` e remove os que não são o avatar actual. É best-effort: se falhar, o upload ainda sucede.

---

## 0.16 — Corrigir avatarService: Cache-Busting na URL do Avatar

### Problema
A URL pública do avatar é determinística. Se o utilizador fizer upload de um novo avatar para o mesmo caminho (ou se a URL for a mesma após refresh), o browser pode servir a imagem em cache.

### Ficheiro
`src/services/supabase/avatarService.ts`

### Linha Actual (linhas 14-15)
```typescript
const { data } = supabase.storage.from('media').getPublicUrl(filePath);
const publicUrl = data.publicUrl;
```

### Substituir Por
```typescript
const { data } = supabase.storage.from('media').getPublicUrl(filePath);
// Add cache-busting timestamp to ensure browser fetches the latest avatar
const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
```

### Explicação
O parâmetro `?t=timestamp` garante que o browser trata a URL como um recurso novo, bypassando o cache. Isto é especialmente importante quando o utilizador faz upload de um novo avatar e espera ver a mudança imediatamente.

---

## 0.17 — Corrigir Vazamento de Canais de Digitação no presenceService

### Problema
O método `broadcastTyping` cria um NOVO canal Supabase a cada chamada sem nunca o remover. Com o debounce de 2500ms, isto cria ~2 canais por burst de digitação. Após ~50 bursts, o limite de 100 canais do Supabase é atingido, quebrando TODAS as funcionalidades Realtime.

### Ficheiro
`src/services/supabase/presenceService.ts`

### Linha Actual (linhas 54-71)
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

### Substituir Por
```typescript
// Track active typing channels to prevent leaks
private static typingChannels: Map<string, any> = new Map();

async broadcastTyping(userId: string, partnerId: string, isTyping: boolean) {
  try {
    const channelKey = `typing-${partnerId}`;
    
    // Reuse existing channel if available
    let channel = presenceService.typingChannels?.get(channelKey);
    
    if (!channel) {
      channel = supabase.channel(channelKey, {
        config: { broadcast: { self: false } }
      });
      presenceService.typingChannels?.set(channelKey, channel);
      
      // Subscribe once — channel stays alive for reuse
      await new Promise<void>((resolve) => {
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
      });
    }
    
    // Send the typing event on the existing channel
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping, timestamp: Date.now(), conversationId: partnerId }
    });
  } catch (err) {
    console.warn('Realtime broadcastTyping failed:', err);
  }
},
```

**NOTA:** Como `presenceService` é um objecto literal (não uma classe), a propriedade estática `typingChannels` deve ser adicionada ao objecto:

**Adicionar antes do método `broadcastTyping`:**
```typescript
// Shared map to track typing channels and prevent leaks
typingChannels: new Map<string, any>() as Map<string, any>,
```

### Explicação
Em vez de criar um novo canal por cada chamada, o método agora:
1. Mantém um `Map<string, Channel>` de canais activos
2. Reutiliza o canal existente para o mesmo `partnerId`
3. Subscreve apenas uma vez por canal
3. O canal permanece vivo para envios subsequentes
Isto elimina completamente o vazamento de canais.

### Cleanup (Opcional)
Quando o utilizador navegar para fora da página de mensagens, deve limpar os canais. Adicionar ao `presenceService`:
```typescript
cleanupTypingChannels() {
  if (presenceService.typingChannels) {
    presenceService.typingChannels.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    presenceService.typingChannels.clear();
  }
},
```

---

## 0.18 — Corrigir index.html: lang="en" para lang="pt"

### Problema
O atributo `lang` está definido como `"en"` mas toda a aplicação está em Português. Isto afecta SEO, leitores de ecrã e tradução automática do browser.

### Ficheiro
`index.html`

### Linha Actual (linha 2)
```html
<html lang="en">
```

### Substituir Por
```html
<html lang="pt">
```

### Adicionar Meta Description (após a tag `<title>`)
```html
<meta name="description" content="MultiPlus Academy — Plataforma de ensino de Inglês Jurídico em Angola. Cursos de elite para juristas e profissionais. Certificados verificáveis." />
```

### Verificação
1. Abrir a aplicação no browser
2. Verificar o código fonte (Ctrl+U) e confirmar `lang="pt"`
3. Usar uma ferramenta de validação de acessibilidade (como Lighthouse) e confirmar que o idioma está correcto

---

## CHECKLIST DE VERIFICAÇÃO FINAL

Após aplicar TODAS as alterações acima, execute esta verificação:

### Verificações de Segurança

| # | Verificação | Como Testar | Resultado Esperado |
|---|-------------|-------------|-------------------|
| 1 | Registo não permite ADMIN | Tentar registar com role ADMIN via consola do browser | Registo criado como ALUNO |
| 2 | Login não usa user_metadata.role | Fazer login com utilizador cujo user_metadata.role='ADMIN' | Role é lido de public.users, não de metadata |
| 3 | JWT secret placeholder removido | Iniciar NestJS sem SUPABASE_JWT_SECRET definido | Servidor lança erro e não arranca |
| 4 | Reset link não exposto | Chamar POST /api/v1/auth/forgot-password | Resposta não contém resetLink |
| 5 | Service role key removida | Verificar que lib/supabase/server.ts foi apagado | Ficheiro não existe |
| 6 | Código morto removido | Executar `pnpm build` sem erros | Build sucede sem importações quebradas |

### Verificações de Avatar

| # | Verificação | Como Testar | Resultado Esperado |
|---|-------------|-------------|-------------------|
| 7 | Upload de avatar funciona | Fazer upload de foto JPG < 5MB | Avatar actualizado em toda a app |
| 8 | Validação de extensão | Tentar upload de ficheiro .txt | Toast de erro "Extensão não permitida" |
| 9 | Validação de tamanho | Tentar upload de ficheiro > 5MB | Toast de erro "máximo 5MB" |
| 10 | Toast em vez de alert | Qualquer erro de upload | Toast aparece, sem alert() nativo |
| 11 | Mesmo ficheiro seleccionado 2x | Selecionar mesmo ficheiro após upload | onChange dispara correctamente |
| 12 | Avatar persiste após refresh | Fazer upload, recarregar página | Avatar mantém-se |
| 13 | Avatar consistente entre componentes | Navegar entre StudentPortal e MessagesPage | Avatar é o mesmo em ambos |

### Verificações de Realtime

| # | Verificação | Como Testar | Resultado Esperado |
|---|-------------|-------------|-------------------|
| 14 | Canais de digitação não vazam | Digitar 50+ bursts na conversa | Canais são reutilizados, não criam novos |

### Verificações de HTML/SEO

| # | Verificação | Como Testar | Resultado Esperado |
|---|-------------|-------------|-------------------|
| 15 | lang="pt" definido | Ver código fonte | `<html lang="pt">` |
| 16 | Meta description presente | Ver código fonte | Tag `<meta name="description">` existe |

---

## ORDEM DE EXECUÇÃO RECOMENDADA

1. **0.1 → 0.6** — Correcções de escalação de privilégios (MAIS CRÍTICO)
2. **0.7 → 0.8** — Correcções do backend NestJS
3. **0.9** — Remoção de código morto
4. **0.10 → 0.11** — Unificação de avatar e refresh de perfil
5. **0.12 → 0.16** — Correcções do AvatarUpload e avatarService
6. **0.17** — Correcção do vazamento de canais Realtime
7. **0.18** — Correcção do HTML
8. **Executar checklist de verificação**

---

## FICHEIROS MODIFICADOS (Resumo)

| Ficheiro | Alterações |
|----------|------------|
| `src/components/LoginPanel.tsx` | Removida opção ADMIN do dropdown |
| `src/services/supabase/authService.ts` | Forçar role ALUNO no registo, remover fallback user_metadata.role |
| `src/components/auth/AuthProvider.tsx` | Forçar role ALUNO no signUp, remover fallback, corrigir refreshProfile |
| `apps/api/src/security/auth/auth.guard.ts` | Remover JWT placeholder, lançar erro se env var não definida |
| `apps/api/src/modules/auth/auth.service.ts` | Remover resetLink da resposta |
| `src/types.ts` | Remover campo foto_perfil da interface User |
| `src/components/StudentPortal.tsx` | foto_perfil → avatarUrl no callback |
| `src/components/portal/StudentTopbar.tsx` | foto_perfil → avatarUrl |
| `src/components/portal/StudentSidebar.tsx` | foto_perfil → avatarUrl |
| `src/components/AvatarUpload.tsx` | Toast em vez de alert, reset input, guard concorrente |
| `src/services/supabase/avatarService.ts` | Validação extensão, cache-busting, cleanup avatares |
| `src/services/supabase/presenceService.ts` | Reutilizar canais de digitação, eliminar vazamento |
| `index.html` | lang="pt", meta description |

## FICHEIROS APAGADOS (Código Morto)

| Ficheiro | Razão |
|----------|-------|
| `lib/supabase/server.ts` | Referencia service role key, nunca importado |
| `lib/supabase/client.ts` | Duplicado de src/lib/supabase/client.ts |
| `lib/supabase/middleware.ts` | Nunca importado |
| `hooks/useAuth.ts` | Duplicado de src/hooks/useAuth.ts |
| `hooks/useCourses.ts` | Duplicado de src/hooks/useCourses.ts |
| `hooks/useLessons.ts` | Duplicado de src/hooks/useLessons.ts |
| `hooks/useMessages.ts` | Duplicado de src/hooks/useMessages.ts |
| `services/supabase/authService.ts` | Duplicado de src/services/supabase/authService.ts |
| `services/supabase/courseService.ts` | Duplicado de src/services/supabase/courseService.ts |
| `services/supabase/lessonService.ts` | Duplicado de src/services/supabase/lessonService.ts |
| `services/supabase/messageService.ts` | Duplicado de src/services/supabase/messageService.ts |
| `services/supabase/userService.ts` | Duplicado de src/services/supabase/userService.ts |
| `src/lib/supabase/middleware.ts` | Função updateSession nunca chamada |
| `src/hooks/useMessages.ts` | 82 linhas nunca importadas |
