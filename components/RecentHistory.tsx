"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
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
  rpcUrl: string;
  rooms: number[];
  currentRoomId?: number;
}

export default function RecentHistory({ programId, rpcUrl, rooms, currentRoomId }: Props) {
  const [historyByRoom, setHistoryByRoom] = useState<Record<number, GameHistory[]>>({});
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionsRef = useRef<number[]>([]);
  const connectionRef = useRef<Connection | null>(null);

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
      console.error('Error parsing logs:', e);
    }
    return null;
  }, [programId]);

  const fetchInitialHistory = useCallback(async (connection: Connection) => {
    const historyMap: Record<number, GameHistory[]> = {};

    // Fetch all rooms in parallel for faster loading
    const fetchPromises = rooms.map(async (roomId) => {
      try {
        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('room'), Buffer.from([roomId])],
          programId
        );

        console.log(`[RecentHistory] Fetching signatures for room ${roomId}...`);
        const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 15 });
        console.log(`[RecentHistory] Found ${signatures.length} signatures for room ${roomId}`);
        
        const roomHistory: GameHistory[] = [];
        
        // Fetch transactions in parallel batches of 5 for speed
        const batchSize = 5;
        for (let i = 0; i < signatures.length; i += batchSize) {
          const batch = signatures.slice(i, i + batchSize);
          const txPromises = batch.map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed',
              });

              if (tx?.meta?.logMessages) {
                const game = parseGameFromLogs(tx.meta.logMessages, roomId, sig.signature);
                if (game) return game;
              }
            } catch (e) {
              // Skip failed transactions
            }
            return null;
          });
          
          const results = await Promise.all(txPromises);
          roomHistory.push(...results.filter((g): g is GameHistory => g !== null));
          
          // Stop if we have enough games
          if (roomHistory.length >= 10) break;
        }
        
        historyMap[roomId] = roomHistory.slice(0, 10);
        console.log(`[RecentHistory] Loaded ${roomHistory.length} games for room ${roomId}`);
      } catch (e) {
        console.error(`[RecentHistory] Error fetching room ${roomId}:`, e);
        historyMap[roomId] = [];
      }
    });

    await Promise.all(fetchPromises);
    console.log('[RecentHistory] All rooms loaded:', historyMap);
    return historyMap;
  }, [rooms, programId, parseGameFromLogs]);

  useEffect(() => {
    const connection = new Connection(rpcUrl, 'confirmed');
    connectionRef.current = connection;

    // Set loading to false immediately to show the component
    setLoading(false);

    // Fetch initial history in background
    console.log('[RecentHistory] Starting to fetch initial history...');
    fetchInitialHistory(connection).then((initialHistory) => {
      console.log('[RecentHistory] Initial history loaded:', initialHistory);
      setHistoryByRoom(initialHistory);
    }).catch((error) => {
      console.error('[RecentHistory] Error fetching initial history:', error);
      setHistoryByRoom({});
    });

    // Subscribe to all room PDAs for real-time updates using logs subscription
    rooms.forEach((roomId) => {
      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('room'), Buffer.from([roomId])],
        programId
      );

      // Use logs subscription for instant updates
      const subId = connection.onLogs(
        gamePda,
        async (logs) => {
          console.log(`[RecentHistory] Logs detected for room ${roomId}`);
          
          // Parse logs immediately
          const game = parseGameFromLogs(logs.logs, roomId, logs.signature);
          if (game) {
            console.log('[RecentHistory] New game detected instantly:', game);
            setHistoryByRoom((prev) => {
              const roomHistory = prev[roomId] || [];
              // Check if this game already exists
              if (roomHistory.some(g => g.signature === game.signature)) {
                return prev;
              }
              // Add new game at the beginning and keep only 10 per room
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

    // Cleanup subscriptions on unmount
    return () => {
      subscriptionsRef.current.forEach((subId) => {
        connection.removeOnLogsListener(subId).catch(console.error);
      });
      subscriptionsRef.current = [];
      connectionRef.current = null;
    };
  }, [programId, rpcUrl, rooms, fetchInitialHistory, parseGameFromLogs]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
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

  // Get history for current room or all rooms
  const displayHistory = currentRoomId 
    ? (historyByRoom[currentRoomId] || [])
    : Object.values(historyByRoom).flat().sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

  const roomLabel = currentRoomId ? getRoomLabel(currentRoomId) : 'All Rooms';

  // Show loading state only if we have no data at all
  const hasAnyData = Object.keys(historyByRoom).length > 0;
  const isLoadingData = loading || !hasAnyData;

  if (displayHistory.length === 0 && isLoadingData) {
    return (
      <div className="w-full glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games - {roomLabel}</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">Loading...</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[180px] bg-white/[0.02] border border-white/5 rounded-lg p-2.5 animate-pulse">
              <div className="h-4 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded mb-1.5" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayHistory.length === 0) {
    return (
      <div className="w-full glass-card p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games - {roomLabel}</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-[9px] text-[#14F195] uppercase tracking-wider font-bold">Live</span>
          </div>
        </div>
        <div className="mt-2 text-center py-4">
          <span className="text-[10px] text-zinc-600">No games yet in this room</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games - {roomLabel}</h3>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-[9px] text-[#14F195] uppercase tracking-wider font-bold">Live</span>
          </div>
          <button
            onClick={() => scroll('left')}
            className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-3 h-3 text-zinc-400" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar-horizontal"
        style={{ scrollbarWidth: 'thin' }}
      >
        <AnimatePresence initial={false}>
          {displayHistory.map((game) => (
            <motion.div
              key={game.signature}
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-shrink-0 w-[180px] bg-white/[0.02] border border-white/5 rounded-lg p-2.5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-[#14F195]" />
                  <span className="text-[#14F195] font-bold text-sm">{game.multiplier.toFixed(2)}x</span>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${game.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-[#9945FF] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mb-1.5">
                <span className="text-[#9945FF] font-bold">{getRoomLabel(game.roomId)} SOL</span>
                <span className="text-zinc-700">•</span>
                <span>{game.playerCount}P</span>
                <span className="text-zinc-700">•</span>
                <span className="text-[#14F195]">{game.winnersCount}W</span>
              </div>

              <div className="text-[10px] font-mono text-zinc-500">
                {game.totalPot.toFixed(3)} SOL
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
