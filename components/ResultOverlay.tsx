"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull } from "lucide-react";

interface ResultOverlayProps {
  showResult: { type: 'win' | 'lose', msg: string, amount?: number } | null;
  setShowResult: (val: any) => void;
}

export default function ResultOverlay({ showResult, setShowResult }: ResultOverlayProps) {
  return (
    <AnimatePresence>
      {showResult && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="max-w-md w-full p-10 text-center rounded-3xl relative border border-white/5 bg-zinc-900 shadow-2xl"
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border border-white/5 bg-white/[0.02]`}>
                {showResult.type === 'win' ? (
                  <Trophy className="w-8 h-8 text-white" />
                ) : (
                  <Skull className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              
              <h2 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">
                {showResult.type === 'win' ? 'Survived' : 'Eliminated'}
              </h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-10">
                {showResult.type === 'win' ? 'Protocol Success' : 'Session Terminated'}
              </p>
              
              <p className="text-zinc-500 text-sm leading-relaxed mb-10">
                {showResult.msg}
              </p>

              {showResult.amount && (
                <div className="w-full bg-white/[0.02] p-8 rounded-2xl border border-white/5 mb-10 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Loot Disbursed</span>
                  <span className="text-4xl font-bold text-white font-mono tracking-tight">+{showResult.amount} SOL</span>
                </div>
              )}

              <button 
                onClick={() => setShowResult(null)} 
                className="btn-premium w-full h-14"
              >
                {showResult.type === 'win' ? 'Initiate New Round' : 'Return to Arena'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
