"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  showGridLines?: boolean;
  animationSpeed?: number; // multiplier for flicker speed
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.32,
  color = "rgb(153, 69, 255)",
  width,
  height,
  className,
  maxOpacity = 0.35,
  showGridLines = true,
  animationSpeed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const memoizedColor = useMemo(() => {
    if (typeof window === "undefined") return "rgba(153, 69, 255,";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "rgba(153, 69, 255,";
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgba(${r}, ${g}, ${b},`;
  }, [color]);
  const setupCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const cols = Math.floor(width / (squareSize + gridGap));
    const rows = Math.floor(height / (squareSize + gridGap));
    const squares = new Float32Array(cols * rows);
    for (let i = 0; i < squares.length; i++) squares[i] = Math.random() * maxOpacity;
    return { cols, rows, squares, dpr };
  }, [squareSize, gridGap, maxOpacity]);
  const updateSquares = useCallback((squares: Float32Array, deltaTime: number) => {
    const effectiveSpeed = Math.min(Math.max(animationSpeed, 0.5), 3);
    for (let i = 0; i < squares.length; i++) {
      if (Math.random() < flickerChance * deltaTime * effectiveSpeed) {
        squares[i] = Math.random() * maxOpacity;
      }
      // add slow fadeout for stability to avoid flicker too intense
      squares[i] = Math.max(0.02, Math.min(maxOpacity, squares[i] - 0.002 * deltaTime));
    }
  }, [flickerChance, maxOpacity, animationSpeed]);
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, cols: number, rows: number, squares: Float32Array, dpr: number) => {
    ctx.clearRect(0, 0, width, height);

    // Draw softly glowing grid lines behind squares
    if (showGridLines) {
      ctx.save();
      ctx.strokeStyle = "rgba(80, 120, 255, 0.10)";
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i <= cols; i++) {
        const x = i * (squareSize + gridGap) * dpr + (gridGap * dpr) / 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        const y = j * (squareSize + gridGap) * dpr + (gridGap * dpr) / 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      ctx.restore();
    }

    // Draw flickering squares
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const opacity = squares[i * rows + j];
        ctx.fillStyle = `${memoizedColor}${opacity})`;
        ctx.fillRect(i * (squareSize + gridGap) * dpr, j * (squareSize + gridGap) * dpr, squareSize * dpr, squareSize * dpr);

        // neon bloom extra highlight for active cells
        if (opacity > 0.15) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(0.10, opacity * 0.25)})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr - 1,
            j * (squareSize + gridGap) * dpr - 1,
            squareSize * dpr + 2,
            squareSize * dpr + 2
          );
        }
      }
    }
  }, [memoizedColor, squareSize, gridGap, showGridLines]);
  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animationFrameId: number; let gridParams: any;
    const updateCanvasSize = () => {
      const w = width || container.clientWidth; const h = height || container.clientHeight;
      setCanvasSize({ width: w, height: h });
      gridParams = setupCanvas(canvas, w, h);
    };
    updateCanvasSize();
    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;
      const deltaTime = (time - lastTime) / 1000; lastTime = time;
      updateSquares(gridParams.squares, deltaTime);
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
      animationFrameId = requestAnimationFrame(animate);
    };
    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0 });
    intersectionObserver.observe(canvas);
    if (isInView) animationFrameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animationFrameId); resizeObserver.disconnect(); intersectionObserver.disconnect(); };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);
  return (
    <div className={cn("w-full h-full", className)} ref={containerRef}>
      <canvas className="pointer-events-none" ref={canvasRef} style={{ width: canvasSize.width, height: canvasSize.height }} />
    </div>
  );
};