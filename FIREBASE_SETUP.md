# ValeDouro WEBIA — Firebase / Login Google / Save em Nuvem

A infraestrutura de autenticação e sincronização já está implementada no jogo. Para ativá-la em produção:

1. Crie um projeto no Firebase Console.
2. Em **Authentication > Sign-in method**, habilite **Google**.
3. Em **Authentication > Settings > Authorized domains**, confirme o domínio do GitHub Pages (`profgandra.github.io`) e qualquer domínio próprio usado pelo jogo.
4. Crie um banco **Cloud Firestore**.
5. Registre um **Web App** no projeto Firebase.
6. Copie a configuração pública do Web App para `js/firebase-config.js` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
7. Publique as regras contidas em `firestore.rules` no Firestore.

## Estrutura usada

- `users/{uid}` — perfil básico do jogador.
- `users/{uid}/state/{stateId}` — cada chave persistente do ValeDouro, sincronizada separadamente.

O `uid` do Firebase é a identidade permanente do jogador. O e-mail não é usado como chave.

## Comportamento de sincronização

- Firestore: fonte de verdade quando o jogador está autenticado.
- localStorage: cache local e modo contingência/offline.
- Primeiro login sem save na nuvem: o progresso local é enviado automaticamente.
- Login em outro dispositivo: o progresso salvo na nuvem é carregado para o navegador.
- Alterações locais são sincronizadas automaticamente após gravações do jogo.
- O jogador também pode usar o botão **Sincronizar**.
- Cada estado mantém revisão, horário de modificação e `deviceId` para reduzir sobrescritas indevidas.

## Segurança

A configuração pública do Firebase pode permanecer no frontend. A proteção dos dados depende das regras do Firestore. As regras fornecidas permitem que cada usuário leia e grave somente o próprio documento e sua subcoleção `state`.

Nunca inclua chaves administrativas, credenciais de Service Account ou outros segredos no repositório público.
