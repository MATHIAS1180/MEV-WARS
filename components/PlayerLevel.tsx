"use client";
import { motion } from "framer-motion";
import { Award, TrendingUp } from "lucide-react";

type PlayerLevelType = "NOVICE" | "EXPLORER" | "PRO" | "WHALE";

interface PlayerLevelProps {
  level?: PlayerLevelType;
  progressPercentage?: number;
}

const LEVEL_CONFIG = {
  NOVICE: {
    label: "Novice",
    icon: "🌱",
    color: "#9945FF",
    minWins: 0,
    description: "Just starting your MEV journey",
  },
  EXPLORER: {
    label: "Explorer",
    icon: "🔍",
    color: "#00D1FF",
    minWins: 10,
    description: "Discovering block mining strategies",
  },
  PRO: {
    label: "Pro",
    icon: "⚡",
    color: "#14F195",
    minWins: 50,
    description: "Mastering MEV extraction",
  },
  WHALE: {
    label: "Whale",
    icon: "🐋",
    color: "#DC1FFF",
    minWins: 200,
    description: "Ultimate MEV dominator",
  },
};

export default function PlayerLevel({ level = "NOVICE", progressPercentage = 35 }: PlayerLevelProps) {
  const config = LEVEL_CONFIG[level];
  const nextLevelKey = Object.keys(LEVEL_CONFIG)[Object.keys(LEVEL_CONFIG).indexOf(level) + 1] || null;
  const nextConfig = nextLevelKey ? LEVEL_CONFIG[nextLevelKey as PlayerLevelType] : null;

  return (
    <div className="glass-card p-6">
      {/* Current Level Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase text-zinc-400 tracking-wider font-bold mb-2">Current Level</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{config.icon}</span>
            <div>
              <h3 className="text-2xl lg:text-3xl font-black text-white">{config.label}</h3>
              <p className="text-sm text-zinc-400 mt-1">{config.description}</p>
            </div>
          </div>
        </div>
        <Award className="w-8 h-8 text-[#DC1FFF]" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-zinc-400">Progress to Next Level</p>
          <p className="text-sm font-black text-[#00D1FF]">{progressPercentage}%</p>
        </div>

        <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${config.color}, ${nextConfig?.color || config.color})`,
              boxShadow: `0 0 20px ${config.color}80`,
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">This Week</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#14F195]" />
            <p className="text-lg font-black text-white">12 Wins</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">Multiplier</p>
          <p className="text-lg font-black text-[#14F195]">1.25x</p>
        </div>
      </div>

      {/* Level Progression Timeline */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider mb-3">Level Progression</p>
        <div className="flex justify-between items-end gap-2">
          {Object.entries(LEVEL_CONFIG).map(([levelKey, levelConfig], idx) => {
            const isActive = Object.keys(LEVEL_CONFIG).indexOf(level) >= idx;
            const isCurrent = levelKey === level;

            return (
              <motion.div
                key={levelKey}
                className="flex-1 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="mb-2">
                  <motion.div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                      isCurrent
                        ? "scale-110 border-[#00D1FF] bg-[#00D1FF]/20"
                        : isActive
                        ? "border-[#14F195]/50 bg-[#14F195]/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    whileHover={isActive ? { scale: 1.05 } : {}}
                  >
                    {levelConfig.icon}
                  </motion.div>
                </div>
                <p className="text-xs font-bold text-white">{levelConfig.label}</p>
                <p className="text-[0.6rem] text-zinc-400">{levelConfig.minWins}+ wins</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Rewards Preview */}
      {nextConfig && (
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <p className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Next Level Perks</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            <li className="flex items-center gap-2">
              <span className="text-[#14F195]">✓</span> Unlock {nextConfig.label} Cosmetics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#14F195]">✓</span> Increased payout multiplier
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#14F195]">✓</span> Exclusive leaderboard ranking
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
