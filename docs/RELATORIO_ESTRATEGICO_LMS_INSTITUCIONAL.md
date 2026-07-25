# Relatório estratégico — MultiPlus Academy como LMS institucional

**Data:** 23 de julho de 2026  
**Objetivo:** definir as implementações necessárias para a MultiPlus Academy evoluir de uma boa base de LMS para uma plataforma acadêmica institucional comparável, em escopo e governança, às experiências de grandes universidades que usam Canvas, Moodle e integrações de sistema acadêmico.

> Comparável não significa copiar Harvard ou Canvas. Harvard usa Canvas como sistema oficial de gestão de cursos, complementado por ferramentas e processos institucionais próprios. A meta correta para a MultiPlus é adotar os princípios que tornam um LMS institucional confiável: catálogo, curso estruturado, matrícula governada, aprendizagem, avaliação, gradebook, comunicação, registros, integrações, suporte e governança.

---

## 1. Referências de mercado e o que elas demonstram

### Harvard / Canvas

A Harvard Graduate School of Design identifica Canvas como o sistema oficial de gestão de cursos, recomenda curso publicado com página inicial e informações consistentes para ajudar alunos na escolha de cursos, e trata acessibilidade como parte do ambiente digital. A Harvard também usa Canvas para necessidades educacionais e administrativas, podendo complementar armazenamento/colaboração com ferramentas integradas.

- [Harvard GSD — Canvas](https://www.gsd.harvard.edu/resources/canvas/)
- [Harvard HUIT — Canvas](https://www.huit.harvard.edu/canvas)
- [Harvard FAS — Canvas course websites](https://atg.fas.harvard.edu/canvas)

**Aprendizado para MultiPlus:** um curso não é apenas uma coleção de vídeos. Ele precisa ter uma página inicial, ementa, docente, calendário, materiais, comunicação, avaliação, estado de publicação e política de acesso.

### Moodle

Moodle reúne matrícula, planos de aprendizagem, gradebook, competências, calendário, mensagens, notificações, avaliações, badges, certificados e relatórios. Sua documentação destaca conclusão de atividades, cursos passados/atuais/futuros e progresso individual.

- [Moodle LMS features](https://moodle.com/us/products/lms/features/)
- [Moodle core features](https://docs.moodle.org/502/en/Features)
- [Moodle progress tracking](https://docs.moodle.org/dev/Progress_tracking)

**Aprendizado para MultiPlus:** progresso deve ter critérios verificáveis; o aluno deve enxergar o que está concluído, em andamento e futuro; docentes e administradores precisam de agregações e alertas confiáveis.

### Canvas / Instructure

Canvas organiza cursos por módulos, tarefas, quizzes, rubricas, agenda, gradebook, feedback, analytics e integrações. Seu modelo de avaliação avançado (SpeedGrader) centraliza submissões, rubricas, comentários e notas. Canvas também enfatiza notificações, acesso mobile/offline e inclusão.

- [Canvas Higher Education](https://instructure.com/product/canvas/higher-education/lms)
- [Canvas mobile app](https://apps.apple.com/us/app/canvas-by-instructure/id480883488)
- [Canvas feature options](https://community.canvaslms.com/en/kb/articles/531316-canvas-feature-option-summary)

**Aprendizado para MultiPlus:** correção precisa ser um fluxo próprio e produtivo, com rubrica, arquivo privado, feedback, status, deadline, atraso, devolução e nota refletida no gradebook.

### Interoperabilidade educacional

1EdTech define padrões para integrar ambientes acadêmicos: LTI para ferramentas externas, OneRoster para pessoas/cursos/matrículas/notas, QTI para questões/testes/resultados, CASE para competências e Open Badges para credenciais portáveis.

- [1EdTech standards](https://www.1edtech.org/standards/details)
- [1EdTech integrated assessment](https://www.1edtech.org/workstream/assessment)
- [LTI Advantage](https://www.imsglobal.org/lti-advantage-overview)
- [QTI 3.0 overview](https://www.imsglobal.org/spec/qti/v3p0/oview)

**Aprendizado para MultiPlus:** não é necessário implementar todos os padrões agora, mas o modelo de dados e a API devem deixar espaço para identificadores institucionais, importação/exportação, ferramenta externa e grade passback.

### Privacidade e registros acadêmicos

FERPA é referência norte-americana para registros acadêmicos: direito de acesso, retificação e controle sobre divulgação de dados identificáveis. Mesmo sendo uma lei americana, o princípio é universalmente relevante: acesso por interesse acadêmico legítimo, consentimento, registro de ações e minimização de dados.

- [FERPA / Higher education privacy](https://www.newamerica.org/insights/privacy-considerations-higher-education-online-learning/applicable-laws/)
- [Congressional FERPA overview](https://www.congress.gov/crs-product/R46799)

**Aprendizado para MultiPlus:** notas, progresso, feedback, documentos, certificações, presença e dados pessoais exigem retenção, auditoria, acesso mínimo e política de exportação/correção.

---

## 2. Estado atual da MultiPlus Academy

### Já construído

- três perfis: aluno, professor e administrador;
- Supabase Auth, PostgreSQL, RLS, Storage, Realtime e Edge Functions;
- cursos, aulas, matrículas e janelas de acesso;
- progresso de aula/vídeo, quizzes, tarefas e submissões;
- certificados PDF privados e validação pública mínima;
- chat, notificações, calendário e dashboards por perfil;
- PWA inicial, service worker e modo imersivo solicitado pelo usuário;
- design system em evolução, shells autenticados e testes básicos.

### Lacunas institucionais principais

- não há gradebook consolidado;
- não há rubricas de avaliação;
- não há conceitos de período/semestre/turma/seção formal;
- não há frequência/presença acadêmica confiável;
- não há política de atraso, tentativa, retake ou acomodação;
- não há catálogo acadêmico institucional completo;
- não há ementa/syllabus estruturado;
- não há trilha/competência/outcome;
- não há grupos, fóruns, discussões ou colaboração de turma;
- não há onboarding institucional e checklist de configuração do curso;
- não há importação/exportação acadêmica governada;
- não há calendário institucional com feriados, termos e eventos;
- não há SIS/OneRoster/LTI/QTI;
- não há política formal de retenção, consentimento e solicitação de dados;
- não há observabilidade acadêmica, alerta de risco ou intervenção;
- parte do frontend ainda contém textos, funções e documentação legados.

---

## 3. Configurações institucionais novas — Administrador

### A. Estrutura acadêmica

Criar configurações para:

```text
Ano acadêmico
Período/semestre/trimestre
Campus/localidade
Programa
Departamento
Área de conhecimento
Curso
Turma/seção
Modalidade
Calendário acadêmico
Feriados
Datas de matrícula
Datas de publicação
Datas de encerramento
```

**Modelo recomendado:** `academic_terms`, `programs`, `departments`, `course_sections`, `academic_calendar_events`.

### B. Gestão de pessoas e papéis

Adicionar:

```text
Convite de usuário
Importação CSV de usuários
Identificador institucional
Matrícula acadêmica do aluno
Docente titular e co-docentes
Assistente/monitor
Convidado
Status de vínculo
Histórico de papel
Desativação com motivo
Sessões e dispositivos
MFA/2FA institucional
```

### C. Matrícula e turma

Adicionar:

```text
Lista de espera
Matrícula aprovada/pendente/cancelada/concluída
Data de início/fim do vínculo
Importação em lote
Matrícula por turma/seção
Transferência de turma
Histórico de matrícula
Política de autoinscrição opcional
Pré-requisitos de matrícula
```

### D. Curso e conteúdo

Adicionar:

```text
Template de curso
Duplicação de curso
Blueprint curricular
Syllabus/ementa estruturada
Objetivos de aprendizagem
Módulos e unidades
Prérequisitos entre módulos
Política de liberação condicional
Pacing por turma
Versão/publicação de conteúdo
Checklist de publicação
Página inicial do curso
```

### E. Avaliação e gradebook

Adicionar:

```text
Gradebook por curso
Categorias e pesos
Escalas de nota
Nota final automática/manual
Rubricas reutilizáveis
Anotações em PDF/documentos
Feedback por texto, áudio e vídeo
Política de atraso
Tentativas e reenvio
Ocultação/publicação de notas
Exportação CSV/XLSX
Histórico de alteração de notas
```

### F. Governança e compliance

Adicionar:

```text
Audit log imutável
Política de retenção de arquivos e registros
Consentimento de privacidade
Exportação de dados do titular
Solicitação de retificação
Consentimento de publicação de diretório
Classificação de dados
Política de backup/restore
Registro de incidentes
```

### G. Integrações

Adicionar configurações para:

```text
Google Meet / Zoom
Google Calendar / Microsoft 365
E-mail transacional
SMS / WhatsApp Business
Provedor de vídeo
Antiplágio
Proctoring
Google Drive / OneDrive
LTI 1.3 / LTI Advantage
OneRoster CSV/REST
Importação SCORM/cmi5
QTI question bank
Webhooks
API keys por integração
```

---

## 4. Novas configurações e experiências — Aluno

### Dashboard pessoal

O dashboard deve apresentar:

```text
Próxima ação
Aula disponível agora
Próxima aula
Tarefas com prazo
Status de notas
Progresso por curso/módulo
Mensagens não lidas
Avisos de turma
Calendário pessoal
Credenciais/certificados
Atividade recente
```

### Minha jornada acadêmica

Adicionar:

```text
Cursos atuais, futuros e concluídos
Plano de aprendizagem
Pré-requisitos
Competências adquiridas
Metas pessoais
Progresso por unidade
Previsão de conclusão
Status de risco (somente se dados confiáveis)
Histórico de notas
Simulador de nota final (what-if grade)
```

### Aulas e conteúdo

Adicionar:

```text
Legenda e transcrição
Velocidade e marcadores de vídeo
Retomada de vídeo
Downloads autorizados/offline
Notas vinculadas a timestamp
Checklist de conclusão
Material por aula
Acessibilidade de conteúdo
Disponibilidade futura/ativa/encerrada clara
```

### Tarefas e avaliações

Adicionar:

```text
Rubrica visível antes da submissão
Checklist de submissão
Confirmação e recibo de entrega
Histórico de tentativas
Status: rascunho, enviado, atrasado, devolvido, corrigido
Feedback detalhado
Anotações em arquivo
Reenvio quando permitido
Data/hora institucional de deadline
```

### Comunicação e suporte

Adicionar:

```text
Central de avisos com links
Preferências de notificação
Digest por e-mail
Mensagens por curso
Discussões de turma
Perguntas frequentes e suporte
Solicitação de ajuda
Status de mensagens
```

### Perfil e privacidade

Adicionar:

```text
Preferências de acessibilidade
Idioma
Fuso horário
Notificações por canal
Consentimentos
Exportar meus dados
Solicitar correção de dados
Preferência de diretório público
```

---

## 5. Novas configurações e experiências — Professor

### Workspace docente

O professor precisa de:

```text
Resumo do dia
Aulas próximas
Turmas
Correções pendentes
Mensagens não respondidas
Alertas acadêmicos
Agenda
Atividade recente
```

### Gestão de curso

Adicionar:

```text
Homepage do curso
Syllabus estruturado
Módulos, pré-requisitos e regras de liberação
Duplicar aula/módulo
Bulk publish/unpublish
Preview como aluno
Checklist de publicação
Co-docentes e monitores
Grupos de trabalho
Materiais privados por aula
```

### Turmas e alunos

Adicionar:

```text
Visão por turma/seção
Matrícula e transferência
Presença
Progresso individual
Alunos em risco com regra explícita
Notas e histórico
Mensagem para grupo filtrado
Acomodações pedagógicas
Observações privadas do docente
```

### Avaliação profissional

Adicionar:

```text
Fila de correção
Rubricas
Correção em navegador
Comentários em arquivo
Feedback áudio/vídeo
Nota automática/manual
Revisão cega opcional
Peer review opcional
Gradebook
Publicar/devolver notas
Analytics de questão/quiz
Banco de questões
```

### Agenda e comunicação

Adicionar:

```text
Agenda por turma
Disponibilidade do docente
Reagendar/cancelar aula
Notificar turma
Link de reunião e gravação
Eventos de calendário
Anúncios por curso
Discussões
Mensagens restritas a alunos vinculados
```

---

## 6. Novas configurações de interface e design

### Sistema visual

Consolidar tokens para:

```text
--surface-canvas
--surface-panel
--surface-raised
--surface-inverse
--text-primary
--text-secondary
--text-muted
--border-subtle
--border-strong
--accent-action
--state-success
--state-warning
--state-danger
--state-info
--radius-sm
--radius-md
--radius-lg
--radius-xl
--space-1 até --space-8
--shadow-sm / md / lg
```

### Componentes compartilhados necessários

```text
PortalShell
PortalSidebar
PortalTopbar
PageHeader
ContextualActionCard
MetricRow
DataTable
FilterBar
EmptyState
LoadingSkeleton
ErrorState
ConfirmDialog
StatusBadge
Avatar
NotificationCenter
CourseCard
ProgressBar
CalendarEvent
```

### Regras visuais

```text
Uma ação primária por tela
No máximo 4–6 métricas acima da dobra
Tabela/lista para registros, não cards gigantes
Cards somente para agrupamento funcional
Status com texto + ícone + cor
Avatar circular sem moldura visual
Elementos mobile mais compactos
Sem números billboard em telas pequenas
Movimento 150–300ms e reduced motion
```

---

## 7. Roadmap por prioridade

### P0 — Fundamento institucional (próximos ciclos)

1. Resolver divergência de histórico de migrations remoto/local.
2. Introduzir `academic_terms`, `course_sections`, calendário institucional e matrícula por seção.
3. Construir Gradebook e rubricas.
4. Completar fluxo privado de materiais/submissões/certificados.
5. E2E/RLS com contas de staging aluno/professor/admin.
6. Consolidar design system e navegação mobile.

### P1 — Ensino e acompanhamento

1. Syllabus, objetivos e checklist de publicação.
2. Pré-requisitos, pacing e regras de liberação condicional.
3. Fila de correção e feedback detalhado.
4. Presença e agenda por turma.
5. Discussões/anúncios por curso.
6. Alertas de risco baseados em regras documentadas.

### P2 — Institucional e integração

1. Importação de usuários/matrículas CSV.
2. API pública/documentada e webhooks.
3. LTI 1.3/LTI Advantage para ferramentas externas.
4. OneRoster para SIS/roster/grades.
5. QTI para banco de questões.
6. Open Badges e competências.

### P3 — Escala e diferenciação

1. PWA offline seletiva por curso.
2. Notificações push e e-mail digest.
3. Analytics de retenção e intervenção pedagógica.
4. Multi-idioma, fuso horário e acessibilidade avançada.
5. Integrações de vídeo, antiplágio e proctoring.

---

## 8. Critério de maturidade

A MultiPlus pode se apresentar como LMS institucional de produção quando conseguir demonstrar, em staging e produção:

```text
Curso publicado com syllabus e calendário
Matrícula por turma governada
Aula disponibilizada por regra acadêmica
Tarefa com rubrica, submissão privada e feedback
Gradebook e nota final auditáveis
Certificado privado verificável
Comunicação por curso
Relatórios por aluno/turma/curso
Auditoria, backup e política de dados
Acessibilidade WCAG 2.2 AA como meta operacional
Integrações/documentação para evolução futura
```
