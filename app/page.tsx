"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Coins, ShieldCheck, Clock } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import MiningBlock from "@/components/MiningBlock";
import ResultOverlay from "@/components/ResultOverlay";
import GameCard from "@/components/GameCard";
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

  // Notification when other players join
  const prevActualPlayerCountRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevActualPlayerCountRef.current;
    const current = actualPlayerCount;
    
    // Someone joined (not us)
    if (current > prev && prev > 0 && myPlayerIndex !== null) {
      toast.info(`Player joined! ${current} players in round`, { duration: 2000 });
    }
    
    // Update ref
    prevActualPlayerCountRef.current = current;
  }, [actualPlayerCount, myPlayerIndex]);

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
  const hasNotifiedTimerStartRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (gameState && isWaiting && actualPlayerCount > 0) {
      // Notify when timer starts (3+ players)
      if (actualPlayerCount >= 3 && !hasNotifiedTimerStartRef.current) {
        toast.success('Round starting! Timer activated', { duration: 3000 });
        hasNotifiedTimerStartRef.current = true;
      }
      
      const iv = setInterval(() => {
        const blockStart = gameState.blockStartTime ? Number(gameState.blockStartTime.toString()) : gameState.lastActivityTime ? Number(gameState.lastActivityTime.toString()) : Date.now() / 1000;
        const elapsed = Math.floor(Date.now() / 1000) - blockStart;
        const r = BLOCK_EXPIRATION_SECONDS - elapsed;
        const remaining = r > 0 ? r : 0;
        setTimeRemaining(remaining);
        
        // Warning notifications
        if (remaining === 10 && actualPlayerCount < 3) {
          toast.warning('10 seconds left! Need 3 players minimum', { duration: 3000 });
        }
        if (remaining === 5 && actualPlayerCount >= 3) {
          toast.info('5 seconds until round ends!', { duration: 2000 });
        }
        
        if (remaining === 0) triggerCrank();
      }, 1000);
      return () => clearInterval(iv);
    }
    setTimeRemaining(null);
    hasNotifiedTimerStartRef.current = false;
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
    <>
      <Toaster position="top-center" theme="dark" />
      
      {/* Background effects - fixed */}
      <div className="fixed inset-0 pointer-events-none z-[-3] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-[#DC1FFF]/30 rounded-full blur-[100px] sm:blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#00FFA3]/25 rounded-full blur-[120px] sm:blur-[140px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#03E1FF]/25 rounded-full blur-[130px] sm:blur-[150px] animate-blob animation-delay-4000" />
      </div>
      <div className="cyber-grid" />
      <div className="scanlines" />

      {/* Main layout wrapper */}
      <div className="game-layout-root">
        {/* Header - Fixed height */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl flex-shrink-0" style={{ height: 'var(--nav-height)' }}>
          <div className="h-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 flex items-center justify-between gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <img src="/images/trigger-logo.png" alt="MEV Wars" className="h-8 sm:h-10 lg:h-12 w-auto filter drop-shadow-[0_0_12px_rgba(220,31,255,0.6)]" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-4">
              {/* Live Badge with Pulse */}
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

        {/* Scrollable content wrapper */}
        <div className="game-content-wrapper">
          {/* Hero Section - Scrollable */}
          <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 lg:py-16">
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter mb-4 sm:mb-6 leading-tight"
              >
                <span className="text-white">MEV Wars</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF]">
                  Provably Fair
                </span>
                <br />
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white/90">
                  Solana Casino Game
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-zinc-300 font-medium max-w-3xl mx-auto mb-8 sm:mb-10 px-4 leading-relaxed"
              >
                Join a round. <span className="text-[#00FFA3] font-bold">1 in 3 players wins.</span> Fully on-chain. Instant payouts.
              </motion.p>

              {/* Social Proof Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10"
              >
                {[
                  { icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />, text: "100% On-chain", color: "text-[#00FFA3]" },
                  { icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Provably Fair", color: "text-[#03E1FF]" },
                  { icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Instant Payouts", color: "text-[#DC1FFF]" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 ${item.color}`}>
                    {item.icon}
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              {/* Primary CTA - Only show if not connected */}
              {!connected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center"
                >
                  <div className="inline-block">
                    <WalletMultiButton className="!bg-gradient-to-r !from-[#00FFA3] !to-[#03E1FF] !text-black !font-black !uppercase !tracking-wider !rounded-xl !shadow-[0_0_40px_rgba(0,255,163,0.5)] hover:!shadow-[0_0_60px_rgba(0,255,163,0.7)] !transition-all !duration-200 hover:!scale-105 active:!scale-95 !px-8 !py-4 !text-base sm:!text-lg" />
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Game Section - Fixed viewport, no scroll */}
          <section className="game-section-fixed">
            {/* Mobile Layout (< 768px) */}
            <div className="block lg:hidden h-full flex flex-col">
              {/* Room Switcher - Mobile */}
              <div className="tier-selector-mobile flex-shrink-0 flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-white/5 rounded-xl border border-white/10 mb-2">
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

              {/* Mining Block - Mobile */}
              <div className="mining-block-container-mobile flex-1 min-h-0">
                <div className="relative w-full h-full flex items-center justify-center">
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
              </div>

              {/* Game Panel - Mobile (Bottom) */}
              <div className="game-panel-mobile flex-shrink-0">
                <GameCard
                  roomId={roomId}
                  label={activeRoom.label}
                  playerCount={actualPlayerCount}
                  potAmount={potAmount}
                  timeRemaining={timeRemaining}
                  onJoin={handleJoin}
                  isConnected={connected}
                  txPending={txPending}
                  myPlayerIndex={displayPlayerIndex}
                />
              </div>
            </div>

            {/* Desktop Layout (≥ 768px) */}
            <div className="hidden lg:grid h-full">
              {/* Room Switcher - Desktop (spans all columns) */}
              <div className="tier-selector-desktop flex justify-center">
                <div className="flex gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
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
              </div>

              {/* Mining Block - Desktop (Center) */}
              <div className="mining-block-container-desktop">
                <div className="relative w-full h-full flex items-center justify-center">
                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <span className="text-[7rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">{countdown}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <MiningBlock playerCount={actualPlayerCount} isSpinning={isSpinning} rotation={rotation} countdown={countdown} />
                </div>
              </div>

              {/* Game Panel - Desktop (Right Side) */}
              <div className="game-panel-desktop">
                <GameCard
                  roomId={roomId}
                  label={activeRoom.label}
                  playerCount={actualPlayerCount}
                  potAmount={potAmount}
                  timeRemaining={timeRemaining}
                  onJoin={handleJoin}
                  isConnected={connected}
                  txPending={txPending}
                  myPlayerIndex={displayPlayerIndex}
                />
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
        </div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <ResultOverlay
            type={showResult.type}
            message={showResult.msg}
            amount={showResult.amount}
            onClose={() => setShowResult(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
