"use client";

import { ShieldCheck, Zap } from "lucide-react";
import { PROGRAM_ID } from "@/utils/anchor";

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-white/5 py-12 mt-32">
      <div className="max-w-screen-xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2 italic">
          <div className="flex items-center gap-3">
            <img src="/images/trigger-logo.png" alt="Trigger" className="h-5 w-auto brightness-150" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Trigger Protocol</span>
          </div>
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
            High Velocity Elimination • © 2026
          </p>
        </div>

        <div className="flex items-center gap-8 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <div className="h-4 w-[1px] bg-white/5" />
          <span className="text-zinc-700 font-mono">v1.2.0-Alpha</span>
        </div>
      </div>
    </footer>
  );
}
