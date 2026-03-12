# Tamamon - V-Pet Adventure 🌱

Uma experiência imersiva de animal de estimação virtual (V-Pet) inspirada no universo Digimon. Cuide do seu Wormmon, alimente-o, dê carinho e ajude-o a digievoluir para o poderoso Stingmon!

## 🎮 Controles

- **Botão Esquerdo (Redondo):** Reiniciar o jogo / Resetar progresso.
- **Botão Direito Superior (Pílula):** Alimentar seu Tamamon (Gera comida aleatória na tela).
- **Botão Direito Inferior (Pílula):** Entrar em modo Carinho (Clique no Tamamon para aumentar felicidade).

## 🚀 Como Rodar Localmente

Como o jogo utiliza **Módulos ES (ES Modules)**, o carregamento direto via `file://` é bloqueado por segurança (CORS).

Para jogar localmente:

1. No VS Code, instale a extensão **Live Server** e clique em "Go Live".
2. Ou use o terminal na pasta do projeto:
   ```bash
   npx serve .
   ```
3. Ou utilize Python:
   ```bash
   python -m http.server
   ```

## 📂 Estrutura do Projeto

- `index.html`: Ponto de entrada e interface HUD.
- `src/style.css`: Estilização premium com estética Digivice e efeitos de vidro.
- `src/script.js`: Motor principal, lógica de estados (FSM) e mecânicas de jogo.
- `assets/images/`: Sprites do Wormmon, Stingmon, DigiOvo e backgrounds.
- `assets/audio/`: Trilhas sonoras originais para imersão completa.

## 🛠️ Stack Tecnológica

- **Vanilla JS & CSS**: Performance pura sem dependências pesadas.
- **GitHub Pages Ready**: Estrutura otimizada para deploy instantâneo.
- **Responsive Design**: Adaptado para diferentes resoluções.

---
Criado com ❤️ por Antigravity AI.
