import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import * as bs58 from 'bs58';
import { IDL } from '../../../../utils/anchor';
import { PROGRAM_ID, TREASURY_PUBKEY } from '../../../../config/constants';

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization (bearer token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const adminToken = authHeader.substring(7); // Remove 'Bearer '
    const expectedToken = process.env.ADMIN_SECRET;
    if (!expectedToken || adminToken !== expectedToken) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const { amount, recipientAddress } = await req.json();
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(recipientAddress);
    } catch {
      return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
    }

    // Load admin keypair for signing
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json({ error: 'Admin private key not configured' }, { status: 500 });
    }

    let secretKey: Uint8Array;
    try {
      const sanitized = adminPrivateKey.trim();
      if (sanitized.startsWith('[') && sanitized.endsWith(']')) {
        secretKey = Uint8Array.from(JSON.parse(sanitized));
      } else if (sanitized.includes(',')) {
        secretKey = Uint8Array.from(sanitized.split(',').map(n => parseInt(n.trim())));
      } else {
        secretKey = bs58.decode(sanitized);
      }
    } catch (e: any) {
      return NextResponse.json({ error: `Invalid admin private key format: ${e.message}` }, { status: 500 });
    }

    if (secretKey.length !== 64) {
      return NextResponse.json({ error: 'Invalid admin private key size' }, { status: 500 });
    }

    const adminKeypair = Keypair.fromSecretKey(secretKey);
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const dummyWallet = {
      publicKey: adminKeypair.publicKey,
      signTransaction: async (tx: Transaction) => { tx.sign(adminKeypair); return tx; },
      signAllTransactions: async (txs: Transaction[]) => { txs.forEach(t => t.sign(adminKeypair)); return txs; },
      payer: adminKeypair,
    };

    const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
    const program = new Program(IDL as any, PROGRAM_ID, provider);

    // Check treasury balance
    const treasuryBalance = await connection.getBalance(TREASURY_PUBKEY);
    if (treasuryBalance < amount) {
      return NextResponse.json({
        error: 'Insufficient treasury balance',
        available: treasuryBalance,
        requested: amount
      }, { status: 400 });
    }

    // Execute withdrawal
    const tx = await program.methods
      .withdrawFees(new BN(amount))
      .accounts({
        treasury: TREASURY_PUBKEY,
        recipient: recipient,
        authority: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`[withdraw] Withdrew ${amount} lamports to ${recipient.toBase58()}, TX: ${tx}`);

    return NextResponse.json({
      success: true,
      transaction: tx,
      amount: amount,
      recipient: recipient.toBase58(),
      treasuryBalance: treasuryBalance - amount,
    });

  } catch (error: any) {
    console.error('[withdraw] Error:', error);
    return NextResponse.json({
      error: 'Withdrawal failed',
      details: error.message
    }, { status: 500 });
  }
}