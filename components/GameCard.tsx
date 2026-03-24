"use client";
import { motion } from "framer-motion";
import { Clock, Users, Coins, Loader2 } from "lucide-react";
import { useState } from "react";

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
      className="glass-card p-6 sm:p-8 max-w-md w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Round #{roomId}</p>
          <h3 className="text-2xl font-black text-white">{label}</h3>
        </div>
        <div className="px-3 py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg">
          <p className="text-xs text-[#00FFA3] font-bold uppercase">Live</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#03E1FF]" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Players</p>
          </div>
          <p className="text-2xl font-black text-white">{playerCount}</p>
          <p className="text-xs text-zinc-600 mt-1">{winnerCount} winner{winnerCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-[#00FFA3]" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Pool</p>
          </div>
          <p className="text-2xl font-black text-white">{potAmount.toFixed(3)}</p>
          <p className="text-xs text-zinc-600 mt-1">SOL</p>
        </div>
      </div>

      {/* Win Probability */}
      <div className="mb-6 p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border border-[#00FFA3]/20 rounded-xl">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Your Win Chance</p>
        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
          {winChance}%
        </p>
        <p className="text-xs text-zinc-500 mt-1">1 winner per 3 players</p>
      </div>

      {/* Timer */}
      {timeRemaining !== null && playerCount > 0 && (
        <div className="mb-6 flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#DC1FFF]" />
            <span className="text-sm text-zinc-400 uppercase tracking-wider">Time Remaining</span>
          </div>
          <span className="text-xl font-black text-white">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Action Button */}
      {!isConnected ? (
        <div className="w-full text-center p-4 border border-dashed border-zinc-800 rounded-xl text-zinc-600 font-bold uppercase tracking-wider text-sm">
          Connect Wallet to Play
        </div>
      ) : myPlayerIndex !== null ? (
        <div className="w-full p-4 bg-[#00FFA3]/10 border-2 border-[#00FFA3]/30 rounded-xl text-center">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">You're In!</p>
          <p className="text-sm font-bold text-[#00FFA3]">Position #{myPlayerIndex + 1}</p>
        </div>
      ) : (
        <button
          onClick={onJoin}
          disabled={txPending}
          className="btn-solana w-full h-14 text-base font-black shadow-[0_0_30px_rgba(0,255,163,0.3)] disabled:opacity-50"
        >
          {txPending ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : `ENTER ROUND — ${label}`}
        </button>
      )}

      {/* Microcopy */}
      <p className="text-xs text-center text-zinc-600 mt-4">Winners are selected automatically on-chain</p>
    </motion.div>
  );
}
