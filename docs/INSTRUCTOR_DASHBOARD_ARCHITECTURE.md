# Arquitetura e mapa de refatoração — Portal do Professor

## Objetivo

O portal docente deve funcionar como o espaço de execução acadêmica do professor: administrar apenas cursos atribuídos, planejar aulas, matricular alunos, acompanhar progresso individual, corrigir entregas, emitir certificados PDF autorizados, comunicar-se com alunos vinculados e manter o próprio perfil.

A autorização de curso/matrícula já existe em RLS/RPC. Esta etapa organiza a interface e os serviços para refletirem essa regra sem dados globais, placeholders ou conteúdo de um professor específico.

---

## 1. Mapa atual da arquitetura

```text
InstructorPortal.tsx
  ├── Sidebar/topbar próprios e estado de navegação
  ├── loadDatabase() — cursos, alunos, matrículas, certificados, aulas, notificações
  ├── InstructorDashboardTab
  ├── InstructorCoursesTab
  │     └── CourseEditorModal
  │           └── StudentSelector / enrollmentService
  ├── InstructorStudentsTab
  ├── InstructorEvaluationsTab
  ├── InstructorCalendarTab
  ├── InstructorProgressTab
  ├── InstructorMessagesTab
  └── CertificateIssueModal
```

### Estado atual dos componentes

| Componente | Responsabilidade atual | Problema observado |
|---|---|---|
| `InstructorPortal.tsx` | Shell, dados, realtime, curso, perfil, certificados, configurações e várias telas. | Ainda concentra dados e layout; tem estados e conteúdo legados hard-coded. |
| `InstructorDashboardTab.tsx` | KPIs e alertas. | Gráfico é placeholder e há nomes/textos fixos. |
| `InstructorCoursesTab.tsx` | Cursos, matrículas e edição. | Boa base, mas contagens fazem múltiplas consultas e precisam de contexto por curso. |
| `CourseEditorModal.tsx` | Curso, aulas, janela e alunos alvo. | É o núcleo correto, mas precisa ser transformado em página/fluxo por curso e ter diálogos acessíveis. |
| `InstructorStudentsTab.tsx` | Diretório e métricas. | Mistura estado do usuário com matrícula; usa consultas agregadas e campos fictícios. |
| `InstructorProgressTab.tsx` | Detalhe por aluno/aula. | É o componente mais alinhado ao novo RPC `get_course_lesson_progress`. |
| `InstructorEvaluationsTab.tsx` | Criar/corrigir tarefas. | Precisa de download privado da submissão e fluxo de feedback final. |
| `InstructorCalendarTab.tsx` | Agendamento. | Já usa janela início/fim, mas deve remover restos do modelo por aluno individual. |
| `InstructorMessagesTab.tsx` | Mural/chat. | Mural funciona; chat usa página compartilhada. Precisa de destinatários limitados por curso. |

---

## 2. Conexão com os três dashboards

### Administração → Professor

- Admin cria professor via `admin-users`.
- Admin atribui ou reatribui `courses.teacher_id`.
- Professor só recebe cursos em que `teacher_id = auth.uid()`.
- Admin mantém visão global, certificados e auditoria.

### Professor → Aluno

- Professor cria curso e aulas do curso.
- Professor matricula aluno usando RPC de candidatos autorizados.
- Professor define janela `access_starts_at/access_ends_at`.
- Aluno recebe aula apenas na janela ativa; futuro e histórico aparecem no calendário.
- Professor visualiza progresso por aluno/aula via `get_course_lesson_progress`.
- Professor cria tarefa, corrige submissão e registra nota/feedback.
- Professor emite PDF de certificado para aluno matriculado.

### Aluno → Professor

- Progresso de vídeo, conclusão, quiz, notas e submissão alimentam relatórios docentes.
- Mensagens obedecem a relação professor → curso → matrícula.
- Notificações de matrícula, aula, tarefa e certificado devem possuir links de contexto para as duas partes.

---

## 3. Regras funcionais do professor

| Recurso | Professor pode | Professor não pode |
|---|---|---|
| Curso | Criar, editar, publicar e arquivar curso próprio. | Alterar curso de outro docente. |
| Aula | Criar, agendar, reagendar e encerrar aula do curso próprio. | Expor aula a aluno sem matrícula. |
| Matrícula | Matricular/remover aluno em curso próprio. | Gerir matrícula de curso alheio. |
| Progresso | Ver conclusão e vídeo por aluno/aula de curso próprio. | Ver progresso de aluno de outro curso. |
| Tarefa | Criar, fechar, corrigir e comentar tarefa própria. | Corrigir tarefa de outro professor. |
| Arquivo do aluno | Gerar URL assinada para submissão vinculada ao curso. | Baixar URL pública/permanente fora do escopo. |
| Certificado | Enviar PDF para aluno elegível no curso próprio. | Emitir para aluno não matriculado ou curso alheio. |
| Mensagens | Conversar com alunos matriculados nos seus cursos. | Iniciar contato fora da relação acadêmica. |

---

## 4. Design system docente

**Nome visual:** `Academic Studio`.

- Shell compartilhado com Admin/Aluno, mas com foco em execução de turma.
- Ação principal sempre visível: `Criar curso` ou `Agendar aula`.
- Visão geral: até seis métricas reais e fila de ações pendentes.
- Curso detalhe: cabeçalho, status, alunos, aulas, calendário, progresso, tarefas, certificados.
- Tabelas: desktop em tabela; mobile em cards.
- Nenhum gráfico é mostrado sem uma query/descrição de dados real.
- Perfil usa `AvatarUpload` compartilhado, nunca imagem fixa.

---

## 5. Fases de execução

### A. Shell, perfil e dados docentes

1. Extrair `InstructorShell`, sidebar, topbar, `InstructorProfilePage`, `TeacherNotificationCenter`.
2. Substituir imagem/nome/CV hard-coded por usuário autenticado e `AvatarUpload`.
3. Usar somente cursos e alunos retornados pelo escopo docente.
4. Remover ações diretas de status de aluno; status/matrícula deve ser operação de curso autorizada.

### B. Curso e calendário

1. Extrair `TeacherCourseWorkspace` com tabs: aulas, alunos, agenda, materiais e progresso.
2. Consolidar curso → aluno → aula → janela de acesso.
3. Calendário mostra futuras, ativas, encerradas e canceladas por curso.
4. Materiais privados são enviados para `course-materials` por Edge Function autorizada.

### C. Alunos, progresso e avaliações

1. `TeacherStudentsPage` agrupada por curso, sem diretório global.
2. `TeacherProgressPage` usa RPC por aluno/aula e filtros por curso.
3. Correção baixa arquivo privado por URL assinada e grava feedback/nota real.
4. Notificação de feedback aponta para a tarefa do aluno.

### D. Certificados, mensagens e validação

1. Professor usa `certificate-files` apenas para curso próprio.
2. Mensagens/mural obedecem ao escopo de curso.
3. Dialogs acessíveis, labels e teclas Escape.
4. Playwright com `E2E_TEACHER_EMAIL`/`E2E_TEACHER_PASSWORD` em staging.

---

## 6. Critério de conclusão

O dashboard do professor estará pronto quando um professor real puder criar curso, matricular aluno, criar/agendar aula, acompanhar a aula no calendário do aluno, corrigir tarefa privada, visualizar progresso por aula e emitir certificado PDF — sem acessar informação de outro professor.
