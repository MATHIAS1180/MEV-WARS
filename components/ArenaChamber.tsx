"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import RouletteBarrel from "@/components/RouletteBarrel";

interface ArenaChamberProps {
  roomId: number;
  setRoomId: (id: number) => void;
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
  isWaitingForResult: boolean;
  myPlayerIndex: number | null;
  txPending: boolean;
  handleJoin: () => void;
  connected: boolean;
  rooms: any[];
}

export default function ArenaChamber({ 
  roomId, setRoomId, playerCount, isSpinning, rotation, countdown, 
  isWaitingForResult, myPlayerIndex, txPending, handleJoin, connected, rooms 
}: ArenaChamberProps) {
  return (
    <div className="lg:col-span-8 flex flex-col gap-8">
      <div className="glass-card bg-black/40 border-white/5 p-12 flex flex-col items-center justify-center relative min-h-[600px] overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute inset-0 cyber-grid opacity-10" />
        <div className="scanline" />

        {/* Room Selector - Pill Style */}
        <div className="absolute top-8 p-1 bg-white/5 rounded-full border border-white/5 flex gap-1 z-20">
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id)}
              className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                roomId === r.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Hero Section: Barrel */}
        <div className="relative z-10 py-12">
          <RouletteBarrel 
            playerCount={playerCount} 
            isSpinning={isSpinning} 
            rotation={rotation} 
            countdown={countdown} 
          />
        </div>

        {/* Action Zone */}
        <div className="w-full max-w-sm flex flex-col gap-6 items-center z-10 relative mt-4">
          {!connected ? (
            <div className="w-full p-8 rounded-3xl border border-dashed border-white/10 flex flex-col items-center gap-4 bg-white/[0.02]">
              <ShieldCheck size={28} className="text-zinc-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Authentication Required</span>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <button
                onClick={handleJoin}
                disabled={txPending || isSpinning || playerCount >= 3 || myPlayerIndex !== null}
                className="btn-premium w-full h-16"
              >
                {txPending ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </div>
                ) : myPlayerIndex !== null ? (
                  "Unit Allocated"
                ) : playerCount >= 3 ? (
                  "Chamber Full"
                ) : (
                  `Authorize Entry`
                )}
              </button>
              
              <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${playerCount > 0 ? 'bg-[var(--accent-primary)]' : 'bg-zinc-800'}`} />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {playerCount} / 3 Confirmed
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                   PDA Secure
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global States */}
        <AnimatePresence>
          {isWaitingForResult && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-24 h-24 border-2 border-white/10 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-[var(--accent-primary)] rounded-full shadow-[0_0_15px_var(--accent-primary)]"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold tracking-[0.5em] uppercase text-white animate-pulse">Resolving</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Awaiting Oracle Handshake</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
