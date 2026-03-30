"use client";
import { motion } from "framer-motion";
import { ShieldCheck, ExternalLink } from "lucide-react";

export default function ProvablyFair() {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Provably Fair */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00FFA3]/5 blur-[60px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-[#00FFA3]" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Provably Fair RNG</h3>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed mb-4">
            All winners are selected directly on-chain. Anyone can verify the results.
          </p>

          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Resolution only occurs when <code className="text-[#00FFA3] bg-black/30 px-2 py-1 rounded">current_slot &gt; entry_slot</code>, 
            guaranteeing the block hash was unpredictable at deposit time.
          </p>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            No central server can influence outcomes. Every game is verifiable on Solana Explorer.
          </p>

          <button className="flex items-center gap-2 px-6 py-3 bg-[#00FFA3]/10 hover:bg-[#00FFA3]/20 border border-[#00FFA3]/30 rounded-xl text-[#00FFA3] font-bold uppercase text-sm tracking-wider transition-all">
            View on Solana Explorer
            <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Protocol Rules */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#DC1FFF]/5 blur-[60px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-[#DC1FFF]" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Protocol Rules</h3>
          </div>

          <ul className="space-y-3 text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="text-[#DC1FFF] mt-1">→</span>
              <span className="text-sm leading-relaxed">Unlimited players per round</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#DC1FFF] mt-1">→</span>
              <span className="text-sm leading-relaxed">
                <strong>Minimum 2 players</strong> required to start a round
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#DC1FFF] mt-1">→</span>
              <span className="text-sm leading-relaxed">Single final winner receives the remaining pot, 2% house edge</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#DC1FFF] mt-1">→</span>
              <span className="text-sm leading-relaxed">20s timer: if &lt;2 players, 100% refund</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#DC1FFF] mt-1">→</span>
              <span className="text-sm leading-relaxed">Automatic resolution via crank bot</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
