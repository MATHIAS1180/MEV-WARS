"use client";
import { Twitter, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-black/20 backdrop-blur-xl mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img src="/images/trigger-logo.png" alt="MEV Wars" className="h-10 w-auto mb-4 filter drop-shadow-[0_0_12px_rgba(153,69,255,0.6)]" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Provably fair Solana casino game. 1 in 3 players wins. Fully on-chain.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-zinc-400 hover:text-[#00FFA3] text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-[#00FFA3] text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-[#00FFA3] text-sm transition-colors">
                  Responsible Gaming
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Community</h4>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#00FFA3] hover:border-[#00FFA3]/30 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#00FFA3] hover:border-[#00FFA3]/30 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#00FFA3] hover:border-[#00FFA3]/30 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} MEV Wars. Built on Solana. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
