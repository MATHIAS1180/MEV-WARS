"use client";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Zap } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  dailyWins: number;
  totalWinnings: number;
  level: string;
  status: "online" | "idle" | "offline";
}

// Mock leaderboard data - in production, this would come from on-chain data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "SoL1A...9Kx2",
    displayName: "MEV_Seeker",
    dailyWins: 47,
    totalWinnings: 2845.35,
    level: "WHALE",
    status: "online"
  },
  {
    rank: 2,
    address: "Sol2B...4Lm7",
    displayName: "BlockMiner",
    dailyWins: 38,
    totalWinnings: 1923.50,
    level: "PRO",
    status: "online"
  },
  {
    rank: 3,
    address: "Sol3C...8Qp9",
    displayName: "CyberGhost",
    dailyWins: 29,
    totalWinnings: 1456.20,
    level: "PRO",
    status: "idle"
  },
  {
    rank: 4,
    address: "Sol4D...2Rx5",
    displayName: "HoloDiver",
    dailyWins: 21,
    totalWinnings: 987.65,
    level: "EXPLORER",
    status: "online"
  },
  {
    rank: 5,
    address: "Sol5E...7Wy3",
    displayName: "QuantumRush",
    dailyWins: 15,
    totalWinnings: 652.40,
    level: "EXPLORER",
    status: "offline"
  },
];

const levelColors = {
  NOVICE: "#9945FF",
  EXPLORER: "#00D1FF",
  PRO: "#14F195",
  WHALE: "#DC1FFF",
};

const statusColors = {
  online: "#14F195",
  idle: "#FFB84D",
  offline: "#a1a1aa",
};

export default function MEVLeaderboard() {
  return (
    <div className="glass-card p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#DC1FFF]" />
          <h2 className="text-2xl lg:text-3xl font-black text-white">
            Top MEV Masters
          </h2>
        </div>
        <div className="text-xs font-mono text-[#00D1FF] bg-[#00D1FF]/10 px-3 py-1 rounded-full border border-[#00D1FF]/30">
          24H Rankings
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative p-3 lg:p-4 rounded-xl transition-all cursor-pointer ${
              entry.rank === 1
                ? "bg-gradient-to-r from-[#DC1FFF]/20 to-[#9945FF]/10 border border-[#DC1FFF]/50"
                : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D1FF]/30"
            }`}
          >
            {/* Rank badge */}
            <div className="absolute -left-3 -top-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                entry.rank === 1
                  ? "bg-[#DC1FFF] text-black"
                  : entry.rank === 2
                  ? "bg-[#C0C0C0] text-black"
                  : entry.rank === 3
                  ? "bg-[#CD7F32] text-white"
                  : "bg-[#00D1FF] text-black"
              }`}>
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
              </div>
            </div>

            <div className="flex items-center justify-between ml-6">
              {/* Player Info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Status Indicator */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: statusColors[entry.status as keyof typeof statusColors],
                      boxShadow: `0 0 8px ${statusColors[entry.status as keyof typeof statusColors]}`
                    }}
                  />
                  <span className="text-[0.6rem] font-bold uppercase text-zinc-400">
                    {entry.status}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate">
                    {entry.displayName}
                  </p>
                  <p className="text-xs font-mono text-zinc-400">
                    {entry.address}
                  </p>
                </div>

                {/* Level Badge */}
                <div 
                  className="px-3 py-1 rounded-full border font-bold text-xs uppercase tracking-wider"
                  style={{
                    color: levelColors[entry.level as keyof typeof levelColors],
                    borderColor: levelColors[entry.level as keyof typeof levelColors] + "50",
                    backgroundColor: levelColors[entry.level as keyof typeof levelColors] + "10",
                  }}
                >
                  {entry.level}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 ml-4 hidden sm:flex">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#14F195] font-black text-sm lg:text-base">
                    <TrendingUp className="w-4 h-4" />
                    {entry.dailyWins}
                  </div>
                  <p className="text-[0.65rem] text-zinc-400 uppercase tracking-wider">Wins</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#00D1FF] font-black text-sm lg:text-base">
                    <Zap className="w-4 h-4" />
                    {entry.totalWinnings}
                  </div>
                  <p className="text-[0.65rem] text-zinc-400 uppercase tracking-wider">SOL</p>
                </div>
              </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,209,255,0.1) 0%, transparent 70%)",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 py-3 px-4 rounded-xl border border-[#00D1FF]/50 bg-[#00D1FF]/5 hover:bg-[#00D1FF]/10 text-[#00D1FF] font-bold uppercase tracking-wider transition-all"
      >
        View Full Leaderboard
      </motion.button>

      {/* RTP Transparency Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">
          📊 RTP: <span className="text-[#14F195] font-black">95%</span> On-Chain Verifiable
        </p>
        <p className="text-[0.65rem] text-zinc-600 mt-1">
          All payouts verified instantly on Solana blockchain
        </p>
      </div>
    </div>
  );
}
