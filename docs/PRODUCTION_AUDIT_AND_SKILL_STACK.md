# Auditoria de produção e Skill Stack — MultiPlus Academy

**Data:** 23 de julho de 2026  
**Agente:** Arena.ai Agent Mode (agente interoperável; não é uma instalação nativa exclusiva de OpenCode/Cursor/Cline). As skills foram instaladas no formato universal em `~/.agents/skills` e usadas como orientação, não como código executável do app.

## 1. Stack encontrada

| Área | Implementação real |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, `motion/react`, Lucide, Tailwind CSS v4 via plugin Vite. |
| Navegação | SPA controlada por `PageId` em `App.tsx`; não há React Router/deep links. |
| Estado | `useState`, Context para Auth/Theme, hooks de domínio e cliente Supabase. Não há Redux/Zustand/TanStack Query. |
| Banco/Auth | Supabase Auth + PostgreSQL + RLS + Realtime + Storage + Edge Functions. |
| Backend legado | NestJS/Prisma/Firebase em `apps/api`, mas não é o backend conectado ao frontend atual. |
| Arquivos | Buckets privados para certificados, materiais e submissões recentes; mídia legada permanece compatível durante migração. |
| Testes | Vitest, Testing Library, Playwright e axe-core configurados. |
| CI/CD | GitHub Actions (`quality.yml`), Vercel via repositório, Supabase migrations/Edge Functions. |
| Deployment | Vite/Vercel; Supabase remoto `cufdcfzjhecvyjvzaisq`. |

## 2. Skills selecionadas

| Camada | Skill | Repositório/URL | Motivo e aplicação |
|---|---|---|---|
| Design | `frontend-design` | `anthropics/skills` · https://skills.sh/anthropics/skills | Direção visual distinta, crítica de estética genérica, copy e hierarquia. Aplicada em Ledger Light e refatoração de dashboards. |
| UI/UX | `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` · https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill | Tokens, responsividade, foco, formulários, tabelas e checklist UX. Aplicada no design system e validações. |
| Arte de conceito | `canvas-design` | `anthropics/skills` · https://skills.sh/anthropics/skills | Filosofia visual e referência PNG do Command Center. |
| Referência mobile | `sleek-design-mobile-apps` | `sleekdotdesign/agent-skills` · https://skills.sh/sleekdotdesign/agent-skills | Revisada para safe areas/mobile; não usada na API pois `SLEEK_API_KEY` não está configurada. |

## 3. Skills pesquisadas e rejeitadas

- `affaan-m/everything-claude-code@react-performance` (1K installs): não instalada ainda. É de autor não oficial e as recomendações de performance relevantes já estão cobertas pela auditoria manual e configuração Vite; instalar agora acrescentaria sobreposição sem benefício demonstrado.
- `indranilbanerjee/digital-marketing-pro@technical-seo` (100 installs): rejeitada por baixa adoção e falta de necessidade de scripts externos para corrigir metadados/robots básicos.
- Skills de agentes exclusivamente proprietários: rejeitadas quando não têm compatibilidade universal com o ambiente Arena.

## 4. Achados prioritários

1. README e blueprints Nest/Prisma estão desatualizados em relação ao frontend Supabase real.
2. SPA sem rotas URL limita deep links, SEO de páginas internas e retorno contextual.
3. Portais foram gradualmente extraídos, mas `App.tsx`, `StudentPortal.tsx` e `InstructorPortal.tsx` ainda têm responsabilidades excessivas.
4. Design system inicial existe, mas precisa ser aplicado de modo sistemático e sem transformar todos os elementos em cards grandes.
5. SEO técnico básico carece de metadata social, robots e estratégia de URL/canonical.
6. E2E com contas de staging está preparado, mas depende de segredos `E2E_*` no CI.
7. Edge Functions e migrations possuem validação estática; validação RLS completa requer matriz de usuários de staging.

## 5. Plano de execução incremental

1. Corrigir SEO/semântica global e remover providers/alertas duplicados.
2. Aplicar Ledger Light aos dashboards por componentes, começando no Admin já iniciado; seguir Professor e Aluno sem reescrever fluxos.
3. Substituir estados/ações legados por páginas de domínio e Edge Functions auditadas.
4. Adotar React Router e cache de dados somente após preservar todos os fluxos existentes.
5. Completar E2E/RLS em staging e medir performance antes de introduzir dependências adicionais.
