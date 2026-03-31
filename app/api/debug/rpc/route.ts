import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { createHash } from 'crypto';
import { getServerRpcUrl } from '../../../../lib/rpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function inferNetworkHint(rpcUrl: string): string {
  const lower = rpcUrl.toLowerCase();
  if (lower.includes('mainnet')) return 'mainnet';
  if (lower.includes('devnet')) return 'devnet';
  if (lower.includes('testnet')) return 'testnet';
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) return 'localnet';
  return 'unknown';
}

function safeRpcPreview(rpcUrl: string): string {
  try {
    const parsed = new URL(rpcUrl);
    // Never expose credentials, query values, or long path fragments that may include API keys.
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'invalid-url';
  }
}

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export async function GET() {
  try {
    const rpcUrl = getServerRpcUrl('app/api/debug/rpc/route.ts');
    const connection = new Connection(rpcUrl, 'confirmed');

    const slot = await connection.getSlot('confirmed');
    const blockTime = await connection.getBlockTime(slot);

    const payload = {
      ok: true,
      rpc: {
        preview: safeRpcPreview(rpcUrl),
        fingerprint: fingerprint(rpcUrl),
        networkHint: inferNetworkHint(rpcUrl),
      },
      chain: {
        slot,
        blockTime,
      },
      serverTime: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
