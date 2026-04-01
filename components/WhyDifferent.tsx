"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Users, TrendingUp } from "lucide-react";

export default function WhyDifferent() {
  const features = [
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "PvP-Based",
      description: "Play against other players, not the house. Fair competition where skill and timing matter.",
      boxClass: "icon-box-purple",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Transparent On-Chain",
      description: "All game logic runs on Solana. Verify every result independently on-chain.",
      boxClass: "icon-box-green",
    },
    {
      icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "No Manipulation",
      description: "Provably fair RNG. Winners selected using future block hashes — unpredictable at deposit time.",
      boxClass: "icon-box-blue",
    },
    {
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: "Fast Execution",
      description: "Powered by Solana's speed. Instant payouts directly to your wallet.",
      boxClass: "icon-box-green",
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
        <span className="section-label mb-4">Why MEV Wars</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 sm:mb-3 mt-4">
          Not Your Typical{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DC1FFF] to-[#00FFA3]">Casino</span>
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto px-4">
          A competitive on-chain game with transparent mechanics — no house advantage, no hidden RNG.
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
            className="glass-card p-5 sm:p-6 group"
          >
            <div className={`${feature.boxClass} mb-4`}>
              {feature.icon}
            </div>
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide mb-2 text-white">{feature.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
