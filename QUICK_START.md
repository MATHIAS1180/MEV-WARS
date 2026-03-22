# 🚀 Quick Start - MEV Wars

## ⚡ Deploy in 10 Minutes

### Step 1: Deploy Smart Contract (3 min)

1. Open **https://beta.solpg.io**
2. New Project → Anchor
3. Copy `solpg-program.rs` content
4. Click **Build** (wait 1-2 min)
5. Click **Deploy** → Devnet
6. **COPY THE PROGRAM ID** (ex: `7xK...abc`)

### Step 2: Update Frontend (1 min)

Edit `utils/anchor.ts`:
```typescript
export const PROGRAM_ID = new PublicKey("PASTE_YOUR_PROGRAM_ID_HERE");
```

### Step 3: Test Locally (2 min)

```bash
npm run dev
```

Go to http://localhost:3000 and test with a devnet wallet.

### Step 4: Initialize Rooms (2 min)

Get your wallet keypair:
```bash
# If you have Solana CLI
solana address -k ~/.config/solana/id.json
cat ~/.config/solana/id.json
```

Update `.env.local`:
```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
CRANK_PRIVATE_KEY=[paste your keypair array here]
```

Run:
```bash
npx ts-node scripts/init-rooms.ts
```

### Step 5: Deploy to Vercel (2 min)

```bash
git add .
git commit -m "MEV Wars ready"
git push
```

1. Go to **https://vercel.com**
2. Import your GitHub repo
3. Add env var: `NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com`
4. Deploy

**Done! Your casino is live! 🎉**

---

## 🎮 Test the Game

1. Go to your Vercel URL
2. Connect Phantom wallet
3. Get devnet SOL: https://faucet.solana.com
4. Click "JOIN BLOCK"
5. Wait for 3 players or 30s
6. Winner gets 95% of the pot!

---

## 📁 Files You Created

- ✅ `solpg-program.rs` - Smart contract for Solana Playground
- ✅ `DEPLOY_INSTRUCTIONS.md` - Full deployment guide
- ✅ `scripts/init-rooms.ts` - Initialize game rooms
- ✅ `README.md` - Project documentation
- ✅ `vercel.json` - Vercel configuration

---

## 🆘 Troubleshooting

**"Program not found"**
→ Update Program ID in `utils/anchor.ts`

**"Account does not exist"**
→ Run `npx ts-node scripts/init-rooms.ts`

**"Insufficient funds"**
→ Get SOL from https://faucet.solana.com

**Vercel build fails**
→ Check build logs, usually a missing dependency

---

## 🔥 Next Steps

- [ ] Test with friends (need 3 players)
- [ ] Share on Twitter
- [ ] Add custom domain on Vercel
- [ ] Deploy to mainnet (change RPC URL)
- [ ] Add analytics (Vercel Analytics)

---

**Need help?** Check `DEPLOY_INSTRUCTIONS.md` for detailed steps.
