# Segurança e RBAC acadêmico

A migration `006_security_rbac_and_lesson_access.sql` substitui regras permissivas herdadas por regras vinculadas ao curso, à matrícula e ao papel do utilizador.

## Cadastro público

- O cliente não envia mais um papel no `signUp`.
- `public.handle_new_user()` sempre cria a linha em `public.users` com `role = 'ALUNO'` e `status = 'ACTIVE'`.
- Um trigger impede que utilizadores não-admin alterem o próprio `role` ou `status` diretamente.
- Contas de professor e administrador devem ser provisionadas pelo fluxo administrativo autorizado.

## Visibilidade de utilizadores

| Quem consulta | Dados de utilizador permitidos |
|---|---|
| Aluno | A própria conta e professores dos cursos em que possui matrícula ativa. |
| Professor | A própria conta e alunos matriculados em cursos atribuídos a ele. |
| Admin | Escopo global administrativo. |

`profiles` deixa de ter leitura pública: somente o titular e o administrador podem consultar dados privados do perfil.

## Cursos e matrículas

- Catálogo: cursos com `status = PUBLISHED` podem ser lidos publicamente.
- Professor: cria e gere apenas cursos cujo `teacher_id` é o próprio UID.
- Aluno: vê cursos em que está matriculado.
- Matrícula: aluno apenas lê a própria; inserir, editar e remover exige professor responsável pelo curso ou admin.
- A lista de candidatos para matrícula não consulta `users` diretamente: usa a RPC autorizada `get_enrollment_candidates(course_id)`.

## Aulas e progresso

Aula recebeu os campos:

- `access_starts_at`;
- `access_ends_at`;
- `allow_replay_after_end`.

A constraint garante que o fim seja posterior ao início quando ambos forem definidos. A migration preserva agendas antigas copiando `scheduled_at` para `access_starts_at`.

A implementação de UI/queries seguinte deve separar:

1. calendário futuro;
2. aulas atualmente disponíveis;
3. histórico após `access_ends_at`.

Professor/admin só podem gerir módulos, aulas, materiais, tarefas, submissões, certificados e progresso no escopo dos seus cursos. Aluno só vê/atualiza dados próprios ligados a uma matrícula ativa.

## Comunicação e certificado

- Mensagens professor → aluno exigem que exista relação professor-curso-matrícula.
- Mensagens aluno → professor exigem a mesma relação.
- Admin mantém escopo institucional.
- A validação pública de certificado não lê tabelas de certificado/utilizador diretamente. Ela usa a RPC `verify_certificate_public(code)`, que retorna somente código, data, nota, nome do titular e curso de certificados não revogados.

## Verificação necessária em staging

Depois da aplicação da migration pelo agente Supabase, testar com três contas reais de staging:

1. aluno não consegue selecionar `role=PROFESSOR`, auto-matricular-se ou consultar perfil de outro aluno;
2. professor A não lista, não altera nem vê progresso de alunos do professor B;
3. admin consegue gerir os três escopos;
4. catálogo público continua listando cursos publicados;
5. validação pública de certificado funciona por RPC;
6. professor consegue abrir o seletor de candidatos e matricular aluno no próprio curso.
