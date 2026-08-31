# ValeDouro — Mestre Virtual Web Edition v2.0 TESTE

Protótipo estático para GitHub Pages, derivado da v1.5.2.

## Testar localmente
Como os dados são carregados via `fetch`, use um servidor HTTP simples ou publique no GitHub Pages.

## GitHub Pages
1. Envie todo o conteúdo desta pasta para a raiz do repositório.
2. Em Settings > Pages, selecione Deploy from a branch.
3. Selecione `main` e `/ (root)`.

## Incluído
- 10 quests QST-001 a QST-010 (arquivos originais preservados).
- Compêndio da versão-base.
- Nova arte de fundo para as telas de jogo.
- Tela de equipamentos por classe com referência visual, peso, requisitos e características.
- Inventário salvo em localStorage.
- Mestre local de demonstração para que a interface funcione sem API.

## Próxima etapa
Conectar `act()` a um AI Gateway serverless. A chave do provedor NÃO deve ficar no JavaScript do GitHub Pages.
