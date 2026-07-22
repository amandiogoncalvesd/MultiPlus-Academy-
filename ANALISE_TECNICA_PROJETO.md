# Análise técnica do MultiPlus Academy

**Data:** 22 de julho de 2026  
**Escopo:** revisão estática integral do repositório, com prioridade para os portais/dashboards de Aluno, Professor e Administração. A documentação foi lida, mas o código e as migrations foram tratados como fonte de verdade.

> Não foram usadas credenciais de Supabase nem de produção. Portanto, esta análise confirma fluxos implementados e riscos de código/esquema; não confirma que uma instância já publicada possui todas as migrations aplicadas ou dados consistentes.

---

## 1. Resumo executivo

O projeto entregue é, na prática, uma **SPA React 19 + Vite**, que usa o cliente Supabase diretamente no navegador para autenticação, dados, storage e realtime. Há uma implementação relativamente rica de LMS: website público, login, três portais por papel, catálogo, cursos/aulas/vídeo, progresso, avaliações, certificados, agenda, notificações e mensagens.

A experiência visual e a cobertura funcional de interface são boas, especialmente no portal de aluno e no fluxo de professor. Porém, o produto ainda não está pronto para operação acadêmica segura sem uma etapa de estabilização. Os problemas de maior impacto são:

1. **O projeto não passa no type-check** após instalação limpa: faltam `@types/react` e `@types/react-dom`; há também erros TypeScript reais, incluindo o mapeador de utilizador e a configuração Vite.
2. **As fontes de banco de dados divergem:** migrations Supabase, `supabase_schema.sql`, código front-end e Prisma/NestJS não descrevem o mesmo sistema. Há tabelas usadas pela interface que não são criadas por nenhuma migration versionada.
3. **O backend NestJS/Firebase/Prisma documentado não integra com a aplicação web real**, que usa Supabase Auth diretamente. Isso cria duas arquiteturas e dois modelos de identidade incompatíveis.
4. **O dashboard administrativo apresenta indicadores de dados reais em alguns pontos, mas vários módulos e integrações são apenas UI/local state ou dependem de tabelas ausentes.**
5. **Há riscos de autorização e exposição de dados pessoais nas políticas RLS**, além de inscrição como professor permitida no cadastro público.

A prioridade recomendada é corrigir compilação e unificar o modelo de dados/autenticação antes de acrescentar novas telas.

---

## 2. Arquitetura encontrada (código, não README)

| Camada | Implementação observada |
|---|---|
| Web | Vite 6, React 19, TypeScript, `motion/react`, Tailwind via plugin Vite, SPA sem React Router. |
| Navegação | `src/App.tsx` mantém um `PageId` em estado e alterna componentes. Portais são carregados com `lazy`. |
| Autenticação | Supabase Auth em `src/components/auth/AuthProvider.tsx` e `src/services/supabase/authService.ts`. Papéis são lidos de `public.users`. |
| Dados | Cliente Supabase exposto no browser (`src/lib/supabase/client.ts`); serviços especializados por domínio em `src/services/supabase/`. |
| Realtime | Mensagens, presença/notificações e contadores usam canais Supabase. |
| Backend paralelo | `apps/api` contém NestJS + Firebase Admin + Prisma, mas não é instalado/executado pelo `package.json` raiz e não é chamado pelo front-end. |
| Banco paralelo | Migrations descrevem PostgreSQL/Supabase com UUIDs e nomes em português; Prisma descreve outro modelo, com campos e relações diferentes. |
| Infra | Há Docker/Terraform/scripts, mas não há workflows `.github`, app web em `apps/web`, nem um pipeline executável consistente com a raiz. |

### Fluxo de papéis implementado

- **Aluno (`ALUNO`):** acessa portal do aluno, seus cursos, aulas, progresso, materiais, tarefas, mensagens, certificados e perfil.
- **Professor (`PROFESSOR`):** acessa dashboard docente, cursos próprios, alunos, avaliações/submissões, certificados, agenda e mensagens.
- **Administrador (`ADMIN`):** acessa visão ampla de utilizadores, cursos, matrículas, certificados, configurações, notificações e criação/remoção de contas por Edge Function.
- `ProtectedRoute` protege a renderização do lado cliente, mas a proteção efetiva dos dados depende integralmente de RLS no Supabase.

---

## 3. Avaliação dos dashboards

### 3.1 Portal do aluno — `StudentPortal.tsx` e componentes `portal/*`

**O que está implementado e conectado a dados**

- Carrega matrículas, aulas do curso selecionado, conclusões, certificados, agenda, notificações e não-lidas com `useStudentData`.
- Permite selecionar curso, abrir videoaula, gravar posição do vídeo, marcar/desmarcar aula concluída, gerir notas, ver materiais, tarefas, certificados e progresso.
- Tem estados vazios para aluno sem matrícula e feedback visual para vídeo/aula indisponível.
- Aulas, materiais e progresso usam serviços Supabase separados; a estrutura de funcionalidades é uma das partes mais maduras do repositório.

**Problemas funcionais e de produto**

- A home do aluno é muito específica ao curso “English for the Legal Field…” e aos módulos “Drafting Prático”, mesmo se a matrícula for em outro curso. Isso contradiz o suporte técnico a múltiplos cursos.
- Os indicadores da home não são métricas acadêmicas confiáveis:
  - “Dedicação Acumulada” é calculada como `aulas concluídas × 1,5h`, não pelo tempo visto;
  - a taxa/progresso da home usa apenas o curso selecionado;
  - o texto de “sincronizados em tempo real” para certificados é mais forte que a implementação: certificados são carregados, mas não há assinatura realtime para eles.
- `progressService.getCompletedLessons(studentId, courseId)` ignora o `courseId`. Se houver registros de progresso antigos ou inconsistentes, o total de concluídas pode incluir aulas de outros cursos. A lista de aulas do curso limita o denominador, mas não o numerador.
- Há uma inconsistência no bloqueio de aula: no seletor uma aula sem `scheduled_at` pode ser escolhida, mas o player a bloqueia porque a condição trata ausência de agenda como bloqueada. É uma decisão possível, mas a UX comunica coisas diferentes.
- Datas/horas dependem do timezone do browser; não existe política explícita de timezone institucional (Angola) ou normalização na UI.
- São usados muitos `any`, tornando regressões de formato de dados prováveis.

**Conclusão:** bom esqueleto de LMS, mas o dashboard deve ser parametrizado por curso e as métricas devem ser calculadas no banco/API, não inferidas visualmente.

### 3.2 Portal do professor — `InstructorPortal.tsx` e `instructor/*`

**O que está implementado e conectado**

- Dashboard com KPIs de cursos, alunos, aulas, avaliações pendentes, certificados e taxa de conclusão.
- Criação/edição de curso e aulas, gestão de materiais, seleção de estudantes, avaliações, correção de submissões, certificados, agenda e mensagens.
- `useTeacherCourses`, `useTeacherEvaluations`, `useTeacherStudents` e `useTeacherNotifications` isolam boa parte da carga de dados.
- A correção de submissões e o feedback coletivo têm serviços próprios (`assignmentService`).

**Problemas relevantes**

- O gráfico do dashboard **não existe ainda**: os dois botões mudam estado, mas a área mostra sempre uma mensagem de placeholder. Logo, “Análise Temporal de Presença & Aprendizado” não é uma análise implementada.
- A fonte de `students` é global (`users` com role `ALUNO`) no hook, e não fica explicitamente limitada aos alunos dos cursos do professor. Isso pode inflar “Total de Alunos” e expor alunos fora da responsabilidade docente, conforme RLS aplicado.
- As notificações do professor são apenas suas notificações pessoais; não equivalem necessariamente a eventos acadêmicos (nova matrícula, envio de trabalho etc.).
- As métricas de taxa de conclusão precisam de uma consulta agregada central, por curso e por docente. Hoje há risco de contagem incompleta ou diferente entre abas.
- Os textos padrão têm nomes de pessoas (“Esmeralda Sumbelelo”) e discurso específico de juristas/Angola; devem cair para um nome neutro ou dados institucionais configuráveis.

**Conclusão:** é um portal operacional com boas telas de trabalho; o painel analítico ainda é sobretudo uma apresentação de KPIs e placeholders, não BI acadêmico.

### 3.3 Portal administrativo — `AdminPortal.tsx`

**O que está implementado e conectado**

- Leitura de utilizadores, cursos, matrículas, certificados e notificações.
- Criação e eliminação de utilizadores por Edge Function `admin-users`.
- Alteração de status, upload de avatar, catálogo/edição/duplicação/remoção de cursos, emissão de certificados e preferências de perfil.
- Dashboard apresenta totais derivados de arrays carregados do Supabase.

**Limitações e inconsistências**

- É um componente monolítico de cerca de **1.769 linhas**, responsável por consultas, mutações, formulários, permissões, layout e estado de 18 abas. É caro de testar e manter.
- O admin carrega dados quando `activeTab` muda; há custo desnecessário e risco de repetição de queries. Não há cache, paginação, cancelamento nem tratamento consistente de erro/carregamento.
- `auditLogs` inicia vazio e os “logs de auditoria” adicionados pela UI não são persistidos. Não há tabela/migration de auditoria encontrada.
- “Integrações” mostra Supabase, Vercel e Cloudinary como **Conectado** de forma fixa; não realiza health check. Não deve ser apresentado como monitoramento real.
- Configurações dependem de `institution_settings`, tabela referenciada pelo código mas ausente das migrations versionadas.
- Outras telas usam dados locais ou campos hard-coded (preço, duração, agenda, nome do curso) mesmo após carregar o banco.
- A criação de usuário captura e exibe a senha recém-criada ao administrador. Isso pode ser necessário em um onboarding excepcional, mas não deve ser a prática padrão: prefira convite/redefinição de senha, cópia única e nunca persistência/registro do segredo.
- A suspensão muda apenas `public.users.status`. É preciso confirmar que as políticas e a Edge Function impedem token/sessão existente de continuar acessando; o cliente Supabase puro não consulta o status a cada request automaticamente.

**Conclusão:** útil como back-office inicial, mas ainda não é um console administrativo auditável e seguro. Os módulos financeiros, de integrações e auditoria citados nos textos/documentação não estão entregues como funcionalidades reais.

---

## 4. Banco de dados, migrations e integração

### Fonte de verdade inexistente

Há pelo menos quatro descrições concorrentes:

1. `supabase/migrations/001..004` — a sequência mais próxima do front-end atual;
2. `supabase_schema.sql` — cópia antiga do schema inicial e não uma versão consolidada das quatro migrations;
3. serviços/JSX do front-end — usam tabelas e campos adicionais;
4. `apps/api/prisma/schema.prisma` — modelo diferente, pensado para NestJS/Firebase.

Exemplos concretos de divergência:

- Front-end usa `lesson_progress`; migration 001 cria `student_progress`; migration 002 renomeia. O arquivo consolidado antigo ainda cria `student_progress`.
- Front-end usa `applications`, `media`, `avatars`, `institution_settings`, `user_presence`, `pinned_messages`, `message_reactions`, `message_deletions` e `chat_media`. Nenhuma dessas tabelas aparece como `CREATE TABLE` nas migrations versionadas nem no schema consolidado.
- A interface usa `courses.price` e campos adicionais, mas a schema inicial de Supabase não cria `price`.
- Prisma usa `firstName`, `lastName`, `userId`, `isActive`, `verificationHash`, `moduleId`; Supabase usa `nome_completo`, `student_id`, `status`, `codigo_validacao`, e `course_id` diretamente em `lessons`.
- Prisma inclui pagamentos, eventos e conversas; as migrations Supabase atuais não equivalem a esse modelo.

**Impacto:** um deploy novo a partir de `supabase/migrations` não fornece todas as tabelas esperadas pela UI. Um deploy a partir de `supabase_schema.sql` é ainda mais incompleto. E não é seguro apontar Prisma para o mesmo banco sem uma migração de reconciliação cuidadosamente desenhada.

### Recomendação estrutural

Escolher uma única arquitetura antes de novas features:

- **Opção recomendada para o estado atual:** Supabase como Auth/Postgres/Storage/Realtime, com migrations SQL completas como fonte de verdade e Edge Functions para operações administrativas/sensíveis.
- **Alternativa:** NestJS + Prisma como única API e autorização, removendo acesso direto do browser às tabelas e migrando autenticação. Isso exige trabalho considerável, pois é uma reescrita de integração.

Depois, gerar uma migration de reconciliação, verificar em staging e remover/arquivar os artefatos da arquitetura abandonada.

---

## 5. Segurança e autorização — prioridade alta

### P0 — corrigir antes de produção

1. **Cadastro público permite papel `PROFESSOR`.**
   - Em `authService.register`, o comentário afirma que o cadastro força aluno, mas `safeRole` preserva `PROFESSOR` quando o cliente o envia. `AuthProvider` repete a mesma lógica.
   - Mesmo que a trigger atual ignore metadata, isso é uma falha de intenção e pode virar escalada de privilégio se a trigger/Edge Function confiar nesses metadados.
   - **Correção:** no self-signup, fixar incondicionalmente `ALUNO`; promoção para professor/admin apenas por operação server-side autorizada.

2. **PII está exposta por RLS.**
   - A migration 001 define `users FOR SELECT USING (true)` e `profiles FOR SELECT USING (true)`.
   - `users` inclui e-mail, telefone, nome e foto. `profiles` pode conter endereço, nascimento, nível e objetivos.
   - **Correção:** separar um perfil público mínimo, limitar colunas/visões e criar políticas por relação acadêmica e papel.

3. **Matrícula permite ação do próprio aluno via política ampla.**
   - `enrollments FOR ALL` aceita `auth.uid() = student_id`. Assim, um aluno pode potencialmente inserir sua própria matrícula em qualquer curso, dependendo da política efetiva.
   - **Correção:** somente admin/professor autorizado pode criar/remover matrícula; aluno deve ter apenas SELECT do próprio registro. Para autoinscrição, criar fluxo explícito com regras de pagamento/aprovação.

4. **Não há garantia versionada do esquema que sustenta a Edge Function administrativa.**
   - A função `admin-users` existe, mas a sua execução segura depende de segredo server-side e de policies/tabelas não todas versionadas. A área administrativa não deve ser liberada antes de validar o deploy desta função e remover permissões diretas indevidas.

### P1 — importante

- As políticas `FOR ALL` devem ter `USING` e `WITH CHECK` explícitos, para não permitir alteração/insert por inferência indesejada.
- `get_user_role` é `SECURITY DEFINER`; mantenha `search_path` fixo e privilégios mínimos, tal como já ocorre em algumas funções posteriores.
- Há políticas de mensagens sobrepostas entre migrations 001 e 002. Políticas permissivas são combinadas por OR no PostgreSQL; uma policy antiga pode anular a mais restritiva. Consolidar, `DROP POLICY` a antiga quando necessário e testar com contas de cada papel.
- Consultas e mutações administrativas no browser exigem RLS impecável. Para ações críticas (criar/remover usuário, alterar papel, emitir/revogar certificado), usar Edge Function/API com validação e trilha de auditoria.
- Não foram encontrados testes de autorização nem workflow CI.

---

## 6. Qualidade, build e operação

### Resultado da validação local

Foi executado em instalação limpa:

```bash
npm ci
npm run lint   # definido como tsc --noEmit
```

O type-check **falhou**. O primeiro bloqueio é a ausência de `@types/react` e `@types/react-dom` no `package.json`; por isso JSX e hooks aparecem em cascata como `any`. Também há erros que permanecerão após adicionar os tipos, incluindo:

- `src/lib/utils/userMapper.ts`: retorna `foto_perfil`, propriedade que não existe no tipo `User`.
- `vite.config.ts`: `build.minify` é inferido como `string`, incompatível com o tipo aceito por Vite.
- vários usos de `any` e callbacks implicitamente `any` ficarão expostos com os tipos React instalados.

Como o lint falha, o build não foi executado nesta rodada encadeada. O projeto não tem testes automatizados encontrados, configuração ESLint, Jest/Vitest ou GitHub Actions. `npm audit` indicou **3 vulnerabilidades** (2 baixas, 1 moderada); é necessário revisar antes de aplicar atualização automática.

### Outros pontos técnicos

- `package.json` raiz chama-se `react-example`, não MultiPlus; também declara `vite` em dependencies e devDependencies.
- O README descreve Next.js 15, app router, PNPM/Turborepo e execução coordenada NestJS; isso não corresponde ao aplicativo executável da raiz (Vite + npm). A pasta `apps/api` tem outro `package.json`, mas a raiz não é um workspace npm funcional para ela.
- Não há rotas URL reais: atualizar a página ou compartilhar link não preserva a aba/tela interna, prejudicando deep links, recuperação de navegação e SEO.
- Erros de serviços frequentemente são convertidos em arrays vazios ou só `console.error`; dashboards podem mostrar “0” como se fossem dados reais quando o banco falhou.
- Componentes muito extensos (`AdminPortal`, `StudentPortal`, `InstructorPortal`, `CourseEditorModal`) devem ser quebrados por feature e testados isoladamente.

---

## 7. Documentação: o que continua útil e o que está desatualizado

O README é útil como visão de negócio, paleta, contatos e intenção de ter um LMS de três portais. Porém, ele não é um guia confiável de execução:

| README afirma | Código atual mostra |
|---|---|
| Next.js 15 / App Router | Vite SPA e `App.tsx` com state-based navigation. |
| NestJS + Prisma + Firebase como core | Front usa Supabase Auth e Supabase JS diretamente. Nest/Firebase/Prisma estão isolados. |
| `apps/web` e rotas Next | Não existe `apps/web`; o web app está em `src/` na raiz. |
| PNPM workspaces/Turbo como execução | Há arquivos de workspace/turbo, mas o root `package.json` é npm/Vite e não orquestra todos os apps. |
| GitHub Actions CI/CD | Não há `.github/workflows` no repositório. |
| Migrations Prisma | Não há diretório Prisma migrations; há schema Prisma e migrations SQL Supabase distintas. |

Os blueprints NestJS/RBAC e `PRISMA_SCHEMA.md` devem ser tratados como propostas históricas, não como contrato de implementação. Recomenda-se reescrever o README após a decisão arquitetural, incluindo: comandos realmente executáveis, variáveis de ambiente, modelo de dados oficial, migrations, RLS, deploy, backup, e procedimentos de incidente.

---

## 8. Plano priorizado

### Fase 0 — bloquear risco e recuperar build (1–3 dias)

1. Revogar qualquer token exposto anteriormente e garantir que `.env` real não seja commitado.
2. Corrigir self-signup para sempre criar `ALUNO`.
3. Revisar/substituir RLS pública de `users` e `profiles`; bloquear matrícula direta por aluno.
4. Adicionar `@types/react` e `@types/react-dom`, corrigir `userMapper`, `vite.config.ts` e executar `tsc --noEmit` até zero erros.
5. Criar CI mínimo: instalação limpa, type-check, build, teste de migrations e auditoria de dependências.

### Fase 1 — unificar dados e dashboards (1–2 semanas)

1. Escolher Supabase ou NestJS/Prisma como fonte única; para este código, Supabase é o caminho de menor reescrita.
2. Criar migrations para cada tabela/coluna efetivamente usada ou remover a feature correspondente.
3. Gerar um schema consolidado a partir das migrations (não manter um SQL manual divergente).
4. Criar views/RPCs de métricas para aluno, professor e admin: progresso por curso, alunos vinculados ao professor, pendências, certificados, atividade e séries temporais.
5. Corrigir o filtro de progresso por `course_id` e tornar cards/textos dependentes do curso selecionado.
6. Substituir placeholders de gráfico e status “Conectado” por dados reais ou ocultá-los até implementação.

### Fase 2 — robustez operacional (2–4 semanas)

1. Extrair Admin/Student/Instructor em containers, hooks de domínio e componentes de apresentação.
2. Adicionar paginação, estados de loading/erro e cache/invalidação em todas as listas administrativas.
3. Implementar audit log persistente e trilha de mutações críticas.
4. Criar testes: RLS por papel, serviços Supabase simulados, fluxos de matrícula/progresso/avaliação, e testes E2E dos três dashboards.
5. Implantar staging, backup/restore de banco, observabilidade e monitoramento real de integrações.

---

## 9. Veredito

O repositório contém uma base visual e funcional promissora para um LMS, e os dashboards já cobrem muitas necessidades de tela. No entanto, existem duas plataformas parcialmente sobrepostas e uma camada de dados sem fonte de verdade única. Antes de evoluir funcionalidades, é essencial estabilizar a compilação, fechar RLS e consolidar o esquema/mecanismo de autenticação. Feito isso, os dashboards podem evoluir de uma boa demonstração operacional para um sistema acadêmico confiável.
