"use client";

import { Users, Sparkles, CircleDashed } from "lucide-react";

interface CurrentPlayersPanelProps {
  players?: Array<string | { toString(): string }>;
  activeRound?: number;
  isMyTurn?: boolean;
  myPublicKey?: string;
}

const truncate = (value: string, prefix = 6, suffix = 6) => {
  if (value.length <= prefix + suffix + 4) return value;
  return `${value.slice(0, prefix)}...${value.slice(value.length - suffix)}`;
};

export default function CurrentPlayersPanel({ players = [], activeRound, myPublicKey }: CurrentPlayersPanelProps) {
  const normalized = players
    .filter(Boolean)
    .map((p) => (typeof p === "string" ? p : p.toString()));

  return (
    <div className="glass-card p-4 lg:p-5 border border-[#00D1FF]/20 bg-[#000a16]/80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400">Live Players</p>
          <h3 className="text-lg font-black text-white">Current Queue</h3>
        </div>
        <Users className="w-5 h-5 text-[#14F195]" />
      </div>

      {normalized.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-3 text-center text-zinc-400">
          Nobody has joined this round yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {normalized.map((player, idx) => {
            const isMe = myPublicKey && player === myPublicKey;
            const status = idx === 0 ? "Next" : idx < 2 ? "In" : "Waiting";
            return (
              <div key={`${player}-${idx}`} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${isMe ? "bg-[#00FFA3]/20" : "bg-white/5"}`}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00D1FF]/30 text-xs text-[#00D1FF] font-black">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">{truncate(player)}</p>
                    <p className="text-xs text-zinc-400">{status} player</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#9945FF]" />
                  {isMe ? "You" : "R"+((idx%5)+1)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[0.72rem] text-zinc-400">
        <span><CircleDashed className="inline-block w-3 h-3 text-[#03E1FF] mr-1" />{normalized.length} queued</span>
        <span>Round #{activeRound ?? "-"}</span>
      </div>
    </div>
  );
}
