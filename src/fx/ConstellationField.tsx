import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  violet: boolean;
}

interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  max: number;
  /** triangle vertices relative to the center */
  pts: [number, number, number, number, number, number];
}

const MAX_SHARDS = 140;

function makeShard(x: number, y: number, speed: number): Shard {
  const a = Math.random() * Math.PI * 2;
  const s = (0.4 + Math.random()) * speed;
  const size = 4 + Math.random() * 9;
  const pt = () => (Math.random() - 0.5) * size * 2;
  return {
    x,
    y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s - 0.25,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.12,
    life: 0,
    max: 50 + Math.random() * 50,
    pts: [0, -size, pt(), pt(), pt(), pt()],
  };
}

/**
 * Full-screen backdrop: a slow constellation whose lines reach for the
 * pointer, plus glass shards that trail a mouse pointer and burst on click.
 * `calm` dims and slows everything and turns pointer effects off; drills use
 * it so the backdrop never competes with a stimulus. Under reduced motion a
 * single static frame is drawn.
 */
export function ConstellationField({ calm }: { calm: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calmRef = useRef(calm);
  calmRef.current = calm;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    const shards: Shard[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let frame = 0;
    let fade = calmRef.current ? 0.4 : 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(26, Math.min(90, Math.round((w * h) / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 0.7 + Math.random() * 1.5,
        violet: Math.random() < 0.55,
      }));
    };

    const draw = () => {
      const isCalm = calmRef.current;
      // ease between full and calm instead of snapping
      fade += ((isCalm ? 0.4 : 1) - fade) * 0.05;
      const speed = reduced ? 0 : isCalm ? 0.35 : 1;
      const link = w < 640 ? 110 : 140;
      const reach = 190;

      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx * speed;
        n.y += n.vy * speed;
        if (n.x < -20) n.x = w + 20;
        else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        else if (n.y > h + 20) n.y = -20;
      }

      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i] as Node;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j] as Node;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            const alpha = (1 - Math.sqrt(d2) / link) * 0.32 * fade;
            ctx.strokeStyle = `rgba(157,123,255,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        if (pointer.active && !isCalm) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < reach) {
            const alpha = (1 - d / reach) * 0.55;
            ctx.strokeStyle = `rgba(47,212,232,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = n.violet
          ? `rgba(190,170,255,${(0.75 * fade).toFixed(3)})`
          : `rgba(120,230,245,${(0.75 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (shards.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = shards.length - 1; i >= 0; i--) {
          const s = shards[i] as Shard;
          s.life++;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.97;
          s.vy = s.vy * 0.97 - 0.01;
          s.rot += s.vr;
          const t = s.life / s.max;
          if (t >= 1) {
            shards.splice(i, 1);
            continue;
          }
          const alpha = (1 - t) * (t < 0.15 ? t / 0.15 : 1);
          const c = Math.cos(s.rot);
          const sn = Math.sin(s.rot);
          const p = s.pts;
          ctx.beginPath();
          for (let k = 0; k < 6; k += 2) {
            const px = p[k] as number;
            const py = p[k + 1] as number;
            const x = s.x + px * c - py * sn;
            const y = s.y + px * sn + py * c;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = `rgba(150,200,255,${(alpha * 0.22).toFixed(3)})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(215,236,255,${(alpha * 0.75).toFixed(3)})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      if (!reduced) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = e.pointerType === "mouse" || e.pointerType === "pen";
      if (reduced || calmRef.current || !pointer.active) return;
      if (shards.length < MAX_SHARDS && Math.random() < 0.55) {
        shards.push(makeShard(e.clientX, e.clientY, 1.1));
      }
    };
    const onDown = (e: PointerEvent) => {
      if (reduced || calmRef.current || e.pointerType !== "mouse") return;
      for (let i = 0; i < 16 && shards.length < MAX_SHARDS; i++) {
        shards.push(makeShard(e.clientX, e.clientY, 3.2));
      }
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const onResize = () => {
      resize();
      // a static frame is not redrawn by the loop, so redraw after a resize
      if (reduced) draw();
    };

    resize();
    draw();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
