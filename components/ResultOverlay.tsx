"use client";
import { motion } from "framer-motion";
import { Trophy, Skull, Sparkles, ShieldCheck, ArrowRight, LogOut } from "lucide-react";

interface ResultOverlayProps {
  type: "win" | "lose" | "survive";
  title?: string;
  message: string;
  amount?: number;
  multiplier?: number;
  actionLabel?: string;
  autoCloseInSeconds?: number;
  isFinal?: boolean;
  onClose: () => void;
}

export default function ResultOverlay({
  type,
  title,
  message,
  amount,
  multiplier,
  actionLabel,
  autoCloseInSeconds = 5,
  isFinal = false,
  onClose,
}: ResultOverlayProps) {
  const isWin = type === "win";
  const isSurvive = type === "survive";

  const resolvedTitle = title ?? (isWin ? "VICTOIRE" : isSurvive ? "SURVÉCU" : "DÉFAITE");
  const resolvedActionLabel = actionLabel ?? (isFinal ? "Quitter" : "Next Round");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative w-full max-w-5xl min-h-[72vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-3xl blur-3xl ${
            isWin
              ? "bg-[#00FFA3]/30"
              : isSurvive
                ? "bg-[#03E1FF]/25"
                : "bg-[#FF5B5B]/20"
          }`}
        />

        <div className="relative overflow-hidden bg-gradient-to-br from-black/90 via-black/95 to-black border-2 border-white/10 rounded-3xl p-6 sm:p-10 text-center shadow-2xl h-full">
          <div className="pointer-events-none absolute -top-10 -left-10 w-56 h-56 rounded-full blur-3xl bg-white/5" />
          <div className="pointer-events-none absolute -bottom-14 -right-12 w-72 h-72 rounded-full blur-3xl bg-white/5" />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className={`w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-7 rounded-full flex items-center justify-center border-4 ${
              isWin
                ? "bg-gradient-to-br from-[#00FFA3]/20 to-[#03E1FF]/20 border-[#00FFA3]/50"
                : isSurvive
                  ? "bg-gradient-to-br from-[#03E1FF]/20 to-[#9945FF]/20 border-[#03E1FF]/50"
                  : "bg-gradient-to-br from-[#FF5B5B]/20 to-[#FF6B9D]/20 border-[#FF5B5B]/50"
            }`}
          >
            {isWin ? (
              <Trophy className="w-11 h-11 text-[#00FFA3]" />
            ) : isSurvive ? (
              <ShieldCheck className="w-11 h-11 text-[#03E1FF]" />
            ) : (
              <Skull className="w-11 h-11 text-[#FF5B5B]" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight mb-4 ${
              isWin
                ? "text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]"
                : isSurvive
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-[#03E1FF] to-[#9945FF]"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-[#FF5B5B] to-[#FF6B9D]"
            }`}
          >
            {resolvedTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-300 text-base sm:text-xl mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            {message}
          </motion.p>

          {amount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-7 sm:p-10 bg-gradient-to-br from-[#00FFA3]/10 to-[#03E1FF]/10 border border-[#00FFA3]/30 rounded-2xl max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#00FFA3]" />
                <span className="text-xs sm:text-sm text-zinc-400 uppercase font-black tracking-widest">
                  GAIN FINAL
                </span>
                <Sparkles className="w-5 h-5 text-[#00FFA3]" />
              </div>
              <p className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
                +{amount} SOL
              </p>
              {multiplier ? (
                <p className="text-2xl sm:text-4xl font-black text-white mt-4">
                  x{multiplier.toFixed(2)}
                </p>
              ) : null}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 max-w-md mx-auto"
          >
            <button
              onClick={onClose}
              className={`w-full py-4 px-6 font-black uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                isFinal
                  ? "bg-gradient-to-r from-zinc-700 to-zinc-500 text-white hover:brightness-110"
                  : "bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:shadow-[0_0_50px_rgba(0,255,163,0.6)] hover:scale-105"
              }`}
            >
              {isFinal ? <LogOut className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              <span>{resolvedActionLabel}</span>
            </button>
            <p className="text-xs text-zinc-500 mt-3 uppercase tracking-widest">
              Fermeture automatique dans {autoCloseInSeconds}s
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
