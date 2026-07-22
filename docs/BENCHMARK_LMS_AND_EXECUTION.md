# Benchmark LMS, mensagens e plano de execução contínua

**Data:** 22 de julho de 2026  
**Método:** benchmark de práticas publicadas por LMS maduros, requisitos de acessibilidade e segurança, confrontados com a implementação atual MultiPlus Academy.

## 1. Evidência externa usada

| Tema | Evidência | Decisão para MultiPlus |
|---|---|---|
| Liberação condicional de conteúdo | Canvas usa requisitos, pré-requisitos e bloqueio por data/hora para orientar o percurso e controlar acesso a módulos/aulas. [Canvas/CTLD](https://ready.msudenver.edu/canvas-spotlight/prerequisites-requirements-and-locking-in-canvas-modules/) | `access_starts_at` e `access_ends_at` são a regra de disponibilidade de aula; UI separa futuro, ativo e histórico. Próxima iteração adiciona pré-requisitos por módulo. |
| Conclusão mensurável | Moodle permite conclusão automática ou manual e recomenda orientar a próxima atividade/usar liberação condicional. [Moodle activity completion](https://moodledev.io/docs/4.5/apis/core/activitycompletion) e [UCL Moodle guide](https://ucldata.atlassian.net/wiki/spaces/MoodleResourceCentre/pages/31863860/M34+-+Activity+completion) | `lesson_progress` é a fonte de conclusão e vídeo; relatório docente é por aluno/aula. Próxima etapa adiciona critérios de conclusão configuráveis. |
| Eventos e notificações acadêmicas | Moodle oferece notificações para matrícula, mudanças de conteúdo, feedback, conclusão e eventos administrativos. [Moodle notifications](https://docs.moodle.org/502/en/Notifications) | Notificações passam a ser tratadas como eventos persistentes e não apenas badges. Prioridade: preferências, links de destino, leitura individual e e-mail transacional. |
| Acessibilidade móvel | WCAG 2.2 acrescenta foco não oculto, alvos de ao menos 24×24 CSS px, alternativa a drag, ajuda consistente e autenticação acessível. [AccessibleEU/WCAG 2.2](https://accessible-eu-centre.ec.europa.eu/content-corner/news/wcag-22-officially-w3c-recommendation-2023-10-06_en) | Shells de dashboard usam viewport dinâmica/min-height zero; chat não oculta compositor; próximos componentes devem atender teclado, foco, diálogo e label explícitos. |
| Segurança e autorização | OWASP ASVS recomenda autorização na camada confiável, menor privilégio, proteção de atributos de papel e falha segura. [OWASP ASVS access control](https://github.com/OWASP/ASVS/blob/master/4.0/en/0x12-V4-Access-Control.md) | RLS/RPC por curso e matrícula é a autoridade; nenhuma tela cliente é tratada como controle de segurança. |

## 2. Mapa da aplicação e diagnóstico por domínio

### Plataforma pública

| Área | Estado atual | Ação planejada |
|---|---|---|
| Home, sobre, cursos, docentes, blog, contato | Componentes ricos visualmente, mas muito conteúdo estático e alguns formulários têm semântica incompleta. | Separar conteúdo institucional de dados LMS, revisar SEO, formulários, imagem/alt e acessibilidade. |
| Login/registro | Registro público já é limitado a aluno. | Adicionar confirmação de e-mail, recuperação com redirect URL, mensagens acessíveis e proteção contra abuso configurada no Supabase. |
| Verificação de certificado | RPC pública mínima já substitui leitura direta de dados privados. | Concluir emissão por PDF privado e revogação/validação visual. |

### Núcleo LMS

| Área | Estado atual | Ação planejada |
|---|---|---|
| Cursos e matrícula | RLS vinculada a curso e professor; seletor de candidatos usa RPC. | Paginação, busca, matrícula em lote transacional, histórico de matrícula e auditoria. |
| Aulas e agenda | Janelas de início/fim já definem aula futura/ativa/encerrada. | Criar pré-requisito, reabertura, cancelamento, fuso `Africa/Luanda` persistido e calendário mensal real. |
| Progresso | Conclusão/vídeo e RPC por aluno/aula implementados. | Indicadores por módulo, critérios configuráveis, exportação e alertas de risco. |
| Materiais e vídeo | URLs atuais são compatíveis com mídia pública. | Migrar mídia protegida para bucket privado/URLs assinadas ou streaming tokenizado. |
| Certificados | Esquema/revogação e RPC de validação existem. | Trocar emissão atual por Edge Function de upload PDF privado; remover geração cliente. |

### Três dashboards

| Portal | Estado atual | Próxima modernização |
|---|---|---|
| Aluno | Mais completo; agora separa aulas disponíveis e calendário/histórico. | Reduzir textos hard-coded, tornar cards dependentes de curso, progresso por módulo e notificações acionáveis. |
| Professor | Cursos, aulas, matrículas e relatório de progresso existem. | Dividir componente monolítico, substituir dados globais por escopo de curso e tornar perfil/avatar persistente. |
| Admin | Gestão inicial de usuários/cursos/certificados; ainda possui dados fixos e componente de grande porte. | Extrair páginas, migrar operações sensíveis para Edge Functions, auditoria persistente e métricas reais/paginadas. |

### Comunicação e notificações

| Área | Estado atual | Próxima modernização |
|---|---|---|
| Chat | Layout WhatsApp/Telegram responsivo, compositor fixo e scroll seguro implementados. | Anexos privados, paginação de mensagens anteriores, estados de falha/retry, modal com foco e testes E2E. |
| Notificações | Drawer responsivo no aluno/professor e tabela persistente existentes. | Componente compartilhado para os três portais, links de ação, preferências por canal e agrupamento por evento. |
| Toasts | Base global existente. | Nesta execução: tornar região viva e responsiva; depois adicionar fila/ações opcionais. |

## 3. Roadmap executável e ordem obrigatória

### Ciclo A — confiabilidade e segurança de dados

1. Aplicar migrations 005–007 em staging pelo agente autorizado e executar testes de papel com três contas.
2. Criar testes de integração RLS/RPC: aluno, professor de curso A, professor de curso B e administrador.
3. Migrar certificados PDF, anexos de tarefa e materiais sensíveis para Storage privado/Edge Function.
4. Criar trilha `audit_logs` para mutações administrativas e regras de retenção.

### Ciclo B — fluxo acadêmico completo

1. Curso → matrícula em lote → aula → janela → calendário → histórico. **Entregue na primeira versão.**
2. Pré-requisitos, ordenação de módulo e critérios de conclusão.
3. Agenda institucional, cancelamento, reabertura e disponibilidade de replay.
4. Dashboard de aluno por curso/módulo e alertas de risco docente.

### Ciclo C — experiência e acessibilidade

1. Chat mobile/desktop e notificações responsivas. **Entregue nesta iteração.**
2. Toasts, diálogos, upload de avatar, seleção de alunos e certificado: foco, teclado, labels e leitor de tela.
3. Auditoria axe-core, zoom 200/400%, teclado e VoiceOver/NVDA em staging.
4. Design tokens e componentes compartilhados para remover divergência entre os três dashboards.

### Ciclo D — escala e operação

1. React Router/TanStack Query; URLs estáveis, cache e loading/error por domínio.
2. CI com Playwright para fluxos aluno/professor/admin e migração de testes de RLS.
3. Sentry, analytics, health checks reais e gestão de backup/restore.
4. Avaliação de Mux/Cloudflare Stream conforme volume real de vídeo.

## 4. Definição honesta de "concluído"

A aplicação só pode ser considerada pronta para produção depois de:

- migrations aplicadas e verificadas em staging;
- testes reais de RLS por papel;
- teste E2E dos fluxos de matrícula, janela de aula, chat e certificado;
- auditoria manual de acessibilidade;
- upload PDF privado e vídeo protegido;
- aprovação funcional da instituição.

Não é tecnicamente responsável declarar 100% concluído antes dessas verificações externas. O repositório será evoluído em commits pequenos, testados e publicados, sem depender de confirmação para tarefas de código que estejam dentro deste roadmap.
