import { Climb } from './sisyphus-physics';
import { groundY as slope, pushingPose, type Point } from './sisyphus-pose';
import { createSceneGeometry, type SceneGeometry } from './sisyphus-geometry';

const paper = '#f7f5ee';
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** Static terrain is drawn once; only the figure, stone, and dust redraw each frame. */
function landscape(scene: SceneGeometry, ratio: number) {
  const layer = document.createElement('canvas');
  layer.width = Math.round(scene.width * ratio);
  layer.height = Math.round(scene.height * ratio);
  const ctx = layer.getContext('2d')!;
  ctx.scale(ratio, ratio);
  ctx.font = `${9 * scene.scale}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pitchX = 5.8 * scene.scale, pitchY = 8 * scene.scale;

  // The sun is a halftone disc, with the same character lattice as the terrain.
  for (let y = scene.sun.y - scene.sun.radius; y <= scene.sun.y + scene.sun.radius; y += pitchY) {
    for (let x = scene.sun.x - scene.sun.radius; x <= scene.sun.x + scene.sun.radius; x += pitchX) {
      const distance = Math.hypot(x - scene.sun.x, y - scene.sun.y) / scene.sun.radius;
      if (distance > 1) continue;
      const n = hash(x, y);
      ctx.fillStyle = distance > .9 ? '#d2ab8f' : n > .35 ? '#b97656' : '#ce9675';
      ctx.fillText(distance > .9 ? '.' : n > .55 ? ':' : '+', x, y);
    }
  }
  for (let y = scene.height - pitchY / 2; y >= scene.peak.y; y -= pitchY) {
    for (let x = 0; x < scene.width; x += pitchX) {
      const left = (scene.height - y) / scene.slope;
      const right = scene.peak.x + (y - scene.peak.y) * .35;
      if (x < left || x > right) continue;
      const n = hash(Math.round(x), y);
      const depth = (y - scene.groundY(x)) / scene.scale;
      const ridge = scene.peak.x + (y - scene.peak.y) * .12 + Math.sin(y / scene.scale * .028) * 8 * scene.scale;
      const shade = x > ridge;
      const contour = Math.sin(x / scene.scale * .037 + y / scene.scale * .055 + Math.sin(y / scene.scale * .026) * 2);
      if (x < left + pitchX * 1.5) {
        ctx.fillStyle = '#697954';
        ctx.fillText('/', x, y);
      } else if (x > right - pitchX * 1.5) {
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
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let visible = true, frame = 0, last = 0, disposed = false;
  let scene: SceneGeometry;
  let terrain: HTMLCanvasElement;

  const draw = () => {
    if (!scene || !terrain) return;
    const person = scene.personPosition(model.person);
    const rock = scene.rockPosition(model.progress);
    ctx.clearRect(0, 0, scene.width, scene.height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.drawImage(terrain, 0, 0, scene.width, scene.height);
    const bounce = model.phase === 'falling' ? Math.abs(Math.sin(model.time * 17)) * Math.abs(model.velocity) * 10 * scene.scale : 0;
    rock.x += scene.normal.x * bounce;
    rock.y += scene.normal.y * bounce;
    ctx.save();
    ctx.translate(person.x, person.y); ctx.rotate(scene.tilt); ctx.scale(scene.scale, scene.scale);
    drawPerson(ctx, 0, model.time, model.phase === 'falling' || model.phase === 'returning');
    ctx.restore();
    ctx.save();
    ctx.translate(rock.x, rock.y); ctx.scale(scene.scale, scene.scale);
    drawBoulder(ctx, 0, 0, model.progress * 38);
    ctx.restore();
    if (model.phase === 'falling') {
      ctx.font = `${9 * scene.scale}px monospace`;
      for (let index = 0; index < 12; index++) {
        const age = (model.time * 1.6 + index / 12) % 1;
        ctx.globalAlpha = (1 - age) * .55;
        ctx.fillStyle = index % 5 === 0 ? '#aa6e50' : '#7c8963';
        const along = (25 + age * 65) * scene.scale;
        const above = (age * 23 + Math.sin(index) * 8) * scene.scale;
        ctx.fillText(index % 3 ? '.' : "'", rock.x + scene.tangent.x * along + scene.normal.x * above, rock.y + scene.tangent.y * along + scene.normal.y * above);
      }
      ctx.globalAlpha = 1;
    }
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
    const { width, height } = rect;
    if (width <= 0 || height <= 0) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    scene = createSceneGeometry(width, height);
    terrain = landscape(scene, ratio);
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
