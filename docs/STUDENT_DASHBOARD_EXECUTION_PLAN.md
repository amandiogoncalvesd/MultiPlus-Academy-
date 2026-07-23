# Plano de conclusão — Portal do aluno

## Objetivo

Converter o portal atual em uma experiência LMS completa e verificável: curso, aula na janela correta, calendário, progresso, tarefas, materiais, certificados privados, mensagens, perfil e acessibilidade.

## Diagnóstico atual

- `StudentPortal.tsx` ainda concentra player, calendário, perfil, exportação PDF e navegação.
- A home tinha curso/módulo/textos jurídicos hard-coded e calculava horas por aulas concluídas.
- Acesso de aula já usa janela de início/fim, mas calendário, player, materiais e tarefas precisam compartilhar o mesmo contrato de disponibilidade.
- Perfil ainda usa `alert()` e exportação de histórico tem conteúdo institucional fixo.
- Progresso possui componentes, mas gráficos semanais/módulos ainda inferem dados não presentes no banco.

## Fases de execução

### A. Home e dados reais — em execução

- Remover curso/módulo/hora simulados da home.
- Exibir curso selecionado, aulas concluídas, horas persistidas, certificados e próxima aula real.
- Corrigir objeto da próxima aula para usar `lesson`, não o wrapper da timeline.

### B. Aulas e calendário

- Extrair `StudentLessonsPage` e `StudentCalendarPage`.
- Separar aula futura, ativa e encerrada visualmente.
- Bloquear player/links fora da janela e informar hora de reabertura.
- Exportar ICS usando `access_ends_at` real.

### C. Progresso, materiais e tarefas

- Substituir gráficos inferidos por agregações reais por curso/módulo/aula.
- Filtrar materiais e tarefas pela janela/curso permitido.
- Melhorar submissão, estado pendente/corrigido e feedback.

### D. Perfil, certificados e comunicação

- Extrair página de perfil e substituir `alert()` por toast/diálogo.
- Certificado PDF privado com link temporário.
- Notificações unificadas, links de destino e preferência persistida.
- Mensagens responsivas com contatos autorizados por curso.

### E. Acessibilidade e validação

- Labels, foco, diálogo, teclado, zoom 200/400%, leitor de tela e axe-core.
- Testes de janela de aula, perfil, certificado, download e calendário.
- E2E aluno em staging usando credenciais isoladas.

## Critério de conclusão

O portal do aluno só será considerado concluído após todos os dados serem reais ou possuírem estado vazio explícito, sem texto de curso fixo, e após validação em staging com matrícula, aula futura/ativa/encerrada, certificado PDF e conta real de aluno.
