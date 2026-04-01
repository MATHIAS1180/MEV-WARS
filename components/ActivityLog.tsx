"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Box, ShieldCheck, Zap } from "lucide-react";
import { PROGRAM_ID } from "@/config/constants";

interface LogEntry {
  id: string;
  type: string;
  msg: string;
  time: string;
  icon: any;
}

interface ActivityLogProps {
  playerCount: number;
  isWaitingForResult: boolean;
}

export default function ActivityLog({ playerCount }: ActivityLogProps) {
  const [logs] = useState<LogEntry[]>([
    { id: '1', type: 'system', msg: 'Blockchain Handshake OK', time: '12:04:22', icon: ShieldCheck },
    { id: '2', type: 'oracle', msg: 'VRF Endpoint Synced', time: '12:04:23', icon: Zap },
    { id: '3', type: 'vault', msg: `PDA Secured at ${PROGRAM_ID.toString().slice(0, 4)}...${PROGRAM_ID.toString().slice(-4)}`, time: '12:04:25', icon: Box }
  ]);

  return (
    <div className="lg:col-span-4 flex flex-col gap-6 order-2">
      <div className="glass-card bg-black/40 border-white/5 flex flex-col h-[600px]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Global Event Log</h3>
            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-1">Encrypted Chain Stream</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
            Realtime
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col gap-6">
          {logs.map((log) => (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 items-start group"
            >
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-zinc-700 font-mono mt-1">{log.time}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{log.type}</span>
                   <div className="h-[1px] w-4 bg-white/5" />
                </div>
                <p className="text-[11px] font-bold text-zinc-400 font-mono leading-relaxed group-hover:text-white transition-colors">
                  {log.msg}
                </p>
              </div>
            </motion.div>
          ))}

          {playerCount > 0 && Array.from({length: playerCount}).map((_, i) => (
            <motion.div 
              key={`player-${i}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 items-start group"
            >
              <span className="text-[9px] font-bold text-zinc-700 font-mono mt-1">12:0{4+i}:10</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">Authorization</span>
                   <div className="h-[1px] w-4 bg-[var(--accent-primary)]/20" />
                </div>
                <p className="text-[11px] font-bold text-zinc-400 font-mono leading-relaxed">
                  Player Unit {i+1} Authorized Transaction
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 mt-auto">
          <div className="flex justify-between items-center text-[9px] font-bold text-zinc-700 uppercase tracking-[0.2em] font-mono">
            <span>Solana Cluster</span>
            <span className="text-zinc-600">Devnet-V1-Primary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
