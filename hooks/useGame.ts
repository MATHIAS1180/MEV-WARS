import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, setProvider, BN, EventParser, BorshCoder } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PROGRAM_ID } from '../config/constants';
import { IDL } from '../utils/anchor';

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

  const gameResultRef = useRef<GameResult | null>(null);
  const prevPlayerCountRef = useRef<number>(0);

  useEffect(() => { gameResultRef.current = gameResult; }, [gameResult]);

  const provider = useMemo(() => {
    // Create a read-only provider even without wallet
    return new AnchorProvider(
      connection, 
      wallet as any, 
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

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
        setGameState(account);
      } catch (err) { setGameState({ _corrupted: true }); }
    } catch { setGameState(null); }
    finally { setIsLoading(false); }
  }, [program, connection, roomId]);

  useEffect(() => {
    setGameResult(null);
    if (!program) { setGameState(null); return; }
    fetchState();

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], PROGRAM_ID
    );

    const subId = connection.onAccountChange(gamePda, async (info) => {
      try {
        const decoded = program.coder.accounts.decode('Game', info.data);
        const prev = prevPlayerCountRef.current;
        prevPlayerCountRef.current = decoded.playerCount;
        setGameState(decoded);

        // Game just settled (player count dropped to 0)
        if (prev >= 2 && decoded.playerCount === 0 && !gameResultRef.current) {
          console.log('[useGame] Game settled detected! prev:', prev, 'current:', decoded.playerCount);
          setIsScanningLogs(true);

          // Get all players who were in the game
          const allPlayers = (decoded.players as any[])
            .slice(0, prev)
            .map((p: any) => p.toString())
            .filter((p: string) => p !== PublicKey.default.toString());

          console.log('[useGame] Waiting for blockchain result:', {
            players: prev,
            allPlayers
          });

          let retries = 10;
          const fetchResult = async () => {
            if (gameResultRef.current) {
              console.log('[useGame] Result already found, stopping scan');
              setIsScanningLogs(false);
              return;
            }
            try {
              console.log('[useGame] Fetching signatures, retry:', 10 - retries);
              const sigs = await connection.getSignaturesForAddress(gamePda, { limit: 15 });
              console.log('[useGame] Found', sigs.length, 'signatures');
              let foundResult = null;
              for (const sig of sigs) {
                const tx = await connection.getTransaction(sig.signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed',
                });
                if (tx?.meta?.logMessages) {
                  console.log('[useGame] Parsing logs for sig:', sig.signature.slice(0, 8));
                  const result = parseLogsForResult(tx.meta.logMessages);
                  if (result) {
                    console.log('[useGame] Found real result!', result);
                    foundResult = result;
                    break;
                  }
                }
              }
              if (foundResult) {
                setGameResult(foundResult);
                setIsScanningLogs(false);
              } else if (retries-- > 0) {
                console.log('[useGame] No result yet, retrying in 2s...');
                setTimeout(fetchResult, 2000);
              } else {
                console.log('[useGame] Max retries reached, no result found');
                // Don't set any result - let user know settlement failed
                setIsScanningLogs(false);
                // Could show error toast here
              }
            } catch (e) {
              console.error('[useGame] Error fetching result:', e);
              if (retries-- > 0) setTimeout(fetchResult, 2000);
              else {
                console.log('[useGame] Using no result after errors');
                setIsScanningLogs(false);
                // Could show error toast here
              }
            }
          };

          // Start fetching real result immediately (no mock!)
          fetchResult();
        }
      } catch (e) { console.error('Failed to decode', e); }
    }, 'confirmed');

    return () => {
      connection.removeAccountChangeListener(subId).catch(console.error);
    };
  }, [program, connection, roomId, parseLogsForResult, fetchState]);

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
    joinGame,
    secureGain,
    fetchState,
    gameResult,
    setGameResult,
  };
}
