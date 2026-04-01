"use client";
import { motion } from "framer-motion";
import { Users, Timer, Trophy } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Users className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Players Join",
      description: "Players join the round by depositing their stake. A round starts from 2 players.",
      color: "#DC1FFF",
      bg: "from-[#DC1FFF]/15 to-[#DC1FFF]/5",
      border: "border-[#DC1FFF]/30",
      glow: "shadow-[0_0_20px_rgba(220,31,255,0.2)]",
    },
    {
      icon: <Timer className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Round Runs",
      description: "20-second timer runs for each round phase. The crank advances or settles when the timer expires.",
      color: "#03E1FF",
      bg: "from-[#03E1FF]/15 to-[#03E1FF]/5",
      border: "border-[#03E1FF]/30",
      glow: "shadow-[0_0_20px_rgba(3,225,255,0.2)]",
    },
    {
      icon: <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />,
      title: "Winner Takes All",
      description: "Eliminations happen on-chain until one final survivor remains. Instant payout to the winner.",
      color: "#00FFA3",
      bg: "from-[#00FFA3]/15 to-[#00FFA3]/5",
      border: "border-[#00FFA3]/30",
      glow: "shadow-[0_0_20px_rgba(0,255,163,0.2)]",
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
        <span className="section-label mb-4">How It Works</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 sm:mb-3 mt-4">
          Simple.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">Transparent.</span>
          {" "}Fair.
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto px-4">
          Every round is fully verifiable on-chain. No hidden mechanics.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
        {/* Connection line */}
        <div className="hidden md:block absolute top-[72px] left-[calc(33.33%+16px)] right-[calc(33.33%+16px)] h-0.5 bg-gradient-to-r from-[#DC1FFF]/40 via-[#03E1FF]/60 to-[#00FFA3]/40 -z-10" />

        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`glass-card p-6 sm:p-8 text-center relative group ${step.glow}`}
          >
            {/* Numbered neon badge */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black absolute top-4 right-4 border"
              style={{ color: step.color, borderColor: `${step.color}40`, background: `${step.color}10` }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>

            {/* Icon */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${step.bg} border ${step.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              style={{ color: step.color }}
            >
              {step.icon}
            </div>

            <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider mb-2 sm:mb-3 text-white">{step.title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
