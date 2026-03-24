"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Users, TrendingUp } from "lucide-react";

export default function WhyDifferent() {
  const features = [
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "PvP-Based",
      description: "Play against other players, not the house. Fair competition.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Transparent On-Chain",
      description: "All game logic runs on Solana. Verify every result.",
    },
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "No Manipulation",
      description: "Provably fair RNG. Winners selected using future block hashes.",
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Fast Execution",
      description: "Powered by Solana's speed. Instant payouts to your wallet.",
    },
  ];

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8 sm:mb-12"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 sm:mb-3">
          Why MEV Wars is{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DC1FFF] to-[#00FFA3]">Different</span>
        </h2>
        <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-2xl mx-auto px-4">
          Not your typical casino. A competitive on-chain game with transparent mechanics.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 sm:p-6 text-center group hover:border-[#00FFA3]/30"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-[#DC1FFF]/20 to-[#00FFA3]/20 border border-white/10 flex items-center justify-center text-[#00FFA3] group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-bold uppercase tracking-wide mb-1 sm:mb-2 text-white">{feature.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
