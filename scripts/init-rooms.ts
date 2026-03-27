/**
 * Initialize the 3 game rooms on devnet
 * 
 * Usage:
 *   npx ts-node scripts/init-rooms.ts
 * 
 * Make sure to set your private key in .env.local:
 *   CRANK_PRIVATE_KEY=[your keypair array or base58]
 */

import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { PROGRAM_ID, ROOMS } from '../config/constants';
import { IDL } from '../utils/anchor';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

function loadKeypair(): Keypair {
  const raw = process.env.CRANK_PRIVATE_KEY;
  if (!raw || raw === 'placeholder') {
    throw new Error('Set CRANK_PRIVATE_KEY in .env.local with your keypair');
  }

  const sanitized = raw.trim();
  if (sanitized.startsWith('[')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(sanitized)));
  }
  if (sanitized.includes(',')) {
    return Keypair.fromSecretKey(Uint8Array.from(sanitized.split(',').map(Number)));
  }
  return Keypair.fromSecretKey(bs58.decode(sanitized));
}

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  const wallet = loadKeypair();

  console.log(`🔑 Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`🌐 RPC: ${RPC_URL}`);
  console.log(`📦 Program: ${PROGRAM_ID.toBase58()}`);
  console.log('');

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / 1e9} SOL`);

  if (balance < 0.1 * 1e9) {
    console.log('⚠️  Low balance! Get devnet SOL from https://faucet.solana.com');
    console.log('');
  }

  const provider = new AnchorProvider(
    connection,
    new Wallet(wallet),
    { commitment: 'confirmed' }
  );
  const program = new Program(IDL as any, PROGRAM_ID, provider);

  for (const room of ROOMS) {
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([room.id])],
      PROGRAM_ID
    );

    console.log(`\n🎮 Room ${room.id} (${room.label})`);
    console.log(`   PDA: ${gamePda.toBase58()}`);

    // Check if already initialized
    const accountInfo = await connection.getAccountInfo(gamePda);
    if (accountInfo) {
      console.log(`   ✅ Already initialized (${accountInfo.data.length} bytes)`);
      continue;
    }

    try {
      const tx = await program.methods
        .initializeGame(room.id, new BN(room.entryFee))
        .accounts({
          game: gamePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`   ✅ Initialized! TX: ${tx}`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  console.log('\n✨ Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
