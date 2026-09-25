import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
  opacity: number;
  gravity: number;
  drag: number;
  wobble: number;
  wobbleSpeed: number;
}

const CONFETTI_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber / Gold
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#f43f5e", // Rose
];

export const ConfettiCanvas: React.FC<{ durationMs?: number }> = ({ durationMs = 4500 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;
    const startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];

    const spawnBurst = (originX: number, originY: number, angleDeg: number, count: number, spreadDeg: number) => {
      for (let i = 0; i < count; i++) {
        const spreadRad = ((Math.random() - 0.5) * spreadDeg * Math.PI) / 180;
        const baseAngleRad = (angleDeg * Math.PI) / 180;
        const angle = baseAngleRad + spreadRad;
        const speed = Math.random() * 14 + 10;

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 7 + 5,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          shape: Math.random() > 0.4 ? "rect" : "circle",
          opacity: 1,
          gravity: 0.35,
          drag: 0.985,
          wobble: Math.random() * 10,
          wobbleSpeed: Math.random() * 0.1 + 0.05,
        });
      }
    };

    // Initial cannons: Left corner, Right corner, Center
    spawnBurst(window.innerWidth * 0.15, window.innerHeight * 0.9, -60, 65, 45);
    spawnBurst(window.innerWidth * 0.85, window.innerHeight * 0.9, -120, 65, 45);
    spawnBurst(window.innerWidth * 0.5, window.innerHeight * 0.7, -90, 50, 60);

    // Follow-up burst after 450ms
    const followUpTimer = setTimeout(() => {
      if (!isRunning) return;
      spawnBurst(window.innerWidth * 0.25, window.innerHeight * 0.85, -65, 45, 40);
      spawnBurst(window.innerWidth * 0.75, window.innerHeight * 0.85, -115, 45, 40);
    }, 450);

    const render = (now: number) => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        if (progress > 0.6) {
          p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        const wobbleX = Math.sin(p.wobble) * (p.size * 0.3);

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2 + wobbleX, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(wobbleX, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (p.y > canvas.height + 50 || p.opacity <= 0) {
          particles.splice(i, 1);
        }
      }

      if (progress < 1 && particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      clearTimeout(followUpTimer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
};
