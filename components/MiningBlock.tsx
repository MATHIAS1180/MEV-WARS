"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import styles from './MiningBlock.module.css';

// Solana official colors - one for each of the 30 squares
const SOLANA_COLORS = [
  "#DC1FFF", // Purple Dino
  "#03E1FF", // Ocean Blue  
  "#00FFA3", // Surge Green
  "#9945FF", // Violet
  "#14F195", // Solana Green
  "#00C2FF", // Cyan
  "#FF6B9D", // Pink
  "#FFB84D", // Orange
  "#A855F7", // Purple
  "#10B981", // Emerald
  "#06B6D4", // Sky
  "#EC4899", // Rose
  "#F59E0B", // Amber
  "#8B5CF6", // Indigo
  "#34D399", // Mint
  "#22D3EE", // Electric
  "#F472B6", // Candy
  "#FBBF24", // Gold
  "#7C3AED", // Deep
  "#6EE7B7", // Pastel
  "#67E8F9", // Azure
  "#FDA4AF", // Blush
  "#FCD34D", // Lemon
  "#6D28D9", // Royal
  "#059669", // Forest
  "#0891B2", // Ocean
  "#BE185D", // Magenta
  "#D97706", // Sunset
  "#5B21B6", // Ultra
  "#047857", // Jade
];

interface Props {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
}

// 30 squares arranged in a 5x6 grid
const SQUARES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  row: Math.floor(i / 6),
  col: i % 6,
  color: SOLANA_COLORS[i],
}));

export default function MiningBlock({ playerCount, isSpinning, countdown }: Props) {
  const isActive = isSpinning || countdown !== null;
  const [performanceMode, setPerformanceMode] = useState(true);
  
  // Memoize slots to prevent re-renders
  const memoizedSquares = useMemo(() => SQUARES, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePerformanceMode = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowCpu = (nav.hardwareConcurrency ?? 8) <= 8;
      const lowMemory = (nav.deviceMemory ?? 8) <= 8;
      const smallViewport = window.innerWidth < 1536;
      setPerformanceMode(media.matches || lowCpu || lowMemory || smallViewport);
    };

    updatePerformanceMode();
    window.addEventListener('resize', updatePerformanceMode);
    media.addEventListener('change', updatePerformanceMode);

    return () => {
      window.removeEventListener('resize', updatePerformanceMode);
      media.removeEventListener('change', updatePerformanceMode);
    };
  }, []);
  
  // Solana gradient colors for various elements
  const SURGE_GREEN = "#00FFA3";
  const OCEAN_BLUE = "#03E1FF";
  const PURPLE_DINO = "#DC1FFF";

  return (
    <div className={styles.miningBlockWrapper}>
      {/* Ambient glow */}
      <div className="absolute pointer-events-none" style={{
        inset: -100,
        background: isActive
          ? `radial-gradient(ellipse, ${PURPLE_DINO}45 0%, ${OCEAN_BLUE}30 40%, transparent 75%)`
          : `radial-gradient(ellipse, ${PURPLE_DINO}20 0%, ${OCEAN_BLUE}15 40%, transparent 75%)`,
        filter: performanceMode ? "blur(36px)" : "blur(60px)",
        transition: "background 1s ease",
        willChange: "background",
        transform: "translate3d(0, 0, 0)",
      }} />

      {/* Countdown rings */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <div key={`rings-${countdown}`} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ willChange: "contents" }}>
            {[...Array(performanceMode ? 1 : 2)].map((_, i) => {
              const rc = countdown === 1 ? "#FF6B9D" : countdown === 2 ? "#FFB84D" : SURGE_GREEN;
              return (
                <motion.div key={i} className="absolute"
                  initial={{ scale: 0.4, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ willChange: "transform, opacity" }}>
                  <div className="w-[450px] h-[450px] rounded-full border-2" style={{ borderColor: rc, transform: "translate3d(0, 0, 0)" }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 && (
          <motion.div key={`cd-${countdown}`} className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
            <div className="font-black leading-none select-none" style={{
              fontSize: 150,
              background: countdown === 1 ? "linear-gradient(135deg,#FF6B9D,#EC4899)"
                : countdown === 2 ? "linear-gradient(135deg,#FFB84D,#F59E0B)"
                : `linear-gradient(135deg,${SURGE_GREEN},${OCEAN_BLUE})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 50px currentColor)",
            }}>{countdown}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg className={styles.miningBlockSvg} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Solana gradient for border */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PURPLE_DINO}>
              {isActive && !performanceMode && <animate attributeName="stop-color" values={`${PURPLE_DINO};${OCEAN_BLUE};${SURGE_GREEN};${PURPLE_DINO}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="50%" stopColor={OCEAN_BLUE}>
              {isActive && !performanceMode && <animate attributeName="stop-color" values={`${OCEAN_BLUE};${SURGE_GREEN};${PURPLE_DINO};${OCEAN_BLUE}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="100%" stopColor={SURGE_GREEN}>
              {isActive && !performanceMode && <animate attributeName="stop-color" values={`${SURGE_GREEN};${PURPLE_DINO};${OCEAN_BLUE};${SURGE_GREEN}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2.5 0" in="blur"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
            <feOffset dx="0" dy="15" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner shadow for depth */}
          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.5"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="topHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Main block with shadow and depth */}
        <g filter={performanceMode ? undefined : "url(#shadow)"}>
          {/* Outer glow ring */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="none"
            stroke={isActive ? "url(#borderGrad)" : PURPLE_DINO}
            strokeWidth="2"
            rx="24"
            opacity={isActive ? "0.4" : "0.2"}
            style={{ filter: "blur(20px)" }}
          />

          {/* Background with gradient */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="url(#blockBg)"
            rx="24"
          />
          
          <linearGradient id="blockBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(35,35,55,0.95)" />
            <stop offset="100%" stopColor="rgba(25,25,45,0.95)" />
          </linearGradient>

          {/* Inner border with gradient */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="none"
            stroke={isActive ? "url(#borderGrad)" : "rgba(100,100,150,0.3)"}
            strokeWidth="2"
            rx="24"
            opacity={isActive ? "0.9" : "0.5"}
          >
            {isActive && !performanceMode && (
              <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            )}
          </rect>
        </g>

        {/* 30 squares in a 5x6 grid - optimized for mobile */}
        <g id="squares">
          {SQUARES.map(({ id, row, col, color }) => {
            const isPlayerActive = id < playerCount;
            const squareSize = 56;
            const spacingX = 72;
            const spacingY = 72;
            const gridWidth = 6 * spacingX - (spacingX - squareSize);
            const gridHeight = 5 * spacingY - (spacingY - squareSize);
            const startX = 60 + (480 - gridWidth) / 2 + squareSize / 2;
            const startY = 60 + (480 - gridHeight) / 2 + squareSize / 2;
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            return (
              <g key={id}>
                {/* Outer glow for active squares - optimized */}
                {isPlayerActive && !performanceMode && (
                  <>
                    <rect
                      x={x - squareSize / 2 - 6}
                      y={y - squareSize / 2 - 6}
                      width={squareSize + 12}
                      height={squareSize + 12}
                      rx="9"
                      fill="#9945FF"
                      opacity="0.25"
                      style={{ filter: "blur(12px)" }}
                    >
                      <animate attributeName="opacity" values="0.25;0.5;0.25" dur="1.5s" repeatCount="indefinite"/>
                    </rect>
                    <rect
                      x={x - squareSize / 2 - 3}
                      y={y - squareSize / 2 - 3}
                      width={squareSize + 6}
                      height={squareSize + 6}
                      rx="7"
                      fill="#00D1FF"
                      opacity="0.4"
                      style={{ filter: "blur(6px)" }}
                    >
                      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1.5s" repeatCount="indefinite"/>
                    </rect>
                  </>
                )}

                {/* Square background shadow - reduced */}
                <rect
                  x={x - squareSize / 2 + 1.5}
                  y={y - squareSize / 2 + 1.5}
                  width={squareSize}
                  height={squareSize}
                  rx="7"
                  fill="rgba(0,0,0,0.3)"
                  opacity="0.5"
                />

                {/* Main square - optimized stroke */}
                <rect
                  x={x - squareSize / 2}
                  y={y - squareSize / 2}
                  width={squareSize}
                  height={squareSize}
                  rx="7"
                  fill={isPlayerActive ? color : "rgba(40,40,60,0.4)"}
                  stroke={isPlayerActive ? "#9945FF" : "rgba(60,60,80,0.3)"}
                  strokeWidth={isPlayerActive ? "2" : "1"}
                  opacity={isPlayerActive ? "1" : "0.3"}
                  filter={performanceMode ? undefined : (isPlayerActive ? "url(#glow)" : "url(#innerShadow)")}
                >
                  {isPlayerActive && isActive && !performanceMode && (
                    <animate attributeName="stroke" values="#9945FF;#00D1FF;#9945FF" dur="2s" repeatCount="indefinite"/>
                  )}
                </rect>

                {/* Top highlight for depth - adjusted */}
                {isPlayerActive && (
                  <rect
                    x={x - squareSize / 2 + 3}
                    y={y - squareSize / 2 + 3}
                    width={squareSize - 6}
                    height={(squareSize - 6) / 2}
                    rx="5"
                    fill="url(#topHighlight)"
                  />
                )}

                {/* Pulsing center dot - smaller */}
                {isPlayerActive && (
                  performanceMode ? (
                    <circle cx={x} cy={y} r="4" fill="white" opacity="0.8" />
                  ) : (
                    <circle cx={x} cy={y} r="4" fill="white" opacity="0.9">
                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite"/>
                      <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                  )
                )}

                {/* Player number badge - smaller font */}
                {isPlayerActive && (
                  <text x={x} y={y + squareSize/2 - 6} textAnchor="middle" 
                    fill="white" fontSize="8" fontWeight="bold" opacity="0.6">
                    #{id + 1}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
