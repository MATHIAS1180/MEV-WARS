"use client";
import { motion, AnimatePresence } from "framer-motion";

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
  
  // Solana gradient colors for various elements
  const SURGE_GREEN = "#00FFA3";
  const OCEAN_BLUE = "#03E1FF";
  const PURPLE_DINO = "#DC1FFF";

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
        </defs>

        {/* Main block with shadow and depth */}
        <g filter="url(#shadow)">
          {/* Outer glow ring */}
          <rect
            x="70" y="70" width="460" height="460"
            fill="none"
            stroke={isActive ? "url(#borderGrad)" : PURPLE_DINO}
            strokeWidth="2"
            rx="24"
            opacity={isActive ? "0.4" : "0.2"}
            style={{ filter: "blur(20px)" }}
          />

          {/* Background with gradient */}
          <rect
            x="70" y="70" width="460" height="460"
            fill="url(#blockBg)"
            rx="24"
          />
          
          <linearGradient id="blockBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(15,15,30,0.98)" />
            <stop offset="100%" stopColor="rgba(8,8,18,0.98)" />
          </linearGradient>

          {/* Inner border with gradient */}
          <rect
            x="70" y="70" width="460" height="460"
            fill="none"
            stroke={isActive ? "url(#borderGrad)" : "rgba(100,100,150,0.3)"}
            strokeWidth="2"
            rx="24"
            opacity={isActive ? "0.9" : "0.5"}
          >
            {isActive && (
              <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            )}
          </rect>

          {/* Corner accents */}
          {[
            { x: 70, y: 70, rotate: 0 },
            { x: 530, y: 70, rotate: 90 },
            { x: 530, y: 530, rotate: 180 },
            { x: 70, y: 530, rotate: 270 }
          ].map((corner, i) => (
            <g key={i} transform={`translate(${corner.x}, ${corner.y}) rotate(${corner.rotate})`}>
              <line x1="0" y1="0" x2="30" y2="0" stroke={isActive ? SURGE_GREEN : "rgba(100,100,150,0.4)"} strokeWidth="2" strokeLinecap="round"/>
              <line x1="0" y1="0" x2="0" y2="30" stroke={isActive ? SURGE_GREEN : "rgba(100,100,150,0.4)"} strokeWidth="2" strokeLinecap="round"/>
              {isActive && (
                <circle cx="0" cy="0" r="4" fill={SURGE_GREEN} opacity="0.8">
                  <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
                </circle>
              )}
            </g>
          ))}
        </g>

        {/* Grid lines for tech look */}
        <g opacity="0.1">
          {[...Array(5)].map((_, i) => (
            <line key={`h${i}`} x1="90" y1={90 + i * 110} x2="510" y2={90 + i * 110} stroke="white" strokeWidth="0.5"/>
          ))}
          {[...Array(5)].map((_, i) => (
            <line key={`v${i}`} x1={90 + i * 105} y1="90" x2={90 + i * 105} y2="510" stroke="white" strokeWidth="0.5"/>
          ))}
        </g>

        {/* Network connections */}
        <g id="connections">
          {CONNECTIONS.map(([fromId, toId]) => {
            const from = SQUARES[fromId];
            const to = SQUARES[toId];
            
            const squareSize = 58;
            const spacing = 76;
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
                stroke={bothActive ? from.color : "rgba(80,80,100,0.15)"}
                strokeWidth={bothActive ? "2.5" : "1"}
                opacity={bothActive ? "0.6" : "0.2"}
                filter={bothActive ? "url(#lineGlow)" : undefined}
              >
                {bothActive && isActive && (
                  <animate attributeName="stroke-opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite"/>
                )}
              </line>
            );
          })}
        </g>

        {/* 30 squares in a 5x6 grid */}
        <g id="squares">
          {SQUARES.map(({ id, row, col, color }) => {
            const isPlayerActive = id < playerCount;
            const squareSize = 58;
            const spacing = 76;
            const startX = 300 - (6 * spacing) / 2 + spacing / 2;
            const startY = 300 - (5 * spacing) / 2 + spacing / 2;
            const x = startX + col * spacing;
            const y = startY + row * spacing;

            return (
              <g key={id}>
                {/* Outer glow for active squares */}
                {isPlayerActive && (
                  <>
                    <rect
                      x={x - squareSize / 2 - 8}
                      y={y - squareSize / 2 - 8}
                      width={squareSize + 16}
                      height={squareSize + 16}
                      rx="10"
                      fill={color}
                      opacity="0.3"
                      style={{ filter: "blur(15px)" }}
                    />
                    <rect
                      x={x - squareSize / 2 - 4}
                      y={y - squareSize / 2 - 4}
                      width={squareSize + 8}
                      height={squareSize + 8}
                      rx="8"
                      fill={color}
                      opacity="0.5"
                      style={{ filter: "blur(8px)" }}
                    />
                  </>
                )}

                {/* Square background shadow */}
                <rect
                  x={x - squareSize / 2 + 2}
                  y={y - squareSize / 2 + 2}
                  width={squareSize}
                  height={squareSize}
                  rx="8"
                  fill="rgba(0,0,0,0.4)"
                  opacity="0.6"
                />

                {/* Main square */}
                <rect
                  x={x - squareSize / 2}
                  y={y - squareSize / 2}
                  width={squareSize}
                  height={squareSize}
                  rx="8"
                  fill={isPlayerActive ? color : "rgba(40,40,60,0.4)"}
                  stroke={isPlayerActive ? "white" : "rgba(60,60,80,0.3)"}
                  strokeWidth={isPlayerActive ? "2.5" : "1"}
                  opacity={isPlayerActive ? "1" : "0.3"}
                  filter={isPlayerActive ? "url(#glow)" : "url(#innerShadow)"}
                >
                  {isPlayerActive && isActive && (
                    <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite"/>
                  )}
                </rect>

                {/* Top highlight for depth */}
                {isPlayerActive && (
                  <rect
                    x={x - squareSize / 2 + 4}
                    y={y - squareSize / 2 + 4}
                    width={squareSize - 8}
                    height={(squareSize - 8) / 2}
                    rx="6"
                    fill="url(#topHighlight)"
                  />
                )}
                
                <linearGradient id="topHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>

                {/* Pulsing center dot */}
                {isPlayerActive && (
                  <circle cx={x} cy={y} r="5" fill="white" opacity="0.95">
                    <animate attributeName="opacity" values="0.95;0.4;0.95" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Player number badge */}
                {isPlayerActive && (
                  <text x={x} y={y + squareSize/2 - 8} textAnchor="middle" 
                    fill="white" fontSize="9" fontWeight="bold" opacity="0.6">
                    #{id + 1}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Searcher counter */}
        <text x="300" y="565" textAnchor="middle"
          fill={playerCount > 0 ? SURGE_GREEN : "rgba(255,255,255,0.3)"}
          fontSize="13" fontFamily="monospace" letterSpacing="4" fontWeight="bold"
          opacity={playerCount > 0 ? "0.9" : "0.4"}
          filter={playerCount > 0 ? "url(#glow)" : undefined}>
          {String(playerCount).padStart(2,'0')}/30 SEARCHERS
        </text>

        {/* Animated scanning line when active */}
        {isActive && (
          <line x1="90" y1="300" x2="510" y2="300" stroke={OCEAN_BLUE} strokeWidth="2" opacity="0.6">
            <animate attributeName="y1" values="90;510;90" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="90;510;90" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
          </line>
        )}
      </svg>
    </div>
  );
}
