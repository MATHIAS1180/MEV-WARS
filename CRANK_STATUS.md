# ✅ Crank Status - OPÉRATIONNEL

## Configuration actuelle

✅ **Wallet Crank**
- Adresse : `H56q3f37mMAAr147ZWKy6piLpCUZRQV8ic5YwosnEVp5`
- Solde Devnet : 0.99986 SOL
- Clé privée configurée sur Vercel : ✅

✅ **API Crank**
- Endpoint : `https://mev-wars-casino.vercel.app/api/crank`
- Status : Opérationnel
- Dernière vérification : Succès (erreur "Not enough players" est normale)

✅ **Smart Contract**
- Program ID : `2DKNipJx8QpQ1BzEScj3YoJ3CwpEbzyeEFVYvPbSsEtV`
- Network : Solana Devnet
- Rooms : 101, 102, 103

## Comment ça marche maintenant

### Scénario 1 : Refund automatique (<3 joueurs après 30s)

1. Un joueur rejoint une room (ex: 0.01 SOL)
2. Le timer de 30 secondes démarre
3. Aucun autre joueur ne rejoint
4. Après 30 secondes :
   - Le frontend appelle automatiquement `/api/crank`
   - Le crank vérifie : `playerCount < 3` et `timer expired`
   - Le crank exécute `refund_expired_game` sur le smart contract
   - Le joueur reçoit son remboursement (0.01 SOL)
   - Une notification s'affiche : "BLOCK REJECTED: Refund processed automatically"

### Scénario 2 : Settlement automatique (≥3 joueurs)

1. 3+ joueurs rejoignent une room
2. Le frontend appelle automatiquement `/api/crank`
3. Le crank vérifie : `playerCount >= 3`
4. Le crank exécute `settle_winner` sur le smart contract
5. Les gagnants (1 par 3 joueurs) reçoivent leur part (95% du pot)
6. Le trésor reçoit 5%
7. Les animations de résultat s'affichent

### Scénario 3 : Settlement après timer (≥3 joueurs)

1. 3+ joueurs rejoignent une room
2. Le timer de 30 secondes s'écoule
3. Le frontend appelle automatiquement `/api/crank`
4. Même processus que le Scénario 2

## Test manuel

Pour tester le refund automatique :

1. Ouvre https://mev-wars-casino.vercel.app
2. Connecte ton wallet
3. Ouvre la console du navigateur (F12)
4. Rejoins une room (0.01 SOL)
5. Attends 30 secondes
6. Tu devrais voir dans la console :
   ```
   [triggerCrank] Calling crank for room 101...
   [triggerCrank] Response: { success: true, action: 'refund', signature: '...' }
   ```
7. Une notification apparaît : "Refund processed! Check your wallet."
8. Vérifie ton solde : tu as récupéré tes 0.01 SOL (moins les frais de transaction initiaux)

## Dépannage

### Le timer atteint 0:00 mais rien ne se passe

1. Ouvre la console (F12)
2. Vérifie les logs :
   - `[triggerCrank] Calling crank...` → Le crank est appelé ✅
   - `[triggerCrank] Response: ...` → Regarde la réponse
3. Si erreur "Timer has not expired yet" :
   - Le `blockStartTime` du smart contract n'est pas synchronisé
   - Attends quelques secondes de plus
4. Si erreur "CRANK_PRIVATE_KEY not set" :
   - La variable n'est pas configurée sur Vercel
   - Vérifie Settings → Environment Variables

### Le refund ne s'affiche pas dans mon wallet

1. Vérifie la transaction sur Solana Explorer :
   - Copie la signature depuis la console
   - Va sur https://explorer.solana.com/tx/[SIGNATURE]?cluster=devnet
2. Vérifie que la transaction est "Success"
3. Rafraîchis ton wallet (parfois il faut attendre 10-20 secondes)

### Erreur "Insufficient funds"

Le wallet crank n'a plus de SOL. Fais un airdrop :
```bash
solana airdrop 2 H56q3f37mMAAr147ZWKy6piLpCUZRQV8ic5YwosnEVp5 --url devnet
```

## Prochaines étapes

Pour une solution plus robuste en production :

1. **Crank externe** : Déployer `scripts/crank.ts` sur un serveur qui tourne 24/7
2. **Monitoring** : Ajouter des alertes si le crank échoue
3. **Backup crank** : Avoir plusieurs wallets crank pour la redondance
4. **Mainnet** : Migrer vers Mainnet avec un wallet crank bien financé

Pour l'instant, le crank via l'API route fonctionne parfaitement pour Devnet ! 🚀
