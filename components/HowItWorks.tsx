"use client";
import { motion } from "framer-motion";
import { Users, Timer, Trophy } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#DC1FFF]" />,
      title: "Players Join",
      description: "Players join the round by depositing their stake. A round starts from 2 players.",
    },
    {
      icon: <Timer className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#03E1FF]" />,
      title: "Round Runs",
      description: "20-second timer runs for each round phase. The crank advances or settles when the timer expires.",
    },
    {
      icon: <Trophy className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#00FFA3]" />,
      title: "Winners Selected",
      description: "Eliminations happen on-chain until one final survivor remains. Instant payout to the winner.",
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
          How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">Works</span>
        </h2>
        <p className="text-sm sm:text-base text-zinc-300 font-medium max-w-2xl mx-auto px-4">
          Simple, transparent, and provably fair. Every round is verifiable on-chain.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
        {/* Connection line */}
        <div className="hidden md:block absolute top-[25%] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#DC1FFF]/20 via-[#03E1FF]/40 to-[#00FFA3]/20 -z-10" />

        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-6 sm:p-8 text-center relative group"
          >
            {/* Step number background */}
            <div className="absolute -top-4 -right-4 text-[5rem] sm:text-[6rem] font-black text-white/[0.02] pointer-events-none select-none">
              {String(i + 1).padStart(2, "0")}
            </div>

            {/* Icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-4 sm:mb-6 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {step.icon}
            </div>

            <h3 className="text-base sm:text-lg lg:text-xl font-bold uppercase tracking-wider mb-2 sm:mb-3 text-white">{step.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Win Probability Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 sm:mt-12 text-center"
      >
        <div className="inline-block glass-card px-6 sm:px-8 py-4 sm:py-6">
          <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-wider mb-2">Your Win Chance</p>
          <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
            50.0%
          </p>
          <p className="text-zinc-500 text-[10px] sm:text-xs mt-2">base case: 2 players, 1 winner</p>
        </div>
      </motion.div>
    </section>
  );
}
