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
FROM nginx:alpine

# Copiar os arquivos construídos para o diretório padrão do nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar o arquivo de configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor a porta 3001
EXPOSE 3001

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]