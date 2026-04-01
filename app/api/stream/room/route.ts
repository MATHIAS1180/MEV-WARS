import { NextRequest } from 'next/server';
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { IDL } from '@/utils/anchor';
import { BLOCK_EXPIRATION_SECONDS, PROGRAM_ID } from '@/config/constants';
import { getServerRpcUrl } from '@/lib/rpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// FIX: Extend serverless function timeout for Vercel Pro (default 10s on Hobby)
export const maxDuration = 60;

const STREAM_TICK_MS = 1000;   // FIX: 1s tick for smooth real-time sync across spectators
const CHAIN_CLOCK_SYNC_MS = 10000; // FIX: Sync chain clock every 10s, interpolate between

type SnapshotState = 'waiting' | 'inProgress' | 'finished' | 'unknown';

type StreamSnapshot = {
  roomId: number;
  slot: number;
  chainClockUnix: number | null;
  fetchedAtMs: number;
  game: {
    roomId: number;
    entryFee: string;
    playerCount: number;
    potAmount: string;
    resolveSlot: string;
    lastActivityTime: string;
    blockStartTime: string;
    currentRound: number;
    players: string[];
    survivors: string[];
    state: SnapshotState;
    bump: number;
  } | null;
  timerRemaining: number | null;
};

function mapState(state: any): SnapshotState {
  if (!state) return 'unknown';
  if ('waiting' in state) return 'waiting';
  if ('inProgress' in state) return 'inProgress';
  if ('finished' in state) return 'finished';
  return 'unknown';
}

function parseBn(raw: unknown): number {
  if (!raw) return 0;
  if (raw instanceof BN) return Number(raw.toString());
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'bigint') return Number(raw);
  if (typeof raw === 'string') return Number(raw);
  if (typeof (raw as any).toString === 'function') {
    return Number((raw as any).toString());
  }
  return 0;
}

function normalizeUnix(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 1e12 ? Math.floor(raw / 1000) : Math.floor(raw);
}

function toPlayerList(players: PublicKey[], playerCount: number): string[] {
  return players
    .slice(0, playerCount)
    .map((p) => p.toString())
    .filter((p) => p !== PublicKey.default.toString());
}

export async function GET(req: NextRequest) {
  const roomParam = req.nextUrl.searchParams.get('roomId');
  const roomId = Number(roomParam);

  if (!Number.isInteger(roomId) || roomId < 101 || roomId > 103) {
    return new Response('Invalid roomId', { status: 400 });
  }

  const rpcUrl = getServerRpcUrl('app/api/stream/room/route.ts');
  const connection = new Connection(rpcUrl, 'confirmed');

  const serverKeypair = Keypair.generate();
  const wallet = {
    publicKey: serverKeypair.publicKey,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  const program = new Program(IDL as any, PROGRAM_ID, provider);

  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    PROGRAM_ID
  );

  let lastClockSyncAt = 0;
  let chainClockAnchor: { unix: number; localMs: number } | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const write = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const readChainClockUnix = async (): Promise<{ slot: number; chainUnix: number | null }> => {
        try {
          const slot = await connection.getSlot('confirmed');
          // FIX: Try 5 offsets for getBlockTime (recent slots might not have it yet)
          for (let offset = 0; offset <= 4; offset += 1) {
            const t = await connection.getBlockTime(slot - offset);
            if (typeof t === 'number' && t > 0) {
              return { slot, chainUnix: t };
            }
          }
          return { slot, chainUnix: null };
        } catch {
          // FIX: If RPC fails, return null without crashing the tick
          return { slot: 0, chainUnix: null };
        }
      };

      const getEstimatedChainClock = () => {
        if (chainClockAnchor) {
          const elapsed = Math.max(0, Math.floor((Date.now() - chainClockAnchor.localMs) / 1000));
          return chainClockAnchor.unix + elapsed;
        }
        // FIX: Fallback to server wall-clock time when chain clock unavailable
        // Solana chain time is typically within 1-2s of wall clock — acceptable for a 20s timer
        return Math.floor(Date.now() / 1000);
      };

      const tick = async () => {
        if (closed) return;

        try {
          const nowMs = Date.now();
          let slot = 0;

          if (!chainClockAnchor || nowMs - lastClockSyncAt >= CHAIN_CLOCK_SYNC_MS) {
            const clock = await readChainClockUnix();
            slot = clock.slot;
            if (typeof clock.chainUnix === 'number' && clock.chainUnix > 0) {
              chainClockAnchor = { unix: clock.chainUnix, localMs: nowMs };
            }
            lastClockSyncAt = nowMs;
          }

          const chainClockUnix = getEstimatedChainClock();

          // FIX: Single fetch call instead of getAccountInfo + fetch (halves RPC calls)
          let snapshot: StreamSnapshot;
          try {
            const account = await program.account.game.fetch(gamePda as any);
            const fetched: any = account;
            const playerCount = Number(fetched.playerCount ?? 0);
            const players = toPlayerList(fetched.players ?? [], playerCount);
            const survivors = (fetched.survivors ?? [])
              .map((p: PublicKey) => p.toString())
              .filter((p: string) => p !== PublicKey.default.toString());

            const state = mapState(fetched.state);
            const blockStartTime = normalizeUnix(parseBn(fetched.blockStartTime));
            const roundActive = (state === 'waiting' || state === 'inProgress') && playerCount > 0;

            let timerRemaining: number | null = null;
            // FIX: chainClockUnix is never null now (fallback to Date.now()/1000)
            if (roundActive && blockStartTime > 0) {
              timerRemaining = Math.max(0, BLOCK_EXPIRATION_SECONDS - (chainClockUnix - blockStartTime));
            }

            snapshot = {
              roomId,
              slot,
              chainClockUnix,
              fetchedAtMs: nowMs,
              game: {
                roomId: Number(fetched.roomId ?? roomId),
                entryFee: String(parseBn(fetched.entryFee)),
                playerCount,
                potAmount: String(parseBn(fetched.potAmount)),
                resolveSlot: String(parseBn(fetched.resolveSlot)),
                lastActivityTime: String(parseBn(fetched.lastActivityTime)),
                blockStartTime: String(parseBn(fetched.blockStartTime)),
                currentRound: Number(fetched.currentRound ?? 0),
                players,
                survivors,
                state,
                bump: Number(fetched.bump ?? 0),
              },
              timerRemaining,
            };
          } catch {
            // Account doesn't exist yet — send null game
            snapshot = {
              roomId,
              slot: 0,
              chainClockUnix: getEstimatedChainClock(),
              fetchedAtMs: nowMs,
              game: null,
              timerRemaining: null,
            };
          }

          write('snapshot', snapshot);
          // FIX: Reset backoff on successful tick
          consecutiveErrors = 0;
        } catch (error: any) {
          // FIX: Track consecutive errors for adaptive backoff
          consecutiveErrors++;
          write('error', { message: error?.message || 'stream tick failed' });
        }
      };

      write('ready', { roomId });
      // FIX: Use adaptive setTimeout instead of fixed setInterval to back off on 429
      let consecutiveErrors = 0;
      const scheduleNext = () => {
        if (closed) return;
        // Back off: 2s, 4s, 8s, 16s, max 30s on consecutive errors
        const delay = consecutiveErrors > 0
          ? Math.min(STREAM_TICK_MS * Math.pow(2, consecutiveErrors), 30000)
          : STREAM_TICK_MS;
        setTimeout(async () => {
          if (closed) return;
          await tick();
          scheduleNext();
        }, delay);
      };
      tick().then(scheduleNext);

      req.signal.addEventListener('abort', () => {
        closed = true;
        try {
          controller.close();
        } catch {
          // Stream may already be closed.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}