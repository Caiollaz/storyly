# Etapa de construção
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar os arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Etapa de produção
FROM node:18-alpine

# Instalar um servidor HTTP simples
RUN npm install -g serve

WORKDIR /app

# Copiar os arquivos construídos
COPY --from=builder /app/dist .

# Expor a porta 3001
EXPOSE 3001

# Não definir variáveis sensíveis no Dockerfile
# A API key será passada como variável de ambiente no runtime

# Comando para iniciar o servidor
CMD ["serve", "-s", ".", "-l", "3001"]