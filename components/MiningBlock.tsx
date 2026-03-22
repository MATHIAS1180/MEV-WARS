"use client";
import { motion } from "framer-motion";

// 30 couleurs variées dans le thème Solana (violet, cyan, vert, rose, orange)
const PLAYER_COLORS = [
  "#9945FF", // 1. Violet
  "#14F195", // 2. Vert Solana
  "#00C2FF", // 3. Cyan
  "#FF6B9D", // 4. Rose
  "#FFB84D", // 5. Orange
  "#A855F7", // 6. Violet clair
  "#10B981", // 7. Vert émeraude
  "#06B6D4", // 8. Cyan clair
  "#EC4899", // 9. Rose vif
  "#F59E0B", // 10. Ambre
  "#8B5CF6", // 11. Violet indigo
  "#34D399", // 12. Vert menthe
  "#22D3EE", // 13. Cyan électrique
  "#F472B6", // 14. Rose bonbon
  "#FBBF24", // 15. Jaune doré
  "#7C3AED", // 16. Violet profond
  "#6EE7B7", // 17. Vert pastel
  "#67E8F9", // 18. Cyan pastel
  "#FDA4AF", // 19. Rose pâle
  "#FCD34D", // 20. Jaune pâle
  "#6D28D9", // 21. Violet foncé
  "#059669", // 22. Vert foncé
  "#0891B2", // 23. Cyan foncé
  "#BE185D", // 24. Rose foncé
  "#D97706", // 25. Orange foncé
  "#5B21B6", // 26. Violet ultra
  "#047857", // 27. Vert ultra
  "#0E7490", // 28. Cyan ultra
  "#9F1239", // 29. Rose ultra
  "#B45309", // 30. Orange ultra
];

interface Props {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
}

export default function MiningBlock({ playerCount, isSpinning, rotation, countdown }: Props) {
  const S = 480; // SVG viewBox size
  const C = S / 2; // center
  const BLOCK_SIZE = 360; // block size
  const BLOCK_X = (S - BLOCK_SIZE) / 2;
  const BLOCK_Y = (S - BLOCK_SIZE) / 2;
  
  // Grid 6x5 = 30 points
  const COLS = 6;
  const ROWS = 5;
  const POINT_RADIUS = 12;
  const SPACING_X = BLOCK_SIZE / (COLS + 1);
  const SPACING_Y = BLOCK_SIZE / (ROWS + 1);

  const isActive = isSpinning || countdown !== null;

  // Generate grid positions for 30 points
  const points = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col;
      const x = BLOCK_X + SPACING_X * (col + 1);
      const y = BLOCK_Y + SPACING_Y * (row + 1);
      points.push({ x, y, index, color: PLAYER_COLORS[index] });
    }
  }

  return (
    <div className="mining-block-wrapper relative flex items-center justify-center">
      {/* Outer atmospheric glow */}
      <div className="absolute w-[420px] h-[420px] rounded-3xl pointer-events-none"
           style={{ 
             background: "radial-gradient(circle, rgba(153,69,255,0.18) 0%, rgba(20,241,149,0.12) 50%, transparent 80%)", 
             filter: "blur(30px)", 
             animation: "pulse 3s ease-in-out infinite" 
           }} />

      <motion.div
        animate={{ 
          scale: isSpinning ? [1, 1.05, 1] : 1,
          rotateY: isSpinning ? [0, 360] : 0
        }}
        transition={{ 
          scale: { duration: 2, repeat: isSpinning ? Infinity : 0 },
          rotateY: { duration: 5, ease: [0.22, 1, 0.36, 1] }
        }}
        style={{ transformOrigin: "center", perspective: "1000px" }}
      >
        <svg width="420" height="420" viewBox={`0 0 ${S} ${S}`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Block gradient */}
            <linearGradient id="blockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#0d0d1a" />
              <stop offset="100%" stopColor="#050508" />
            </linearGradient>

            {/* Border gradient */}
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9945FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#14F195" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00C2FF" stopOpacity="0.8" />
            </linearGradient>

            {/* Point gradients for each player */}
            {PLAYER_COLORS.map((color, i) => (
              <radialGradient key={`pg-${i}`} id={`pointGrad${i}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="70%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </radialGradient>
            ))}

            {/* Glow filter */}
            <filter id="pointGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 0"
                in="blur" result="color" />
              <feMerge>
                <feMergeNode in="color" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Block glow */}
            <filter id="blockGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix type="matrix"
                values="0.6 0 0.6 0 0  0 0.3 0.3 0 0  0.6 0 0.6 0 0  0 0 0 1 0"
                in="blur" result="color" />
              <feMerge>
                <feMergeNode in="color" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer glow ring */}
          <rect 
            x={BLOCK_X - 8} 
            y={BLOCK_Y - 8} 
            width={BLOCK_SIZE + 16} 
            height={BLOCK_SIZE + 16} 
            rx="24" 
            fill="none" 
            stroke="url(#borderGrad)" 
            strokeWidth="3" 
            opacity={isActive ? "0.9" : "0.4"}
            style={{ filter: "blur(4px)" }}
          />

          {/* Main block body */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="url(#blockGrad)"
            filter={isActive ? "url(#blockGlow)" : undefined}
          />

          {/* Block border */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="none" 
            stroke="url(#borderGrad)" 
            strokeWidth="2" 
            opacity={isActive ? "0.8" : "0.3"}
          />

          {/* Inner border */}
          <rect 
            x={BLOCK_X + 8} 
            y={BLOCK_Y + 8} 
            width={BLOCK_SIZE - 16} 
            height={BLOCK_SIZE - 16} 
            rx="16" 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="1"
          />

          {/* Grid lines */}
          {Array.from({ length: COLS - 1 }).map((_, i) => {
            const x = BLOCK_X + SPACING_X * (i + 1);
            return (
              <line 
                key={`v-${i}`}
                x1={x} 
                y1={BLOCK_Y + 20} 
                x2={x} 
                y2={BLOCK_Y + BLOCK_SIZE - 20}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
            );
          })}
          {Array.from({ length: ROWS - 1 }).map((_, i) => {
            const y = BLOCK_Y + SPACING_Y * (i + 1);
            return (
              <line 
                key={`h-${i}`}
                x1={BLOCK_X + 20} 
                y1={y} 
                x2={BLOCK_X + BLOCK_SIZE - 20} 
                y2={y}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
            );
          })}

          {/* 30 points */}
          {points.map((point) => {
            const isActive = point.index < playerCount;
            return (
              <g key={point.index}>
                {/* Point glow when active */}
                {isActive && (
                  <circle 
                    cx={point.x} 
                    cy={point.y} 
                    r={POINT_RADIUS + 6}
                    fill={point.color}
                    opacity="0.2"
                    style={{ filter: "blur(6px)" }}
                  />
                )}
                
                {/* Point */}
                <circle 
                  cx={point.x} 
                  cy={point.y} 
                  r={POINT_RADIUS}
                  fill={isActive ? `url(#pointGrad${point.index})` : "rgba(255,255,255,0.05)"}
                  filter={isActive ? "url(#pointGlow)" : undefined}
                  style={isActive ? { 
                    filter: `drop-shadow(0 0 8px ${point.color})` 
                  } : undefined}
                />

                {/* Point highlight */}
                {isActive && (
                  <circle 
                    cx={point.x - POINT_RADIUS * 0.3} 
                    cy={point.y - POINT_RADIUS * 0.3} 
                    r={POINT_RADIUS * 0.3}
                    fill="rgba(255,255,255,0.6)"
                    style={{ filter: "blur(1px)" }}
                  />
                )}

                {/* Point number (optional, for debugging) */}
                {/* <text 
                  x={point.x} 
                  y={point.y + 4} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="10" 
                  opacity="0.3"
                >
                  {point.index + 1}
                </text> */}
              </g>
            );
          })}

          {/* Center indicator when active */}
          {isActive && (
            <g opacity="0.8">
              <circle 
                cx={C} 
                cy={C} 
                r="30" 
                fill="none" 
                stroke="#14F195" 
                strokeWidth="2"
                strokeDasharray="4 4"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 240 240"
                  to="360 240 240"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle 
                cx={C} 
                cy={C} 
                r="8" 
                fill="#14F195"
                opacity="0.8"
              />
            </g>
          )}

          {/* Block highlight overlay */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="url(#highlight)"
            style={{ mixBlendMode: "overlay" }}
          />
          <radialGradient id="highlight" cx="30%" cy="25%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </svg>
      </motion.div>
    </div>
  );
}
