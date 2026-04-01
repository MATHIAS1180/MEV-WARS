"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
import { BLOCK_EXPIRATION_SECONDS, ROOMS } from "@/config/constants";

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

const ROUND_EXPIRATION_SECONDS = BLOCK_EXPIRATION_SECONDS; // 20 seconds
const OVERLAY_AUTO_CLOSE_MS = 5000;
const RESULT_CLEANUP_DELAY_MS = OVERLAY_AUTO_CLOSE_MS + 200;

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
  const { gameState, fetchState, joinGame, initializeRoom, crankRoom, secureGain, gameResult, setGameResult, serverTimerRemaining } = useGame(roomId);

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
  const isInProgress = !!(gameState?.state && 'inProgress' in gameState.state);
  const isFinished = !!(gameState?.state && 'finished' in gameState.state);
  // Treat missing/late state payloads as waiting to keep timers and UI responsive.
  const isWaiting = !isInProgress && !isFinished;
  const currentRound = gameState?.currentRound ?? 0;
  const survivors = useMemo(() => {
    if (!gameState?.survivors) return [] as PublicKey[];
    return gameState.survivors.filter((p: PublicKey) => p.toString() !== PublicKey.default.toString());
  }, [gameState?.survivors]);

  // Get all players array (permanent indices)
  const allPlayers = useMemo(() => {
    if (!gameState?.players) return [] as PublicKey[];
    return (gameState.players as PublicKey[]).slice(0, gameState.playerCount ?? 0);
  }, [gameState?.players, gameState?.playerCount]);
  const actualPlayerCount = gameState?.playerCount ?? 0;
  const potAmount = gameState?.potAmount ? (gameState.potAmount.toNumber() / 1e9) : 0;
  const multiplier = currentRound > 0 ? currentRound + 1 : 1; // Example multiplier
  const joinedPlayersCount = isInProgress ? survivors.length : actualPlayerCount;
  const potentialMultiplier = joinedPlayersCount >= 2 ? joinedPlayersCount * 0.98 : null;

  const [isSpinning, setIsSpinning] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<RoundOverlayState | null>(null);
  const [overlayCloseAtMs, setOverlayCloseAtMs] = useState<number | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);

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
    if (!gameState ?.players) return [] as number[];
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

  const refundHandledRef = useRef<boolean>(false);

  const gameResultProcessedRef = useRef<string | null>(null);
  const eliminatedThisGameRef = useRef<boolean>(false);
  const resultCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayAutoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Keep only final-resolution overlays to avoid rapid UI flashing between rounds.
    if (inProgressNow && !prev.inProgress && roundNow >= 2) {
      const wasInRoundOne = participantsNow.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);
      if (wasInRoundOne && !aliveNow) {
        eliminatedThisGameRef.current = true;
      }
    }

    if (inProgressNow && prev.inProgress && roundNow > prev.round) {
      const wasAlive = prev.survivors.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);
      if (wasAlive && !aliveNow) {
        eliminatedThisGameRef.current = true;
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
  }, [gameState?.state, gameState?.currentRound, gameState?.survivors, gameState?.players, gameState?.playerCount, publicKey, activeRoom.label]);
  
  useEffect(() => {
    if (!gameResult) return;

    const primaryWinner = gameResult.winners?.[0] || gameResult.winner || 'none';
    const participantsFingerprint = [...lastPlayersRef.current].sort().join('|');
    const resultKey = `${participantsFingerprint}-${primaryWinner}-${gameResult.winnerAmount}-${gameResult.totalPot}`;
    if (gameResultProcessedRef.current === resultKey) return;
    gameResultProcessedRef.current = resultKey;

    const frozenPlayers = [...lastPlayersRef.current];
    const myKey = publicKey?.toString() ?? '';
    const wasInGame = frozenPlayers.includes(myKey);
    const isWinner = gameResult.winners?.includes(myKey) || gameResult.winner === myKey;
    const winAmt = (gameResult.winnerAmount / 1e9).toFixed(4);

    setIsSpinning(false);
    setCountdown(null);

    if (wasInGame && isWinner && !eliminatedThisGameRef.current) {
      const multiplierValue = activeRoom.lamports > 0
        ? gameResult.winnerAmount / activeRoom.lamports
        : undefined;

      setShowResult({
        type: 'win',
        title: 'VICTORY',
        msg: 'You won the game. Payout has been sent to your wallet.',
        amount: parseFloat(winAmt),
        multiplier: multiplierValue,
        isFinal: true,
        actionLabel: 'Close',
      });
    } else if (wasInGame) {
      setShowResult({
        type: 'lose',
        title: 'DEFEAT',
        msg: `Game finished. Your bet (${activeRoom.label}) was lost.`,
        isFinal: true,
        actionLabel: 'Close',
      });
    }

    setGameResult(null);
    lastPlayersRef.current = [];

    if (resultCleanupTimeoutRef.current) {
      clearTimeout(resultCleanupTimeoutRef.current);
    }
    resultCleanupTimeoutRef.current = setTimeout(() => {
      setShowResult(null);
      setOverlayCloseAtMs(null);
      setIsProcessingResult(false);
      myPlayerIndexRef.current = null;
      stableFetch();
      resultCleanupTimeoutRef.current = null;
    }, RESULT_CLEANUP_DELAY_MS);
  }, [gameResult, publicKey, setGameResult, stableFetch, activeRoom.lamports, activeRoom.label]);

  useEffect(() => {
    if (overlayAutoCloseTimeoutRef.current) {
      clearTimeout(overlayAutoCloseTimeoutRef.current);
      overlayAutoCloseTimeoutRef.current = null;
    }

    if (!showResult) {
      setOverlayCloseAtMs(null);
      return;
    }

    const closeAt = Date.now() + OVERLAY_AUTO_CLOSE_MS;
    setOverlayCloseAtMs(closeAt);

    overlayAutoCloseTimeoutRef.current = setTimeout(() => {
      setShowResult(null);
      setOverlayCloseAtMs(null);
      overlayAutoCloseTimeoutRef.current = null;
    }, OVERLAY_AUTO_CLOSE_MS);

    return () => {
      if (overlayAutoCloseTimeoutRef.current) {
        clearTimeout(overlayAutoCloseTimeoutRef.current);
        overlayAutoCloseTimeoutRef.current = null;
      }
    };
  }, [showResult]);

  useEffect(() => {
    return () => {
      if (resultCleanupTimeoutRef.current) {
        clearTimeout(resultCleanupTimeoutRef.current);
        resultCleanupTimeoutRef.current = null;
      }
      if (overlayAutoCloseTimeoutRef.current) {
        clearTimeout(overlayAutoCloseTimeoutRef.current);
        overlayAutoCloseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const inProgressNow = !!(gameState?.state && 'inProgress' in gameState.state);
    const playerCountNow = gameState?.playerCount ?? 0;
    if (!inProgressNow && playerCountNow === 0) {
      eliminatedThisGameRef.current = false;
    }
  }, [gameState?.state, gameState?.playerCount]);

  useEffect(() => {
    setShowResult(null); setIsSpinning(false); setCountdown(null);
    setOverlayCloseAtMs(null);
    setTxPending(false); setIsProcessingResult(false);
    lastPlayersRef.current = [];
    gameResultProcessedRef.current = null;
    eliminatedThisGameRef.current = false;
  }, [roomId]);

  const lastCrankTimeRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    if (Date.now() - lastCrankTimeRef.current < 10000) return;
    lastCrankTimeRef.current = Date.now();
    try {
      await crankRoom();
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
    if (current > 0) {
      refundHandledRef.current = false;
    }
    if (prev > 0 && prev < 2 && current === 0 && wasInGameRef.current && !refundHandledRef.current) {
      refundHandledRef.current = true;
      toast.success('Round expired: Not enough players. Your funds have been refunded.', {
        duration: 4500,
        id: `refund-${roomId}`,
      });
      setIsSpinning(false);
      setCountdown(null);
      setTxPending(false);
      setShowResult(null);
      setOverlayCloseAtMs(null);
      setGameResult(null);
      setIsProcessingResult(false);
      myPlayerIndexRef.current = null;
      lastPlayersRef.current = [];
      wasInGameRef.current = false;
      setTimeout(() => stableFetch(), 100);
    }
    prevPlayerCountForRefundRef.current = current;
  }, [actualPlayerCount, stableFetch, setGameResult, roomId]);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const hasNotifiedTimerStartRef = useRef<boolean>(false);
  const warnedTenSecondsRef = useRef<boolean>(false);
  const warnedFiveSecondsRef = useRef<boolean>(false);
  const lastComputedRemainingRef = useRef<number | null>(null);

  useEffect(() => {
    const aliveCount = isInProgress ? survivors.length : actualPlayerCount;
    const canResolveRound = (isWaiting || isInProgress) && aliveCount >= 2;

    if (timeRemaining === null) {
      setCountdown(null);
      return;
    }

    // Keep block visuals static; use the separate timer widget only.
    setCountdown(null);

    if (canResolveRound && timeRemaining === 0) {
      setIsSpinning(false);
    }
  }, [timeRemaining, isWaiting, isInProgress, actualPlayerCount, survivors.length]);
  
  useEffect(() => {
    const isRoundActive = (isWaiting || isInProgress) && actualPlayerCount > 0;
    if (!isRoundActive) {
      setTimeRemaining(null);
      lastComputedRemainingRef.current = null;
      hasNotifiedTimerStartRef.current = false;
      warnedTenSecondsRef.current = false;
      warnedFiveSecondsRef.current = false;
      return;
    }

    if (serverTimerRemaining === null) {
      return;
    }

    const nextRemaining = Math.max(0, serverTimerRemaining);
    const previousRemaining = lastComputedRemainingRef.current;
    lastComputedRemainingRef.current = nextRemaining;

    setTimeRemaining((prev) => (prev === nextRemaining ? prev : nextRemaining));

    if (isWaiting && actualPlayerCount >= 2 && !hasNotifiedTimerStartRef.current) {
      hasNotifiedTimerStartRef.current = true;
    }

    if (isWaiting && nextRemaining <= 10 && actualPlayerCount < 2 && !warnedTenSecondsRef.current) {
      warnedTenSecondsRef.current = true;
    }
    if (isWaiting && nextRemaining <= 5 && actualPlayerCount >= 2 && !warnedFiveSecondsRef.current) {
      warnedFiveSecondsRef.current = true;
    }

    if (nextRemaining === 0 && previousRemaining !== 0) {
      triggerCrank();
    }
  }, [serverTimerRemaining, isWaiting, isInProgress, actualPlayerCount, triggerCrank]);

  const displayTimerSeconds = useMemo(() => {
    const isRoundActive = (isWaiting || isInProgress) && actualPlayerCount > 0;
    if (!isRoundActive) return null;
    return timeRemaining;
  }, [timeRemaining, isWaiting, isInProgress, actualPlayerCount]);

  const hasJoinedCurrentGame = myPlayerIndex !== null;
  const isSpectatingLiveGame = connected && isInProgress && !hasJoinedCurrentGame;

  useEffect(() => {
    // When a game fully ends/reset on-chain, restore arena UI to baseline.
    if (actualPlayerCount !== 0) return;
    if (isInProgress) return;

    setIsSpinning(false);
    setCountdown(null);
    setTimeRemaining(null);
    hasNotifiedTimerStartRef.current = false;
    warnedTenSecondsRef.current = false;
    warnedFiveSecondsRef.current = false;
  }, [actualPlayerCount, isInProgress]);

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
      <Toaster position="top-center" theme="dark" visibleToasts={1} />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          <motion.div initial={false} animate={{ opacity: 1, x: 0 }}>
            <Image
              src="/images/trigger-logo.png"
              alt="MEV Wars"
              width={192}
              height={48}
              priority
              className="h-8 sm:h-10 lg:h-12 w-auto filter drop-shadow-[0_0_12px_rgba(220,31,255,0.6)]"
            />
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
              
              {/* Players */}
              <div className="glass-card p-2.5 sm:p-4 text-center">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Players</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-white">{isInProgress ? survivors.length : actualPlayerCount}</p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">1 winner</p>
              </div>
              
              {/* Potential Multiplier */}
              <div className="glass-card p-2.5 sm:p-4 text-center bg-gradient-to-br from-[#00FFA3]/5 to-[#DC1FFF]/5 border-[#00FFA3]/30">
                <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-400 uppercase font-bold tracking-wider mb-1">Potential Multiplier</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#DC1FFF]">
                  {potentialMultiplier !== null ? `x${potentialMultiplier.toFixed(2)}` : "--"}
                </p>
                <p className="text-[0.6rem] sm:text-xs text-zinc-500">based on joined players</p>
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
                      {displayTimerSeconds !== null && displayTimerSeconds > 0 && countdown === null && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.88 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none"
                        >
                          <CountdownTimer secondsLeft={displayTimerSeconds} totalSeconds={ROUND_EXPIRATION_SECONDS} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Mining Block */}
                    <div className="w-full h-full">
                      <MiningBlock 
                        playerCount={actualPlayerCount} 
                        isSpinning={isSpinning} 
                        rotation={0} 
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
                  ) : hasJoinedCurrentGame && isCurrentPlayerAlive ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border-2 border-[#00FFA3]/40 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFA3]" />
                        <p className="text-base sm:text-lg font-black text-[#00FFA3]">You&apos;re In!</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Position #{(displayPlayerIndex ?? myPlayerIndex) + 1}</p>
                    </div>
                  ) : hasJoinedCurrentGame && isInProgress && !isCurrentPlayerAlive ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#FF5B5B]/10 to-[#FF6B9D]/10 border-2 border-[#FF5B5B]/40 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <p className="text-base sm:text-lg font-black text-[#FF5B5B]">Eliminated</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Position #{(displayPlayerIndex ?? myPlayerIndex) + 1} • Wait for next game</p>
                    </div>
                  ) : isSpectatingLiveGame ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/15 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
                        <p className="text-base sm:text-lg font-black text-zinc-100">Game In Progress</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Wait for round end to enter the next game</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={txPending || isInProgress}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-black uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_30px_rgba(0,255,163,0.4)] hover:shadow-[0_0_50px_rgba(0,255,163,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Processing...</span>
                        </span>
                      ) : isInProgress ? (
                        'Round In Progress'
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
            autoCloseInSeconds={OVERLAY_AUTO_CLOSE_MS / 1000}
            autoCloseAtMs={overlayCloseAtMs ?? undefined}
            onClose={() => {
              setShowResult(null);
              setOverlayCloseAtMs(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


