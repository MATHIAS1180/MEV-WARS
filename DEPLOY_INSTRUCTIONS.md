# MEV Wars - Deployment Instructions

## 🎯 Étape 1 : Déployer le Smart Contract sur Solana Playground

### 1.1 Ouvre Solana Playground
Va sur **https://beta.solpg.io**

### 1.2 Crée un nouveau projet Anchor
- Clique sur "New Project"
- Choisis "Anchor"
- Nomme-le "mev-wars"

### 1.3 Remplace le code
- Ouvre `src/lib.rs`
- Copie tout le contenu de `solpg-program.rs`
- Colle-le dans l'éditeur Solana Playground

### 1.4 Build le programme
- Clique sur "Build" (icône marteau)
- Attends la compilation (~1-2 min)

### 1.5 Deploy sur Devnet
- Clique sur "Deploy"
- Choisis "Devnet"
- Confirme la transaction
- **COPIE LE PROGRAM ID** qui s'affiche (ex: `7xK...abc`)

### 1.6 Note aussi le Treasury Pubkey
Le treasury est déjà défini dans le code :
```
FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt
```

---

## 🚀 Étape 2 : Mettre à jour le Frontend

### 2.1 Mets à jour le Program ID
Remplace `88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd` par ton nouveau Program ID dans :

**Fichier 1 : `utils/anchor.ts`**
```typescript
export const PROGRAM_ID = new PublicKey("TON_NOUVEAU_PROGRAM_ID_ICI");
```

**Fichier 2 : `Anchor.toml`**
```toml
[programs.devnet]
solana_russian_roulette = "TON_NOUVEAU_PROGRAM_ID_ICI"
```

### 2.2 Vérifie .env.local
```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
CRANK_PRIVATE_KEY=placeholder
```

### 2.3 Test en local
```bash
npm run dev
```

Va sur http://localhost:3000 et teste avec un wallet devnet.

---

## 🌐 Étape 3 : Déployer sur Vercel

### 3.1 Prépare le projet
```bash
# Assure-toi que tout est commité
git add .
git commit -m "MEV Wars - Ready for production"
git push
```

### 3.2 Connecte à Vercel
- Va sur **https://vercel.com**
- Clique "Add New Project"
- Importe ton repo GitHub
- Framework Preset : **Next.js** (détecté automatiquement)

### 3.3 Configure les variables d'environnement
Dans Vercel, ajoute :

```
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
CRANK_PRIVATE_KEY=placeholder
```

### 3.4 Deploy
- Clique "Deploy"
- Attends 2-3 minutes
- Ton site sera live sur `https://ton-projet.vercel.app`

---

## 🔧 Étape 4 : Initialiser les Rooms (Important !)

Une fois déployé, tu dois initialiser les 3 rooms (101, 102, 103).

### Option A : Via Solana Playground
Dans l'onglet "Test" de Solana Playground :

```javascript
// Room 1 : 0.01 SOL
await program.methods
  .initializeGame(101, new BN(0.01 * 1e9))
  .accounts({
    game: gamePda101,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Room 2 : 0.1 SOL
await program.methods
  .initializeGame(102, new BN(0.1 * 1e9))
  .accounts({
    game: gamePda102,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Room 3 : 1.0 SOL
await program.methods
  .initializeGame(103, new BN(1.0 * 1e9))
  .accounts({
    game: gamePda103,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Option B : Via script Node.js
Crée `init-rooms.ts` :

```typescript
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { IDL, PROGRAM_ID } from './utils/anchor';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const wallet = Keypair.fromSecretKey(/* ta clé privée */);
const provider = new AnchorProvider(connection, new Wallet(wallet), {});
const program = new Program(IDL, PROGRAM_ID, provider);

async function initRooms() {
  const rooms = [
    { id: 101, fee: 0.01 * 1e9 },
    { id: 102, fee: 0.1 * 1e9 },
    { id: 103, fee: 1.0 * 1e9 },
  ];

  for (const room of rooms) {
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([room.id])],
      PROGRAM_ID
    );

    try {
      await program.methods
        .initializeGame(room.id, new BN(room.fee))
        .accounts({
          game: gamePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`✅ Room ${room.id} initialized`);
    } catch (e) {
      console.log(`⚠️ Room ${room.id} already exists or error:`, e.message);
    }
  }
}

initRooms();
```

Lance avec :
```bash
npx ts-node init-rooms.ts
```

---

## 🎮 Étape 5 : Tester en Production

1. Va sur ton site Vercel
2. Connecte un wallet avec du SOL devnet
3. Clique "JOIN BLOCK"
4. Attends que 3 joueurs rejoignent (ou 30s)
5. Le crank résout automatiquement

---

## 📊 Monitoring

### Voir les transactions
- Solana Explorer : `https://explorer.solana.com/address/TON_PROGRAM_ID?cluster=devnet`

### Logs du programme
```bash
solana logs TON_PROGRAM_ID --url devnet
```

### Check les rooms
```bash
solana account GAME_PDA_ADDRESS --url devnet
```

---

## 🔥 Passer en Mainnet (Plus tard)

1. Change `declare_id!()` dans le smart contract
2. Redeploy sur mainnet via Solana Playground
3. Mets à jour `.env.local` :
   ```
   NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
   ```
4. Redeploy sur Vercel

---

## ✅ Checklist Finale

- [ ] Smart contract déployé sur devnet
- [ ] Program ID copié
- [ ] `utils/anchor.ts` mis à jour
- [ ] `Anchor.toml` mis à jour
- [ ] Test en local OK
- [ ] Rooms initialisées (101, 102, 103)
- [ ] Déployé sur Vercel
- [ ] Test en production OK

---

## 🆘 Troubleshooting

### "Program account not found"
→ Le program ID n'est pas le bon, vérifie `utils/anchor.ts`

### "Account does not exist"
→ Les rooms ne sont pas initialisées, lance `init-rooms.ts`

### "Insufficient funds"
→ Airdrop du SOL devnet : https://faucet.solana.com

### Vercel build fail
→ Check les logs, souvent c'est un import manquant ou une typo

---

Bon déploiement ! 🚀
