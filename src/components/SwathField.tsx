import { useEffect, useRef } from 'react';

/**
 * SwathField — the site's signature element.
 *
 * A stylized SAR amplitude/coherence field rendered on <canvas>. On load a
 * vertical "acquisition sweep" moves left→right, painting speckled radar
 * backscatter that resolves into a coherent terrain as it passes — the way a
 * real synthetic-aperture image builds up in azimuth. After the sweep it holds
 * still; pointer movement adds a slight parallax.
 *
 * Grounded, not decorative: monochrome radar grayscale with a faint forest
 * tint over "vegetation," nothing more. Honors prefers-reduced-motion (renders
 * the resolved frame immediately, no sweep, no parallax) and pauses on hidden
 * tabs. The canvas is aria-hidden; the real hero text lives in the DOM.
 */

// paper-ish (bright backscatter) → ink (radar shadow)
const LIGHT = [226, 231, 223];
const DARK = [20, 33, 26];
const FOREST = [30, 94, 67];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smooth(xf);
  const v = smooth(yf);
  const tl = hash(xi, yi);
  const tr = hash(xi + 1, yi);
  const bl = hash(xi, yi + 1);
  const br = hash(xi + 1, yi + 1);
  return lerp(lerp(tl, tr, u), lerp(bl, br, u), v);
}
function fbm(x: number, y: number) {
  let a = 0;
  let amp = 0.55;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    a += amp * valueNoise(x * f, y * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return a;
}

export default function SwathField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Internal (low-res) radar buffer; CSS scales it up smoothly.
    let W = 0;
    let H = 0;
    let resolved: Uint8ClampedArray | null = null; // final RGB, W*H*3
    let img: ImageData | null = null;
    let raf = 0;
    let start = 0;
    const DURATION = 1650; // ms

    function buildField() {
      const rect = canvas.getBoundingClientRect();
      const aspect = rect.height / Math.max(rect.width, 1);
      W = Math.max(120, Math.min(300, Math.round(rect.width / 4.2)));
      H = Math.max(40, Math.round(W * aspect));
      canvas.width = W;
      canvas.height = H;
      resolved = new Uint8ClampedArray(W * H * 3);
      img = ctx.createImageData(W, H);

      const sx = 4.2; // terrain frequency (range)
      const sy = 2.6; // terrain frequency (azimuth)
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = (x / W) * sx;
          const ny = (y / H) * sy;
          let base = fbm(nx + 3.1, ny + 1.7);
          base = clamp01((base - 0.26) * 1.7); // contrast stretch

          // vegetation band gets a faint forest tint in the shadows (restrained)
          const veg = smooth(clamp01(1 - Math.abs(base - 0.55) / 0.3));
          // SAR multiplicative speckle (static, per-pixel)
          const speck = 0.66 + 0.6 * hash(x * 1.7 + 11, y * 1.3 + 5);
          const v = clamp01(base * speck);

          const tint = veg * 0.34;
          const lo = [
            lerp(DARK[0], FOREST[0], tint),
            lerp(DARK[1], FOREST[1], tint),
            lerp(DARK[2], FOREST[2], tint),
          ];
          const i3 = (y * W + x) * 3;
          resolved[i3] = lerp(lo[0], LIGHT[0], v);
          resolved[i3 + 1] = lerp(lo[1], LIGHT[1], v);
          resolved[i3 + 2] = lerp(lo[2], LIGHT[2], v);
        }
      }
    }

    function paint(progress: number) {
      if (!img || !resolved) return;
      const d = img.data;
      const edge = progress * W;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const i3 = (y * W + x) * 3;
          if (x <= edge) {
            // acquired: resolved radar return, brief fade-in at the edge
            const since = edge - x;
            const k = since < 6 ? 0.55 + 0.45 * (since / 6) : 1;
            d[i] = 236 + (resolved[i3] - 236) * k;
            d[i + 1] = 238 + (resolved[i3 + 1] - 238) * k;
            d[i + 2] = 233 + (resolved[i3 + 2] - 233) * k;
          } else {
            // not yet acquired: quiet paper with the faintest speckle
            const n = hash(x * 2.1 + 1, y * 1.9 + 4);
            const g = 236 + (n - 0.5) * 6;
            d[i] = g;
            d[i + 1] = g + 2;
            d[i + 2] = g - 3;
          }
          d[i + 3] = 255;
        }
      }
      // leading scan-line: a bright forest-tinted gate
      const ex = Math.round(edge);
      if (progress < 1 && ex >= 0 && ex < W) {
        for (let y = 0; y < H; y++) {
          const i = (y * W + ex) * 4;
          d[i] = 210;
          d[i + 1] = 232;
          d[i + 2] = 220;
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    function frame(now: number) {
      if (!start) start = now;
      const p = clamp01((now - start) / DURATION);
      paint(smooth(p));
      if (p < 1) raf = requestAnimationFrame(frame);
    }

    function run() {
      buildField();
      if (reduce.matches) {
        paint(1);
        return;
      }
      start = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    // pointer parallax (cheap CSS transform; disabled under reduced motion)
    function onPointer(e: PointerEvent) {
      if (reduce.matches) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      canvas.style.transform = `scale(1.05) translate(${dx * -1.6}%, ${dy * -1.6}%)`;
    }
    function onLeave() {
      canvas.style.transform = 'scale(1.05) translate(0,0)';
    }

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      let t = 0;
      ro = new ResizeObserver(() => {
        window.clearTimeout(t);
        t = window.setTimeout(run, 120);
      });
      ro.observe(canvas);
    }

    const onVis = () => {
      if (!document.hidden && !reduce.matches && start === 0) run();
    };
    const onReduceChange = () => run();

    canvas.style.transform = 'scale(1.05)';
    run();
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    reduce.addEventListener('change', onReduceChange);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', onReduceChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'auto',
        willChange: 'transform',
        transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
      }}
    />
  );
}
