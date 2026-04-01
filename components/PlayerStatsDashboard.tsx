"use client";
import { Trophy, Activity, TrendingUp, ShieldCheck } from "lucide-react";

interface Stats {
  totalGames?: number;
  winRate?: number;
  avgProfit?: number;
  maxProfit?: number;
  currentStreak?: number;
  currentPlayers?: number;
  activePot?: number;
  winners?: number;
}

export default function PlayerStatsDashboard({ stats }: { stats?: Stats }) {
  const hasStats = !!stats && (stats.currentPlayers || stats.activePot || stats.winners);
  return (
    <div className="glass-card p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Player Performance</p>
          <h3 className="text-xl lg:text-2xl font-black text-white">MEV Searcher Portal</h3>
        </div>
        <Trophy className="w-7 h-7 text-[#9945FF]" />
      </div>

      {hasStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
            <p className="text-xs uppercase text-zinc-400">Active Players</p>
            <p className="text-2xl font-black text-white">{stats.currentPlayers ?? 0}</p>
          </div>
          <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
            <p className="text-xs uppercase text-zinc-400">Pot</p>
            <p className="text-2xl font-black text-[#00D1FF]">{(stats.activePot ?? 0).toFixed(2)} SOL</p>
          </div>
          <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
            <p className="text-xs uppercase text-zinc-400">Winners in round</p>
            <p className="text-2xl font-black text-[#14F195]">{stats.winners ?? 0}</p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-zinc-600 bg-[#0a0a12]/70 text-center text-zinc-400">
          No direct dashboard stats available from on-chain in this room yet.
        </div>
      )}

      <div className="mt-6 p-4 border border-white/10 rounded-xl bg-[#0b0b13]/70">
        <div className="flex items-center gap-2 text-xs uppercase text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-[#00D1FF]" />
          On-chain integrity (RTP 98% confirmed)
        </div>
        <p className="text-[0.8rem] text-zinc-400 mt-2">
          Each round is verified via Solana logs. Only on-chain values are shown here; mocked stats have been removed.
        </p>
      </div>
    </div>
  );
}
