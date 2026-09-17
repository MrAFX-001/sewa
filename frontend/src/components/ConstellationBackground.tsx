import { useEffect, useRef } from "react";

export interface ConstellationBackgroundProps {
  color?: string;
  particleCount?: number;
  linkDistance?: number;
  mouseRadius?: number;
  minRadius?: number;
  maxRadius?: number;
  minSpeed?: number;
  maxSpeed?: number;
  speedMultiplier?: number;
  clickMode?: "spawn" | "none" | "shockwave" | "burst";
  dotsPerClick?: number;
  localRadius?: number;
  maxDotsInLocation?: number;
  clickCooldownMs?: number;
  className?: string;
}

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const n = parseInt(
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c,
    16,
  );
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function ConstellationBackground({
  color = "#313131",
  particleCount = 140,
  linkDistance = 135,
  mouseRadius = 180,
  minRadius = 1.5,
  maxRadius = 3.5,
  minSpeed = 0.35,
  maxSpeed = 0.85,
  speedMultiplier = 0.75,
  clickMode = "spawn",
  dotsPerClick = 2,
  localRadius = 80,
  maxDotsInLocation = 5,
  clickCooldownMs = 400,
  className = "",
}: ConstellationBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animId = 0;
    const rgb = hexToRgb(color);

    const mouse: { x: number | null; y: number | null; radius: number } = {
      x: null,
      y: null,
      radius: mouseRadius,
    };

    let clickHistory: { x: number; y: number; time: number }[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      pulseSpeed: number;

      constructor(
        x: number | null = null,
        y: number | null = null,
        vx: number | null = null,
        vy: number | null = null,
      ) {
        this.x = x !== null ? x : Math.random() * (width || 100);
        this.y = y !== null ? y : Math.random() * (height || 100);
        this.radius = minRadius + Math.random() * (maxRadius - minRadius);
        this.alpha = 0.35 + Math.random() * 0.65;
        this.pulseSpeed = 0.003 + Math.random() * 0.005;

        if (vx !== null && vy !== null) {
          this.vx = vx;
          this.vy = vy;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const spd = minSpeed + Math.random() * (maxSpeed - minSpeed);
          this.vx = Math.cos(angle) * spd;
          this.vy = Math.sin(angle) * spd;
        }
      }

      update() {
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        this.alpha += Math.sin(Date.now() * this.pulseSpeed) * 0.002;
        this.alpha = Math.max(0.2, Math.min(1.0, this.alpha));

        const pad = this.radius * 2 + 20;
        if (this.x < -pad) this.x = width + pad;
        else if (this.x > width + pad) this.x = -pad;
        if (this.y < -pad) this.y = height + pad;
        else if (this.y > height + pad) this.y = -pad;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha})`;
        c.fill();
      }
    }

    let particles: Particle[] = [];

    function resize() {
      if (!container || !canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    // Responsive target count based on area to prevent overcrowding on small screens
    function getTargetParticleCount() {
      const area = width * height;
      if (area <= 0) return particleCount;
      const calculated = Math.round(area / 3800);
      return Math.max(35, Math.min(particleCount, calculated));
    }

    function initParticles() {
      const count = getTargetParticleCount();
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      if (!ctx) return;
      const count = particles.length;
      const maxDist = linkDistance;
      for (let i = 0; i < count; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function drawMouseLinks() {
      if (!ctx || mouse.x === null || mouse.y === null) return;
      const maxDist = mouse.radius;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      drawLines();
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
      }
      drawMouseLinks();
      animId = requestAnimationFrame(animate);
    }

    function handleClick(clickX: number, clickY: number) {
      if (clickMode !== "spawn") return;
      const now = performance.now();
      clickHistory = clickHistory.filter((h) => now - h.time < 3500);

      const rSq = localRadius * localRadius;
      let nearby = 0;
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - clickX;
        const dy = particles[i].y - clickY;
        if (dx * dx + dy * dy < rSq) nearby++;
      }

      const recent = clickHistory.filter((h) => Math.hypot(h.x - clickX, h.y - clickY) < 65);
      const tooFast = recent.some((h) => now - h.time < clickCooldownMs);

      if (nearby >= maxDotsInLocation || tooFast || recent.length >= 3) {
        return;
      }

      clickHistory.push({ x: clickX, y: clickY, time: now });
      const canSpawn = Math.min(dotsPerClick, maxDotsInLocation - nearby);
      for (let i = 0; i < canSpawn; i++) {
        const angle = (i * (Math.PI * 2)) / canSpawn + (Math.random() - 0.5) * 0.6;
        const dist = 14 + Math.random() * 18;
        const px = clickX + Math.cos(angle) * dist;
        const py = clickY + Math.sin(angle) * dist;
        const spd = minSpeed + Math.random() * (maxSpeed - minSpeed);
        particles.push(new Particle(px, py, Math.cos(angle) * spd, Math.sin(angle) * spd));
      }

      const targetCount = getTargetParticleCount();
      if (particles.length > targetCount * 1.8) {
        particles.splice(0, canSpawn);
      }
    }

    const updateMousePos = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = clientX - r.left;
      mouse.y = clientY - r.top;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't spawn if clicking interactive inputs or buttons
      if ((e.target as HTMLElement)?.closest("a, button, input, textarea")) {
        return;
      }
      const r = canvas.getBoundingClientRect();
      handleClick(e.clientX - r.left, e.clientY - r.top);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const r = canvas.getBoundingClientRect();
        handleClick(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
      }
    };

    // Attach interaction listeners to the parent section so hovering anywhere over the section interacts
    const eventTarget = container.parentElement || container;
    eventTarget.addEventListener("mousemove", handleMouseMove as EventListener);
    eventTarget.addEventListener("mouseleave", handleMouseLeave as EventListener);
    eventTarget.addEventListener("mousedown", handleMouseDown as EventListener);
    eventTarget.addEventListener("touchmove", handleTouchMove as EventListener, {
      passive: true,
    });
    eventTarget.addEventListener("touchstart", handleTouchStart as EventListener, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (particles.length === 0) {
        initParticles();
      }
    });
    resizeObserver.observe(container);

    resize();
    initParticles();
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      eventTarget.removeEventListener("mousemove", handleMouseMove as EventListener);
      eventTarget.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      eventTarget.removeEventListener("mousedown", handleMouseDown as EventListener);
      eventTarget.removeEventListener("touchmove", handleTouchMove as EventListener);
      eventTarget.removeEventListener("touchstart", handleTouchStart as EventListener);
    };
  }, [
    color,
    particleCount,
    linkDistance,
    mouseRadius,
    minRadius,
    maxRadius,
    minSpeed,
    maxSpeed,
    speedMultiplier,
    clickMode,
    dotsPerClick,
    localRadius,
    maxDotsInLocation,
    clickCooldownMs,
  ]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
