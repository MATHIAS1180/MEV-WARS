"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the 1 in 3 system work?",
      answer:
        "For every 3 players that join a round, 1 winner is selected on-chain. If 6 players join, there are 2 winners. If 9 players join, there are 3 winners. The 95% prize pool is split equally among all winners.",
    },
    {
      question: "Is this game really fair?",
      answer:
        "Yes. Winners are selected using Solana block hashes that are unpredictable at the time you join. The smart contract ensures resolution only happens after the entry slot, making manipulation impossible. All results are verifiable on-chain.",
    },
    {
      question: "Who decides the winners?",
      answer:
        "The Solana blockchain decides winners automatically using provably fair randomness. A crank bot triggers the resolution, but it cannot influence the outcome. The winner selection is deterministic based on future block hashes.",
    },
    {
      question: "Do I need an account?",
      answer:
        "No account needed. Just connect your Solana wallet (Phantom, Solflare, etc.) and you're ready to play. Your wallet is your identity.",
    },
    {
      question: "What is MEV Wars?",
      answer:
        "MEV Wars is a competitive on-chain casino game built on Solana. It's inspired by MEV (Maximal Extractable Value) concepts but designed as a fair PvP game where players compete for prize pools with transparent, verifiable outcomes.",
    },
    {
      question: "What happens if less than 3 players join?",
      answer:
        "If the 30-second timer expires and there are fewer than 3 players, all deposits are automatically refunded 100%. No one loses their stake.",
    },
  ];

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3">
          Frequently Asked{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#03E1FF] to-[#DC1FFF]">Questions</span>
        </h2>
        <p className="text-zinc-400 font-medium max-w-2xl mx-auto">Everything you need to know about MEV Wars</p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-white font-bold text-base pr-4">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-[#00FFA3] flex-shrink-0 transition-transform ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>

            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-5"
              >
                <p className="text-zinc-400 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
