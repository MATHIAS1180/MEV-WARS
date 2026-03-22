"use client";
import { motion, AnimatePresence } from "framer-motion";

const BULLET_CONFIGS = [
  { color: "#14F195", light: "#6ee7b7", dark: "#059669", glow: "rgba(20,241,149,0.9)", tip: "#047857" },  // Cyan  (player 0)
  { color: "#9945FF", light: "#c084fc", dark: "#6d28d9", glow: "rgba(153,69,255,0.9)", tip: "#7c3aed" },  // Purple (player 1)
  { color: "#00C2FF", light: "#7dd3fc", dark: "#0284c7", glow: "rgba(0,194,255,0.9)", tip: "#0369a1" },  // Blue  (player 2)
];

// 3 chambers at 120-degree intervals, starting at top
const CHAMBER_ANGLES = [270, 30, 150]; // degrees from top

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface Props {
  playerCount: number;
  isSpinning: boolean;
  rotation: number;
  countdown: number | null;
}

export default function RouletteBarrel({ playerCount, isSpinning, rotation, countdown }: Props) {
  const S = 480; // SVG viewBox size
  const C = S / 2; // center
  const R_OUTER = 220; // outer rim radius
  const R_DRUM = 195;  // main drum radius
  const R_CHAMBER = 50; // chamber hole radius
  const R_HUB = 42;   // center hub radius
  const CHAMBER_R = 130; // distance from center to chamber centers

  const isActive = isSpinning || countdown !== null;
  const showBullets = (i: number) => (playerCount > i) || isActive;

  return (
    <div className="barrel-svg-wrapper relative flex items-center justify-center">
      {/* Outer atmospheric glow blobs */}
      <div className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(153,69,255,0.18) 0%, rgba(20,241,149,0.07) 60%, transparent 80%)", filter: "blur(24px)", animation: "pulse 3s ease-in-out infinite" }} />

      <motion.div
        animate={{ rotate: isSpinning ? rotation : rotation }}
        transition={{ rotate: isSpinning ? { duration: 5, ease: [0.22, 1, 0.36, 1] } : { duration: 0 } }}
        style={{ transformOrigin: "center" }}
      >
        {/* Idle slow rotation wrapper */}
        <motion.div
          animate={{ rotate: isSpinning ? 0 : 360 }}
          transition={{ rotate: isSpinning ? { duration: 0 } : { duration: 30, repeat: Infinity, ease: "linear" } }}
        >
          <svg width="420" height="420" viewBox={`0 0 ${S} ${S}`} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Outer Rim Gradient */}
              <radialGradient id="rimGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#3d3d5c" />
                <stop offset="40%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0a0a12" />
              </radialGradient>

              {/* Drum metal gradient */}
              <radialGradient id="drumGrad" cx="30%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#22223b" />
                <stop offset="50%" stopColor="#0d0d1a" />
                <stop offset="100%" stopColor="#050508" />
              </radialGradient>

              {/* Chamber hole gradient */}
              <radialGradient id="chamberGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#15152a" />
                <stop offset="70%" stopColor="#060610" />
                <stop offset="100%" stopColor="#02020a" />
              </radialGradient>

              {/* Hub gradient */}
              <radialGradient id="hubGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#4a4a6a" />
                <stop offset="30%" stopColor="#2a2a42" />
                <stop offset="100%" stopColor="#0d0d1a" />
              </radialGradient>

              {/* Bullet sphere gradients */}
              {BULLET_CONFIGS.map((b, i) => (
                <radialGradient key={`bg-${i}`} id={`bulletGrad${i}`} cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor={b.light} stopOpacity="1" />
                  <stop offset="45%" stopColor={b.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={b.dark} stopOpacity="1" />
                </radialGradient>
              ))}

              {/* Glow filters */}
              {BULLET_CONFIGS.map((b, i) => (
                <filter key={`gf-${i}`} id={`glow${i}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feColorMatrix type="matrix"
                    values={i === 0 ? "1 0 1 0 0  0 0 0.5 0 0  1 0 1 0 0  0 0 0 1 0" :
                             i === 1 ? "0 0.5 0 0 0  1 1 0.5 0 0  0 0.3 0.3 0 0  0 0 0 1 0" :
                                       "0 0 1 0 0  0 0.5 1 0 0  1 0.5 1 0 0  0 0 0 1 0"}
                    in="blur" result="color" />
                  <feMerge><feMergeNode in="color" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}

              {/* Global glow filter for hub */}
              <filter id="hubGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feColorMatrix type="matrix" values="0.6 0 0.6 0 0  0 0 0.3 0 0  0.6 0 0.6 0 0  0 0 0 1 0" in="blur" result="color" />
                <feMerge><feMergeNode in="color" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>

              {/* Clip for drum */}
              <clipPath id="drumClip">
                <circle cx={C} cy={C} r={R_DRUM} />
              </clipPath>

              {/* Rotating conic rim */}
              <linearGradient id="rimEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9945FF" stopOpacity="0.9" />
                <stop offset="33%" stopColor="#14F195" stopOpacity="0.9" />
                <stop offset="66%" stopColor="#00C2FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#9945FF" stopOpacity="0.9" />
              </linearGradient>

              {/* Highlight sweep */}
              <radialGradient id="highlight" cx="28%" cy="22%" r="55%">
                <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* === OUTER GLOW RING === */}
            <circle cx={C} cy={C} r={R_OUTER + 8} fill="none" stroke="url(#rimEdge)" strokeWidth="3" opacity={isActive ? "0.9" : "0.5"}
                    style={{ filter: "blur(2px)" }} />
            <circle cx={C} cy={C} r={R_OUTER + 14} fill="none" stroke="url(#rimEdge)" strokeWidth="1" opacity={isActive ? "0.5" : "0.2"}
                    style={{ filter: "blur(6px)" }} />

            {/* === OUTER RIM === */}
            <circle cx={C} cy={C} r={R_OUTER} fill="url(#rimGrad)" />
            {/* Rim texture lines */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const inner = polarToCartesian(C, C, R_DRUM + 4, angle);
              const outer = polarToCartesian(C, C, R_OUTER - 4, angle);
              return (
                <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                      stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              );
            })}
            {/* Rim inner edge */}
            <circle cx={C} cy={C} r={R_DRUM + 1} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <circle cx={C} cy={C} r={R_OUTER - 1} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="3" />

            {/* === DRUM BODY === */}
            <circle cx={C} cy={C} r={R_DRUM} fill="url(#drumGrad)" />

            {/* Drum grid lines for texture */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 360) / 12;
              const p1 = polarToCartesian(C, C, 60, angle);
              const p2 = polarToCartesian(C, C, R_DRUM - 6, angle);
              return (
                <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              );
            })}

            {/* === CHAMBER HOLES + BULLETS === */}
            {CHAMBER_ANGLES.map((angleDeg, i) => {
              const pos = polarToCartesian(C, C, CHAMBER_R, angleDeg);
              const loaded = showBullets(i);
              return (
                <g key={i}>
                  {/* Chamber deep shadow */}
                  <circle cx={pos.x} cy={pos.y} r={R_CHAMBER + 4} fill="rgba(0,0,0,0.6)" />
                  {/* Chamber rim ring */}
                  <circle cx={pos.x} cy={pos.y} r={R_CHAMBER + 2} fill="none"
                          stroke={loaded ? BULLET_CONFIGS[i].color : "rgba(255,255,255,0.08)"}
                          strokeWidth="2" opacity={loaded ? "0.6" : "1"}
                          style={loaded ? { filter: `drop-shadow(0 0 8px ${BULLET_CONFIGS[i].glow})` } : undefined} />
                  {/* Chamber hole */}
                  <circle cx={pos.x} cy={pos.y} r={R_CHAMBER} fill="url(#chamberGrad)" />
                  {/* Inner rim bevel */}
                  <circle cx={pos.x} cy={pos.y} r={R_CHAMBER - 4} fill="none"
                          stroke="rgba(0,0,0,0.8)" strokeWidth="3" />
                  <circle cx={pos.x} cy={pos.y} r={R_CHAMBER - 7} fill="rgba(5,5,15,0.95)" />

                  {/* Empty chamber bottom detail */}
                  {!loaded && (
                    <g opacity="0.4">
                      <circle cx={pos.x} cy={pos.y} r={R_CHAMBER - 20} fill="none"
                              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      <circle cx={pos.x} cy={pos.y} r={8} fill="rgba(255,255,255,0.04)" />
                    </g>
                  )}

                  {/* BULLET */}
                  {loaded && (
                    <g filter={`url(#glow${i})`}>
                      {/* Bullet outer glow */}
                      <circle cx={pos.x} cy={pos.y} r={R_CHAMBER - 4}
                              fill={BULLET_CONFIGS[i].glow.replace("0.9", "0.15")} />
                      {/* Bullet body — 3D sphere */}
                      <circle cx={pos.x} cy={pos.y} r={R_CHAMBER - 10}
                              fill={`url(#bulletGrad${i})`}
                              style={{ filter: `drop-shadow(0 0 12px ${BULLET_CONFIGS[i].glow})` }} />
                      {/* Specular highlight */}
                      <ellipse cx={pos.x - (R_CHAMBER - 10) * 0.28}
                               cy={pos.y - (R_CHAMBER - 10) * 0.28}
                               rx={(R_CHAMBER - 10) * 0.35}
                               ry={(R_CHAMBER - 10) * 0.22}
                               fill="rgba(255,255,255,0.55)"
                               style={{ filter: "blur(3px)" }} />
                      {/* Secondary smaller highlight */}
                      <circle cx={pos.x - (R_CHAMBER - 10) * 0.15}
                              cy={pos.y - (R_CHAMBER - 10) * 0.15}
                              r={(R_CHAMBER - 10) * 0.1}
                              fill="rgba(255,255,255,0.85)" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* === DRUM HIGHLIGHT === */}
            <circle cx={C} cy={C} r={R_DRUM} fill="url(#highlight)" style={{ mixBlendMode: "overlay" }} />

            {/* === CENTER HUB === */}
            <circle cx={C} cy={C} r={R_HUB + 4} fill="rgba(0,0,0,0.7)" />
            <circle cx={C} cy={C} r={R_HUB + 2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx={C} cy={C} r={R_HUB} fill="url(#hubGrad)" />
            <circle cx={C} cy={C} r={R_HUB - 4} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3" />
            <circle cx={C} cy={C} r={R_HUB - 8} fill="rgba(5,5,15,0.9)" />

            {/* Hub inner crosshair */}
            {isActive ? (
              <g filter="url(#hubGlow)" opacity="0.95">
                <line x1={C - 22} y1={C} x2={C + 22} y2={C} stroke="#14F195" strokeWidth="2.5" strokeLinecap="round" />
                <line x1={C} y1={C - 22} x2={C} y2={C + 22} stroke="#14F195" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx={C} cy={C} r={14} fill="none" stroke="#14F195" strokeWidth="2" />
                <circle cx={C} cy={C} r={4} fill="#14F195" />
              </g>
            ) : (
              <g opacity="0.2">
                <line x1={C - 20} y1={C} x2={C + 20} y2={C} stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1={C} y1={C - 20} x2={C} y2={C + 20} stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx={C} cy={C} r={12} fill="none" stroke="white" strokeWidth="1.5" />
                <circle cx={C} cy={C} r={3} fill="white" />
              </g>
            )}

            {/* Hub specular highlight */}
            <ellipse cx={C - 12} cy={C - 12} rx={14} ry={9}
                     fill="rgba(255,255,255,0.12)" style={{ filter: "blur(2px)" }} />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
