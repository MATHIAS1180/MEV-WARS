import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { IDL } from '../../../utils/anchor';
import { PROGRAM_ID, TREASURY_PUBKEY } from '../../../config/constants';

// Rate limiting: 10 requests per 60 seconds per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "mev-wars-crank",
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const { success, limit, reset, remaining } = await ratelimit.limit(clientIp);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: reset,
          limit,
          remaining,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    const { roomId } = await req.json();
    if (typeof roomId !== 'number' || roomId < 101 || roomId > 103) {
      return NextResponse.json({ error: 'Invalid room id (must be 101-103)' }, { status: 400 });
    }

    const crankPrivKey = process.env.CRANK_PRIVATE_KEY;
    if (!crankPrivKey) return NextResponse.json({ error: 'CRANK_PRIVATE_KEY not set' }, { status: 500 });

    let secretKey: Uint8Array;
    try {
      const sanitized = crankPrivKey.trim();
      if (sanitized.startsWith('[') && sanitized.endsWith(']')) {
        secretKey = Uint8Array.from(JSON.parse(sanitized));
      } else if (sanitized.includes(',')) {
        secretKey = Uint8Array.from(sanitized.split(',').map(n => parseInt(n.trim())));
      } else {
        secretKey = bs58.decode(sanitized);
      }
    } catch (e: any) {
      return NextResponse.json({ error: `Invalid CRANK_PRIVATE_KEY format: ${e.message}` }, { status: 500 });
    }

    if (secretKey.length !== 64) {
      return NextResponse.json({ error: `Bad secret key size: ${secretKey.length}. Expected 64.` }, { status: 500 });
    }

    const crankKeypair = Keypair.fromSecretKey(secretKey);
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8899';
    const connection = new Connection(rpcUrl, 'confirmed');

    const dummyWallet = {
      publicKey: crankKeypair.publicKey,
      signTransaction: async (tx: Transaction) => { tx.sign(crankKeypair); return tx; },
      signAllTransactions: async (txs: Transaction[]) => { txs.forEach(t => t.sign(crankKeypair)); return txs; },
      payer: crankKeypair,
    };
    const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
    const program = new Program(IDL as any, PROGRAM_ID, provider);

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], PROGRAM_ID
    );

    const state: any = await program.account.game.fetch(gamePda);
    const playerCount: number = state.playerCount;
    const blockStartTime: number = state.blockStartTime ? Number(state.blockStartTime.toString()) : 0;

    console.log(`[crank] Room ${roomId} — playerCount=${playerCount}, blockStartTime=${blockStartTime}`);

    if (playerCount === 0) {
      return NextResponse.json({ error: 'Game is empty', detail: 'playerCount=0' }, { status: 400 });
    }

    // Collect all active player pubkeys (non-default)
    const currentPlayers: PublicKey[] = (state.players as PublicKey[])
      .slice(0, playerCount)
      .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString());

    // Check if timer expired (30 seconds)
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - blockStartTime;
    const timerExpired = elapsed >= 30;

    // If timer expired and <3 players, refund
    if (timerExpired && playerCount < 3) {
      console.log(`[crank] Calling refund_expired_game for ${playerCount} searchers...`);

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
        console.error('[crank] refund simulation failed:', sim.value.err, sim.value.logs);
        return NextResponse.json({
          error: 'refund_expired_game simulation failed',
          detail: sim.value.err,
          logs: sim.value.logs,
        }, { status: 400 });
      }

      refundTx.sign(crankKeypair);
      const finalSig = await connection.sendRawTransaction(refundTx.serialize());
      const confirmation = await connection.confirmTransaction(
        { signature: finalSig, blockhash, lastValidBlockHeight }, 'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`refund_expired_game TX failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[crank] refund_expired_game confirmed:', finalSig);
      return NextResponse.json({ success: true, signature: finalSig, action: 'refund' });
    }

    // Otherwise, settle winners (requires >=3 players)
    if (playerCount < 2) {
      return NextResponse.json({ error: 'Not enough players', detail: 'Need at least 2 players to start' }, { status: 400 });
    }

    console.log(`[crank] Calling advance_round for ${playerCount} searchers...`);

    const advanceTx = await program.methods
      .advanceRound(roomId)
      .accounts({ game: gamePda })
      .remainingAccounts([
        ...currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })),
        { pubkey: TREASURY_PUBKEY, isWritable: true, isSigner: false },
      ])
      .transaction();

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    advanceTx.recentBlockhash = blockhash;
    advanceTx.feePayer = crankKeypair.publicKey;

    // Simulate first
    const sim = await connection.simulateTransaction(advanceTx, [crankKeypair]);
    if (sim.value.err) {
      console.error('[crank] simulation failed:', sim.value.err, sim.value.logs);
      
      // Check if it's a "DrawTooEarly" error (slot not ready yet)
      const logs = sim.value.logs || [];
      const isDrawTooEarly = logs.some(log => log.includes('DrawTooEarly') || log.includes('0x1772'));
      
      if (isDrawTooEarly) {
        console.log('[crank] DrawTooEarly - slot not ready yet, will retry automatically');
        return NextResponse.json({
          error: 'Slot not ready yet',
          detail: 'DrawTooEarly - crank will retry',
          shouldRetry: true,
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'advance_round simulation failed',
        detail: sim.value.err,
        logs: sim.value.logs,
      }, { status: 400 });
    }

    advanceTx.sign(crankKeypair);
    const finalSig = await connection.sendRawTransaction(advanceTx.serialize());
    const confirmation = await connection.confirmTransaction(
      { signature: finalSig, blockhash, lastValidBlockHeight }, 'confirmed'
    );

    if (confirmation.value.err) {
      throw new Error(`advance_round TX failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log('[crank] advance_round confirmed:', finalSig);
    return NextResponse.json({ success: true, signature: finalSig, action: 'advance' });

  } catch (error: any) {
    console.error('[crank] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
