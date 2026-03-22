"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Trophy, Skull, Clock, Info, ShieldCheck, Coins } from "lucide-react";
import { useGame, BULLET_COLORS, GameResult } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import RouletteBarrel from "@/components/RouletteBarrel";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const ROOMS = [
  { id: 101, label: "0.01 SOL", lamports: 0.01 * 1e9, icon: <Coins className="w-4 h-4" /> },
  { id: 102, label: "0.1 SOL",  lamports: 0.1  * 1e9, icon: <Zap className="w-4 h-4" /> },
  { id: 103, label: "1.0 SOL",  lamports: 1    * 1e9, icon: <Trophy className="w-4 h-4" /> },
];

const CHAMBER_ANGLES = [0, 120, 240];
const BLOCK_EXPIRATION_SECONDS = 30;

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [roomId, setRoomId] = useState<number>(101);
  const { gameState, fetchState, joinGame, gameResult, setGameResult, isScanningLogs } = useGame(roomId);

  const activeRoom = useMemo(() => ROOMS.find(r => r.id === roomId)!, [roomId]);
  const isWaiting = !gameState || (typeof gameState.state === 'object' && 'waiting' in gameState.state);
  const potAmount = gameState?.potAmount ? (gameState.potAmount.toNumber() / 1e9) : 0;

  // ─── UI State ────────────────────────────────────────────────────────────
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [txPending, setTxPending] = useState(false);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<{ type: 'win' | 'lose', msg: string, amount?: number } | null>(null);
  const [frozenDisplay, setFrozenDisplay] = useState<{ pot: number; winner: number } | null>(null);

  const actualPlayerCount = gameState?.playerCount ?? 0;

  const myPlayerIndex = useMemo(() => {
    if (!gameState?.players || !publicKey) return null;
    const idx = (gameState.players as any[]).findIndex(
      (p: any) => p.toString() === publicKey.toString()
    );
    return idx >= 0 ? idx : null;
  }, [gameState?.players, publicKey]);

  const playerCount = (isSpinning || countdown !== null || isWaitingForResult) ? 3 : actualPlayerCount;

  // Dynamic extraction estimate: (TotalPot * 0.95) / (PlayersCount / 3) / EntryFee
  const extractionEstimate = useMemo(() => {
    const pc = actualPlayerCount > 0 ? actualPlayerCount : 1;
    const entryFee = activeRoom.lamports / 1e9;
    const numWinners = Math.max(1, Math.floor(pc / 3));
    const rewardPool = potAmount * 0.95;
    const perWinner = rewardPool / numWinners;
    return entryFee > 0 ? (perWinner / entryFee) : 0;
  }, [potAmount, actualPlayerCount, activeRoom.lamports]);

  const fetchStateRef = useRef(fetchState);
  useEffect(() => { fetchStateRef.current = fetchState; }, [fetchState]);
  const stableFetch = useCallback(() => fetchStateRef.current(), []);

  const lastPlayersRef = useRef<string[]>([]);
  useEffect(() => {
    if (actualPlayerCount > 0 && gameState?.players) {
      const real = (gameState.players as any[])
        .filter((p: any) => p.toString() !== PublicKey.default.toString())
        .map((p: any) => p.toString());
      if (real.length > 0) lastPlayersRef.current = real;
    }
  }, [gameState?.players, actualPlayerCount]);

  const prevMyIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (myPlayerIndex !== null && myPlayerIndex !== prevMyIndexRef.current) {
      toast.info(`Bundle submitted to Mempool — Searcher #${myPlayerIndex + 1} active`);
    }
    prevMyIndexRef.current = myPlayerIndex;
  }, [myPlayerIndex]);

  // ─── RESULT HANDLER ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameResult) return;

    const frozenPlayers = [...lastPlayersRef.current];
    const frozenResult = { ...gameResult };

    setFrozenDisplay({ pot: frozenResult.totalPot / 1e9, winner: frozenResult.winnerAmount / 1e9 });
    setIsSpinning(false);
    setCountdown(5);

    let count = 5;
    let timeoutId: NodeJS.Timeout;
    const intId = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(intId);
        setCountdown(null);

        const wndx = frozenResult.winnerIndex ?? 0;
        const finalAngle = 360 - CHAMBER_ANGLES[wndx % CHAMBER_ANGLES.length];
        setRotation(360 * 5 + finalAngle);
        setIsSpinning(true);

        timeoutId = setTimeout(() => {
          setIsSpinning(false);

          const myKey = publicKey?.toString() ?? '';
          const wasInGame = frozenPlayers.includes(myKey);
          const isWinner = frozenResult.winners?.includes(myKey) ?? frozenResult.winner === myKey;
          const winAmt = (frozenResult.winnerAmount / 1e9).toFixed(4);

          if (wasInGame && isWinner) {
            setShowResult({
              type: 'win',
              msg: `BLOCK CAPTURED! MEV extraction successful. +${winAmt} SOL sent to wallet.`,
              amount: parseFloat(winAmt),
            });
          } else if (wasInGame && !isWinner) {
            setShowResult({
              type: 'lose',
              msg: "FRONT-RUNNED! Better luck on the next block.",
            });
          }

          setGameResult(null);
          lastPlayersRef.current = [];
          setTimeout(() => {
            setFrozenDisplay(null);
            setRotation(0);
            stableFetch();
          }, 1000);
        }, 5000);
      }
    }, 1000);

    return () => {
      clearInterval(intId);
      if (timeoutId) clearTimeout(timeoutId);
      setIsSpinning(false);
      setCountdown(null);
    };
  }, [gameResult, publicKey, setGameResult, stableFetch]);

  // ─── Room change: reset UI ────────────────────────────────────────────────
  useEffect(() => {
    setShowResult(null);
    setIsSpinning(false);
    setIsWaitingForResult(false);
    setCountdown(null);
    setFrozenDisplay(null);
    setTxPending(false);
    lastPlayersRef.current = [];
  }, [roomId]);

  // ─── Auto-Crank ───────────────────────────────────────────────────────────
  const lastCrankTimeRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    if (Date.now() - lastCrankTimeRef.current < 10000) return;
    lastCrankTimeRef.current = Date.now();
    try {
      const res = await fetch('/api/crank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      let data: any = {};
      try { data = await res.json(); } catch { return; }
      if (!res.ok && !data.error?.includes('not ready')) {
        console.error('[crank] error:', data);
      }
    } catch (err) { console.error('[crank] fetch failed:', err); }
  }, [roomId]);

  useEffect(() => {
    const pc = gameState?.playerCount ?? 0;
    // Trigger crank when a multiple of 3 searchers is reached
    if (pc > 0 && pc % 3 === 0 && !txPending) {
      triggerCrank();
    }
  }, [gameState?.playerCount, txPending, triggerCrank]);

  // ─── Detect Refund (player count drops to 0 with <3 players) ─────────────
  const prevPlayerCountForRefundRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevPlayerCountForRefundRef.current;
    const current = actualPlayerCount;
    
    // If player count dropped from 1-2 to 0, it's a refund
    if (prev > 0 && prev < 3 && current === 0 && myPlayerIndex !== null) {
      toast.success('BLOCK REJECTED: Refund processed automatically. Funds returned to wallet.');
      setIsSpinning(false);
      setCountdown(null);
      setTxPending(false);
      setFrozenDisplay(null);
      setIsWaitingForResult(false);
    }
    
    prevPlayerCountForRefundRef.current = current;
  }, [actualPlayerCount, myPlayerIndex]);

  // ─── Force reset UI when actualPlayerCount is 0 and no game result ───────
  useEffect(() => {
    if (actualPlayerCount === 0 && !gameResult && !txPending) {
      setIsSpinning(false);
      setCountdown(null);
      setIsWaitingForResult(false);
      setFrozenDisplay(null);
    }
  }, [actualPlayerCount, gameResult, txPending]);

  return (
    <main className="min-h-screen relative flex flex-col items-center overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#9945FF]/30 rounded-full blur-[120px] animate-blob border border-white/5" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#14F195]/20 rounded-full blur-[140px] animate-blob animation-delay-2000 border border-white/5" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-[#00C2FF]/20 rounded-full blur-[150px] animate-blob animation-delay-4000 border border-white/5" />
      </div>

      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      <section className="w-full max-w-6xl px-3 sm:px-6 pt-4 sm:pt-8 pb-8 sm:pb-12 flex flex-col items-center">
        <header className="w-full flex justify-between items-center mb-6 sm:mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <img src="/images/trigger-logo.png" alt="Trigger.Sol" className="h-16 sm:h-20 md:h-28 lg:h-36 w-auto filter drop-shadow-[0_0_15px_rgba(153,69,255,0.6)]" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <WalletMultiButton />
          </motion.div>
        </header>

        {/* Room Switcher */}
        <div className="flex gap-1 sm:gap-3 p-1 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 mb-6 sm:mb-10 w-full max-w-xs sm:max-w-sm md:max-w-md">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => !countdown && setRoomId(room.id)}
              disabled={!!countdown}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm ${
                roomId === room.id
                  ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {room.icon}
              <span>{room.label}</span>
            </button>
          ))}
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 w-full items-center">

          {/* Stats Left */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Active Searchers</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl font-black neon-text-purple">{playerCount}</span>
                <span className="text-zinc-700 text-lg sm:text-xl font-bold mb-0.5">/ ∞</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${i < playerCount ? 'bg-current' : 'bg-white/5'}`} style={{ color: i < playerCount ? BULLET_COLORS[i % BULLET_COLORS.length].color : 'inherit' }} />
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Extraction Estimate</p>
              <p className="text-2xl sm:text-3xl font-black neon-text-cyan">
                {extractionEstimate > 0 ? `${extractionEstimate.toFixed(2)}x` : '--'}
                <span className="text-xs sm:text-sm font-bold opacity-50 ml-1">Win</span>
              </p>
            </motion.div>
          </div>

          {/* Center Barrel */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center order-first lg:order-none">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full scale-150 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(153,69,255,0.15) 0%, rgba(20,241,149,0.06) 60%, transparent 80%)", filter: "blur(30px)", animation: "pulse 4s ease-in-out infinite" }} />

              <AnimatePresence>
                {countdown !== null && (
                  <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <span className="text-[5rem] sm:text-[8rem] lg:text-[10rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <RouletteBarrel playerCount={playerCount} isSpinning={isSpinning} rotation={rotation} countdown={countdown} />
            </div>

            {/* Main Action Button */}
            <div className="mt-6 sm:mt-10 w-full max-w-xs sm:max-w-sm min-h-[70px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!connected ? (
                  <motion.div key="unconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full text-center p-3 sm:p-4 border border-dashed border-zinc-800 rounded-xl text-zinc-600 font-bold uppercase tracking-widest text-xs sm:text-sm">
                    Connect Wallet to Start
                  </motion.div>
                ) : (isSpinning || countdown !== null || isWaitingForResult) ? (
                  <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 text-[#14F195] font-black tracking-widest">
                    {(isSpinning || isWaitingForResult) ? <Loader2 className="animate-spin w-7 h-7 sm:w-8 sm:h-8" /> : null}
                    <span className="text-sm sm:text-base">{isSpinning ? "EXTRACTING MEV..." : isWaitingForResult ? "RESOLVING BLOCK..." : "PREPARING..."}</span>
                  </motion.div>
                ) : myPlayerIndex !== null ? (
                  <motion.div key="ingame" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center text-center">
                      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1.5">Bundle submitted to Mempool</p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-lg" style={{ backgroundColor: BULLET_COLORS[myPlayerIndex % BULLET_COLORS.length].color, boxShadow: `0 0 15px ${BULLET_COLORS[myPlayerIndex % BULLET_COLORS.length].color}` }} />
                        <span className="text-white font-black tracking-wider uppercase text-base sm:text-lg">{BULLET_COLORS[myPlayerIndex % BULLET_COLORS.length].name}</span>
                      </div>
                    </div>
                    {playerCount < 3 && <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for searchers ({playerCount}/3 min)...</p>}
                  </motion.div>
                ) : (
                  <motion.button
                    key="play"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    onClick={handleJoin} disabled={txPending}
                    className="btn-solana w-full py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl shadow-[0_0_40px_rgba(153,69,255,0.4)] disabled:opacity-50"
                  >
                    {txPending ? <Loader2 className="animate-spin mx-auto w-7 h-7" /> : `JOIN BLOCK — ${activeRoom.label}`}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Right */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Block Liquidity</p>
              <p className="text-3xl sm:text-4xl font-black neon-text-cyan">{potAmount.toFixed(3)} <span className="text-xs sm:text-sm font-bold opacity-50">SOL</span></p>
              <div className="mt-1.5 text-[9px] sm:text-[10px] text-zinc-600 font-bold tracking-widest">→ Pool: {(potAmount * 0.95).toFixed(3)} SOL</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest uppercase">Block Expiration</p>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="w-full max-w-6xl px-6 py-24 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9945FF]/5 to-transparent pointer-events-none" />

        <div className="text-center mb-20 relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4"
          >
            MEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">Wars</span> Casino
          </motion.h2>
          <p className="text-zinc-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            Submit your bundle, capture the block, extract MEV rewards. 1 winner per 3 searchers. Provably fair on-chain gambling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative">
          <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#9945FF]/10 via-[#14F195]/40 to-[#9945FF]/10 -translate-y-1/2 -z-10" />
          {[
            { step: "01", title: "Join the Block", desc: "Deposit your stake into the PDA vault. 30s timer starts when first searcher joins.", icon: <Coins className="w-8 h-8 text-[#9945FF]" /> },
            { step: "02", title: "Wait for Resolution", desc: "Crank triggers resolution when 30s expires OR a multiple of 3 searchers is reached.", icon: <Clock className="w-8 h-8 text-white" /> },
            { step: "03", title: "MEV Extraction", desc: "1 winner per 3 searchers. 95% prize pool split among winners. 5% house edge.", icon: <Zap className="w-8 h-8 text-[#14F195]" /> },
          ].map((s, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
              className="glass-card p-8 flex flex-col items-center text-center relative group overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 text-[8rem] font-black text-white/[0.02] group-hover:text-[#9945FF]/10 transition-colors duration-500 pointer-events-none select-none">{s.step}</div>
              <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300 group-hover:border-[#14F195]/30 group-hover:shadow-[0_0_30px_rgba(20,241,149,0.2)]">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-3 text-white">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#14F195]/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-[#14F195]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">Provably Fair RNG</h3>
            </div>
            <p className="text-zinc-400 text-base leading-relaxed mb-4 font-medium">
              Resolution only occurs when <code className="text-[#14F195]">current_slot &gt; entry_slot</code>, guaranteeing the block hash was unpredictable at deposit time.
            </p>
            <p className="text-zinc-400 text-base leading-relaxed font-medium">
              No central server can influence outcomes. Every game is verifiable on Solana Explorer. True decentralized casino gaming.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9945FF]/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg">
                <Info className="w-6 h-6 text-[#9945FF]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">Protocol Rules</h3>
            </div>
            <ul className="space-y-3 text-zinc-400 text-sm font-medium">
              <li>→ Unlimited searchers per block</li>
              <li>→ 1 winner per 3 searchers (e.g., 6 players = 2 winners)</li>
              <li>→ 95% prize pool distributed to winners, 5% house edge</li>
              <li>→ 30s timer: if &lt;3 searchers, 100% refund</li>
              <li>→ Automatic resolution via crank bot</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full p-10 text-center rounded-3xl relative border border-white/5 bg-zinc-900 shadow-2xl"
            >
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-8 border border-white/5 bg-white/[0.02]">
                  {showResult.type === 'win' ? <Trophy className="w-8 h-8 text-white" /> : <Skull className="w-8 h-8 text-zinc-600" />}
                </div>
                <h2 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">
                  {showResult.type === 'win' ? 'BLOCK CAPTURED' : 'FRONT-RUNNED'}
                </h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-10">
                  {showResult.type === 'win' ? 'MEV Extraction Successful' : 'Session Terminated'}
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-10">{showResult.msg}</p>
                {showResult.amount && (
                  <div className="w-full bg-white/[0.02] p-8 rounded-2xl border border-white/5 mb-10 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">MEV Extracted</span>
                    <span className="text-4xl font-bold text-white font-mono tracking-tight">+{showResult.amount} SOL</span>
                  </div>
                )}
                <button onClick={() => setShowResult(null)} className="btn-premium w-full h-14">
                  {showResult.type === 'win' ? 'New Block' : 'Return to Arena'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
