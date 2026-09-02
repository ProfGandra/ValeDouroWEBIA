# ValeDouro WEBIA — Windows build

Esta branch empacota a Web Edition v2.1.0 em Electron para Windows x64.

Saídas esperadas do GitHub Actions:
- instalador NSIS;
- executável portátil.

O frontend é carregado localmente e mantém a conexão com o Mestre Virtual pelo endpoint remoto já configurado em `js/app.js`.
