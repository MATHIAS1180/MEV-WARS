"use client";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface RouletteBarrelProps {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
}

const COLORS = [
  "#9945FF", "#14F195", "#00C2FF", "#FF6B9D", "#FFB84D",
  "#A855F7", "#10B981", "#06B6D4", "#EC4899", "#F59E0B",
];

export default function RouletteBarrel({ playerCount, isSpinning, rotation }: RouletteBarrelProps) {
  const slots = useMemo(() => {
    const total = 30;
    return Array.from({ length: total }, (_, i) => ({
      id: i,
      isActive: i < playerCount,
      color: COLORS[i % COLORS.length],
    }));
  }, [playerCount]);

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto">
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#DC1FFF]/30 via-transparent to-[#00FFA3]/30 blur-3xl animate-pulse" />

      {/* Main Barrel */}
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: isSpinning ? 5 : 0, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full h-full"
      >
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 bg-gradient-radial from-black/60 via-black/80 to-black/95 shadow-[0_0_100px_rgba(220,31,255,0.4)]">
          {/* Slots */}
          {slots.map((slot) => {
            const angle = (slot.id * 360) / 30;
            const radius = 42;
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

            return (
              <motion.div
                key={slot.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: slot.isActive ? 1 : 0.5,
                  opacity: slot.isActive ? 1 : 0.3,
                }}
                transition={{ delay: slot.id * 0.015, duration: 0.3 }}
                className="absolute w-[10%] h-[10%] rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: slot.isActive ? slot.color : "rgba(255,255,255,0.05)",
                  boxShadow: slot.isActive ? `0 0 20px ${slot.color}` : "none",
                  border: `2px solid ${slot.isActive ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              />
            );
          })}
        </div>

        {/* Center Logo */}
        <div className="absolute inset-0 m-auto w-[30%] h-[30%] rounded-full bg-gradient-to-br from-[#DC1FFF]/30 to-[#00FFA3]/30 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
          <span className="text-2xl font-black text-white/80">MEV</span>
        </div>
      </motion.div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#00FFA3] drop-shadow-[0_0_10px_rgba(0,255,163,0.8)]" />
      </div>
    </div>
  );
}
