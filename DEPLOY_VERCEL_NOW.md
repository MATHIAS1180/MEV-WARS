# 🚀 Déploiement Vercel - MAINTENANT

## ✅ Changements pushés sur GitHub !

Vos dernières modifications (Recent Games en temps réel) sont maintenant sur GitHub.

---

## 📋 ÉTAPES POUR DÉPLOYER

### 1️⃣ Vercel va déployer automatiquement

Votre projet est déjà connecté à Vercel. Le déploiement devrait se lancer automatiquement.

**Vérifie le déploiement :**
👉 https://vercel.com/moukis-projects/mev-wars-casino

Tu devrais voir :
- 🟡 "Building..." (en cours)
- Puis 🟢 "Ready" (terminé)

Cela prend environ 2-3 minutes.

---

### 2️⃣ Vérifie les variables d'environnement

Va sur Vercel Dashboard :
👉 https://vercel.com/moukis-projects/mev-wars-casino/settings/environment-variables

**Variables requises :**

```
NEXT_PUBLIC_RPC_URL = https://api.devnet.solana.com
```

**Note :** `CRANK_PRIVATE_KEY` n'est pas nécessaire pour le frontend, seulement si tu veux un crank automatique côté serveur.

---

### 3️⃣ Accède à ton site

Une fois le déploiement terminé :

**URL de production :**
👉 https://mev-wars-casino.vercel.app

Ou vérifie ton URL exacte sur le dashboard Vercel.

---

## 🎮 TESTE LES NOUVELLES FONCTIONNALITÉS

### Recent Games en temps réel

1. Ouvre ton site
2. Connecte ton wallet
3. Change de room (0.01 SOL, 0.1 SOL, 1.0 SOL)
4. Tu devrais voir l'historique filtré par room
5. Quand une partie se termine, elle apparaît instantanément

### Indicateur Live

Tu verras un point vert qui pulse avec "Live" à côté de "Recent Games"

---

## 🔧 SI LE BUILD ÉCHOUE

### Erreur de build ?

1. Va sur Vercel Dashboard
2. Clique sur le déploiement en erreur
3. Regarde les logs

**Erreurs communes :**

**"Module not found"**
```bash
npm install
git add package-lock.json
git commit -m "fix: update dependencies"
git push
```

**"Type error"**
→ Vérifie les diagnostics TypeScript localement :
```bash
npm run build
```

---

## 📊 MONITORING

### Voir les déploiements
👉 https://vercel.com/moukis-projects/mev-wars-casino/deployments

### Voir les logs en temps réel
👉 Dashboard Vercel > Ton projet > Logs

### Analytics
👉 Dashboard Vercel > Ton projet > Analytics

---

## 🎯 CHECKLIST FINALE

- [x] Code pushé sur GitHub
- [ ] Vercel a détecté le push
- [ ] Build réussi (2-3 min)
- [ ] Variables d'environnement configurées
- [ ] Site accessible
- [ ] Recent Games fonctionne en temps réel
- [ ] Changement de room met à jour l'historique
- [ ] Indicateur "Live" visible

---

## 🆘 BESOIN D'AIDE ?

**Le déploiement ne se lance pas ?**
→ Va sur Vercel Dashboard et clique "Redeploy" manuellement

**Build timeout ?**
→ Vercel a une limite de 10 min pour le build, c'est rare mais ça peut arriver

**Site blanc après déploiement ?**
→ Ouvre la console du navigateur (F12) et regarde les erreurs

**Recent Games ne s'affiche pas ?**
→ Vérifie que `NEXT_PUBLIC_RPC_URL` est bien configuré dans Vercel

---

## 🚀 PROCHAINES ÉTAPES

Une fois déployé avec succès :

1. **Teste avec plusieurs wallets** pour voir les Recent Games se mettre à jour
2. **Partage le lien** avec tes amis pour tester
3. **Monitor les performances** sur Vercel Analytics

---

**Ton site sera live dans 2-3 minutes ! 🎉**

Vérifie ici : https://vercel.com/moukis-projects/mev-wars-casino
