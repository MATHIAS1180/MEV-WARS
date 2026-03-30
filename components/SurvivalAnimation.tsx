"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SurvivalAnimationProps {
  survivors: string[];
  eliminated: string[];
  onComplete?: () => void;
}

export default function SurvivalAnimation({ survivors, eliminated, onComplete }: SurvivalAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
      onComplete?.();
    }, 3000); // 3 seconds animation

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!showAnimation) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      <div className="text-center">
        {/* Eliminated */}
        {eliminated.length > 0 && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0.8, opacity: 0.5 }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-red-500 mb-4">Éliminés</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {eliminated.map((player, i) => (
                <motion.div
                  key={player}
                  initial={{ scale: 1 }}
                  animate={{ scale: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="bg-red-500/20 border border-red-500 rounded-full px-4 py-2 text-red-300"
                >
                  {player.slice(0, 8)}...
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Survivors */}
        {survivors.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <h2 className="text-2xl font-bold text-green-500 mb-4">Survivants</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {survivors.map((player, i) => (
                <motion.div
                  key={player}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.5, type: "spring" }}
                  className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2 text-green-300 animate-pulse"
                >
                  {player.slice(0, 8)}...
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}