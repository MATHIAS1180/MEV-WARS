"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

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

// 30 data cubes in a 5x6 grid (unconfirmed transactions)
const DATA_CUBES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  row: Math.floor(i / 6),
  col: i % 6,
  color: SOLANA_COLORS[i],
}));

export default function MiningBlockEnhanced({ playerCount, isSpinning, countdown }: Props) {
  const isActive = isSpinning || countdown !== null;
  const [laserPos, setLaserPos] = useState(0);
  
  // Laser sweep animation
  useEffect(() => {
    if (!isSpinning) return;
    
    const interval = setInterval(() => {
      setLaserPos(prev => (prev + 2) % 100);
    }, 20);
    
    return () => clearInterval(interval);
  }, [isSpinning]);

  const SURGE_GREEN = "#00FFA3";
  const OCEAN_BLUE = "#03E1FF";
  const PURPLE_DINO = "#DC1FFF";
  const CYBER_BLUE = "#00D1FF";

  // Get occupied block indices
  const occupiedIds = Array.from({ length: playerCount }, (_, i) => i);

  // Generate data stream lines between adjacent occupied blocks
  const dataStreamLines = occupiedIds.slice(0, -1).map(id => {
    const fromBlock = DATA_CUBES[id];
    const toBlock = DATA_CUBES[id + 1];
    return { from: fromBlock, to: toBlock, id: `stream-${id}` };
  });

  return (
    <div className="mining-block-wrapper relative flex items-center justify-center">
      {/* Outer HUD Status Ring */}
      <div className="absolute pointer-events-none" style={{
        inset: -120,
        background: isActive
          ? `radial-gradient(ellipse, ${PURPLE_DINO}25 0%, ${CYBER_BLUE}15 40%, transparent 70%)`
          : `radial-gradient(ellipse, ${PURPLE_DINO}10 0%, ${CYBER_BLUE}5 40%, transparent 70%)`,
        filter: "blur(80px)",
        transition: "background 1s ease",
      }} />

      {/* Block Hash Status HUD */}
      {isActive && (
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 py-2 rounded-full border border-[#00D1FF]/50 backdrop-blur-xl bg-black/40">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
                <span className="text-xs font-mono text-[#00D1FF] uppercase tracking-wider">
                  BLOCK HASH
                </span>
              </div>
              <span className="text-xs font-mono text-white/60 animate-pulse">
                {Array(8).fill(0).map((_, i) => 
                  String.fromCharCode(Math.random() * 26 + 65)
                ).join('')}...
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ambient glow - stronger during active states */}
      <div className="absolute pointer-events-none" style={{
        inset: -80,
        background: isActive
          ? `radial-gradient(ellipse, ${PURPLE_DINO}35 0%, ${OCEAN_BLUE}25 40%, transparent 75%)`
          : `radial-gradient(ellipse, ${PURPLE_DINO}15 0%, ${OCEAN_BLUE}10 40%, transparent 75%)`,
        filter: "blur(60px)",
        transition: "background 0.8s ease",
      }} />

      {/* Countdown rings with intense glow */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            {[...Array(3)].map((_, i) => {
              const rc = countdown === 1 ? "#FF6B9D" : countdown === 2 ? "#FFB84D" : SURGE_GREEN;
              return (
                <motion.div key={i} className="absolute"
                  initial={{ scale: 0.4, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1.0, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}>
                  <div 
                    className="w-[450px] h-[450px] rounded-full border-2" 
                    style={{ 
                      borderColor: rc,
                      boxShadow: `0 0 30px ${rc}80, inset 0 0 20px ${rc}40`
                    }} 
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Mining Laser Sweep */}
      {isSpinning && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(0, 209, 255, 0.3) 30%, rgba(0, 209, 255, 0.1) 50%, transparent)`,
            transform: `translateX(${laserPos - 100}%)`,
            transition: 'none'
          }}
        />
      )}

      {/* Main SVG Grid */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 600 600" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: isSpinning ? `drop-shadow(0 0 30px ${PURPLE_DINO}80)` : 'none' }}
      >
        <defs>
          {/* Glowing border gradient */}
          <linearGradient id="borderGradE" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PURPLE_DINO}>
              {isActive && <animate attributeName="stop-color" values={`${PURPLE_DINO};${CYBER_BLUE};${SURGE_GREEN};${PURPLE_DINO}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="50%" stopColor={CYBER_BLUE}>
              {isActive && <animate attributeName="stop-color" values={`${CYBER_BLUE};${SURGE_GREEN};${PURPLE_DINO};${CYBER_BLUE}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
            <stop offset="100%" stopColor={SURGE_GREEN}>
              {isActive && <animate attributeName="stop-color" values={`${SURGE_GREEN};${PURPLE_DINO};${CYBER_BLUE};${SURGE_GREEN}`} dur="4s" repeatCount="indefinite"/>}
            </stop>
          </linearGradient>

          {/* Enhanced glow filter for 3D depth */}
          <filter id="glowE" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 0" in="blur"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Shadow filter */}
          <filter id="shadowE" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
            <feOffset dx="0" dy="20" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.7"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner shadow for 3D cube effect */}
          <filter id="innerShadowE">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.6"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Data stream gradient */}
          <linearGradient id="dataStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CYBER_BLUE} stopOpacity="0"/>
            <stop offset="50%" stopColor={CYBER_BLUE} stopOpacity="0.8"/>
            <stop offset="100%" stopColor={CYBER_BLUE} stopOpacity="0"/>
            <animate attributeName="x1" values="0%;100%;0%" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="x2" values="100%;200%;100%" dur="2s" repeatCount="indefinite"/>
          </linearGradient>
        </defs>

        {/* Data stream lines connecting occupied blocks */}
        <g id="dataStreams" opacity={playerCount >= 2 ? 1 : 0} style={{ transition: 'opacity 0.5s' }}>
          {dataStreamLines.map(({ from, to, id: streamId }) => {
            const squareSize = 60;
            const spacingX = 76;
            const spacingY = 76;
            const gridWidth = 6 * spacingX - (spacingX - squareSize);
            const gridHeight = 5 * spacingY - (spacingY - squareSize);
            const startX = 60 + (480 - gridWidth) / 2 + squareSize / 2;
            const startY = 60 + (480 - gridHeight) / 2 + squareSize / 2;
            
            const x1 = startX + from.col * spacingX;
            const y1 = startY + from.row * spacingY;
            const x2 = startX + to.col * spacingX;
            const y2 = startY + to.row * spacingY;

            return (
              <g key={streamId}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke="url(#dataStreamGrad)" 
                  strokeWidth="2" 
                  opacity="0.6"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0,209,255,0.8))" }}
                />
              </g>
            );
          })}
        </g>

        {/* Main container with shadow and depth */}
        <g filter="url(#shadowE)">
          {/* Outer glow ring - enhanced for active state */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="none"
            stroke={isActive ? "url(#borderGradE)" : PURPLE_DINO}
            strokeWidth="3"
            rx="24"
            opacity={isActive ? "0.6" : "0.25"}
            style={{ filter: "blur(25px)" }}
          />

          {/* Background gradient for 3D look */}
          <defs>
            <linearGradient id="blockBgE" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(50, 40, 80, 0.95)" />
              <stop offset="50%" stopColor="rgba(30, 20, 60, 0.90)" />
              <stop offset="100%" stopColor="rgba(20, 15, 50, 0.95)" />
            </linearGradient>
          </defs>

          {/* Main container background */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="url(#blockBgE)"
            rx="24"
            opacity="0.98"
          />

          {/* Enhanced glowing border */}
          <rect
            x="60" y="60" width="480" height="480"
            fill="none"
            stroke={isActive ? "url(#borderGradE)" : "rgba(150, 100, 200, 0.4)"}
            strokeWidth="3"
            rx="24"
            opacity={isActive ? "0.95" : "0.6"}
          >
            {isActive && (
              <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
            )}
          </rect>

          {/* Top highlight for depth */}
          <rect
            x="60" y="60" width="480" height="60"
            fill="url(#topHighlightE)"
            rx="24"
            opacity="0.3"
          />
          <defs>
            <linearGradient id="topHighlightE" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </g>

        {/* 30 Data Cubes Grid */}
        <g id="dataCubes">
          {DATA_CUBES.map(({ id, row, col, color }) => {
            const isOccupied = id < playerCount;
            const squareSize = 60;
            const spacingX = 76;
            const spacingY = 76;
            const gridWidth = 6 * spacingX - (spacingX - squareSize);
            const gridHeight = 5 * spacingY - (spacingY - squareSize);
            const startX = 60 + (480 - gridWidth) / 2 + squareSize / 2;
            const startY = 60 + (480 - gridHeight) / 2 + squareSize / 2;
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;

            return (
              <g key={id}>
                {/* Enhanced outer glow for occupied cubes */}
                {isOccupied && (
                  <>
                    {/* Outer glow blur */}
                    <rect
                      x={x - squareSize / 2 - 12}
                      y={y - squareSize / 2 - 12}
                      width={squareSize + 24}
                      height={squareSize + 24}
                      rx="12"
                      fill="#9945FF"
                      opacity="0.25"
                      style={{ filter: "blur(20px)" }}
                    >
                      <animate attributeName="opacity" values="0.25;0.45;0.25" dur="1.2s" repeatCount="indefinite"/>
                    </rect>
                    {/* Mid glow */}
                    <rect
                      x={x - squareSize / 2 - 6}
                      y={y - squareSize / 2 - 6}
                      width={squareSize + 12}
                      height={squareSize + 12}
                      rx="10"
                      fill={CYBER_BLUE}
                      opacity="0.35"
                      style={{ filter: "blur(10px)" }}
                    >
                      <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.2s" repeatCount="indefinite"/>
                    </rect>
                  </>
                )}

                {/* Shadow underneath */}
                <rect
                  x={x - squareSize / 2 + 3}
                  y={y - squareSize / 2 + 3}
                  width={squareSize}
                  height={squareSize}
                  rx="8"
                  fill="rgba(0,0,0,0.5)"
                  opacity={isOccupied ? "0.7" : "0.3"}
                />

                {/* Main data cube with 3D effect */}
                <defs>
                  <linearGradient id={`cubeBg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={isOccupied ? color + "FF" : "rgba(40,50,80,0.5)"} />
                    <stop offset="100%" stopColor={isOccupied ? color + "BB" : "rgba(20,30,60,0.3)"} />
                  </linearGradient>
                </defs>

                <rect
                  x={x - squareSize / 2}
                  y={y - squareSize / 2}
                  width={squareSize}
                  height={squareSize}
                  rx="8"
                  fill={`url(#cubeBg-${id})`}
                  stroke={isOccupied ? "#9945FF" : "rgba(100, 120, 150, 0.3)"}
                  strokeWidth={isOccupied ? "3.5" : "1.5"}
                  opacity={isOccupied ? "0.95" : "0.4"}
                  filter={isOccupied ? "url(#glowE)" : "url(#innerShadowE)"}
                >
                  {isOccupied && isActive && (
                    <animate attributeName="stroke" values="#9945FF;#00D1FF;#14F195;#9945FF" dur="2.5s" repeatCount="indefinite"/>
                  )}
                </rect>

                {/* 3D top highlight */}
                {isOccupied && (
                  <rect
                    x={x - squareSize / 2 + 3}
                    y={y - squareSize / 2 + 3}
                    width={squareSize - 6}
                    height={(squareSize - 6) / 3}
                    rx="6"
                    fill="url(#cubeHighlight)"
                    opacity="0.4"
                  />
                )}
                <defs>
                  <linearGradient id="cubeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                  </linearGradient>
                </defs>

                {/* Side accent for 3D depth */}
                {isOccupied && (
                  <rect
                    x={x + squareSize / 2 - 6}
                    y={y - squareSize / 2 + 3}
                    width="6"
                    height={squareSize - 6}
                    rx="3"
                    fill={color}
                    opacity="0.5"
                  />
                )}

                {/* Pulsing center core */}
                {isOccupied && (
                  <circle cx={x} cy={y} r="6" fill="#FFFFFF" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.2s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="6;8;6" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Empty state indicator */}
                {!isOccupied && (
                  <circle cx={x} cy={y} r="2" fill={CYBER_BLUE} opacity="0.2">
                    <animate attributeName="opacity" values="0.2;0.1;0.2" dur="2s" repeatCount="indefinite"/>
                  </circle>
                )}

                {/* Player index number */}
                {isOccupied && (
                  <text 
                    x={x} 
                    y={y + squareSize/2 - 10} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fontWeight="bold"
                    fill="#14F195"
                    opacity="0.8"
                    fontFamily="monospace"
                  >
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
