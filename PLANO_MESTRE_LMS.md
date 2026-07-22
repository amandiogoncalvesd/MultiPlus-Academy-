# Plano mestre de evolução — MultiPlus Academy LMS

**Data:** 22 de julho de 2026  
**Estado:** plano técnico e funcional antes da intervenção no produto  
**Base da análise:** código atual, componentes dos três portais, serviços Supabase, Edge Function, migrations SQL, configuração de build e documentação histórica.

## Decisão de trabalho

Este repositório é a fonte de trabalho daqui em diante:

- **GitHub:** `https://github.com/amandiogoncalvesd/MultiPlus-Academy-Dev`
- **Branch inicial:** `main`
- **Regra de engenharia:** cada alteração funcional será implementada, validada, documentada quando necessário e enviada em um commit ao repositório acima. Alterações maiores serão feitas em branches temáticas e integradas por commits pequenos e reversíveis.

> Esta etapa não altera o comportamento da aplicação: registra a arquitetura-alvo, o diagnóstico e a ordem segura de execução.

---

## 1. Visão de produto acordada

A MultiPlus Academy será um **LMS de vídeo-aulas orientado a cursos**, comparável na organização a Coursera/FreeCodeCamp, com três áreas independentes e controles de acesso reais.

### Ciclo acadêmico obrigatório

1. Administrador ou professor autorizado cria um **curso**.
2. O curso contém módulos e **aulas vinculadas exclusivamente a esse curso**.
3. Professor/admin matricula alunos no curso.
4. Para cada aula, o professor define uma janela de acesso: data/hora de início e data/hora de fim, vídeo, materiais e, opcionalmente, reunião ao vivo/tarefa.
5. Somente alunos com matrícula ativa naquele curso podem consultar a aula.
6. A aula aparece em **Minhas aulas** apenas enquanto estiver na janela definida.
7. Antes do início, aparece no calendário como futura/bloqueada; após o fim, sai de **Minhas aulas** e permanece no **calendário letivo/histórico**, no banco de dados, com status concluído/expirado.
8. Professor acompanha matrícula, presença/progresso, entregas e desempenho por aluno e curso.
9. Certificado é um **PDF já preparado fora da plataforma**: professor/admin faz upload do PDF, associa aluno e curso, e emite o registro. A plataforma não deve gerar o layout do certificado.

### Papéis e escopo

| Papel | Responsabilidades finais |
|---|---|
| **Administrador** | Controle institucional completo: utilizadores, papéis, estado de conta, professores, cursos, matrículas, aulas, calendário letivo, certificados PDF, comunicação, configurações, auditoria, relatórios e permissões. |
| **Professor** | Controla apenas os cursos atribuídos: cria/edita curso e aulas, agenda janelas de aula, matricula/retira alunos dos seus cursos, vê o progresso por aluno, gere materiais/tarefas, envia mensagens aos seus alunos, e faz upload/emissão de certificados PDF para alunos elegíveis. Não administra outros docentes, papéis globais ou configurações institucionais. |
| **Aluno** | Perfil, cursos matriculados, aulas disponíveis na janela atual, calendário/histórico, progresso, materiais, tarefas, mensagens autorizadas e certificados próprios. Não pode autoatribuir matrícula, papel, certificado ou progresso de outros utilizadores. |

---

## 2. Diagnóstico objetivo do estado atual

### O que pode ser aproveitado

- Base React/Vite e interfaces de aluno/professor/admin já existem.
- Supabase Auth, Postgres, Storage e Realtime já são usados pela aplicação real.
- Há serviços separados para cursos, aulas, matrículas, progresso, mensagens, agenda, notas, tarefas e certificados.
- O portal do aluno tem a maior cobertura visual: perfil, player, progresso, materiais, tarefas, certificados e calendário.
- Existe uma Edge Function administrativa inicial e um conceito de RLS.

### Falhas que explicam os problemas relatados

1. **Matrícula e listagem de alunos não têm uma fonte consistente.**
   - O professor usa um hook que busca todos os utilizadores com `role = ALUNO`, em vez de alunos do curso selecionado. Isso explica números incoerentes e o risco de “zero alunos” em seletores específicos.
   - As telas misturam lista global de alunos, `enrollments` e `lesson_targets`, sem uma consulta única de “alunos matriculados no curso”.

2. **Acesso a curso/aula está bloqueado por regras e estado inconsistentes.**
   - A policy de `courses` não permite explicitamente o catálogo público publicado, embora a página pública o consulte.
   - A lógica atual de aula usa apenas `scheduled_at`; não existe `scheduled_end_at`. Portanto, não há como cumprir a regra “desaparecer quando o dia terminar”.
   - O player trata aula sem `scheduled_at` como bloqueada, enquanto parte do seletor permite escolhê-la.

3. **O modelo de dados não é único.**
   - O front-end, migrations SQL, `supabase_schema.sql` e Prisma/NestJS descrevem bancos diferentes.
   - Tabelas usadas no código (`institution_settings`, `applications`, `user_presence`, reações/mídia de chat, entre outras) não são criadas pelas migrations versionadas.

4. **Perfis não são uniformes.**
   - Aluno usa o componente reutilizável `AvatarUpload`.
   - Perfil de professor exibe foto fixa e apenas mostra sucesso local para bio/CV, sem persistência comprovada.
   - Perfil admin tem fluxos próprios. A foto não usa a mesma abstração de upload/sincronização, explicando a diferença de comportamento.

5. **Certificados ainda seguem uma direção inadequada.**
   - Há dependência `jspdf` e uma modal de emissão pensada para geração/representação de certificado.
   - O fluxo desejado deve ser upload de um PDF pronto, com acesso privado e registro verificável.

6. **Dashboard administrativo e docente têm elementos de demonstração.**
   - Gráfico do professor é placeholder.
   - Status de integrações (“Conectado”) é fixo, sem health check.
   - Logs de auditoria locais não são persistidos.
   - Há métricas calculadas no cliente, defaults fixos e textos específicos de um curso/pessoa.

7. **Build e testes não estão saudáveis.**
   - `npm run lint` (TypeScript) falha depois de instalação limpa: faltam `@types/react`/`@types/react-dom`, há erro em `userMapper` e incompatibilidade em `vite.config.ts`, além de `any` em massa.
   - Não há testes automatizados nem CI versionado.

---

## 3. Arquitetura recomendada

### 3.1 Decisão: consolidar em Supabase + React/Vite

**Recomendação:** manter o front-end React/Vite atual e consolidar o backend no Supabase. Não iniciar agora uma reescrita para NestJS/Prisma/Firebase.

**Motivos:**

- A aplicação em execução já usa Supabase diretamente para Auth, banco, storage e realtime.
- Migrar agora para NestJS/Firebase/Prisma duplicaria autenticação, modelos e permissões, atrasando as correções funcionais solicitadas.
- Supabase cobre bem este estágio: PostgreSQL, RLS, Storage privado, Edge Functions, Cron, Realtime e backups em um único ambiente.
- Vite é adequado para uma SPA autenticada. A melhoria necessária é adotar rotas reais e gestão de dados, não trocar framework de imediato.

### 3.2 Arquitetura alvo

```text
Browser (React + TypeScript + Vite)
  ├── React Router: rotas públicas e /aluno, /professor, /admin
  ├── TanStack Query: cache, loading/error, invalidação pós-mutation
  ├── Componentes acessíveis e design system próprio
  └── Supabase JS somente para operações permitidas por RLS

Supabase
  ├── Auth: sessão e identidade
  ├── PostgreSQL: modelo LMS único + migrations versionadas
  ├── RLS: defesa real por papel, curso e matrícula
  ├── Storage privado: avatares, materiais e certificados PDF
  ├── Edge Functions: gestão de utilizadores, emissão de certificado,
  │                  URLs assinadas, operações administrativas e auditoria
  ├── Cron/Database functions: notificações e jobs de expiração
  └── Realtime: mensagens/notificações com limites e autorização

Hospedagem
  └── Vercel: front-end Vite, previews por pull request e domínio
```

### 3.3 O que será removido ou isolado

- `apps/api` (NestJS/Firebase/Prisma) será **arquivado como legado** até decisão futura; não será tratado como backend ativo.
- A documentação e artefatos que afirmam que Next.js/Nest/Firebase são o sistema atual serão reescritos depois da consolidação.
- `jspdf` será removido após o novo fluxo de certificado PDF estar em produção e coberto por testes.
- Não haverá chave `service_role` no navegador. Toda operação administrativa será Edge Function/API protegida.

### 3.4 Quando considerar NestJS

Somente considerar NestJS posterior se houver necessidade comprovada de: integrações corporativas complexas, filas/worker dedicados, ERP/pagamentos robustos, multi-tenant avançado ou regras que não cabem em Edge Functions. Se isso acontecer, o NestJS será uma API única e o acesso direto às tabelas será reduzido — nunca manter os dois modelos concorrentes.

---

## 4. Modelo de dados LMS alvo

As migrations SQL se tornarão a única fonte de verdade. O modelo atual será migrado de forma incremental, sem apagar histórico.

### Entidades essenciais

| Entidade | Campos/regras essenciais |
|---|---|
| `users` | `id` = Auth UID, nome, email, telefone, avatar, `role`, `status`, timestamps. Sem leitura pública de telefone/e-mail. |
| `profiles` | Dados privados do próprio utilizador. Dados públicos de docente ficam em estrutura/visão mínima própria. |
| `courses` | Professor responsável, estado draft/published/archived, metadados, thumbnail e datas. |
| `course_modules` | Curso, título, ordem. Pode migrar da tabela atual `modules` após padronização. |
| `lessons` | Curso/módulo, título, descrição, vídeo, ordem, `status`, `access_starts_at`, `access_ends_at`, meeting URL, criador. **Os dois horários são obrigatórios para aulas publicadas.** |
| `enrollments` | Aluno + curso únicos, estado `ACTIVE/COMPLETED/CANCELLED`, origem, datas e quem matriculou. |
| `lesson_progress` | Aluno + aula únicos; progresso em segundos, completada, última atividade. O `course_id` deve ser consistente/validado pelo banco. |
| `assignments` / `assignment_submissions` | Tarefas por curso/aula e submissões por aluno. |
| `certificates` | Aluno, curso, `storage_path` do PDF, nome do arquivo, hash/validação, emissor, emitido em, revogado em/motivo. |
| `academic_calendar_events` | Eventos institucionais, feriados, sessões e histórico de aulas. Aulas podem ser projetadas no calendário por view. |
| `notifications` | Eventos persistentes; preferências de notificação por utilizador. |
| `audit_logs` | Ator, ação, entidade, entidade ID, antes/depois sanitizado, data/IP quando disponível. Imutável para UI. |

### Regra de disponibilidade de aula

- `DRAFT`: apenas professor responsável/admin.
- `PUBLISHED` com futuro: aluno vê somente no calendário, como “disponível em …”; não acessa vídeo/material restrito.
- Janela atual (`access_starts_at <= now < access_ends_at`): aparece em **Minhas aulas** e o conteúdo pode ser aberto.
- Janela encerrada (`now >= access_ends_at`): some de **Minhas aulas**, fica no calendário/histórico com metadados. O produto deve decidir se o vídeo continua acessível na área “Histórico”; pelo requisito atual, o padrão será **não acessível no player após o fim**, salvo se o professor marcar uma exceção explícita.
- Nenhum filtro de interface será suficiente: a política/RPC de leitura deverá reforçar a matrícula e a janela de acesso ao conteúdo protegido.

### Certificado PDF

1. Professor/admin seleciona curso e aluno matriculado/elegível.
2. Faz upload de arquivo PDF pronto para bucket privado `certificates`.
3. Edge Function valida papel, matrícula, MIME (`application/pdf`), tamanho e cria o registro em transação.
4. Aluno recebe notificação e baixa por URL assinada curta; o caminho interno do storage não é público.
5. Página pública de validação só mostra dados mínimos (código, curso, data, validade), jamais URL pública permanente ou dados pessoais excessivos.
6. Revogação preserva histórico e bloqueia download/validação conforme a regra definida.

---

## 5. Segurança e autorização (primeira prioridade)

### Correções obrigatórias antes de novos recursos

1. Cadastro público cria **somente `ALUNO`**. Papel de professor/admin nunca vem de metadata do browser.
2. Remover `SELECT USING (true)` de `users` e `profiles`. Criar visões/queries mínimas para contatos autorizados.
3. Aluno não cria sua própria matrícula. Criação/remoção será limitada a professor do curso e admin, via RLS/RPC/Edge Function.
4. Professor só lê/edita cursos próprios, aulas desses cursos, matrículas desses cursos, progresso e submissões desses alunos.
5. Admin tem escopo global, por Edge Function para ações sensíveis: criar/remover/alterar papel, suspender, emitir/revogar certificado e configuração institucional.
6. Revisar todas as políticas `FOR ALL`, incluindo `WITH CHECK`; eliminar policies sobrepostas que se somam por OR.
7. Buckets de Storage serão privados por padrão. Avatares terão policy de upload somente no caminho do próprio utilizador; certificado/material terá URL assinada.
8. Implementar auditoria persistente para mutações sensíveis.

### Matriz de autorização a testar

| Ação | Aluno | Professor responsável | Admin |
|---|---:|---:|---:|
| Ler perfil privado de outro aluno | Não | Apenas aluno do seu curso e dados mínimos | Sim, quando necessário |
| Criar curso | Não | Sim | Sim |
| Criar/editar aula | Não | Só em curso próprio | Sim |
| Matricular aluno | Não | Só no curso próprio | Sim |
| Ler progresso | Só próprio | Só alunos de curso próprio | Sim |
| Emitir PDF de certificado | Não | Só aluno elegível de curso próprio | Sim |
| Alterar papel | Não | Não | Sim, por Edge Function |
| Baixar certificado | Só próprio por URL assinada | Só emitidos em curso próprio | Sim |

---

## 6. Acessibilidade — diagnóstico e padrão de correção

A aplicação precisa ser tratada como produto **WCAG 2.2 AA**. A análise estática encontrou aproximadamente 206 botões; apenas 32 usos de `aria-label` no código inteiro. Há muitos controles icônicos sem nome acessível e campos visuais sem associação programática a label.

### Problemas encontrados

- **AvatarUpload:** um `div` clicável abre o seletor de arquivo; não é navegável por teclado, não tem papel/nome acessível e o input oculto não está rotulado. Esse componente deve ser usado por aluno, professor e admin após correção.
- **ChatShell/ChatInput/ChatWindow:** botões de cancelar edição, enviar, rolar para baixo e ações de mensagem usam apenas ícones ou `title`; faltam `aria-label`, estados e anúncios de novas mensagens. A área de mensagens não está marcada como `role="log"`/região viva; auto-scroll pode deslocar o foco/leitura de usuários de leitor de tela.
- **Notificações:** requerem região viva (`aria-live="polite"`), foco controlado ao abrir/fechar e equivalentes textuais para status/contadores. Não basta animação/cor.
- **Formulários:** muitos labels não usam `htmlFor` + `id`, e inputs/selects não têm nome acessível alternativo. Placeholders não devem ser labels.
- **Modais:** precisam de `role="dialog"`, `aria-modal`, título associado, foco inicial, focus trap, Escape e retorno de foco ao gatilho.
- **Navegação/abas:** devem usar semântica `nav`, `main`, headings em ordem e, quando forem tabs, `role=tablist/tab/tabpanel`, setas e `aria-selected`.
- **Cor e contraste:** há textos muito pequenos (`text-3xs`, `text-4xs`, 7–10px) e cores neutras/douradas sobre fundos claros/escuros que precisam de medição. Informação como online, pendente ou bloqueado não pode depender apenas de cor/ícone.
- **Gráficos SVG:** gráficos decorativos precisam `aria-hidden`; gráficos de dados precisam título, descrição e tabela/resumo textual equivalente.
- **Motion:** respeitar `prefers-reduced-motion`; animações de splash, pulse/bounce e transições não podem ser obrigatórias.
- **Vídeo:** player deve suportar controles por teclado, legendas/captions, transcript/download quando aplicável, foco visível e mensagem clara de aula bloqueada.
- **Idioma e datas:** declarar `lang="pt-AO"`, usar `time`/datas localizadas e uma política consistente de timezone `Africa/Luanda`.

### Plano de acessibilidade por etapa

1. Fundamentos globais: `skip link`, foco visível, `lang`, landmarks, tokens de contraste/tamanho mínimo, reduced motion.
2. Form controls e modais: labels, erros associados (`aria-describedby`), foco e teclado.
3. Chat/notificações: log acessível, anúncio de eventos sem spam, botões nomeados, navegação de conversas por teclado.
4. Portais: sidebar/tabs, tabelas responsivas com cabeçalhos, estados vazios e loading acessíveis.
5. Vídeo/certificados: player e downloads com feedback completo.
6. Auditoria com Lighthouse, axe-core e testes manuais (teclado, NVDA/VoiceOver, zoom 200/400%).

---

## 7. Correção específica dos três portais

### 7.1 Aluno

**Estrutura final**

- Visão geral: próxima aula disponível, progresso por curso, pendências e notificações.
- Meus cursos: somente matrículas ativas, detalhes, progresso e instrutor.
- Minhas aulas: somente janela ativa; player protegido.
- Calendário letivo: futuras, em curso e históricas/encerradas.
- Progresso: por curso, módulo/aula, vídeo, tarefas e avaliações.
- Certificados: PDFs próprios emitidos, download seguro e status.
- Perfil: dados e avatar reutilizando `AvatarUpload` acessível.
- Mensagens: apenas contatos permitidos pela regra de curso/papel.

**Correções iniciais**

- Fazer o fetch de matrículas retornar curso e estado de forma tipada.
- Corrigir contagem de progresso por curso e remover métricas inventadas.
- Remover textos fixos de um único curso da home.
- Separar aula futura, ativa e encerrada conforme a regra acima.

### 7.2 Professor

**Estrutura final**

- Visão geral por cursos próprios: alunos ativos, aulas agendadas, progresso, tarefas pendentes e alertas.
- Meus cursos: criar/publicar/arquivar curso e abrir gestão específica.
- Curso detalhado: módulos, aulas, alunos matriculados, materiais, agenda, progresso e certificados.
- Criar aula: curso obrigatório, janela início/fim, vídeo/material, publicação e notificação.
- Alunos: sempre filtrados pelo curso selecionado; matricular/remover com confirmação e auditoria.
- Progresso: tabela por aluno/aula com filtros e exportação futura.
- Certificados: upload/emissão de PDF apenas para cursos próprios.
- Perfil: o mesmo componente de avatar do aluno, persistindo em `users.foto_perfil` e Storage.

**Correções iniciais**

- Substituir `useTeacherStudents()` global por `useCourseStudents(courseId)` e uma visão agregada de alunos de cursos próprios.
- Usar a mesma fonte de dados entre contador, seletor de aula e matrícula.
- Remover foto/nome/CV hard-coded e implementar persistência do perfil.
- Trocar gráfico placeholder por dados agregados ou mostrar “em desenvolvimento” fora do dashboard até haver a query correta.

### 7.3 Administração

**Estrutura final**

- Painel executivo com indicadores reais, intervalo de datas e links para ações.
- Utilizadores/papéis/status por Edge Function, com busca, paginação e auditoria.
- Gestão global de cursos, aulas, matrículas e calendário.
- Gestão de certificados PDF, revogação e validação.
- Comunicação e anúncios institucionais.
- Configurações institucionais com tabela/migration real.
- Auditoria persistente e relatórios.
- Perfil com avatar reutilizado, não fluxo duplicado.

**Correções iniciais**

- Dividir `AdminPortal.tsx` em containers por domínio.
- Remover status falsos de integrações; health checks somente se implementados server-side.
- Criar tabela `institution_settings` e `audit_logs` ou esconder essas funções até existirem.
- Trocar alertas nativos por toasts/modais acessíveis.

---

## 8. Plataformas recomendadas

| Necessidade | Recomendação | Justificativa |
|---|---|---|
| Front-end | **Vercel** | Deploy de Vite simples, domínio, HTTPS, preview por branch/PR, CDN e boa integração GitHub. |
| Auth, Postgres, RLS, Realtime | **Supabase** (plano que inclua backups/recursos de produção) | Já está integrado; reduz operação e permite consolidar o modelo atual. |
| PDFs, avatares e materiais | **Supabase Storage privado** | Policies por utilizador/curso e signed URLs. Certificados não devem ser públicos. |
| Vídeo | **Cloudflare Stream** ou **Mux** para produção | Transcodificação, streaming adaptativo, analytics e restrição por token. Supabase Storage serve para piloto/arquivos pequenos, mas não é uma plataforma completa de vídeo educacional. Manter Cloudinary somente se o contrato atual já cobrir streaming seguro e analytics necessários. |
| E-mails transacionais | Resend, Postmark ou Brevo | Convites, aviso de aula, certificado e recuperação de conta, disparados por Edge Function. |
| Monitoramento | Sentry + Vercel Analytics + logs Supabase | Erros de front-end, rastreabilidade e desempenho. |
| Qualidade | GitHub Actions + Playwright + Vitest + axe-core | Build, testes de autorização/fluxos e acessibilidade contínua. |

### Ambiente mínimo

- `development`: local, Supabase local ou projeto isolado.
- `staging`: banco/projeto Supabase separado, dados fictícios e Vercel preview/ambiente de homologação.
- `production`: projeto Supabase separado, domínio próprio, backups, RLS testada e segredos exclusivamente server-side.

---

## 9. Roteiro de implementação e commits

### Fase 0 — fundação e segurança (bloqueadora)

1. Criar baseline de build: tipos React, configuração Vite, TypeScript sem erros.
2. Configurar lint, formatação, testes e CI.
3. Consolidar inventário de schema e criar migrations faltantes de forma segura.
4. Corrigir self-signup, RLS de PII, matrículas e políticas sobrepostas.
5. Criar tipos de domínio para banco em vez de `any`.

**Critério de aceite:** aplicação compila; migrations sobem em banco vazio; aluno não eleva papel, não se matricula sozinho e não lê dados fora do escopo.

### Fase 1 — núcleo acadêmico

1. Padronizar `courses`, módulos, aulas, matrículas e progresso.
2. Implementar `access_starts_at`/`access_ends_at` e consultas de aulas futura/ativa/encerrada.
3. Reconstruir fluxo professor: curso → aula → matrícula → agenda.
4. Corrigir portal aluno para listar somente aulas disponíveis e calendário histórico.
5. Implementar progresso por curso e visão docente por aluno.

**Critério de aceite:** um professor cria curso, aula datada e matrícula; aluno certo vê somente a aula na janela; ao final ela migra da lista ativa para histórico; outro aluno não tem acesso.

### Fase 2 — certificados e perfis

1. Buckets privados, policies e Edge Function de upload/issue de PDF.
2. Substituir geração de certificado por upload de PDF pronto.
3. Validação pública mínima e downloads assinados.
4. Unificar avatar/perfil nos três papéis e persistência de bio/preferências.

**Critério de aceite:** professor/admin emite PDF para aluno elegível; aluno baixa apenas o próprio arquivo; professor/admin têm avatar funcional e acessível.

### Fase 3 — dashboards, mensagens e acessibilidade

1. Queries agregadas reais para KPIs e relatórios.
2. Refatorar AdminPortal/InstructorPortal em módulos e implementar paginação/loading/erro.
3. Corrigir chat, notificações e modais conforme WCAG.
4. Implementar calendário institucional e notificações de janelas de aula.

**Critério de aceite:** não há dashboard com número simulado apresentado como real; fluxos críticos passam em teclado e leitor de tela básico.

### Fase 4 — operação e escala

1. Vídeo com Mux/Cloudflare Stream se o volume justificar.
2. Observabilidade, backup/restore, Sentry, métricas e auditoria.
3. Testes E2E por papel, performance e revisão externa de segurança/acessibilidade.
4. Atualização final de README, guia de deploy e manual administrativo.

---

## 10. Ordem do primeiro conjunto de modificações

Ao iniciar a implementação, a primeira sequência será:

1. Corrigir toolchain para obter build/type-check verde.
2. Adicionar testes de base e CI para impedir regressões.
3. Criar migration de fundação que inventarie/complete as tabelas reais sem destruir dados existentes.
4. Corrigir RLS e o cadastro público antes de tocar em novas telas.
5. Reestruturar o fluxo curso → aula → matrícula → janela de acesso, começando pelas queries e serviços.

Nenhuma alteração de interface será considerada concluída sem validar: permissão por papel, estado de erro/carregamento, navegação por teclado, foco, contraste e comportamento em mobile.

---

## 11. Informações que serão necessárias antes do deploy de produção

A implementação pode começar localmente, mas para concluir funcionalidades reais serão necessárias:

- acesso administrativo ao projeto Supabase de **staging** (não compartilhar `service_role` em chat);
- confirmação de qual projeto Supabase contém os dados atuais e se migrations 001–004 já foram aplicadas;
- conta/organização Vercel e domínio desejado;
- decisão de fornecedor de vídeo e orçamento aproximado/volume de aulas;
- regras acadêmicas: duração padrão da janela da aula, se vídeo encerrado pode ser reaberto, elegibilidade de certificado e política de revogação;
- logotipo/modelos PDF de certificado e permissões de uso;
- contas de teste para aluno, professor e admin em staging.

---

## Conclusão

O caminho seguro não é reescrever tudo: é consolidar o sistema que já existe em **React/Vite + Supabase**, eliminar a arquitetura duplicada e construir o núcleo acadêmico com políticas de acesso reais. A primeira entrega funcional será o fluxo verificável de curso, matrícula e aula agendada. Sobre essa fundação, certificados PDF, dashboards reais, chat acessível e administração completa passarão a ser extensões sustentáveis, não telas desconectadas.
