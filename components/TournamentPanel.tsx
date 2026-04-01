"use client";
import { Award, CalendarDays, Star } from "lucide-react";

const TOURNAMENTS = [
  { id: 1, name: "MEV Showdown", season: "Spring 2026", prize: "15 SOL", status: "live", top: "MEV_Seeker" },
  { id: 2, name: "Block Rush", season: "Winter 2025", prize: "10 SOL", status: "ended", top: "BlockMiner" },
  { id: 3, name: "Holo Tournament", season: "Summer 2026", prize: "20 SOL", status: "upcoming", top: "TBD" },
];

export default function TournamentPanel({ gameState }: { gameState?: any }) {
  const activeTournament = gameState?.state ? "On-chain live tournament" : null;
  return (
    <div className="glass-card p-6 lg:p-8">      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white">Competitive Tournaments</h3>
        <CalendarDays className="w-6 h-6 text-[#00D1FF]" />
      </div>
      <div className="space-y-3">
        {activeTournament ? (
          <div className="rounded-xl border border-white/10 bg-[#010113]/70 p-4">
            <p className="text-sm text-[#00D1FF] font-black">{activeTournament}</p>
            <p className="text-xs text-zinc-400">This room is linked to a current on-chain game session in smart contract state.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#010113]/70 p-4">
            <p className="text-sm text-zinc-300 font-bold">No tournament data available in contract</p>
            <p className="text-xs text-zinc-400">Static tournament cards are removed when contract data does not provide active tournament metadata.</p>
          </div>
        )}
      </div>
      <button className="mt-4 w-full rounded-xl py-2 text-sm font-bold uppercase bg-gradient-to-r from-[#9945FF] to-[#00D1FF] text-black shadow-[0_0_20px_rgba(153,69,255,0.4)] hover:shadow-[0_0_36px_rgba(0,209,255,0.5)] active:scale-95 transition-all">
        Join next tournament
      </button>
    </div>
  );
}
