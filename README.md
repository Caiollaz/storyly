# Storyly - Aventuras Interativas com IA

**Storyly** é um jogo de aventura textual interativo onde cada história é única e moldada pelas suas escolhas. Utilizando inteligência artificial avançada, o Storyly gera histórias em tempo real com base no gênero selecionado e nas decisões que você toma durante a aventura.

## 🎮 Funcionalidades

- **Histórias Geradas por IA**: cada aventura é única e criada em tempo real (DeepSeek)
- **Múltiplos Gêneros**: escolha entre gêneros pré-definidos ou crie o seu próprio
- **Sistema de Salvamento**: salve e retome suas aventuras a qualquer momento (localStorage)
- **Multi-idioma**: suporte para inglês e português
- **Temas Personalizáveis**: slate, dark ou paperwhite
- **Sistema de Fontes**: Literata para leitura, Cinzel/Unna para títulos, Source Sans 3 para interface
- **Chave de API protegida**: a chamada ao DeepSeek roda no servidor (Route Handler), a chave nunca chega ao navegador

## 🚀 Tecnologias Utilizadas

- **Next.js 16** (App Router) com TypeScript
- **React 19**
- **DeepSeek** (SDK `openai`, API compatível, modelo `deepseek-v4-flash`, 1M de contexto) — chamado server-side via Route Handler
- **Auth.js v5** (login com Google, sessão no banco)
- **Postgres + Drizzle ORM** (contas, assinatura, saves, contadores)
- **AbacatePay** — assinatura recorrente (PIX/cartão)
- **Tailwind CSS v4** · **next/font** · **Biome** (lint+format) · **pnpm**

## 📋 Pré-requisitos

- Node.js 20.9+ (Next.js 16)
- Postgres (local ou container)
- Chave de API do **DeepSeek**
- **Google OAuth** client (Google Cloud)
- Conta **AbacatePay** com um produto de assinatura

## ▶️ Como Executar Localmente

1. **Clone e instale:**
   ```bash
   git clone https://github.com/caiollaz/storyly.git
   cd storyly
   pnpm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Preencha em `.env.local` (todas server-side — **nunca** use `NEXT_PUBLIC_`):
   - `DEEPSEEK_API_KEY` — https://platform.deepseek.com/api_keys
   - `DATABASE_URL` — seu Postgres
   - `AUTH_SECRET` — gere com `openssl rand -base64 33`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — OAuth client (redirect URI: `http://localhost:3000/api/auth/callback/google`)
   - `ABACATEPAY_API_KEY` / `ABACATEPAY_PRO_PRODUCT_ID` / `ABACATEPAY_WEBHOOK_SECRET`

3. **Suba o banco e aplique o schema:**
   ```bash
   docker run -d --name storyly-pg -e POSTGRES_USER=storyly -e POSTGRES_PASSWORD=storyly \
     -e POSTGRES_DB=storyly -p 5432:5432 postgres:16-alpine
   pnpm db:migrate
   ```

4. **Inicie e acesse:**
   ```bash
   pnpm dev
   ```
   Abra `http://localhost:3000` → faça login com Google.

### Scripts

| Script            | Descrição                         |
| ----------------- | --------------------------------- |
| `pnpm dev`     | Servidor de desenvolvimento       |
| `pnpm build`   | Build de produção (standalone)    |
| `pnpm start`   | Servidor de produção              |
| `pnpm lint`    | Lint (Biome)                      |
| `pnpm format`  | Formatação automática (Biome)     |
| `pnpm db:generate` | Gera migration a partir do schema |
| `pnpm db:migrate`  | Aplica migrations no banco        |
| `pnpm db:push`     | Aplica o schema direto (dev)      |

## 💳 Login e Assinatura

- **Login:** Google OAuth (Auth.js). Toda a app exige login; o acesso é gateado em Server Components.
- **Plano Free:** 3 aventuras no total, 20 cenas/dia, 1 save, sem gêneros de romance nem gênero customizado.
- **Plano Pro (AbacatePay):** tudo ilimitado + gêneros premium. Checkout em `/account` → AbacatePay → o webhook (`/api/webhooks/abacatepay`) ativa a assinatura.
- Ajuste os limites em `lib/entitlements.ts` (`FREE_LIMITS`).

## 🐳 Como Executar com Docker

`docker compose up --build` sobe **Postgres + app** (standalone, porta 3000). Defina as envs (ex.: em um `.env` lido pelo compose, ou exportadas): `DEEPSEEK_API_KEY`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ABACATEPAY_*`. O `DATABASE_URL` aponta automaticamente pro serviço `postgres`.

**Migrations:** o runtime standalone não inclui o drizzle-kit. Aplique o schema uma vez (ou em cada deploy) com `DATABASE_URL` apontando pro banco:
```bash
pnpm db:migrate
```

## 🚀 Deploy no Dokploy (VPS)

1. **Conecte o repositório** em "Applications" → "New Application".
2. **Variáveis de ambiente** (runtime, nunca build args): todas as do `.env.example`. `AUTH_URL` = URL pública.
3. **Postgres:** crie um serviço Postgres no Dokploy e aponte o `DATABASE_URL`.
4. **Build:** Context `/`, Dockerfile `Dockerfile`, **Port `3000`**.
5. **Migrations:** rode `pnpm db:migrate` (pré-deploy/manual) contra o `DATABASE_URL`.
6. **Webhook AbacatePay:** `https://SEU_DOMINIO/api/webhooks/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`.
7. **Google OAuth:** adicione o redirect `https://SEU_DOMINIO/api/auth/callback/google`.

## 🎯 Como Jogar

1. Selecione um gênero (pré-definido ou crie o seu)
2. Leia a história gerada pela IA
3. Faça suas escolhas
4. Continue a aventura ou salve o jogo
5. Retome quando quiser

## 🌍 Idiomas

- 🇺🇸 Inglês
- 🇧🇷 Português

## 🎨 Temas

- **Slate**: escuro com tons de azul
- **Dark**: escuro clássico
- **Paperwhite**: claro, aparência de papel

## 🛠️ Estrutura do Projeto

```
auth.ts                 # Auth.js (Google + Drizzle adapter)
app/
├── layout.tsx          # next/font, metadata, Providers
├── providers.tsx       # SessionProvider + LanguageProvider
├── page.tsx            # Server: gate de login -> <Game>
├── login/ account/     # Telas de login e conta/assinatura
├── globals.css         # Tailwind v4 + temas + fontes
└── api/                # scene, saves, me, subscription/checkout, webhooks, auth
components/             # game.tsx + apresentação (kebab-case)
lib/
├── api.ts              # Cliente HTTP (requestScene, saves, checkout)
├── abacate.ts          # AbacatePay v2 (assinatura)
├── entitlements.ts     # Gating por plano (FREE_LIMITS)
├── db/                 # Drizzle: schema, client, migrations
├── types.ts            # Tipos
└── i18n/               # Internacionalização
```

## 🔒 Segurança

- Todos os segredos são **server-side** (sem `NEXT_PUBLIC_`): DeepSeek, AbacatePay, Google, `AUTH_SECRET`, DB. Não vão ao bundle do cliente.
- Gating de plano é **enforçado no servidor** (rotas + Server Components), não só na UI.
- Webhook valida o `webhookSecret`.
- **NUNCA** commite `.env.local` (já no `.gitignore`).
- No Docker, segredos entram **só em runtime**, nunca como `ARG`/`ENV` de build. Rotacione chaves regularmente.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Licença MIT — veja [LICENSE](LICENSE).

Desenvolvido com ❤️ por Caio Labella — onde suas escolhas moldam a história.
