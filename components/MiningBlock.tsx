"use client";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="absolute w-[480px] h-[480px] rounded-3xl pointer-events-none"
           style={{ 
             background: isActive 
               ? "radial-gradient(circle, rgba(153,69,255,0.25) 0%, rgba(20,241,149,0.18) 50%, transparent 80%)" 
               : "radial-gradient(circle, rgba(153,69,255,0.12) 0%, rgba(20,241,149,0.08) 50%, transparent 80%)", 
             filter: "blur(40px)", 
             animation: isActive ? "pulse 2s ease-in-out infinite" : "pulse 4s ease-in-out infinite" 
           }} />

      {/* Countdown explosion rings */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`ring-${countdown}-${i}`}
                className="absolute w-[420px] h-[420px] rounded-full border-4 pointer-events-none"
                style={{
                  borderColor: countdown === 1 ? "#FF6B9D" : countdown === 2 ? "#FFB84D" : "#14F195",
                  opacity: 0.8
                }}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ 
                  scale: [0.8, 2.5],
                  opacity: [0.8, 0]
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.15,
                  ease: [0.22, 1, 0.36, 1]
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Massive countdown number */}
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 && (
          <motion.div
            key={`countdown-${countdown}`}
            className="absolute z-20 pointer-events-none"
            initial={{ scale: 0.5, opacity: 0, rotateZ: -20 }}
            animate={{ 
              scale: [0.5, 1.3, 1],
              opacity: [0, 1, 1],
              rotateZ: [20, 0, 0]
            }}
            exit={{ 
              scale: [1, 1.5],
              opacity: [1, 0],
              y: [-20, -60]
            }}
            transition={{ 
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1]
            }}
          >
            <div 
              className="text-[180px] font-black leading-none"
              style={{
                background: countdown === 1 
                  ? "linear-gradient(135deg, #FF6B9D 0%, #EC4899 100%)"
                  : countdown === 2
                  ? "linear-gradient(135deg, #FFB84D 0%, #F59E0B 100%)"
                  : "linear-gradient(135deg, #14F195 0%, #10B981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 30px currentColor)",
                textShadow: "0 0 60px rgba(255,255,255,0.5)"
              }}
            >
              {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ 
          scale: isSpinning ? [1, 1.08, 1] : 1,
          rotateY: isSpinning ? [0, 360] : 0,
          rotateX: isSpinning ? [0, 15, 0] : 0
        }}
        transition={{ 
          scale: { duration: 2.5, repeat: isSpinning ? Infinity : 0, ease: "easeInOut" },
          rotateY: { duration: 6, ease: [0.22, 1, 0.36, 1], repeat: isSpinning ? Infinity : 0 },
          rotateX: { duration: 2.5, repeat: isSpinning ? Infinity : 0, ease: "easeInOut" }
        }}
        style={{ 
          transformOrigin: "center", 
          perspective: "1200px",
          transformStyle: "preserve-3d"
        }}
      >
        <svg width="420" height="420" viewBox={`0 0 ${S} ${S}`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Enhanced block gradient with depth */}
            <linearGradient id="blockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a2a3e" />
              <stop offset="30%" stopColor="#1a1a2e" />
              <stop offset="70%" stopColor="#0d0d1a" />
              <stop offset="100%" stopColor="#050508" />
            </linearGradient>

            {/* Animated border gradient */}
            <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9945FF" stopOpacity={isActive ? "1" : "0.5"}>
                {isActive && (
                  <animate attributeName="stop-color" 
                    values="#9945FF;#14F195;#00C2FF;#9945FF" 
                    dur="4s" 
                    repeatCount="indefinite" />
                )}
              </stop>
              <stop offset="50%" stopColor="#14F195" stopOpacity={isActive ? "1" : "0.5"}>
                {isActive && (
                  <animate attributeName="stop-color" 
                    values="#14F195;#00C2FF;#9945FF;#14F195" 
                    dur="4s" 
                    repeatCount="indefinite" />
                )}
              </stop>
              <stop offset="100%" stopColor="#00C2FF" stopOpacity={isActive ? "1" : "0.5"}>
                {isActive && (
                  <animate attributeName="stop-color" 
                    values="#00C2FF;#9945FF;#14F195;#00C2FF" 
                    dur="4s" 
                    repeatCount="indefinite" />
                )}
              </stop>
            </linearGradient>

            {/* 3D depth shadow */}
            <filter id="depth3D" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset in="blur" dx="4" dy="6" result="offsetBlur" />
              <feFlood floodColor="#000000" floodOpacity="0.5" />
              <feComposite in2="offsetBlur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Point gradients for each player */}
            {PLAYER_COLORS.map((color, i) => (
              <radialGradient key={`pg-${i}`} id={`pointGrad${i}`} cx="30%" cy="25%" r="75%">
                <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                <stop offset="30%" stopColor={color} stopOpacity="1" />
                <stop offset="80%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.5" />
              </radialGradient>
            ))}

            {/* Enhanced point glow */}
            <filter id="pointGlow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feColorMatrix type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0"
                in="blur" result="color" />
              <feMerge>
                <feMergeNode in="color" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Enhanced block glow */}
            <filter id="blockGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feColorMatrix type="matrix"
                values="0.8 0 0.8 0 0  0 0.4 0.4 0 0  0.8 0 0.8 0 0  0 0 0 1.2 0"
                in="blur" result="color" />
              <feMerge>
                <feMergeNode in="color" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Multiple outer glow rings for depth */}
          <rect 
            x={BLOCK_X - 12} 
            y={BLOCK_Y - 12} 
            width={BLOCK_SIZE + 24} 
            height={BLOCK_SIZE + 24} 
            rx="28" 
            fill="none" 
            stroke="url(#borderGrad)" 
            strokeWidth="2" 
            opacity={isActive ? "0.4" : "0.2"}
            style={{ filter: "blur(8px)" }}
          />
          <rect 
            x={BLOCK_X - 8} 
            y={BLOCK_Y - 8} 
            width={BLOCK_SIZE + 16} 
            height={BLOCK_SIZE + 16} 
            rx="24" 
            fill="none" 
            stroke="url(#borderGrad)" 
            strokeWidth="3" 
            opacity={isActive ? "0.7" : "0.3"}
            style={{ filter: "blur(4px)" }}
          />

          {/* 3D shadow layer */}
          <rect 
            x={BLOCK_X + 4} 
            y={BLOCK_Y + 6} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="rgba(0,0,0,0.4)"
            style={{ filter: "blur(8px)" }}
          />

          {/* Main block body with depth */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="url(#blockGrad)"
            filter={isActive ? "url(#blockGlow)" : "url(#depth3D)"}
          />

          {/* Block border with animation */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="none" 
            stroke="url(#borderGrad)" 
            strokeWidth={isActive ? "3" : "2"} 
            opacity={isActive ? "1" : "0.4"}
          />

          {/* Inner border for depth */}
          <rect 
            x={BLOCK_X + 6} 
            y={BLOCK_Y + 6} 
            width={BLOCK_SIZE - 12} 
            height={BLOCK_SIZE - 12} 
            rx="16" 
            fill="none" 
            stroke="rgba(255,255,255,0.08)" 
            strokeWidth="1.5"
          />

          {/* Corner accents */}
          {[
            { x: BLOCK_X + 15, y: BLOCK_Y + 15 },
            { x: BLOCK_X + BLOCK_SIZE - 15, y: BLOCK_Y + 15 },
            { x: BLOCK_X + 15, y: BLOCK_Y + BLOCK_SIZE - 15 },
            { x: BLOCK_X + BLOCK_SIZE - 15, y: BLOCK_Y + BLOCK_SIZE - 15 }
          ].map((corner, i) => (
            <g key={`corner-${i}`} opacity={isActive ? "0.6" : "0.3"}>
              <line 
                x1={corner.x - 8} 
                y1={corner.y} 
                x2={corner.x + 8} 
                y2={corner.y}
                stroke="#14F195"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line 
                x1={corner.x} 
                y1={corner.y - 8} 
                x2={corner.x} 
                y2={corner.y + 8}
                stroke="#14F195"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Enhanced grid lines */}
          {Array.from({ length: COLS - 1 }).map((_, i) => {
            const x = BLOCK_X + SPACING_X * (i + 1);
            return (
              <line 
                key={`v-${i}`}
                x1={x} 
                y1={BLOCK_Y + 20} 
                x2={x} 
                y2={BLOCK_Y + BLOCK_SIZE - 20}
                stroke={isActive ? "rgba(20,241,149,0.08)" : "rgba(255,255,255,0.03)"}
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
                stroke={isActive ? "rgba(20,241,149,0.08)" : "rgba(255,255,255,0.03)"}
                strokeWidth="1"
              />
            );
          })}

          {/* 30 points with enhanced effects */}
          {points.map((point) => {
            const isPointActive = point.index < playerCount;
            return (
              <g key={point.index}>
                {/* Outer glow ring when active */}
                {isPointActive && (
                  <>
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r={POINT_RADIUS + 12}
                      fill={point.color}
                      opacity="0.15"
                      style={{ filter: "blur(10px)" }}
                    />
                    <circle 
                      cx={point.x} 
                      cy={point.y} 
                      r={POINT_RADIUS + 6}
                      fill={point.color}
                      opacity="0.25"
                      style={{ filter: "blur(6px)" }}
                    >
                      <animate 
                        attributeName="r" 
                        values={`${POINT_RADIUS + 6};${POINT_RADIUS + 10};${POINT_RADIUS + 6}`}
                        dur="2s" 
                        repeatCount="indefinite" 
                      />
                      <animate 
                        attributeName="opacity" 
                        values="0.25;0.4;0.25"
                        dur="2s" 
                        repeatCount="indefinite" 
                      />
                    </circle>
                  </>
                )}
                
                {/* Main point with gradient */}
                <circle 
                  cx={point.x} 
                  cy={point.y} 
                  r={POINT_RADIUS}
                  fill={isPointActive ? `url(#pointGrad${point.index})` : "rgba(255,255,255,0.04)"}
                  filter={isPointActive ? "url(#pointGlow)" : undefined}
                  stroke={isPointActive ? point.color : "rgba(255,255,255,0.1)"}
                  strokeWidth={isPointActive ? "1.5" : "0.5"}
                  style={isPointActive ? { 
                    filter: `drop-shadow(0 0 12px ${point.color})` 
                  } : undefined}
                />

                {/* Highlight shine */}
                {isPointActive && (
                  <circle 
                    cx={point.x - POINT_RADIUS * 0.35} 
                    cy={point.y - POINT_RADIUS * 0.35} 
                    r={POINT_RADIUS * 0.35}
                    fill="rgba(255,255,255,0.8)"
                    style={{ filter: "blur(1.5px)" }}
                  />
                )}

                {/* Inner ring for depth */}
                {isPointActive && (
                  <circle 
                    cx={point.x} 
                    cy={point.y} 
                    r={POINT_RADIUS - 3}
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.5"
                  />
                )}
              </g>
            );
          })}

          {/* Enhanced center indicator when active */}
          {isActive && (
            <g opacity="0.9">
              {/* Outer rotating ring */}
              <circle 
                cx={C} 
                cy={C} 
                r="45" 
                fill="none" 
                stroke="#9945FF" 
                strokeWidth="2"
                strokeDasharray="8 8"
                opacity="0.4"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 240 240"
                  to="360 240 240"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Middle rotating ring */}
              <circle 
                cx={C} 
                cy={C} 
                r="35" 
                fill="none" 
                stroke="#14F195" 
                strokeWidth="2.5"
                strokeDasharray="6 6"
                opacity="0.6"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 240 240"
                  to="0 240 240"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Inner pulsing ring */}
              <circle 
                cx={C} 
                cy={C} 
                r="25" 
                fill="none" 
                stroke="#00C2FF" 
                strokeWidth="2"
                opacity="0.8"
              >
                <animate 
                  attributeName="r" 
                  values="25;30;25"
                  dur="2s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="opacity" 
                  values="0.8;0.4;0.8"
                  dur="2s" 
                  repeatCount="indefinite" 
                />
              </circle>

              {/* Center core */}
              <circle 
                cx={C} 
                cy={C} 
                r="12" 
                fill="url(#coreGrad)"
                filter="url(#pointGlow)"
              >
                <animate 
                  attributeName="r" 
                  values="12;14;12"
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              </circle>

              {/* Core gradient */}
              <radialGradient id="coreGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="50%" stopColor="#14F195" stopOpacity="1" />
                <stop offset="100%" stopColor="#9945FF" stopOpacity="0.8" />
              </radialGradient>
            </g>
          )}

          {/* Enhanced block highlight overlay with shine effect */}
          <rect 
            x={BLOCK_X} 
            y={BLOCK_Y} 
            width={BLOCK_SIZE} 
            height={BLOCK_SIZE} 
            rx="20" 
            fill="url(#highlight)"
            style={{ mixBlendMode: "overlay" }}
          />
          <radialGradient id="highlight" cx="25%" cy="20%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Animated shine sweep when active */}
          {isActive && (
            <rect 
              x={BLOCK_X} 
              y={BLOCK_Y} 
              width={BLOCK_SIZE} 
              height={BLOCK_SIZE} 
              rx="20" 
              fill="url(#shine)"
              style={{ mixBlendMode: "overlay" }}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-360 0"
                to="360 0"
                dur="3s"
                repeatCount="indefinite"
              />
            </rect>
          )}
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="40%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.2" />
            <stop offset="60%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </svg>
      </motion.div>
    </div>
  );
}
