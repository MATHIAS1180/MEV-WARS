"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Coins, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { Toaster, toast } from "sonner";
// FIX: Import anti-spam notification manager
import { notificationManager } from "@/lib/NotificationManager";
// FIX: Import animation queue for deduplicated overlay sequencing
import { animationQueue } from "@/lib/AnimationQueue";
import { PublicKey } from "@solana/web3.js";
import MiningBlock from "@/components/MiningBlock";
import ResultOverlay from "@/components/ResultOverlay";
import CountdownTimer from "@/components/CountdownTimer";
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
  // FIX: Destructure connectionStatus for UI indicator
  const { gameState, fetchState, joinGame, initializeRoom, crankRoom, secureGain, gameResult, setGameResult, serverTimerRemaining, serverTimerDeadlineMs, connectionStatus } = useGame(roomId);

  // Dynamic viewport sizing
  const [viewportSize, setViewportSize] = useState({ width: 1280, height: 720 });
  const [performanceMode, setPerformanceMode] = useState(false);

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
  const joinedPlayersCount = isInProgress ? survivors.length : actualPlayerCount;
  const entryFeeSol = activeRoom.lamports / 1e9;
  // Potential multiplier = what the winner would get relative to entry fee
  // On-chain: winner gets potAmount - 2% house cut
  const potentialMultiplier = potAmount > 0 && entryFeeSol > 0
    ? (potAmount * 0.98) / entryFeeSol
    : null;

  const [isSpinning, setIsSpinning] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<RoundOverlayState | null>(null);
  // FIX: Track the animation queue id for the current overlay so we can mark it complete
  const [currentAnimationId, setCurrentAnimationId] = useState<string | null>(null);
  const currentAnimationIdRef = useRef<string | null>(null);
  useEffect(() => { currentAnimationIdRef.current = currentAnimationId; }, [currentAnimationId]);
  const [overlayCloseAtMs, setOverlayCloseAtMs] = useState<number | null>(null);
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  // FIX: Optimistic UI — show pending state immediately after user clicks join
  const [optimisticJoined, setOptimisticJoined] = useState(false);

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

    // Show survive/defeat overlay when a round advances within the game.
    // Case A: SSE first catches the game already in inProgress (waiting → inProgress transition).
    //         roundNow >= 2 because advance_round atomically starts + runs round 1 in one TX.
    if (inProgressNow && !prev.inProgress && roundNow >= 2) {
      const wasInRoundOne = participantsNow.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);
      if (wasInRoundOne && !aliveNow) {
        eliminatedThisGameRef.current = true;
        // Show immediate defeat card (isFinal=false: game continues for survivors)
        const animId = `round-elim-${roomId}-${roundNow}-${myKey.slice(-6)}`;
        if (animationQueue.enqueue(animId, 'eliminated', {})) {
          setCurrentAnimationId(animId);
          setShowResult({
            type: 'lose',
            title: 'ELIMINATED',
            msg: `You were eliminated in round ${roundNow - 1}. The game continues for the remaining players.`,
            isFinal: false,
            actionLabel: 'Watch',
          });
        }
      } else if (wasInRoundOne && aliveNow) {
        // Show survive card
        const animId = `round-survive-${roomId}-${roundNow}-${myKey.slice(-6)}`;
        if (animationQueue.enqueue(animId, 'survive', {})) {
          setCurrentAnimationId(animId);
          setShowResult({
            type: 'survive',
            title: 'SURVIVED!',
            msg: `Round ${roundNow - 1} cleared — ${survivorsNow.length} player${survivorsNow.length !== 1 ? 's' : ''} remain. Stay sharp!`,
            isFinal: false,
            actionLabel: 'Next Round',
          });
        }
      }
    }

    // Case B: Game was already in inProgress and round counter advanced (mid-game round).
    if (inProgressNow && prev.inProgress && roundNow > prev.round) {
      const wasAlive = prev.survivors.includes(myKey);
      const aliveNow = survivorsNow.includes(myKey);
      if (wasAlive && !aliveNow) {
        eliminatedThisGameRef.current = true;
        const animId = `round-elim-${roomId}-${roundNow}-${myKey.slice(-6)}`;
        if (animationQueue.enqueue(animId, 'eliminated', {})) {
          setCurrentAnimationId(animId);
          setShowResult({
            type: 'lose',
            title: 'ELIMINATED',
            msg: `You were eliminated in round ${prev.round}. The game continues.`,
            isFinal: false,
            actionLabel: 'Watch',
          });
        }
      } else if (wasAlive && aliveNow) {
        const animId = `round-survive-${roomId}-${roundNow}-${myKey.slice(-6)}`;
        if (animationQueue.enqueue(animId, 'survive', {})) {
          setCurrentAnimationId(animId);
          setShowResult({
            type: 'survive',
            title: 'SURVIVED!',
            msg: `Round ${prev.round} cleared — ${survivorsNow.length} player${survivorsNow.length !== 1 ? 's' : ''} remain. Stay sharp!`,
            isFinal: false,
            actionLabel: 'Next Round',
          });
        }
      }
    }

    // Case C: Game just ended (inProgress → no longer in progress).
    // Show a neutral "calculating" card for players who were in the final round.
    // The gameResult effect will replace this with VICTORY or DEFEAT within 1-3 s.
    // This guarantees the final-round loser always sees feedback even if there is
    // a network delay before the TX scan resolves.
    if (prev.inProgress && !inProgressNow) {
      const wasInFinalRound = prev.survivors.includes(myKey);
      if (wasInFinalRound) {
        setShowResult({
          type: 'survive',
          title: 'GAME OVER',
          msg: `Round ${prev.round} complete — calculating final results…`,
          isFinal: false,
          actionLabel: 'Waiting…',
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
  }, [gameState?.state, gameState?.currentRound, gameState?.survivors, gameState?.players, gameState?.playerCount, publicKey, roomId]);
  
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
    // FIX: Reset optimistic join state when result arrives
    setOptimisticJoined(false);

    if (wasInGame && isWinner) {
      // Always show VICTORY to the winner regardless of any intermediate state.
      const multiplierValue = activeRoom.lamports > 0
        ? gameResult.winnerAmount / activeRoom.lamports
        : undefined;

      const animId = `result-${resultKey}`;
      const enqueued = animationQueue.enqueue(animId, 'win', { winAmt, multiplierValue });
      if (enqueued) {
        setCurrentAnimationId(animId);
      }
      // Always overwrite whatever is showing (e.g. Case C "GAME OVER" card)
      setShowResult({
        type: 'win',
        title: 'VICTORY',
        msg: 'You won the game. Payout has been sent to your wallet.',
        amount: parseFloat(winAmt),
        multiplier: multiplierValue,
        isFinal: true,
        actionLabel: 'Close',
      });
    } else if (wasInGame && !isWinner && !eliminatedThisGameRef.current) {
      // Show DEFEAT only if the player did NOT already receive an ELIMINATED card
      // from a mid-game round transition (eliminatedThisGameRef = true).
      // This prevents mid-game eliminated players from seeing a duplicate DEFEAT.
      // Final-round losers (eliminatedThisGameRef = false) always reach this branch.
      const animId = `result-${resultKey}`;
      const enqueued = animationQueue.enqueue(animId, 'lose', {});
      if (enqueued) {
        setCurrentAnimationId(animId);
      }
      // Overwrite Case C "GAME OVER" card with the real DEFEAT card
      setShowResult({
        type: 'lose',
        title: 'DEFEAT',
        msg: `Game finished. Your bet (${activeRoom.label}) was lost.`,
        isFinal: true,
        actionLabel: 'Close',
      });
    } else if (wasInGame && !isWinner && eliminatedThisGameRef.current) {
      // Player already saw an ELIMINATED card mid-game — no duplicate needed.
      // Just clear any lingering "GAME OVER" placeholder from Case C.
      setShowResult(null);
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
      // FIX: Mark animation complete in queue so next one can play
      const animId = currentAnimationIdRef.current;
      if (animId) {
        animationQueue.complete(animId);
        setCurrentAnimationId(null);
      }
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

  // Reset eliminatedThisGameRef only when a NEW game starts (first player joins),
  // NOT when the game ends. Resetting on game-end would clear the flag for mid-game
  // eliminated players BEFORE gameResult arrives, causing a duplicate DEFEAT overlay.
  const prevPlayerCountForElimResetRef = useRef<number>(0);
  useEffect(() => {
    const playerCountNow = gameState?.playerCount ?? 0;
    if (prevPlayerCountForElimResetRef.current === 0 && playerCountNow > 0) {
      eliminatedThisGameRef.current = false;
    }
    prevPlayerCountForElimResetRef.current = playerCountNow;
  }, [gameState?.playerCount]);

  useEffect(() => {
    setShowResult(null); setIsSpinning(false); setCountdown(null);
    setOverlayCloseAtMs(null);
    setTxPending(false); setIsProcessingResult(false);
    // FIX: Reset optimistic and animation state on room change
    setOptimisticJoined(false);
    setCurrentAnimationId(null);
    animationQueue.clear();
    lastPlayersRef.current = [];
    gameResultProcessedRef.current = null;
    eliminatedThisGameRef.current = false;
    prevPlayerCountForElimResetRef.current = 0;
    // FIX: Reset round tracking refs to prevent stale transitions when switching rooms
    prevRoundSnapshotRef.current = { round: 0, survivors: [], inProgress: false };
    lastInProgressSnapshotRef.current = { round: 0, survivors: [] };
  }, [roomId]);

  const lastCrankTimeRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    if (Date.now() - lastCrankTimeRef.current < 5000) return;
    lastCrankTimeRef.current = Date.now();
    try {
      await crankRoom();
    } catch {
      // Silently ignore; the timer effect will retry when remaining stays at 0
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
      // FIX: Show a full ResultOverlay card for refund (not just a toast) so players know the game was cancelled
      setShowResult({
        type: 'survive',
        title: 'ROUND CANCELLED',
        msg: 'Not enough players joined before the timer expired. Your funds have been automatically refunded to your wallet.',
        isFinal: true,
        actionLabel: 'OK',
      });
      // Clean reset
      setIsSpinning(false);
      setCountdown(null);
      setTxPending(false);
      setOverlayCloseAtMs(null);
      setGameResult(null);
      setIsProcessingResult(false);
      setOptimisticJoined(false);
      setTimeRemaining(null);
      serverTimerValueRef.current = null;
      timerDeadlineMsRef.current = null;
      myPlayerIndexRef.current = null;
      lastPlayersRef.current = [];
      wasInGameRef.current = false;
    }
    prevPlayerCountForRefundRef.current = current;
  }, [actualPlayerCount, stableFetch, setGameResult, roomId]);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const hasNotifiedTimerStartRef = useRef<boolean>(false);
  const warnedTenSecondsRef = useRef<boolean>(false);
  const warnedFiveSecondsRef = useRef<boolean>(false);
  const lastComputedRemainingRef = useRef<number | null>(null);
  // Deadline-based sync: all clients compute from the same absolute ms timestamp
  const timerDeadlineMsRef = useRef<number | null>(null);
  // Legacy refs kept for fallback path only
  const serverTimerReceivedAtRef = useRef<number>(0);
  const serverTimerValueRef = useRef<number | null>(null);

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
      timerDeadlineMsRef.current = null;
      serverTimerValueRef.current = null;
      hasNotifiedTimerStartRef.current = false;
      warnedTenSecondsRef.current = false;
      warnedFiveSecondsRef.current = false;
      return;
    }

    // Primary path: use absolute deadline sent by server
    // All clients compute remaining = Math.ceil((deadline - Date.now()) / 1000)
    // This cancels out any per-client network latency difference
    if (serverTimerDeadlineMs !== null) {
      timerDeadlineMsRef.current = serverTimerDeadlineMs;
      const remaining = Math.max(0, Math.ceil((serverTimerDeadlineMs - Date.now()) / 1000));
      lastComputedRemainingRef.current = remaining;
      setTimeRemaining(remaining);
      if (remaining === 0) triggerCrank();
      return;
    }

    // Fallback: server sent timerRemaining but not deadline (older snapshot)
    if (serverTimerRemaining !== null) {
      const nextRemaining = Math.max(0, serverTimerRemaining);
      serverTimerValueRef.current = nextRemaining;
      serverTimerReceivedAtRef.current = Date.now();
      lastComputedRemainingRef.current = nextRemaining;
      setTimeRemaining(nextRemaining);
    } else if (gameState?.blockStartTime && serverTimerValueRef.current === null) {
      // Last resort: compute client-side from blockStartTime
      const blockStart = typeof gameState.blockStartTime === 'object' && 'toNumber' in gameState.blockStartTime
        ? gameState.blockStartTime.toNumber()
        : Number(gameState.blockStartTime);
      if (blockStart > 0) {
        const nowUnix = Math.floor(Date.now() / 1000);
        const fallback = Math.max(0, BLOCK_EXPIRATION_SECONDS - (nowUnix - blockStart));
        if (fallback > 0 && fallback <= BLOCK_EXPIRATION_SECONDS) {
          serverTimerValueRef.current = fallback;
          serverTimerReceivedAtRef.current = Date.now();
          setTimeRemaining(fallback);
        }
      }
    }

    const currentRemaining = serverTimerValueRef.current;
    if (currentRemaining !== null && currentRemaining === 0) {
      triggerCrank();
    }
  }, [serverTimerDeadlineMs, serverTimerRemaining, gameState?.blockStartTime, isWaiting, isInProgress, actualPlayerCount, triggerCrank]);

  // Local tick every 250ms: re-compute remaining from the absolute deadline for smooth display
  useEffect(() => {
    const isRoundActive = (isWaiting || isInProgress) && actualPlayerCount > 0;
    if (!isRoundActive) return;

    const interval = setInterval(() => {
      // Deadline path (primary)
      if (timerDeadlineMsRef.current !== null) {
        const remaining = Math.max(0, Math.ceil((timerDeadlineMsRef.current - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) triggerCrank();
        return;
      }
      // Legacy interpolation fallback
      const serverVal = serverTimerValueRef.current;
      const receivedAt = serverTimerReceivedAtRef.current;
      if (serverVal === null || receivedAt === 0) return;
      const elapsed = Math.floor((Date.now() - receivedAt) / 1000);
      const interpolated = Math.max(0, serverVal - elapsed);
      setTimeRemaining(interpolated);
      if (interpolated === 0) triggerCrank();
    }, 250);

    return () => clearInterval(interval);
  }, [isWaiting, isInProgress, actualPlayerCount, triggerCrank]);

  const displayTimerSeconds = useMemo(() => {
    const isRoundActive = (isWaiting || isInProgress) && actualPlayerCount > 0;
    if (!isRoundActive) return null;
    return timeRemaining;
  }, [timeRemaining, isWaiting, isInProgress, actualPlayerCount]);

  // Timer values logged in dev only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && actualPlayerCount > 0) {
      console.warn('[Timer Debug]', { serverTimerRemaining, timeRemaining, displayTimerSeconds, actualPlayerCount, isWaiting, isInProgress });
    }
  }, [serverTimerRemaining, timeRemaining, displayTimerSeconds, actualPlayerCount, isWaiting, isInProgress]);

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
      // FIX: Use notificationManager for deduplication and anti-spam
      notificationManager.notifyPromise(
        `init-${roomId}`,
        txPromise,
        {
          loading: 'Initializing room...',
          success: 'Room initialized!',
          error: (e: any) => `Failed: ${e.message}`,
        }
      );
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
      // FIX: Optimistic UI — show joined state immediately before tx confirms
      setOptimisticJoined(true);
      
      // If room doesn't exist yet, initialize it first
      if (!gameState) {
        notificationManager.notify(`init-room-${roomId}`, 'info', 'Initializing room...', 3000);
        await initializeRoom(activeRoom.lamports);
      }
      
      const txPromise = joinGame(activeRoom.lamports);
      // FIX: Use notificationManager for deduplication and anti-spam
      notificationManager.notifyPromise(
        `join-${roomId}-${publicKey?.toString()}`,
        txPromise,
        { loading: 'Entering round...', success: 'Entered round successfully!', error: (e: any) => `Failed: ${e.message}` }
      );
      await txPromise;
    } catch (e) {
      // FIX: Rollback optimistic state on error
      setOptimisticJoined(false);
    } finally {
      setTxPending(false);
    }
  };

  const handleSecureGain = async () => {
    if (!publicKey) return;
    try {
      setTxPending(true);
      const txPromise = secureGain();
      // FIX: Use notificationManager for deduplication and anti-spam
      notificationManager.notifyPromise(
        `secure-${roomId}-${publicKey?.toString()}`,
        txPromise,
        { loading: 'Securing gain...', success: 'Gain secured! You received 2x your entry.', error: (e: any) => `Failed: ${e.message}` }
      );
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
      {/* FIX: Toaster maxVisible set to 3 to prevent notification spam */}
      <Toaster position="top-center" theme="dark" visibleToasts={3} />

      {/* FIX: Connection status indicator — only show after we've lost a previously working connection */}
      {connectionStatus === 'reconnecting' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full bg-yellow-900/90 border border-yellow-500/50 backdrop-blur-lg flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
            Reconnecting...
          </span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#9945FF]/15 bg-gradient-to-b from-[#050510]/97 to-black/95 backdrop-blur-3xl shadow-[0_1px_0_0_rgba(153,69,255,0.08)]">
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
            {/* FIX: Live Badge — always show Live (SSE auto-reconnects), only warn on explicit reconnecting */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-full ${
              connectionStatus === 'reconnecting'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-[#00FFA3]/10 border-[#00FFA3]/30'
            }`}>
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'reconnecting'
                    ? 'bg-yellow-400 shadow-[0_0_8px_#EAB308]'
                    : 'bg-[#00FFA3] shadow-[0_0_8px_#00FFA3]'
                }`} />
                {connectionStatus !== 'reconnecting' && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
                )}
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${
                connectionStatus === 'reconnecting'
                  ? 'text-yellow-400'
                  : 'text-[#00FFA3]'
              }`}>{connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Live'}</span>
            </div>
            <WalletMultiButton />
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-10 sm:pt-14 lg:pt-18 pb-4 sm:pb-6">
        <div className="text-center">
          {/* Category pill */}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00FFA3]/25 bg-[#00FFA3]/6 mb-5 sm:mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[0.65rem] sm:text-xs font-black uppercase tracking-[0.18em] text-[#00FFA3]">
              Provably Fair · Fully On-Chain · Solana
            </span>
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter mb-4 sm:mb-5 leading-[0.92]"
          >
            <span className="text-white">MEV</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] via-[#03E1FF] to-[#DC1FFF] px-3">
              Wars
            </span>
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-400 font-medium max-w-xl mx-auto mb-8 sm:mb-10 px-4 leading-relaxed"
          >
            Minimum 2 players. One final winner.{" "}
            <span className="text-zinc-200 font-semibold">Instant payouts, provably fair.</span>
          </motion.p>

          {/* Social Proof Bar */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 lg:gap-8"
          >
            {[
              { icon: <ShieldCheck className="w-4 h-4" />, text: "100% On-chain", color: "text-[#00FFA3]", glow: "shadow-[0_0_12px_rgba(0,255,163,0.3)]" },
              { icon: <Zap className="w-4 h-4" />, text: "Provably Fair", color: "text-[#03E1FF]", glow: "shadow-[0_0_12px_rgba(3,225,255,0.3)]" },
              { icon: <Clock className="w-4 h-4" />, text: "Instant Payouts", color: "text-[#DC1FFF]", glow: "shadow-[0_0_12px_rgba(220,31,255,0.3)]" },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/4 ${item.color}`}>
                {item.icon}
                <span className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-widest">{item.text}</span>
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
              <div className="glass-card card-green p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[0.65rem] sm:text-xs text-zinc-500 uppercase font-bold tracking-wider">Room</p>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#00FFA3]/10 border border-[#00FFA3]/25 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
                    <span className="text-[0.55rem] font-black uppercase text-[#00FFA3] tracking-widest">Live</span>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tabular-nums">#{roomId}</p>
                <p className="text-xs sm:text-sm text-[#00FFA3] font-bold mt-0.5">{activeRoom.label}</p>
              </div>

              {/* Pool */}
              <div className="glass-card card-blue p-3 sm:p-4 text-center">
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Prize Pool</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tabular-nums">{potAmount.toFixed(3)}</p>
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 font-semibold mt-0.5">SOL</p>
              </div>
              
              {/* Players */}
              <div className="glass-card card-purple p-3 sm:p-4 text-center">
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Players</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tabular-nums">{isInProgress ? survivors.length : actualPlayerCount}</p>
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 font-semibold mt-0.5">1 winner</p>
              </div>
              
              {/* Potential Multiplier */}
              <div className="glass-card p-3 sm:p-4 text-center bg-gradient-to-br from-[#00FFA3]/5 to-[#DC1FFF]/5 border-[#00FFA3]/25">
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1.5">Multiplier</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#DC1FFF] tabular-nums">
                  {potentialMultiplier !== null ? `x${potentialMultiplier.toFixed(2)}` : "--"}
                </p>
                <p className="text-[0.65rem] sm:text-xs text-zinc-500 font-semibold mt-0.5">if you win</p>
              </div>
            </div>

            {/* Main Game Container */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-3 sm:gap-4">
              
              {/* Game Arena */}
              <div className="glass-card p-3 sm:p-4 lg:p-6">
                
                {/* Mining Block Container - Dynamic Size */}
                <div className="relative w-full flex items-center justify-center">
                  <div 
                    className="relative aspect-square"
                    style={{ 
                      width: `${miningBlockSize}px`,
                      maxWidth: '100%'
                    }}
                  >
                    {/* FIX: Countdown Timer centered ON TOP of MiningBlock as overlay */}
                    <AnimatePresence>
                      {displayTimerSeconds !== null && displayTimerSeconds > 0 && (
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
                    {ROOMS.map(room => {
                      const isCurrentRoom = roomId === room.id;
                      const hasJoinedAnyRoom = hasJoinedCurrentGame || optimisticJoined;
                      const isLocked = hasJoinedAnyRoom && !isCurrentRoom;
                      return (
                        <button
                          key={room.id}
                          onClick={() => !isLocked && setRoomId(room.id)}
                          disabled={isLocked}
                          className={`w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl font-bold text-sm transition-all border ${
                            isCurrentRoom
                              ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/15 text-white border-[#9945FF]/50 shadow-[0_0_18px_rgba(153,69,255,0.25)]'
                              : isLocked
                                ? 'bg-white/2 text-zinc-600 border-white/5 cursor-not-allowed'
                                : 'bg-white/4 text-zinc-300 hover:bg-white/8 hover:text-white border-white/8 hover:border-white/18'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isCurrentRoom ? 'bg-[#9945FF]/30 text-[#14F195]' : 'bg-white/5 text-zinc-500'
                            }`}>{getRoomIcon(room.iconName)}</span>
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wide">{room.label}</span>
                          </span>
                          {isCurrentRoom && (
                            <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#14F195] bg-[#14F195]/10 px-2 py-0.5 rounded-full border border-[#14F195]/25">Selected</span>
                          )}
                          {isLocked && (
                            <span className="text-[0.6rem] text-zinc-600">🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Action Area */}
                <div className="flex-1 flex flex-col justify-end gap-2 sm:gap-3">
                  {!connected ? (
                    <div className="text-center p-3 sm:p-4 border-2 border-dashed border-zinc-700 rounded-xl">
                      <p className="text-[0.65rem] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider">Connect Your Wallet</p>
                      <p className="text-[0.6rem] sm:text-[0.65rem] text-zinc-600 mt-1">Use the button in the header</p>
                    </div>
                  ) : (hasJoinedCurrentGame || optimisticJoined) && isCurrentPlayerAlive ? (
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-[#00FFA3]/10 to-[#03E1FF]/10 border-2 border-[#00FFA3]/40 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFA3]" />
                        <p className="text-base sm:text-lg font-black text-[#00FFA3]">You&apos;re In!</p>
                      </div>
                      <p className="text-center text-xs sm:text-sm text-zinc-400">Position #{((displayPlayerIndex ?? myPlayerIndex) ?? 0) + 1}</p>
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

      {/* FIX: Result Overlay — keyed by animation id for clean re-mount on new results */}
      <AnimatePresence>
        {showResult && (
          <ResultOverlay
            key={currentAnimationId ?? 'overlay'}
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
              // FIX: Mark animation complete on manual close
              if (currentAnimationId) {
                animationQueue.complete(currentAnimationId);
                setCurrentAnimationId(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}


