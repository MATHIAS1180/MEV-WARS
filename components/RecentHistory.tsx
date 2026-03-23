"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IDL } from "@/utils/anchor";

interface GameHistory {
  signature: string;
  roomId: number;
  totalPot: number;
  playerCount: number;
  winnersCount: number;
  multiplier: number;
  timestamp: number;
}

interface Props {
  programId: PublicKey;
  rooms: number[];
  currentRoomId?: number;
}

export default function RecentHistory({ programId, rooms, currentRoomId }: Props) {
  const { connection } = useConnection();
  const [historyByRoom, setHistoryByRoom] = useState<Record<number, GameHistory[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionsRef = useRef<number[]>([]);
  const initializingRef = useRef(false);

  const parseGameFromLogs = useCallback((logs: string[], roomId: number, signature: string): GameHistory | null => {
    try {
      const parser = new EventParser(programId, new BorshCoder(IDL as any));
      const events = parser.parseLogs(logs);
      
      let totalPot = 0;
      let winnersCount = 0;
      let hasSettledEvent = false;

      for (const event of events) {
        if (event.name === 'GameSettledEvent') {
          hasSettledEvent = true;
          const data = event.data as any;
          totalPot = data.totalPot?.toNumber() || 0;
          winnersCount = data.winnersCount || 0;
        }
      }

      if (hasSettledEvent && totalPot > 0 && winnersCount > 0) {
        const playerCount = winnersCount * 3;
        const entryFee = totalPot / playerCount;
        const prizePerWinner = (totalPot * 0.95) / winnersCount;
        const multiplier = prizePerWinner / entryFee;

        return {
          signature,
          roomId,
          totalPot: totalPot / 1e9,
          playerCount,
          winnersCount,
          multiplier,
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      // Silent fail for parsing errors
    }
    return null;
  }, [programId]);

  // Fast initial load - fetch 10 most recent per room
  const fetchInitialHistory = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const historyMap: Record<number, GameHistory[]> = {};

    try {
      await Promise.all(rooms.map(async (roomId) => {
        try {
          const [gamePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('room'), Buffer.from([roomId])],
            programId
          );

          // Fetch 10 most recent signatures
          const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 10 });
          const roomHistory: GameHistory[] = [];
          
          // Fetch in parallel for speed
          const txPromises = signatures.map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed',
              });

              if (tx?.meta?.logMessages) {
                return parseGameFromLogs(tx.meta.logMessages, roomId, sig.signature);
              }
            } catch (e) {
              // Skip failed transactions
            }
            return null;
          });
          
          const results = await Promise.all(txPromises);
          roomHistory.push(...results.filter((g): g is GameHistory => g !== null));
          historyMap[roomId] = roomHistory.slice(0, 10); // Keep max 10
        } catch (e) {
          historyMap[roomId] = [];
        }
      }));

      setHistoryByRoom(historyMap);
      setIsInitialized(true);
    } finally {
      initializingRef.current = false;
    }
  }, [rooms, programId, connection, parseGameFromLogs]);

  // Setup real-time subscriptions
  useEffect(() => {
    // Initialize data immediately
    if (!isInitialized) {
      fetchInitialHistory();
    }

    // Subscribe to all rooms for real-time updates
    rooms.forEach((roomId) => {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('room'), Buffer.from([roomId])],
        programId
      );

      // Use onLogs for instant updates (same as useGame)
      const subId = connection.onLogs(
        gamePda,
        async (logs) => {
          const game = parseGameFromLogs(logs.logs, roomId, logs.signature);
          if (game) {
            setHistoryByRoom((prev) => {
              const roomHistory = prev[roomId] || [];
              // Check if already exists
              if (roomHistory.some(g => g.signature === game.signature)) {
                return prev;
              }
              // Add at beginning, keep max 10
              return {
                ...prev,
                [roomId]: [game, ...roomHistory].slice(0, 10)
              };
            });
          }
        },
        'confirmed'
      );

      subscriptionsRef.current.push(subId);
    });

    // Cleanup
    return () => {
      subscriptionsRef.current.forEach((subId) => {
        connection.removeOnLogsListener(subId).catch(() => {});
      });
      subscriptionsRef.current = [];
    };
  }, [connection, programId, rooms, parseGameFromLogs, fetchInitialHistory, isInitialized]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };

  const getRoomLabel = (roomId: number) => {
    switch(roomId) {
      case 101: return '0.01';
      case 102: return '0.1';
      case 103: return '1.0';
      default: return roomId.toString();
    }
  };

  // Get history for current room - instant switch, no loading
  const displayHistory = currentRoomId 
    ? (historyByRoom[currentRoomId] || [])
    : Object.values(historyByRoom).flat().sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  const roomLabel = currentRoomId ? getRoomLabel(currentRoomId) : 'All Rooms';

  const headerBar = (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Recent Games</span>
        <span className="text-[7px] text-zinc-700 font-bold">— {roomLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-[#14F195] animate-pulse" />
        <span className="text-[7px] text-[#14F195] uppercase tracking-wider font-bold">Live</span>
        <button onClick={() => scroll('left')} className="p-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors" aria-label="Scroll left">
          <ChevronLeft className="w-2 h-2 text-zinc-500" />
        </button>
        <button onClick={() => scroll('right')} className="p-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors" aria-label="Scroll right">
          <ChevronRight className="w-2 h-2 text-zinc-500" />
        </button>
      </div>
    </div>
  );

  // Show skeleton only on very first load
  if (!isInitialized) {
    return (
      <div className="w-full history-strip">
        {headerBar}
        <div className="flex gap-1.5 overflow-x-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="history-card animate-pulse">
              <div className="h-3 bg-white/5 rounded w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (displayHistory.length === 0) {
    return (
      <div className="w-full history-strip">
        {headerBar}
        <div className="py-1 text-center">
          <span className="text-[8px] text-zinc-700 font-medium">No games yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full history-strip">
      {headerBar}
      <div
        ref={scrollContainerRef}
        className="flex gap-1.5 overflow-x-auto custom-scrollbar-horizontal"
        style={{ scrollbarWidth: 'none' }}
      >
        <AnimatePresence mode="popLayout">
          {displayHistory.map((game) => (
            <motion.a
              key={game.signature}
              layout
              href={`https://explorer.solana.com/tx/${game.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="history-card-mini"
              title={`${game.totalPot.toFixed(3)} SOL · ${game.playerCount}P · ${game.winnersCount}W`}
            >
              <span className="text-[#14F195] font-black text-xs leading-none">{game.multiplier.toFixed(2)}x</span>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
