"use client";

import { motion } from "framer-motion";
import { Trophy, Skull, ExternalLink } from "lucide-react";

export default function RecentHistory() {
  const history = [
    { id: "1", user: "7x9...k2j", result: "survived", amount: "0.027", time: "2m ago" },
    { id: "2", user: "4h1...m9n", result: "redacted", amount: "0.000", time: "5m ago" },
    { id: "3", user: "bq5...r3t", result: "survived", amount: "0.270", time: "8m ago" },
    { id: "4", user: "p2k...v7x", result: "survived", amount: "0.027", time: "12m ago" }
  ];

  return (
    <div className="glass-card bg-black/40 border-white/5 flex flex-col mt-8">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Session Intelligence</h3>
          <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-1">Previous Outcomes</span>
        </div>
      </div>
      
      <div className="flex flex-col">
        {history.map((h) => (
          <div 
            key={h.id} 
            className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center bg-white/[0.02]">
                {h.result === 'survived' ? <Trophy size={14} className="text-zinc-500" /> : <Skull size={14} className="text-zinc-700" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-zinc-400 font-mono tracking-wider">{h.user}</span>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{h.time}</span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <span className={`text-[12px] font-bold tracking-widest ${h.result === 'survived' ? 'text-white' : 'text-zinc-700'}`}>
                {h.result === 'survived' ? `+${h.amount} SOL` : '0.000 SOL'}
              </span>
              <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                {h.result === 'survived' ? 'Neutralized' : 'Eliminated'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
