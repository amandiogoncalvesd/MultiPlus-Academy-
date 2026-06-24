# Blueprint Oficial da Fase 3 — Role-Based Access Control (RBAC)
> **Enterprise NestJS + Prisma ORM + Firebase Auth Custom Claims**
> Arquitetura de Software Projetada para MultiPlus Academy 2026

Este documento define a especificação técnica de alto nível e a implementação completa dos pilares de **Controlo de Acesso Baseado em Funções (RBAC)** no NestJS, utilizando decoradores personalizados, guardas integrados e sincronização de Custom Claims do Firebase.

---

## 1. Visão Geral da Arquitetura RBAC

O controlo de acesso no MultiPlus Academy baseia-se em dois níveis de defesa sequenciais:

1.  **Guarda de Autenticação (`FirebaseAuthGuard`)**: Decodifica e valida criptograficamente a assinatura do JSON Web Token (JWT) oriundo do cliente, assegurando a validade da sessão.
2.  **Guarda de Autorização (`RolesGuard`)**: Verifica se a função (`UserRole`) do utilizador (extraída da base de dados PostgreSQL ou contida como metadados criptográficos nos Custom Claims do Firebase) corresponde aos níveis de privilégio declarados para o endpoint.

```text
HTTP Request ---> [ FirebaseAuthGuard ] ---> [ RolesGuard ] ---> Route Handler (Controller)
                         |                         |
               Valida JWT Token &          Interpola @Roles()
             Anexa User no Request        com o Role do Utilizador
```

---

## 2. Implementação Técnica dos Componentes

### Decorador de Funções (`roles.decorator.ts`)

O decorador `@Roles(...)` define metadados personalizados no contexto de execução, listando quais funções de utilizador têm autorização expressa para invocar o método ou controlador visado. Ele faz uso da enum oficial `UserRole` importada do Prisma Client.

```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

---

### Guarda de Autorização (`roles.guard.ts`)
O `RolesGuard` recupera as funções associadas via `Reflector` a nível de classe (Controller) e de método (Route Handler), mescla as permissões e confronta-as com a propriedade `role` exposta no portador do Request (`request.user`).

```typescript
// auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Extrair as funções declaradas no decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se nenhuma função for mapeada, a rota é pública por padrão de controlo
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Extrair o utilizador anexado pelo FirebaseAuthGuard ao Request
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Acesso negado. Utilizador não identificado no contexto.');
    }

    // 3. Validação estrita de funções e auditoria interna preventiva
    const hasPermission = requiredRoles.includes(user.role);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso restrito. Esta ação requer privilégios de [${requiredRoles.join(', ')}]. O seu perfil atual é: [${user.role}].`
      );
    }

    return true;
  }
}
```

---

## 3. Matriz de Permissões por Função do Sistema

| Recurso / Entidade | Aluno (`ALUNO`) | Professor (`PROFESSOR`) | Admin (`ADMIN`) | Super Admin (`SUPER_ADMIN`) | Mapeamento `@Roles()` Recomendado |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Perfil Próprio (`GET /me`, `PUT /me`)** | Ver & Editar | Ver & Editar | Ver & Editar | Ver & Editar | `@Roles(ALUNO, PROFESSOR, ADMIN, SUPER_ADMIN)` |
| **Matriculados do próprio Curso** | ❌ | Apenas Ver | Ver | Ver | Mapear via lógica secundária no Service |
| **Cursos criados pelo próprio** | ❌ | Ver & Editar | Ver & Editar | Ver & Editar | `@Roles(PROFESSOR, ADMIN, SUPER_ADMIN)` |
| **Gestão Geral de Alunos** | ❌ | ❌ | Ver & Editar | Ver & Editar | `@Roles(ADMIN, SUPER_ADMIN)` |
| **Gestão Geral de Professores** | ❌ | ❌ | Ver & Editar | Ver & Editar | `@Roles(ADMIN, SUPER_ADMIN)` |
| **Gestão Geral de Cursos / Ementas** | ❌ | ❌ | Ver & Editar | Ver & Editar | `@Roles(ADMIN, SUPER_ADMIN)` |
| **Configuração Crítica e Parâmetros** | ❌ | ❌ | ❌ | Ver & Editar | `@Roles(SUPER_ADMIN)` |
| **Promover utilizador a SUPER_ADMIN** | ❌ | ❌ | ❌ | Ver & Editar | `@Roles(SUPER_ADMIN)` |

---

## 4. Integração Prática nos Controladores de Endpoints (Exemplos)

Abaixo estão exibidos três exemplos práticos e de nível empresarial sobre como acoplar os Guardas de Autenticação e Autorização em controladores distintos do NestJS:

### Exemplo A: Rotas de Financiamentos e Faturas (SUPER_ADMIN exclusivo)

```typescript
// payments/payments.controller.ts
import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class PaymentsController {

  @Get('report-general')
  @Roles(UserRole.SUPER_ADMIN) // Apenas o Super Admin tem visibilidade financeira global
  async getFinancialReport() {
    return {
      success: true,
      data: {
        totalRevenue: '114.500.000 Kz',
        currency: 'AOA',
        status: 'Auditado',
      }
    };
  }
}
```

---

### Exemplo B: Rotas de Criação de Cursos (SUPER_ADMIN, ADMIN e PROFESSOR)

```typescript
// courses/courses.controller.ts
import { Controller, Post, Body, UseGuards, Put, Param } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CoursesController {

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROFESSOR) // Docentes e de cima podem iniciar ementas
  async createCourse(@Body() createCourseDto: any) {
    return {
      success: true,
      message: 'Esboço de curso criado com sucesso na base de dados.',
    };
  }

  @Put(':id/archive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) // Apenas adms podem arquivar programas inteiros definitivamente
  async archiveCourse(@Param('id') id: string) {
    return {
      success: true,
      message: `Curso ${id} arquivado com sucesso nos arquivos corporativos.`,
    };
  }
}
```

---

### Exemplo C: Rotas de Promoção de Cargos de Utilizadores (SUPER_ADMIN exclusivo)

Para garantir segurança máxima contra elevações de privilégios ilícitas da equipe de suporte, este endpoint é blindado unicamente ao detentor de acesso `SUPER_ADMIN`.

```typescript
// users/admin-users.controller.ts
import { Controller, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AdminUsersController {

  @Patch(':id/promote')
  @Roles(UserRole.SUPER_ADMIN) // Apenas o Super Administrador pode outorgar papéis críticos
  async promoteUser(
    @Param('id') userId: string,
    @Body('newRole') newRole: UserRole
  ) {
    // Bloqueio extra para garantir integridade extrema do core de governança
    if (newRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('A promoção externa para a função de SUPER_ADMIN está vetada por regras regulatórias.');
    }

    return {
      success: true,
      message: `A conta ${userId} foi promovida com sucesso para o cargo de ${newRole}.`,
    };
  }
}
```

---

## 5. Práticas Avançadas de Segurança: Sincronização em Lote com Firebase Custom Claims

Sempre que a função (`role`) de um utilizador é atualizada na base PostgreSQL, é uma excelente prática atualizar também os **Custom Claims** correspondentes no Firebase Authentication. Isso garante que o token JWT portado pelo navegador do Aluno, Professor ou Admin carregue a payload correta e atualizada no ato da descodificação:

```typescript
// users/users.service.ts (Metodologia complementar recomendada)
import * as admin from 'firebase-admin';
import { UserRole } from '@prisma/client';

async function updateUserRoleInFirebase(uid: string, newRole: UserRole) {
  try {
    // Grava de forma persistente os privilégios diretamente na payload do JWT token
    await admin.auth().setCustomUserClaims(uid, { role: newRole });
    console.log(`Custom claims sincronizados com sucesso para o utilizador ${uid}: role = ${newRole}`);
  } catch (error) {
    console.error(`Falha ao sincronizar Custom Claims com o Firebase: ${error.message}`);
  }
}
```
