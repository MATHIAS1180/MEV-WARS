import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, setProvider, BN, EventParser, BorshCoder } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PROGRAM_ID } from '../config/constants';
import { IDL } from '../utils/anchor';
// FIX: Import resilient connection wrapper + deduplication bus
import { ResilientEventSource, ConnectionStatus } from '../lib/ResilientEventSource';
import { txEventBus } from '../lib/TransactionEventBus';

export interface GameResult {
  // Multi-winner: first winner for display compat, full list for multi-payout
  winner: string;
  winnerIndex: number;
  winners: string[];
  totalPot: number;
  winnerAmount: number; // per-winner payout
}

export type GameState = 
  | { waiting: {} }
  | { inProgress: { round: number; survivors: string[] } }
  | { finished: {} };

// TypeScript interface for Game account state
export interface GameStateData {
  roomId: number;
  entryFee: BN;
  players: PublicKey[];
  playerCount: number;
  state: GameState | null; // Updated to handle new states
  potAmount: BN;
  resolveSlot: BN;
  lastActivityTime: BN;
  blockStartTime: BN;
  currentRound: number;
  survivors: PublicKey[];
  bump: number;
}

type SnapshotState = 'waiting' | 'inProgress' | 'finished' | 'unknown';

interface RoomStreamSnapshot {
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
  timerDeadlineMs: number | null;
}

function mapSnapshotState(state: SnapshotState, snapshot?: RoomStreamSnapshot['game']): GameState | null {
  if (state === 'waiting') return { waiting: {} };
  if (state === 'inProgress') return {
    inProgress: {
      round: snapshot?.currentRound ?? 0,
      survivors: (snapshot?.survivors ?? []),
    }
  };
  if (state === 'finished') return { finished: {} };
  return null;
}

function mapSnapshotToGameData(snapshot: RoomStreamSnapshot['game']): GameStateData | null {
  if (!snapshot) return null;

  return {
    roomId: snapshot.roomId,
    entryFee: new BN(snapshot.entryFee),
    players: snapshot.players.map((p) => new PublicKey(p)),
    playerCount: snapshot.playerCount,
    state: mapSnapshotState(snapshot.state, snapshot),
    potAmount: new BN(snapshot.potAmount),
    resolveSlot: new BN(snapshot.resolveSlot),
    lastActivityTime: new BN(snapshot.lastActivityTime),
    blockStartTime: new BN(snapshot.blockStartTime),
    currentRound: snapshot.currentRound,
    survivors: snapshot.survivors.map((p) => new PublicKey(p)),
    bump: snapshot.bump,
  };
}

export const BULLET_COLORS = [
  { name: "Violet", color: "#9945FF" },
  { name: "Solana", color: "#14F195" },
  { name: "Cyan", color: "#00C2FF" },
  { name: "Pink", color: "#FF6B9D" },
  { name: "Orange", color: "#FFB84D" },
  { name: "Purple", color: "#A855F7" },
  { name: "Emerald", color: "#10B981" },
  { name: "Sky", color: "#06B6D4" },
  { name: "Rose", color: "#EC4899" },
  { name: "Amber", color: "#F59E0B" },
  { name: "Indigo", color: "#8B5CF6" },
  { name: "Mint", color: "#34D399" },
  { name: "Electric", color: "#22D3EE" },
  { name: "Candy", color: "#F472B6" },
  { name: "Gold", color: "#FBBF24" },
  { name: "Deep", color: "#7C3AED" },
  { name: "Pastel", color: "#6EE7B7" },
  { name: "Azure", color: "#67E8F9" },
  { name: "Blush", color: "#FDA4AF" },
  { name: "Lemon", color: "#FCD34D" },
  { name: "Royal", color: "#6D28D9" },
  { name: "Forest", color: "#059669" },
  { name: "Ocean", color: "#0891B2" },
  { name: "Magenta", color: "#BE185D" },
  { name: "Sunset", color: "#D97706" },
  { name: "Ultra", color: "#5B21B6" },
  { name: "Jade", color: "#047857" },
  { name: "Teal", color: "#0E7490" },
  { name: "Ruby", color: "#9F1239" },
  { name: "Bronze", color: "#B45309" },
];

export function useGame(roomId: number) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [gameState, setGameState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningLogs, setIsScanningLogs] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [chainClockUnix, setChainClockUnix] = useState<number | null>(null);
  const [serverTimerRemaining, setServerTimerRemaining] = useState<number | null>(null);
  const [serverTimerDeadlineMs, setServerTimerDeadlineMs] = useState<number | null>(null);
  // FIX: Expose SSE connection status for UI indicator
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  // Debounce 'reconnecting' state: only expose it after 5 s of sustained disconnection
  // so a quick reconnect doesn't flash the warning badge to the user.
  const reconnectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameResultRef = useRef<GameResult | null>(null);
  // FIX: Cancellation flag for scanForGameResult to prevent stale scans after room change
  const scanCancelledRef = useRef<boolean>(false);
  const prevPlayerCountRef = useRef<number>(0);
  const prevInProgressRef = useRef<boolean>(false);
  // Track finished state transitions so we scan even when SSE reconnects after game ended
  const prevFinishedRef = useRef<boolean>(false);
  const readOnlyWalletRef = useRef(Keypair.generate());

  const anchorWallet = useMemo(() => {
    if (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions) {
      return wallet as any;
    }

    const fallback = readOnlyWalletRef.current;
    return {
      publicKey: fallback.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T) => tx,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]) => txs,
    };
  }, [wallet]);

  useEffect(() => { gameResultRef.current = gameResult; }, [gameResult]);

  const provider = useMemo(() => {
    // Create a provider that also works for spectators without connected wallet.
    return new AnchorProvider(
      connection, 
      anchorWallet,
      { commitment: 'confirmed' }
    );
  }, [connection, anchorWallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    setProvider(provider);
    return new Program(IDL, PROGRAM_ID, provider);
  }, [provider]);

  // Parse WinnerExtractedEvent logs to build multi-winner result
  const parseLogsForResult = useCallback((logs: string[]): GameResult | null => {
    try {
      const parser = new EventParser(PROGRAM_ID, new BorshCoder(IDL as any));
      const winners: { pubkey: string; amount: number }[] = [];
      let totalPot = 0;
      let isRefund = false;

      for (const event of parser.parseLogs(logs)) {
        if (event.name === 'WinnerExtractedEvent') {
          const d = event.data as any;
          winners.push({ pubkey: d.winner.toString(), amount: d.amount.toNumber() });
        }
        if (event.name === 'GameSettledEvent') {
          const d = event.data as any;
          totalPot = d.totalPot.toNumber();
        }
        if (event.name === 'GameRefundedEvent') {
          isRefund = true;
        }
      }

      // If refund event detected, return null (no winner)
      if (isRefund) {
        return null;
      }

      if (winners.length > 0) {
        return {
          winner: winners[0].pubkey,
          winnerIndex: 0,
          winners: winners.map(w => w.pubkey),
          totalPot,
          winnerAmount: winners[0].amount,
        };
      }
    } catch (e) { console.warn('parseLogsForResult failed:', e); }
    return null;
  }, []);

  const fetchState = useCallback(async () => {
    if (!program) return;
    try {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('room'), Buffer.from([roomId])], program.programId
      );
      const info = await connection.getAccountInfo(gamePda);
      if (!info) { setGameState(null); return; }
      try {
        const account = await program.account.game.fetch(gamePda);
        const fetchedAccount = account as any;
        prevPlayerCountRef.current = Number(fetchedAccount.playerCount ?? 0);
        prevInProgressRef.current = !!(fetchedAccount.state && fetchedAccount.state.inProgress);
        setGameState(fetchedAccount);
      } catch (err) { setGameState({ _corrupted: true }); }
    } catch { setGameState(null); }
    finally { setIsLoading(false); }
  }, [program, connection, roomId]);

  const scanForGameResult = useCallback(async (gamePda: PublicKey) => {
    if (gameResultRef.current) return;
    // FIX: Reset cancellation flag at start of new scan
    scanCancelledRef.current = false;

    setIsScanningLogs(true);
    let retries = 18;

    const fetchResult = async () => {
      // FIX: Abort if cancelled (room changed or unmounted) or result already found
      if (scanCancelledRef.current || gameResultRef.current) {
        setIsScanningLogs(false);
        return;
      }

      try {
        // FIX: Reduced from 40 to 10 signatures to avoid 429 rate limits
        const sigs = await connection.getSignaturesForAddress(gamePda, { limit: 10 });
        let foundResult: GameResult | null = null;
        let foundSignature: string | null = null;

        for (const sig of sigs) {
          // FIX: Check cancellation between iterations
          if (scanCancelledRef.current) { setIsScanningLogs(false); return; }

          // FIX: Skip if this signature was already processed by the event bus
          if (txEventBus.hasProcessed(sig.signature, 'game_settled')) continue;

          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          });
          if (!tx?.meta?.logMessages) continue;

          const result = parseLogsForResult(tx.meta.logMessages);
          if (result) {
            foundResult = result;
            foundSignature = sig.signature;
            break;
          }
        }

        if (foundResult && foundSignature) {
          // FIX: Emit through bus for global deduplication
          const emitted = txEventBus.emit(foundSignature, 'game_settled', { result: foundResult });
          if (emitted) {
            setGameResult(foundResult);
          }
          setIsScanningLogs(false);
          return;
        }

        if (retries-- > 0 && !scanCancelledRef.current) {
          setTimeout(fetchResult, 1000);
        } else {
          setIsScanningLogs(false);
        }
      } catch {
        if (retries-- > 0 && !scanCancelledRef.current) {
          setTimeout(fetchResult, 1000);
        } else {
          setIsScanningLogs(false);
        }
      }
    };

    fetchResult();
  }, [connection, parseLogsForResult]);

  // FIX: Stable refs for callbacks — prevents SSE reconnection when wallet connects.
  // Without this, connecting wallet changes program → fetchState → scanForGameResult,
  // which are all in the SSE effect deps, causing a full SSE teardown + reconnect.
  // Players 2+ who connect wallet mid-game lose timer/notification/cube state.
  const fetchStateStableRef = useRef(fetchState);
  useEffect(() => { fetchStateStableRef.current = fetchState; }, [fetchState]);

  const scanForGameResultStableRef = useRef(scanForGameResult);
  useEffect(() => { scanForGameResultStableRef.current = scanForGameResult; }, [scanForGameResult]);

  useEffect(() => {
    setGameResult(null);
    setIsScanningLogs(false);
    setServerTimerRemaining(null);
    setServerTimerDeadlineMs(null);
    setChainClockUnix(null);
    // FIX: Cancel any in-flight scan from previous room
    scanCancelledRef.current = true;
    prevPlayerCountRef.current = 0;
    prevInProgressRef.current = false;
    prevFinishedRef.current = false;

    if (!program) { setGameState(null); return; }

    fetchStateStableRef.current();

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], PROGRAM_ID
    );

    // FIX: Use ResilientEventSource with exponential backoff instead of raw EventSource
    const resilientEs = new ResilientEventSource({
      url: `/api/stream/room?roomId=${roomId}`,
      onStatusChange: (status) => {
        if (status === 'reconnecting') {
          // Only surface 'reconnecting' to UI after 5 s of sustained disconnection
          if (!reconnectingTimerRef.current) {
            reconnectingTimerRef.current = setTimeout(() => {
              reconnectingTimerRef.current = null;
              setConnectionStatus('reconnecting');
              console.warn(`[useGame] SSE reconnecting for room ${roomId}...`);
            }, 5000);
          }
        } else {
          // Any recovery clears the pending debounce immediately
          if (reconnectingTimerRef.current) {
            clearTimeout(reconnectingTimerRef.current);
            reconnectingTimerRef.current = null;
          }
          setConnectionStatus(status);
        }
      },
      onSnapshot: (rawData) => {
        try {
          const data = rawData as RoomStreamSnapshot;

          setChainClockUnix((prev) => (prev === data.chainClockUnix ? prev : data.chainClockUnix));
          setServerTimerRemaining((prev) => (prev === data.timerRemaining ? prev : data.timerRemaining));
          setServerTimerDeadlineMs((prev) => (prev === data.timerDeadlineMs ? prev : data.timerDeadlineMs ?? null));

          const decoded = mapSnapshotToGameData(data.game) as any;
          if (!decoded) {
            // Ignore transient null snapshots to avoid UI flicker during stream hiccups.
            return;
          }

          const prev = prevPlayerCountRef.current;
          const inProgressNow = !!(decoded.state && (decoded.state as any).inProgress);
          const isFinishedNow = !!(decoded.state && 'finished' in decoded.state);
          const settledTransition = prevInProgressRef.current && !inProgressNow;
          // Trigger scan when state JUST becomes finished (handles SSE reconnect after game ends:
          // prevPlayerCount restarts at 0 so the prev>=2 check would be missed)
          const justBecameFinished = !prevFinishedRef.current && isFinishedNow;
          prevPlayerCountRef.current = decoded.playerCount;
          prevInProgressRef.current = inProgressNow;
          prevFinishedRef.current = isFinishedNow;
          setGameState(decoded);

          if (((prev >= 2 && decoded.playerCount === 0) || settledTransition || justBecameFinished) && !gameResultRef.current) {
            scanForGameResultStableRef.current(gamePda);
          }
        } catch (e) {
          console.error('[useGame] Failed to parse stream snapshot:', e);
        }
      },
    });

    return () => {
      // FIX: Cancel pending scans and close resilient stream on cleanup
      scanCancelledRef.current = true;
      resilientEs.close();
      // Clear any pending reconnecting debounce
      if (reconnectingTimerRef.current) {
        clearTimeout(reconnectingTimerRef.current);
        reconnectingTimerRef.current = null;
      }
    };
  // FIX: Only reconnect SSE on roomId change.
  // Callbacks are accessed via stable refs so wallet/program changes don't cause reconnection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const joinGame = async (entryFeeLamports: number): Promise<boolean> => {
    if (!program || !wallet.publicKey || !provider) throw new Error('Wallet not connected');

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );

    const info = await connection.getAccountInfo(gamePda);
    if (!info) {
      throw new Error('Room not initialized on-chain. Please contact admin to initialize rooms.');
    }

    const account = await program.account.game.fetch(gamePda) as unknown as GameStateData;
    const onChainEntryFee = Number(account.entryFee.toString());
    if (onChainEntryFee !== entryFeeLamports) {
      throw new Error(
        `Entry fee mismatch for room #${roomId}: on-chain=${onChainEntryFee} lamports, expected=${entryFeeLamports}.`
      );
    }

    const signature = await program.methods.joinGame(roomId).accounts({
      game: gamePda,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    }).rpc();

    console.log('joinGame TX confirmed:', signature);
    fetchState();
    return true;
  };

  const initializeRoom = async (entryFeeLamports: number): Promise<boolean> => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );

    const info = await connection.getAccountInfo(gamePda);
    if (info) return true;

    const signature = await program.methods
      .initializeGame(roomId, new BN(entryFeeLamports))
      .accounts({
        game: gamePda,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('initializeGame TX confirmed:', signature);
    await fetchState();
    return true;
  };

  const crankRoom = useCallback(async (): Promise<'refund' | 'advance'> => {
    const response = await fetch('/api/crank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = payload?.error || 'Failed to crank room';
      throw new Error(errorMessage);
    }

    const action = payload?.action;
    if (action !== 'refund' && action !== 'advance') {
      throw new Error('Invalid crank response');
    }

    console.log('crankRoom TX confirmed:', payload?.signature, 'action:', action);
    await fetchState();
    return action;
  }, [roomId, fetchState]);

  const secureGain = async (): Promise<boolean> => {
    if (!program || !wallet.publicKey || !provider) throw new Error('Wallet not connected');

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );

    const tx = await program.methods
      .secureGain(roomId)
      .accounts({
        game: gamePda,
        player: wallet.publicKey,
      })
      .transaction();

    const signature = await provider.sendAndConfirm(tx);
    console.log('secureGain TX confirmed:', signature);
    fetchState();
    return true;
  };

  return {
    gameState,
    isLoading,
    isScanningLogs,
    chainClockUnix,
    serverTimerRemaining,
    serverTimerDeadlineMs,
    // FIX: Expose connection status for UI indicator
    connectionStatus,
    joinGame,
    initializeRoom,
    crankRoom,
    secureGain,
    fetchState,
    gameResult,
    setGameResult,
  };
}
