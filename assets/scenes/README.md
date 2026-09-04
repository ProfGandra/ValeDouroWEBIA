# Banco de Cenas — ValeDouro

Esta pasta armazena as imagens exibidas na janela **Cena atual** durante a sessão.

## Formatos aceitos

O sistema aceita arquivos `.png`, `.webp`, `.jpg` e `.jpeg`. PNG é totalmente suportado e pode ser usado como formato padrão do projeto.

## Estrutura

- `city/` — cidade de Valedouro e áreas urbanas
- `village/` — vilas e povoados
- `forest/` — florestas, bosques e mata
- `road/` — estradas, trilhas e caminhos
- `tavern/` — tavernas, estalagens e interiores semelhantes
- `port/` — porto, cais, mar e embarcações em cena
- `castle/` — castelo, corte e áreas palacianas
- `liceu/` — Liceu de Artífices
- `granberg/` — GranBerg e ambientes anões relacionados
- `wilderness/` — campos, montanhas, acampamentos e natureza aberta
- `dungeon/` — ruínas, cavernas, passagens e masmorras
- `combat/` — imagens genéricas de combate
- `events/` — eventos narrativos especiais
- `npcs/` — personagens em destaque durante uma cena

## Nome recomendado

Use nomes previsíveis e sem espaços, por exemplo:

`VD_SCENE_FOREST_NIGHT_01.png`

`VD_SCENE_TAVERN_01.png`

`VD_SCENE_GRANBERG_01.png`

## Registro

As cenas disponíveis são cadastradas em `data/scenes.json`. O arquivo de imagem pode existir no repositório sem estar ativo; ele só entra na seleção do sistema quando for registrado nesse JSON.
