"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Trophy, Skull, Clock, Coins, ShieldCheck, Info } from "lucide-react";
import { useGame, BULLET_COLORS, GameResult } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import MiningBlock from "@/components/MiningBlock";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const ROOMS = [
  { id: 101, label: "0.01 SOL", lamports: 0.01 * 1e9, icon: <Coins className="w-3.5 h-3.5" /> },
  { id: 102, label: "0.1 SOL",  lamports: 0.1  * 1e9, icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 103, label: "1.0 SOL",  lamports: 1    * 1e9, icon: <Trophy className="w-3.5 h-3.5" /> },
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

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [txPending, setTxPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<{ type: 'win' | 'lose', msg: string, amount?: number } | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  const actualPlayerCount = gameState?.playerCount ?? 0;

  const myPlayerIndex = useMemo(() => {
    if (!gameState?.players || !publicKey) return null;
    const idx = (gameState.players as any[]).findIndex(
      (p: any) => p.toString() === publicKey.toString()
    );
    return idx >= 0 ? idx : null;
  }, [gameState?.players, publicKey]);

  const myPlayerIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (myPlayerIndex !== null) myPlayerIndexRef.current = myPlayerIndex;
    if (!isProcessingResult && actualPlayerCount === 0 && !countdown && !isSpinning && !gameResult && !showResult) {
      const timer = setTimeout(() => { myPlayerIndexRef.current = null; }, 2000);
      return () => clearTimeout(timer);
    }
  }, [myPlayerIndex, actualPlayerCount, countdown, isSpinning, gameResult, showResult, isProcessingResult]);

  const displayPlayerIndex = myPlayerIndex !== null ? myPlayerIndex : myPlayerIndexRef.current;
  const playerCount = actualPlayerCount;

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

  useEffect(() => {
    if (!gameResult) return;
    const frozenPlayers = [...lastPlayersRef.current];
    const frozenResult = { ...gameResult };
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
          const isWinner = frozenResult.winners?.includes(myKey) || frozenResult.winner === myKey;
          const winAmt = (frozenResult.winnerAmount / 1e9).toFixed(4);
          if (wasInGame && isWinner) {
            setShowResult({ type: 'win', msg: `BLOCK CAPTURED! MEV extraction successful. +${winAmt} SOL sent to wallet.`, amount: parseFloat(winAmt) });
          } else if (wasInGame && !isWinner) {
            setShowResult({ type: 'lose', msg: "FRONT-RUNNED! Better luck on the next block." });
          }
          setGameResult(null);
          lastPlayersRef.current = [];
          const checkAndRefresh = setInterval(() => {
            if (!showResult) {
              clearInterval(checkAndRefresh);
              setRotation(0);
              setIsProcessingResult(false);
              myPlayerIndexRef.current = null;
              stableFetch();
            }
          }, 500);
          setTimeout(() => {
            clearInterval(checkAndRefresh);
            setShowResult(null);
            setRotation(0);
            setIsProcessingResult(false);
            myPlayerIndexRef.current = null;
            stableFetch();
          }, 10000);
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

  useEffect(() => {
    setShowResult(null); setIsSpinning(false); setCountdown(null);
    setTxPending(false); setIsProcessingResult(false);
    lastPlayersRef.current = [];
  }, [roomId]);

  const lastCrankTimeRef = useRef(0);
  const crankRetryCountRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    if (Date.now() - lastCrankTimeRef.current < 10000) return;
    lastCrankTimeRef.current = Date.now();
    try {
      const res = await fetch('/api/crank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId }) });
      let data: any = {};
      try { data = await res.json(); } catch { return; }
      if (!res.ok && data.shouldRetry && crankRetryCountRef.current < 5) {
        crankRetryCountRef.current++;
        setTimeout(() => { lastCrankTimeRef.current = 0; triggerCrank(); }, 1000);
      } else if (!res.ok && data.error?.includes('CRANK_PRIVATE_KEY')) {
        toast.error('Crank not configured. Contact admin.');
      }
      crankRetryCountRef.current = 0;
    } catch { crankRetryCountRef.current = 0; }
  }, [roomId]);

  const prevPlayerCountRef = useRef<number>(0);
  useEffect(() => {
    const pc = gameState?.playerCount ?? 0;
    if (prevPlayerCountRef.current >= 3 && pc === 0) setIsProcessingResult(true);
    prevPlayerCountRef.current = pc;
    if (pc > 0 && pc % 3 === 0 && !txPending) triggerCrank();
  }, [gameState?.playerCount, txPending, triggerCrank]);

  const prevPlayerCountForRefundRef = useRef<number>(0);
  const wasInGameRef = useRef<boolean>(false);
  useEffect(() => {
    if (myPlayerIndex !== null && actualPlayerCount > 0) wasInGameRef.current = true;
  }, [myPlayerIndex, actualPlayerCount]);

  useEffect(() => {
    const prev = prevPlayerCountForRefundRef.current;
    const current = actualPlayerCount;
    if (prev > 0 && prev < 3 && current === 0 && wasInGameRef.current) {
      toast.success('BLOCK EXPIRED: Not enough searchers. Your funds have been automatically refunded.', { duration: 5000 });
      // Complete reset after refund - IMMEDIATE
      setIsSpinning(false);
      setCountdown(null);
      setTxPending(false);
      setShowResult(null);
      setGameResult(null);
      setIsProcessingResult(false);
      myPlayerIndexRef.current = null;
      lastPlayersRef.current = [];
      wasInGameRef.current = false;
      setRotation(0);
      // Immediate refresh instead of 1 second delay
      setTimeout(() => stableFetch(), 100);
    }
    prevPlayerCountForRefundRef.current = current;
  }, [actualPlayerCount, stableFetch, setGameResult]);

  useEffect(() => {
    if (actualPlayerCount === 0 && !gameResult && !txPending && !countdown && !isSpinning && !showResult) {
      const timer = setTimeout(() => { setIsSpinning(false); setCountdown(null); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actualPlayerCount, gameResult, txPending, countdown, isSpinning, showResult]);

  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (actualPlayerCount === 0 && !gameResult && (isSpinning || countdown !== null)) {
      watchdogRef.current = setTimeout(() => { 
        setIsSpinning(false); 
        setCountdown(null); 
        setTxPending(false); 
        stableFetch(); 
      }, 3000); // Reduced from 15s to 3s
    } else {
      if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    }
    return () => { if (watchdogRef.current) clearTimeout(watchdogRef.current); };
  }, [actualPlayerCount, gameResult, isSpinning, countdown, stableFetch]);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (gameState && isWaiting && actualPlayerCount > 0) {
      const iv = setInterval(() => {
        const blockStart = gameState.blockStartTime ? Number(gameState.blockStartTime.toString()) : gameState.lastActivityTime ? Number(gameState.lastActivityTime.toString()) : Date.now() / 1000;
        const elapsed = Math.floor(Date.now() / 1000) - blockStart;
        const r = BLOCK_EXPIRATION_SECONDS - elapsed;
        const remaining = r > 0 ? r : 0;
        setTimeRemaining(remaining);
        if (remaining === 0) triggerCrank();
      }, 1000);
      return () => clearInterval(iv);
    }
    setTimeRemaining(null);
  }, [gameState, isWaiting, actualPlayerCount, triggerCrank]);

  const handleJoin = async () => {
    if (!publicKey) return;
    const myKey = publicKey.toString();
    if (!lastPlayersRef.current.includes(myKey)) lastPlayersRef.current.push(myKey);
    try {
      setTxPending(true);
      const txPromise = joinGame(activeRoom.lamports);
      toast.promise(txPromise, { loading: 'Submitting bundle to Mempool...', success: 'Searcher registered in block.', error: (e: any) => `Failed: ${e.message}` });
      await txPromise;
    } catch (e) { console.error(e); }
    finally { setTxPending(false); }
  };

  return (
    <main className="game-layout">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#9945FF]/25 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[#14F195]/15 rounded-full blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-[#00C2FF]/15 rounded-full blur-[150px] animate-blob animation-delay-4000" />
      </div>
      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      {/* ── TOP BAR ── */}
      <header className="game-header">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-shrink-0">
          <img src="/images/trigger-logo.png" alt="Trigger.Sol" className="h-10 sm:h-12 w-auto filter drop-shadow-[0_0_12px_rgba(153,69,255,0.6)]" />
        </motion.div>

        {/* Room Switcher — centered absolutely */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => !countdown && setRoomId(room.id)}
              disabled={!!countdown}
              className={`room-btn ${roomId === room.id ? 'room-btn-active' : 'room-btn-inactive'}`}
            >
              {room.icon}
              <span>{room.label}</span>
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_#14F195]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#14F195]">Live</span>
          </div>
          <WalletMultiButton />
        </motion.div>
      </header>

      {/* ── MAIN GAME AREA ── */}
      <div className="game-area">

        {/* LEFT STATS */}
        <div className="stats-col">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="stat-card">
            <p className="stat-label">Active Searchers</p>
            <div className="flex items-end gap-1.5">
              <span className="stat-value neon-text-purple">{playerCount}</span>
              <span className="text-zinc-700 text-lg font-bold mb-0.5">/ 30</span>
            </div>
            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${Math.min((playerCount / 30) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="stat-card">
            <p className="stat-label">Extraction Est.</p>
            <p className="stat-value neon-text-cyan">
              {extractionEstimate > 0 ? `${extractionEstimate.toFixed(2)}x` : '--'}
            </p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Win Multiplier</p>
          </motion.div>
        </div>

        {/* CENTER: MINING BLOCK + ACTION */}
        <div className="center-col">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full scale-150 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(153,69,255,0.12) 0%, rgba(20,241,149,0.05) 60%, transparent 80%)", filter: "blur(30px)" }} />

            <AnimatePresence>
              {countdown !== null && (
                <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <span className="text-[5rem] sm:text-[7rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">{countdown}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <MiningBlock playerCount={playerCount} isSpinning={isSpinning} rotation={rotation} countdown={countdown} />
          </div>

          {/* Action Button */}
          <div className="w-full max-w-xs sm:max-w-sm mt-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!connected ? (
                <motion.div key="unconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full text-center p-3 border border-dashed border-zinc-800 rounded-xl text-zinc-600 font-bold uppercase tracking-widest text-xs">
                  Connect Wallet to Start
                </motion.div>
              ) : countdown !== null ? (
                <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-1 text-[#14F195] font-black tracking-widest">
                  <span className="text-xs sm:text-sm">BLOCK RESOLVING IN {countdown}...</span>
                </motion.div>
              ) : isSpinning ? (
                <motion.div key="spinning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#FFB84D] font-black tracking-widest">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="text-xs sm:text-sm">EXTRACTING MEV...</span>
                </motion.div>
              ) : displayPlayerIndex !== null ? (
                <motion.div key="ingame" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center text-center justify-center h-[56px]">
                  <p className="text-zinc-400 font-bold uppercase tracking-widest text-[8px] mb-0.5">Bundle in Mempool</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: BULLET_COLORS[displayPlayerIndex % BULLET_COLORS.length].color, boxShadow: `0 0 10px ${BULLET_COLORS[displayPlayerIndex % BULLET_COLORS.length].color}` }} />
                    <span className="text-white font-black tracking-wider uppercase text-xs">{BULLET_COLORS[displayPlayerIndex % BULLET_COLORS.length].name}</span>
                  </div>
                  {actualPlayerCount > 0 && actualPlayerCount < 3 && !isProcessingResult &&
                    <p className="text-zinc-500 text-[8px] font-bold uppercase tracking-widest animate-pulse mt-0.5">Waiting ({actualPlayerCount}/3 min)...</p>}
                </motion.div>
              ) : (
                <motion.button key="play"
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  onClick={handleJoin} disabled={txPending}
                  className="btn-solana w-full h-[56px] text-sm sm:text-base font-black shadow-[0_0_30px_rgba(153,69,255,0.35)] disabled:opacity-50">
                  {txPending ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : `JOIN BLOCK — ${activeRoom.label}`}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT STATS */}
        <div className="stats-col">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="stat-card">
            <p className="stat-label">Block Liquidity</p>
            <p className="stat-value neon-text-cyan">{potAmount.toFixed(3)}<span className="text-xs font-bold opacity-50 ml-1">SOL</span></p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Pool: {(potAmount * 0.95).toFixed(3)} SOL</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <p className="stat-label">Block Expiration</p>
            </div>
            <p className="stat-value text-white">
              {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
            </p>
            {timeRemaining !== null && (
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${(timeRemaining / BLOCK_EXPIRATION_SECONDS) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-full" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── MOBILE STATS SECTION (below fold) ── */}
      <div className="mobile-stats-section">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <p className="stat-label">Active Searchers</p>
          <div className="flex items-end gap-1.5">
            <span className="stat-value neon-text-purple">{playerCount}</span>
            <span className="text-zinc-700 text-lg font-bold mb-0.5">/ 30</span>
          </div>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${Math.min((playerCount / 30) * 100, 100)}%` }} className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <p className="stat-label">Extraction Est.</p>
          <p className="stat-value neon-text-cyan">
            {extractionEstimate > 0 ? `${extractionEstimate.toFixed(2)}x` : '--'}
          </p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Win Multiplier</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card">
          <p className="stat-label">Block Liquidity</p>
          <p className="stat-value neon-text-cyan">{potAmount.toFixed(3)}<span className="text-xs font-bold opacity-50 ml-1">SOL</span></p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Pool: {(potAmount * 0.95).toFixed(3)} SOL</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <p className="stat-label">Block Expiration</p>
          </div>
          <p className="stat-value text-white">
            {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : '--:--'}
          </p>
          {timeRemaining !== null && (
            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${(timeRemaining / BLOCK_EXPIRATION_SECONDS) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-full" />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── INFO SECTION (scrollable below fold) ── */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="text-center mb-12">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3">
            MEV <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">Wars</span> Casino
          </motion.h2>
          <p className="text-zinc-400 font-medium max-w-xl mx-auto text-base leading-relaxed">
            Submit your bundle, capture the block, extract MEV rewards. 1 winner per 3 searchers. Provably fair on-chain gambling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative">
          <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#9945FF]/10 via-[#14F195]/40 to-[#9945FF]/10 -translate-y-1/2 -z-10" />
          {[
            { step: "01", title: "Join the Block", desc: "Deposit your stake into the PDA vault. 30s timer starts when first searcher joins.", icon: <Coins className="w-7 h-7 text-[#9945FF]" /> },
            { step: "02", title: "Wait for Resolution", desc: "Crank triggers resolution when 30s expires OR a multiple of 3 searchers is reached.", icon: <Clock className="w-7 h-7 text-white" /> },
            { step: "03", title: "MEV Extraction", desc: "1 winner per 3 searchers. 95% prize pool split among winners. 5% house edge.", icon: <Zap className="w-7 h-7 text-[#14F195]" /> },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
              className="glass-card p-7 flex flex-col items-center text-center relative group overflow-hidden">
              <div className="absolute -top-8 -right-8 text-[7rem] font-black text-white/[0.02] group-hover:text-[#9945FF]/10 transition-colors duration-500 pointer-events-none select-none">{s.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 transition-transform duration-300 group-hover:border-[#14F195]/30 group-hover:shadow-[0_0_25px_rgba(20,241,149,0.2)]">
                {s.icon}
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-white">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#14F195]/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10"><ShieldCheck className="w-5 h-5 text-[#14F195]" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Provably Fair RNG</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3 font-medium">
              Resolution only occurs when <code className="text-[#14F195]">current_slot &gt; entry_slot</code>, guaranteeing the block hash was unpredictable at deposit time.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium">
              No central server can influence outcomes. Every game is verifiable on Solana Explorer. True decentralized casino gaming.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#9945FF]/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10"><Info className="w-5 h-5 text-[#9945FF]" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Protocol Rules</h3>
            </div>
            <ul className="space-y-2.5 text-zinc-400 text-sm font-medium">
              <li className="flex items-center gap-2"><span className="text-[#9945FF]">→</span> Unlimited searchers per block</li>
              <li className="flex items-center gap-2"><span className="text-[#9945FF]">→</span> 1 winner per 3 searchers (e.g., 6 players = 2 winners)</li>
              <li className="flex items-center gap-2"><span className="text-[#9945FF]">→</span> 95% prize pool distributed to winners, 5% house edge</li>
              <li className="flex items-center gap-2"><span className="text-[#9945FF]">→</span> 30s timer: if &lt;3 searchers, 100% refund</li>
              <li className="flex items-center gap-2"><span className="text-[#9945FF]">→</span> Automatic resolution via crank bot</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-4">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 italic">
            <div className="flex items-center gap-2">
              <img src="/images/trigger-logo.png" alt="Trigger" className="h-4 w-auto brightness-150" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white">Trigger Protocol</span>
            </div>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">High Velocity Elimination • © 2026</p>
          </div>
          <div className="flex items-center gap-6 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <div className="h-3 w-[1px] bg-white/5" />
            <span className="text-zinc-700 font-mono">v1.2.0-Alpha</span>
          </div>
        </div>
      </footer>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-sm w-full p-8 text-center rounded-3xl relative border border-white/5 bg-zinc-900 shadow-2xl">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-white/5 bg-white/[0.02]">
                  {showResult.type === 'win' ? <Trophy className="w-7 h-7 text-white" /> : <Skull className="w-7 h-7 text-zinc-600" />}
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter mb-1">
                  {showResult.type === 'win' ? 'BLOCK CAPTURED' : 'FRONT-RUNNED'}
                </h2>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-6">
                  {showResult.type === 'win' ? 'MEV Extraction Successful' : 'Session Terminated'}
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">{showResult.msg}</p>
                {showResult.amount && (
                  <div className="w-full bg-white/[0.02] p-6 rounded-2xl border border-white/5 mb-6 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">MEV Extracted</span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tight">+{showResult.amount} SOL</span>
                  </div>
                )}
                <button onClick={() => setShowResult(null)} className="btn-solana w-full py-3.5 text-sm font-black">
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
