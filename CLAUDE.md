# CLAUDE.md

Orientações para o Claude Code trabalhar neste repositório.

## O que é

**Storyly** — jogo de aventura textual interativo gerado por IA. Usuário escolhe (ou cria) um gênero, a IA gera a cena de abertura e, a cada escolha, gera a próxima cena. App **Next.js 16 (App Router)** com **login Google**, **assinatura Pro (AbacatePay)** e gating por plano. Geração roda em Route Handler server-side (chave nunca vai ao navegador). UI bilíngue (en/pt), 3 temas, saves por usuário no DB.

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript · **React 19**
- **DeepSeek** via SDK `openai` (`baseURL: https://api.deepseek.com`, modelo `deepseek-v4-flash`, 1M ctx, JSON via `response_format`)
- **Auth.js v5** (`next-auth@5`) — provider Google, sessão **database** (adapter Drizzle)
- **Postgres** + **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`, driver `pg`)
- **AbacatePay** — assinatura recorrente (API v2 via `fetch`; SDK oficial v1 não cobre subscriptions)
- **Tailwind v4** · **next/font** · **Biome** (lint+format) · **pnpm**

## Comandos

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # standalone
pnpm start
pnpm lint / pnpm format
pnpm test           # vitest (lógica pura de gating)
pnpm db:generate    # gera migration SQL a partir do schema
pnpm db:migrate     # aplica migrations (precisa DATABASE_URL)
pnpm db:push        # aplica schema direto (dev)
```

Migrations rodam **automaticamente no boot** (`instrumentation.ts` → drizzle migrator; SQL embarcado no standalone via `outputFileTracingIncludes`). `pnpm db:migrate` é fallback manual.

## Envs (todas server-side, sem `NEXT_PUBLIC_`)

`DEEPSEEK_API_KEY`, `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_URL` (prod), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ABACATEPAY_API_KEY`, `ABACATEPAY_PRO_PRODUCT_ID`, `ABACATEPAY_WEBHOOK_SECRET`. Ver `.env.example`. Local: `.env.local` (gitignored).

Setup externo: Google Cloud OAuth client (redirect `<AUTH_URL>/api/auth/callback/google`); AbacatePay produto de assinatura (ciclo mensal) → `ABACATEPAY_PRO_PRODUCT_ID`, e webhook → `<AUTH_URL>/api/webhooks/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`.

## Banco de dados (`lib/db/schema.ts`, Drizzle)

- Auth.js: `user`, `account`, `session`, `verificationToken` (schema canônico do adapter).
- `subscription`: 1 linha/usuário (`userId` PK, `status`, `currentPeriodEnd`, `abacateSubscriptionId`). Pro = `status='active'` e `currentPeriodEnd` futuro/null.
- `saved_game`: saves por usuário (`storyHistory`/`currentScene` jsonb).
- `usage`: contadores de gating (`adventuresStarted`, `scenesDate`, `scenesToday`).
- `lib/db/index.ts` — pool `pg` + drizzle (não lança em load p/ não quebrar build). Migrations em `lib/db/migrations/`.

## Auth (`auth.ts`)

`NextAuth({ adapter: DrizzleAdapter(db,...), providers:[Google], session:{strategy:"database"} })` → exporta `handlers/auth/signIn/signOut`. `session.user.id` é populado via callback + augmentation de tipo. Rota `app/api/auth/[...nextauth]/route.ts`.

**Gating de acesso é por Server Component**, não middleware (sessão DB + `pg` não roda no edge): `app/page.tsx` e `app/account/page.tsx` chamam `auth()` e `redirect("/login")` se não logado. `/login` renderiza `components/login-form.tsx` (client, `signIn("google")`). Rotas de API checam `auth()` elas mesmas; o webhook é público (valida secret).

## Gating / entitlements (`lib/entitlements.ts`)

`FREE_LIMITS`: 3 aventuras, 20 cenas/dia, 1 save. Pro = ilimitado + gêneros premium, mas com cap de segurança `PRO_SCENES_PER_DAY=500` (anti-abuso, não anunciado).
- `isPro(userId)`, `getEntitlements(userId)`, `reconcileSubscription(userId)` (fallback p/ webhook perdido — chamado no `/account`).
- **check/record separados:** `check*` só lê (pre-check), `record*` incrementa com SQL atômico — conta só APÓS geração bem-sucedida (falha não gasta cota; sem lost-update). `assertCanUseGenre`, `assertCanSave` — todos lançam `GatingError` (402, com `code`).
- **Gênero premium = qualquer coisa fora dos 5 básicos** (romance + custom). Allowlist server-side em todos os idiomas (`FREE_GENRE_VALUES`). Testado em `tests/entitlements.test.ts`.

Fluxo de erro: rota captura `GatingError` → `{ error, code }` 402. Cliente (`lib/api.ts` `ApiError.code`) mapeia o code → mensagem + CTA "Assinar Pro" (`components/game.tsx` `GATING_KEYS`).

## Rotas de API (`app/api/*`, todas `runtime="nodejs"`, `auth()` exceto webhook)

- `scene` — exige sessão; pre-check gating → DeepSeek (cache multi-turno; `MAX_HISTORY_TURNS=20` janela; retry 1x em JSON inválido/truncado) → record atômico no sucesso.
- `saves` — GET/POST/DELETE saves do usuário; POST de save novo respeita slots.
- `me` — GET entitlements.
- `subscription/checkout` — POST → `createSubscriptionCheckout` (`lib/abacate.ts`, v2, `externalId=userId`) → `{ url }`.
- `subscription/cancel` — POST → `cancelSubscription` (v2) + marca `canceled` local.
- `webhooks/abacatepay` — valida `?webhookSecret=`; `completed|renewed`→active, `cancelled` ou status `EXPIRED/CANCELLED/REFUNDED`→canceled (idempotente por `userId`); ack 200 p/ user inexistente.

Logs: `lib/log.ts` (JSON-line estruturado) nos paths de erro/pagamento/cache. Trocar o sink lá p/ Sentry/Datadog.

## Frontend

- `app/layout.tsx` (next/font, metadata) → `app/providers.tsx` (`SessionProvider` + `LanguageProvider`).
- `app/page.tsx` (server, gate) → `components/game.tsx` (client; estado do jogo, saves via `/api/saves`, entitlements via `/api/me`, paywall, header com conta/sair).
- `components/genre-selector.tsx` — saves list (continuar/excluir) + cadeado nos gêneros premium/custom p/ free (`onUpgrade`).
- `app/account/page.tsx` (server) → `components/account-panel.tsx` (status do plano, assinar via checkout, sair).
- i18n: chaves em AMBOS `en`+`pt` (`lib/i18n/translations.ts`); a union de tipos deriva de `en`.

## Docker

`docker-compose.yml`: serviço `postgres:16-alpine` (volume `storyly-pgdata`, healthcheck) + app standalone (porta 3000, `depends_on` healthy, todas as envs). `DATABASE_URL` aponta pro serviço `postgres`. **Migrations auto no boot** via `instrumentation.ts`.

## Convenções

- **pnpm** (pinado em `packageManager`; lockfile `pnpm-lock.yaml`). Não usar npm/yarn.
- **Arquivos kebab-case**; identificadores de componente React em PascalCase.
- Componentes interativos/hooks levam `"use client"`. Server pages fazem o gate de auth.
- Texto visível sempre via `t()` (en+pt); cor sempre via `var(--...)`.
- Segredos só server-side (sem `NEXT_PUBLIC_`). Verificar: `grep -r "DEEPSEEK_API_KEY\|ABACATEPAY\|GOOGLE\|AUTH_SECRET" .next/static` → vazio.
- `pnpm lint` antes de finalizar. Suppressões: `// biome-ignore <regra>: motivo` na linha acima.

## Commits

NUNCA adicionar `Co-Authored-By` nem qualquer footer de co-autoria/atribuição a IA nas mensagens de commit.
