# Schema Prisma Oficial — MultiPlus Academy LMS
> **Fase 1: Modelagem de Banco de Dados Relacional (PostgreSQL + Prisma ORM)**
> Data da Projeção: Junho de 2026

Este documento contém a arquitetura integral de tabelas, relacionamentos, chaves primárias/estrangeiras, índices de alta performance e a definição declarativa dos tipos no dialeto Prisma ORM para conexão de dados com o PostgreSQL no ecossistema ERP MultiPlus Academy.

---

## 1. Diagrama Lógico Textual (ERD)

Abaixo está mapeado o grafo relacional da aplicação. Cada parêntese quadrado `[Entidade]` representa uma tabela e os fluxos `--||--` ou `--<` determinam acoplamentos de UM-para-MUITOS (1:N) ou MUITOS-para-MUITOS (N:M).

```text
  [User] (Super Admin / Admin / Professor / Aluno)
    ||
    ||--<  [Enrollment]  >--||  [Course]
    ||                             ||--< [CourseModule] --< [Lesson]
    ||--<  [Certificate] >--||  [Course]
    ||--<  [Payment]
    ||--<  [BlogPost]
    ||--<  [Notification]
    ||
    ||--<  [ConversationParticipant] >--||  [Conversation]
    ||--<  [Message]                       ||--<  [Message]
    ||
    ||--<  [EventRegistration]       >--||  [Event]
```

---

## 2. Estrutura de Entidades e Índices Práticos

*   **User**: Armazenamento centralizado de contas. Índices baseados no `email` único para máxima velocidade em fluxos de login.
*   **Course**: Catálogo curricular. Índice único no campo `slug` para suporte instantâneo a queries de rotas dinâmicas SSR (`/cursos/[slug]`).
*   **CourseModule**: Seccionamento de lições por curso. Possui ordenação via índice `courseId` e campo `order`.
*   **Lesson**: Vídeos, tarefas e links de simulação. Índice composto sobre `moduleId` e `order`.
*   **Enrollment**: Ligação persistente entre aluno e curso. Chave única composta por `(userId, courseId)` para evitar duplicidade incidental de matrículas.
*   **Certificate**: Documentação oficial com chave única criptográfica `verificationHash` para conferência pública do carimbo MultiPlus Academy.
*   **Payment**: Faturas das propinas e investimentos corporativos. Conexão estrita com o `userId`.
*   **BlogPost**: Artigos de compliance e dicas de inglês para o setor petrolífero. Ligados ao autor.
*   **Event**: Workhops e webinars com carimbo do Google Calendar.
*   **Conversation & Message**: Central de chat privativa entre administradores, professores e alunos.

---

## 3. Schema Prisma Oficial (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// ENUMS DO SISTEMA
// ==========================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PROFESSOR
  ALUNO
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PaymentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum EventType {
  ONLINE
  PRESENCIAL
  HYBRID
}

// ==========================================
// ENTIDADES DO SISTEMA
// ==========================================

model User {
  id                String       @id @default(uuid())
  firstName         String
  lastName          String
  email             String       @unique
  phone             String?
  avatar            String?
  role              UserRole     @default(ALUNO)
  status            UserStatus   @default(ACTIVE)
  
  // Auditoria
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relacionamentos 1:N
  enrollments       Enrollment[]
  certificates      Certificate[]
  payments          Payment[]
  blogPosts         BlogPost[]       @relation("UserBlogAuthor")
  notifications     Notification[]
  messagesSent      Message[]        @relation("MessageSender")
  
  // Pivot Pivot N:M para conversas multipartite
  conversations     ConversationParticipant[]
  eventRegistrations EventRegistration[]

  @@index([email])
  @@index([role])
}

model Course {
  id           String        @id @default(uuid())
  title        String
  slug         String        @unique
  description  String        @db.Text
  thumbnail    String?
  category     String
  level        String        @default("Iniciante") // Ex: Essentials, Legal Leader, Executive Master
  duration     String        // Ex: "12 Semanas"
  price        Decimal       @db.Decimal(10, 2)
  status       CourseStatus  @default(DRAFT)
  
  // Auditoria
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relacionamentos
  modules      CourseModule[]
  enrollments  Enrollment[]
  certificates Certificate[]

  @@index([slug])
  @@index([category])
}

model CourseModule {
  id          String   @id @default(uuid())
  courseId    String
  title       String
  description String?  @db.Text
  order       Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]

  @@index([courseId])
  @@index([courseId, order])
}

model Lesson {
  id          String       @id @default(uuid())
  moduleId    String
  title       String
  description String?      @db.Text
  videoUrl    String?      // Integração futura Cloudinary
  attachment  String?      // Pasta PDF adicionais
  duration    Int          @default(0) // Duração em minutos
  order       Int          @default(0)
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // Relacionamentos
  module      CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@index([moduleId])
  @@index([moduleId, order])
}

model Enrollment {
  id              String     @id @default(uuid())
  userId          String
  courseId        String
  progressPercent Int        @default(0) // De 0 a 100
  isActive        Boolean    @default(true)
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relacionamentos
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  course          Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model Certificate {
  id               String   @id @default(uuid())
  userId           String
  courseId         String
  verificationHash String   @unique @default(dbgenerated()) // Chave pública única de pesquisa
  recipientName    String   // Nome guardado no ato da emissão do Diploma MultiPlus
  completionDate   DateTime @default(now())
  isValid          Boolean  @default(true)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relacionamentos
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course           Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([verificationHash])
  @@index([userId])
  @@index([courseId])
}

model Payment {
  id            String        @id @default(uuid())
  userId        String
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(PENDING)
  currency      String        @default("Kz") // Kwanza (Kz) ou Euro (€)
  invoiceNumber String        @unique
  method        String        // Ex: "Submissão de Guia", "Transferência", "Multicaixa"
  receiptUrl    String?       // Fatura lida ou enviada pelo formando
  paidAt        DateTime?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relacionamentos
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}

model BlogPost {
  id         String     @id @default(uuid())
  title      String
  slug       String     @unique
  content    String     @db.Text
  thumbnail  String?
  status     String     @default("DRAFT") // DRAFT, PUBLISHED, SCHEDULED
  authorId   String
  category   String     @default("Direito e Compliance")
  publishedAt DateTime?

  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  // Relacionamentos
  author     User       @relation("UserBlogAuthor", fields: [authorId], references: [id])

  @@index([slug])
  @@index([authorId])
}

model Event {
  id          String              @id @default(uuid())
  title       String
  description String              @db.Text
  date        DateTime
  location    String              @default("Online (Meet)") // Endereço físico ou link do Meet
  type        EventType           @default(ONLINE)
  maxSeats    Int?
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  // Relacionamentos
  registrations EventRegistration[]

  @@index([date])
}

model EventRegistration {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  
  createdAt DateTime @default(now())

  // Relacionamentos
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  message   String   @db.Text
  type      String   @default("INFO") // INFO, DANGER, SUCCESS, ACADEMIC, PAYMENT
  isRead    Boolean  @default(false)
  
  createdAt DateTime @default(now())

  // Relacionamentos
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
}

model Conversation {
  id           String                    @id @default(uuid())
  subject      String?                   // Assunto opcional
  
  createdAt    DateTime                  @default(now())
  updatedAt    DateTime                  @updatedAt

  // Relacionamentos
  participants ConversationParticipant[]
  messages     Message[]
}

model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String
  userId         String
  
  joinedAt       DateTime     @default(now())

  // Relacionamentos
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  content        String       @db.Text
  
  createdAt      DateTime     @default(now())

  // Relacionamentos
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId])
}
```,Overwrite:true,TargetFile:
