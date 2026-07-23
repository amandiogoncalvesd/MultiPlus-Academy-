# FASE 3 — Arquitectura e Performance

> **Projeto:** MultiPlus Academy  
> **Data:** 20 de Julho de 2026  
> **Versão do Documento:** 1.0  
> **Objetivo:** Fornecer instruções detalhadas, passo a passo, com caminhos exatos de ficheiros, código antes/depois e justificativas, para que o Gemini possa aplicar todas as modificações sem ambiguidade.  
> **Pré-requisito:** As Fases 0, 1 e 2 já foram aplicadas, incluindo as migrações de banco de dados feitas pelo Claude.

---

## Índice

| # | Tarefa | Severidade | Ficheiro Principal |
|---|--------|------------|-------------------|
| 3.1 | Implementar Code Splitting com `React.lazy()` + `Suspense` | 🔴 CRÍTICO | `App.tsx` + `vite.config.ts` |
| 3.2 | Eliminar duplicação de estado `currentUser` — consolidar no `AuthContext` | 🔴 CRÍTICO | `App.tsx` + `AuthProvider.tsx` + todos os portais |
| 3.3 | Adicionar `ErrorBoundary` global e por rota | 🔴 CRÍTICO | Novo ficheiro + `App.tsx` |
| 3.4 | Configurar Vite build — manual chunks, tree-shaking e source maps | 🔴 CRÍTICO | `vite.config.ts` |
| 3.5 | Ativar TypeScript `strict: true` e eliminar tipos `any` | 🟠 ALTO | `tsconfig.json` + todos os `.ts/.tsx` |
| 3.6 | Consolidar clientes Supabase duplicados | 🔴 CRÍTICO | `lib/supabase/client.ts` (raiz) + `src/lib/supabase/client.ts` |
| 3.7 | Remover ficheiros duplicados na raiz (hooks/ e services/) | 🟠 ALTO | `hooks/` + `services/` (raiz) |
| 3.8 | Quebrar `academicService.ts` (597 linhas) em serviços especializados | 🔴 CRÍTICO | `academicService.ts` + novos ficheiros |
| 3.9 | Eliminar `localStorage` como fallback de banco de dados no `messageService` | 🟠 ALTO | `messageService.ts` |
| 3.10 | Eliminar lógica duplicada de criação de curso (3 serviços fazem o mesmo) | 🟠 ALTO | `academicService.ts` + `courseService.ts` + `enrollmentService.ts` |
| 3.11 | Extrair utilitário compartilhado de mapeamento de utilizador | 🟠 ALTO | Novo ficheiro + múltiplos |
| 3.12 | Eliminar aliases duplicados no `AuthProvider` (`login`/`signIn`, etc.) | 🟡 MÉDIO | `AuthProvider.tsx` |
| 3.13 | Corrigir padrão N+1 no `enrollmentService.getCourseStudents()` | 🟠 ALTO | `enrollmentService.ts` |
| 3.14 | Otimizar `messageService.getConversationPartners()` — evitar carregar TODAS as mensagens | 🔴 CRÍTICO | `messageService.ts` |
| 3.15 | Corrigir subscrições realtime com stale closures no `useStudentData` | 🟠 ALTO | `useStudentData.ts` |
| 3.16 | Implementar `React.memo` e `useMemo`/`useCallback` nos componentes pesados | 🟠 ALTO | Múltiplos componentes |
| 3.17 | Substituir queries `.select('*')` por seleção de colunas específicas | 🟠 ALTO | Todos os serviços |
| 3.18 | Corrigir `@/` alias do tsconfig para apontar para `src/` | 🟡 MÉDIO | `tsconfig.json` + `vite.config.ts` |
| 3.19 | Remover dependências não utilizadas e scaffolding de monorepo | 🟡 MÉDIO | `package.json` + `packages/` |
| 3.20 | Adicionar componente `LoadingSpinner` reutilizável para Suspense fallback | 🟡 MÉDIO | Novo ficheiro + `App.tsx` |

---

## 3.1 — Implementar Code Splitting com `React.lazy()` + `Suspense`

### Problema

O `App.tsx` importa **todos os 14 painéis** estaticamente:

```tsx
// App.tsx — linhas 4-17
import HomePanel from './components/HomePanel';
import AboutPanel from './components/AboutPanel';
import CoursesPanel from './components/CoursesPanel';
import InstructorsPanel from './components/InstructorsPanel';
import BlogPanel from './components/BlogPanel';
import ContactPanel from './components/ContactPanel';
import LoginPanel from './components/LoginPanel';
import StudentPortal from './components/StudentPortal';
import InstructorPortal from './components/InstructorPortal';
import AdminPortal from './components/AdminPortal';
import VerifyCertificatePanel from './components/VerifyCertificatePanel';
import MessagesPage from './components/MessagesPage';
```

Isto significa que **todo o JavaScript** de todos os painéis (incluindo os 4 componentes "deus" de 70KB-93KB cada) é carregado no bundle inicial, mesmo que o utilizador só visite a página "home". O tempo de carregamento inicial é massivamente inflado sem necessidade.

Zero instâncias de `React.lazy` ou `Suspense` existem no projeto.

### Solução

Converter todas as importações estáticas de painéis em importações dinâmicas com `React.lazy()`, envolver o `renderActivePage()` com `<Suspense>`, e garantir que cada painel seja um chunk separado.

### Passo 1 — Criar o componente `LoadingSpinner`

Criar o ficheiro **`src/components/ui/LoadingSpinner.tsx`** (NOVO):

```tsx
import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeMap[size]} border-3 border-[#0A2E5D]/20 border-t-[#C89B3C] rounded-full`}
      />
      {text && (
        <p className="text-xs font-mono tracking-widest uppercase text-slate-400">
          {text}
        </p>
      )}
    </div>
  );
}
```

### Passo 2 — Substituir importações estáticas por `React.lazy` no `App.tsx`

**Ficheiro:** `src/App.tsx`

**ANTES** (linhas 1-22):

```tsx
import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePanel from './components/HomePanel';
import AboutPanel from './components/AboutPanel';
import CoursesPanel from './components/CoursesPanel';
import InstructorsPanel from './components/InstructorsPanel';
import BlogPanel from './components/BlogPanel';
import ContactPanel from './components/ContactPanel';
import LoginPanel from './components/LoginPanel';
import StudentPortal from './components/StudentPortal';
import InstructorPortal from './components/InstructorPortal';
import AdminPortal from './components/AdminPortal';
import VerifyCertificatePanel from './components/VerifyCertificatePanel';
import MessagesPage from './components/MessagesPage';
import { X, GraduationCap, CheckCircle2, Phone, Award, Scale } from 'lucide-react';
import { useAuth } from './components/auth/AuthProvider';
import { supabase } from './lib/supabase/client';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
```

**DEPOIS:**

```tsx
import { useState, useEffect, FormEvent, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId, User } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { X, GraduationCap, CheckCircle2, Phone, Award, Scale } from 'lucide-react';
import { useAuth } from './components/auth/AuthProvider';
import { supabase } from './lib/supabase/client';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Code-split panels — cada um será um chunk separado no bundle final
const HomePanel = lazy(() => import('./components/HomePanel'));
const AboutPanel = lazy(() => import('./components/AboutPanel'));
const CoursesPanel = lazy(() => import('./components/CoursesPanel'));
const InstructorsPanel = lazy(() => import('./components/InstructorsPanel'));
const BlogPanel = lazy(() => import('./components/BlogPanel'));
const ContactPanel = lazy(() => import('./components/ContactPanel'));
const LoginPanel = lazy(() => import('./components/LoginPanel'));
const StudentPortal = lazy(() => import('./components/StudentPortal'));
const InstructorPortal = lazy(() => import('./components/InstructorPortal'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const VerifyCertificatePanel = lazy(() => import('./components/VerifyCertificatePanel'));
const MessagesPage = lazy(() => import('./components/MessagesPage'));
```

**Justificativa:** `Navbar`, `Footer`, `ProtectedRoute`, `LoadingSpinner` e os providers permanecem importados estaticamente porque são necessários imediatamente no primeiro render ou são muito pequenos para justificar um chunk separado. Todos os painéis de página são lazy porque só são renderizados quando o utilizador navega para eles.

### Passo 3 — Envolver `renderActivePage()` com `<Suspense>`

No mesmo ficheiro `src/App.tsx`, modificar a seção `<main>`:

**ANTES** (aproximadamente linhas 261-274):

```tsx
<main className="flex-grow flex flex-col">
  <AnimatePresence mode="wait">
    <motion.div
      key={currentPage}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-grow flex flex-col"
    >
      {renderActivePage()}
    </motion.div>
  </AnimatePresence>
</main>
```

**DEPOIS:**

```tsx
<main className="flex-grow flex flex-col">
  <Suspense fallback={<LoadingSpinner size="lg" text="A carregar página..." />}>
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex-grow flex flex-col"
      >
        {renderActivePage()}
      </motion.div>
    </AnimatePresence>
  </Suspense>
</main>
```

**Justificativa:** O `<Suspense>` com fallback garante que, enquanto o chunk do painel está a ser carregado via rede, o utilizador vê um spinner visualmente coerente com a identidade da marca, em vez de uma tela em branco ou erro.

---

## 3.2 — Eliminar Duplicação de Estado `currentUser` — Consolidar no `AuthContext`

### Problema

O `currentUser` existe em **dois lugares** simultaneamente:

1. **`AuthContext`** (em `AuthProvider.tsx`) — fornecido como `user` via contexto
2. **`App.tsx`** — estado local `const [currentUser, setCurrentUser] = useState<User | null>(null)` sincronizado com `useEffect`:

```tsx
// App.tsx — linhas 25-33
const { user } = useAuth();
const [currentUser, setCurrentUser] = useState<User | null>(null);

useEffect(() => {
  setCurrentUser(user);
}, [user]);
```

Este `currentUser` + `setCurrentUser` é passado como prop para **cada painel** (`StudentPortal`, `InstructorPortal`, `AdminPortal`, `LoginPanel`, `Navbar`), criando prop drilling profundo e desnecessário. Qualquer painel pode chamar `setCurrentUser()` para modificar o estado global sem passar pelo `AuthProvider`, criando inconsistências.

### Solução

1. Adicionar `updateUser` ao `AuthContext` para que os componentes possam atualizar o utilizador através do contexto
2. Remover `currentUser`/`setCurrentUser` do `App.tsx` e de todos os props dos painéis
3. Usar `useAuth()` diretamente em cada componente que precisa do utilizador

### Passo 1 — Adicionar `updateUser` ao `AuthProvider.tsx`

**Ficheiro:** `src/components/auth/AuthProvider.tsx`

**ANTES** — interface `AuthContextType` (linhas 9-24):

```tsx
interface AuthContextType {
  user: User | null;
  session: any;
  profile: SupabaseUserProfile | null;
  role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  register: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  recoverPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}
```

**DEPOIS:**

```tsx
interface AuthContextType {
  user: User | null;
  session: any;
  profile: SupabaseUserProfile | null;
  role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  register: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  recoverPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}
```

Adicionar a função `updateUser` dentro do componente `AuthProvider`, antes do `return`:

```tsx
const updateUser = (updates: Partial<User>) => {
  setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
};
```

Adicionar `updateUser` ao `value` do Provider:

**ANTES** (linhas 210-228):

```tsx
<AuthContext.Provider
  value={{
    user: currentUser,
    session,
    profile: userProfile,
    role: mappedRole,
    loading,
    signIn,
    login,
    signUp,
    register,
    signOut,
    logout,
    resetPassword,
    recoverPassword,
    refreshProfile
  }}
>
```

**DEPOIS:**

```tsx
<AuthContext.Provider
  value={{
    user: currentUser,
    session,
    profile: userProfile,
    role: mappedRole,
    loading,
    signIn,
    login,
    signUp,
    register,
    signOut,
    logout,
    resetPassword,
    recoverPassword,
    refreshProfile,
    updateUser
  }}
>
```

### Passo 2 — Remover `currentUser`/`setCurrentUser` do `App.tsx`

**Ficheiro:** `src/App.tsx`

Remover as linhas:

```tsx
const [currentUser, setCurrentUser] = useState<User | null>(null);

useEffect(() => {
  setCurrentUser(user);
}, [user]);
```

Substituir todas as referências a `currentUser` por `user` (que já vem de `useAuth()`).
Substituir todas as referências a `setCurrentUser` por `updateUser` do contexto.

O `renderActivePage()` fica assim:

**ANTES:**

```tsx
const renderActivePage = () => {
  switch (currentPage) {
    case 'home':
      return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    case 'about':
      return <AboutPanel setCurrentPage={setCurrentPage} />;
    case 'courses':
      return <CoursesPanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    case 'instructors':
      return <InstructorsPanel setCurrentPage={setCurrentPage} />;
    case 'blog':
      return <BlogPanel setCurrentPage={setCurrentPage} />;
    case 'contact':
      return <ContactPanel setCurrentPage={setCurrentPage} />;
    case 'login':
      return <LoginPanel setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />;
    case 'student-dashboard':
      return (
        <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <StudentPortal 
            setCurrentPage={setCurrentPage} 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            setVerificationCode={setVerificationCode}
          />
        </ProtectedRoute>
      );
    case 'instructor-dashboard':
      return (
        <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <InstructorPortal setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />
        </ProtectedRoute>
      );
    case 'admin-dashboard':
      return (
        <ProtectedRoute allowedRoles={['ADMIN']} setCurrentPage={setCurrentPage}>
          <AdminPortal setCurrentPage={setCurrentPage} currentUser={currentUser} setCurrentUser={setCurrentUser} />
        </ProtectedRoute>
      );
    case 'verify-certificate':
      return (
        <VerifyCertificatePanel 
          setCurrentPage={setCurrentPage} 
          verificationCode={verificationCode} 
          setVerificationCode={setVerificationCode}
        />
      );
    case 'messages':
      return (
        <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <MessagesPage setCurrentPage={setCurrentPage} previousDashboardPage={previousDashboardPage} />
        </ProtectedRoute>
      );
    default:
      return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
  }
};
```

**DEPOIS:**

```tsx
const renderActivePage = () => {
  switch (currentPage) {
    case 'home':
      return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    case 'about':
      return <AboutPanel setCurrentPage={setCurrentPage} />;
    case 'courses':
      return <CoursesPanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
    case 'instructors':
      return <InstructorsPanel setCurrentPage={setCurrentPage} />;
    case 'blog':
      return <BlogPanel setCurrentPage={setCurrentPage} />;
    case 'contact':
      return <ContactPanel setCurrentPage={setCurrentPage} />;
    case 'login':
      return <LoginPanel setCurrentPage={setCurrentPage} />;
    case 'student-dashboard':
      return (
        <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <StudentPortal 
            setCurrentPage={setCurrentPage} 
            setVerificationCode={setVerificationCode}
          />
        </ProtectedRoute>
      );
    case 'instructor-dashboard':
      return (
        <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <InstructorPortal setCurrentPage={setCurrentPage} />
        </ProtectedRoute>
      );
    case 'admin-dashboard':
      return (
        <ProtectedRoute allowedRoles={['ADMIN']} setCurrentPage={setCurrentPage}>
          <AdminPortal setCurrentPage={setCurrentPage} />
        </ProtectedRoute>
      );
    case 'verify-certificate':
      return (
        <VerifyCertificatePanel 
          setCurrentPage={setCurrentPage} 
          verificationCode={verificationCode} 
          setVerificationCode={setVerificationCode}
        />
      );
    case 'messages':
      return (
        <ProtectedRoute allowedRoles={['ALUNO', 'PROFESSOR', 'ADMIN']} setCurrentPage={setCurrentPage}>
          <MessagesPage setCurrentPage={setCurrentPage} previousDashboardPage={previousDashboardPage} />
        </ProtectedRoute>
      );
    default:
      return <HomePanel setCurrentPage={setCurrentPage} onOpenSignUp={() => setIsSignUpOpen(true)} />;
  }
};
```

Também atualizar o `Navbar` (que recebe `currentUser`/`setCurrentUser`):

**ANTES:**

```tsx
<Navbar 
  currentPage={currentPage} 
  setCurrentPage={setCurrentPage} 
  onOpenSignUp={() => {
    setSignUpCourse(courses[0]?.id || '');
    setIsSignUpOpen(true);
  }} 
  currentUser={currentUser}
  setCurrentUser={setCurrentUser}
/>
```

**DEPOIS:**

```tsx
<Navbar 
  currentPage={currentPage} 
  setCurrentPage={setCurrentPage} 
  onOpenSignUp={() => {
    setSignUpCourse(courses[0]?.id || '');
    setIsSignUpOpen(true);
  }} 
/>
```

### Passo 3 — Atualizar cada painel para usar `useAuth()` em vez de props

**Ficheiro:** `src/components/StudentPortal.tsx`

**ANTES** — interface e destructuring (linhas 57-69):

```tsx
interface StudentPortalProps {
  setCurrentPage: (page: PageId) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentPortal({
  setCurrentPage,
  currentUser,
  setCurrentUser,
  setVerificationCode
}: StudentPortalProps) {
```

**DEPOIS:**

```tsx
interface StudentPortalProps {
  setCurrentPage: (page: PageId) => void;
  setVerificationCode: (code: string) => void;
}

export default function StudentPortal({
  setCurrentPage,
  setVerificationCode
}: StudentPortalProps) {
  const { user: currentUser, updateUser: setCurrentUser } = useAuth();
```

**Atenção:** Onde `setCurrentUser` era chamado com um objeto `User | null`, agora `updateUser` recebe `Partial<User>`. Substituir todas as chamadas `setCurrentUser(updatedUser)` por `updateUser(updatedUser)`. Onde era `setCurrentUser(null)` (logout), usar `signOut()` do `useAuth()`.

Fazer a mesma alteração para:

- **`src/components/AdminPortal.tsx`** — remover `currentUser`/`setCurrentUser` dos props, usar `useAuth()`
- **`src/components/InstructorPortal.tsx`** — remover `currentUser`/`setCurrentUser` dos props, usar `useAuth()`
- **`src/components/LoginPanel.tsx`** — remover `currentUser`/`setCurrentUser` dos props, usar `useAuth()`
- **`src/components/Navbar.tsx`** — remover `currentUser`/`setCurrentUser` dos props, usar `useAuth()`

Para cada um destes ficheiros, o padrão é o mesmo:

1. Remover `currentUser` e `setCurrentUser` da interface de props
2. Remover do destructuring
3. Adicionar `const { user: currentUser, updateUser: setCurrentUser } = useAuth();` no topo do componente
4. Substituir `setCurrentUser(null)` por `signOut()` (importar de `useAuth`)
5. Substituir `setCurrentUser(updatedUserObj)` por `updateUser(updatedUserObj)`

---

## 3.3 — Adicionar `ErrorBoundary` Global e por Rota

### Problema

Não existe nenhum `ErrorBoundary` no projeto. Qualquer erro de runtime (ex: falha de rede ao carregar dados, prop undefined, etc.) causa um crash de todo o aplicativo sem recuperação. O utilizador vê uma tela branca sem informação.

### Solução

Criar um componente `ErrorBoundary` de classe (React ainda requer componentes de classe para error boundaries) e envolver a aplicação.

### Passo 1 — Criar `ErrorBoundary`

**Ficheiro:** `src/components/ui/ErrorBoundary.tsx` (NOVO)

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-serif font-bold text-[#0A2E5D] mb-2">
            Algo correu mal
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Ocorreu um erro inesperado. Tente recarregar a página ou contacte o suporte se o problema persistir.
          </p>
          <details className="mb-4 text-left max-w-md w-full">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 text-xs bg-slate-100 p-3 rounded-lg overflow-auto max-h-32 text-red-700">
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-[#0A2E5D] text-white text-xs font-mono uppercase tracking-widest font-bold rounded-xl hover:bg-[#123C73] transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Passo 2 — Envolver a aplicação no `App.tsx`

**Ficheiro:** `src/App.tsx`

Adicionar a importação no topo:

```tsx
import ErrorBoundary from './components/ui/ErrorBoundary';
```

Envolver o conteúdo principal:

**ANTES:**

```tsx
return (
  <ToastProvider>
    <div id="multiplus-portal-root" ...>
      ...
    </div>
  </ToastProvider>
);
```

**DEPOIS:**

```tsx
return (
  <ToastProvider>
    <ErrorBoundary>
      <div id="multiplus-portal-root" ...>
        ...
      </div>
    </ErrorBoundary>
  </ToastProvider>
);
```

---

## 3.4 — Configurar Vite Build — Manual Chunks, Tree-shaking e Source Maps

### Problema

O `vite.config.ts` atual não tem nenhuma configuração de build:

```ts
// vite.config.ts atual
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: { ... },
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: { ... },
  };
});
```

Sem `build.rollupOptions.output.manualChunks`, o Vite agrupa tudo num único arquivo JS. Sem configuração de source maps, a depuração em produção é impossível. Sem `terserOptions`, o tree-shaking de console.log não é feito.

### Solução

**Ficheiro:** `vite.config.ts`

**ANTES:**

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

**DEPOIS:**

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Gerar source maps para depuração em produção
      sourcemap: true,
      // Limpar diretório de saída antes de cada build
      emptyOutDir: true,
      // Tamanho máximo de chunk para warning (500KB)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // Estratégia de nomeação de arquivos para cache eficiente
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // Separar dependências grandes em chunks dedicados
          manualChunks: {
            // React core — raramente muda, cache de longo prazo
            'vendor-react': ['react', 'react-dom'],
            // Motion (Framer Motion) — biblioteca grande de animação
            'vendor-motion': ['motion/react'],
            // Supabase — cliente pesado
            'vendor-supabase': ['@supabase/supabase-js'],
            // Lucide icons — icones SVG
            'vendor-lucide': ['lucide-react'],
            // PDF generation
            'vendor-pdf': ['jspdf'],
            // GSAP animations
            'vendor-gsap': ['gsap'],
          },
        },
      },
      // Minificação com esbuild (padrão do Vite, mais rápido que terser)
      minify: 'esbuild',
      // Alvo de compatibilidade do navegador
      target: 'es2022',
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

**Justificativa dos manual chunks:**

| Chunk | Dependências | Razão |
|-------|-------------|--------|
| `vendor-react` | react, react-dom | Núcleo do framework, muda raramente, cache de longo prazo |
| `vendor-motion` | motion/react | ~45KB minificado, só muda quando atualizamos animações |
| `vendor-supabase` | @supabase/supabase-js | ~80KB, cliente de BD, cache agressivo |
| `vendor-lucide` | lucide-react | ~30KB de ícones, independente da lógica |
| `vendor-pdf` | jspdf | ~200KB, só usado ao exportar PDF |
| `vendor-gsap` | gsap | ~60KB, animações avançadas |

Isto garante que mudanças no código da aplicação NÃO invalidam o cache do browser para as bibliotecas, reduzindo drasticamente o tempo de carregamento em visitas subsequentes.

---

## 3.5 — Ativar TypeScript `strict: true` e Eliminar Tipos `any`

### Problema

O `tsconfig.json` não tem `strict: true`. Tipos `any` são usados extensivamente:

- `App.tsx:29` — `const [courses, setCourses] = useState<any[]>([])`
- `useStudentData.ts:7-12` — todos os estados são `any[]`
- `academicService.ts:52` — `getCourses(): Promise<any[]>`
- `enrollmentService.ts:67,108,215` — múltiplos `any[]`
- `AdminPortal.tsx:31` — `INITIAL_AUDIT_LOGS: any[]`

Isto mascara erros de tipo, impede autocomplete e permite atribuições inválidas sem aviso.

### Solução

**Passo 1 — Ativar `strict` no `tsconfig.json`**

**Ficheiro:** `tsconfig.json`

**ANTES:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*", "vite.config.ts"]
}
```

**DEPOIS:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*", "vite.config.ts"]
}
```

**Passo 2 — Substituir tipos `any` por interfaces específicas**

Após ativar `strict`, muitos erros de tipo aparecerão. Eis as substituições prioritárias:

**`App.tsx` — linhas 29:**

```tsx
// ANTES
const [courses, setCourses] = useState<any[]>([]);

// DEPOIS — usar o tipo Course existente
const [courses, setCourses] = useState<Course[]>([]);
```

**`useStudentData.ts` — linhas 7-12:**

```tsx
// ANTES
const [enrollments, setEnrollments] = useState<any[]>([]);
const [certificates, setCertificates] = useState<any[]>([]);
const [realLessons, setRealLessons] = useState<any[]>([]);
const [completedLessons, setCompletedLessons] = useState<string[]>([]);
const [scheduledLessons, setScheduledLessons] = useState<any[]>([]);
const [notifications, setNotifications] = useState<any[]>([]);

// DEPOIS
import { Course, Enrollment } from '../../types';
import { DBEnrollment, DBLesson, DBCertificate } from '../../services/supabase/academicService';

interface AppNotification {
  id: string;
  user_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

interface ScheduledLesson {
  id: string;
  lesson_id: string;
  student_id: string;
  course_id: string;
  lesson: DBLesson & { course: Course };
}

const [enrollments, setEnrollments] = useState<DBEnrollment[]>([]);
const [certificates, setCertificates] = useState<DBCertificate[]>([]);
const [realLessons, setRealLessons] = useState<DBLesson[]>([]);
const [completedLessons, setCompletedLessons] = useState<string[]>([]);
const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
const [notifications, setNotifications] = useState<AppNotification[]>([]);
```

**`academicService.ts` — linha 52 e em diante:**

Substituir todos os retornos `Promise<any[]>` e `Promise<any>` pelos tipos específicos (`DBEnrollment`, `DBLesson`, `DBModule`, `DBCertificate`, etc.) que já existem no próprio ficheiro.

**Nota importante:** Ativar `strict: true` gerará MUITOS erros de compilação em todo o projeto. O Gemini deve aplicar esta alteração **por último** nesta fase, após todas as outras modificações de arquitetura terem sido aplicadas, e então corrigir os erros iterativamente. É esperado que hajam 50-100+ erros iniciais, a maioria relacionados a `any` implícitos e null checks. Corrigir sistematicamente ficheiro por ficheiro.

---

## 3.6 — Consolidar Clientes Supabase Duplicados

### Problema

Existem DOIS ficheiros `client.ts` com lógica diferente:

1. **`src/lib/supabase/client.ts`** (usado por todo `src/`):
```ts
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing...');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

2. **`lib/supabase/client.ts`** (na raiz, mais robusto):
```ts
const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder')...;
const isKeyValid = rawKey && rawKey !== 'placeholder-anon-key'...;
export const isSupabaseMock = !isUrlValid || !isKeyValid;
export const supabase = createClient(isUrlValid ? rawUrl : 'https://placeholder...', ...);
```

O ficheiro na raiz tem validação mais robusta e exporta `isSupabaseMock`. O de `src/` cria um cliente com strings vazias se as variáveis faltarem, o que causa erros silenciosos.

### Solução

Consolidar tudo num único ficheiro em `src/lib/supabase/client.ts` com a lógica robusta, e eliminar o ficheiro na raiz.

**Ficheiro:** `src/lib/supabase/client.ts`

**DEPOIS:**

```ts
import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const isUrlValid = rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('placeholder') && !rawUrl.includes('your-project');
const isKeyValid = rawKey && rawKey !== 'placeholder-anon-key' && rawKey !== 'your-anon-key' && !rawKey.startsWith('your-');

if (!isUrlValid || !isKeyValid) {
  console.warn(
    'Supabase: Credenciais inválidas ou ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env. A autenticação não funcionará.'
  );
}

export const supabase = createClient(
  isUrlValid ? rawUrl : 'https://placeholder-project.supabase.co',
  isKeyValid ? rawKey : 'placeholder-anon-key',
  {
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
  }
);

export const isSupabaseMock = !isUrlValid || !isKeyValid;
```

**Eliminar** o ficheiro `lib/supabase/client.ts` da raiz (e também `lib/supabase/middleware.ts` e `lib/supabase/server.ts` se existirem). Certificar-se de que nenhum ficheiro importa de `../../lib/supabase/client` ou `../lib/supabase/client` da raiz — todos devem importar de `src/lib/supabase/client`.

**Verificação:** Procurar em todo o projeto por importações do caminho antigo:

```bash
grep -r "from '../../lib/supabase/client'" src/
grep -r "from '../lib/supabase/client'" src/
```

Todos os resultados devem apontar para `src/lib/supabase/client.ts` (que é o ficheiro consolidado). Se existirem importações do caminho da raiz, corrigir para o caminho relativo correto dentro de `src/`.

---

## 3.7 — Remover Ficheiros Duplicados na Raiz (hooks/ e services/)

### Problema

Na raiz do projeto existem diretórios `hooks/` e `services/supabase/` que são simples re-exports dos ficheiros em `src/hooks/` e `src/services/supabase/`:

```
hooks/useAuth.ts          → re-exporta de src/hooks/useAuth
hooks/useCourses.ts       → re-exporta de src/hooks/useCourses
hooks/useLessons.ts       → re-exporta de src/hooks/useLessons
hooks/useMessages.ts      → re-exporta de src/hooks/useMessages
services/supabase/authService.ts     → re-exporta de src/services/supabase/authService
services/supabase/courseService.ts   → re-exporta de src/services/supabase/courseService
services/supabase/lessonService.ts   → re-exporta de src/services/supabase/lessonService
services/supabase/userService.ts     → re-exporta de src/services/supabase/userService
services/supabase/messageService.ts  → re-exporta de src/services/supabase/messageService
```

Estes ficheiros criam confusão sobre qual importação usar e não são referenciados por nenhum ficheiro dentro de `src/`.

### Solução

1. **Verificar** que nenhum ficheiro em `src/` importa destes caminhos da raiz:

```bash
grep -rn "from '../../hooks/" src/
grep -rn "from '../../services/" src/
grep -rn "from '../hooks/" src/
```

2. **Eliminar** os diretórios duplicados:

```bash
rm -rf hooks/
rm -rf services/
```

3. **Também eliminar** `lib/` na raiz se existir (após consolidar o cliente Supabase na tarefa 3.6):

```bash
rm -rf lib/
```

---

## 3.8 — Quebrar `academicService.ts` (597 linhas) em Serviços Especializados

### Problema

O `academicService.ts` é um serviço "deus" com 597 linhas que toca em 11+ tabelas e mistura responsabilidades completamente diferentes:

- CRUD de cursos (courses)
- CRUD de módulos (modules) 
- CRUD de aulas (lessons)
- Matrículas (enrollments)
- Progresso de aulas (lesson_progress)
- Certificados (certificates)
- Quiz (quiz_submissions)
- Agendamento (lesson_targets)
- Progresso de vídeo (lesson_progress)
- Apontamentos (lesson_notes)
- Materiais (materials)
- Tarefas (assignments + assignment_submissions)

Isto viola o Princípio da Responsabilidade Única, dificulta testes, e faz com que qualquer alteração num subsistema risque quebrar outro.

### Solução

Dividir `academicService.ts` em 5 serviços especializados, mantendo o ficheiro original como um barrel re-export para compatibilidade temporária (a ser removido na Fase 4).

### Passo 1 — Criar `src/services/supabase/quizService.ts` (NOVO)

```ts
import { supabase } from '../../lib/supabase/client';

export const quizService = {
  async getQuizByLesson(lessonId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('quiz')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching quiz by lesson:', error);
      throw error;
    }
    return data?.quiz || [];
  },

  async submitQuizResponse(userId: string, lessonId: string, score: number, answers: any): Promise<any> {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .upsert({
        student_id: userId,
        lesson_id: lessonId,
        answers: answers,
        score: score,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'student_id,lesson_id' })
      .select()
      .single();

    if (error) {
      console.error('Error submitting quiz response:', error);
      throw error;
    }
    return data;
  },

  async getQuizSubmissions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('quiz_submissions')
      .select('*')
      .eq('student_id', userId);

    if (error) {
      console.error('Error fetching quiz submissions:', error);
      return [];
    }
    return data || [];
  }
};
```

### Passo 2 — Criar `src/services/supabase/schedulingService.ts` (NOVO)

```ts
import { supabase } from '../../lib/supabase/client';

export const schedulingService = {
  async scheduleLesson(lessonId: string, studentId: string, courseId: string, scheduledAt: string): Promise<any> {
    const { data: targetData, error: targetError } = await supabase
      .from('lesson_targets')
      .upsert({
        lesson_id: lessonId,
        student_id: studentId,
        course_id: courseId
      }, { onConflict: 'lesson_id,student_id' })
      .select()
      .single();

    if (targetError) {
      console.error('Error inserting into lesson_targets:', targetError);
      throw targetError;
    }

    const { error: lessonError } = await supabase
      .from('lessons')
      .update({
        scheduled_at: scheduledAt,
        status: 'PUBLISHED'
      })
      .eq('id', lessonId);

    if (lessonError) {
      console.warn('Error updating scheduled_at on lessons:', lessonError);
    }

    return targetData;
  },

  async getScheduledLessonsForStudent(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_targets')
      .select('*, lesson:lessons(*, course:courses(*))')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching scheduled lessons for student:', error);
      return [];
    }
    return data || [];
  },

  async getScheduledLessonsForProfessor(): Promise<any[]> {
    const { data, error } = await supabase
      .from('lesson_targets')
      .select('*, lesson:lessons(*, course:courses(*)), student:users(*)');

    if (error) {
      console.error('Error fetching scheduled lessons for professor:', error);
      return [];
    }
    return data || [];
  }
};
```

### Passo 3 — Criar `src/services/supabase/noteService.ts` (NOVO)

```ts
import { supabase } from '../../lib/supabase/client';

export const noteService = {
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
  }
};
```

### Passo 4 — Criar `src/services/supabase/progressService.ts` (NOVO)

```ts
import { supabase } from '../../lib/supabase/client';

export const progressService = {
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

  async markLessonComplete(studentId: string, courseId: string, lessonId: string, completed = true): Promise<boolean> {
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId,
        completed
      }, { onConflict: 'student_id,lesson_id' });

    if (error) {
      console.error('Upsert on lesson_progress failed:', error);
      throw error;
    }
    return true;
  },

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

  async getStudentProgressMetrics(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_student_progress')
      .select('*')
      .eq('student_id', userId);

    if (error) {
      console.warn('Error fetching student progress metrics from view, running direct calculation fallback:', error);
      try {
        const completed = await this.getCompletedLessons(userId, '');
        const { data: submissions } = await supabase
          .from('quiz_submissions')
          .select('score')
          .eq('student_id', userId);

        const avgScore = submissions && submissions.length > 0
          ? Math.round(submissions.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0) / submissions.length)
          : 0;

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
      } catch (fallbackErr) {
        console.error('Fallback calculation also failed:', fallbackErr);
        return [];
      }
    }
    return data || [];
  }
};
```

### Passo 5 — Criar `src/services/supabase/materialService.ts` (NOVO)

```ts
import { supabase } from '../../lib/supabase/client';

export const materialService = {
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
  }
};
```

### Passo 6 — Atualizar `academicService.ts` como barrel re-export

**Ficheiro:** `src/services/supabase/academicService.ts`

Manter as interfaces exportadas e as funções que NÃO foram movidas (courses CRUD, modules, lessons CRUD, enrollments, certificates), e re-exportar dos novos serviços para compatibilidade:

**Substituir TODO o conteúdo do ficheiro por:**

```ts
import { supabase } from '../../lib/supabase/client';
import { Course } from '../../types';
import { quizService } from './quizService';
import { schedulingService } from './schedulingService';
import { noteService } from './noteService';
import { progressService } from './progressService';
import { materialService } from './materialService';

// Re-exportar serviços especializados para compatibilidade temporária
// Os consumidores devem migrar para importar diretamente dos novos serviços
export { quizService } from './quizService';
export { schedulingService } from './schedulingService';
export { noteService } from './noteService';
export { progressService } from './progressService';
export { materialService } from './materialService';

// =========================================================================
// Interfaces compartilhadas (mantidas aqui pois são usadas por múltiplos serviços)
// =========================================================================

export interface DBEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  data_inicio: string;
  progress_percent?: number;
}

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

export interface DBModule {
  id: string;
  course_id: string;
  titulo: string;
  ordem: number;
}

export interface DBCertificate {
  id: string;
  student_id: string;
  course_id: string;
  codigo_validacao: string;
  emitido_em: string;
  final_grade?: string;
}

export interface DBLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  created_at: string;
}

// =========================================================================
// Serviço acadêmico — apenas cursos, módulos, aulas, matrículas e certificados
// =========================================================================

export const academicService = {
  // =========================================================================
  // 1. COURSES CRUD
  // =========================================================================
  async getCourses(onlyActive = true): Promise<any[]> {
    let query = supabase.from('courses').select('*');
    if (onlyActive) {
      query = query.eq('status', 'PUBLISHED');
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
    return data || [];
  },

  async createCourse(course: any): Promise<any> {
    const titleVal = course.title || course.titulo || 'Novo Curso';
    const slugVal = course.slug || titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: titleVal,
        slug: slugVal,
        description: course.description || course.descricao || course.subtitle || '',
        duration: course.duration || course.duracao || '12 Semanas',
        category: course.category || course.categoria || 'Geral',
        status: course.status || 'DRAFT',
        thumbnail: course.thumbnail || course.imagem || null,
        teacher_id: course.teacher_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }
    return data;
  },

  async updateCourse(id: string, updates: any): Promise<any> {
    const payload: any = {};
    if (updates.title !== undefined || updates.titulo !== undefined) payload.title = updates.title || updates.titulo;
    if (updates.description !== undefined || updates.descricao !== undefined) payload.description = updates.description || updates.descricao;
    if (updates.duration !== undefined || updates.duracao !== undefined) payload.duration = updates.duration || updates.duracao;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.thumbnail !== undefined || updates.imagem !== undefined) payload.thumbnail = updates.thumbnail || updates.imagem;
    if (updates.category !== undefined || updates.categoria !== undefined) payload.category = updates.category || updates.categoria;

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      throw error;
    }
    return data;
  },

  async deleteCourse(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 2. MODULES SYSTEM
  // =========================================================================
  async getCourseModules(courseId: string): Promise<DBModule[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`Error fetching modules for course ${courseId}:`, error);
      throw error;
    }
    return data || [];
  },

  async createModule(courseId: string, titulo: string, ordem: number): Promise<DBModule> {
    const { data, error } = await supabase
      .from('modules')
      .insert({ course_id: courseId, titulo, ordem })
      .select()
      .single();

    if (error) {
      console.error('Error creating module:', error);
      throw error;
    }
    return data;
  },

  // =========================================================================
  // 3. LESSONS AND MATERIALS SYSTEM
  // =========================================================================
  async getLessons(courseId: string): Promise<DBLesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
    return data || [];
  },

  async createLesson(lesson: Partial<DBLesson>): Promise<DBLesson> {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
    return data;
  },

  async deleteLesson(lessonId: string): Promise<boolean> {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
    return true;
  },

  // =========================================================================
  // 4. ENROLLMENTS
  // =========================================================================
  async enrollStudent(studentId: string, courseId: string): Promise<DBEnrollment> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
    return data;
  },

  async getStudentEnrollments(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching student enrollments:', error);
      return [];
    }
    return data || [];
  },

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

  // =========================================================================
  // 5. CERTIFICATES
  // =========================================================================
  async getStudentCertificates(studentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, course:courses(*)')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }
    return data || [];
  },

  async verifyCertificate(codigo: string): Promise<any> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, student:users(*), course:courses(*)')
      .eq('codigo_validacao', codigo.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
    return data;
  },

  // =========================================================================
  // 6. DELEGATED METHODS (compatibilidade — chamar serviços especializados)
  // =========================================================================
  // Quiz
  getQuizByLesson: quizService.getQuizByLesson,
  submitQuizResponse: quizService.submitQuizResponse,
  getQuizSubmissions: quizService.getQuizSubmissions,

  // Scheduling
  scheduleLesson: schedulingService.scheduleLesson,
  getScheduledLessonsForStudent: schedulingService.getScheduledLessonsForStudent,
  getScheduledLessonsForProfessor: schedulingService.getScheduledLessonsForProfessor,

  // Progress
  getCompletedLessons: progressService.getCompletedLessons,
  markLessonComplete: progressService.markLessonComplete,
  saveVideoProgress: progressService.saveVideoProgress,
  getVideoProgress: progressService.getVideoProgress,
  getStudentProgressMetrics: progressService.getStudentProgressMetrics,

  // Notes
  getLessonNotes: noteService.getLessonNotes,
  saveLessonNote: noteService.saveLessonNote,

  // Materials & Assignments
  getStudentMaterials: materialService.getStudentMaterials,
  getStudentAssignments: materialService.getStudentAssignments,
  submitAssignment: materialService.submitAssignment,
};
```

**Justificativa:** Os métodos delegados garantem que todo o código existente que importa de `academicService` continue a funcionar sem alterações. Na Fase 4, os consumidores devem migrar para importar diretamente dos serviços especializados, e os métodos delegados serão removidos.

---

## 3.9 — Eliminar `localStorage` como Fallback de Banco de Dados no `messageService`

### Problema

O `messageService.ts` usa `localStorage` como fallback de banco de dados em múltiplas funções:

1. **`deleteMessageForMe`** (linha 220-238): salva IDs em `localStorage` quando a tabela `message_deletions` falha
2. **`clearConversation`** (linha 242-262): salva timestamp em `localStorage` quando `conversation_clears` falha
3. **`getConversationClearTimestamp`** (linha 265-280): lê do `localStorage` como fallback
4. **`addReaction`** (linha 441-456): salva reações em `localStorage` quando `message_reactions` falha
5. **`removeReaction`** (linha 458-475): salva reações em `localStorage`
6. **`pinMessage`** (linha 478-494): salva pins em `localStorage`
7. **`unpinMessage`** (linha 496-512): salva pins em `localStorage`

Isto cria estado "split-brain": o dado existe no `localStorage` do browser mas NÃO no servidor. Se o utilizador limpar o cache, mudar de browser, ou usar outro dispositivo, os dados desaparecem. Também contamina o `getConversationPartners` que precisa ler do `localStorage` para filtrar mensagens.

### Solução

Remover todos os fallbacks de `localStorage`. Se a tabela não existir, lançar um erro claro em vez de silenciosamente persistir localmente.

### Passo 1 — Corrigir `deleteMessageForMe`

**ANTES** (linhas 220-238):

```ts
async deleteMessageForMe(userId: string, messageId: string, partnerId: string): Promise<boolean> {
  const deletedForMeKey = `chat_deleted_for_me_${userId}_${partnerId}`;
  try {
    const { error } = await supabase
      .from('message_deletions')
      .upsert({ user_id: userId, message_id: messageId }, { onConflict: 'user_id,message_id' });
    
    if (error) throw error;
  } catch (err) {
    console.warn('Durable deletion table not found. Using client-side localStorage fallback.', err);
  } finally {
    const localDeleted = JSON.parse(localStorage.getItem(deletedForMeKey) || '[]');
    if (!localDeleted.includes(messageId)) {
      localStorage.setItem(deletedForMeKey, JSON.stringify([...localDeleted, messageId]));
    }
  }
  return true;
},
```

**DEPOIS:**

```ts
async deleteMessageForMe(userId: string, messageId: string, _partnerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('message_deletions')
    .upsert({ user_id: userId, message_id: messageId }, { onConflict: 'user_id,message_id' });
  
  if (error) {
    console.error('Erro ao eliminar mensagem para mim (tabela message_deletions):', error);
    throw error;
  }
  return true;
},
```

### Passo 2 — Corrigir `clearConversation`

**ANTES** (linhas 242-262):

```ts
async clearConversation(userId: string, partnerId: string): Promise<boolean> {
  const clearedAt = new Date().toISOString();
  localStorage.setItem(`chat_clear_${userId}_${partnerId}`, clearedAt);
  try {
    const { error } = await supabase
      .from('conversation_clears')
      .upsert({ ... }, { onConflict: 'user_id,partner_id' });
    if (error) throw error;
  } catch (error) {
    console.warn('Failed to upsert conversation clear to server, fallback local clear used:', error);
  }
  return true;
},
```

**DEPOIS:**

```ts
async clearConversation(userId: string, partnerId: string): Promise<boolean> {
  const clearedAt = new Date().toISOString();
  const { error } = await supabase
    .from('conversation_clears')
    .upsert({
      user_id: userId,
      partner_id: partnerId,
      cleared_at: clearedAt
    }, { onConflict: 'user_id,partner_id' });
  
  if (error) {
    console.error('Erro ao limpar conversa (tabela conversation_clears):', error);
    throw error;
  }
  return true;
},
```

### Passo 3 — Corrigir `getConversationClearTimestamp`

**ANTES** (linhas 265-280):

```ts
async getConversationClearTimestamp(userId: string, partnerId: string): Promise<string | null> {
  const localVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
  try {
    const { data, error } = await supabase
      .from('conversation_clears')
      .select('cleared_at')
      .eq('user_id', userId)
      .eq('partner_id', partnerId)
      .maybeSingle();
    
    if (error || !data) return localVal;
    return data.cleared_at;
  } catch {
    return localVal;
  }
},
```

**DEPOIS:**

```ts
async getConversationClearTimestamp(userId: string, partnerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversation_clears')
    .select('cleared_at')
    .eq('user_id', userId)
    .eq('partner_id', partnerId)
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao buscar timestamp de limpeza:', error);
    return null;
  }
  return data?.cleared_at || null;
},
```

### Passo 4 — Corrigir `addReaction`, `removeReaction`, `pinMessage`, `unpinMessage`

Para cada uma destas 4 funções, remover o bloco `catch` que salva em `localStorage`. O padrão é o mesmo:

**ANTES (padrão):**

```ts
async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: userId, emoji });
    if (error) throw error;
    return true;
  } catch {
    const key = `local_reactions_${messageId}`;
    const reactions = JSON.parse(localStorage.getItem(key) || '[]');
    reactions.push({ userId, emoji });
    localStorage.setItem(key, JSON.stringify(reactions));
    return true;
  }
},
```

**DEPOIS:**

```ts
async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
  const { error } = await supabase
    .from('message_reactions')
    .insert({ message_id: messageId, user_id: userId, emoji });
  if (error) {
    console.error('Erro ao adicionar reação (tabela message_reactions):', error);
    throw error;
  }
  return true;
},
```

Aplicar o mesmo padrão para `removeReaction`, `pinMessage`, `unpinMessage` — remover os blocos `catch { localStorage... }` e em vez disso lançar o erro.

### Passo 5 — Remover referências a `localStorage` no `getConversationPartners`

Na função `getConversationPartners` (linhas 361-420), remover as leituras de `localStorage`:

**ANTES** (linhas 372-380):

```ts
const localClearVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
if (localClearVal && new Date(msg.created_at).getTime() <= new Date(localClearVal).getTime()) {
  return;
}

const localDeleted = JSON.parse(localStorage.getItem(`chat_deleted_for_me_${userId}_${partnerId}`) || '[]');
if (localDeleted.includes(msg.id)) {
  return;
}
```

**DEPOIS:**

```ts
// A filtragem de mensagens eliminadas/limpas agora é feita pelo servidor
// através das tabelas message_deletions e conversation_clears
```

Remover estas linhas completamente. As filtragens serão tratadas no nível do servidor via RLS ou query.

---

## 3.10 — Eliminar Lógica Duplicada de Criação de Curso (3 Serviços Fazem o Mesmo)

### Problema

A lógica de criar curso está duplicada em 3 lugares:

1. **`academicService.createCourse()`** — gera slug, insere na tabela `courses`
2. **`courseService.createCourse()`** — gera slug (código idêntico), insere na tabela `courses`
3. Ambos geram slug da mesma forma: `titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-') + random`

A mesma duplicação existe para `enrollStudent()`:
1. **`academicService.enrollStudent()`** — insert simples
2. **`courseService.enrollStudent()`** — insert simples (idêntico)
3. **`enrollmentService.enrollStudent()`** — insert + progress + notification (mais completo)

### Solução

Consolidar toda a criação de cursos e matrículas nos serviços especializados (`courseService` e `enrollmentService`), removendo as versões duplicadas do `academicService`.

### Passo 1 — Extrair `generateSlug` como utilitário

Criar **`src/lib/utils/slug.ts`** (NOVO):

```ts
/**
 * Gera um slug URL-friendly a partir de um título.
 * Adiciona um sufixo numérico aleatório para evitar colisões.
 */
export function generateSlug(title: string): string {
  const base = (title || 'novo-curso')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}
```

### Passo 2 — Atualizar `courseService.createCourse()` para usar o utilitário

**Ficheiro:** `src/services/supabase/courseService.ts`

**ANTES** (linhas 89-117):

```ts
async createCourse(course: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
  const titleVal = course.title || 'Novo Curso';
  const slugVal = course.slug || titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  // ...
```

**DEPOIS:**

```ts
import { generateSlug } from '../../lib/utils/slug';

// ...

async createCourse(course: Partial<SupabaseCourse>): Promise<SupabaseCourse> {
  const titleVal = course.title || 'Novo Curso';
  const slugVal = course.slug || generateSlug(titleVal);
  // ... resto inalterado
```

### Passo 3 — Atualizar `academicService.createCourse()` para usar o mesmo utilitário

**Ficheiro:** `src/services/supabase/academicService.ts`

```ts
import { generateSlug } from '../../lib/utils/slug';

// Na função createCourse:
const slugVal = course.slug || generateSlug(titleVal);
```

### Passo 4 — Remover `academicService.enrollStudent()` e redirecionar para `enrollmentService`

No `academicService`, o método `enrollStudent` é uma versão simplificada e incompleta do `enrollmentService.enrollStudent()`. Substituir por delegação:

**ANTES:**

```ts
async enrollStudent(studentId: string, courseId: string): Promise<DBEnrollment> {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      course_id: courseId,
      status: 'ACTIVE'
    })
    .select()
    .single();
  // ...
},
```

**DEPOIS:**

```ts
import { enrollmentService } from './enrollmentService';

// No objeto academicService:
enrollStudent: enrollmentService.enrollStudent.bind(enrollmentService),
```

Da mesma forma, remover `courseService.enrollStudent()` e `courseService.getStudentEnrollments()` (duplicados do `enrollmentService`), e redirecionar os consumidores para usar `enrollmentService` diretamente.

---

## 3.11 — Extrair Utilitário Compartilhado de Mapeamento de Utilizador

### Problema

O padrão de converter uma linha `users` do Supabase para o tipo `User` do frontend aparece em **pelo menos 5 lugares**:

1. `AuthProvider.tsx:63-75` — `syncAuthSession`
2. `AuthProvider.tsx:85-97` — fallback do user_metadata
3. `AuthProvider.tsx:141-153` — `signIn`
4. `enrollmentService.ts:136-150` — `getCourseStudents`
5. `enrollmentService.ts:226-234` — `getAllStudents`

O código duplicado:

```ts
firstName: userData.nome_completo?.split(' ')[0] || '',
lastName: userData.nome_completo?.split(' ').slice(1).join(' ') || '',
```

### Solução

Criar um utilitário compartilhado.

**Ficheiro:** `src/lib/utils/userMapper.ts` (NOVO)

```ts
import { User, UserRole } from '../../types';

interface SupabaseUserRow {
  id: string;
  email: string;
  nome_completo?: string;
  role?: string;
  foto_perfil?: string;
  telefone?: string;
  status?: string;
  streak?: number;
  longestStreak?: number;
  totalHoursLearned?: number;
}

/**
 * Converte uma linha da tabela `users` do Supabase
 * no tipo `User` utilizado pelo frontend.
 */
export function mapSupabaseUserToAppUser(
  row: SupabaseUserRow,
  defaults?: Partial<User>
): User {
  const nameParts = (row.nome_completo || '').split(' ');
  const mappedRole: UserRole = 
    row.role === 'ADMIN' ? 'ADMIN' :
    row.role === 'PROFESSOR' ? 'PROFESSOR' :
    'ALUNO';

  return {
    id: row.id,
    email: row.email || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    role: mappedRole,
    avatarUrl: row.foto_perfil || undefined,
    foto_perfil: row.foto_perfil || undefined,
    phone: row.telefone || '',
    status: (row.status as 'ACTIVE' | 'SUSPENDED') || 'ACTIVE',
    streak: row.streak ?? defaults?.streak ?? 0,
    longestStreak: row.longestStreak ?? defaults?.longestStreak ?? 0,
    totalHoursLearned: row.totalHoursLearned ?? defaults?.totalHoursLearned ?? 0,
  };
}
```

### Passo 2 — Usar o utilitário em todos os lugares

**`AuthProvider.tsx`** — Substituir os 3 blocos de mapeamento manual:

```ts
import { mapSupabaseUserToAppUser } from '../../lib/utils/userMapper';

// Em syncAuthSession:
if (userData) {
  const localUser = mapSupabaseUserToAppUser(userData, { streak: 3, longestStreak: 5, totalHoursLearned: 4 });
  setCurrentUser(localUser);
  // ...
}

// Em signIn:
const mappedUser = mapSupabaseUserToAppUser(result.user, { streak: 5, longestStreak: 15, totalHoursLearned: 24 });
setCurrentUser(mappedUser);
```

**`enrollmentService.ts`** — Substituir os blocos em `getCourseStudents` e `getAllStudents`:

```ts
import { mapSupabaseUserToAppUser } from '../../lib/utils/userMapper';

// Em getCourseStudents:
return (students || []).map(student => {
  const enrollment = enrollments.find(e => e.student_id === student.id);
  return {
    ...mapSupabaseUserToAppUser(student),
    enrolled_at: enrollment?.created_at,
    enrollment_id: enrollment?.id
  };
});

// Em getAllStudents:
return (students || []).map(student => mapSupabaseUserToAppUser(student));
```

---

## 3.12 — Eliminar Aliases Duplicados no `AuthProvider`

### Problema

O `AuthProvider` expõe aliases idênticos que só criam confusão:

```ts
const login = signIn;
const register = signUp;
const logout = signOut;
const recoverPassword = resetPassword;
```

Isto dobra a superfície da API do contexto sem benefício. Novos desenvolvedores não sabem se devem usar `signIn` ou `login`.

### Solução

**Ficheiro:** `src/components/auth/AuthProvider.tsx`

1. Remover as 4 linhas de alias
2. Remover os aliases da interface `AuthContextType`
3. Atualizar todos os consumidores para usar os nomes canônicos (`signIn`, `signUp`, `signOut`, `resetPassword`)

**ANTES** — interface:

```tsx
interface AuthContextType {
  // ...
  signIn: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: ...) => Promise<any>;
  register: (email: string, password: string, name: string, role: ...) => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  recoverPassword: (email: string) => Promise<any>;
  // ...
}
```

**DEPOIS:**

```tsx
interface AuthContextType {
  // ...
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string, role: 'ALUNO' | 'PROFESSOR' | 'ADMIN') => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  // ...
}
```

Remover do Provider value:

```tsx
// ANTES
value={{
  user: currentUser, session, profile: userProfile, role: mappedRole, loading,
  signIn, login, signUp, register, signOut, logout, resetPassword, recoverPassword,
  refreshProfile, updateUser
}}

// DEPOIS
value={{
  user: currentUser, session, profile: userProfile, role: mappedRole, loading,
  signIn, signUp, signOut, resetPassword,
  refreshProfile, updateUser
}}
```

**Atualizar consumidores** — Procurar por `login`, `register`, `logout`, `recoverPassword` usados via `useAuth()`:

```bash
grep -rn "useAuth" src/ | grep -E "(login|register|logout|recoverPassword)"
```

Substituir cada ocorrência:
- `login(...)` → `signIn(...)`
- `register(...)` → `signUp(...)`
- `logout()` → `signOut()`
- `recoverPassword(...)` → `resetPassword(...)`

---

## 3.13 — Corrigir Padrão N+1 no `enrollmentService.getCourseStudents()`

### Problema

O `enrollmentService.getCourseStudents()` faz 2 queries separadas:

```ts
// Query 1: buscar enrollments
const { data: enrollments } = await supabase.from('enrollments').select('*').eq('course_id', courseId);

// Query 2: buscar users separadamente
const studentIds = enrollments.map(e => e.student_id);
const { data: students } = await supabase.from('users').select('*').in('id', studentIds);
```

Isto é um padrão N+1 clássico. O Supabase suporta joins nativos que resolvem isto numa única query.

### Solução

**Ficheiro:** `src/services/supabase/enrollmentService.ts`

**ANTES** (linhas 108-151):

```ts
async getCourseStudents(courseId: string): Promise<any[]> {
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('course_id', courseId);

  if (enrollError) {
    console.error('Error fetching enrollments:', enrollError);
    return [];
  }

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const studentIds = enrollments.map(e => e.student_id);

  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('*')
    .in('id', studentIds);

  if (studentsError) {
    console.error('Error fetching students for course:', studentsError);
    return [];
  }

  return (students || []).map(student => {
    const enrollment = enrollments.find(e => e.student_id === student.id);
    return {
      id: student.id,
      email: student.email,
      firstName: student.nome_completo?.split(' ')[0] || student.firstName || '',
      lastName: student.nome_completo?.split(' ').slice(1).join(' ') || student.lastName || '',
      role: student.role,
      avatarUrl: student.foto_perfil || null,
      phone: student.telefone || '',
      status: student.status || 'ACTIVE',
      enrolled_at: enrollment?.created_at,
      enrollment_id: enrollment?.id
    };
  });
},
```

**DEPOIS:**

```ts
async getCourseStudents(courseId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, created_at, status, student:users(id, email, nome_completo, role, foto_perfil, telefone, status)')
    .eq('course_id', courseId);

  if (error) {
    console.error('Error fetching course students:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  return data.map((enrollment: any) => {
    const student = enrollment.student;
    if (!student) return null;
    const nameParts = (student.nome_completo || '').split(' ');
    return {
      id: student.id,
      email: student.email,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      role: student.role,
      avatarUrl: student.foto_perfil || null,
      phone: student.telefone || '',
      status: student.status || 'ACTIVE',
      enrolled_at: enrollment.created_at,
      enrollment_id: enrollment.id
    };
  }).filter(Boolean);
},
```

**Justificativa:** Uma única query com join Supabase em vez de 2 queries separadas. Reduz latência de rede e elimina a possibilidade de race conditions entre as duas queries.

---

## 3.14 — Otimizar `messageService.getConversationPartners()` — Evitar Carregar TODAS as Mensagens

### Problema

`getConversationPartners()` (linha 361-420) chama `this.getMessages(userId)` que carrega **TODAS as mensagens** do utilizador para depois processá-las client-side:

```ts
async getConversationPartners(userId: string): Promise<any[]> {
  const messages = await this.getMessages(userId); // ← CARREGA TUDO!
  const partnerMap = new Map<string, { lastMessage: SupabaseMessage; unreadCount: number }>();
  messages.forEach((msg) => { ... });
  // ...
}
```

Para um utilizador com 10.000 mensagens, isto transfere todos os dados do banco e processa client-side, causando lentidão e consumo excessivo de memória.

### Solução

Usar queries agregadas do Supabase para obter apenas os dados necessários (última mensagem por parceiro + contagem de não lidas) sem carregar todas as mensagens.

**Ficheiro:** `src/services/supabase/messageService.ts`

**ANTES** (linhas 361-420):

```ts
async getConversationPartners(userId: string): Promise<any[]> {
  const messages = await this.getMessages(userId);
  const partnerMap = new Map<string, { lastMessage: SupabaseMessage; unreadCount: number }>();
  messages.forEach((msg) => {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!partnerId) return;
    const localClearVal = localStorage.getItem(`chat_clear_${userId}_${partnerId}`);
    if (localClearVal && new Date(msg.created_at).getTime() <= new Date(localClearVal).getTime()) {
      return;
    }
    const localDeleted = JSON.parse(localStorage.getItem(`chat_deleted_for_me_${userId}_${partnerId}`) || '[]');
    if (localDeleted.includes(msg.id)) {
      return;
    }
    const isUnread = msg.receiver_id === userId && !msg.lido;
    const existing = partnerMap.get(partnerId);
    if (!existing) {
      partnerMap.set(partnerId, {
        lastMessage: msg,
        unreadCount: isUnread ? 1 : 0
      });
    } else {
      existing.unreadCount += isUnread ? 1 : 0;
    }
  });
  if (partnerMap.size === 0) return [];
  const partnerIds = Array.from(partnerMap.keys());
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, nome_completo, role, foto_perfil')
    .in('id', partnerIds);
  if (error) {
    console.error('Error fetching partner profiles:', error);
    throw error;
  }
  return users.map((u) => {
    const entry = partnerMap.get(u.id)!;
    return {
      id: u.id,
      email: u.email,
      nome_completo: u.nome_completo,
      role: u.role,
      foto_perfil: u.foto_perfil,
      lastMessage: entry.lastMessage,
      unreadCount: entry.unreadCount
    };
  });
},
```

**DEPOIS:**

```ts
async getConversationPartners(userId: string): Promise<any[]> {
  // 1. Buscar parceiros distintos com a última mensagem usando subquery
  // Em vez de carregar TODAS as mensagens, usamos uma abordagem em 2 passos eficientes:
  
  // Passo A: Buscar IDs de parceiros distintos + contagem de não lidas em queries dedicadas
  const [sentResult, receivedResult] = await Promise.all([
    supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('sender_id, lido')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (sentResult.error) {
    console.error('Error fetching sent partners:', sentResult.error);
    throw sentResult.error;
  }
  if (receivedResult.error) {
    console.error('Error fetching received partners:', receivedResult.error);
    throw receivedResult.error;
  }

  // Construir mapa de parceiros com contagem de não lidas
  const partnerMap = new Map<string, { unreadCount: number }>();
  
  for (const msg of receivedResult.data || []) {
    const pid = msg.sender_id;
    if (!partnerMap.has(pid)) {
      partnerMap.set(pid, { unreadCount: 0 });
    }
    if (!msg.lido) {
      partnerMap.get(pid)!.unreadCount++;
    }
  }
  
  for (const msg of sentResult.data || []) {
    if (!partnerMap.has(msg.receiver_id)) {
      partnerMap.set(msg.receiver_id, { unreadCount: 0 });
    }
  }

  if (partnerMap.size === 0) return [];

  const partnerIds = Array.from(partnerMap.keys());

  // Passo B: Buscar perfis dos parceiros + última mensagem por parceiro
  const [usersResult, ...lastMsgResults] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, nome_completo, role, foto_perfil')
      .in('id', partnerIds),
    // Buscar a última mensagem para cada parceiro (batch)
    ...partnerIds.map(pid =>
      supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1)
    )
  ]);

  if (usersResult.error) {
    console.error('Error fetching partner profiles:', usersResult.error);
    throw usersResult.error;
  }

  return (usersResult.data || []).map((u: any, index: number) => {
    const entry = partnerMap.get(u.id);
    const lastMsgData = lastMsgResults[index];
    const lastMessage = lastMsgData?.data?.[0] || null;

    return {
      id: u.id,
      email: u.email,
      nome_completo: u.nome_completo,
      role: u.role,
      foto_perfil: u.foto_perfil,
      lastMessage,
      unreadCount: entry?.unreadCount || 0
    };
  });
},
```

**Nota de otimização futura:** A query de última mensagem por parceiro ainda faz N queries. Para uma otimização definitiva, deve-se criar uma view materializada ou função RPC no Supabase que retorne os parceiros + última mensagem + contagem não lida numa única query. Isto fica como recomendação para a Fase 4.

---

## 3.15 — Corrigir Subscrições Realtime com Stale Closures no `useStudentData`

### Problema

O hook `useStudentData.ts` tem subscrições realtime com stale closures:

```ts
// Linhas 84-91
useEffect(() => {
  if (!userId) return;
  const channel = supabase
    .channel('student-unread-count')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadCount())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [userId]);

// Linhas 94-101
useEffect(() => {
  if (!userId) return;
  const channel = supabase
    .channel('student-notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchData())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [userId]);
```

Os problemas:

1. **`fetchUnreadCount` e `fetchData` não estão no array de dependências**, criando stale closures. Se `userId` não mudar, as funções capturadas serão as da primeira renderização.
2. **O canal `student-unread-count` escuta TODOS os eventos de `messages`** (INSERT, UPDATE, DELETE) sem filtro por `receiver_id`, o que significa que recebe notificações de mensagens que não são do utilizador.
3. **O canal `student-notifications` escuta INSERTs sem filtro** por `user_id`, recebendo notificações de todos os utilizadores.

### Solução

**Ficheiro:** `src/hooks/useStudentData.ts`

**DEPOIS** — versão corrigida completa:

```ts
import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Usar ref para evitar stale closures nas subscrições realtime
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchData = useCallback(async () => {
    if (!userIdRef.current) return;
    setLoading(true);
    try {
      const enrollData = await academicService.getStudentEnrollments(userIdRef.current);
      setEnrollments(enrollData || []);

      if (enrollData && enrollData.length > 0) {
        const activeCourseId = selectedCourseId || enrollData[0].course_id;
        setSelectedCourseId(activeCourseId);
        const lessonsData = await academicService.getLessons(activeCourseId);
        setRealLessons(lessonsData || []);
        const completions = await academicService.getCompletedLessons(userIdRef.current, activeCourseId);
        setCompletedLessons(completions || []);
      } else {
        setRealLessons([]);
        setCompletedLessons([]);
      }

      const certs = await academicService.getStudentCertificates(userIdRef.current);
      setCertificates(certs || []);

      const schedules = await academicService.getScheduledLessonsForStudent(userIdRef.current);
      setScheduledLessons(schedules || []);

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userIdRef.current)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(notifs || []);
    } catch (err) {
      console.warn('Erro ao carregar dados do aluno:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userIdRef.current) return;
    try {
      const parts = await messageService.getConversationPartners(userIdRef.current);
      setUnreadMessagesCount(parts.reduce((acc: number, p: any) => acc + (p.unreadCount || 0), 0));
    } catch {}
  }, []);

  const changeCourse = useCallback(async (courseId: string) => {
    if (!userIdRef.current) return;
    setSelectedCourseId(courseId);
    try {
      setLoading(true);
      const lessonsData = await academicService.getLessons(courseId);
      setRealLessons(lessonsData || []);
      const completions = await academicService.getCompletedLessons(userIdRef.current, courseId);
      setCompletedLessons(completions || []);
    } catch (err) {
      console.error('Erro ao trocar de curso:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [userId, fetchData]);
  useEffect(() => { fetchUnreadCount(); }, [userId, fetchUnreadCount]);

  // Real-time subscription para mensagens — filtrar por receiver_id
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-unread-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => fetchUnreadCount()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchUnreadCount]);

  // Real-time subscription para notificações — filtrar por user_id
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('student-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchData]);

  return {
    enrollments, certificates, realLessons, completedLessons,
    scheduledLessons, notifications, setNotifications, unreadMessagesCount,
    loading, selectedCourseId, changeCourse,
    refetch: fetchData
  };
}
```

**Mudanças principais:**

1. `fetchData` e `fetchUnreadCount` são agora `useCallback` com dependências explícitas
2. `userIdRef` garante que as funções sempre usam o `userId` mais recente, sem stale closures
3. As subscrições realtime agora filtram por `receiver_id=eq.${userId}` e `user_id=eq.${userId}` respectivamente
4. As subscrições só escutam INSERTs (não todos os eventos) para evitar refetches desnecessários
5. `fetchUnreadCount` está no array de dependências da subscrição de mensagens

---

## 3.16 — Implementar `React.memo` e `useMemo`/`useCallback` nos Componentes Pesados

### Problema

Apenas **1 componente** (`MessageBubble`) usa `React.memo`. Apenas **8 instâncias** de `useCallback` e **2 instâncias** de `useMemo` existem em todo o projeto. Os componentes pesados re-renderizam completamente quando qualquer prop muda, mesmo que a mudança seja irrelevante.

Componentes que mais se beneficiariam de memoização:

| Componente | Linhas | Razão para memo |
|---|---|---|
| `MessageBubble` | 199 | Já tem memo, mas poderia ter `useMemo` para formatação de data |
| `StudentDashboardView` | 197 | Re-renderiza quando qualquer estado do pai muda |
| `StudentMaterialsTab` | 237 | Lista de materiais raramente muda |
| `StudentCertificatesTab` | 213 | Lista de certificados raramente muda |
| `StudentProgressTab` | 235 | Dados de progresso mudam raramente |
| `ChatSidebar` | 189 | Re-renderiza quando novas mensagens chegam (frequente) |
| `ChatWindow` | 217 | Re-renderiza a cada digitação do utilizador |
| `StudentSidebar` | 145 | Menu fixo, não precisa re-renderizar |
| `InstructorDashboardTab` | 210 | Dados raramente mudam |

### Solução

Aplicar `React.memo` nos componentes de lista/visualização que recebem dados estáveis, e `useMemo`/`useCallback` nos cálculos e callbacks dentro deles.

### Passo 1 — `StudentSidebar`

**Ficheiro:** `src/components/portal/StudentSidebar.tsx`

```tsx
// No final do ficheiro, antes da exportação:
export default React.memo(StudentSidebar);
```

Isto é seguro porque o `StudentSidebar` só recebe `currentUser`, `activeTab`, `onTabChange`, `isDarkMode`, `onToggleTheme` — todos primitivos ou referências estáveis.

### Passo 2 — `StudentDashboardView`

**Ficheiro:** `src/components/portal/StudentDashboardView.tsx`

```tsx
// No final do ficheiro:
export default React.memo(StudentDashboardView);
```

### Passo 3 — `StudentMaterialsTab`

**Ficheiro:** `src/components/portal/StudentMaterialsTab.tsx`

```tsx
export default React.memo(StudentMaterialsTab);
```

### Passo 4 — `StudentCertificatesTab`

**Ficheiro:** `src/components/portal/StudentCertificatesTab.tsx`

```tsx
export default React.memo(StudentCertificatesTab);
```

### Passo 5 — `StudentProgressTab`

**Ficheiro:** `src/components/portal/StudentProgressTab.tsx`

```tsx
export default React.memo(StudentProgressTab);
```

### Passo 6 — `InstructorDashboardTab`

**Ficheiro:** `src/components/instructor/InstructorDashboardTab.tsx`

```tsx
export default React.memo(InstructorDashboardTab);
```

### Passo 7 — `ChatSidebar`

**Ficheiro:** `src/components/messaging/ChatSidebar.tsx`

```tsx
export default React.memo(ChatSidebar);
```

### Passo 8 — `ChatWindow` — Adicionar `useMemo` para lista de mensagens filtradas

Se houver lógica de filtragem de mensagens dentro do `ChatWindow` (ex: filtrar por timestamp de limpeza, ou mensagens eliminadas), envolver essa lógica em `useMemo`:

```tsx
const filteredMessages = useMemo(() => {
  return messages.filter(msg => {
    // critérios de filtragem
    return true;
  });
}, [messages, conversationClearTimestamp, deletedForMeIds]);
```

**Nota:** Não aplicar `React.memo` nos portais principais (`StudentPortal`, `AdminPortal`, `InstructorPortal`) porque eles são os componentes "container" que gerenciam estado e devem re-renderizar quando o estado muda. A memoização deve ser aplicada nos componentes folha.

---

## 3.17 — Substituir Queries `.select('*')` por Seleção de Colunas Específicas

### Problema

Quase todas as queries no projeto usam `.select('*')`:

```ts
// Exemplos:
supabase.from('courses').select('*').eq('status', 'PUBLISHED');
supabase.from('users').select('*').eq('id', userId);
supabase.from('enrollments').select('*').eq('student_id', studentId);
supabase.from('messages').select('*').or(...);
supabase.from('notifications').select('*').eq('user_id', userId);
supabase.from('lessons').select('*').eq('course_id', courseId);
supabase.from('certificates').select('*').eq('student_id', studentId);
```

Isto transfere TODAS as colunas (incluindo campos grandes como `quiz` JSON, `descricao`, `bio`, etc.) mesmo quando só precisamos de 2-3 colunas. Para uma tabela `users` com 20+ colunas, buscar `*` quando só precisamos de `id, nome_completo, foto_perfil` desperdiça banda e memória.

### Solução

Substituir `.select('*')` por seleções de colunas específicas em todas as queries onde o resultado não precisa de todas as colunas.

**Exemplos de substituição:**

**1. `messageService.getConversationPartners()` — query de utilizadores:**

```ts
// ANTES
supabase.from('users').select('id, email, nome_completo, role, foto_perfil').in('id', partnerIds);
// Este já está correto! Não alterar.
```

**2. `academicService.getStudentEnrollments()`:**

```ts
// ANTES
supabase.from('enrollments').select('*, course:courses(*)').eq('student_id', studentId);

// DEPOIS
supabase.from('enrollments')
  .select('id, student_id, course_id, status, data_inicio, progress_percent, course:courses(id, title, slug, thumbnail, duration, category, status)')
  .eq('student_id', studentId);
```

**3. `academicService.getCourses()`:**

```ts
// ANTES
supabase.from('courses').select('*').eq('status', 'PUBLISHED');

// DEPOIS
supabase.from('courses')
  .select('id, title, slug, description, thumbnail, category, level, duration, status, teacher_id, created_at')
  .eq('status', onlyActive ? 'PUBLISHED' : undefined);
```

**4. `academicService.getLessons()`:**

```ts
// ANTES
supabase.from('lessons').select('*').eq('course_id', courseId);

// DEPOIS
supabase.from('lessons')
  .select('id, course_id, module_id, titulo, descricao, video_url, ordem, duracao, scheduled_at, status, quiz, meeting_url')
  .eq('course_id', courseId);
```

**5. `useStudentData.ts` — notificações:**

```ts
// ANTES
supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);

// DEPOIS
supabase.from('notifications')
  .select('id, user_id, text, read, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

**6. `enrollmentService.getCourseStudents()`:**

```ts
// DEPOIS
supabase.from('enrollments')
  .select('id, created_at, status, student:users(id, email, nome_completo, role, foto_perfil, telefone)')
  .eq('course_id', courseId);
```

**7. `enrollmentService.getAllStudents()`:**

```ts
// ANTES
supabase.from('users').select('*').eq('role', 'ALUNO');

// DEPOIS
supabase.from('users')
  .select('id, email, nome_completo, role, foto_perfil, telefone, status')
  .eq('role', 'ALUNO');
```

**8. `App.tsx` — carregamento de cursos no mount:**

```ts
// ANTES
supabase.from('courses').select('*').eq('status', 'PUBLISHED');

// DEPOIS
supabase.from('courses')
  .select('id, titulo, title, duracao, duration')
  .eq('status', 'PUBLISHED');
```

**Princípio geral:** Para cada query, identificar quais campos são efetivamente utilizados pelo consumidor e selecionar apenas esses. Manter `select('*')` apenas em queries de propósito geral (como o painel de administração que pode precisar de todos os campos).

---

## 3.18 — Corrigir `@/` Alias do tsconfig para Apontar para `src/`

### Problema

O alias `@/` está configurado para apontar para a raiz do projeto:

```json
// tsconfig.json
"paths": { "@/*": ["./*"] }

// vite.config.ts
alias: { '@': path.resolve(__dirname, '.') }
```

Isto significa que `@/components/HomePanel` resolve para `./components/HomePanel` (na raiz, que não existe) em vez de `./src/components/HomePanel`. O alias é praticamente inútil porque todos os imports relativos usam caminhos como `../components/HomePanel`.

### Solução

**Ficheiro:** `tsconfig.json`

```json
// ANTES
"paths": { "@/*": ["./*"] }

// DEPOIS
"paths": { "@/*": ["./src/*"] }
```

**Ficheiro:** `vite.config.ts`

```ts
// ANTES
alias: { '@': path.resolve(__dirname, '.') }

// DEPOIS
alias: { '@': path.resolve(__dirname, './src') }
```

**Nota:** Após esta alteração, imports como `import X from '@/components/HomePanel'` resolverão corretamente para `src/components/HomePanel`. Imports existentes com caminhos relativos (`../components/HomePanel`) continuarão a funcionar — não é necessário converter todos imediatamente. A conversão pode ser feita gradualmente em futuras refatorações.

---

## 3.19 — Remover Dependências Não Utilizadas e Scaffolding de Monorepo

### Problema

O `package.json` inclui dependências que não são usadas pelo frontend em `src/`:

1. **`express`** (^4.21.2) — Existe um `apps/api/` com NestJS, mas o frontend não usa Express
2. **`jsonwebtoken`** (^9.0.3) — Autenticação é feita via Supabase, não JWT manual
3. **`dotenv`** (^17.2.3) — Vite usa `import.meta.env`, não dotenv
4. **`@google/genai`** (^2.4.0) — Não há uso de IA generativa no código frontend
5. **`gsap`** (^3.15.0) — Usado em apenas 1-2 componentes, poderia ser substituído por Motion

Além disso, o scaffolding de monorepo (`packages/`, `apps/`, `turbo.json`, `pnpm-workspace.yaml`) não é usado pelo `src/` e cria confusão sobre a estrutura do projeto.

### Solução

### Passo 1 — Remover dependências não utilizadas

```bash
cd /home/z/my-project/MultiPlus-Academy-/
npm uninstall express jsonwebtoken dotenv @google/genai
```

**Nota sobre `gsap`:** Se `gsap` for usado em algum componente (verificar com `grep -r "gsap" src/`), manter. Caso contrário, remover também. Se for usado em apenas 1 componente, considerar substituir por `motion/react` que já está instalado.

### Passo 2 — Remover ou documentar scaffolding de monorepo

Se os diretórios `packages/`, `apps/`, `turbo.json` e `pnpm-workspace.yaml` não forem usados e não houver plano de uso imediato, adicionar ao `.gitignore` ou mover para um diretório de arquivo. **NÃO eliminar definitivamente** pois podem conter código do backend NestJS que será usado no futuro.

Sugestão: criar um ficheiro `ARCHITECTURE.md` na raiz que documenta:

```md
# Estrutura do Projeto

## Frontend (ativo)
- `src/` — Aplicação React + Vite + Supabase
- `index.html` — Entry point do Vite
- `vite.config.ts` — Configuração do build

## Backend (scaffolding, não integrado)
- `apps/api/` — NestJS API (não conectado ao frontend)
- `packages/` — Bibliotecas compartilhadas do monorepo (não usadas)
- `supabase/` — Migrations e Edge Functions do Supabase
```

---

## 3.20 — Adicionar Componente `LoadingSpinner` Reutilizável para Suspense Fallback

### Problema

Esta tarefa já foi abordada na tarefa 3.1 (criação do `LoadingSpinner`). Aqui documentamos os locais adicionais onde o spinner deve ser usado.

### Locais para adicionar `LoadingSpinner`

**1. `StudentPortal.tsx`** — Quando `academicLoading` é true:

Substituir indicadores de carregamento inline por `<LoadingSpinner>`. Procurar por padrões como:

```tsx
{academicLoading && (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin h-8 w-8 border-2 border-[#0A2E5D] border-t-transparent rounded-full" />
  </div>
)}
```

Substituir por:

```tsx
{academicLoading && <LoadingSpinner size="lg" text="A carregar dados académicos..." />}
```

**2. `AdminPortal.tsx`** — Quando dados estão a carregar:

Procurar por spinners inline e substituir por `<LoadingSpinner>`.

**3. `InstructorPortal.tsx`** — Mesmo padrão.

**4. `ChatShell.tsx`** — Quando `loading` é true:

```tsx
// ANTES
{loading && <div className="p-8 text-center text-slate-400">A carregar...</div>}

// DEPOIS
{loading && <LoadingSpinner size="md" text="A carregar conversas..." />}
```

---

## Ordem de Execução Recomendada

Para minimizar conflitos e quebras, aplicar as tarefas na seguinte ordem:

1. **3.6** — Consolidar clientes Supabase (sem dependências)
2. **3.7** — Remover ficheiros duplicados na raiz (sem dependências)
3. **3.18** — Corrigir alias `@/` (sem dependências)
4. **3.20** — Criar `LoadingSpinner` (necessário para 3.1)
5. **3.11** — Criar utilitário `userMapper.ts` (necessário para 3.2)
6. **3.10** — Extrair `generateSlug` e consolidar lógica duplicada
7. **3.8** — Quebrar `academicService` em serviços especializados
8. **3.9** — Eliminar localStorage fallbacks
9. **3.12** — Eliminar aliases duplicados no AuthProvider
10. **3.13** — Corrigir N+1 no enrollmentService
11. **3.14** — Otimizar getConversationPartners
12. **3.15** — Corrigir subscrições realtime
13. **3.17** — Substituir `.select('*')` por colunas específicas
14. **3.2** — Eliminar duplicação de estado currentUser (depende de 3.11, 3.12)
15. **3.3** — Adicionar ErrorBoundary
16. **3.4** — Configurar Vite build
17. **3.1** — Implementar Code Splitting (depende de 3.20, 3.2)
18. **3.16** — Implementar React.memo e useMemo/useCallback
19. **3.19** — Remover dependências não utilizadas
20. **3.5** — Ativar TypeScript strict (POR ÚLTIMO — gera muitos erros)

**Justificativa da ordem:** TypeScript strict deve ser o último porque ativá-lo cedo bloquearia o desenvolvimento enquanto se corrigem centenas de erros de tipo. As tarefas de infraestrutura (consolidação de clientes, remoção de duplicados, alias) devem vir primeiro porque simplificam o código base. As tarefas de arquitetura (quebra de serviços, eliminação de localStorage) vêm a seguir. As tarefas de performance (code splitting, memoização, otimização de queries) vêm depois que a arquitetura está limpa. E strict mode é o fecho porque valida que tudo está correto.

---

## Notas Finais para o Gemini

1. **Cada tarefa deve ser aplicada individualmente e testada** antes de passar para a próxima. Após cada modificação, executar `npm run dev` e verificar que a aplicação compila sem erros.

2. **Para a tarefa 3.5 (TypeScript strict):** Esperar 50-100+ erros iniciais. Corrigir sistematicamente ficheiro por ficheiro, começando pelos serviços (que têm mais `any`), depois hooks, e por fim componentes.

3. **Para a tarefa 3.8 (quebra de academicService):** Os métodos delegados garantem compatibilidade temporária. NÃO é necessário atualizar imediatamente todos os consumidores — eles podem continuar importando de `academicService`. A migração direta para os novos serviços é recomendada mas pode ser feita gradualmente.

4. **Para a tarefa 3.14 (getConversationPartners):** A solução proposta ainda faz N queries para buscar a última mensagem. Se a latência for inaceitável com muitos parceiros, a alternativa é criar uma RPC function no Supabase que faça a agregação no servidor.

5. **Para a tarefa 3.2 (eliminar currentUser duplicado):** Esta é a tarefa mais invasiva porque requer alterações em múltiplos componentes grandes. Aplicar com cuidado, testando cada portal após a modificação.

6. **Após completar TODAS as tarefas**, executar:
```bash
npm run build
```
E verificar que o build completa sem erros e que os chunks são gerados corretamente no diretório `dist/`.
