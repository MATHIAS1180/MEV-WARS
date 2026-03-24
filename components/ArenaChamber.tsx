"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface ArenaChamberProps {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
}

const BULLET_COLORS = [
  "#9945FF", "#14F195", "#00C2FF", "#FF6B9D", "#FFB84D",
  "#A855F7", "#10B981", "#06B6D4", "#EC4899", "#F59E0B",
  "#8B5CF6", "#34D399", "#22D3EE", "#F472B6", "#FBBF24",
  "#7C3AED", "#6EE7B7", "#67E8F9", "#FDA4AF", "#FCD34D",
  "#6D28D9", "#059669", "#0891B2", "#BE185D", "#D97706",
  "#5B21B6", "#047857", "#0E7490", "#9F1239", "#B45309",
];

export default function ArenaChamber({ playerCount, isSpinning, rotation, countdown }: ArenaChamberProps) {
  const chambers = useMemo(() => {
    const total = 30;
    const result = [];
    for (let i = 0; i < total; i++) {
      const angle = (i * 360) / total;
      const isLoaded = i < playerCount;
      const color = isLoaded ? BULLET_COLORS[i % BULLET_COLORS.length] : "transparent";
      result.push({ angle, isLoaded, color });
    }
    return result;
  }, [playerCount]);

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <span className="text-[5rem] sm:text-[6rem] md:text-[7rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arena Container */}
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: isSpinning ? 5 : 0, ease: "easeOut" }}
        className="relative"
        style={{ width: "min(90vw, 400px)", height: "min(90vw, 400px)" }}
      >
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 bg-gradient-to-br from-black/80 to-black/95 shadow-[0_0_80px_rgba(220,31,255,0.3)]" />

        {/* Chambers */}
        {chambers.map((chamber, i) => {
          const radius = 45; // percentage from center
          const x = 50 + radius * Math.cos((chamber.angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((chamber.angle * Math.PI) / 180);

          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: chamber.isLoaded ? 1 : 0.6 }}
              transition={{ delay: i * 0.02 }}
              className="absolute w-[8%] h-[8%] rounded-full border-2"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: chamber.isLoaded ? chamber.color : "rgba(255,255,255,0.05)",
                borderColor: chamber.isLoaded ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                boxShadow: chamber.isLoaded ? `0 0 20px ${chamber.color}80` : "none",
              }}
            />
          );
        })}

        {/* Center Hub */}
        <div className="absolute inset-0 m-auto w-[25%] h-[25%] rounded-full bg-gradient-to-br from-[#DC1FFF]/20 to-[#00FFA3]/20 border-2 border-white/20 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]" />
      </motion.div>
    </div>
  );
}
