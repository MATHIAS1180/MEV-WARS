# MEV Wars Casino 🎰⚡

A decentralized casino game on Solana where players compete to capture blocks and extract MEV rewards. Built with provably fair on-chain randomness.

![MEV Wars](https://img.shields.io/badge/Solana-Casino-purple?style=for-the-badge&logo=solana)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Anchor](https://img.shields.io/badge/Anchor-0.29-coral?style=for-the-badge)

## 🎮 Game Mechanics

- **Unlimited Players**: No cap on searchers per block
- **1 Winner per 3 Players**: 6 players = 2 winners, 9 players = 3 winners
- **95% Prize Pool**: Winners split 95% of the pot
- **5% House Edge**: Sustainable casino economics
- **30s Block Timer**: Automatic refund if <3 players
- **Provably Fair**: PRNG via future block hash (unpredictable at deposit time)

## 🚀 Tech Stack

- **Smart Contract**: Rust + Anchor Framework
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Blockchain**: Solana (Devnet/Mainnet)
- **Wallet**: Phantom, Solflare, etc.
- **Animations**: Framer Motion
- **Notifications**: Sonner

## 📦 Project Structure

```
mev-wars/
├── programs/
│   └── solana_russian_roulette/
│       └── src/
│           └── lib.rs              # Smart contract
├── app/
│   ├── page.tsx                    # Main game UI
│   └── api/
│       └── crank/
│           └── route.ts            # Auto-resolver API
├── components/
│   ├── ArenaChamber.tsx            # Game chamber
│   ├── RouletteBarrel.tsx          # 3D barrel animation
│   └── ...
├── hooks/
│   └── useGame.ts                  # Game state management
├── utils/
│   └── anchor.ts                   # Program ID & IDL
├── scripts/
│   ├── crank.ts                    # Crank bot (local)
│   └── init-rooms.ts               # Initialize game rooms
└── solpg-program.rs                # Ready for Solana Playground
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Solana wallet with devnet SOL

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/mev-wars.git
cd mev-wars

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com" > .env.local
echo "CRANK_PRIVATE_KEY=placeholder" >> .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Deployment

### 1. Deploy Smart Contract

1. Go to [Solana Playground](https://beta.solpg.io)
2. Create new Anchor project
3. Copy content from `solpg-program.rs`
4. Build & Deploy to Devnet
5. Copy the Program ID

### 2. Update Frontend

Update `utils/anchor.ts`:
```typescript
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

### 3. Initialize Rooms

```bash
# Set your keypair in .env.local
CRANK_PRIVATE_KEY=[your,keypair,array]

# Run initialization
npx ts-node scripts/init-rooms.ts
```

### 4. Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Ready for production"
git push

# Deploy on Vercel
# 1. Import GitHub repo
# 2. Add environment variables:
#    NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
# 3. Deploy
```

## 🎲 How to Play

1. **Connect Wallet**: Use Phantom or Solflare
2. **Get Devnet SOL**: [Solana Faucet](https://faucet.solana.com)
3. **Choose Room**: 0.01, 0.1, or 1.0 SOL
4. **Join Block**: Submit your bundle to the mempool
5. **Wait**: Game resolves when 3+ players join or 30s expires
6. **Win**: 1 winner per 3 players, 95% prize pool split

## 🔐 Security Features

- **Provably Fair RNG**: Uses future block hash (unpredictable at deposit)
- **No Rug Pull**: All funds locked in PDA, automatic distribution
- **Open Source**: Verify the code yourself
- **Auditable**: Every game on Solana Explorer

## 📊 SEO Keywords

MEV Wars, Solana Casino, Decentralized Gambling, On-chain Casino, Provably Fair, Crypto Casino, Blockchain Gaming, MEV Extraction, Front-running Game, Solana DeFi, Web3 Casino, Smart Contract Casino

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

MIT License - see LICENSE file

## 🔗 Links

- **Live Demo**: [mev-wars.vercel.app](https://mev-wars.vercel.app)
- **Solana Explorer**: [View Program](https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet)
- **Twitter**: [@mevwars](https://twitter.com/mevwars)

## 🆘 Support

- Discord: [Join Server](https://discord.gg/mevwars)
- Docs: [Read Documentation](./DEPLOY_INSTRUCTIONS.md)
- Issues: [GitHub Issues](https://github.com/yourusername/mev-wars/issues)

---

Built with ❤️ on Solana
