import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { IDL, PROGRAM_ID, TREASURY_PUBKEY } from '../../../utils/anchor';


export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (typeof roomId !== 'number') return NextResponse.json({ error: 'Invalid room id' }, { status: 400 });

    const crankPrivKey = process.env.CRANK_PRIVATE_KEY;
    if (!crankPrivKey) return NextResponse.json({ error: 'CRANK_PRIVATE_KEY not set' }, { status: 500 });
    
    let secretKey;
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
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    
    const dummyWallet = {
      publicKey: crankKeypair.publicKey,
      signTransaction: async (tx: Transaction) => { tx.sign(crankKeypair); return tx; },
      signAllTransactions: async (txs: Transaction[]) => { txs.forEach(t => t.sign(crankKeypair)); return txs; },
      payer: crankKeypair
    };
    const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
    const program = new Program(IDL as any, PROGRAM_ID, provider);

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], PROGRAM_ID
    );

    const state: any = await program.account.game.fetch(gamePda);
    console.log(`[crank] Room ${roomId} state:`, JSON.stringify(state.state));
    
    // AwaitingResolution is the Rust enum variant — Anchor deserializes it as { awaitingResolution: {} }
    const isResolving =
      (typeof state.state === 'string' && state.state.toLowerCase() === 'awaitingresolution') ||
      (state.state && typeof state.state === 'object' && 'awaitingResolution' in state.state);

    if (state.playerCount !== 3 || !isResolving) {
      console.warn(`[crank] Game not ready: playerCount=${state.playerCount}, state=${JSON.stringify(state.state)}`);
      return NextResponse.json({ error: 'Game not ready to resolve', detail: state.state }, { status: 400 });
    }

    const currentPlayers: PublicKey[] = state.players
      .filter((p: any) => p.toString() !== PublicKey.default.toString())
      .map((p: any) => p as PublicKey);

    if (currentPlayers.length !== 3) {
      return NextResponse.json({ error: 'Not exactly 3 players found' }, { status: 400 });
    }

    const randomnessPubkey: PublicKey = state.randomnessAccount;
    // NOTE: SystemProgram.programId == PublicKey.default in Solana (both are 11111...)
    // We do NOT block on default — whatever the contract stored is what we pass back.
    console.log(`[crank] Randomness account stored on-chain: ${randomnessPubkey.toBase58()}`);

    // ─── Directly call settle_winner (Native on-chain randomness) ───
    console.log('[crank] Calling settle_winner...');

    const settleTx = await program.methods
      .settleWinner(roomId)
      .accounts({
        game: gamePda,
        randomnessAccount: randomnessPubkey,
      })
      .remainingAccounts([
        ...currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })),
        { pubkey: TREASURY_PUBKEY, isWritable: true, isSigner: false },
      ])
      .transaction();

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    settleTx.recentBlockhash = blockhash;
    settleTx.feePayer = crankKeypair.publicKey;

    // Simulate first to catch errors early
    const sim = await connection.simulateTransaction(settleTx, [crankKeypair]);
    if (sim.value.err) {
      console.error('[crank] settle_winner simulation failed:', sim.value.err);
      console.error('[crank] Logs:', sim.value.logs);
      return NextResponse.json({
        error: 'settle_winner simulation failed',
        detail: sim.value.err,
        logs: sim.value.logs,
      }, { status: 400 });
    }

    // Sign and send ONCE
    settleTx.sign(crankKeypair);
    const finalSig = await connection.sendRawTransaction(settleTx.serialize());
    const confirmation = await connection.confirmTransaction({ signature: finalSig, blockhash, lastValidBlockHeight }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`settle_winner TX failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log('[crank] settle_winner confirmed:', finalSig);
    return NextResponse.json({ success: true, signature: finalSig });

  } catch (error: any) {
    console.error('[crank] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
