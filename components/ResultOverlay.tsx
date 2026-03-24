"use client";
import { motion } from "framer-motion";
import { Trophy, Skull, Sparkles } from "lucide-react";

interface ResultOverlayProps {
  type: "win" | "lose";
  message: string;
  amount?: number;
  onClose: () => void;
}

export default function ResultOverlay({ type, message, amount, onClose }: ResultOverlayProps) {
  const isWin = type === "win";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-3xl blur-3xl ${
            isWin ? "bg-[#00FFA3]/30" : "bg-zinc-800/30"
          }`}
        />

        {/* Card */}
        <div className="relative bg-gradient-to-br from-black/90 to-black/95 border-2 border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border-4 ${
              isWin
                ? "bg-gradient-to-br from-[#00FFA3]/20 to-[#03E1FF]/20 border-[#00FFA3]/50"
                : "bg-white/5 border-white/10"
            }`}
          >
            {isWin ? (
              <Trophy className="w-10 h-10 text-[#00FFA3]" />
            ) : (
              <Skull className="w-10 h-10 text-zinc-500" />
            )}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-black uppercase tracking-tight mb-3 ${
              isWin
                ? "text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]"
                : "text-zinc-400"
            }`}
          >
            {isWin ? "YOU WON!" : "NEXT TIME!"}
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-sm mb-6 leading-relaxed"
          >
            {message}
          </motion.p>

          {/* Amount */}
          {amount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-6 bg-gradient-to-br from-[#00FFA3]/10 to-[#03E1FF]/10 border border-[#00FFA3]/30 rounded-2xl"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#00FFA3]" />
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
                  Prize
                </span>
                <Sparkles className="w-4 h-4 text-[#00FFA3]" />
              </div>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
                +{amount} SOL
              </p>
            </motion.div>
          )}

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:shadow-[0_0_50px_rgba(0,255,163,0.6)] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isWin ? "Play Again" : "Try Again"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
