# Plano de Redesign Integral — MultiPlus Academy

> Estado: **aprovável / executável** · Data: 2026-09-22
> Base de análise: código-fonte (90 componentes · 19 serviços · 23.190 linhas · 15 migrações · 4 Edge Functions), projeto Supabase remoto (46 tabelas · 7 buckets · 4 funções ativas), auditoria visual automatizada (agent-browser) e skills ativas: `frontend-design`, `ui-ux-pro-max`, `canvas-design`, `sleek-design-mobile-apps`, `supabase`, `agent-browser`, `find-skills`.

---

## 0 · Princípios de método (o que as skills exigem)

1. **frontend-design** — identidade própria, nada de defaults genéricos; o herói é uma tese; tipografia com personalidade; movimento deliberado (menos é mais); copy real e específica; dois passos: plano de tokens → crítica → construção.
2. **ui-ux-pro-max** — padrão *Enterprise Gateway* para o site institucional (seleção de caminho, sinais de confiança, CTA primário + login secundário); checklist pré-entrega (contraste 4.5:1, focus visível, `prefers-reduced-motion`, breakpoints 375/768/1024/1440, alvos de toque ≥ 44 px, SVG em vez de emoji, `cursor-pointer`).
   - *Decisão registrada:* o motor sugeriu paleta teal/âmbar e fonte "Baloo 2"; **recusado** — a identidade MultiPlus (Ledger Light + serifa institucional) é a brief e a brief vence. Do motor, adotamos estrutura, checklist e efeitos, não a paleta.
3. **canvas-design** — toda peça gráfica nova (pôsteres de curso, certificados, OG images) nasce de uma filosofia visual própria, 90 % visual / 10 % texto, exportada em PNG/PDF.
4. **sleek-design-mobile-apps** — princípios de app mobile (navegação por tabs inferiores em dashboards no telemóvel, gestos, densidade) aplicados manualmente (sem `SLEEK_API_KEY`).
5. **supabase** — RLS em tudo, políticas UPDATE com `USING`+`WITH CHECK`, nunca `user_metadata` para autorização, evitar `SECURITY DEFINER`, views com `security_invoker`, service_role nunca no cliente, verificar changelog antes de implementar.
6. **agent-browser** — QA visual contínuo: cada entrega de UI é verificada com capturas reais antes do push.

---

## 1 · Diagnóstico

### 1.1 Auditoria visual (capturas reais, 1280×800)

| Página | Constatações |
|---|---|
| **Início** | Tipografia do herói forte (serifa + dourado). **Problemas:** metade direita da dobra vazia (o cartão "Portal do aluno" começa abaixo da dobra); cursor datilográfico "\|" artificial; badge pill genérico. |
| **Cursos** | Banner azul-claro lavado com muito espaço morto; hiato enorme entre a barra de filtros e os cartões; copy herdada de advocacia ("exigências legislativas, aduaneiras… mercado soberano de Angola"). |
| **Contactos** | Formulário agora entrega e-mail real ✅, mas o banner repete o fundo lavado e copy pomposa ("assento letivo coordenado"). |
| **Login** | Layout split bom; copy contradiz o posicionamento atual ("juristas e profissionais de elite"); CTA "ACEDER À MINHA VAGA" confuso para login. |
| **Geral** | Botão WhatsApp verde-#25D366 fora da paleta; **duas linguagens de design coexistem** — site público (navy `#0A2E5D` + dourado `#C89B3C` + bordas animadas StarBorder) vs. dashboards (Ledger Light `#0B1629`/`#A16207`/`#FAFAF9`). |

**Falha de contraste crítica:** botões com texto branco sobre `#C89B3C` ≈ 2.9:1 (reprova WCAG AA). O dourado Ledger `#A16207` com branco ≈ 5.0:1 (passa).

### 1.2 Auditoria de código / arquitetura

| Métrica | Valor | Ação |
|---|---|---|
| `alert()`/`confirm()` nativos | **26** (AdminPortal, BlogPanel, InstructorCoursesTab, BulkSendModal) | substituir por Toast + ConfirmDialog |
| `console.*` | 199 | remover/estruturar logger |
| Componentes > 400 linhas | 7 (HomePanel 1223, CourseEditorModal 1219, StudentPortal 846, AdminPortal 771, InstructorPortal 747, ChatShell 648, PillNav 628) | decompor |
| ErrorBoundary | 2 | estender a portais e páginas lazy |
| Rotas lazy | 4 | manter + adicionar chunk de PDF |
| Testes | 4 ficheiros / 7 testes | expandir (meta: cobrir messaging, gradebook, candidaturas) |
| Sem router | `PageId` + `useState` no App.tsx | avaliar React Router (deep-link, back/forward, SEO) |
| PWA | `sw.js` + manifest ✅ | auditar cache/offline e ícones |
| SEO | meta básicos ✅, sem OG image própria, sem sitemap | completar |

### 1.3 Auditoria de infraestrutura (Supabase remoto)

- **46 tabelas, 100 % com RLS** ✅; políticas verificadas (incl. migrações 010–015).
- **Buckets:** `media`, `chat-media`, `avatars` públicos; `certificates`, `course-materials`, `student-submissions`, `discussion-attachments` privados ✅.
- **Edge Functions:** `admin-users`, `admin-settings`, `certificate-files`, `student-files` — todas com `serve(` ✅.
- **Lacunas:** (a) nenhum provedor de e-mail transacional (formulários dependem do cliente de e-mail do visitante); (b) MFA não exigido para ADMIN; (c) `audit_logs` existe mas sem triggers de alimentação; (d) sem webhooks/DB triggers para eventos de negócio; (e) sem manifesto de deploy (Vercel/Netlify) no repo; (f) CI só `quality.yml` (sem deploy/preview/e2e por falta de segredos); (g) bundle com `jspdf` 390 kB + `html2canvas` 202 kB no caminho crítico de certificados.

---

## 2 · Direção de design (a identidade, unificada)

**Uma identidade, duas expressões** — mesmo token set, registos diferentes:

- **Registo institucional (site público):** "Ledger Serif" — serifa de display (atual), mineral `#FAFAF9`, tinta `#0B1629`, dourado **`#A16207`** (aposenta `#C89B3C` em texto/botões), linhas `#D6D3D1`. Bandas de secção com fundo mineral e *hairlines*, não azul lavado. Assinatura visual: **filete dourado de 2 px + numeração de secção apenas onde a ordem é real** (processo de admissão).
- **Registo operacional (dashboards):** "Ledger Light" atual, compacto, painéis `rounded-xl`, métricas pequenas com contexto, avatares circulares sem anel.
- **Tipografia:** serifa de display mantida (personalidade), corpo sans atual, monoespaçada para eyebrows/dados — escala explícita 12/14/16/20/28/40.
- **Movimento:** uma sequência orquestrada por página (stagger de entrada ≤ 300 ms), hover 150–250 ms, `prefers-reduced-motion` respeitado; **eliminar** bordas animadas StarBorder contínuas (ruído visual + custo de paint) mantendo-as apenas no CTA principal do herói.
- **Copy:** reescrever tudo com voz sóbria e específica (eliminar "mercado soberano", "assento letivo", "elite"); posição real: *inglês profissional e jurídico em Angola, formação híbrida no Huambo*.
- **Mobile:** nav inferior de 5 tabs nos dashboards (< 768 px), alvos ≥ 44 px, modais viram *sheets*.

---

## 3 · Fase A — Redesign de UI/UX (6 sprints)

| Sprint | Escopo | Critério de aceitação |
|---|---|---|
| **A1 · Tokens & fundação** | Criar `src/styles/tokens.ts` único (cores, raios, sombras, type scale); remover `#C89B3C`/`#0A2E5D` hard-coded → mapear para tokens; utilitários `ledger-*` estendidos ao site público. | `grep` de hex legacy = 0; build ok. |
| **A2 · Site público** | Home (dobra com cartão visível, remover cursor "\|"), Cursos (banda mineral compacta, sem hiato), Sobre/Formadores/Contactos/Login (copy nova, CTA "Entrar no portal"), navbar unificada, contraste AA. | Capturas agent-browser em 375/768/1280 aprovadas; contraste ≥ 4.5:1. |
| **A3 · Portal do aluno** | Decompor StudentPortal; tabs como sub-rotas visuais; StudentTasksTab/Progress já bons — unificar tokens; sheets mobile. | Sem regressão nos 7 testes + 2 novos. |
| **A4 · Portal do docente** | CourseEditorModal → 3 sub-componentes (lições, alunos, materiais) com indicadores de publicação compactos; InstructorCoursesTab sem `alert/confirm`. | 0 dialogs nativos no portal. |
| **A5 · Portal admin** | Decompor AdminPortal; limpar 26 `alert/confirm` restantes (BlogPanel, BulkSendModal…); painel Candidaturas já entregue ✅ — polir estados vazios. | `grep alert(` = 0 em src. |
| **A6 · Centro de mensagens (Bloco B)** | Composer multi-linha com atalhos visíveis, anexos com pré-visualização, ações rápidas, estados vazios, regiões ARIA live, alvos 44 px, responsividade 375→1440. | QA agent-browser + teste novo do composer. |

---

## 4 · Fase B — Redesign de infraestrutura (6 sprints)

| Sprint | Escopo | Skill/boas práticas |
|---|---|---|
| **B1 · E-mail transacional** | Chave Resend (grátis) → Edge Function `notify-application` + DB webhook `ON INSERT applications`; fallback atual (mailto) permanece até validar. | supabase: segredos via `supabase secrets set`, nunca no repo. |
| **B2 · Segurança & identidade** | Exigir MFA para papel ADMIN (política `auth.mfa` + gate no AdminPortal); triggers de auditoria em `users`, `enrollments`, `grade_entries` → `audit_logs`; URLs assinadas com expiração curta em todos os downloads. | supabase checklist. |
| **B3 · Performance** | `jspdf`/`html2canvas` em `import()` dinâmico só ao emitir certificado; code-split dos 3 portais já lazy ✅ + preload de rotas prováveis; orçamento de bundle no CI (index < 250 kB gzip). | frontend-design (movimento/precisão) + quality.yml. |
| **B4 · Deploy & CI/CD** | Manifesto Vercel (ou Netlify) com previews por PR; segredos E2E (`E2E_*`) configurados; job de deploy preview; `smoke` e2e com agent-browser no CI. | agent-browser. |
| **B5 · Dados & RLS endurecida** | Views com `security_invoker=true`; migrar operações admin sensíveis (update de candidaturas incl.) para Edge Functions com service_role (cliente nunca escreve como admin via PostgREST); índices compostos para consultas quentes (messages, grade_entries). | supabase. |
| **B6 · Produção** | Sitemap + OG images (canvas-design para as peças), domínio próprio + SSL, política de retenção (messages/audit), backup/restore testado, runbook de incidentes. | canvas-design + supabase. |

---

## 5 · Backlog priorizado (impacto × esforço)

1. **A1 tokens** (alto/baixo) — desbloqueia tudo.
2. **B1 e-mail** (alto/baixo) — fecha o fluxo de inscrição de ponta a ponta.
3. **A2 site público** (alto/médio) — primeira impressão institucional.
4. **A5 limpar dialogs nativos** (médio/baixo) — qualidade percebida.
5. **B3 performance PDF** (médio/baixo).
6. **A6 mensagens** (alto/médio) — pedido direto do usuário.
7. **B2 MFA/auditoria** (alto/médio).
8. **A3/A4 portais** (médio/médio).
9. **B4 CI/CD** (médio/médio).
10. **B5/B6 endurecimento** (médio/alto) — último, antes do go-live.

**Não-fazer agora:** troca de paleta sugerida pelo motor de design; rewrite com React Router antes de A2 (avaliar depois); XLSX export (CSV cobre); novas tabelas sem validação remota.

---

## 6 · Riscos

- Credenciais partilhadas em chat → **rodar token GitHub e Supabase** após o projeto.
- Sem chave Resend, B1 fica em fallback mailto (aceitável, comunicado ao usuário).
- Sandbox sem persistência de dependências: cada sessão começa com `npm ci` + `agent-browser install --with-deps` (≈ 40 s).

---

*Este plano é vivo: cada sprint vira commits no `main` com verificação agent-browser antes do push.*
