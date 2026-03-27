"use client";
import { motion } from "framer-motion";
import { Users, Coins, Loader2, Trophy, Zap } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

interface GameCardProps {
  roomId: number;
  label: string;
  playerCount: number;
  potAmount: number;
  timeRemaining: number | null;
  onJoin: () => void;
  isConnected: boolean;
  txPending: boolean;
  myPlayerIndex: number | null;
}

export default function GameCard({
  roomId,
  label,
  playerCount,
  potAmount,
  timeRemaining,
  onJoin,
  isConnected,
  txPending,
  myPlayerIndex,
}: GameCardProps) {
  const winnerCount = Math.max(1, Math.floor(playerCount / 3));
  const winChance = playerCount >= 3 ? ((winnerCount / playerCount) * 100).toFixed(1) : "33.3";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl lg:rounded-2xl xl:rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 to-black/90 backdrop-blur-2xl shadow-2xl w-full"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC1FFF]/5 via-transparent to-[#00FFA3]/5 animate-pulse" />

      <div className="relative z-10 p-4 sm:p-5 lg:p-6 xl:p-8">
        {/* Header with Live Badge */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <p className="text-[0.625rem] sm:text-xs text-zinc-500 uppercase tracking-wider mb-1 font-bold">Round #{roomId}</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{label}</h3>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00FFA3] shadow-[0_0_8px_#00FFA3] animate-pulse" />
            <p className="text-[0.625rem] sm:text-xs text-[#00FFA3] font-black uppercase tracking-wider">Live</p>
          </div>
        </div>

        {/* Countdown Timer (if active) */}
        {timeRemaining !== null && timeRemaining > 0 && playerCount > 0 && (
          <div className="mb-4 lg:mb-6">
            <CountdownTimer secondsLeft={timeRemaining} totalSeconds={30} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 lg:mb-6">
          <div className="bg-white/5 rounded-lg lg:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-[#00FFA3]/30 transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#00FFA3]" />
              <p className="text-[0.625rem] sm:text-xs text-zinc-500 uppercase tracking-wider font-bold">Players</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{playerCount}</p>
            <p className="text-[0.625rem] sm:text-xs text-zinc-600 mt-0.5 sm:mt-1">{winnerCount} winner{winnerCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="bg-white/5 rounded-lg lg:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-[#03E1FF]/30 transition-all">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-[#03E1FF]" />
              <p className="text-[0.625rem] sm:text-xs text-zinc-500 uppercase tracking-wider font-bold">Pool</p>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{potAmount.toFixed(3)}</p>
            <p className="text-[0.625rem] sm:text-xs text-zinc-600 mt-0.5 sm:mt-1">SOL</p>
          </div>
        </div>

        {/* Win Probability - Prominent Display */}
        <div className="mb-4 lg:mb-6 p-4 sm:p-5 bg-gradient-to-r from-[#00FFA3]/10 via-[#03E1FF]/10 to-[#DC1FFF]/10 border-2 border-[#00FFA3]/30 rounded-xl lg:rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3]/5 to-[#DC1FFF]/5 animate-pulse" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC1FFF]" />
              <p className="text-[0.625rem] sm:text-xs text-zinc-400 uppercase tracking-widest font-black">Your Win Chance</p>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
              {winChance}%
            </p>
            <p className="text-[0.625rem] sm:text-xs text-center text-zinc-500 mt-1.5 sm:mt-2 font-bold">1 winner per 3 players</p>
          </div>
        </div>

        {/* Action Button */}
        {!isConnected ? (
          <div className="w-full text-center p-3 sm:p-4 border-2 border-dashed border-zinc-800 rounded-lg lg:rounded-xl text-zinc-600 font-bold uppercase tracking-wider text-xs sm:text-sm">
            Connect Wallet to Play
          </div>
        ) : myPlayerIndex !== null ? (
          <div className="w-full p-3 sm:p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border-2 border-[#00FFA3]/40 rounded-lg lg:rounded-xl text-center">
            <p className="text-[0.625rem] sm:text-xs text-zinc-400 uppercase tracking-wider mb-1 font-bold">You&apos;re In!</p>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFA3]" />
              <p className="text-base sm:text-lg font-black text-[#00FFA3]">Position #{myPlayerIndex + 1}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={onJoin}
            disabled={txPending}
            className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#14F195] to-[#03E1FF] text-black font-black uppercase tracking-wider rounded-lg lg:rounded-xl shadow-[0_0_30px_rgba(20,241,149,0.4)] hover:shadow-[0_0_50px_rgba(20,241,149,0.6)] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base"
          >
            {txPending ? <Loader2 className="animate-spin mx-auto w-4 h-4 sm:w-5 sm:h-5" /> : `ENTER ROUND - ${label}`}
          </button>
        )}

        <p className="text-[0.625rem] sm:text-xs text-center text-zinc-600 mt-3 sm:mt-4 font-medium">Winners are selected automatically on-chain</p>
      </div>
    </motion.div>
  );
}

