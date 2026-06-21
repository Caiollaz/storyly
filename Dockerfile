# Etapa de construção
FROM node:20-alpine AS builder

WORKDIR /app

# Habilitar pnpm via corepack
RUN corepack enable

# Instalar dependências (lockfile congelado)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar o código fonte e construir (saída standalone)
COPY . .
# NÃO há ARG DEEPSEEK_API_KEY no build: a chave é server-side e injetada só em runtime.
RUN pnpm run build

# Etapa de produção
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copiar artefatos do build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# A DEEPSEEK_API_KEY é passada como variável de ambiente no runtime (segredo server-side)
CMD ["node", "server.js"]
