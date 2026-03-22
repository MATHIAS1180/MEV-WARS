"use client";

import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Navbar() {
  return (
    <nav className="nav-blur px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="max-w-screen-2xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img src="/images/trigger-logo.png" alt="Trigger" className="h-8 w-auto brightness-150" />
            <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-white">Trigger</span>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#arena" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Arena</a>
            <a href="#specs" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Docs</a>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">Live</span>
          </div>
          <WalletMultiButton className="!bg-white !text-black !rounded-xl !h-10 !px-6 hover:!bg-zinc-200 transition-colors !text-[10px] !font-bold !uppercase !tracking-widest" />
        </div>
      </div>
    </nav>
  );
}
