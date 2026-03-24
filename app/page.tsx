"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Trophy, Skull, Coins, ShieldCheck, Clock } from "lucide-react";
import { useGame, BULLET_COLORS } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import MiningBlock from "@/components/MiningBlock";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import WhyDifferent from "@/components/WhyDifferent";
import ProvablyFair from "@/components/ProvablyFair";
import FAQ from "@/components/FAQ";
import LiveActivity from "@/components/LiveActivity";
import Footer from "@/components/Footer";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const ROOMS = [
  { id: 101, label: "0.01 SOL", lamports: 0.01 * 1e9, icon: <Coins className="w-3.5 h-3.5" /> },
  { id: 102, label: "0.1 SOL",  lamports: 0.1  * 1e9, icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 103, label: "1.0 SOL",  lamports: 1    * 1e9, icon: <Trophy className="w-3.5 h-3.5" /> },
];

const BLOCK_EXPIRATION_SECONDS = 30;

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [roomId, setRoomId] = useState<number>(101);
  const { gameState, fetchState, joinGame, gameResult, setGameResult } = useGame(roomId);

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
      toast.info(`Entered round — Position #${myPlayerIndex + 1}`);
    }
    prevMyIndexRef.current = myPlayerIndex;
  }, [myPlayerIndex]);

  const gameResultProcessedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!gameResult) return;
    
    const resultKey = `${gameResult.winner || gameResult.winners?.[0]}-${gameResult.winnerAmount}-${Date.now()}`;
    if (gameResultProcessedRef.current === resultKey) return;
    gameResultProcessedRef.current = resultKey;
    
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
        setRotation(360 * 5);
        setIsSpinning(true);
        timeoutId = setTimeout(() => {
          setIsSpinning(false);
          const myKey = publicKey?.toString() ?? '';
          const wasInGame = frozenPlayers.includes(myKey);
          const isWinner = frozenResult.winners?.includes(myKey) || frozenResult.winner === myKey;
          const winAmt = (frozenResult.winnerAmount / 1e9).toFixed(4);
          if (wasInGame && isWinner) {
            setShowResult({ type: 'win', msg: `You won! +${winAmt} SOL sent to your wallet.`, amount: parseFloat(winAmt) });
          } else if (wasInGame && !isWinner) {
            setShowResult({ type: 'lose', msg: "Better luck next round!" });
          }
          setGameResult(null);
          lastPlayersRef.current = [];
          gameResultProcessedRef.current = null;
          setTimeout(() => {
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
    };
  }, [gameResult, publicKey, setGameResult, stableFetch, showResult]);

  useEffect(() => {
    setShowResult(null); setIsSpinning(false); setCountdown(null);
    setTxPending(false); setIsProcessingResult(false);
    lastPlayersRef.current = [];
    gameResultProcessedRef.current = null;
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
      toast.success('Round expired: Not enough players. Your funds have been refunded.', { duration: 5000 });
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
      setTimeout(() => stableFetch(), 100);
    }
    prevPlayerCountForRefundRef.current = current;
  }, [actualPlayerCount, stableFetch, setGameResult]);

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
      toast.promise(txPromise, { loading: 'Submitting transaction...', success: 'Entered round successfully!', error: (e: any) => `Failed: ${e.message}` });
      await txPromise;
    } catch (e) { console.error(e); }
    finally { setTxPending(false); }
  };

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-[-3] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-[#DC1FFF]/30 rounded-full blur-[100px] sm:blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#00FFA3]/25 rounded-full blur-[120px] sm:blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#03E1FF]/25 rounded-full blur-[130px] sm:blur-[150px] animate-blob animation-delay-4000" />
      </div>
      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <img src="/images/trigger-logo.png" alt="MEV Wars" className="h-8 sm:h-10 lg:h-12 w-auto filter drop-shadow-[0_0_12px_rgba(220,31,255,0.6)]" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_6px_#00FFA3] animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#00FFA3]">Live</span>
            </div>
            <WalletMultiButton />
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-12">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter mb-3 sm:mb-4 leading-tight"
          >
            MEV Wars{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
              Provably Fair
            </span>
            <br />
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">Solana Casino Game</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-zinc-200 font-medium max-w-3xl mx-auto mb-6 sm:mb-8 px-4"
          >
            Join a round. 1 in 3 players wins. Fully on-chain. Instant payouts.
          </motion.p>

          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8"
          >
            {[
              { icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />, text: "100% On-chain" },
              { icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Provably Fair" },
              { icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Instant Payouts" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[#00FFA3]">
                {item.icon}
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Game Section */}
      <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Left: Game Visual */}
          <div className="flex flex-col items-center justify-center order-2 lg:order-1">
            <div className="relative w-full flex items-center justify-center">
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <span className="text-[4rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <MiningBlock playerCount={actualPlayerCount} isSpinning={isSpinning} rotation={rotation} countdown={countdown} />
            </div>

            {/* Room Switcher */}
            <div className="mt-6 sm:mt-8 flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-white/5 rounded-xl border border-white/10 w-full max-w-sm">
              {ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => !countdown && setRoomId(room.id)}
                  disabled={!!countdown}
                  className={`room-btn flex-1 ${roomId === room.id ? 'room-btn-active' : 'room-btn-inactive'}`}
                >
                  {room.icon}
                  <span className="hidden xs:inline sm:inline">{room.label}</span>
                  <span className="xs:hidden sm:hidden">{room.label.replace(' SOL', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Game Card */}
          <div className="flex items-center justify-center lg:justify-start order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-4 sm:p-6 lg:p-8 max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-1">Round #{roomId}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{activeRoom.label}</h3>
                </div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-[#00FFA3] font-bold uppercase">Live</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-1 sm:mb-2">Players</p>
                  <p className="text-xl sm:text-2xl font-black text-white">{actualPlayerCount}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-600 mt-1">{Math.max(1, Math.floor(actualPlayerCount / 3))} winner{Math.floor(actualPlayerCount / 3) !== 1 ? "s" : ""}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-1 sm:mb-2">Pool</p>
                  <p className="text-xl sm:text-2xl font-black text-white">{potAmount.toFixed(3)}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-600 mt-1">SOL</p>
                </div>
              </div>

              {/* Win Probability */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border border-[#00FFA3]/20 rounded-xl">
                <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mb-1">Your Win Chance</p>
                <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">
                  {actualPlayerCount >= 3 ? ((Math.max(1, Math.floor(actualPlayerCount / 3)) / actualPlayerCount) * 100).toFixed(1) : "33.3"}%
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">1 winner per 3 players</p>
              </div>

              {/* Timer */}
              {timeRemaining !== null && actualPlayerCount > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider">Time Remaining</span>
                    <span className="text-lg sm:text-xl font-black text-white">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(timeRemaining / BLOCK_EXPIRATION_SECONDS) * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#00FFA3] to-[#DC1FFF] rounded-full" />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!connected ? (
                <div className="w-full text-center p-3 sm:p-4 border border-dashed border-zinc-800 rounded-xl text-zinc-600 font-bold uppercase tracking-wider text-xs sm:text-sm">
                  Connect Wallet to Play
                </div>
              ) : displayPlayerIndex !== null ? (
                <div className="w-full p-3 sm:p-4 bg-[#00FFA3]/10 border-2 border-[#00FFA3]/30 rounded-xl text-center">
                  <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mb-1">You're In!</p>
                  <p className="text-sm sm:text-base font-bold text-[#00FFA3]">Position #{displayPlayerIndex + 1}</p>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={txPending}
                  className="btn-solana w-full h-12 sm:h-14 text-sm sm:text-base font-black shadow-[0_0_30px_rgba(0,255,163,0.3)] disabled:opacity-50"
                >
                  {txPending ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : `ENTER ROUND — ${activeRoom.label}`}
                </button>
              )}

              <p className="text-[10px] sm:text-xs text-center text-zinc-600 mt-3 sm:mt-4">Winners are selected automatically on-chain</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Why Different */}
      <WhyDifferent />

      {/* Provably Fair */}
      <ProvablyFair />

      {/* Live Activity */}
      <LiveActivity />

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <Footer />

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-sm w-full p-8 text-center rounded-3xl relative border border-white/10 glass-card">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 border border-white/10 bg-white/5">
                  {showResult.type === 'win' ? <Trophy className="w-7 h-7 text-[#00FFA3]" /> : <Skull className="w-7 h-7 text-zinc-600" />}
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">
                  {showResult.type === 'win' ? 'YOU WON!' : 'BETTER LUCK NEXT TIME'}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">{showResult.msg}</p>
                {showResult.amount && (
                  <div className="w-full bg-white/5 p-6 rounded-2xl border border-white/10 mb-6 flex flex-col items-center gap-1">
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Prize</span>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]">+{showResult.amount} SOL</span>
                  </div>
                )}
                <button onClick={() => setShowResult(null)} className="btn-solana w-full py-3.5 text-sm font-black">
                  {showResult.type === 'win' ? 'Play Again' : 'Try Again'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
