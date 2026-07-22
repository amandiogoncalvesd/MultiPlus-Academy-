# Especificação de refatoração premium — Dashboard Administrativo

**Data:** 22 de julho de 2026  
**Escopo:** novo design system, estrutura de informação, perfil/avatar, configurações, operações administrativas, responsividade e acessibilidade do portal administrativo.

> Este documento é a etapa de descoberta/arquitetura antes da alteração estrutural do dashboard. A execução será feita por fases, em commits pequenos, preservando as regras RLS e os fluxos atuais que já funcionam.

---

## 1. Benchmark e princípios adotados

### Navegação adaptativa

Material Design recomenda que a navegação se adapte ao tamanho da janela: drawer persistente em telas grandes, rail/drawer em tamanho intermediário e navegação de menor impacto em telas compactas; a navegação deve ficar fora do painel de conteúdo, e o drawer/conteúdo devem rolar de maneira independente.

- [Material Design — Navigation rail](https://m3.material.io/components/navigation-rail/guidelines)
- [Material Design — Navigation drawer](https://m2.material.io/components/navigation-drawer/flutter)

**Aplicação MultiPlus:** drawer administrativo persistente a partir de `lg`, drawer modal em mobile, topbar fixa de baixa altura e área principal com scroll independente. Em mobile, destinos prioritários terão barra de acesso rápido e as demais ações ficam no menu.

### Dados de gestão e tabelas

Padrões de sistemas corporativos como Carbon apontam para filtros visíveis/removíveis, tabela responsiva, ações em lote, estados de loading/erro/vazio e suporte a teclado/leitor de tela.

- [Carbon — responsive filter panel and table behavior](https://github.com/carbon-design-system/carbon/issues/5161)
- [Carbon — notifications](https://v10.carbondesignsystem.com/components/notification/usage/)

**Aplicação MultiPlus:** usuários, cursos, matrículas e certificados terão um padrão único de `DataTable`: pesquisa, filtros em chips, paginação futura, ações contextuais, confirmação e estado vazio honesto. Toast não terá links/ações críticas; decisões críticas usam diálogo ou página contextual.

### Acessibilidade de administração

A WCAG 2.2 exige, entre outros, foco não oculto, alvo mínimo de 24×24 px, ajuda consistente e interação por teclado. Diálogos modais precisam manter Tab/Shift+Tab no diálogo e fechar via Escape, com foco retornando ao acionador.

- [WCAG 2.2 / AccessibleEU](https://accessible-eu-centre.ec.europa.eu/content-corner/news/wcag-22-officially-w3c-recommendation-2023-10-06_en)
- [WAI-ARIA Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

**Aplicação MultiPlus:** botões de ícone recebem nome acessível; drawers/modal recebem foco, Escape e retorno de foco; ações destrutivas usam confirmação; nenhuma operação depende exclusivamente de cor/tooltip/hover.

### Segurança de ações administrativas

Autorização deve estar na camada confiável e obedecer a menor privilégio, sem depender de botões escondidos no navegador.

- [OWASP ASVS — Access Control](https://github.com/OWASP/ASVS/blob/master/4.0/en/0x12-V4-Access-Control.md)

**Aplicação MultiPlus:** criação/remoção de usuário, alteração de papel/status, emissão/revogação de certificado, configuração institucional e auditoria devem ser Edge Functions/RPCs autorizadas e auditadas. A UI exibe o resultado, nunca é a autoridade.

---

## 2. Diagnóstico do dashboard atual

### Estrutura

`src/components/AdminPortal.tsx` concentra aproximadamente 1.769 linhas, incluindo:

- shell/layout;
- sidebar/topbar;
- acesso a dados;
- mutações Supabase;
- formulários;
- 18 estados de visualização;
- modal de usuário/curso/certificado;
- perfil e upload;
- configurações;
- indicadores e dados locais.

Isso gera regressões: uma mudança visual pode afetar uma mutation, e uma mudança de estado pode recarregar dados de toda a área.

### Problemas prioritários encontrados

| Área | Problema atual | Correção planejada |
|---|---|---|
| Avatar admin | Implementação própria usa bucket `avatars`, diferente de `AvatarUpload`/bucket `media`; validação e cache são duplicados. | Usar um único `AvatarUpload` com serviço padronizado, callback de atualização de sessão e feedback acessível. |
| Foto na topbar | O avatar é um `div` estático; não abre perfil/configurações. | Transformar em `ProfileMenu` acessível: Perfil, Preferências, Segurança, Sair. |
| Configurações | Mistura configuração institucional, tema, acessibilidade e perfil em telas grandes; `institution_settings` é acessado diretamente. | Separar em páginas: Instituição, Comunicação, Aparência/Acessibilidade, Segurança/Integrações. Mutações críticas via Edge Function. |
| Dashboard | Cards e gráficos misturam dados reais, fallback e valores de demonstração. | Manter somente KPIs com query definida, tendência/intervalo, timestamp e drill-down contextual. Remover placeholders. |
| Alertas | Badge e página não compartilham um contrato visual/estado. | Criar `NotificationCenter`, com leitura, filtro, link de destino e estados vazios. |
| Usuários | Formulário, status, senha e listagem estão acoplados. | `UsersPage`, `UserTable`, `UserDrawer`, Edge Function e audit log. Nunca mostrar senha persistida após criação. |
| Cursos | Administração e edição estão parcialmente duplicadas. | Reutilizar `CourseEditorModal` por contexto e exibir tabela de curso com alunos, aulas, publicação e proprietário. |
| Layout mobile | Sidebar fixa funciona, mas topbar/cards/tabelas não têm uma matriz responsiva única. | `AdminShell` com breakpoints/documentação e tabelas que viram cards no mobile. |
| Feedback | Há `alert()` nativo e logs locais não persistidos. | Toast para confirmação simples, diálogo para risco, audit log persistente para mutações. |

---

## 3. Novo design system administrativo

### Direção visual

**Nome interno:** `MultiPlus Command Center`.

- **Tom:** institucional premium, não decorativo; azul profundo, dourado pontual e superfícies claras/escuras com contraste validado.
- **Hierarquia:** uma ação primária por página, até quatro KPIs no topo, ações secundárias agrupadas em menus.
- **Densidade:** tabelas e listas de gestão usam tipografia funcional; não usar textos de 7–10 px para informação operacional.
- **Estados:** cada widget possui loading, erro, vazio, sucesso e indisponível.
- **Dados:** cards devem indicar período/fonte; gráficos precisam de resumo textual/tabela alternativa.

### Tokens a consolidar

```text
surface.canvas / surface.panel / surface.elevated
text.primary / text.secondary / text.muted
border.subtle / border.strong
brand.navy / brand.gold
semantic.success / warning / danger / info
space.1..8
radius.md / lg / xl
shadow.panel / drawer / modal
```

### Componentes reutilizáveis a criar

```text
AdminShell
AdminSidebar
AdminTopbar
ProfileMenu
NotificationCenter
PageHeader
MetricCard
DataTable
FilterBar
EmptyState
LoadingState
ErrorState
ConfirmDialog
SettingsSection
AvatarUpload (unificado)
```

---

## 4. Arquitetura alvo de componentes

```text
src/components/admin/
  AdminShell.tsx
  AdminSidebar.tsx
  AdminTopbar.tsx
  ProfileMenu.tsx
  NotificationCenter.tsx
  dashboard/AdminOverview.tsx
  users/UsersPage.tsx
  users/UserTable.tsx
  users/UserFormDialog.tsx
  courses/CoursesAdminPage.tsx
  certificates/CertificatesAdminPage.tsx
  settings/InstitutionSettings.tsx
  settings/AdminPreferences.tsx
  settings/IntegrationStatus.tsx
  audit/AuditLogPage.tsx
```

`AdminPortal.tsx` passa a ser um orquestrador fino: autorização, rota/aba ativa e composição do shell. Acesso ao Supabase sai de componentes visuais e passa para hooks/serviços de domínio.

---

## 5. Fluxo de avatar e menu de perfil

### Avatar

1. Clique no avatar abre menu de perfil, não upload imediato.
2. Menu apresenta foto, nome, papel e acesso a Perfil/Preferências/Sair.
3. Página Perfil usa `AvatarUpload` compartilhado, com:
   - JPEG, PNG, WebP;
   - limite de tamanho único;
   - preview/estado de upload;
   - atualização de `users.foto_perfil`;
   - atualização do contexto Auth e da topbar;
   - texto alternativo e acionador por teclado.
4. A limpeza de arquivos antigos e a política do bucket são centralizadas no `avatarService`.

### Configurações a partir da foto

```text
Perfil do administrador
Preferências de interface
Acessibilidade
Segurança e sessões (futuro)
Sair
```

A foto abre menu; o menu navega para áreas de configuração. Não deve haver painel modal enorme com tudo simultaneamente.

---

## 6. Mapa de telas finais

| Destino | Resultado esperado |
|---|---|
| Visão geral | KPIs reais, pendências, atividade recente, atalhos operacionais. |
| Utilizadores | Pesquisa, filtro por papel/status, criação, suspensão, convite/redefinição, ações auditadas. |
| Cursos | Estado, professor, matrículas, aulas, progresso e link para detalhe. |
| Matrículas | Visão curso ↔ aluno, filtros, criação/remoção com confirmação. |
| Calendário | Aulas futuras/ativas/encerradas, eventos institucionais e filtros. |
| Certificados | Emissão PDF privada, revogação, download autorizado e validação. |
| Comunicação | Anúncios institucionais e acesso ao chat. |
| Notificações | Centro único, leitura, filtros e links de contexto. |
| Auditoria | Eventos persistidos, ator, entidade, data e filtros. |
| Configurações | Instituição, aparência/acessibilidade, integrações e segurança. |
| Perfil | Avatar, nome, telefone, bio, preferências pessoais. |

---

## 7. Fases de execução

### Fase A — shell e design tokens

1. Extrair `AdminShell`, sidebar e topbar.
2. Implementar navegação responsiva e estados de foco.
3. Criar `ProfileMenu` e conectar avatar à página Perfil.
4. Unificar `AvatarUpload`; remover fluxo duplicado de bucket `avatars`.

**Aceite:** avatar funciona em admin; foto abre menu; sidebar/topbar não ocultam foco nem quebram em 320–1440 px.

### Fase B — perfil, configurações e notificações

1. Extrair `AdminProfilePage`.
2. Separar configurações em seções salvas com feedback real.
3. Implementar `NotificationCenter` compartilhado.
4. Substituir `alert()` por toast/diálogo apropriado.

**Aceite:** configurações persistem, feedback é acessível e notificações têm estado lido/não lido consistente.

### Fase C — dados operacionais

1. Extrair Usuários, Cursos, Certificados e Auditoria.
2. Criar tabelas responsivas, filtros, estados loading/empty/error.
3. Migrar mutações sensíveis para Edge Functions e `audit_logs`.
4. Remover KPIs/gráficos simulados.

**Aceite:** todos os números apresentam fonte real; ações administrativas são auditadas e protegidas.

### Fase D — validação

1. Testes de teclado, modal e leitor de tela.
2. axe-core e Playwright para fluxo de admin.
3. Testes RLS/Edge Function em staging.
4. Testes mobile e zoom 200/400%.

---

## 8. Critério de prontidão

A refatoração é considerada concluída somente se:

- `AdminPortal.tsx` não concentrar UI, dados e mutações;
- avatar e menu de perfil estiverem integrados e persistentes;
- todo dado de dashboard tiver origem real;
- operações críticas tiverem Edge Function/RLS/audit log;
- desktop, tablet e mobile forem navegáveis por teclado;
- build, testes e revisão de staging forem aprovados.
