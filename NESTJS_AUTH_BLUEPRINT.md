# Blueprint Oficial da Fase 2 — Sistema de Autenticação e Utilizadores
> **Enterprise NestJS + Prisma ORM + Firebase Admin SDK Hub**
> Arquitetura de Software Projetada para MultiPlus Academy 2026

Este documento apresenta a especificação técnica de alto nível e a implementação dos módulos de backend em **NestJS** para o sistema de autenticação segura e sincronização de utilizadores entre o **Firebase Authentication** e a base de dados relacional **PostgreSQL** por meio do **Prisma ORM**.

---

## 1. Estrutura de Diretórios Proposta (NestJS)

Abaixo está a disposição profissional e modularizada recomendada para o microserviço ou API Gateway NestJS:

```text
src/
├── app.module.ts
├── main.ts
├── prisma/
│   └── prisma.service.ts       # Service encapsulador do Prisma Client
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── firebase.strategy.ts    # Estratégia Passport ou Custom de descompactação de Claims
│   ├── decorators/
│   │   └── current-user.decorator.ts  # Decorador @CurrentUser() para Extração Injetada
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login-response.dto.ts
│   └── guards/
│       └── firebase-auth.guard.ts     # Guard para validação securitária de Tokens JWT
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── dto/
        └── update-profile.dto.ts
```

---

## 2. Implementação do Módulo de Autenticação (`auth/`)

### DTOs do Módulo Auth

#### `register.dto.ts`
Este DTO valida o payload de requisição enviado pelo utilizador no formulário de Admissão Académica ou Registo Administrativo. Ele utiliza as anotações do pacote `class-validator` para higienização e validação dos dados no ciclo global de pipes do NestJS:

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'O primeiro nome é obrigatório.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'O apelido é obrigatório.' })
  lastName: string;

  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6, { message: 'A palavra-passe deve ter pelo menos 6 caracteres.' })
  @IsNotEmpty({ message: 'A palavra-passe é obrigatória.' })
  password: string;
}
```

---

### Serviço de Autenticação (`auth.service.ts`)
Este serviço interage de forma atómica com o **Firebase Admin SDK** (para gerir o utilizador e validar suas credenciais) e com o **Prisma Service** de forma transacional. Se a criação falhar em qualquer stack, uma exceção é levantada mantendo a consistência híbrida.

```typescript
import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fluxo Securitário de Registo de Utilizador
   * 1. Solicita criação de login de acesso no Firebase Auth
   * 2. Persiste o utilizador no PostgreSQL via Prisma
   * 3. Retorna o perfil associando o UID correspondente
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Verificar se o email já existe na base relacional PostgreSQL
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('O e-mail indicado já se encontra registado no sistema.');
    }

    let firebaseUser: admin.auth.UserRecord;

    try {
      // 1. Criar Registros Oficiais no Firebase Auth
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phone || undefined,
        disabled: false,
      });

      // Definir Custom Claims iniciais de Role de ALUNO de forma padrão no Token JWT do Firebase
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'ALUNO' });

    } catch (fbError) {
      throw new ConflictException(`Erro de Provisionamento no Firebase: ${fbError.message}`);
    }

    try {
      // 2. Persistir Utilizador no PostgreSQL associando o UID como chave id do modelo de dados
      const newUser = await this.prisma.user.create({
        data: {
          id: firebaseUser.uid, // O ID do PostgreSQL é mapeado de forma idêntica ao UID do Firebase
          firstName,
          lastName,
          email,
          phone,
          role: 'ALUNO',
          status: 'ACTIVE',
        },
      });

      return newUser;
    } catch (dbError) {
      // Rollback manual do Firebase Auth caso ocorra uma quebra restritiva na base relacional
      await admin.auth().deleteUser(firebaseUser.uid);
      throw new InternalServerErrorException(
        `Falha de integridade. Revertendo provisionamento Firebase. Erro: ${dbError.message}`
      );
    }
  }

  /**
   * Validação interna complementar no login pós-obtenção de token do Firebase do lado do cliente
   */
  async validateFirebaseUser(uid: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      throw new UnauthorizedException('Utilizador autenticado no Firebase não existe na base de dados.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('O seu acesso encontra-se temporariamente suspenso pela administração.');
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Esta conta não está ativa. Contacte o suporte pedagógico.');
    }

    return user;
  }
}
```

---

### Guarda e Estratégia de Autenticação (`firebase.strategy.ts` & `guards/`)

#### `firebase.strategy.ts`
Implementação limpa de descompactação de tokens de autenticação sem dependências desnecessárias, utilizando verificação nativa do Firebase.

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from './auth.service';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação ausente ou em formato incorreto.');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Desencriptação e verificação criptográfica do Token contra chaves do Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Valida se o ID existe na base de dados relacional e retorna o perfil completo de dados
      const appUser = await this.authService.validateFirebaseUser(decodedToken.uid);
      
      return appUser;
    } catch (error) {
      throw new UnauthorizedException(`Sessão expirada ou Token Inválido: ${error.message}`);
    }
  }
}
```

---

#### `firebase-auth.guard.ts`
Garante que rotas críticas declaradas com `@UseGuards(FirebaseAuthGuard)` requeiram uma autenticação com claims válidos do ecossistema.

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('Não está autorizado a aceder a este recurso.');
    }
    return user;
  }
}
```

---

### Decorador Utilizador Logado (`decorators/current-user.decorator.ts`)
Facilita o encapsulamento nos controllers extraindo de forma automática do payload do Passport Context.

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

### Controller de Autenticação (`auth.controller.ts`)
Disponibiliza os endpoints abertos para registo, login indireto ou verificação pedagógica corporativa.

```typescript
import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint informativo/verificador de claims de acesso de autoria de tokens.
   */
  @UseGuards(FirebaseAuthGuard)
  @Get('check-session')
  async checkSession(@CurrentUser() user: User) {
    return {
      success: true,
      message: 'Sessão verificada de forma criptográfica e operacional.',
      user,
    };
  }
}
```

---

### Módulo de Autenticação Integrador (`auth.module.ts`)
Injeta no container de dependências as ferramentas necessárias.

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseStrategy } from './firebase.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'firebase' })],
  controllers: [AuthController],
  providers: [AuthService, FirebaseStrategy, PrismaService],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
```

---

## 3. Implementação do Módulo de Utilizadores (`users/`)

### DTO de Atualização de Perfil

#### `update-profile.dto.ts`
Permite modificações no perfil do formando de forma parametrizada. Não aceita alteração de `role` ou `email` sem processo formal de compliance e validação superior.

```typescript
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
```

---

### Serviço de Utilizadores (`users.service.ts`)
Executa operações de leitura (GET) e mutação controlada (PUT) sobre a entidade User da base corporativa do PostgreSQL.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca detalhada de perfil por ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('O utilizador solicitado não foi encontrado nos registos.');
    }

    return user;
  }

  /**
   * Atualização seletiva de informações comuns no Postgres + Firebase Meta
   */
  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    // 1. Atualizar base PostgreSQL relacional
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
    });

    // 2. Sincronizar dados visuais no Firebase Admin para manter consistência nos tokens JWT
    try {
      const displayNameConcat = [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(' ');
      
      await admin.auth().updateUser(id, {
        displayName: displayNameConcat || undefined,
        photoURL: updatedUser.avatar || undefined,
      });
    } catch (fbSyncError) {
      // Avisa ou regista em logs internos sem interromper o fluxo relacional principal
      console.warn(`Erro secundário de sincronização metadata Firebase: ${fbSyncError.message}`);
    }

    return updatedUser;
  }
}
```

---

### Controller de Utilizadores (`users.controller.ts`)
Contém os endpoints privados da central do formando. Utiliza o decorador `@CurrentUser()` de forma exclusiva.

```typescript
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('me')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint: GET /me
   * Retorna os dados completos do utilizador autenticado
   */
  @Get()
  async getProfile(@CurrentUser() currentUser: User) {
    return {
      success: true,
      profile: {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone,
        avatar: currentUser.avatar,
        role: currentUser.role,
        status: currentUser.status,
        createdAt: currentUser.createdAt,
      },
    };
  }

  /**
   * Endpoint: PUT /me
   * Atualiza as informações permitidas de perfil
   */
  @Put()
  async updateProfile(
    @CurrentUser() currentUser: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(currentUser.id, updateProfileDto);
    return {
      success: true,
      message: 'O seu perfil académico foi atualizado com sucesso.',
      profile,
    };
  }
}
```

---

### Módulo de Utilizadores (`users.module.ts`)
Regista os componentes dedicados a operações de dados do portador.

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 4. Inicialização Segura do Firebase Admin SDK no NestJS

Para inicializar corretamente o serviço admin no Bootstrap do NestJS (`main.ts` ou um módulo inicial), declare-o de maneira preguiçosa (Lazy) ou estática utilizando as credenciais definidas na consola do seu workspace de servidores do Google Cloud:

```typescript
import * as admin from 'firebase-admin';

export function initializeFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccountContent = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountContent) {
      try {
        const serviceAccount = JSON.parse(serviceAccountContent);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (err) {
        console.error('Falha ao decodificar credenciais do Firebase. Utilizando metadados automáticos.');
        admin.initializeApp();
      }
    } else {
      // Modo automático caso esteja a rodar em ambiente com privilégios IAM integrados (ex Cloud Run)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
}
```
