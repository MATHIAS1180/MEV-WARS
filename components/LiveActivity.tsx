"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, UserPlus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useLiveActivity } from "@/hooks/useLiveActivity";

const ROOM_LABELS: Record<number, string> = {
  101: "0.01 SOL",
  102: "0.1 SOL",
  103: "1.0 SOL",
};

export default function LiveActivity() {
  const { activities } = useLiveActivity();
  const [timeNow, setTimeNow] = useState(Date.now());

  // Update time every second for "X seconds ago"
  useEffect(() => {
    const interval = setInterval(() => setTimeNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((timeNow - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
            </div>
            Live Activity
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {activities.length} event{activities.length !== 1 ? 's' : ''}
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <RefreshCw className="w-8 h-8 text-zinc-600 mb-3 animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-sm text-zinc-500">Waiting for activity...</p>
            <p className="text-xs text-zinc-600 mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                >
                  {activity.type === "win" ? (
                    <div className="w-8 h-8 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-[#00FFA3]" />
                    </div>
                  ) : activity.type === "refund" ? (
                    <div className="w-8 h-8 rounded-full bg-[#DC1FFF]/10 border border-[#DC1FFF]/30 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-4 h-4 text-[#DC1FFF]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#03E1FF]/10 border border-[#03E1FF]/30 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-[#03E1FF]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">
                      {activity.type === "win" ? (
                        <>
                          <span className="font-mono text-white font-bold">{activity.address}</span> won{" "}
                          <span className="text-[#00FFA3] font-bold">{activity.amount} SOL</span>
                        </>
                      ) : activity.type === "refund" ? (
                        <>
                          Round refunded in <span className="text-[#DC1FFF] font-bold">{ROOM_LABELS[activity.roomId]}</span> room
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-white font-bold">{activity.address}</span> joined{" "}
                          <span className="text-[#03E1FF] font-bold">{ROOM_LABELS[activity.roomId]}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <span className="text-xs text-zinc-500 flex-shrink-0 font-mono">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 163, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 163, 0.5);
        }
      `}</style>
    </section>
  );
}
