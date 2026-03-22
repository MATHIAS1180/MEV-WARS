"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Loader2, Zap, Trophy, Skull, Clock, Info, ShieldCheck, Coins, HelpCircle } from "lucide-react";
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

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [roomId, setRoomId] = useState<number>(101);
  const { gameState, fetchState, joinGame, withdraw, refundIdle, gameResult, setGameResult, isScanningLogs } = useGame(roomId);

  const activeRoom = useMemo(() => ROOMS.find(r => r.id === roomId)!, [roomId]);
  const isWaiting = !gameState || (typeof gameState.state === 'object' && 'waiting' in gameState.state);
  const potAmount = gameState?.potAmount ? (gameState.potAmount.toNumber() / 1e9) : 0;

  // ─── UI State ────────────────────────────────────────────────────────────
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [txPending, setTxPending] = useState(false);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [spinTarget, setSpinTarget] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<{ type: 'win' | 'lose', msg: string, amount?: number } | null>(null);
  const [showMyColor, setShowMyColor] = useState(false);
  // Frozen pot/winner for display during animation (so it doesn't disappear when chain resets)
  const [frozenDisplay, setFrozenDisplay] = useState<{ pot: number; winner: number } | null>(null);

  const actualPlayerCount = gameState?.playerCount ?? 0;

  // Derive myPlayerIndex directly from on-chain state — auto-clears as soon as game resets
  const myPlayerIndex = useMemo(() => {
    if (!gameState?.players || !publicKey) return null;
    const idx = (gameState.players as any[]).findIndex(
      (p: any) => p.toString() === publicKey.toString()
    );
    return idx >= 0 ? idx : null;
  }, [gameState?.players, publicKey]);

  // Lock display at 3 while animation plays (and while waiting for RPC) so bullets stay visible
  const playerCount = (isSpinning || countdown !== null || isWaitingForResult) ? 3 : actualPlayerCount;

  // ── Stable fetchState ref so its identity NEVER invalidates effect deps ───
  // This prevents the gameResult useEffect cleanup from firing mid-animation
  // when the wallet adapter briefly reinitializes after a TX is confirmed.
  const fetchStateRef = useRef(fetchState);
  useEffect(() => { fetchStateRef.current = fetchState; }, [fetchState]);
  const stableFetch = useCallback(() => fetchStateRef.current(), []);

  // Dummy effect deleted — rotation is now explicitly targeted to the winner

  // Snapshot of who was in the game (uses actualPlayerCount, not display override)
  const lastPlayersRef = useRef<string[]>([]);
  useEffect(() => {
    if (actualPlayerCount > 0 && gameState?.players) {
      const real = (gameState.players as any[])
        .filter((p: any) => p.toString() !== PublicKey.default.toString())
        .map((p: any) => p.toString());
      if (real.length > 0) lastPlayersRef.current = real;
    }
  }, [gameState?.players, actualPlayerCount]);

  // My Color Notification (index now derived, only need the toast)
  const prevMyIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (myPlayerIndex !== null && myPlayerIndex !== prevMyIndexRef.current) {
      setShowMyColor(true);
      setTimeout(() => setShowMyColor(false), 6000);
    }
    prevMyIndexRef.current = myPlayerIndex;
  }, [myPlayerIndex]);

  // ─── RESULT HANDLER — stable dependency list ──────────────────────────────
  // Uses stableFetch (stable identity) so the wallet adapter restarting
  // mid-animation does NOT trigger the cleanup and kill the timers.
  useEffect(() => {
    if (!gameResult) return;

    const frozenPlayers = [...lastPlayersRef.current];
    const frozenResult = { ...gameResult }; // snapshot, won't change
    console.log('[gameResult] spin start. players:', frozenPlayers, 'winner:', frozenResult.winner);

    // Freeze pot display so it doesn't vanish when chain resets
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

        // Sync the physical wheel resting position to exactly match the smart contract!
        const wndx = frozenResult.winnerIndex ?? 0;
        const finalAngle = 360 - CHAMBER_ANGLES[wndx];
        setRotation(360 * 5 + finalAngle); // 5 rapid spins + land on winner

        setIsSpinning(true);

        timeoutId = setTimeout(() => {
          setIsSpinning(false);

          const myKey = publicKey?.toString() ?? '';
          const wasInGame = frozenPlayers.includes(myKey);
          const isWinner = frozenResult.winner === myKey;
          const winAmt = (frozenResult.winnerAmount / 1e9).toFixed(4);

          if (wasInGame && isWinner) {
            setShowResult({ type: 'win', msg: `VICTORY! ${winAmt} SOL sent to your wallet.`, amount: parseFloat(winAmt) });
          } else if (wasInGame && !isWinner) {
            setShowResult({ type: 'lose', msg: "BANG! You've been eliminated." });
          }

          setGameResult(null);
          lastPlayersRef.current = [];
          setTimeout(() => { 
            setFrozenDisplay(null); 
            setRotation(0); // Reset the wheel to neutral top position
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
  }, [gameResult, publicKey, setGameResult, stableFetch]); // stableFetch never changes identity

  // ─── Polling replaced by pure WebSocket ──────────────────────────────────
  // We rely entirely on the real-time `onAccountChange` from useGame to update 
  // gameState. Regular HTTP polling can hit RPC caches and overwrite the fresh
  // WebSocket state with old values.

  // ─── Room change: reset all local UI state ───────────────────────────────
  useEffect(() => {
    setShowResult(null);
    setIsSpinning(false);
    setIsWaitingForResult(false);
    setSpinTarget(0);
    setCountdown(null);
    setFrozenDisplay(null);
    setTxPending(false);
    lastPlayersRef.current = [];
  }, [roomId]);

  // ─── Auto-Crank for 2-Step Resolution ─────────────────────────────────────
  // When the game enters ResolvingShot mode, trigger the backend bot to settle it
  const lastCrankTimeRef = useRef(0);
  const triggerCrank = useCallback(async () => {
    // 10s lockout to avoid duplicate crank calls (race conditions on state updates)
    if (Date.now() - lastCrankTimeRef.current < 10000) return;
    lastCrankTimeRef.current = Date.now();

    try {
      console.log('Game is resolving, triggering backend crank...');
      const res = await fetch('/api/crank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });

      // Defensively parse JSON — Vercel may return HTML on cold-start errors or deploys
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // If the response isn't JSON (e.g. HTML error page), treat as transient — don't shout at the user
        if (res.ok) {
          console.log('[crank] Response was not JSON but status is OK, ignoring.');
        } else {
          console.warn(`[crank] Non-JSON response with status ${res.status} — likely transient (deployment restart). Ignoring.`);
        }
        return;
      }

      if (!res.ok) {
        // "Game not ready" just means the state already changed — totally normal race condition
        if (data.error?.includes('not ready')) {
          console.log('[crank] Game already resolved or not yet ready, nothing to do.');
        } else {
          console.error('[crank] Backend error:', data);
          toast.error(`Auto-resolve failed: ${data.error || 'Unknown error'}`);
        }
      } else {
        console.log('[crank] settle_winner confirmed:', data.signature);
      }
    } catch (err: any) {
      // Only real network failures (no internet, DNS, etc.) land here
      console.error('[crank] Fetch failed:', err);
    }
  }, [roomId]);

  useEffect(() => {
    const isResolving = (typeof gameState?.state === 'string' && gameState.state.toLowerCase() === 'awaitingresolution') || 
                        (gameState?.state && typeof gameState.state === 'object' && 'awaitingResolution' in gameState.state);

    if (gameState?.playerCount === 3 && isResolving && !txPending) {
      triggerCrank();
    }
  }, [gameState?.state, gameState?.playerCount, txPending, triggerCrank]);
  
  // ─── RPC Status Hook ───────────────────────────────────────────────────────
  // If useGame is aggressively scanning the blockchain for logs, lock the UI.
  // If the game is on-chain locked in ResolvingShot state, lock the UI.
  useEffect(() => {
    const isResolvingOnChain = (typeof gameState?.state === 'string' && gameState.state.toLowerCase() === 'awaitingresolution') || 
                               (gameState?.state && typeof gameState.state === 'object' && 'awaitingResolution' in gameState.state);

    if (isScanningLogs || isResolvingOnChain) {
      setIsWaitingForResult(true);
    } else if (!gameResult) {
      setIsWaitingForResult(false);
    }
  }, [isScanningLogs, gameResult, gameState?.state]);

  // ─── Watchdog: hard reset if UI is stuck and chain shows 0 players ────────
  // Fires after 15s to catch any permanent lockups (like RPC log scan failures)
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (actualPlayerCount === 0 && !gameResult && (isSpinning || countdown !== null || frozenDisplay || isWaitingForResult)) {
      watchdogRef.current = setTimeout(() => {
        setIsSpinning(false);
        setCountdown(null);
        setTxPending(false);
        setFrozenDisplay(null);
        setIsWaitingForResult(false); // CRITICAL FIX: guarantee lock releases
        // Do NOT blindly clear lastPlayersRef here, or we will erase notification entitlement if the RPC was just lagging heavily!
        console.log('[watchdog] actualPlayerCount is 0, hard reset fired to unstick UI');
        stableFetch();
      }, 15000);
    } else {
      if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    }
    return () => { if (watchdogRef.current) clearTimeout(watchdogRef.current); };
  }, [actualPlayerCount, gameResult, isSpinning, countdown, frozenDisplay, isWaitingForResult, stableFetch]);

  // Second Watchdog: if the RPC gave us a stale state with 3 players, force a sync
  useEffect(() => {
    if (actualPlayerCount >= 3 && !isSpinning && !gameResult && countdown === null) {
      console.log('[watchdog] UI stuck at 3 players with no animation running, forcing chain sync...');
      const fallbackId = setTimeout(() => {
         stableFetch();
      }, 2000);
      return () => clearTimeout(fallbackId);
    }
  }, [actualPlayerCount, isSpinning, gameResult, countdown, stableFetch]);



  // ─── Join Handler ─────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!publicKey) return;
    const myKey = publicKey.toString();
    // Register our key in the snapshot BEFORE the tx completes
    if (!lastPlayersRef.current.includes(myKey)) lastPlayersRef.current.push(myKey);

    try {
      setTxPending(true);
      const txPromise = joinGame(activeRoom.lamports);
      toast.promise(txPromise, {
        loading: 'Signing transaction...',
        success: 'Welcome to the room!',
        error: (e: any) => `Failed: ${e.message}`,
      });
      const txResult = await txPromise;
      
      // If we are the 3rd player, the transaction settled the game.
      // Start the Resolving spinner immediately! The websocket will discover
      // the result log and trigger the actual setGameResult soon.
      if (txResult === true) {
        setIsWaitingForResult(true);
      }
    } catch (e) { console.error(e); }
    finally { setTxPending(false); }
  };

  const handleRefundIdle = async () => {
    try {
      setTxPending(true);
      const promise = refundIdle().then(() => fetchState());
      toast.promise(promise, {
        loading: 'Processing refund...',
        success: 'Refund claimed successfully!',
        error: (err) => `Failed: ${err.message}`,
      });
      await promise;
    } catch (e) { console.error(e); }
    finally { setTxPending(false); }
  };

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (gameState && isWaiting && playerCount > 0) {
      const iv = setInterval(() => {
        const last = gameState.lastActivityTime ? Number(gameState.lastActivityTime.toString()) : Date.now() / 1000;
        const r = 60 - (Math.floor(Date.now() / 1000) - last);
        setTimeRemaining(r > 0 ? r : 0);
      }, 1000);
      return () => clearInterval(iv);
    }
    setTimeRemaining(null);
  }, [gameState, isWaiting, playerCount]);

  return (
    <main className="min-h-screen relative flex flex-col items-center overflow-x-hidden">
      {/* Animated Solana Orbs Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#9945FF]/30 rounded-full blur-[120px] animate-blob border border-white/5" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#14F195]/20 rounded-full blur-[140px] animate-blob animation-delay-2000 border border-white/5" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-[#00C2FF]/20 rounded-full blur-[150px] animate-blob animation-delay-4000 border border-white/5" />
      </div>

      <div className="cyber-grid" />
      <div className="scanlines" />
      <Toaster position="top-center" theme="dark" />

      {/* Hero Section */}
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
              <span className="hidden xs:inline sm:inline">{room.label}</span>
              <span className="xs:hidden sm:hidden">{room.label}</span>
            </button>
          ))}
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 w-full items-center">
          
          {/* Stats Left — shown as 2-col row on mobile, column on desktop */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Live Players</p>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl font-black neon-text-purple">{playerCount}</span>
                <span className="text-zinc-700 text-lg sm:text-xl font-bold mb-0.5">/ 3</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${i < playerCount ? 'bg-current' : 'bg-white/5'}`} style={{ color: i < playerCount ? BULLET_COLORS[i].color : 'inherit' }} />
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Room Multiplier</p>
              <p className="text-2xl sm:text-3xl font-black neon-text-cyan">2.7x <span className="text-xs sm:text-sm font-bold opacity-50">Win</span></p>
            </motion.div>
          </div>

          {/* Center Barrel */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center order-first lg:order-none">
            <div className="relative group">
              {/* Atmospheric glow — scales with barrel */}
              <div className="absolute inset-0 rounded-full scale-150 pointer-events-none"
                   style={{ background: "radial-gradient(circle, rgba(153,69,255,0.15) 0%, rgba(20,241,149,0.06) 60%, transparent 80%)", filter: "blur(30px)", animation: "pulse 4s ease-in-out infinite" }} />
              
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <span className="text-[5rem] sm:text-[8rem] lg:text-[10rem] font-black text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.9)] leading-none">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <RouletteBarrel
                playerCount={playerCount}
                isSpinning={isSpinning}
                rotation={rotation}
                countdown={countdown}
              />
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
                    <span className="text-sm sm:text-base">{isSpinning ? "SPINNING..." : isWaitingForResult ? "RESOLVING..." : "PREPARING..."}</span>
                  </motion.div>
                ) : myPlayerIndex !== null ? (
                  <motion.div key="ingame" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-3 w-full">
                    <div className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center text-center">
                      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-1.5">You are in the chamber</p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-lg" style={{ backgroundColor: BULLET_COLORS[myPlayerIndex].color, boxShadow: `0 0 15px ${BULLET_COLORS[myPlayerIndex].color}` }} />
                        <span className="text-white font-black tracking-wider uppercase text-base sm:text-lg">{BULLET_COLORS[myPlayerIndex].name}</span>
                      </div>
                    </div>
                    {playerCount < 3 && <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for victims ({playerCount}/3)...</p>}
                  </motion.div>
                ) : (
                  <motion.button
                    key="play"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    onClick={handleJoin} disabled={txPending || playerCount >= 3}
                    className="btn-solana w-full py-4 sm:py-5 lg:py-6 text-base sm:text-lg lg:text-xl shadow-[0_0_40px_rgba(153,69,255,0.4)] disabled:opacity-50"
                  >
                    {txPending ? <Loader2 className="animate-spin mx-auto w-7 h-7" /> : `PLAY NOW — ${activeRoom.label}`}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Right — shown as 2-col row on mobile, column on desktop */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 sm:p-6">
              <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest mb-1 uppercase">Total Pot</p>
              <p className="text-3xl sm:text-4xl font-black neon-text-cyan">{potAmount.toFixed(3)} <span className="text-xs sm:text-sm font-bold opacity-50">SOL</span></p>
              <div className="mt-1.5 text-[9px] sm:text-[10px] text-zinc-600 font-bold tracking-widest">→ Winner: {(potAmount * 0.9).toFixed(3)} SOL</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
                <p className="text-[10px] sm:text-xs font-black text-zinc-500 tracking-widest uppercase">Refund Timer</p>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{timeRemaining !== null ? `${Math.floor(timeRemaining/60)}:${(timeRemaining%60).toString().padStart(2,'0')}` : '--:--'}</p>
              {timeRemaining === 0 && myPlayerIndex !== null && (
                <button onClick={handleRefundIdle} className="mt-2 sm:mt-3 w-full py-2 bg-red-500/10 border border-red-500 text-red-500 text-[9px] sm:text-[10px] font-black uppercase rounded-lg animate-pulse">Claim Refund Now</button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Game Info & Rules Section */}
      <section className="w-full max-w-6xl px-6 py-24 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9945FF]/5 to-transparent pointer-events-none" />
        
        <div className="text-center mb-20 relative animate-float">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4"
          >
            Decidedly <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">Unfair</span> Games
          </motion.h2>
          <p className="text-zinc-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
            High stakes, fast action. Enter the chamber, load your bullet, and let fate decide. Winner takes all (almost).
          </p>
        </div>

        {/* Step-by-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative">
          <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#9945FF]/10 via-[#14F195]/40 to-[#9945FF]/10 -translate-y-1/2 -z-10" />
          
          {[
            { step: "01", title: "Join a Room", desc: "Select your stake (0.01, 0.1, or 1.0 SOL) and commit your funds to the smart contract.", icon: <Coins className="w-8 h-8 text-[#9945FF]" /> },
            { step: "02", title: "Wait for Players", desc: "The chamber holds 3 bullets. The game begins automatically once 3 players join.", icon: <Clock className="w-8 h-8 text-white" /> },
            { step: "03", title: "The Spin", desc: "One bullet fires. The winner is selected completely at random on-chain and takes 90% of the pot.", icon: <Zap className="w-8 h-8 text-[#14F195]" /> },
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

        {/* Mechanics & Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#14F195]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#14F195]/10 transition-colors duration-700" />
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-[#14F195]" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Provably Fair</h3>
             </div>
             <p className="text-zinc-400 text-base leading-relaxed mb-4 font-medium">
                Our smart contract is designed with transparency and fairness at its core. We utilize Solana's on-chain data (slot hashes and timestamps) to generate unpredictable randomness. 
             </p>
             <p className="text-zinc-400 text-base leading-relaxed font-medium">
                No central server or authority can influence the spin. The moment the third player joins, the transaction itself seals the fate of all participants. You can verify every game on the Solana Explorer.
             </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#9945FF]/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#9945FF]/10 transition-colors duration-700" />
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-lg">
                  <Info className="w-6 h-6 text-[#9945FF]" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Strict Rules</h3>
             </div>
             <ul className="space-y-5">
               {[
                 { label: "1 Bullet Per Player", desc: "Exactly 3 players per room, one bullet each." },
                 { label: "Winner Takes 90%", desc: "The sole survivor automatically receives 90% of the total pot airdropped to their wallet." },
                 { label: "10% House Edge", desc: "A 10% fee goes to the casino treasury for ongoing development and marketing." },
                 { label: "Anti-Stuck Refund", desc: "If a room doesn't fill up within 60 seconds of inactivity, players can withdraw their SOL." }
               ].map((rule, idx) => (
                 <li key={idx} className="flex gap-4 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] mt-2 shrink-0 shadow-[0_0_10px_rgba(20,241,149,0.8)]" />
                    <div>
                      <strong className="text-white block text-sm uppercase tracking-wider mb-1">{rule.label}</strong>
                      <span className="text-zinc-500 text-sm font-medium">{rule.desc}</span>
                    </div>
                 </li>
               ))}
             </ul>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 flex flex-col items-center gap-6 bg-black/10">
        <a 
          href="https://explorer.solana.com/address/88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd?cluster=devnet" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-bold text-zinc-600 hover:text-[#14F195] transition-all uppercase tracking-[0.2em] flex items-center gap-2 group px-6 py-2 border border-white/5 rounded-full hover:border-[#14F195]/30 hover:bg-[#14F195]/5"
        >
          <ShieldCheck className="w-4 h-4 text-zinc-700 group-hover:text-[#14F195] transition-colors" />
          <span>Smart Contract Verified</span>
        </a>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.6em]">Trigger.Sol</p>
          <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-[0.2em]">© 2026 All Rights Reserved • Built for Degens on Solana</p>
        </div>
      </footer>

      {/* Winner Notification Popup */}
      <AnimatePresence>
        {showResult && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: showResult.type === 'win' ? -50 : 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
              transition={{ type: "spring", bounce: 0.5 }}
              className={`max-w-md w-full p-12 text-center rounded-3xl relative overflow-hidden ${
                showResult.type === 'win' 
                  ? 'bg-gradient-to-b from-[#14F195]/20 to-black border-2 border-[#14F195]/50 shadow-[0_0_80px_rgba(20,241,149,0.3)]' 
                  : showResult.type === 'lose' 
                  ? 'bg-gradient-to-b from-[#9945FF]/20 to-black border-2 border-[#9945FF]/50 shadow-[0_0_80px_rgba(153,69,255,0.3)]'
                  : 'glass-card border-2 border-white/10'
              }`}
            >
              {showResult.type === 'win' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#14F195]/40 blur-[50px] pointer-events-none" />}
              {showResult.type === 'lose' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#9945FF]/40 blur-[50px] pointer-events-none" />}

              <div className="relative z-10">
                {showResult.type === 'win' && (
                  <>
                    <Trophy className="w-24 h-24 text-[#14F195] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(20,241,149,0.8)] animate-bounce" />
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#14F195]">YOU SURVIVED</h2>
                    <p className="text-[#14F195] font-bold tracking-widest uppercase text-xs mb-8">The chamber spared you.</p>
                  </>
                )}

                {showResult.type === 'lose' && (
                  <>
                    <Skull className="w-24 h-24 text-[#9945FF] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(153,69,255,0.8)] animate-pulse" />
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-[#9945FF]">WASTED</h2>
                    <p className="text-[#9945FF] font-bold tracking-widest uppercase text-xs mb-8">Your luck ran out.</p>
                  </>
                )}


                <p className="text-zinc-300 font-medium mb-10 text-lg leading-relaxed">{showResult.msg}</p>
                
                {showResult.amount && showResult.type === 'win' && (
                   <div className="bg-black/50 p-6 rounded-2xl border border-[#14F195]/30 mb-8 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#14F195]/10 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                      <p className="text-xs text-[#14F195] uppercase font-black tracking-widest mb-1">Spoils of War</p>
                      <p className="text-5xl font-black text-white drop-shadow-lg">+{showResult.amount} SOL</p>
                   </div>
                )}

                <button 
                  onClick={() => setShowResult(null)} 
                  className={`w-full py-5 text-lg font-black uppercase tracking-widest rounded-xl transition-all ${
                    showResult.type === 'win' 
                      ? 'bg-[#14F195] text-black hover:bg-white hover:shadow-[0_0_30px_rgba(20,241,149,0.5)]' 
                      : showResult.type === 'lose'
                      ? 'bg-[#9945FF] text-white hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(153,69,255,0.5)]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {showResult.type === 'win' ? 'Claim Glory' : showResult.type === 'lose' ? 'Accept Fate' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
