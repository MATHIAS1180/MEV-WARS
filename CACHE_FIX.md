# Fix : Le site affiche encore l'ancien smart contract

## Problème

Le site affiche encore les données de l'ancien Program ID alors que le nouveau est déployé.

## Cause

Le navigateur garde en cache :
1. Les fichiers JavaScript compilés (avec l'ancien Program ID)
2. Les données de l'ancien smart contract dans le localStorage
3. Les connexions WebSocket à l'ancien Program ID

## Solution : Vider TOUT le cache

### Option 1 : Navigation privée (le plus simple)

1. Ouvre une fenêtre de navigation privée
2. Va sur https://mev-wars-casino.vercel.app
3. Connecte ton wallet
4. Tu devrais voir 0 joueurs et 0 SOL

### Option 2 : Vider le cache complet

**Chrome/Edge :**
1. Appuie sur `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Sélectionne "Tout" dans la période
3. Coche TOUTES les cases :
   - Historique de navigation
   - Cookies et autres données de sites
   - Images et fichiers en cache
   - Données de site hébergées
4. Clique sur "Effacer les données"
5. Redémarre le navigateur
6. Va sur https://mev-wars-casino.vercel.app

**Firefox :**
1. Appuie sur `Ctrl + Shift + Delete`
2. Sélectionne "Tout" dans la période
3. Coche toutes les cases
4. Clique sur "Effacer maintenant"
5. Redémarre le navigateur

### Option 3 : Vider le cache du site spécifique

**Chrome/Edge :**
1. Va sur https://mev-wars-casino.vercel.app
2. Ouvre les DevTools (`F12`)
3. Clique droit sur le bouton de rechargement
4. Sélectionne "Vider le cache et effectuer une actualisation forcée"

**Ou :**
1. Va sur https://mev-wars-casino.vercel.app
2. Ouvre les DevTools (`F12`)
3. Va dans l'onglet "Application"
4. Dans le menu de gauche, clique sur "Storage"
5. Clique sur "Clear site data"
6. Recharge la page (`F5`)

### Option 4 : Vérifier le déploiement Vercel

1. Va sur https://vercel.com/dashboard
2. Clique sur ton projet "mev-wars-casino"
3. Vérifie que le dernier déploiement est "Ready" (pas "Building")
4. Le commit doit être `6cca20b` - "Fix phantom player animations when actualPlayerCount is 0"
5. Clique sur le déploiement et vérifie l'URL de production

## Vérification que ça marche

Une fois le cache vidé, tu devrais voir :

✅ **Active Searchers** : 0 / ∞
✅ **Block Liquidity** : 0.000 SOL
✅ **Extraction Estimate** : --
✅ **Block Expiration** : --:--
✅ Aucune animation de roulette
✅ Bouton "JOIN BLOCK — 0.01 SOL" disponible

## Si ça ne marche toujours pas

Le déploiement Vercel peut prendre jusqu'à 5 minutes. Attends un peu et réessaie.

Tu peux aussi vérifier le nouveau Program ID sur Solana Explorer :
https://explorer.solana.com/address/2DKNipJx8QpQ1BzEScj3YoJ3CwpEbzyeEFVYvPbSsEtV?cluster=devnet

Il devrait afficher :
- Program ID: 2DKNipJx8QpQ1BzEScj3YoJ3CwpEbzyeEFVYvPbSsEtV
- Aucune transaction (nouveau contrat vide)

## Dernier recours : Forcer le redéploiement Vercel

Si vraiment rien ne marche :

1. Va sur https://vercel.com/dashboard
2. Clique sur ton projet
3. Va dans "Deployments"
4. Clique sur le dernier déploiement
5. Clique sur "..." → "Redeploy"
6. Attends 2-3 minutes
7. Vide le cache du navigateur
8. Recharge le site
