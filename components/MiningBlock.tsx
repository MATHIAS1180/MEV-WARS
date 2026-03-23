"use client";
import { motion, AnimatePresence } from "framer-motion";

// Solana official colors
const SURGE_GREEN = "#00FFA3";
const OCEAN_BLUE = "#03E1FF";
const PURPLE_DINO = "#DC1FFF";

interface Props {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
}

// 30 squares arranged in a 5x6 grid (like the image)
const SQUARES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  row: Math.floor(i / 6),
  col: i % 6,
}));

// Network connections between adjacent squares
const CONNECTIONS: [number, number][] = [];
SQUARES.forEach(sq => {
  // Connect to right neighbor
  if (sq.col < 5) CONNECTIONS.push([sq.id, sq.id + 1]);
  // Connect to bottom neighbor
  if (sq.row < 4) CONNECTIONS.push([sq.id, sq.id + 6]);
});

export default function MiningBlock({ playerCount, isSpinning, countdown }: Props) {
  const isActive = isSpinning || countdown !== null;

  return (
    <div className="mining-block-wrapper relative flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute pointer-events-none" style={{
        inset: -100,
        background: isActive
          ? `radial-gradient(ellipse, ${PURPLE_DINO}45 0%, ${OCEAN_BLUE}30 40%, transparent 75%)`
          : `radial-gradient(ellipse, ${PURPLE_DINO}20 0%, ${OCEAN_BLUE}15 40%, transparent 75%)`,
        filter: "blur(60px)",
        transition: "background 1s ease",
      }} />

      {/* Countdown rings */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <div key={`rings-${countdown}`} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(3)].map((_, i) => {
              const rc = countdown === 1 ? "#FF6B9D" : countdown === 2 ? "#FFB84D" : SURGE_GREEN;
              return (
                <motion.div key={i} className="absolute"
                  initial={{ scale: 0.4, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1.0, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="w-[450px] h-[450px] rounded-full border-2" style={{ borderColor: rc }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 && (
          <motion.div key={`cd-${countdown}`} className="absolute z-20 pointer-events-none"
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

      <svg width="420" height="420" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Solana gradient for border */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PURPLE_DINO}>
              {isActive && <animate attributeName="stop-color" values={`${PURPLE_DINO};${OCEAN_BLUE};${SURGE_GREEN};${PURPLE_DINO}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="50%" stopColor={OCEAN_BLUE}>
              {isActive && <animate attributeName="stop-color" values={`${OCEAN_BLUE};${SURGE_GREEN};${PURPLE_DINO};${OCEAN_BLUE}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="100%" stopColor={SURGE_GREEN}>
              {isActive && <animate attributeName="stop-color" values={`${SURGE_GREEN};${PURPLE_DINO};${OCEAN_BLUE};${SURGE_GREEN}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
          </linearGradient>

          {/* Active square gradient */}
          <linearGradient id="squareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PURPLE_DINO} />
            <stop offset="50%" stopColor={OCEAN_BLUE} />
            <stop offset="100%" stopColor={SURGE_GREEN} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2.5 0" in="blur"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Line glow */}
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 0" in="blur"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
            <feOffset dx="0" dy="10" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main block with shadow */}
        <g filter="url(#shadow)">
          {/* Background */}
          <rect
            x="80" y="80" width="440" height="440"
            fill="rgba(20,20,35,0.95)"
            rx="20"
          />

          {/* Border */}
          <rect
            x="80" y="80" width="440" height="440"
            fill="none"
            stroke={isActive ? "url(#borderGrad)" : "rgba(100,100,150,0.4)"}
            strokeWidth="3"
            rx="20"
            opacity={isActive ? "0.9" : "0.6"}
          >
            {isActive && (
              <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            )}
          </rect>
        </g>

        {/* Network connections (horizontal and vertical lines) */}
        <g id="connections">
          {CONNECTIONS.map(([fromId, toId]) => {
            const from = SQUARES[fromId];
            const to = SQUARES[toId];
            
            const squareSize = 50;
            const spacing = 70;
            const startX = 300 - (6 * spacing) / 2 + spacing / 2;
            const startY = 300 - (5 * spacing) / 2 + spacing / 2;
            
            const x1 = startX + from.col * spacing;
            const y1 = startY + from.row * spacing;
            const x2 = startX + to.col * spacing;
            const y2 = startY + to.row * spacing;

            const bothActive = fromId < playerCount && toId < playerCount;

            return (
              <line
                key={`${fromId}-${toId}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={bothActive ? OCEAN_BLUE : "rgba(80,80,100,0.2)"}
                strokeWidth={bothActive ? "2" : "1"}
                opacity={bothActive ? "0.7" : "0.3"}
                filter={bothActive ? "url(#lineGlow)" : undefined}
              >
                {bothActive && isActive && (
                  <animate attributeName="stroke-opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite"/>
                )}
              </line>
            );
          })}
        </g>

        {/* 30 squares in a 5x6 grid */}
        <g id="squares">
          {SQUARES.map(({ id, row, col }) => {
            const isPlayerActive = id < playerCount;
            const squareSize = 50;
            const spacing = 70;
            const startX = 300 - (6 * spacing) / 2 + spacing / 2;
            const startY = 300 - (5 * spacing) / 2 + spacing / 2;
            const x = startX + col * spacing;
            const y = startY + row * spacing;

            return (
              <g key={id}>
                {/* Glow for active squares */}
                {isPlayerActive && (
                  <rect
                    x={x - squareSize / 2 - 6}
                    y={y - squareSize / 2 - 6}
                    width={squareSize + 12}
                    height={squareSize + 12}
                    rx="8"
                    fill={PURPLE_DINO}
                    opacity="0.5"
                    style={{ filter: "blur(12px)" }}
                  />
                )}

                {/* Square */}
                <rect
                  x={x - squareSize / 2}
                  y={y - squareSize / 2}
                  width={squareSize}
                  height={squareSize}
                  rx="6"
                  fill={isPlayerActive ? "url(#squareGrad)" : "rgba(60,60,80,0.3)"}
                  stroke={isPlayerActive ? "white" : "rgba(80,80,100,0.4)"}
                  strokeWidth={isPlayerActive ? "2" : "1"}
                  opacity={isPlayerActive ? "1" : "0.4"}
                  filter={isPlayerActive ? "url(#glow)" : undefined}
                >
                  {isPlayerActive && isActive && (
                    <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
                  )}
                </rect>

                {/* Inner shine for active squares */}
                {isPlayerActive && (
                  <rect
                    x={x - squareSize / 2 + 5}
                    y={y - squareSize / 2 + 5}
                    width={squareSize - 10}
                    height={squareSize - 10}
                    rx="4"
                    fill="rgba(255,255,255,0.15)"
                  />
                )}

                {/* Pulsing dot */}
                {isPlayerActive && (
                  <circle cx={x} cy={y} r="4" fill="white" opacity="0.95">
                    <animate attributeName="opacity" values="0.95;0.3;0.95" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* Searcher counter */}
        <text x="300" y="560" textAnchor="middle"
          fill={playerCount > 0 ? SURGE_GREEN : "rgba(255,255,255,0.3)"}
          fontSize="12" fontFamily="monospace" letterSpacing="3" fontWeight="bold"
          opacity={playerCount > 0 ? "0.9" : "0.4"}
          filter={playerCount > 0 ? "url(#glow)" : undefined}>
          {String(playerCount).padStart(2,'0')}/30 SEARCHERS
        </text>
      </svg>
    </div>
  );
}
