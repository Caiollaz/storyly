# Storyly - Aventuras Interativas com IA

**Storyly** é um jogo de aventura textual interativo onde cada história é única e moldada pelas suas escolhas. Utilizando inteligência artificial avançada, o Storyly gera histórias em tempo real com base no gênero selecionado e nas decisões que você toma durante a aventura.

## 🎮 Funcionalidades

- **Histórias Geradas por IA**: Cada aventura é única e criada em tempo real por inteligência artificial
- **Múltiplos Gêneros**: Escolha entre gêneros pré-definidos ou crie o seu próprio
- **Sistema de Salvamento**: Salve e retome suas aventuras a qualquer momento
- **Multi-idioma**: Suporte para inglês e português
- **Temas Personalizáveis**: Escolha entre temas claro, escuro ou "paperwhite"
- **Experiência Imersiva**: Histórias detalhadas com escolhas significativas

## 🚀 Tecnologias Utilizadas

- **React 19** com TypeScript
- **API de IA** para geração de histórias
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **LocalStorage** para salvamento de jogos

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Uma chave de API de um serviço de IA compatível

## ▶️ Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/caiollaz/storyly.git
   cd storyly
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure sua chave de API:**
   - Obtenha uma chave de API do Google Gemini em: https://makersuite.google.com/app/apikey
   - Copie o arquivo `env.example` para `.env`:
     ```bash
     cp env.example .env
     ```
   - Edite o arquivo `.env` e substitua `sua_chave_api_aqui` pela sua chave real
   - **IMPORTANTE**: Nunca commite o arquivo `.env` no Git por questões de segurança

4. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra seu navegador e visite `http://localhost:5173`

## 🐳 Como Executar com Docker

1. **Construa e execute com Docker:**
   ```bash
   # Construa a imagem (sem dados sensíveis)
   docker build -t storyly .
   
   # Execute o container passando a API key como variável de ambiente
   docker run -p 3001:3001 -e GEMINI_API_KEY=sua_chave_api_aqui storyly
   ```

2. **Ou use Docker Compose:**
   ```bash
   # Configure sua API key como variável de ambiente
   export GEMINI_API_KEY=sua_chave_api_aqui
   
   # Execute com Docker Compose
   docker-compose up --build
   ```

3. **Para Produção com Docker Secrets:**
   ```bash
   # Crie um secret
   echo "sua_chave_api_aqui" | docker secret create gemini_api_key -
   
   # Execute com secret
   docker service create \
     --name storyly \
     --secret gemini_api_key \
     --env GEMINI_API_KEY_FILE=/run/secrets/gemini_api_key \
     -p 3001:3001 \
     storyly
   ```

4. **Acesse a aplicação:**
   Abra seu navegador e visite `http://localhost:3001`

## 🚀 Deploy no Dokploy (VPS)

Para fazer deploy no Dokploy, siga estes passos:

1. **Conecte seu repositório:**
   - Acesse seu painel do Dokploy
   - Vá em "Applications" → "New Application"
   - Conecte seu repositório GitHub/GitLab

2. **Configure as variáveis de ambiente:**
   - Na seção "Environment Variables" do seu projeto
   - Adicione: `GEMINI_API_KEY` = `sua_chave_api_aqui`
   - **IMPORTANTE**: Nunca commite a chave no código!

3. **Configure o build:**
   - **Build Context**: `/` (raiz do projeto)
   - **Dockerfile Path**: `Dockerfile`
   - **Port**: `3001`

4. **Deploy:**
   - Clique em "Deploy"
   - O Dokploy fará o build automático da imagem
   - A aplicação estará disponível na URL fornecida

5. **Configuração de domínio (opcional):**
   - Vá em "Domains" → "Add Domain"
   - Configure seu domínio personalizado
   - O Dokploy configurará automaticamente o SSL

### 🔒 Segurança no Dokploy:
- ✅ Variáveis de ambiente são criptografadas
- ✅ A API key nunca é exposta no código
- ✅ Build automático sem dados sensíveis
- ✅ SSL automático para domínios personalizados

## 🎯 Como Jogar

1. **Selecione um gênero** entre as opções pré-definidas ou crie o seu próprio
2. **Leia a história** gerada pela IA
3. **Faça suas escolhas** entre as opções apresentadas
4. **Continue a aventura** até alcançar um final ou salvar o jogo
5. **Salve sua aventura** a qualquer momento para continuar depois

## 🌍 Idiomas Disponíveis

- 🇺🇸 Inglês
- 🇧🇷 Português

## 🎨 Temas Disponíveis

- **Slate**: Tema escuro com tons de azul
- **Dark**: Tema escuro clássico
- **Paperwhite**: Tema claro com aparência de papel

## 🛠️ Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── i18n/               # Configuração de internacionalização
├── services/           # Serviços (integração com API de IA)
├── App.tsx             # Componente principal da aplicação
├── types.ts            # Definições de tipos TypeScript
└── index.tsx           # Ponto de entrada da aplicação
```

## 🔒 Segurança

- **NUNCA** commite arquivos `.env` ou chaves de API no repositório
- Use o arquivo `env.example` como modelo para configuração
- Mantenha suas chaves de API seguras e rotacione-as regularmente
- **NUNCA** use `ARG` ou `ENV` no Dockerfile para dados sensíveis
- Use variáveis de ambiente no runtime ou Docker Secrets para produção
- A imagem Docker não contém dados sensíveis - apenas no momento da execução

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto é licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 💡 Dicas

- Cada história é única e pode levar a finais inesperados
- Suas escolhas realmente afetam o rumo da história
- Experimente diferentes gêneros para experiências variadas
- Não tenha medo de fazer escolhas criativas ou inesperadas!

Desenvolvido com ❤️ por Caio Labella - onde suas escolhas moldam a história.