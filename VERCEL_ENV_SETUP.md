# Configuration Vercel - Variables d'environnement

## Problème actuel

Le refund automatique ne fonctionne pas après 30 secondes car la variable `CRANK_PRIVATE_KEY` n'est probablement pas configurée sur Vercel.

## Variables d'environnement requises

### 1. NEXT_PUBLIC_RPC_URL
- **Valeur** : `https://api.devnet.solana.com`
- **Environnement** : Production, Preview, Development
- **Description** : URL du RPC Solana Devnet

### 2. CRANK_PRIVATE_KEY
- **Valeur** : Ta clé privée du wallet crank (format base58 ou JSON array)
- **Environnement** : Production, Preview, Development
- **Description** : Clé privée utilisée pour signer les transactions de refund/settlement
- **IMPORTANT** : Cette clé doit avoir des SOL sur Devnet pour payer les frais de transaction

## Comment configurer sur Vercel

### Étape 1 : Obtenir la clé privée du crank

Tu as plusieurs options :

**Option A : Utiliser ta clé Solana CLI existante**
```bash
cat ~/.config/solana/id.json
```
Copie le contenu (format: `[123,45,67,...]`)

**Option B : Créer une nouvelle clé pour le crank**
```bash
solana-keygen new --outfile crank-keypair.json
cat crank-keypair.json
```

**Option C : Convertir en base58**
```bash
solana-keygen pubkey crank-keypair.json
# Puis utilise un outil pour convertir en base58
```

### Étape 2 : Ajouter des SOL au wallet crank

```bash
# Obtenir l'adresse publique
solana-keygen pubkey ~/.config/solana/id.json

# Airdrop sur Devnet
solana airdrop 2 <ADRESSE_PUBLIQUE> --url devnet
```

### Étape 3 : Configurer sur Vercel

1. Va sur https://vercel.com/dashboard
2. Clique sur ton projet "mev-wars-casino"
3. Va dans "Settings" → "Environment Variables"
4. Ajoute les variables :

**NEXT_PUBLIC_RPC_URL**
- Name: `NEXT_PUBLIC_RPC_URL`
- Value: `https://api.devnet.solana.com`
- Environments: ✅ Production ✅ Preview ✅ Development

**CRANK_PRIVATE_KEY**
- Name: `CRANK_PRIVATE_KEY`
- Value: `[123,45,67,...]` (ton array JSON de 64 nombres)
- Environments: ✅ Production ✅ Preview ✅ Development

5. Clique sur "Save"

### Étape 4 : Redéployer

1. Va dans "Deployments"
2. Clique sur le dernier déploiement
3. Clique sur "..." → "Redeploy"
4. Attends 2-3 minutes

## Vérification

### Test 1 : Vérifier que les variables sont configurées

Ouvre la console du navigateur sur https://mev-wars-casino.vercel.app et vérifie :
```javascript
// Cette variable devrait être visible (NEXT_PUBLIC_)
console.log(process.env.NEXT_PUBLIC_RPC_URL)
```

### Test 2 : Tester le crank manuellement

Ouvre la console du navigateur et exécute :
```javascript
fetch('/api/crank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomId: 101 })
}).then(r => r.json()).then(console.log)
```

Tu devrais voir :
- Si pas de joueurs : `{ error: 'Game is empty' }`
- Si <3 joueurs et timer pas expiré : `{ error: 'Timer has not expired yet' }`
- Si <3 joueurs et timer expiré : `{ success: true, action: 'refund', signature: '...' }`

### Test 3 : Tester le refund complet

1. Connecte ton wallet
2. Rejoins une room (0.01 SOL)
3. Attends 30 secondes
4. Le crank devrait automatiquement :
   - Appeler `/api/crank`
   - Exécuter `refund_expired_game`
   - Rembourser ton wallet
   - Afficher une notification "BLOCK REJECTED: Refund processed automatically"

## Dépannage

### Erreur : "CRANK_PRIVATE_KEY not set"
→ La variable n'est pas configurée sur Vercel. Suis l'Étape 3 ci-dessus.

### Erreur : "Invalid CRANK_PRIVATE_KEY format"
→ Le format de la clé est incorrect. Utilise le format JSON array : `[123,45,67,...]`

### Erreur : "Insufficient funds"
→ Le wallet crank n'a pas assez de SOL. Fais un airdrop :
```bash
solana airdrop 2 <ADRESSE_CRANK> --url devnet
```

### Le timer atteint 0:00 mais rien ne se passe
→ Ouvre la console du navigateur (F12) et regarde les erreurs
→ Vérifie que `triggerCrank()` est bien appelé
→ Vérifie la réponse de `/api/crank`

## Alternative : Crank externe

Si tu veux un crank qui tourne en continu (plus fiable), tu peux :

1. Déployer `scripts/crank.ts` sur un serveur (Heroku, Railway, etc.)
2. Ou utiliser un service comme GitHub Actions pour exécuter le crank toutes les minutes
3. Ou utiliser Vercel Cron Jobs (nécessite un plan payant)

Pour l'instant, le crank via l'API route devrait suffire pour les tests.
