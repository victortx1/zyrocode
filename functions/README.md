# ZYRO CODE — Cloud Functions (Etapa 2)

Funções callable (v2, região `southamerica-east1`):

| Função | Uso |
|--------|-----|
| `completeLesson` | XP, moedas, aula/curso/conquista, missões, leaderboard |
| `claimMission` | Recompensa diária (transação) |
| `purchaseShopItem` | Compras da loja |
| `equipCosmetic` | Equipar char / banner / avatar já possuído |

## Estrutura

```
functions/
  index.js              # exports
  src/
    admin.js            # Firebase Admin
    logger.js           # logs JSON sem PII
    catalog.js          # preços/recompensas (espelho do front)
    leaderboard.js
    audit.js
    completeLesson.js
    claimMission.js
    purchaseShopItem.js
    equipCosmetic.js
```

Cliente: `js/game-api.js` (httpsCallable + emulador local).

## Testar localmente

1. Instalar dependências:

```bash
cd functions
npm install
cd ..
```

2. Subir emuladores (Firestore + Auth + Functions):

```bash
firebase emulators:start
```

3. No navegador (localhost), o `game-api.js` conecta automaticamente ao emulador na porta `5001`.

4. Desativar cloud só para debug legado:

```javascript
localStorage.setItem("zyroCloudEconomy", "false");
```

## Deploy (ordem recomendada)

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Logs

```bash
firebase functions:log
```

Logs usam JSON com `uid`, `lessonId`, `itemId` — sem email ou apelido.
