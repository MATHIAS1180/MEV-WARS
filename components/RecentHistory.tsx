"use client";
import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, Users } from "lucide-react";

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const connection = new Connection(rpcUrl, 'confirmed');
        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('room'), Buffer.from([roomId])],
          programId
        );

        // Get recent transactions for this game account
        const signatures = await connection.getSignaturesForAddress(gamePda, { limit: 10 });
        
        const historyData: GameHistory[] = [];

        for (const sig of signatures) {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            });

            if (!tx?.meta?.logMessages) continue;

            // Parse logs for GameSettledEvent
            const logs = tx.meta.logMessages;
            let totalPot = 0;
            let winnersCount = 0;
            const winners: string[] = [];

            for (const log of logs) {
              // Look for event data in logs
              if (log.includes('GameSettledEvent')) {
                // Extract data from subsequent logs
                const potMatch = logs.find(l => l.includes('total_pot'));
                const winnersMatch = logs.find(l => l.includes('winners_count'));
                
                if (potMatch) {
                  const match = potMatch.match(/total_pot:\s*(\d+)/);
                  if (match) totalPot = parseInt(match[1]);
                }
                if (winnersMatch) {
                  const match = winnersMatch.match(/winners_count:\s*(\d+)/);
                  if (match) winnersCount = parseInt(match[1]);
                }
              }
              
              if (log.includes('WinnerExtractedEvent')) {
                const winnerMatch = log.match(/winner:\s*([A-Za-z0-9]{32,44})/);
                if (winnerMatch && !winners.includes(winnerMatch[1])) {
                  winners.push(winnerMatch[1]);
                }
              }
            }

            if (totalPot > 0 && winnersCount > 0) {
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [roomId, programId, rpcUrl]);

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Recent Games</h3>
        <p className="text-zinc-600 text-xs">Loading...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Recent Games</h3>
        <p className="text-zinc-600 text-xs">No games played yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Recent Games</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {history.map((game, index) => (
          <motion.div
            key={game.signature}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/[0.02] border border-white/5 rounded-lg p-3 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#14F195]" />
                <span className="text-[#14F195] font-bold text-sm">{game.multiplier.toFixed(2)}x</span>
              </div>
              <a
                href={`https://explorer.solana.com/tx/${game.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-[#9945FF] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400 mb-2">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{game.playerCount} players</span>
              </div>
              <div>
                <span className="text-[#14F195]">{game.winnersCount}</span> winner{game.winnersCount > 1 ? 's' : ''}
              </div>
              <div className="text-zinc-500">
                {game.totalPot.toFixed(3)} SOL
              </div>
            </div>

            {game.winners.length > 0 && (
              <div className="space-y-1">
                {game.winners.slice(0, 3).map((winner, i) => (
                  <div key={i} className="text-[10px] font-mono text-zinc-600 truncate">
                    🏆 {winner.slice(0, 4)}...{winner.slice(-4)}
                  </div>
                ))}
                {game.winners.length > 3 && (
                  <div className="text-[10px] text-zinc-700">
                    +{game.winners.length - 3} more
                  </div>
                )}
              </div>
            )}

            {game.timestamp > 0 && (
              <div className="text-[10px] text-zinc-700 mt-2">
                {new Date(game.timestamp * 1000).toLocaleString()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
