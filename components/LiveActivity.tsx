"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: "win" | "join";
  address: string;
  amount?: number;
  timestamp: number;
}

export default function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Mock activity feed - replace with real data
  useEffect(() => {
    const mockActivities: Activity[] = [
      { id: "1", type: "win", address: "8xA...kP9", amount: 0.285, timestamp: Date.now() - 5000 },
      { id: "2", type: "join", address: "3mB...xL2", timestamp: Date.now() - 12000 },
      { id: "3", type: "win", address: "5nC...qR7", amount: 0.95, timestamp: Date.now() - 25000 },
    ];
    setActivities(mockActivities);
  }, []);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4 text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          Live Activity
        </h3>

        <div className="space-y-3 max-h-[200px] overflow-y-auto">
          <AnimatePresence>
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                {activity.type === "win" ? (
                  <Trophy className="w-4 h-4 text-[#00FFA3] flex-shrink-0" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[#03E1FF] flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">
                    {activity.type === "win" ? (
                      <>
                        <span className="font-mono text-white">{activity.address}</span> won{" "}
                        <span className="text-[#00FFA3] font-bold">{activity.amount} SOL</span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-white">{activity.address}</span> joined the round
                      </>
                    )}
                  </p>
                </div>

                <span className="text-xs text-zinc-500 flex-shrink-0">
                  {Math.floor((Date.now() - activity.timestamp) / 1000)}s ago
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
