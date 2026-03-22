# Déploiement Local — MEV Wars

## ✅ Déjà installé
- ✅ Rust 1.94.0
- ✅ Solana CLI 2.1.13
- ✅ Cargo

## ⚠️ Anchor CLI — Installation manuelle requise

Anchor prend ~30min à compiler. Deux options :

### Option A : Installer Anchor (recommandé)
```powershell
# Ouvre un PowerShell et lance :
$env:PATH = "$env:USERPROFILE\.solana\solana-release\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

Laisse tourner pendant 20-30 minutes. Une fois terminé :
```powershell
anchor --version
```

### Option B : Build sans Anchor (plus rapide)
```powershell
# 1. Configure Solana
$env:PATH = "$env:USERPROFILE\.solana\solana-release\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"
solana config set --url localhost
solana-keygen new --no-bip39-passphrase --outfile "$env:USERPROFILE\.config\solana\id.json"

# 2. Lance le validator (dans un terminal séparé, laisse tourner)
solana-test-validator --reset

# 3. Airdrop SOL
solana airdrop 10

# 4. Build le programme
cd "programs\solana_russian_roulette"
cargo build-sbf

# 5. Deploy
solana program deploy "target\deploy\solana_russian_roulette.so"
```

## 🚀 Lancer le projet (après deploy)

### 1. Récupère le Program ID
Après `solana program deploy`, copie le Program ID affiché.

### 2. Mets à jour les fichiers
Remplace `88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd` par ton nouveau Program ID dans :
- `Anchor.toml` → ligne `solana_russian_roulette = "..."`
- `utils/anchor.ts` → ligne `export const PROGRAM_ID = new PublicKey("...")`
- `programs/solana_russian_roulette/src/lib.rs` → ligne `declare_id!("...")`

Puis rebuild et redeploy :
```powershell
cd programs\solana_russian_roulette
cargo build-sbf
solana program deploy target\deploy\solana_russian_roulette.so
```

### 3. Crée .env.local
```env
NEXT_PUBLIC_RPC_URL=http://localhost:8899
CRANK_PRIVATE_KEY=[copie le contenu de ~/.config/solana/id.json ici]
```

### 4. Lance le frontend
```powershell
npm install
npm run dev
```

### 5. Lance le crank bot (terminal séparé)
```powershell
$env:PATH = "$env:USERPROFILE\.solana\solana-release\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"
$env:RPC_URL = "http://localhost:8899"
$env:CRANK_PRIVATE_KEY = (Get-Content "$env:USERPROFILE\.config\solana\id.json" -Raw)
npx ts-node scripts/crank.ts
```

## 📝 Résumé des terminaux nécessaires
1. **Terminal 1** : `solana-test-validator --reset` (laisse tourner)
2. **Terminal 2** : `npm run dev` (frontend)
3. **Terminal 3** : `npx ts-node scripts/crank.ts` (bot)

## 🔧 Commandes utiles
```powershell
# Voir les logs du validator
solana logs

# Check balance
solana balance

# Voir le program ID déployé
solana program show <PROGRAM_ID>

# Airdrop plus de SOL
solana airdrop 10
```

## ⚡ PATH permanent (optionnel)
Pour ne pas avoir à redéfinir PATH à chaque fois :
```powershell
[Environment]::SetEnvironmentVariable("Path", "$env:USERPROFILE\.solana\solana-release\bin;$env:USERPROFILE\.cargo\bin;" + [Environment]::GetEnvironmentVariable("Path", "User"), "User")
```

Redémarre le terminal après.
