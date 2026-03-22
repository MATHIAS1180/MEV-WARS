# Fix Solana Test Validator - Error 1314

## Problème
`solana-test-validator` échoue avec l'erreur 1314 (privilège manquant pour créer des symlinks).

## Solution 1 : Activer le Mode Développeur (Recommandé)

1. Ouvre **Paramètres Windows** (Win + I)
2. Va dans **Confidentialité et sécurité** → **Pour les développeurs**
3. Active **Mode développeur**
4. Redémarre le terminal PowerShell
5. Relance `.\start-validator.ps1`

## Solution 2 : Utiliser Devnet (Plus rapide pour tester)

Au lieu de localhost, utilise devnet où le programme est déjà déployé :

### Étape 1 : Mettre à jour .env.local
```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
CRANK_PRIVATE_KEY=placeholder
```

### Étape 2 : Redémarrer le frontend
Le site va maintenant pointer sur devnet. Tu peux tester immédiatement !

## Solution 3 : Lancer en tant qu'Administrateur

1. Ferme tous les terminaux
2. Ouvre PowerShell **en tant qu'Administrateur** (clic droit → Exécuter en tant qu'administrateur)
3. Va dans le dossier du projet
4. Lance `.\start-validator.ps1`

## Vérifier que ça marche

Une fois le validator lancé, dans un autre terminal :
```powershell
$env:PATH = "$env:USERPROFILE\.solana\solana-release\bin;$env:PATH"
solana cluster-version
```

Si ça affiche une version, le validator tourne !

## Pour tester maintenant sans attendre

Je recommande **Solution 2** (devnet) — ça marche immédiatement sans config Windows.
