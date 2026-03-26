"use client";

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 8 : 12; // Réduit de 20/30 à 8/12

    interface Orb {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      radius: number;
      color: string;
      opacity: number;
      speed: number;
    }

    const colors = [
      'rgba(220, 31, 255',
      'rgba(0, 255, 163',
      'rgba(3, 225, 255',
    ];

    const orbs: Orb[] = [];
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      orbs.push({
        x,
        y,
        targetX: x,
        targetY: y,
        radius: Math.random() * 60 + 30, // Réduit de 80+40 à 60+30
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.08 + 0.02, // Réduit de 0.15+0.05 à 0.08+0.02
        speed: Math.random() * 0.2 + 0.05 // Réduit la vitesse
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb, i) => {
        if (Math.random() < 0.01) {
          orb.targetX = Math.random() * canvas.width;
          orb.targetY = Math.random() * canvas.height;
        }

        orb.x += (orb.targetX - orb.x) * orb.speed * 0.02;
        orb.y += (orb.targetY - orb.y) * orb.speed * 0.02;

        const breathe = Math.sin(time * 2 + i * 0.5) * 0.2 + 0.8;
        const currentRadius = orb.radius * breathe;
        const currentOpacity = orb.opacity * breathe;

        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius * 2
        );
        gradient.addColorStop(0, `${orb.color}, ${currentOpacity * 0.8})`);
        gradient.addColorStop(0.5, `${orb.color}, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, `${orb.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />
      <div className="scanlines" />
      <div className="vignette" />
    </>
  );
}
