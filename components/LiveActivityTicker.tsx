"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Radio } from "lucide-react";
import { useEffect, useState } from "react";

interface ActivityEvent {
  id: string;
  type: "win" | "join" | "mining" | "block_completed";
  player: string;
  amount?: number;
  blockNumber?: number;
  timestamp: number;
}

// Mock activity data
const generateMockActivity = (): ActivityEvent[] => [
  { id: "1", type: "win", player: "5a7z...9Kx2", amount: 0.95, blockNumber: 1432, timestamp: Date.now() },
  { id: "2", type: "join", player: "4Lm7...Qp9", blockNumber: 1431, timestamp: Date.now() - 5000 },
  { id: "3", type: "mining", player: "8Rx5...2Wy3", blockNumber: 1431, timestamp: Date.now() - 10000 },
  { id: "4", type: "win", player: "3Qp9...7Wy3", amount: 1.23, blockNumber: 1430, timestamp: Date.now() - 15000 },
  { id: "5", type: "join", player: "2Wy3...Kx2", blockNumber: 1430, timestamp: Date.now() - 20000 },
];

const activityMessages = {
  win: (player: string, amount?: number, blockNumber?: number) => 
    `🏆 ${player} mined ${amount?.toFixed(2)} SOL in Block #${blockNumber}!`,
  join: (player: string, blockNumber?: number) => 
    `🔗 ${player} joined Block #${blockNumber}`,
  mining: (player: string, blockNumber?: number) => 
    `⚙️ Mining Block #${blockNumber}... ${player} participating`,
  block_completed: (player: string, blockNumber?: number) => 
    `✨ Block #${blockNumber} completed and settled on-chain`,
};

const eventColors = {
  win: "#14F195",
  join: "#00D1FF",
  mining: "#9945FF",
  block_completed: "#DC1FFF",
};

export default function LiveActivityTicker() {
  const [activities, setActivities] = useState<ActivityEvent[]>(generateMockActivity());
  const [displayedActivities, setDisplayedActivities] = useState(activities.slice(0, 3));

  useEffect(() => {
    // Rotate activities every 4 seconds
    const timer = setInterval(() => {
      setActivities(prev => {
        const newActivities = generateMockActivity();
        setDisplayedActivities(newActivities.slice(0, 3));
        return newActivities;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-[#00D1FF]" />
            <div className="absolute inset-0 animate-ping opacity-75">
              <Radio className="w-6 h-6 text-[#00D1FF]" />
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white">
            Live Activity
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[#14F195]">
          <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {displayedActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: 10 }}
              transition={{ duration: 0.4 }}
              className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D1FF]/30 transition-all overflow-hidden"
            >
              {/* Activity type indicator */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: eventColors[activity.type as keyof typeof eventColors] }}
              />

              {/* Content */}
              <div className="pl-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm lg:text-base font-bold text-white truncate">
                    {activityMessages[activity.type as keyof typeof activityMessages](
                      activity.player,
                      activity.amount,
                      activity.blockNumber
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* Amount badge for wins */}
                {activity.type === "win" && activity.amount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#14F195]/10 border border-[#14F195]/50"
                  >
                    <Zap className="w-4 h-4 text-[#14F195]" />
                    <span className="text-sm font-black text-[#14F195]">
                      +{activity.amount.toFixed(2)} SOL
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Animated glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${eventColors[activity.type as keyof typeof eventColors]}20 0%, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl lg:text-3xl font-black text-[#14F195]">8.5K</p>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">Total Blocks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl lg:text-3xl font-black text-[#00D1FF]">2.4M</p>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">SOL Wagered</p>
        </div>
        <div className="text-center">
          <p className="text-2xl lg:text-3xl font-black text-[#9945FF]">12.1K</p>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">Active Players</p>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center text-xs text-zinc-600">
        Updates in real-time • Verified on-chain
      </div>
    </div>
  );
}
