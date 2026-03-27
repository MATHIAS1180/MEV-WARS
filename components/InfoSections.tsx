"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Crosshair, Trophy } from "lucide-react";
import { PROGRAM_ID } from "@/config/constants";

export default function InfoSections() {
  const specs = [
    { label: "Security", text: "PDA Vault" },
    { label: "Oracle", text: "Switchboard V2" },
    { label: "Fairness", text: "Verifiable Entropy" },
    { label: "Protocol", text: "P2P Settlement" }
  ];

  const steps = [
    { step: "01", title: "Unit Load", desc: "Commit SOL to the reactor vault." },
    { step: "02", title: "Entropy Call", desc: "Trigger the Oracle for a verifiable seed." },
    { step: "03", title: "Settlement", desc: "90% pot distribute to the neutralized unit." }
  ];

  return (
    <section id="specs" className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] font-mono">Internal Specs</span>
          <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Technical Protocol</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {specs.map((s, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">{s.label}</span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] font-mono">Execution Flow</span>
          <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Operational Logic</h2>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-start">
              <span className="text-[12px] font-bold text-zinc-700 font-mono mt-0.5">{step.step}</span>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">{step.title}</span>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
