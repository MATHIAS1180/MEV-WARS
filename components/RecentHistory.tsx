"use client";
import { useEffect, useState, useRef } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BorshCoder, EventParser } from "@coral-xyz/anchor";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
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
              const playerCount = winnersCount * 3;
              const entryFee = totalPot / playerCount;
              const prizePerWinner = (totalPot * 0.95) / winnersCount;
              const multiplier = prizePerWinner / entryFee;

              historyData.push({
                signature: sig.signature,
                timestamp: sig.blockTime || 0,
                totalPot: totalPot / 1e9,
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
    
    // Refresh every 5 seconds for faster updates
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [roomId, programId, rpcUrl]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full glass-card p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games</h3>
          <span className="text-[9px] text-zinc-700">Loading...</span>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="w-full glass-card p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games</h3>
          <span className="text-[9px] text-zinc-700">No games yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Games</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-700 uppercase tracking-wider">Room {roomId}</span>
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
        {history.map((game, index) => (
          <motion.div
            key={game.signature}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
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
              <span>{game.playerCount} players</span>
              <span className="text-zinc-700">•</span>
              <span className="text-[#14F195]">{game.winnersCount}W</span>
            </div>

            <div className="text-[10px] font-mono text-zinc-500">
              {game.totalPot.toFixed(3)} SOL
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
