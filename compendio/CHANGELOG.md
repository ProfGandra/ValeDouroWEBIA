# v3.19.5 — 2026-08-29

- Corrigida a estrutura HTML do catálogo: cards adicionados recentemente estavam fora do contêiner `.grid`, fazendo-os ocupar uma linha inteira.
- Todos os 72 cards agora pertencem ao mesmo grid responsivo e usam o mesmo padrão visual.
- Atualizada para **v3.19.5** a versão exibida no título da página, cabeçalho, rodapé, README e arquivos de dados.
- Conteúdo canônico e artes preservados.

# v3.19.4 — 2026-08-29

- Restaurada a arte oficial correta de Drazhen Volkar — O Contador dos Mortos; o arquivo `drazhen-volkar.webp` havia sido substituído por uma ficha de Nereon.
- Corrigida a classificação de Malachar Veyr: removida a categoria `Liceu`, mantendo `Kratovia | Guerra Kratoviana`.
- Removidos do registro público de Malachar os resíduos textuais de “Sangue da Guerra” não revalidados no cânone atual.
- Atualizada para **v3.19.4** a versão exibida no título da página, cabeçalho, rodapé, README e arquivos de dados.
- Manifesto de artes e auditoria estrutural regenerados.

# v3.19.3 — 2026-08-28

- Substituição da arte oficial da Esquadra do Portão pela composição panorâmica validada.
- A nova arte apresenta Invictus, Vigilantia e Praeventus em formação defensiva, com o Forte de São Telmo e a Baía/estuário ao fundo.
- Mantida a composição canônica: Invictus — encouraçado pesado; Vigilantia e Praeventus — fragatas pesadas.
- Auditoria estrutural e do núcleo naval refeita antes do empacotamento.

# v3.19.2 — 2026-08-28

- Correção final da arte da Esquadra do Portão: Invictus identificado como Encouraçado Pesado.
- Correção dos dados visuais de Astrid Varens na ficha coletiva: humana, 47 anos.
- Ajuste da legenda coletiva para “um encouraçado, duas fragatas”.
- Remoção do arquivo inválido `assets/artes/test.webp`.
- Manifesto de artes regenerado após auditoria integral.
- Pacote revalidado: 72 fichas/cards com 72 artes distintas; 0 referências ausentes e 0 imagens corrompidas.

# v3.19.1 — 2026-08-28

- Auditoria integral das referências de arte do Compêndio.
- Mikhail Vordren passa a usar sua ficha/arte individual validada.
- Dravnik Reanimado passa a usar sua ficha/arte individual validada.
- Correção residual de Praeventor para Praeventus no card de Beatriz de Alvar.
- Remoção residual de “Ilha da Guarda” da ficha textual de Hadrian Voss.
- Remoção de referência residual a “Porta das Águas” no card de Sáren, mantendo São Telmo.
- Manifesto de artes regenerado com hashes e tamanhos atuais.
- Limpeza de arquivos temporários do pacote.

# v3.19 — 2026-08-28

- Consolidação do núcleo naval: Sapientia é a fragata ligeira Classe Discens; Veloz é o falcão-peregrino de Tomás de Avis.
- Esquadra do Portão canonizada: Invictus + Vigilantia + Praeventus, em coordenação com o Forte de São Telmo.
- Correção de Praeventor para Praeventus.
- Remoção de “Ilha da Guarda” e de “Guarda da Porta das Águas” do cânone.
- Hadrian Voss atualizado mantendo São Telmo, Martelos e protocolo de último recurso.
- Novas artes oficiais de Astrid Varens, Beatriz de Alvar, Hadrian Voss, Marinha Real e Esquadra do Portão.
- Inclusão de Drazhen Volkar, Mikhail Vordren e Dravnik Reanimado no banco.

# Changelog

## Pacote manual v3.18 — 2026-08-27

- Integradas ao compêndio as artes oficiais de Exército Sem Fim, Vargard Sviatkar, Velkan Drømir, Malachar Veyr e Kaptar Radvik Skorven.
- Atualizados `data/compendio.json` e `data/artes-manifest.json`.
- Mantido `data/kratovia.json` como base canônica detalhada de Kratovia.


## 2026-08-27 — Kratovia e Exército Sem Fim

- Adicionada base canônica estruturada `data/kratovia.json`.
- Consolidada a doutrina das longas colunas do Exército Kratoviano.
- Registradas as regras canônicas de necromancia territorial e reanimação.
- Registradas as vulnerabilidades e limitações dos reanimados.
- Consolidada a filosofia valedourense “Ninguém fica para trás. Ninguém é esquecido.”
- Registrada a hierarquia Dravnik → Mørvak → Undrav → Størvik → Kaptar → Vardrak, com Nekrovar na estrutura necromântica paralela.
- Adicionados ao cânone: Vargard Sviatkar, Nekrovar Velkan Drømir, Malachar Veyr e Kaptar Radvik Skorven.
- Registradas as artes/fichas validadas nesta etapa.
- Mantidas explicitamente em aberto as informações ainda não definidas, evitando transformar hipóteses em cânone.
- Integração das novas artes binárias ao `assets/artes/` e ao manifesto permanece pendente.

## Migração Git — v3.17

- Migração do compêndio monolítico para estrutura própria para Git.
- Separação de HTML, CSS e JavaScript.
- Criação de base estruturada em JSON.
- Extração das artes para arquivos individuais.
- Otimização das artes em WebP.
- Preservação do cânone da v3.17.
