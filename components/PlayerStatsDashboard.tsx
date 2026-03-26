"use client";
import { Trophy, Activity, TrendingUp, ShieldCheck } from "lucide-react";

interface Stats {
  totalGames: number;
  winRate: number;
  avgProfit: number;
  maxProfit: number;
  currentStreak: number;
}

const DEMO_STATS: Stats = {
  totalGames: 312,
  winRate: 58.3,
  avgProfit: 0.72,
  maxProfit: 6.84,
  currentStreak: 7,
};

export default function PlayerStatsDashboard({ stats = DEMO_STATS }: { stats?: Stats }) {
  return (
    <div className="glass-card p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Player Performance</p>
          <h3 className="text-xl lg:text-2xl font-black text-white">MEV Searcher Portal</h3>
        </div>
        <Trophy className="w-7 h-7 text-[#9945FF]" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
          <p className="text-xs uppercase text-zinc-400">Total Games</p>
          <p className="text-2xl font-black text-white">{stats.totalGames}</p>
        </div>
        <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
          <p className="text-xs uppercase text-zinc-400">Win Rate</p>
          <p className="text-2xl font-black text-[#14F195]">{stats.winRate}%</p>
        </div>
        <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
          <p className="text-xs uppercase text-zinc-400">Avg Profit</p>
          <p className="text-2xl font-black text-[#00D1FF]">{stats.avgProfit.toFixed(2)} SOL</p>
        </div>
        <div className="col-span-2 sm:col-span-1 border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
          <p className="text-xs uppercase text-zinc-400">Max Profit</p>
          <p className="text-2xl font-black text-[#DC1FFF]">{stats.maxProfit.toFixed(2)} SOL</p>
        </div>
        <div className="border border-white/10 p-3 rounded-xl bg-[#07070f]/60">
          <p className="text-xs uppercase text-zinc-400">Win Streak</p>
          <p className="text-2xl font-black text-[#14F195]">{stats.currentStreak}</p>
        </div>
      </div>

      <div className="mt-6 p-4 border border-white/10 rounded-xl bg-[#0b0b13]/70">
        <div className="flex items-center gap-2 text-xs uppercase text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-[#00D1FF]" />
          On-chain integrity (RTP 95% confirmed)
        </div>
        <p className="text-[0.8rem] text-zinc-400 mt-2">
          Each round is verified via Solana logs. Stats are synchronized with the verified results on-chain.
        </p>
      </div>
    </div>
  );
}
