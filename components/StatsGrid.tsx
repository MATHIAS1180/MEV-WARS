"use client";

import { motion } from "framer-motion";
import { Users, Trophy, Clock, Zap } from "lucide-react";

interface StatsGridProps {
  playerCount: number;
  potAmount: number;
  timeRemaining: number | null;
}

export default function StatsGrid({ playerCount, potAmount, timeRemaining }: StatsGridProps) {
  const stats = [
    {
      label: "Chamber Load",
      value: `${playerCount} / 3`,
      sub: "Units Armed",
      icon: Users,
      progress: (playerCount / 3) * 100,
      color: "var(--accent-primary)"
    },
    {
      label: "Live Jackpot",
      value: `${potAmount.toFixed(3)}`,
      sub: "SOL Net Winner",
      icon: Trophy,
      color: "white"
    },
    {
      label: "Session Timer",
      value: timeRemaining !== null ? `${timeRemaining}s` : "-- : --",
      sub: "Safety Purge",
      icon: Clock,
      color: "var(--accent-secondary)"
    },
    {
      label: "Win Probability",
      value: "33.3%",
      sub: "Verifiable Entropy",
      icon: Zap,
      color: "white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-6 flex flex-col justify-between h-32 group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {stat.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {stat.value}
                </span>
                {stat.label === "Live Jackpot" && <span className="text-[10px] font-bold text-zinc-600">SOL</span>}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
              <stat.icon size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter text-zinc-600">
              <span>{stat.sub}</span>
            </div>
            {stat.progress !== undefined && (
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  className="h-full bg-white"
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
