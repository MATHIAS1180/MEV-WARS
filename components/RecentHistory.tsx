"use client";
import { useEffect, useState, useRef } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BorshCoder, EventParser } from "@coral-xyz/anchor";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { IDL } from "@/utils/anchor";

interface GameHistory {
  signature: string;
  timestamp: number;
  totalPot: number;
  playerCount: number;
  winnersCount: number;
  winners: string[];
  multiplier: number;
}

interface Props {
  roomId: number;
  programId: PublicKey;
  rpcUrl: string;
}

export default function RecentHistory({ roomId, programId, rpcUrl }: Props) {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const connection = new Connection(rpcUrl, 'confirmed');
        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('room'), Buffer.from([roomId])],
          programId
        );

        // Get recent transactions for this game account
        const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 20 });
        
        const historyData: GameHistory[] = [];
        const parser = new EventParser(programId, new BorshCoder(IDL as any));

        for (const sig of signatures) {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            });

            if (!tx?.meta?.logMessages) continue;

            // Parse events from logs
            const events = parser.parseLogs(tx.meta.logMessages);
            
            let totalPot = 0;
            let winnersCount = 0;
            const winners: string[] = [];
            let hasSettledEvent = false;

            for (const event of events) {
              if (event.name === 'GameSettledEvent') {
                hasSettledEvent = true;
                const data = event.data as any;
                totalPot = data.totalPot?.toNumber() || 0;
                winnersCount = data.winnersCount || 0;
              }
              
              if (event.name === 'WinnerExtractedEvent') {
                const data = event.data as any;
                const winnerPubkey = data.winner?.toString();
                if (winnerPubkey && !winners.includes(winnerPubkey)) {
                  winners.push(winnerPubkey);
                }
              }
            }

            if (hasSettledEvent && totalPot > 0 && winnersCount > 0) {
              const playerCount = winnersCount * 3; // 1 winner per 3 players
              const entryFee = totalPot / playerCount;
              const prizePerWinner = (totalPot * 0.95) / winnersCount;
              const multiplier = prizePerWinner / entryFee;

              historyData.push({
                signature: sig.signature,
                timestamp: sig.blockTime || 0,
                totalPot: totalPot / 1e9, // Convert lamports to SOL
                playerCount,
                winnersCount,
                winners,
                multiplier,
              });
            }
          } catch (e) {
            console.error('Error parsing transaction:', e);
          }
        }

        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [roomId, programId, rpcUrl]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of one card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full glass-card p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest mb-3">Recent Games</h3>
        <p className="text-zinc-600 text-xs">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="w-full glass-card p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest mb-3">Recent Games</h3>
        <p className="text-zinc-600 text-xs">No games played yet in this room</p>
      </div>
    );
  }

  return (
    <div className="w-full glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs sm:text-sm font-black text-zinc-500 uppercase tracking-widest">Recent Games</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-700 uppercase tracking-wider">Room {roomId}</span>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-horizontal"
        style={{ scrollbarWidth: 'thin' }}
      >
        {history.map((game, index) => (
          <motion.div
            key={game.signature}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 w-[300px] bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#14F195]" />
                <span className="text-[#14F195] font-bold text-lg">{game.multiplier.toFixed(2)}x</span>
              </div>
              <a
                href={`https://explorer.solana.com/tx/${game.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-[#9945FF] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{game.playerCount}</span>
              </div>
              <div>
                <span className="text-[#14F195] font-bold">{game.winnersCount}</span> winner{game.winnersCount > 1 ? 's' : ''}
              </div>
              <div className="text-zinc-500 font-mono">
                {game.totalPot.toFixed(3)} SOL
              </div>
            </div>

            {game.winners.length > 0 && (
              <div className="space-y-1 mb-3">
                {game.winners.slice(0, 2).map((winner, i) => (
                  <div key={i} className="text-[10px] font-mono text-zinc-600 truncate">
                    🏆 {winner.slice(0, 4)}...{winner.slice(-4)}
                  </div>
                ))}
                {game.winners.length > 2 && (
                  <div className="text-[10px] text-zinc-700">
                    +{game.winners.length - 2} more
                  </div>
                )}
              </div>
            )}

            {game.timestamp > 0 && (
              <div className="text-[10px] text-zinc-700">
                {new Date(game.timestamp * 1000).toLocaleString()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
