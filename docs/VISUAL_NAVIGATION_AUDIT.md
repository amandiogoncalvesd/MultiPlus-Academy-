# Auditoria visual e de navegação — MultiPlus Academy

## Contextos reais de navegação

```text
PUBLIC
  Navbar.tsx
  ├── Início
  ├── Cursos
  ├── Formadores
  ├── Sobre
  ├── Contactos
  ├── WhatsApp
  ├── Inscrição
  └── Portal / perfil autenticado

AUTHENTICATED — STUDENT
  StudentSidebar.tsx + StudentTopbar.tsx
  ├── Dashboard
  ├── Videoaulas
  ├── Calendário
  ├── Manuais
  ├── Tarefas
  ├── Mensagens
  ├── Certificados
  ├── Progresso
  ├── Avisos
  ├── Perfil
  └── Ajustes

AUTHENTICATED — TEACHER
  InstructorSidebar.tsx + InstructorTopbar.tsx
  ├── Visão geral
  ├── Meus cursos
  ├── Criar curso
  ├── Meus alunos
  ├── Avaliações
  ├── Agenda
  ├── Certificados
  ├── Progresso
  ├── Mensagens
  ├── Perfil
  └── Configurações

AUTHENTICATED — ADMIN
  AdminSidebar.tsx + AdminTopbar.tsx
  ├── Visão geral
  ├── Pessoas
  ├── Cursos
  ├── Certificados
  ├── Mensagens
  ├── Avisos
  ├── Histórico
  ├── Integrações
  ├── Configurações
  └── Perfil
```

## Diagnóstico visual

### Público

A barra pública é compacta e funcional, mas precisa manter a mesma linguagem de estado, foco e espaçamento que os dashboards. O CTA de inscrição deve ser a única ação dourada; WhatsApp é uma ação de suporte, não uma ação concorrente de conversão.

### Aluno

A prioridade de navegação é correta, mas a primeira viewport deve privilegiar próxima aula, pendência e progresso — não widgets equivalentes. No mobile, a sidebar deve seguir como drawer contextual e não uma cópia apertada de desktop.

### Professor

A navegação precisa ser uma ferramenta de trabalho: curso, alunos, correção e agenda são mais frequentes que elementos institucionais. Gráficos só aparecem quando respondem uma pergunta real.

### Administrador

O Command Center deve usar quatro níveis: visão geral, indicadores, operações e detalhes. A primeira viewport não pode tentar representar toda a instituição; precisa mostrar o que requer atenção e um caminho imediato para agir.

## Regras visuais aplicáveis

1. A cor dourada representa ação, seleção ou prioridade — nunca decoração repetida.
2. Azul-noite pertence à estrutura de navegação e a ações institucionais decisivas.
3. Superfícies são silenciosas; bordas separam, sombras apenas elevam menu, modal ou ação transitória.
4. No máximo uma ação primária por tela.
5. Métricas são acionáveis ou não aparecem na primeira viewport.
6. Em mobile, ações essenciais continuam visíveis; tabelas viram linhas/cards, não exigem scroll horizontal.
7. Ícones são Lucide, sempre acompanhados por texto em navegação.
8. Estados de cor sempre possuem texto/ícone correspondente.
9. Movimentos são curtos, opcionais e não alteram layout.
10. Foco de teclado é parte da composição visual, não um remendo.

## Ordem de implementação

1. Barra pública e menu mobile.
2. Tokens, botões, inputs, superfícies e estados compartilhados.
3. Shell/navegação do aluno e dashboard prioritário.
4. Shell/navegação do professor e dashboard operacional.
5. Command Center administrativo.
6. Breakpoints e validação visual 375/768/1024/1440.
