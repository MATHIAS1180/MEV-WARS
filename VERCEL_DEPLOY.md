# 🚀 Deploy MEV Wars sur Vercel

Le code est prêt et pushé sur GitHub ! Maintenant déploie via l'interface web Vercel.

## Étapes :

### 1. Va sur Vercel
👉 **https://vercel.com/new**

### 2. Import le projet GitHub
- Clique sur "Import Git Repository"
- Cherche **"MATHIAS1180/MEV-WARS"**
- Clique "Import"

### 3. Configure le projet
**Project Name**: `mev-wars-casino` (ou ce que tu veux)

**Framework Preset**: Next.js (détecté automatiquement)

**Root Directory**: `./` (laisser par défaut)

**Build Command**: `npm run build` (détecté automatiquement)

**Output Directory**: `.next` (détecté automatiquement)

### 4. Ajoute les variables d'environnement
Clique sur "Environment Variables" et ajoute :

```
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

(CRANK_PRIVATE_KEY n'est pas nécessaire pour le frontend)

### 5. Deploy !
- Clique sur **"Deploy"**
- Attends 2-3 minutes
- Ton site sera live sur `https://mev-wars-casino.vercel.app` (ou ton nom choisi)

---

## ✅ Après le déploiement

### Teste le site
1. Va sur ton URL Vercel
2. Connecte un wallet Phantom/Solflare
3. Assure-toi d'avoir du SOL devnet : https://faucet.solana.com
4. Clique "JOIN BLOCK"

### Note importante
⚠️ Le smart contract actuel pointe sur l'ancien Program ID. Pour utiliser le nouveau :

1. Déploie `solpg-program.rs` sur https://beta.solpg.io
2. Copie le nouveau Program ID
3. Mets à jour `utils/anchor.ts` avec le nouveau ID
4. Push sur GitHub
5. Vercel redéploiera automatiquement

---

## 🔗 Liens utiles

- **GitHub Repo**: https://github.com/MATHIAS1180/MEV-WARS
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Solana Playground**: https://beta.solpg.io

---

## 🆘 Besoin d'aide ?

Si tu veux que je configure autre chose, dis-le moi !
