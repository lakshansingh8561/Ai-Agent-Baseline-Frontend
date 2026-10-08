import React, { useEffect, useRef } from "react";

interface Star3D {
  baseDistance: number;
  baseAngle: number;
  scatterR: number;
  scatterTheta: number;
  y: number; // 3D disc thickness
  radius: number;
  colorRgb: string;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export const Galaxy3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const STAR_COUNT = 2400;
    const ARMS = 2; // 2 grand sweeping spiral arms
    let stars: Star3D[] = [];

    // Luminous, vibrant cosmic color palette (bright stars & glowing starlight)
    const PALETTE = [
      { rgb: "147, 197, 253", weight: 0.26 }, // Brilliant cyan-blue #93c5fd
      { rgb: "196, 181, 253", weight: 0.26 }, // Glowing cosmic violet #c4b5fd
      { rgb: "255, 255, 255", weight: 0.24 }, // Pure radiant starlight white
      { rgb: "129, 140, 248", weight: 0.14 }, // Electric indigo #818cf8
      { rgb: "56, 189, 248", weight: 0.10 },  // Vivid neon cyan #38bdf8
    ];

    const pickColor = () => {
      const r = Math.random();
      let acc = 0;
      for (const p of PALETTE) {
        acc += p.weight;
        if (r <= acc) return p.rgb;
      }
      return PALETTE[0].rgb;
    };

    // Initialize 3D Galaxy with a guaranteed HOLLOW center (no text blockage)
    const initGalaxy = () => {
      stars = [];
      const minDimension = Math.min(width, height);
      // Large hollow inner clearance: NO stars in the center circle where the text sits!
      const minRadius = Math.max(165, minDimension * 0.23);
      // Expansive outer reach to the very edge of the screen
      const maxRadius = Math.max(width, height) * 0.88;

      for (let i = 0; i < STAR_COUNT; i++) {
        const armIndex = i % ARMS;
        const armOffset = (armIndex * 2 * Math.PI) / ARMS;

        // Distance strictly outside minRadius to prevent ANY clump in the middle
        const progress = Math.pow(Math.random(), 0.95);
        const baseDistance = minRadius + progress * (maxRadius - minRadius);

        // Logarithmic spiral equation: theta = b * ln(r / r0)
        const spiralCurve = Math.log(baseDistance / minRadius) * 2.5 + armOffset;

        // Natural astronomical dispersion along arms
        const spreadFactor = 0.16 * (baseDistance / maxRadius) + 0.04;
        const scatterR = (Math.random() - 0.5) * baseDistance * spreadFactor;
        const scatterTheta = (Math.random() - 0.5) * 0.25;

        // 3D vertical thickness (realistic thin spiral disk)
        const diskThickness = 24 + (baseDistance / maxRadius) * 45;
        const y = (Math.random() - 0.5) * diskThickness;

        stars.push({
          baseDistance,
          baseAngle: spiralCurve,
          scatterR,
          scatterTheta,
          y,
          radius: 0.9 + Math.random() * 1.9,
          colorRgb: pickColor(),
          baseAlpha: 0.6 + Math.random() * 0.4, // High brightness: 0.60 - 1.0
          twinkleSpeed: 0.002 + Math.random() * 0.0035,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = Math.max(rect?.width || window.innerWidth, 320);
      height = Math.max(rect?.height || window.innerHeight, 320);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initGalaxy();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // 3D Camera & Rotation Physics
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    let rotX = 0.92; // ~52° initial 3D pitch tilt looking at disc in space
    let rotY = 0; // horizontal yaw rotation
    let velX = 0;
    let velY = 0.0015; // idle cosmic spin speed
    const IDLE_SPEED = 0.0015;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      // Rotate galaxy in 3D with mouse drag
      rotY += deltaX * 0.006;
      rotX += deltaY * 0.005;

      // Keep velocity for smooth momentum on release
      velY = deltaX * 0.0018;
      velX = deltaY * 0.0015;
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = "grab";
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const FOV = 550;

    // 60 FPS 3D Render Loop
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      if (!isDragging) {
        // Smooth inertia decay back to gentle idle rotation
        velY = velY * 0.94 + IDLE_SPEED * 0.06;
        velX *= 0.92;

        rotY += velY;
        rotX += velX;
      }

      // Restrict pitch to avoid flipping upside down
      rotX = Math.max(-1.4, Math.min(1.4, rotX));

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.48; // Centered gracefully

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Transform, rotate and project all 3D stars
      const projected = [];

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // 3D coordinates in galactic plane
        const angle = star.baseAngle + star.scatterTheta;
        const r = star.baseDistance + star.scatterR;

        const x0 = Math.cos(angle) * r;
        const z0 = Math.sin(angle) * r;
        const y0 = star.y;

        // 1. Rotate Yaw around Y axis
        const x1 = x0 * cosY - z0 * sinY;
        const z1 = x0 * sinY + z0 * cosY;
        const y1 = y0;

        // 2. Rotate Pitch around X axis
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;
        const x2 = x1;

        // 3. Perspective Projection
        const depth = z2 + FOV;
        if (depth <= 20) continue;

        const scale = FOV / depth;
        const projX = cx + x2 * scale;
        const projY = cy + y2 * scale;

        // Viewport bounds check
        if (projX < -50 || projX > width + 50 || projY < -50 || projY > height + 50) {
          continue;
        }

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const finalAlpha = Math.max(
          0.15,
          Math.min(0.98, star.baseAlpha * (0.85 + 0.25 * twinkle) * Math.min(scale, 1.4))
        );

        projected.push({
          x: projX,
          y: projY,
          radius: Math.max(0.7, star.radius * Math.min(scale, 1.6)),
          alpha: finalAlpha,
          colorRgb: star.colorRgb,
          depth: z2,
        });
      }

      // Sort back-to-front (depth buffering)
      projected.sort((a, b) => b.depth - a.depth);

      // Draw projected stars with radiant starlight halos
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];

        // Luminous glowing outer halo for bright / larger stars
        if (p.radius > 1.2 || p.alpha > 0.65) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.colorRgb}, ${p.alpha * 0.32})`;
          ctx.fill();
        }

        // Crisp luminous star core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.colorRgb}, ${p.alpha})`;
        ctx.fill();

        // Pinpoint glistening white center spark for prominent stars
        if (p.radius > 1.8 && p.alpha > 0.7) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.2)})`;
          ctx.fill();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ cursor: "grab" }}
      className="absolute inset-0 w-full h-full select-none z-0 overflow-hidden touch-none"
      title="Click and drag to rotate the galaxy in 3D"
    />
  );
};
