# 🚀 DÉPLOIE LE SMART CONTRACT MAINTENANT

## ✅ Le problème est fixé !
`MAX_PLAYERS` réduit de 100 à 30 pour éviter le stack overflow.

---

## 📋 ÉTAPES RAPIDES (5 minutes)

### 1️⃣ Ouvre Solana Playground
👉 **https://beta.solpg.io**

### 2️⃣ Crée un nouveau projet
- Clique sur **"New Project"**
- Choisis **"Anchor"**
- Nomme-le **"mev-wars"**

### 3️⃣ Copie le code
- Ouvre le fichier **`solpg-program.rs`** dans ton éditeur
- **Sélectionne tout** (Ctrl+A)
- **Copie** (Ctrl+C)
- Dans Solana Playground, ouvre **`src/lib.rs`**
- **Sélectionne tout** le code existant
- **Colle** le nouveau code (Ctrl+V)

### 4️⃣ Build
- Clique sur l'icône **🔨 Build** (en haut à gauche)
- Attends 1-2 minutes
- Tu devrais voir : ✅ **"Build successful"**

### 5️⃣ Deploy sur Devnet
- Clique sur **"Deploy"**
- Choisis **"Devnet"**
- Confirme la transaction dans ton wallet
- Attends 10-20 secondes

### 6️⃣ COPIE LE PROGRAM ID
Tu verras quelque chose comme :
```
Program Id: 7xKj9...abc123
```
**COPIE CE PROGRAM ID !** Tu en auras besoin.

---

## 🔧 METS À JOUR LE FRONTEND

### 1️⃣ Édite `utils/anchor.ts`
Trouve cette ligne :
```typescript
export const PROGRAM_ID = new PublicKey("88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd");
```

Remplace par :
```typescript
export const PROGRAM_ID = new PublicKey("TON_NOUVEAU_PROGRAM_ID_ICI");
```

### 2️⃣ Push sur GitHub
```bash
git add utils/anchor.ts
git commit -m "Update Program ID"
git push
```

Vercel redéploiera automatiquement en 2-3 minutes.

---

## 🎮 INITIALISE LES ROOMS

### Option A : Via Solana Playground (Recommandé)

Dans l'onglet **"Test"** de Solana Playground, exécute :

```javascript
// Room 1: 0.01 SOL
const [gamePda101] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([101])],
  pg.program.programId
);

await pg.program.methods
  .initializeGame(101, new anchor.BN(0.01 * 1e9))
  .accounts({
    game: gamePda101,
    authority: pg.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("✅ Room 101 initialized");

// Room 2: 0.1 SOL
const [gamePda102] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([102])],
  pg.program.programId
);

await pg.program.methods
  .initializeGame(102, new anchor.BN(0.1 * 1e9))
  .accounts({
    game: gamePda102,
    authority: pg.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("✅ Room 102 initialized");

// Room 3: 1.0 SOL
const [gamePda103] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([103])],
  pg.program.programId
);

await pg.program.methods
  .initializeGame(103, new anchor.BN(1.0 * 1e9))
  .accounts({
    game: gamePda103,
    authority: pg.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("✅ Room 103 initialized");
```

### Option B : Via Script Local

Mets à jour `.env.local` avec ta clé privée :
```env
CRANK_PRIVATE_KEY=[ton,keypair,array]
```

Puis lance :
```bash
npx ts-node scripts/init-rooms.ts
```

---

## ✅ TESTE LE JEU

1. Va sur **https://mev-wars-casino.vercel.app**
2. Connecte ton wallet Phantom/Solflare
3. Assure-toi d'avoir du SOL devnet : https://faucet.solana.com
4. Clique **"JOIN BLOCK"**
5. La transaction devrait passer ! 🎉

---

## 🎯 CHECKLIST FINALE

- [ ] Smart contract déployé sur Solana Playground
- [ ] Program ID copié
- [ ] `utils/anchor.ts` mis à jour avec le nouveau Program ID
- [ ] Changements pushés sur GitHub
- [ ] Vercel a redéployé (check https://vercel.com/dashboard)
- [ ] Les 3 rooms sont initialisées (101, 102, 103)
- [ ] Test réussi sur le site live

---

## 🆘 BESOIN D'AIDE ?

**Erreur "Program not found"**
→ Le Program ID dans `utils/anchor.ts` n'est pas le bon

**Erreur "Account does not exist"**
→ Les rooms ne sont pas initialisées, lance le script d'init

**Erreur "Insufficient funds"**
→ Airdrop du SOL devnet : https://faucet.solana.com

---

**C'est parti ! Deploy maintenant ! 🚀**
