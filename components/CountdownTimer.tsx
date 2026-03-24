"use client";
import { useMemo } from 'react';

interface CountdownTimerProps {
  secondsLeft: number;
  totalSeconds?: number;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountdownTimer({ secondsLeft, totalSeconds = 30 }: CountdownTimerProps) {
  const progress = secondsLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  
  const color = useMemo(() => {
    if (secondsLeft > 15) return '#00FFA3'; // Surge Green
    if (secondsLeft > 8) return '#FFB547';  // Orange
    return '#FF5B5B'; // Red
  }, [secondsLeft]);
  
  const isPulsing = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <div className="relative w-[140px] h-[140px] mx-auto">
      <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        
        {/* Animated progress arc */}
        <circle
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
      </svg>
      
      {/* Centered countdown number */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center ${
          isPulsing ? 'animate-pulse-scale' : ''
        }`}
      >
        <span 
          className="font-mono text-4xl font-bold leading-none"
          style={{ 
            color,
            textShadow: `0 0 20px ${color}80`
          }}
        >
          {String(secondsLeft).padStart(2, '0')}
        </span>
        <span className="text-[11px] text-zinc-500 mt-1">secondes</span>
      </div>

      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
