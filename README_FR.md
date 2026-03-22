# 🎰 MEV Wars Casino - Guide Complet

## 🎉 FÉLICITATIONS ! TON CASINO EST DÉPLOYÉ !

### 🌐 URLs
- **Site Live** : https://mev-wars-casino.vercel.app
- **GitHub** : https://github.com/MATHIAS1180/MEV-WARS
- **Program ID** : `78sJmBoRvgC7LrCi85otiH5ebxVLDYwW6jUMBLd5JSco`

---

## ⚡ DERNIÈRE ÉTAPE : INITIALISE LES ROOMS

### 1. Va sur Solana Playground
👉 https://beta.solpg.io

### 2. Ouvre ton projet MEV Wars

### 3. Clique sur l'onglet "Test" (en bas)

### 4. Copie-colle ce code :

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
console.log("🎉 All rooms ready!");
```

### 5. Clique "Run" ou Ctrl+Enter

Tu devrais voir :
```
✅ Room 101 initialized
✅ Room 102 initialized
✅ Room 103 initialized
🎉 All rooms ready!
```

---

## 🎮 TESTE LE JEU

### 1. Va sur ton site
https://mev-wars-casino.vercel.app

### 2. Connecte ton wallet
Phantom ou Solflare

### 3. Get devnet SOL
https://faucet.solana.com

### 4. Joue !
Clique "JOIN BLOCK" et teste !

---

## 📊 COMMENT ÇA MARCHE

### Règles :
- **3 joueurs minimum** pour lancer une partie
- **1 gagnant par 3 joueurs** (6 joueurs = 2 gagnants)
- **95% du pot** va aux gagnants
- **5% house edge** va au trésor
- **Timer 30s** : remboursement si <3 joueurs

### Exemple :
```
3 joueurs × 0.1 SOL = 0.3 SOL pot
- 95% = 0.285 SOL → Gagnant
- 5% = 0.015 SOL → Trésor
```

---

## 🔧 FICHIERS IMPORTANTS

### Documentation :
- `SUCCESS.md` - Récapitulatif complet
- `FINAL_STEPS.md` - Dernières étapes
- `DEPLOY_NOW.md` - Guide de déploiement
- `FIXED_SMART_CONTRACT.md` - Fix du stack overflow

### Code :
- `solpg-program.rs` - Smart contract (copie pour Solana Playground)
- `programs/solana_russian_roulette/src/lib.rs` - Smart contract local
- `utils/anchor.ts` - Configuration frontend
- `app/page.tsx` - Interface principale
- `hooks/useGame.ts` - Logique du jeu

### Scripts :
- `scripts/init-rooms.ts` - Initialisation des rooms (local)
- `init-rooms-solpg.js` - Initialisation des rooms (Solana Playground)
- `scripts/crank.ts` - Bot de résolution automatique

---

## 🚀 PROCHAINES ÉTAPES

### Court terme :
- [ ] Initialise les 3 rooms
- [ ] Teste avec des amis
- [ ] Partage sur Twitter

### Moyen terme :
- [ ] Ajoute un domaine custom
- [ ] Ajoute des analytics
- [ ] Crée un bot Discord

### Long terme :
- [ ] Deploy sur mainnet
- [ ] Ajoute un leaderboard
- [ ] Système de referral

---

## 🆘 PROBLÈMES ?

### "Program not found"
→ Attends que Vercel finisse de déployer (2-3 min)

### "Account does not exist"
→ Les rooms ne sont pas initialisées

### "Insufficient funds"
→ Airdrop du SOL devnet : https://faucet.solana.com

---

## 📞 SUPPORT

- **GitHub Issues** : https://github.com/MATHIAS1180/MEV-WARS/issues
- **Solana Explorer** : https://explorer.solana.com/address/78sJmBoRvgC7LrCi85otiH5ebxVLDYwW6jUMBLd5JSco?cluster=devnet

---

## 🎉 C'EST TOUT !

Ton casino MEV Wars est maintenant **100% fonctionnel** ! 🚀

**Initialise les rooms et commence à jouer !** 🎰

---

**Bon jeu ! ⚡**
