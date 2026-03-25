// Exemple d'intégration complète dans app/page.tsx
// Remplace le MiningBlock 2D par la Matrix 3D

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Coins, ShieldCheck, Clock, Users, Loader2 } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";

// Import du composant 3D
import BlockchainMatrix3DAdvanced from "@/components/BlockchainMatrix3DAdvanced";

// Couleurs Solana
const SOLANA_COLORS = [
  "#DC1FFF", "#03E1FF", "#00FFA3", "#9945FF", "#14F195",
  "#00C2FF", "#FF6B9D", "#FFB84D", "#A855F7", "#10B981",
  "#06B6D4", "#EC4899", "#F59E0B", "#8B5CF6", "#34D399",
  "#22D3EE", "#F472B6", "#FBBF24", "#7C3AED", "#6EE7B7",
  "#67E8F9", "#FDA4AF", "#FCD34D", "#6D28D9", "#059669",
  "#0891B2", "#BE185D", "#D97706", "#5B21B6", "#047857",
];

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const ROOMS = [
  { id: 101, label: "0.01 SOL", lamports: 0.01 * 1e9, icon: <Coins className="w-3.5 h-3.5" /> },
  { id: 102, label: "0.1 SOL",  lamports: 0.1  * 1e9, icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 103, label: "1.0 SOL",  lamports: 1    * 1e9, icon: <Trophy className="w-3.5 h-3.5" /> },
];

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [roomId, setRoomId] = useState<number>(101);
  const { gameState, fetchState, joinGame, gameResult, setGameResult } = useGame(roomId);

  const activeRoom = useMemo(() => ROOMS.find(r => r.id === roomId)!, [roomId]);
  const isWaiting = !gameState || (typeof gameState.state === 'object' && 'waiting' in gameState.state);
  const potAmount = gameState?.potAmount ? (gameState.potAmount.toNumber() / 1e9) : 0;

  const [isSpinning, setIsSpinning] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const actualPlayerCount = gameState?.playerCount ?? 0;

  // Convertir les joueurs en format Player[] pour la Matrix 3D
  const players = useMemo(() => {
    if (!gameState?.players) return [];
    
    return (gameState.players as any[])
      .filter((p: any) => p.toString() !== PublicKey.default.toString())
      .map((p: any, i: number) => ({
        id: p.toString(),
        color: SOLANA_COLORS[i % SOLANA_COLORS.length]
      }));
  }, [gameState?.players]);

  const handleJoin = async () => {
    if (!publicKey) return;
    try {
      setTxPending(true);
      const txPromise = joinGame(activeRoom.lamports);
      toast.promise(txPromise, { 
        loading: 'Submitting transaction...', 
        success: 'Entered round successfully!', 
        error: (e: any) => `Failed: ${e.message}` 
      });
      await txPromise;
    } catch (e) { 
      console.error(e); 
    } finally { 
      setTxPending(false); 
    }
  };

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-[-3] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#DC1FFF]/30 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#00FFA3]/25 rounded-full blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-[#03E1FF]/25 rounded-full blur-[150px] animate-blob animation-delay-4000" />
      </div>
      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Image 
              src="/images/trigger-logo.png" 
              alt="MEV Wars" 
              width={120} 
              height={48} 
              priority
              className="h-10 w-auto filter drop-shadow-[0_0_12px_rgba(220,31,255,0.6)]" 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#00FFA3] shadow-[0_0_8px_#00FFA3]" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#00FFA3]">Live</span>
            </div>
            <WalletMultiButton />
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-6"
          >
            <span className="text-white">MEV Wars</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
              Blockchain Matrix
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-300 font-medium max-w-3xl mx-auto mb-10"
          >
            Join the living blockchain. <span className="text-[#00FFA3] font-bold">1 in 3 players wins.</span> Fully on-chain.
          </motion.p>
        </div>
      </section>

      {/* Game Section - 3D Matrix */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          
          {/* Round Info */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-zinc-400 uppercase font-bold">Round</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
                <span className="text-[0.55rem] font-black uppercase text-[#00FFA3]">Live</span>
              </div>
            </div>
            <p className="text-2xl font-black text-white">#{roomId}</p>
            <p className="text-sm text-[#00FFA3] font-bold">{activeRoom.label}</p>
          </div>

          {/* Pool */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Pool</p>
            <p className="text-2xl font-black text-white">{potAmount.toFixed(3)}</p>
            <p className="text-xs text-zinc-500">SOL</p>
          </div>
          
          {/* Players */}
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Active Nodes</p>
            <p className="text-2xl font-black text-white">{actualPlayerCount}</p>
            <p className="text-xs text-zinc-500">{Math.max(1, Math.floor(actualPlayerCount / 3))} winners</p>
          </div>
          
          {/* Win Chance */}
          <div className="glass-card p-4 text-center bg-gradient-to-br from-[#00FFA3]/5 to-[#DC1FFF]/5 border-[#00FFA3]/30">
            <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Win Chance</p>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#DC1FFF]">
              {actualPlayerCount >= 3 ? ((Math.max(1, Math.floor(actualPlayerCount / 3)) / actualPlayerCount) * 100).toFixed(1) : "33.3"}%
            </p>
            <p className="text-xs text-zinc-500">to win</p>
          </div>
        </div>

        {/* Main Game Container - 3D Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          
          {/* 3D Blockchain Matrix */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="relative w-full h-[700px] rounded-xl overflow-hidden">
              <BlockchainMatrix3DAdvanced
                players={players}
                isActive={isSpinning || countdown !== null}
                playerCount={actualPlayerCount}
              />
              
              {/* Overlay Stats */}
              <div className="absolute top-4 left-4 glass-card p-3 backdrop-blur-xl">
                <p className="text-xs text-zinc-400 uppercase mb-1">Network Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSpinning ? 'bg-[#DC1FFF]' : 'bg-[#00FFA3]'} animate-pulse`} />
                  <span className="text-sm font-bold text-white">
                    {isSpinning ? 'RESOLVING' : countdown ? 'STARTING' : 'ACTIVE'}
                  </span>
                </div>
              </div>
              
              {/* Transaction Log */}
              <div className="absolute bottom-4 left-4 right-4 glass-card p-3 backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Latest Block</span>
                  <span className="text-[#00FFFF] font-mono">0x7a3f...9b2c</span>
                  <span className="text-zinc-500">12ms ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="glass-card p-6 flex flex-col gap-4">
            
            {/* Bet Selection */}
            <div>
              <h3 className="text-sm font-black uppercase text-white mb-3 tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-[#00FFA3] to-[#03E1FF] rounded-full"></span>
                Select Your Bet
              </h3>
              <div className="space-y-2.5">
                {ROOMS.map(room => (
                  <motion.button
                    key={room.id}
                    onClick={() => !countdown && setRoomId(room.id)}
                    disabled={!!countdown}
                    whileHover={{ scale: roomId === room.id ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
                      roomId === room.id 
                        ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-[0_0_30px_rgba(153,69,255,0.5)]' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 relative z-10">
                      {room.icon}
                      {room.label}
                    </span>
                    {roomId === room.id && (
                      <span className="text-xs opacity-75">SELECTED</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Action Area */}
            <div className="flex-1 flex flex-col justify-end gap-3">
              {!connected ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 border-2 border-dashed border-zinc-700/50 rounded-xl bg-zinc-900/20"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#DC1FFF]/20 to-[#00FFA3]/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#00FFA3]" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Connect Wallet</p>
                  <p className="text-[0.65rem] text-zinc-600">Use the button in the header</p>
                </motion.div>
              ) : (
                <motion.button
                  onClick={handleJoin}
                  disabled={txPending}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-5 px-6 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-black uppercase text-base rounded-xl overflow-hidden disabled:opacity-50"
                  style={{
                    boxShadow: '0 0 40px rgba(0,255,163,0.5), 0 8px 24px rgba(0,0,0,0.6)'
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {txPending ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm opacity-75">33.3% Win</span>
                        <span className="mx-2">•</span>
                        <span>Enter — {activeRoom.label}</span>
                      </>
                    )}
                  </span>
                </motion.button>
              )}
              
              <p className="text-[0.65rem] text-center text-zinc-600 leading-relaxed px-2">
                <ShieldCheck className="w-3 h-3 inline mr-1 text-[#00FFA3]" />
                Winners selected on-chain. Provably fair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4"
          >
            Living <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">Blockchain</span>
          </motion.h2>
          <p className="text-zinc-400 font-medium max-w-2xl mx-auto text-lg">
            Watch the network come alive. Each cube is a player. Each connection is a transaction.
          </p>
        </div>
      </section>
    </main>
  );
}
