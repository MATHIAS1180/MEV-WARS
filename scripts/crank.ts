/**
 * scripts/crank.ts
 *
 * Surveille les rooms MEV Wars et déclenche settle_winner automatiquement quand :
 *   - Le timer de 30s est écoulé depuis le 1er searcher (block_start_time)
 *   - OU un multiple de 3 searchers est atteint
 *
 * Usage:
 *   npx ts-node scripts/crank.ts
 *
 * Env vars:
 *   CRANK_PRIVATE_KEY  — clé privée du crank (base58 ou JSON array)
 *   RPC_URL            — RPC endpoint (défaut: http://localhost:8899)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || 'http://localhost:8899';
const BLOCK_EXPIRATION_SECONDS = 30;
const POLL_INTERVAL_MS = 3000;

const ROOM_IDS = [101, 102, 103];

const PROGRAM_ID = new PublicKey('6kBgAR5grqnabjUq6x5GMmjVWjHFoRJZgGcKGuy5zPJc');
const TREASURY_PUBKEY = new PublicKey('FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt');

// ─── IDL (minimal subset needed for crank) ───────────────────────────────────

const IDL: any = {
  version: '0.1.0',
  name: 'solana_russian_roulette',
  instructions: [
    {
      name: 'refundExpiredGame',
      accounts: [{ name: 'game', isMut: true, isSigner: false }],
      args: [{ name: 'roomId', type: 'u8' }],
    },
    {
      name: 'settleWinner',
      accounts: [{ name: 'game', isMut: true, isSigner: false }],
      args: [{ name: 'roomId', type: 'u8' }],
    },
  ],
  accounts: [
    {
      name: 'Game',
      type: {
        kind: 'struct',
        fields: [
          { name: 'roomId', type: 'u8' },
          { name: 'entryFee', type: 'u64' },
          { name: 'players', type: { array: ['publicKey', 100] } },
          { name: 'playerCount', type: 'u8' },
          { name: 'state', type: { defined: 'GameState' } },
          { name: 'potAmount', type: 'u64' },
          { name: 'resolveSlot', type: 'u64' },
          { name: 'lastActivityTime', type: 'i64' },
          { name: 'blockStartTime', type: 'i64' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
  types: [
    {
      name: 'GameState',
      type: { kind: 'enum', variants: [{ name: 'Waiting' }] },
    },
  ],
  errors: [],
};

// ─── Keypair loading ──────────────────────────────────────────────────────────

function loadKeypair(): Keypair {
  const raw = process.env.CRANK_PRIVATE_KEY;
  if (raw) {
    const sanitized = raw.trim();
    if (sanitized.startsWith('[')) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(sanitized)));
    }
    if (sanitized.includes(',')) {
      return Keypair.fromSecretKey(Uint8Array.from(sanitized.split(',').map(Number)));
    }
    return Keypair.fromSecretKey(bs58.decode(sanitized));
  }

  // Fallback: local Solana CLI keypair
  const defaultPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'solana', 'id.json');
  if (fs.existsSync(defaultPath)) {
    const raw = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }

  throw new Error('No keypair found. Set CRANK_PRIVATE_KEY or create ~/.config/solana/id.json');
}

// ─── Refund expired game ──────────────────────────────────────────────────────

async function refundExpiredGame(
  program: Program,
  connection: Connection,
  crankKeypair: Keypair,
  roomId: number
): Promise<void> {
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    PROGRAM_ID
  );

  const state: any = await program.account.game.fetch(gamePda);
  const playerCount: number = state.playerCount;

  if (playerCount === 0 || playerCount >= 3) return;

  const currentPlayers: PublicKey[] = (state.players as PublicKey[])
    .slice(0, playerCount)
    .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString());

  console.log(`[crank] Room ${roomId} — refunding ${playerCount} searchers...`);

  const refundTx = await program.methods
    .refundExpiredGame(roomId)
    .accounts({ game: gamePda })
    .remainingAccounts(currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })))
    .transaction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  refundTx.recentBlockhash = blockhash;
  refundTx.feePayer = crankKeypair.publicKey;

  const sim = await connection.simulateTransaction(refundTx, [crankKeypair]);
  if (sim.value.err) {
    console.error(`[crank] Room ${roomId} refund simulation failed:`, sim.value.err);
    console.error('[crank] Logs:', sim.value.logs?.slice(-5));
    return;
  }

  refundTx.sign(crankKeypair);
  const sig = await connection.sendRawTransaction(refundTx.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  console.log(`[crank] Room ${roomId} refunded! TX: ${sig}`);
}

// ─── Settle a room ────────────────────────────────────────────────────────────

async function settleRoom(
  program: Program,
  connection: Connection,
  crankKeypair: Keypair,
  roomId: number
): Promise<void> {
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    PROGRAM_ID
  );

  const state: any = await program.account.game.fetch(gamePda);
  const playerCount: number = state.playerCount;

  if (playerCount === 0) return;

  const currentPlayers: PublicKey[] = (state.players as PublicKey[])
    .slice(0, playerCount)
    .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString());

  console.log(`[crank] Room ${roomId} — settling ${playerCount} searchers...`);

  const settleTx = await program.methods
    .settleWinner(roomId)
    .accounts({ game: gamePda })
    .remainingAccounts([
      ...currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })),
      { pubkey: TREASURY_PUBKEY, isWritable: true, isSigner: false },
    ])
    .transaction();

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  settleTx.recentBlockhash = blockhash;
  settleTx.feePayer = crankKeypair.publicKey;

  const sim = await connection.simulateTransaction(settleTx, [crankKeypair]);
  if (sim.value.err) {
    console.error(`[crank] Room ${roomId} simulation failed:`, sim.value.err);
    console.error('[crank] Logs:', sim.value.logs?.slice(-5));
    return;
  }

  settleTx.sign(crankKeypair);
  const sig = await connection.sendRawTransaction(settleTx.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  console.log(`[crank] Room ${roomId} settled! TX: ${sig}`);
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');
  const crankKeypair = loadKeypair();

  console.log(`[crank] Starting. Wallet: ${crankKeypair.publicKey.toBase58()}`);
  console.log(`[crank] RPC: ${RPC_URL}`);
  console.log(`[crank] Watching rooms: ${ROOM_IDS.join(', ')}`);

  const dummyWallet = {
    publicKey: crankKeypair.publicKey,
    signTransaction: async (tx: Transaction) => { tx.sign(crankKeypair); return tx; },
    signAllTransactions: async (txs: Transaction[]) => { txs.forEach(t => t.sign(crankKeypair)); return txs; },
    payer: crankKeypair,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
  const program = new Program(IDL, PROGRAM_ID, provider);

  // Track last crank time per room to avoid duplicate calls
  const lastCrankTime: Record<number, number> = {};

  while (true) {
    for (const roomId of ROOM_IDS) {
      try {
        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('room'), Buffer.from([roomId])],
          PROGRAM_ID
        );

        const info = await connection.getAccountInfo(gamePda);
        if (!info) continue;

        const state: any = await program.account.game.fetch(gamePda);
        const playerCount: number = state.playerCount;
        if (playerCount === 0) continue;

        const now = Math.floor(Date.now() / 1000);
        const blockStart = state.blockStartTime
          ? Number(state.blockStartTime.toString())
          : Number(state.lastActivityTime.toString());

        const elapsed = now - blockStart;
        const timerExpired = elapsed >= BLOCK_EXPIRATION_SECONDS;
        const multipleOfThree = playerCount >= 3 && playerCount % 3 === 0;

        const cooldown = (lastCrankTime[roomId] ?? 0) + 10; // 10s cooldown

        // Refund if timer expired and <3 players
        if (timerExpired && playerCount < 3 && now > cooldown) {
          console.log(`[crank] Room ${roomId} — trigger: timer expired with ${playerCount} searchers (refund)`);
          lastCrankTime[roomId] = now;
          await refundExpiredGame(program, connection, crankKeypair, roomId);
          continue;
        }

        // Settle if timer expired OR multiple of 3 players (and >=3 players)
        const shouldSettle = (timerExpired || multipleOfThree) && playerCount >= 3;

        if (shouldSettle && now > cooldown) {
          const reason = timerExpired ? `timer expired (${elapsed}s)` : `${playerCount} searchers (multiple of 3)`;
          console.log(`[crank] Room ${roomId} — trigger: ${reason}`);
          lastCrankTime[roomId] = now;
          await settleRoom(program, connection, crankKeypair, roomId);
        }
      } catch (e: any) {
        // Account not found or decode error — room not initialized yet, skip silently
        if (!e.message?.includes('Account does not exist')) {
          console.warn(`[crank] Room ${roomId} error:`, e.message);
        }
      }
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch(err => {
  console.error('[crank] Fatal error:', err);
  process.exit(1);
});
