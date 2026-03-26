"use client";
import { Award, CalendarDays, Star } from "lucide-react";

const TOURNAMENTS = [
  { id: 1, name: "MEV Showdown", season: "Spring 2026", prize: "15 SOL", status: "live", top: "MEV_Seeker" },
  { id: 2, name: "Block Rush", season: "Winter 2025", prize: "10 SOL", status: "ended", top: "BlockMiner" },
  { id: 3, name: "Holo Tournament", season: "Summer 2026", prize: "20 SOL", status: "upcoming", top: "TBD" },
];

export default function TournamentPanel() {
  return (
    <div className="glass-card p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white">Competitive Tournaments</h3>
        <CalendarDays className="w-6 h-6 text-[#00D1FF]" />
      </div>
      <div className="space-y-3">
        {TOURNAMENTS.map(event => (
          <div key={event.id} className="rounded-xl border border-white/10 bg-[#010113]/70 p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-black text-white">{event.name}</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                event.status === 'live' ? 'bg-[#14F195]/20 text-[#14F195]' : event.status === 'upcoming' ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'bg-[#71717a]/20 text-[#d4d4d8]'
              }`}>
                {event.status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-zinc-400 flex justify-between">
              <span>{event.season}</span>
              <span>Prize: <strong className="text-[#00D1FF]">{event.prize}</strong></span>
            </div>
            <div className="mt-2 text-sm text-zinc-300">
              Top: <span className="font-black text-[#9945FF]">{event.top}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-xl py-2 text-sm font-bold uppercase bg-gradient-to-r from-[#9945FF] to-[#00D1FF] text-black shadow-[0_0_20px_rgba(153,69,255,0.4)] hover:shadow-[0_0_36px_rgba(0,209,255,0.5)] active:scale-95 transition-all">
        Join next tournament
      </button>
    </div>
  );
}
