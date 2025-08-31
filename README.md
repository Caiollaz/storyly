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
   - Obtenha uma chave de API de um serviço de IA compatível
   - Adicione sua chave ao arquivo `.env.local`:
     ```
     GEMINI_API_KEY=sua_chave_api_aqui
     ```

4. **Inicie a aplicação:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação:**
   Abra seu navegador e visite `http://localhost:5173`

## 🐳 Como Executar com Docker

1. **Construa e execute com Docker:**
   ```bash
   docker build -t storyly .
   docker run -p 3001:3001 -e GEMINI_API_KEY=sua_chave_api_aqui storyly
   ```

2. **Ou use Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Acesse a aplicação:**
   Abra seu navegador e visite `http://localhost:3001`

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