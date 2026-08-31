# ValeDouro Web Edition v2.1.0 — AI TESTE

## O que mudou
- Novo Jogo: criar personagem ou importar ficha PDF ValeDouro.
- Multiclasse limitada a duas classes.
- Atributos por dados virtuais (4d6, descarta o menor).
- Equipamentos com ilustrações vetoriais próprias, peso, propriedades e validação por classe/FOR/DES.
- Quests removidas da interface do jogador: ficam ocultas e entram apenas pela narrativa.
- Mestre Virtual conectado via Cloudflare Pages Function + Groq.
- Rolagens são feitas pelo Dice Engine do navegador quando a IA solicita, nunca pela IA.

## Publicação recomendada
Este repositório deve ser conectado ao **Cloudflare Pages** (a partir do GitHub), porque GitHub Pages puro não executa `/functions`. O frontend continua estático e todo o código fica no Git.

1. Suba esta pasta para um repositório GitHub.
2. No Cloudflare Pages, crie um projeto conectado ao repositório.
3. Framework preset: None. Build command: vazio. Output directory: `/` (raiz).
4. Em Settings > Variables and Secrets, crie o secret `GROQ_API_KEY`.
5. Opcional: variável `GROQ_MODEL=llama-3.3-70b-versatile`.
6. Faça deploy. A URL publicada terá o endpoint `/api/dm` automaticamente pela função em `functions/api/dm.js`.

A chave nunca é enviada ao navegador; fica como secret do Cloudflare.
