# ValeDouro WEBIA — Registro de Progresso

Data: 12/09/2026

## Estado atual

Foi desenvolvido e iniciado o teste do sistema de consequências persistentes de ValeDouro, integrado ao Diário e ao Mestre Virtual.

### Implementações realizadas

- Sistema de reputação por facção.
- Relações com NPCs.
- Situação legal por jurisdição.
- Histórico persistente de decisões.
- Integração inicial de decisões marcantes com o Diário.
- Regra: decisões alteram reputação; resultados de dados não alteram reputação por si só.
- Regra: crime desconhecido não gera automaticamente reputação pública negativa nem condição de procurado.
- Ponte narrativa para interpretação de consequências sociais e legais.
- Regra de proteção: declaração do jogador não é fato do mundo.
- Estado canônico de cena em desenvolvimento para preservar local, fatos e objetos conhecidos.
- Fallback local para registros do Diário, reduzindo dependência de marcadores produzidos pela IA.
- Regra para itens não identificados entrarem no inventário sem informação não descoberta.

### Arquivos principais relacionados

- `js/reputation.js`
- `js/reputation-bridge.js`
- `js/scene-continuity.js`
- `js/master-context-hardening.js`
- `js/authoritative-engine.js`
- `js/journal.js`
- `js/inventory-system.js`
- `js/branding.js`
- `docs/ValeDouro_Canone_Reputacao_Sentinelas.md`

## Testes realizados

### Teste 1 — Assalto e agressão pública

O jogador tentou assaltar um mercador, depois atacou um agente da ordem e mentiu para justificar a agressão.

Problemas identificados:
- o Diário não registrou as decisões;
- a IA transformou uma mentira do jogador em fato do mundo, criando um garoto morto inexistente;
- surgiram NPCs e autoridades não estabelecidos;
- duas intenções diferentes do jogador foram parcialmente fundidas;
- a reação da autoridade ficou branda demais diante de agressão armada testemunhada.

### Teste 2 — Furto sem identificação

O jogador procurou alguém com joias e furtou um mercador com sucesso.

Problemas identificados:
- o Diário permaneceu em branco;
- a cena mudou arbitrariamente da praça para uma taverna sem deslocamento do jogador;
- gemas inicialmente não identificadas foram arbitrariamente descritas como rubis e esmeraldas;
- o Mestre acrescentou ambiente e NPCs não estabelecidos para acomodar a narrativa.

## Regras de regressão definidas

Ao retomar os testes, repetir o cenário:

1. personagem está na Praça Central;
2. procura alguém portando joias;
3. tenta furtar o mercador;
4. rolagem resolve a tentativa.

Resultado esperado:
- o personagem permanece na Praça Central se não declarar deslocamento;
- o Diário registra a decisão de furtar;
- o dado decide sucesso ou falha, não a moralidade da decisão;
- item obtido permanece como `Bolsa com pedras/gemas não identificadas` até identificação;
- se ninguém identificar o ladrão, não há queda imediata de reputação pública;
- o crime pode existir com autoria desconhecida;
- o Mestre não cria fatos, locais ou NPCs incompatíveis com o estado canônico.

## Pendências prioritárias

1. Confirmar que `scene-continuity.js` está sendo carregado pela versão publicada no GitHub Pages.
2. Validar o fallback determinístico do Diário em uma sessão nova.
3. Validar persistência de local e fatos entre chamadas ao Mestre.
4. Validar integração de itens não identificados ao inventário após resultado confirmado.
5. Depois disso, testar furto testemunhado, agressão, mentira, resistência, prisão e escalada de força.
6. Somente após a base estar estável, aprofundar a resposta institucional da Guarda e dos Sentinelas.

## Observação de cache

Durante o teste de 12/09/2026 houve dúvida se o navegador estava carregando a versão mais recente dos scripts publicados. Na retomada, confirmar a versão efetivamente servida antes de concluir que uma correção falhou.

Este documento serve como ponto de continuidade para o próximo ciclo de testes.