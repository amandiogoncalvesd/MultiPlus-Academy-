# Roadmap de modificações e correções — MultiPlus Academy

**Atualizado em:** 22 de julho de 2026  
**Objetivo:** transformar a base atual em um LMS funcional, acessível, seguro e sustentável, com três portais: Aluno, Professor e Administração.

Este roadmap complementa `ANALISE_TECNICA_PROJETO.md` e `PLANO_MESTRE_LMS.md`. Ele define a ordem de execução desde fundação visual e técnica até produção.

---

## Princípios que orientarão todas as alterações

1. **Funcionalidade antes de decoração:** nenhum indicador, gráfico ou integração será mostrado como real sem uma fonte de dados real.
2. **Uma única fonte de verdade:** Supabase/PostgreSQL e migrations versionadas serão o contrato oficial de dados.
3. **Permissão no banco, não só na tela:** esconder um botão não é autorização; RLS e Edge Functions definem o acesso.
4. **Acessibilidade desde o componente:** WCAG 2.2 AA, teclado, foco, contraste, leitor de tela e mobile fazem parte do critério de aceite.
5. **Design consistente:** os três portais usam o mesmo design system, mas têm tarefas e hierarquia adequadas ao papel.
6. **Commits pequenos e verificáveis:** cada modificação será testada, registrada e enviada ao repositório oficial.

---

## Fase 0 — Auditoria de base e preparação segura

### Objetivo
Estabilizar o projeto antes de alterar fluxos de negócio ou layout.

### Modificações

- Corrigir o type-check atual:
  - adicionar `@types/react` e `@types/react-dom`;
  - corrigir incompatibilidade em `vite.config.ts`;
  - corrigir `userMapper` e os tipos divergentes;
  - reduzir `any` nas fronteiras principais: autenticação, usuário, curso, aula, matrícula e certificado.
- Separar dependências de produção e desenvolvimento; eliminar duplicação de `vite` em `dependencies` e `devDependencies`.
- Instalar e configurar ferramentas de qualidade:
  - ESLint;
  - Prettier;
  - Vitest + Testing Library;
  - Playwright para fluxos E2E;
  - axe-core para acessibilidade.
- Criar GitHub Actions para: instalação limpa, type-check, lint, testes, build e auditoria de dependências.
- Criar convenções de commit, branch, variáveis de ambiente e checklist de pull request.
- Documentar claramente os ambientes `development`, `staging` e `production`.

### Critério de aceite

- `npm ci`, type-check, lint e build executam sem erro.
- Todo PR/commit passa pela mesma validação automática.
- Nenhuma chave sensível é mantida no repositório ou em código de browser.

---

## Fase 1 — Consolidar arquitetura, configuração e banco de dados

### Objetivo
Eliminar a divergência entre front-end, migrations Supabase, schema SQL histórico e NestJS/Prisma legado.

### Diagnóstico atual

- A aplicação real usa React/Vite/Supabase.
- README descreve Next.js/NestJS/Firebase/Prisma, arquitetura que não está conectada ao front-end em produção.
- As migrations não criam todas as tabelas que o código utiliza.
- `supabase_schema.sql` está desatualizado e conflita com migrations posteriores.

### Modificações

- Declarar Supabase como fonte operacional do backend neste estágio.
- Arquivar e identificar `apps/api`, Prisma e blueprints NestJS como legado até uma decisão futura; eles não devem influenciar deploy nem documentação de execução.
- Criar uma migration de reconciliação, sem apagar dados existentes, para completar tabelas/colunas necessárias:
  - `institution_settings`;
  - `audit_logs`;
  - estruturas de presença/chat que permanecerem no escopo;
  - configurações de notificações;
  - campos de curso/aula realmente usados;
  - buckets/policies de storage.
- Gerar um dicionário de dados oficial: tabela, campo, tipo, origem, quem lê, quem escreve e finalidade.
- Substituir `supabase_schema.sql` por um processo reproduzível a partir das migrations, ou removê-lo se não for necessário.
- Definir tipos TypeScript derivados do schema Supabase para evitar formatos incompatíveis no browser.

### Critério de aceite

- Um banco Supabase vazio pode ser criado exclusivamente pelas migrations versionadas.
- Nenhuma tela faz query a tabela/coluna inexistente.
- A documentação de setup corresponde aos comandos reais do projeto.

---

## Fase 2 — Segurança, autenticação e permissões

### Objetivo
Garantir que cada papel tenha o alcance correto e que dados pessoais/acadêmicos não sejam expostos.

### Modificações prioritárias

- Alterar cadastro público para criar apenas `ALUNO`.
- Remover permissões públicas em `users` e `profiles` que expõem e-mail, telefone, endereço e dados de perfil.
- Criar visão mínima de contatos autorizados para mensagens, sem expor dados privados globais.
- Restringir matrícula:
  - aluno lê somente a própria matrícula;
  - professor cria/remove matrícula somente em curso próprio;
  - admin possui gestão global;
  - aluno nunca se matricula diretamente sem fluxo explícito de aprovação.
- Restringir aulas, materiais, tarefas, certificados, notas e progresso por curso e matrícula.
- Revisar policies `FOR ALL`: aplicar `USING` e `WITH CHECK` explicitamente.
- Consolidar policies de chat, removendo regras antigas permissivas que podem se combinar por OR.
- Revisar a Edge Function `admin-users`:
  - validar payload;
  - limitar papéis;
  - gerar trilha de auditoria;
  - usar service role apenas no servidor;
  - adicionar ações de convite/redefinição em vez de expor senha como fluxo normal.

### Critério de aceite

Testes automatizados comprovam que aluno, professor e admin não conseguem consultar ou alterar recursos de outro escopo.

---

## Fase 3 — Novo modelo acadêmico: curso, aula, matrícula e agenda

### Objetivo
Implementar integralmente o fluxo central do LMS.

### Modelo funcional definitivo

```text
Professor/Admin cria curso
    ↓
Professor cria módulos e aulas no curso
    ↓
Professor/Admin matricula alunos no curso
    ↓
Professor agenda cada aula: início + fim + vídeo/material/reunião
    ↓
Aluno vê aula futura no calendário (bloqueada)
    ↓
Durante a janela, aula aparece em “Minhas aulas” e pode ser consumida
    ↓
Após o fim, sai de “Minhas aulas” e permanece no calendário/histórico
```

### Alterações de schema

- Padronizar módulos e aulas por curso.
- Substituir a data única `scheduled_at` por:
  - `access_starts_at`;
  - `access_ends_at`;
  - `status` (`DRAFT`, `PUBLISHED`, `CANCELLED`, `ARCHIVED`);
  - eventual política `allow_replay_after_end` se for aprovada posteriormente.
- Adicionar constraints para impedir fim anterior ao início.
- Criar índices por `course_id`, status e janela de acesso.
- Registrar `created_by`, `updated_by` e eventos de agenda relevantes.
- Padronizar estados de matrícula: `ACTIVE`, `COMPLETED`, `CANCELLED`.

### Alterações de serviços e telas

- Criar queries tipadas para:
  - cursos do aluno;
  - aulas futuras;
  - aulas ativas;
  - histórico/calendário;
  - alunos por curso;
  - progresso por aluno e curso.
- Substituir a seleção global de estudantes do professor por seleção de **matriculados no curso escolhido**.
- Impedir que professor publique/agenda aula sem curso e sem janela válida.
- Corrigir bloqueio do player: aula sem janela publicada não pode aparecer como aula disponível.
- Implementar notificações quando aluno é matriculado, aula é publicada/agendada e janela está próxima de abrir.
- Definir timezone institucional como `Africa/Luanda` nas entradas e exibições de data.

### Critério de aceite funcional

- Professor cria curso e aula, matricula um aluno e agenda a aula.
- Apenas o aluno matriculado vê a aula futura no calendário.
- O aluno abre a aula somente entre início e fim.
- Após a janela, a aula deixa a área ativa e continua no calendário/histórico.
- Professor e admin veem a trajetória/progresso do aluno no curso.

---

## Fase 4 — Reestruturação de layout e design system

### Objetivo
Passar de telas grandes e inconsistentes para uma interface clara, escalável e coerente.

### Problemas atuais de layout/design

- `StudentPortal`, `InstructorPortal` e `AdminPortal` são componentes monolíticos, com centenas/milhares de linhas.
- Há textos, nomes, preços, horários e curso fixos na interface.
- O mesmo recurso possui implementação diferente por papel, por exemplo avatar e perfil.
- Há excesso de texto muito pequeno, cards decorativos e espaços de dashboard que não trazem decisão prática.
- Navegação é controlada apenas por estado do React; não há rotas URL/deep links.

### Design system alvo

- Criar tokens centralizados para:
  - cores de marca e cores semânticas (sucesso, erro, aviso, informação);
  - contraste mínimo validado;
  - espaçamento;
  - tipografia responsiva;
  - raios, sombras e estados de foco;
  - breakpoints;
  - z-index e camadas de modal/toast.
- Estabelecer componentes reutilizáveis:
  - `AppShell`, `Sidebar`, `Topbar`, `PageHeader`;
  - `Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `DateTimeField`;
  - `Dialog`, `Drawer`, `Toast`, `EmptyState`, `ErrorState`, `LoadingState`;
  - `DataTable`, `Pagination`, `FilterBar`, `MetricCard`;
  - `AvatarUpload`, `CourseCard`, `LessonStatus`, `ScheduleBadge`.
- Adotar React Router:
  - `/` público;
  - `/aluno/*`;
  - `/professor/*`;
  - `/admin/*`;
  - rotas protegidas e retorno à rota pretendida após login.

### Organização visual por portal

#### Aluno

- Home objetiva: próxima aula ativa, progresso, pendências e avisos.
- Navegação: Visão geral, Meus cursos, Minhas aulas, Calendário, Progresso, Tarefas, Certificados, Mensagens e Perfil.
- Evitar conteúdo jurídico/curso específico fixo; tudo vem do curso selecionado.

#### Professor

- Home: cursos próprios, alunos ativos, próximas aulas, avaliações e pendências.
- Navegação: Visão geral, Cursos, Alunos, Agenda, Progresso, Avaliações, Certificados, Mensagens e Perfil.
- Dentro do curso: abas para Visão geral, Aulas, Matrículas, Materiais, Progresso, Tarefas e Certificados.

#### Administrador

- Home: totais reais, alertas acionáveis e atividade recente.
- Navegação: Utilizadores, Professores, Cursos, Matrículas, Aulas/Calendário, Certificados, Comunicação, Relatórios, Auditoria, Configurações e Perfil.
- Administração global não deve repetir componentes de professor sem indicar claramente o escopo global.

### Critério de aceite

- O mesmo fluxo tem comportamento e linguagem visual consistentes em todos os tamanhos de tela.
- Não há informação estática fingindo ser dados do sistema.
- Cada URL pode ser aberta/recarregada sem perder a tela atual.

---

## Fase 5 — Acessibilidade e experiência inclusiva

### Objetivo
Alcançar padrão WCAG 2.2 AA nos fluxos mais importantes.

### Correções globais

- Adicionar `lang="pt-AO"`, link “Saltar para conteúdo”, landmarks `header/nav/main/footer` e hierarquia de headings.
- Criar foco visível em todos os controles e não remover `outline` sem substituto adequado.
- Padronizar tamanho de fonte: remover textos críticos de 7–10px; preservar legibilidade com zoom 200% e 400%.
- Validar contraste de texto, ícones e estados em claro/escuro.
- Respeitar `prefers-reduced-motion`; reduzir animações de splash, pulse e bounce.
- Garantir que cor nunca seja a única forma de comunicar estado.

### Formulários e diálogos

- Todo campo recebe `id`, `label htmlFor`, instrução e erro associado por `aria-describedby`.
- Placeholders não substituem labels.
- Diálogos terão `role="dialog"`, `aria-modal`, título associado, focus trap, Escape e retorno de foco.
- Mensagens de sucesso/erro usam região viva apropriada.

### Chat e notificações

- Tornar o avatar upload um botão/label real, navegável por teclado.
- Dar nome acessível a cada botão de ícone: enviar, cancelar edição, reagir, excluir, rolar para baixo, abrir menu e fechar modal.
- Marcar lista de conversas corretamente; implementar navegação por teclado.
- Usar `role="log"` e anúncios controlados para mensagens novas, sem interromper leitura continuamente.
- Evitar auto-scroll caso usuário esteja lendo histórico; oferecer botão “Novas mensagens / ir ao fim”.
- Dar alternativa textual aos estados online, digitando, não lida, bloqueada e pendente.

### Vídeo e calendário

- Garantir controles por teclado, legendas/transcrição quando disponíveis, mensagem explícita de indisponibilidade e duração de janela de acesso.
- Tabelas/calendários possuem alternativa textual/lista para dispositivos móveis e leitores de tela.

### Critério de aceite

- Fluxos de login, matrícula, criar aula, assistir aula, chat, upload de avatar e download de certificado passam por teclado sem mouse.
- axe-core não aponta violações críticas nesses fluxos.
- Testes manuais em leitor de tela e zoom são registrados.

---

## Fase 6 — Perfis, avatares e configurações

### Objetivo
Unificar o comportamento que hoje só funciona plenamente para alunos.

### Modificações

- Reutilizar `AvatarUpload` corrigido nos três portais.
- Centralizar upload em bucket de avatar com validação de MIME, extensão, tamanho e caminho por utilizador.
- Atualizar `users.foto_perfil` e contexto de autenticação após upload, sem recarregar a página.
- Remover imagem e nome fixos do perfil docente; usar dados do utilizador autenticado.
- Persistir bio, telefone e preferências de todos os papéis em modelo consistente.
- Criar `institution_settings` oficial, com migration e controles administrativos reais.
- Adicionar preferências de notificação, tema, alto contraste e redução de movimento de forma persistida quando adequado.

### Critério de aceite

Aluno, professor e administrador conseguem atualizar foto e perfil com o mesmo fluxo, feedback de erro/sucesso e permissões corretas.

---

## Fase 7 — Certificados PDF e validação

### Objetivo
Trocar geração interna por emissão segura de PDF já preparado.

### Modificações

- Remover geração de certificado no cliente e dependência `jspdf` quando a migração estiver concluída.
- Criar bucket privado `certificates`.
- Criar Edge Function para upload/emissão:
  - verificar papel e escopo do curso;
  - verificar matrícula/elegibilidade;
  - aceitar apenas PDF;
  - definir limites de tamanho;
  - registrar auditoria;
  - gerar código único de validação.
- Criar tela administrativa/docente de emissão por upload.
- Criar área do aluno para listar e baixar PDFs próprios por URL assinada.
- Criar verificação pública mínima por código, sem expor o arquivo ou dados pessoais excessivos.
- Criar revogação, motivo e histórico de emissão.

### Critério de aceite

A plataforma nunca gera um certificado visual. Ela armazena, associa, audita, valida e entrega apenas PDFs autorizados.

---

## Fase 8 — Dashboards, dados reais e relatórios

### Objetivo
Transformar dashboards em ferramentas de decisão, não em painéis decorativos.

### Modificações

- Criar views/RPCs agregados no banco para:
  - progresso por aluno/curso/módulo;
  - matrículas ativas e conclusão;
  - aulas futuras/ativas/encerradas;
  - avaliações pendentes;
  - certificados emitidos/revogados;
  - atividade recente;
  - métricas por período.
- Professor vê apenas métricas de cursos próprios.
- Admin vê métricas globais, com filtros por curso, professor e período.
- Aluno vê apenas progresso próprio e metas reais.
- Remover gráficos placeholders ou substituí-los por empty states honestos até haver dados suficientes.
- Adicionar tabelas acessíveis e exportação CSV apenas após validação de permissões.
- Implementar paginação, busca server-side e filtros para administração.

### Critério de aceite

Todo card apresenta origem/consulta definida; erros de consulta mostram erro, e não o valor `0` como se fosse dado real.

---

## Fase 9 — Chat, notificações e comunicação

### Objetivo
Tornar comunicação confiável, acessível e limitada ao escopo acadêmico.

### Modificações

- Simplificar o chat inicialmente para mensagens, leitura, resposta, edição limitada e exclusão com regra clara.
- Não persistir reações ou exclusões em `localStorage` como fonte de verdade; migrar para banco caso a feature seja mantida.
- Definir participantes autorizados:
  - aluno ↔ professor do curso;
  - professor ↔ aluno matriculado em curso próprio;
  - admin conforme regra institucional.
- Criar anúncios institucionais separados de mensagens pessoais.
- Criar preferência de notificações e marcar leitura de modo seguro.
- Implementar emails apenas para eventos importantes: matrícula, aula próxima, certificado e redefinição de senha.

### Critério de aceite

Um aluno não inicia conversa com pessoa fora de seus cursos; novos eventos possuem fallback visual e acessível caso Realtime falhe.

---

## Fase 10 — Deploy, observabilidade e documentação final

### Objetivo
Operar o LMS em produção com segurança e capacidade de evolução.

### Modificações

- Vercel:
  - configurar produção e preview por branch;
  - configurar domínio, redirects e variáveis públicas mínimas;
  - bloquear deploy se build/testes falharem quando possível.
- Supabase:
  - projetos separados para staging e produção;
  - backups, restore testado, políticas e secrets configurados;
  - migrations aplicadas por pipeline/agente autorizado, nunca manualmente em produção sem registro.
- Observabilidade:
  - Sentry para erros;
  - logs estruturados em Edge Functions;
  - monitoramento de storage, falhas de upload, queries lentas e autorização negada.
- Documentação:
  - README real e atualizado;
  - guia de setup;
  - guia de migrations;
  - matriz RBAC;
  - manual de administrador/professor;
  - runbook de incidentes e rollback.

### Critério de aceite

Há ambiente de staging testável, deploy rastreável, rollback conhecido e documentação suficiente para outro desenvolvedor operar o projeto.

---

## Ordem recomendada de commits iniciais

1. `chore: stabilize TypeScript toolchain and add quality scripts`
2. `ci: validate typecheck lint tests and build on GitHub`
3. `db: reconcile Supabase schema and establish typed data contracts`
4. `security: restrict signup enrollment and private profile access`
5. `feat(lms): enforce course enrollment and lesson availability windows`
6. `feat(teacher): manage course enrollments and student progress`
7. `feat(student): show active lessons and academic calendar history`
8. `feat(certificates): issue uploaded PDF certificates securely`
9. `refactor(ui): establish accessible portal shells and shared components`
10. `fix(a11y): make forms dialogs chat and notifications keyboard accessible`

---

## Riscos a controlar durante a execução

| Risco | Mitigação |
|---|---|
| Aplicar migration em produção e afetar alunos atuais | Staging, backup, migration reversível quando possível, validação por agente autorizado. |
| Deploy Vercel quebrar o site público | Builds locais, CI e commits pequenos; evitar alterações de banco sem compatibilidade temporária. |
| RLS corrigido bloquear telas existentes | Testes por papel e rollout por etapas com queries explícitas. |
| Reescrever layout e perder funcionalidade | Separar refactor visual do refactor de dados; cobrir fluxos críticos com E2E. |
| Vídeo público ou certificado exposto | Storage privado, URLs assinadas, policies e validação server-side. |
| Crescimento de custo de vídeo | Escolher provedor após estimar minutos assistidos/mês e iniciar com limites. |

---

## Resultado esperado ao final

Uma plataforma LMS na qual:

- Admin controla instituição, pessoas, cursos, agenda, certificados e auditoria;
- professor controla somente seus cursos, aulas, alunos e seus progressos;
- aluno só vê cursos matriculados e aulas na janela autorizada;
- aulas encerradas passam ao histórico/calendário;
- certificado é PDF externo, entregue de modo privado e verificável;
- dashboards refletem dados reais;
- interface é responsiva, navegável por teclado e acessível;
- o repositório, banco e deploy são reproduzíveis e documentados.
