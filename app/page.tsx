"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Coins, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import MiningBlock from "@/components/MiningBlock";
import ResultOverlay from "@/components/ResultOverlay";
import CountdownTimer from "@/components/CountdownTimer";
import GameCard from "@/components/GameCard";
import { ROOMS } from "@/config/constants";

const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const WhyDifferent = dynamic(() => import("@/components/WhyDifferent"));
const ProvablyFair = dynamic(() => import("@/components/ProvablyFair"));
const FAQ = dynamic(() => import("@/components/FAQ"));
const LiveActivity = dynamic(() => import("@/components/LiveActivity"));
const Footer = dynamic(() => import("@/components/Footer"));

const getRoomIcon = (iconName: string) => {
  switch (iconName) {
    case 'Coins': return <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case 'Zap': return <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    case 'Trophy': return <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    default: return <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  }
};

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
    loading: () => (
      <button className="px-4 py-2 rounded-xl border border-white/15 text-xs sm:text-sm font-bold text-zinc-300 bg-white/5">
        Connect Wallet
      </button>
    ),
  }
);

const ROUND_EXPIRATION_SECONDS = 20;

interface RoundOverlayState {
  type: 'win' | 'lose' | 'survive';
  title: string;
  msg: string;
  amount?: number;
  multiplier?: number;
  isFinal: boolean;
  actionLabel: string;
}

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [roomId, setRoomId] = useState<number>(101);
  const { gameState, fetchState, joinGame, initializeRoom, crankRoom, secureGain, gameResult, setGameResult } = useGame(roomId);

  // Dynamic viewport sizing
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const [performanceMode, setPerformanceMode] = useState(false);
  
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePerfMode = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowCpu = (nav.hardwareConcurrency ?? 8) <= 6;
      const lowMemory = (nav.deviceMemory ?? 8) <= 8;
      const smallViewport = window.innerWidth < 1440;
      setPerformanceMode(media.matches || lowCpu || lowMemory || smallViewport);
    };

    updatePerfMode();
    window.addEventListener('resize', updatePerfMode);
    media.addEventListener('change', updatePerfMode);

    return () => {
      window.removeEventListener('resize', updatePerfMode);
      media.removeEventListener('change', updatePerfMode);
    };
  }, []);

  // Calculate optimal mining block size based on viewport
  const getMiningBlockSize = () => {
    const { width, height } = viewportSize;

    if (width <= 0 || height <= 0) return 320;
    
    // Mobile portrait
    if (width < 640) {
      return Math.max(240, Math.min(width - 60, height * 0.4, 320));
    }
    // Mobile landscape / Small tablet
    if (width < 768) {
      return Math.max(260, Math.min(width - 80, height * 0.45, 380));
    }
    // Tablet
    if (width < 1024) {
      return Math.max(280, Math.min(width * 0.5, height * 0.5, 420));
    }
    // Desktop - calculate based on available space
    const availableHeight = height - 300; // Subtract header, stats, padding
    const availableWidth = width * 0.6; // Left column is ~60% on desktop
    return Math.max(300, Math.min(availableWidth - 100, availableHeight, 500));
  };

  const miningBlockSize = getMiningBlockSize();

  const activeRoom = useMemo(() => ROOMS.find(r => r.id === roomId)!, [roomId]);
  const isWaiting = !gameState || (gameState.state && 'waiting' in gameState.state);
  const isInProgress = gameState && gameState.state && 'inProgress' in gameState.state;
  const currentRound = gameState?.currentRound ?? 0;
  const survivors = gameState?.survivors ? gameState.survivors.filter((p: PublicKey) => p.toString() !== PublicKey.default.toString()) : [];
  const potAmount = gameState?.potAmount ? (gameState.potAmount.toNumber() / 1e9) : 0;
  const multiplier = currentRound > 0 ? currentRound + 1 : 1; // Example multiplier

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [txPending, setTxPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<RoundOverlayState | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);

  const actualPlayerCount = gameState?.playerCount ?? 0;

  const myPlayerIndex = useMemo(() => {
    if (!gameState?.players || !publicKey) return null;
    const idx = (gameState.players as PublicKey[]).findIndex(
      (p: PublicKey) => p.toString() === publicKey.toString()
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

  const isCurrentPlayerAlive = useMemo(() => {
    if (!publicKey || myPlayerIndex === null) return false;
    if (!isInProgress) return true;
    return survivors.some((s: PublicKey) => s.toString() === publicKey.toString());
  }, [publicKey, myPlayerIndex, isInProgress, survivors]);

  const activeSlotIndexes = useMemo(() => {
    if (!gameState?.players) return [] as number[];
    const players = (gameState.players as PublicKey[]).slice(0, actualPlayerCount);

    if (isInProgress) {
      const survivorSet = new Set(survivors.map((p: PublicKey) => p.toString()));
      return players
        .map((p: PublicKey, idx: number) => ({ key: p.toString(), idx }))
        .filter(({ key }) => key !== PublicKey.default.toString() && survivorSet.has(key))
        .map(({ idx }) => idx);
    }

    return players
      .map((p: PublicKey, idx: number) => ({ key: p.toString(), idx }))
      .filter(({ key }) => key !== PublicKey.default.toString())
      .map(({ idx }) => idx);
  }, [gameState?.players, actualPlayerCount, isInProgress, survivors]);

  const fetchStateRef = useRef(fetchState);
  useEffect(() => { fetchStateRef.current = fetchState; }, [fetchState]);
  const stableFetch = useCallback(() => fetchStateRef.current(), []);

  const lastPlayersRef = useRef<string[]>([]);
  useEffect(() => {
    if (actualPlayerCount > 0 && gameState?.players) {
      const real = (gameState.players as PublicKey[])
        .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString())
        .map((p: PublicKey) => p.toString());
      if (real.length > 0) lastPlayersRef.current = real;
    }
  }, [gameState?.players, actualPlayerCount]);

  const prevMyIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (myPlayerIndex !== null && myPlayerIndex !== prevMyIndexRef.current) {
      toast.info(`Entered round - Position #${myPlayerIndex + 1}`);
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

  const prevRoundSnapshotRef = useRef<{ round: number; survivors: string[]; inProgress: boolean }>({
    round: 0,
    survivors: [],
    inProgress: false,
  });
  const lastInProgressSnapshotRef = useRef<{ round: number; survivors: string[] }>({
    round: 0,
    survivors: [],
  });

  useEffect(() => {
    if (!publicKey) return;

    const myKey = publicKey.toString();
    const inProgressNow = !!(gameState?.state && 'inProgress' in gameState.state);
    const roundNow = gameState?.currentRound ?? 0;
    const survivorsNow = (gameState?.survivors ?? [])
      .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString())
      .map((p: PublicKey) => p.toString());
    const participantsNow = (gameState?.players ?? [])
      .slice(0, gameState?.playerCount ?? 0)
      .filter((p: PublicKey) => p.toString() !== PublicKey.default.toString())
      .map((p: PublicKey) => p.toString());

    const prev = prevRoundSnapshotRef.current;

    // First crank transitions Waiting -> InProgress and can already resolve round 1.
    // In this case we compare against participants instead of previous survivors.
    if (inProgressNow && !prev.inProgress && roundNow >= 2) {
      const wasInRoundOne = participantsNow.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);

      if (wasInRoundOne && aliveNow) {
        setShowResult({
          type: 'survive',
          title: 'ROUND 1 SURVIVED',
          msg: 'You survived round 1. Get ready for the next draw.',
          isFinal: false,
          actionLabel: 'Next Round',
        });
      }

      if (wasInRoundOne && !aliveNow) {
        setShowResult({
          type: 'lose',
          title: 'DEFEAT',
          msg: `You were eliminated in round 1. Bet lost: ${activeRoom.label}.`,
          isFinal: true,
          actionLabel: 'Close',
        });
      }
    }

    if (inProgressNow && prev.inProgress && roundNow > prev.round) {
      const wasAlive = prev.survivors.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);

      if (wasAlive && aliveNow) {
        setShowResult({
          type: 'survive',
          title: `ROUND ${prev.round} SURVIVED`,
          msg: `You survived round ${prev.round}. Get ready for the next draw.`,
          isFinal: false,
          actionLabel: 'Next Round',
        });
      }

      if (wasAlive && !aliveNow) {
        setShowResult({
          type: 'lose',
          title: 'DEFEAT',
          msg: `You were eliminated in round ${prev.round}. Bet lost: ${activeRoom.label}.`,
          isFinal: true,
          actionLabel: 'Close',
        });
      }
    }

    prevRoundSnapshotRef.current = {
      round: roundNow,
      survivors: survivorsNow,
      inProgress: inProgressNow,
    };

    if (inProgressNow) {
      lastInProgressSnapshotRef.current = {
        round: roundNow,
        survivors: survivorsNow,
      };
    }
  }, [gameState?.state, gameState?.currentRound, gameState?.survivors, publicKey, activeRoom.label]);
  
  useEffect(() => {
    if (!gameResult) return;
    
    const resultKey = `${gameResult.winner || gameResult.winners?.[0]}-${gameResult.winnerAmount}-${Date.now()}`;
    if (gameResultProcessedRef.current === resultKey) return;
    gameResultProcessedRef.current = resultKey;
    
    const frozenPlayers = [...lastPlayersRef.current];
    const frozenResult = { ...gameResult };
    setIsSpinning(false);
    setCountdown(3);
    let count = 3;
    let timeoutId: NodeJS.Timeout;
    const intId = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(intId);
        setCountdown(null);
        setRotation(360 * 3);
        setIsSpinning(true);
        timeoutId = setTimeout(() => {
          setIsSpinning(false);
          const myKey = publicKey?.toString() ?? '';
          const wasInGame = frozenPlayers.includes(myKey);
          const isWinner = frozenResult.winners?.includes(myKey) || frozenResult.winner === myKey;
          const winAmt = (frozenResult.winnerAmount / 1e9).toFixed(4);
          if (wasInGame && isWinner) {
            const multiplierValue = activeRoom.lamports > 0
              ? frozenResult.winnerAmount / activeRoom.lamports
              : undefined;

            setShowResult({
              type: 'win',
              title: 'VICTORY',
              msg: `You won the game. Payout has been sent to your wallet.`,
              amount: parseFloat(winAmt),
              multiplier: multiplierValue,
              isFinal: true,
              actionLabel: 'Close',
            });
          } else if (wasInGame && !isWinner) {
            setShowResult({
              type: 'lose',
              title: 'DEFEAT',
              msg: `Game finished. Your bet (${activeRoom.label}) was lost this round.`,
              isFinal: true,
              actionLabel: 'Close',
            });
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
          }, 5000);
        }, 2500);
      }
    }, 1000);
    return () => {
      clearInterval(intId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [gameResult, publicKey, setGameResult, stableFetch, activeRoom.lamports, activeRoom.label]);

  useEffect(() => {
    if (!showResult) return;
    const timeout = setTimeout(() => setShowResult(null), 5000);
    return () => clearTimeout(timeout);
  }, [showResult]);

  const finalFallbackShownRef = useRef(false);
  useEffect(() => {
    if (!publicKey) return;

    const myKey = publicKey.toString();
    const inProgressNow = !!(gameState?.state && 'inProgress' in gameState.state);
    const playerCountNow = gameState?.playerCount ?? 0;
    const lastInProgress = lastInProgressSnapshotRef.current;

    // Fallback for final card in case winner log parsing misses on slow RPC.
    if (
      !inProgressNow &&
      playerCountNow === 0 &&
      lastInProgress.round > 0 &&
      !gameResult &&
      !showResult &&
      !finalFallbackShownRef.current
    ) {
      const wasParticipant = lastPlayersRef.current.includes(myKey);
      if (!wasParticipant) return;

      const survivedUntilEnd = lastInProgress.survivors.includes(myKey);

      setShowResult({
        type: survivedUntilEnd ? 'win' : 'lose',
        title: survivedUntilEnd ? 'VICTORY' : 'DEFEAT',
        msg: survivedUntilEnd
          ? 'Game finished. You survived the final round.'
          : `Game finished. Your bet (${activeRoom.label}) was lost.`,
        isFinal: true,
        actionLabel: 'Close',
      });

      finalFallbackShownRef.current = true;
    }

    if (inProgressNow) {
      finalFallbackShownRef.current = false;
    }
  }, [gameState?.state, gameState?.playerCount, publicKey, gameResult, showResult, activeRoom.label]);

  useEffect(() => {
    setShowResult(null); setIsSpinning(false); setCountdown(null);
    setTxPending(false); setIsProcessingResult(false);
    lastPlayersRef.current = [];
    gameResultProcessedRef.current = null;
  }, [roomId]);

  const lastCrankTimeRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    if (Date.now() - lastCrankTimeRef.current < 10000) return;
    lastCrankTimeRef.current = Date.now();
    try {
      const action = await crankRoom();
      if (action === 'refund') {
        toast.success('Round refunded on-chain');
      } else {
        toast.success('Round advanced on-chain');
      }
    } catch {
      // Silently ignore to avoid noisy toast spam during timer checks
    }
  }, [crankRoom]);

  const prevPlayerCountRef = useRef<number>(0);
  useEffect(() => {
    const pc = gameState?.playerCount ?? 0;
    if (prevPlayerCountRef.current >= 2 && pc === 0) setIsProcessingResult(true);
    prevPlayerCountRef.current = pc;
  }, [gameState?.playerCount, txPending]);

  const prevPlayerCountForRefundRef = useRef<number>(0);
  const wasInGameRef = useRef<boolean>(false);
  useEffect(() => {
    if (myPlayerIndex !== null && actualPlayerCount > 0) wasInGameRef.current = true;
  }, [myPlayerIndex, actualPlayerCount]);

  useEffect(() => {
    const prev = prevPlayerCountForRefundRef.current;
    const current = actualPlayerCount;
    if (prev > 0 && prev < 2 && current === 0 && wasInGameRef.current) {
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
  const blockStartUnix = useMemo(() => {
    if (!gameState) return null;
    if (gameState.blockStartTime) return Number(gameState.blockStartTime.toString());
    if (gameState.lastActivityTime) return Number(gameState.lastActivityTime.toString());
    return null;
  }, [gameState?.blockStartTime, gameState?.lastActivityTime, gameState]);
  
  useEffect(() => {
    if (blockStartUnix !== null && (isWaiting || isInProgress) && actualPlayerCount > 0) {
      // Notify when timer starts (2+ players joining, only during waiting phase)
      if (isWaiting && actualPlayerCount >= 2 && !hasNotifiedTimerStartRef.current) {
        toast.success('Round starting! Timer activated', { duration: 3000 });
        hasNotifiedTimerStartRef.current = true;
      }
      
      const iv = setInterval(() => {
        const elapsed = Math.floor(Date.now() / 1000) - blockStartUnix;
        const r = ROUND_EXPIRATION_SECONDS - elapsed;
        const remaining = r > 0 ? r : 0;
        setTimeRemaining(remaining);
        
        // Warning notifications (only relevant during waiting phase)
        if (isWaiting && remaining === 10 && actualPlayerCount < 2) {
          toast.warning('10 seconds left! Need 2 players minimum', { duration: 3000 });
        }
        if (remaining === 5 && actualPlayerCount >= 2) {
          toast.info('5 seconds until round ends!', { duration: 2000 });
        }
        
        if (remaining === 0) triggerCrank();
      }, 1000);
      return () => clearInterval(iv);
    }
    setTimeRemaining(null);
    hasNotifiedTimerStartRef.current = false;
  }, [blockStartUnix, isWaiting, isInProgress, actualPlayerCount, triggerCrank]);

  const handleInitializeRoom = async () => {
    if (!connected) return;
    try {
      setTxPending(true);
      const txPromise = initializeRoom(activeRoom.lamports);
      toast.promise(txPromise, {
        loading: 'Initializing room...',
        success: 'Room initialized!',
        error: (e: any) => `Failed: ${e.message}`,
      });
      await txPromise;
    } finally {
      setTxPending(false);
    }
  };

  const handleJoin = async () => {
    if (!publicKey) return;
    const myKey = publicKey.toString();
    if (!lastPlayersRef.current.includes(myKey)) lastPlayersRef.current.push(myKey);
    try {
      setTxPending(true);
      
      // If room doesn't exist yet, initialize it first
      if (!gameState) {
        toast.loading('Initializing room...');
        await initializeRoom(activeRoom.lamports);
        toast.dismiss();
      }
      
      const txPromise = joinGame(activeRoom.lamports);
      toast.promise(txPromise, { loading: 'Entering round...', success: 'Entered round successfully!', error: (e: any) => `Failed: ${e.message}` });
      await txPromise;
    } catch (e) {
      // Error already handled by toast
    } finally {
      setTxPending(false);
    }
  };

  const handleSecureGain = async () => {
    if (!publicKey) return;
    try {
      setTxPending(true);
      const txPromise = secureGain();
      toast.promise(txPromise, { loading: 'Securing gain...', success: 'Gain secured! You received 2x your entry.', error: (e: any) => `Failed: ${e.message}` });
      await txPromise;
    } catch (e) {
      // Error already handled by toast
    } finally {
      setTxPending(false);
    }
  };

  const secondarySections = useMemo(() => (
    <>
      <HowItWorks />
      <WhyDifferent />
      <ProvablyFair />
      <LiveActivity />
      <FAQ />
      <Footer />
    </>
  ), []);

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-[-3] overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-[#DC1FFF]/30 rounded-full blur-[70px] sm:blur-[90px] ${performanceMode ? '' : 'animate-blob'}`} />
        <div className={`absolute top-[20%] right-[-10%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#00FFA3]/25 rounded-full blur-[80px] sm:blur-[100px] ${performanceMode ? '' : 'animate-blob animation-delay-2000'}`} />
        <div className={`absolute bottom-[-20%] left-[20%] w-[400px] sm:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] lg:h-[600px] bg-[#03E1FF]/25 rounded-full blur-[90px] sm:blur-[110px] ${performanceMode ? '' : 'animate-blob animation-delay-4000'}`} />
      </div>
      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <motion.div initial={false} animate={{ opacity: 1, x: 0 }}>
            <img src="/images/trigger-logo.png" alt="MEV Wars" className="h-8 sm:h-10 lg:h-12 w-auto filter drop-shadow-[0_0_12px_rgba(220,31,255,0.6)]" />
          </motion.div>

          <motion.div initial={false} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 sm:gap-4">
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

      {/* Hero Section */}
      <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <motion.h1
            initial={false}
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-zinc-300 font-medium max-w-3xl mx-auto mb-8 sm:mb-10 px-4 leading-relaxed"
          >
            Join a round. <span className="text-[#00FFA3] font-bold">Minimum 2 players, 1 final winner.</span> Fully on-chain. Instant payouts.
          </motion.p>

          {/* Social Proof Bar */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8"
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
        </div>
      </section>

          {/* Game Section - Dynamic Responsive */}
          <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
              
              {/* Round Info */}
              <div className="glass-card p-2.5 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider">Round</p>
                  <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
                    <span className="text-[0.5rem] sm:text-[0.55rem] font-black uppercase text-[#00FFA3]">Live</span>
                  </div>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">#{roomId}</p>
                <p className="text-xs sm:text-sm text-[#00FFA3] font-bold">{activeRoom.label}</p>
              </div>

              {/* Pool */}
              <div className="glass-card p-2.5 sm:p-4 text-center">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Pool</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">{potAmount.toFixed(3)}</p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">SOL x{multiplier}</p>
              </div>
              
              {/* Round */}
              <div className="glass-card p-2.5 sm:p-4 text-center">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Round</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">{currentRound || '-'}</p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">Active</p>
              </div>
              
              {/* Players */}
              <div className="glass-card p-2.5 sm:p-4 text-center">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Players</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">{isInProgress ? survivors.length : actualPlayerCount}</p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">1 winner</p>
              </div>
              
              {/* Win Chance */}
              <div className="glass-card p-2.5 sm:p-4 text-center bg-gradient-to-br from-[#00FFA3]/5 to-[#DC1FFF]/5 border-[#00FFA3]/30">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Win Chance</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#DC1FFF]">
                  {actualPlayerCount >= 2 ? (100 / actualPlayerCount).toFixed(1) : "50.0"}%
                </p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">to win</p>
              </div>
            </div>

            {/* Main Game Container */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-3 sm:gap-4">
              
              {/* Game Arena */}
              <div className="glass-card p-3 sm:p-4 lg:p-6">
                
                {/* Timer - Floating Above */}
                {/* Mining Block Container - Dynamic Size */}
                <div className="relative w-full flex items-center justify-center">
                  <div 
                    className="relative aspect-square"
                    style={{ 
                      width: `${miningBlockSize}px`,
                      maxWidth: '100%'
                    }}
                  >
                    <AnimatePresence>
                      {timeRemaining !== null && timeRemaining > 0 && actualPlayerCount > 0 && countdown === null && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.88 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                          <CountdownTimer secondsLeft={timeRemaining} totalSeconds={ROUND_EXPIRATION_SECONDS} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Countdown Overlay - Ultra Premium */}
                      <AnimatePresence>
                        {countdown !== null && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ 
                              duration: 0.4,
                              ease: [0.34, 1.56, 0.64, 1]
                            }}
                            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                          >
                            {/* Outer Glow Ring */}
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full"
                              style={{
                                background: 'radial-gradient(circle, rgba(0,255,163,0.4) 0%, transparent 70%)',
                                filter: 'blur(20px)'
                              }}
                            />
                            
                            {/* Main Circle Container */}
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                              {/* Animated Circle Progress */}
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r="45%"
                                  fill="none"
                                  stroke="rgba(255,255,255,0.1)"
                                  strokeWidth="3"
                                />
                                <motion.circle
                                  cx="50%"
                                  cy="50%"
                                  r="45%"
                                  fill="none"
                                  stroke="url(#countdown-gradient)"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  initial={{ pathLength: 1 }}
                                  animate={{ pathLength: countdown / 5 }}
                                  transition={{ duration: 0.3, ease: "easeOut" }}
                                  style={{
                                    filter: 'drop-shadow(0 0 8px rgba(0,255,163,0.8))'
                                  }}
                                />
                                <defs>
                                  <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#00FFA3" />
                                    <stop offset="50%" stopColor="#03E1FF" />
                                    <stop offset="100%" stopColor="#DC1FFF" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              
                              {/* Glass Background */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,255,163,0.3)]" />
                              </div>
                              
                              {/* Number with Pulse */}
                              <motion.div
                                key={countdown}
                                initial={{ scale: 1.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ 
                                  duration: 0.3,
                                  ease: [0.34, 1.56, 0.64, 1]
                                }}
                                className="absolute inset-0 flex items-center justify-center"
                              >
                                <span 
                                  className="font-black text-transparent bg-clip-text bg-gradient-to-br from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF] text-6xl sm:text-7xl"
                                  style={{
                                    textShadow: '0 0 40px rgba(0,255,163,0.8), 0 0 80px rgba(3,225,255,0.4)',
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
                                  }}
                                >
                                  {countdown}
                                </span>
                              </motion.div>
                              
                              {/* Rotating Particles */}
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "linear"
                                  }}
                                  className="absolute inset-0"
                                >
                                  <div 
                                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#00FFA3] to-[#03E1FF]"
                                    style={{
                                      top: '10%',
                                      left: '50%',
                                      boxShadow: '0 0 12px rgba(0,255,163,0.8)',
                                      transform: `translateX(-50%) rotate(${i * 120}deg) translateY(-60px)`
                                    }}
                                  />
                                </motion.div>
                              ))}
                            </div>
                            
                            {/* Bottom Text */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="absolute bottom-8 sm:bottom-12"
                            >
                              <p className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                Round Starting...
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    
                    {/* Mining Block */}
                    <div className="w-full h-full">
                      <MiningBlock 
                        playerCount={actualPlayerCount} 
                        isSpinning={isSpinning} 
                        rotation={rotation} 
                        countdown={countdown}
                        activeSlotIndexes={activeSlotIndexes}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div className="glass-card p-3 sm:p-4 lg:p-6 flex flex-col gap-3 sm:gap-4">
                
                {/* Bet Selection */}
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase text-white mb-2 sm:mb-3 tracking-wider">Select Your Bet</h3>
                  <div className="space-y-2">
                    {ROOMS.map(room => (
                      <button
                        key={room.id}
                        onClick={() => !countdown && setRoomId(room.id)}
                        disabled={!!countdown}
                        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                          roomId === room.id 
                            ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-[0_0_20px_rgba(153,69,255,0.4)]' 
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-white/10'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4">{getRoomIcon(room.iconName)}</span>
                          <span>{room.label}</span>
                        </span>
                        {roomId === room.id && (
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Action Area */}
                <div className="flex-1 flex flex-col justify-end gap-2 sm:gap-3">
                  {!connected ? (
                    <div className="text-center p-3 sm:p-4 border-2 border-dashed border-zinc-700 rounded-xl">
                      <p className="text-[0.65rem] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">Connect Your Wallet</p>
                      <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-600 mt-1">Use the button in the header</p>
                    </div>
                  ) : myPlayerIndex !== null && isCurrentPlayerAlive ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border-2 border-[#00FFA3]/40 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFA3]" />
                        <p className="text-base sm:text-lg font-black text-[#00FFA3]">You&apos;re In!</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Position #{(displayPlayerIndex ?? myPlayerIndex) + 1}</p>
                    </div>
                  ) : myPlayerIndex !== null && isInProgress && !isCurrentPlayerAlive ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#FF5B5B]/10 to-[#FF6B9D]/10 border-2 border-[#FF5B5B]/40 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <p className="text-base sm:text-lg font-black text-[#FF5B5B]">Eliminated</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Wait for the next game to join again</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={txPending}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-black uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:shadow-[0_0_50px_rgba(0,255,163,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        `Enter Round - ${activeRoom.label}`
                      )}
                    </button>
                  )}

                  {/* Secure Gain Button - only available from round 2 (multiplier >= 2) */}
                  {isInProgress && currentRound >= 2 && isCurrentPlayerAlive && (
                    <button
                      onClick={handleSecureGain}
                      disabled={txPending}
                      className="w-full mt-3 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-[#FF6B9D] to-[#DC1FFF] text-white font-black uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_30px_rgba(255,107,157,0.4)] hover:shadow-[0_0_50px_rgba(255,107,157,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" />
                          <span>Securing...</span>
                        </span>
                      ) : (
                        `Secure 2x Gain & Exit`
                      )}
                    </button>
                  )}
                  
                  <p className="text-[0.6rem] sm:text-[0.65rem] text-center text-zinc-600 leading-relaxed">
                    Winners are selected automatically on-chain. Provably fair & transparent.
                  </p>
                </div>
              </div>
            </div>
          </section>

      {/* Secondary sections are memoized to avoid rerendering every timer tick */}
      {secondarySections}

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <ResultOverlay
            type={showResult.type}
            title={showResult.title}
            message={showResult.msg}
            amount={showResult.amount}
            multiplier={showResult.multiplier}
            isFinal={showResult.isFinal}
            actionLabel={showResult.actionLabel}
            autoCloseInSeconds={5}
            onClose={() => setShowResult(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


