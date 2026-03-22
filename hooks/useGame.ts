import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, setProvider, BN, EventParser, BorshCoder } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PROGRAM_ID, IDL } from '../utils/anchor';

export interface GameResult {
  // Multi-winner: first winner for display compat, full list for multi-payout
  winner: string;
  winnerIndex: number;
  winners: string[];
  totalPot: number;
  winnerAmount: number; // per-winner payout
}

export const BULLET_COLORS = [
  { name: "Cyan",   color: "#14F195" },
  { name: "Purple", color: "#9945FF" },
  { name: "Blue",   color: "#00C2FF" },
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
    if (!wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
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

      for (const event of parser.parseLogs(logs)) {
        if (event.name === 'WinnerExtractedEvent') {
          const d = event.data as any;
          winners.push({ pubkey: d.winner.toString(), amount: d.amount.toNumber() });
        }
        if (event.name === 'GameSettledEvent') {
          const d = event.data as any;
          totalPot = d.totalPot.toNumber();
        }
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
    if (!program || !wallet.publicKey) return;
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
  }, [program, wallet.publicKey, connection, roomId]);

  useEffect(() => {
    setGameResult(null);
    if (!program || !wallet.publicKey) { setGameState(null); return; }
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
        if (prev >= 3 && decoded.playerCount === 0 && !gameResultRef.current) {
          setIsScanningLogs(true);
          let retries = 5;
          const fetchResult = async () => {
            if (gameResultRef.current) { setIsScanningLogs(false); return; }
            try {
              const sigs = await connection.getSignaturesForAddress(gamePda, { limit: 5 });
              let foundResult = null;
              for (const sig of sigs) {
                const tx = await connection.getTransaction(sig.signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed',
                });
                const result = parseLogsForResult(tx?.meta?.logMessages ?? []);
                if (result) { foundResult = result; break; }
              }
              if (foundResult) {
                setGameResult(foundResult);
                setIsScanningLogs(false);
              } else if (retries-- > 0) setTimeout(fetchResult, 1500);
              else setIsScanningLogs(false);
            } catch (e) {
              if (retries-- > 0) setTimeout(fetchResult, 1500);
              else setIsScanningLogs(false);
            }
          };
          setTimeout(fetchResult, 1000);
        }
      } catch (e) { console.error('Failed to decode', e); }
    }, 'confirmed');

    return () => {
      connection.removeAccountChangeListener(subId).catch(console.error);
    };
  }, [program, connection, wallet.publicKey, roomId, parseLogsForResult, fetchState]);

  const joinGame = async (entryFeeLamports: number): Promise<boolean> => {
    if (!program || !wallet.publicKey || !provider) throw new Error('Wallet not connected');

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );

    const tx = new Transaction();
    const info = await connection.getAccountInfo(gamePda);
    if (!info) {
      tx.add(await program.methods
        .initializeGame(roomId, new BN(entryFeeLamports))
        .accounts({
          game: gamePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .instruction());
    }

    tx.add(await program.methods.joinGame(roomId).accounts({
      game: gamePda,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction());

    const signature = await provider.sendAndConfirm(tx);
    console.log('joinGame TX confirmed:', signature);
    fetchState();
    return true;
  };

  return {
    gameState,
    isLoading,
    isScanningLogs,
    joinGame,
    fetchState,
    gameResult,
    setGameResult,
  };
}
