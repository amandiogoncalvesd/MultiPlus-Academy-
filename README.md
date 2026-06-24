# MultiPlus Academy — Plataforma de Gestão de Aprendizagem (LMS)

> **Slogan:** *Transformando Competências em Oportunidades*

Bem-vindo à fundação do ecossistema tecnológico da **MultiPlus Academy**, uma infraestrutura monorepo de nível empresarial projetada para escalabilidade ilimitada, segurança rigorosa e experiência premium (combinação de 70% Modern UI e 30% Neo-Skeuomorphism).

Esta plataforma centralizada suporta o website institucional público e uma sofisticada plataforma de LMS integrada por três portais (Aluno, Professor e Administrativo). O curso **English for the Legal Field in Angola** representa um dos múltiplos programas desta distinta instituição sediada no Huambo, Angola.

---

## 🛠️ Stack Tecnológica

### Frontend (Apps & Shared Packages)
* **Framework principal:** Next.js 15+ (App Router, grupos de rotas `(public)`, `(auth)`, `(aluno)`, `(professor)` e `(admin)`)
* **Framework de Renderização:** React 19 com correções estritas de estado e tipos
* **Linguagem:** TypeScript 5+ (segurança estrita de dados)
* **Estilização:** Tailwind CSS & animações fluidas via Framer Motion
* **Componentes de Interface (Design System):** @multiplus/ui (Custom ShadCN/UI e Neo-Skeuomorphism subtil com profundidade elegante)

### Backend & Data Layers
* **Core Engine:** NestJS (Framework modular robusto com validadores de dados de formulário e filtros globais)
* **Acesso à Base de Dados:** Prisma ORM e PostgreSQL relacional de alta consistência
* **Segurança de Autenticação:** Firebase Web Auth Gateway (RBAC - Controle de acessos baseado em Funções)
* **Média CDN:** Cloudinary (Otimização de streaming de videoaulas e cache inteligente de imagem)

### infraestrutura & DevOps
* **Gestor de Trabalhos:** Turborepo com cache global distribuído
* **Gestão de Dependências:** PNPM Workspaces (`pnpm-workspace.yaml`)
* **Orquestração Cloud:** Google Cloud Platform (orquestrado via Google Cloud Run & Cloud SQL)
* **Infraestrutura como Código (IaC):** Terraform
* **Automação Automática (CI/CD):** GitHub Actions integrado (`ci.yml`, `deploy.yml`)

---

## 📂 Arquitetura de Ficheiros do Projeto

O projeto foi inicializado exatamente de acordo com os padrões corporativos de alto rendimento estabelecidos:

```
multiplus-academy/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Integração contínua (Lint, Testes, Compilação)
│       └── deploy.yml             # CD para Google Cloud Run automático
├── apps/
│   ├── web/                       # Frontend Next.js 15 App Router
│   │   ├── app/
│   │   │   ├── (public)/          # Rotas Públicas (home, sobre, cursos, blog, contactos)
│   │   │   ├── (aluno)/           # Portal do Aluno (Dashboard, Player, Materiais, Certificados)
│   │   │   ├── (professor)/       # Portal do Professor (Gestão letiva, Notas, Avaliações)
│   │   │   ├── (admin)/           # Portal Administrativo (Financeiro, Usuários, Telemetria)
│   │   │   ├── globals.css        # Configurações globais de Tailwind
│   │   │   ├── manifest.ts        # PWA Webmanifest para suporte móvel
│   │   │   ├── robots.ts          # Arquivos de robot para rastreio amigável
│   │   │   └── sitemap.ts         # Mapa de site dinâmico gerado para SEO
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                       # Backend NestJS Core
│       ├── prisma/
│       │   └── schema.prisma      # Definição e relações Prisma SQL para PostgreSQL
│       ├── src/
│       │   ├── app.module.ts      # Registro estruturado de módulos acadêmicos
│       │   └── main.ts            # Inicialização segura do servidor, CORS e pipelines
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                        # Design System de Componentes Reutilizáveis Premium
│   │   ├── components/            # Botões, Inps, Cards glassmorphic e Modais de validação
│   │   ├── index.ts               # Ponto central de exportação do kit UI
│   │   └── package.json
│   ├── types/                     # Interfaces TypeScript Estritas partilhadas
│   │   ├── index.ts               # Tipagens estritas das entidades Prisma
│   │   └── package.json
│   ├── utils/                     # Utilitários de lógica e Helpers de moeda
│   │   ├── index.ts               # Formatação de Kwanza (AOA), USD e assinaturas cripto
│   │   └── package.json
│   └── config/                    # Configurações de Linting e Temas da marca
│       ├── eslint-preset.js
│       ├── tailwind.config.js     # Configuração mestre das cores Navy (#0A2E5D) e Ouro (#C89B3C)
│       └── package.json
├── infra/
│   ├── terraform/                 # Arquivos de IaC para Google Cloud Platform
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── docker/                    # Dockerfiles isolados multi-stage para Cloud Run
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.api
│   └── scripts/                   # Scripts auxiliares Bash para pipelines locais e CD
│       ├── build.sh
│       └── deploy.sh
├── pnpm-workspace.yaml            # Configuração de workspaces PNPM
├── turbo.json                     # Pipeline de caches da Turborepo
└── README.md                      # Documentação de Referência Principal
```

---

## 🎨 Identidade Visual & Design System

A nossa paleta de cores reflete a nobreza e a alta qualidade literária da instituição:
* **Primária (Navy Blue):** `#0A2E5D` — Representa integridade intelectual, estabilidade e rigor administrativo.
* **Secundária (Gold):** `#C89B3C` — Simboliza excelência de competências, valor de mercado e oportunidades desbloqueadas.
* **Neutros:** Branco, Cinzas Premium de alta legibilidade.

### Elementos de Branding Autorizados
* **Logo Principal (Sem fundo):**  
  `https://res.cloudinary.com/deeki0eou/image/upload/v1780728240/logotipo-dourado-sem-fundo_abouxm.png`
* **Logo Secundário (Com fundo):**  
  `https://res.cloudinary.com/deeki0eou/image/upload/v1780311906/logo-com-fundo-branco_rt0kng.jpg`

---

## 📡 Integrações Futuras Pré-Configuradas

O ecossistema está nativamente acoplado e pronto para consumir as seguintes SDKs externas:
1. **Google Calendar:** Sincronização em tempo real de agendas de turmas e prazos de avaliações.
2. **Google Meet:** Criação dinâmica e gravação automatizada de salas híbridas de aula síncronas.
3. **Google Forms:** Recepção e processamento estruturado de candidaturas públicas.
4. **Google Drive:** Repositório escalável de manuais e e-books jurídicos e pedagógicos.
5. **Google Sheets:** Consolidação analítica auxiliar de registros financeiros para o Portal Administrativo.

---

## 🚀 Como Inicializar o Projeto Localmente

### 1. Pré-requisitos
* Ter instalado o **Node.js v20+**
* Ter instalado o **PNPM v9+** (`npm install -g pnpm`)

### 2. Instalação de Dependências
Na raiz do monorepo, execute o comando abaixo para vincular todos os workspaces locais:
```bash
pnpm install
```

### 3. Sincronização de Banco de Dados
Configure o arquivo `.env` com a sua URL do PostgreSQL e aplique o esquema mestre:
```bash
pnpm --filter multiplus-api prisma:generate
pnpm --filter multiplus-api prisma:push
```

### 4. Executar em modo de Desenvolvimento
Para lançar as aplicações Next.js (Front) e NestJS (API) simultaneamente com suporte a hot reload:
```bash
pnpm dev
```
O website institucional estará aberto na porta `3000` (http://localhost:3000) e o backend API estará disponível na porta `4000` (http://localhost:4000/api/v1).

---

## 📞 Canais Oficiais de Atendimento

* **Telemóvel de Suporte:** +244 956 449 084
* **E-mail Institucional:** multiplusacademy@gmail.com
* **Localização da Sede:** Huambo, Angola

---
*MultiPlus Academy © 2026. Todos os direitos reservados.*
