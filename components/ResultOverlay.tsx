"use client";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trophy, Skull, Sparkles, ShieldCheck, ArrowRight, LogOut } from "lucide-react";

interface ResultOverlayProps {
  type: "win" | "lose" | "survive";
  title?: string;
  message: string;
  amount?: number;
  multiplier?: number;
  actionLabel?: string;
  autoCloseInSeconds?: number;
  autoCloseAtMs?: number;
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
  autoCloseAtMs,
  isFinal = false,
  onClose,
}: ResultOverlayProps) {
  const isWin = type === "win";
  const isSurvive = type === "survive";

  const resolvedTitle = title ?? (isWin ? "VICTORY" : isSurvive ? "SURVIVED" : "DEFEAT");
  const resolvedActionLabel = actionLabel ?? (isFinal ? "Close" : "Next Round");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(autoCloseInSeconds);

  const fallbackCloseAtMs = useMemo(
    () => Date.now() + autoCloseInSeconds * 1000,
    [autoCloseInSeconds]
  );
  const effectiveCloseAtMs = autoCloseAtMs ?? fallbackCloseAtMs;

  useEffect(() => {
    const updateRemaining = () => {
      const msLeft = Math.max(0, effectiveCloseAtMs - Date.now());
      setRemainingSeconds(Math.max(0, Math.ceil(msLeft / 1000)));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 250);
    return () => clearInterval(interval);
  }, [effectiveCloseAtMs]);

  const playCloseSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(620, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.11);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    setTimeout(() => ctx.close().catch(() => {}), 220);
  }, []);

  const handleForcedClose = useCallback(() => {
    playCloseSound();
    onClose();
  }, [onClose, playCloseSound]);

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

        <div className="relative overflow-hidden bg-gradient-to-b from-black/92 to-black/98 border border-white/15 rounded-3xl p-6 sm:p-10 text-center shadow-2xl h-full">

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${
              isWin
                ? "bg-[#00FFA3]/10 border-[#00FFA3]/40"
                : isSurvive
                  ? "bg-[#03E1FF]/10 border-[#03E1FF]/40"
                  : "bg-[#FF5B5B]/10 border-[#FF5B5B]/40"
            }`}
          >
            {isWin ? (
              <Trophy className="w-9 h-9 text-[#00FFA3]" />
            ) : isSurvive ? (
              <ShieldCheck className="w-9 h-9 text-[#03E1FF]" />
            ) : (
              <Skull className="w-9 h-9 text-[#FF5B5B]" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-4 ${
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
            className="text-zinc-300 text-sm sm:text-lg mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            {message}
          </motion.p>

          {amount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-6 sm:p-8 bg-gradient-to-br from-[#00FFA3]/8 to-[#03E1FF]/8 border border-[#00FFA3]/25 rounded-2xl max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#00FFA3]" />
                <span className="text-xs sm:text-sm text-zinc-400 uppercase font-black tracking-widest">
                  FINAL PAYOUT
                </span>
                <Sparkles className="w-5 h-5 text-[#00FFA3]" />
              </div>
              <p className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
                +{amount} SOL
              </p>
              {multiplier ? (
                <p className="text-xl sm:text-3xl font-black text-white mt-4">
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
              onClick={handleForcedClose}
              className={`w-full py-4 px-6 font-black uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                isFinal
                  ? "bg-gradient-to-r from-zinc-700 to-zinc-500 text-white hover:brightness-110"
                  : "bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black shadow-[0_0_24px_rgba(0,255,163,0.35)] hover:brightness-110"
              }`}
            >
              {isFinal ? <LogOut className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              <span>{resolvedActionLabel}</span>
            </button>
            <p className="text-xs text-zinc-400 mt-3 uppercase tracking-widest">
              Auto closes in {remainingSeconds}s
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
