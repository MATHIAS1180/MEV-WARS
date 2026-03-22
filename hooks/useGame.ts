import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, setProvider, BN, EventParser, BorshCoder } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PROGRAM_ID, IDL } from '../utils/anchor';

export interface GameResult {
  winner: string;
  winnerIndex: number;
  totalPot: number;
  winnerAmount: number;
}

export const BULLET_COLORS = [
  { name: "Cyan", color: "#14F195" },
  { name: "Purple", color: "#9945FF" },
  { name: "Blue", color: "#00C2FF" },
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

  const parseLogsForResult = useCallback((logs: string[]): GameResult | null => {
    try {
      const parser = new EventParser(PROGRAM_ID, new BorshCoder(IDL as any));
      for (const event of parser.parseLogs(logs)) {
        if (event.name === 'GameSettledEvent') {
          const d = event.data as any;
          return {
            winner: d.winner.toString(),
            winnerIndex: d.winnerIndex,
            totalPot: d.totalPot.toNumber(),
            winnerAmount: d.winnerAmount.toNumber(),
          };
        }
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

        if (prev === 3 && decoded.playerCount === 0 && !gameResultRef.current) {
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
    })
    .remainingAccounts([{ pubkey: wallet.publicKey, isWritable: false, isSigner: false }])
    .instruction());

    // ONLY 1 SIMPLE TRANSACTION FOR THE PLAYER, VERY FAST!
    const signature = await provider.sendAndConfirm(tx);
    console.log('joinGame TX confirmed:', signature);
    
    fetchState();
    return true;
  };

  const withdraw = async (): Promise<boolean> => {
    if (!program || !wallet.publicKey || !provider) throw new Error('Wallet not connected');
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );
    const tx = await program.methods.withdraw(roomId).accounts({
      game: gamePda,
      player: wallet.publicKey,
    }).transaction();
    const signature = await provider.sendAndConfirm(tx);
    console.log('withdraw TX confirmed:', signature);
    fetchState();
    return true;
  };

  const refundIdle = async (): Promise<boolean> => {
    if (!program || !wallet.publicKey || !provider) throw new Error('Wallet not connected');
    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('room'), Buffer.from([roomId])], program.programId
    );
    
    const currentState: any = await program.account.game.fetch(gamePda);
    const currentPlayers: PublicKey[] = currentState.players
      .filter((p: any) => p.toString() !== PublicKey.default.toString())
      .map((p: any) => p as PublicKey);

    const tx = await program.methods.refundIdleGame(roomId).accounts({
      game: gamePda,
    })
    .remainingAccounts(currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })))
    .transaction();
    
    const signature = await provider.sendAndConfirm(tx);
    console.log('refundIdle TX confirmed:', signature);
    fetchState();
    return true;
  };

  return { gameState, isLoading, isScanningLogs, joinGame, withdraw, refundIdle, fetchState, gameResult, setGameResult };
}
