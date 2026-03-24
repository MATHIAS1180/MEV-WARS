"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Clock } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4"
        >
          MEV Wars{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
            Provably Fair
          </span>
          <br />
          <span className="text-2xl sm:text-3xl lg:text-4xl">Solana Casino Game</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg sm:text-xl text-zinc-300 font-medium max-w-3xl mx-auto mb-8"
        >
          Join a round. 1 in 3 players wins. Fully on-chain. Instant payouts.
        </motion.p>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8"
        >
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, text: "100% On-chain" },
            { icon: <Zap className="w-5 h-5" />, text: "Provably Fair" },
            { icon: <Clock className="w-5 h-5" />, text: "Instant Payouts" },
            { icon: <img src="/solana-logo.svg" alt="Solana" className="w-5 h-5" />, text: "Built on Solana" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[#00FFA3]">
              {item.icon}
              <span className="text-sm font-bold uppercase tracking-wider">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
