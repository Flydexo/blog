import { Climb } from './sisyphus-physics';
import { groundY as slope, mountainStart, mountainPeak, mountainSlope, pushingPose, type Point } from './sisyphus-pose';

const W = 1120, H = 520;
const paper = '#f7f5ee';
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** Static terrain is drawn once; only the figure, stone, and dust redraw each frame. */
function landscape() {
  const layer = document.createElement('canvas');
  layer.width = W * 2;
  layer.height = H * 2;
  const ctx = layer.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // The sun is a halftone disc, with the same character lattice as the terrain.
  for (let y = 48; y < 180; y += 8) {
    for (let x = 867; x < 999; x += 6) {
      const d = Math.hypot(x - 933, (y - 111) * 1.02);
      if (d > 51) continue;
      const n = hash(x, y);
      ctx.fillStyle = d > 46 ? '#d2ab8f' : n > .35 ? '#b97656' : '#ce9675';
      ctx.fillText(d > 46 ? '.' : n > .55 ? ':' : '+', x, y);
    }
  }
  for (let y = 182; y <= 478; y += 8) {
    for (let x = 0; x < W; x += 5.8) {
      const left = mountainStart + (470 - y) / mountainSlope;
      const right = mountainPeak + (y - 180) * .35;
      if (x < left || x > right) continue;
      const n = hash(Math.round(x), y);
      const depth = y - slope(x);
      const ridge = mountainPeak + (y - 180) * .12 + Math.sin(y * .028) * 8;
      const shade = x > ridge;
      const contour = Math.sin(x * .037 + y * .055 + Math.sin(y * .026) * 2);
      const fade = Math.max(0, (y - 420) / 80);
      if (n < fade * .65) continue;
      if (x < left + 9) {
        ctx.fillStyle = '#697954';
        ctx.fillText('/', x, y);
      } else if (x > right - 8) {
        ctx.fillStyle = '#8b9772';
        ctx.fillText('\\', x, y);
      } else if (shade) {
        ctx.fillStyle = n > .65 ? '#7f8f63' : '#a0ac85';
        ctx.fillText(n > .8 ? '+' : n > .42 ? ':' : '.', x, y);
      } else {
        const crevice = contour > .72 && depth > 24;
        ctx.fillStyle = crevice ? '#72845b' : n > .6 ? '#92a175' : '#b4bea0';
        ctx.fillText(crevice ? (n > .4 ? '/' : ':') : n > .7 ? ':' : '.', x, y);
      }
    }
  }
  // A few marks at the foot anchor the mountain without drawing a solid baseline.
  for (let y = 474; y < 510; y += 8) {
    for (let x = 95; x < 1090; x += 6) {
      const n = hash(x, y);
      if (n < .83 + (y - 474) / 210) continue;
      ctx.fillStyle = n > .97 ? '#929d7c' : '#c4cbb4';
      ctx.fillText(n > .97 ? "'" : n > .92 ? ',' : '.', x, y);
    }
  }
  const grasses = [[260, 480], [398, 479], [1010, 480], [1070, 475]];
  ctx.fillStyle = '#8a9974';
  for (const [x, y] of grasses) { ctx.fillText('\\|/', x, y); ctx.fillText('"', x, y + 8); }
  ctx.fillStyle = '#b9bfaa';
  ctx.fillText('—  ·  —', 738, 79);
  ctx.fillText('·  —', 1035, 219);
  return layer;
}

function drawBoulder(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  const r = 27;
  ctx.fillStyle = paper;
  ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.fill();
  ctx.font = '8px "Courier New", monospace';
  for (let dy = -28; dy <= 28; dy += 6) {
    for (let dx = -28; dx <= 28; dx += 4.5) {
      const distance = Math.hypot(dx, dy);
      const boundary = r + Math.sin(Math.atan2(dy, dx) * 5 + angle) * 1.6;
      if (distance > boundary) continue;
      const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
      const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
      const texture = Math.sin(rx * .25) + Math.cos(ry * .3);
      const light = (dx + dy) / 55;
      ctx.fillStyle = distance > boundary - 4 ? '#565d43' : light < -.2 ? '#a0a586' : '#737c5b';
      ctx.fillText(distance > boundary - 4 ? '*' : texture > .6 ? '@' : texture > -.4 ? '#' : ':', x + dx, y + dy);
    }
  }
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, time: number, returning: boolean) {
  const footY = slope(x);
  const { hip, rear, front } = pushingPose(x, time);
  const headX = x + (returning ? -9 : 9), headY = footY - 52;
  const shoulder: Point = [x + (returning ? -12 : 1), footY - 40];
  const segments: [Point, Point, number, string][] = [
    // Draw the far leg a lighter tone so the two bent knees remain separate.
    [rear.hip, rear.knee, 2.2, '#7e886a'],
    [rear.knee, rear.ankle, 2, '#7e886a'],
    [front.hip, front.knee, 2.5, '#424b39'],
    [front.knee, front.ankle, 2.2, '#424b39'],
    [rear.ankle, [rear.ankle[0] + 6, slope(rear.ankle[0] + 6)], 1.8, '#7e886a'],
    [front.ankle, [front.ankle[0] + 6, slope(front.ankle[0] + 6)], 1.8, '#424b39'],
    [hip, shoulder, 4.5, '#424b39'],
    [shoulder, [headX, headY + 5], 2.2, '#424b39'],
    [shoulder, [x + (returning ? -22 : 13), footY - 34], 2, '#424b39'],
    [[x + (returning ? -22 : 13), footY - 34], [x + (returning ? -19 : 26), footY - 48], 1.8, '#424b39'],
  ];
  const distanceToSegment = (px: number, py: number, a: Point, b: Point) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  };
  // Glyphs fit their cells instead of overlapping into soft, solid limbs.
  ctx.font = '5px "Courier New", monospace';
  for (let dy = -62; dy < 20; dy += 4) {
    for (let dx = -32; dx < 36; dx += 3) {
      const px = x + dx, py = footY + dy;
      const head = Math.hypot(px - headX, py - headY) < 6.3;
      const body = segments.findLast(([a, b, width]) => distanceToSegment(px, py, a, b) < width);
      const tunic = dy > -31 && dy < -20 && dx > -23 && dx < -6;
      if (!head && !body && !tunic) continue;
      ctx.fillStyle = tunic ? '#a96c4e' : head ? '#424b39' : body![3];
      ctx.fillText(head ? '@' : body ? '#' : '+', px, py);
    }
  }
}

export function mountSisyphus(root: HTMLElement) {
  const canvas = root.querySelector('canvas')!;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const model = new Climb();
  const terrain = landscape();
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const rockStart = mountainStart + 45;
  const travel = mountainPeak - 20 - rockStart;
  let visible = true, frame = 0, last = 0, disposed = false;
  let width = 0, height = 0, scale = 1, portraitScale = 1, offsetX = 0, offsetY = 0;
  let portrait = false;

  const draw = () => {
    const rockX = rockStart + model.progress * travel;
    const personX = rockStart - 44 + model.person * travel;
    if (portrait) {
      scale = Math.min(portraitScale, width / (Math.abs(rockX - personX) + 140));
      offsetX = width / 2 - (rockX + personX) / 2 * scale;
      offsetY = height * .62 - (slope((rockX + personX) / 2) - 30) * scale;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.drawImage(terrain, 0, 0, W, H);
    const bounce = model.phase === 'falling' ? Math.abs(Math.sin(model.time * 17)) * Math.abs(model.velocity) * 10 : 0;
    const rockY = slope(rockX) - 30 - bounce;
    drawPerson(ctx, personX, model.time, model.phase === 'falling' || model.phase === 'returning');
    drawBoulder(ctx, rockX, rockY, model.progress * 38);
    if (model.phase === 'falling') {
      ctx.font = '9px monospace';
      for (let index = 0; index < 12; index++) {
        const age = (model.time * 1.6 + index / 12) % 1;
        ctx.globalAlpha = (1 - age) * .55;
        ctx.fillStyle = index % 5 === 0 ? '#aa6e50' : '#7c8963';
        ctx.fillText(index % 3 ? '.' : "'", rockX + 25 + age * 65, rockY + 20 - age * 23 + Math.sin(index) * 8);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    root.dataset.phase = model.phase;
  };

  const tick = (now: number) => {
    frame = 0;
    if (disposed || media.matches || !visible || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    model.step(dt);
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    draw();
    if (!disposed && !media.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    portrait = width / height < 1;
    portraitScale = Math.min(width / 260, height / 610);
    scale = portrait ? portraitScale : Math.min(width / W, height / 440);
    offsetX = (width - W * scale) / 2;
    offsetY = height - H * scale;
    draw();
  };
  media.addEventListener('change', sync, options);
  document.addEventListener('visibilitychange', sync, options);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  visibility.observe(root);
  resize(); sync();
  return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); abort.abort(); };
}
