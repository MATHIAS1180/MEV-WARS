"use client";
import { motion } from "framer-motion";
import { Users, Trophy, Coins, Clock } from "lucide-react";

interface StatsGridProps {
  playerCount: number;
  potAmount: number;
  winnerCount: number;
  timeRemaining?: number | null;
}

export default function StatsGrid({ playerCount, potAmount, winnerCount, timeRemaining }: StatsGridProps) {
  const stats = [
    {
      icon: <Users className="w-5 h-5" />,
      label: "Players",
      value: playerCount,
      suffix: "",
      color: "from-[#00FFA3] to-[#03E1FF]",
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: "Winners",
      value: winnerCount,
      suffix: "",
      color: "from-[#DC1FFF] to-[#00FFA3]",
    },
    {
      icon: <Coins className="w-5 h-5" />,
      label: "Pool",
      value: potAmount.toFixed(3),
      suffix: "SOL",
      color: "from-[#03E1FF] to-[#DC1FFF]",
    },
  ];

  if (timeRemaining !== null && timeRemaining !== undefined) {
    stats.push({
      icon: <Clock className="w-5 h-5" />,
      label: "Time Left",
      value: `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, "0")}`,
      suffix: "",
      color: "from-[#00FFA3] to-[#DC1FFF]",
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
              {stat.label}
            </p>
          </div>
          <div className="flex items-baseline gap-1">
            <p className={`text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
              {stat.value}
            </p>
            {stat.suffix && (
              <span className="text-xs text-zinc-600 font-bold">{stat.suffix}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
