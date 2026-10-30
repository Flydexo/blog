import { Climb } from './sisyphus-physics';

const W = 1120, H = 520;
const paper = '#f7f5ee';
const slope = (x: number) => 470 - (x - 320) * 0.58;
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
  // A distant ridge stays pale, keeping the climb in the foreground readable.
  for (let y = 290; y < 478; y += 9) {
    for (let x = 700; x < 1100; x += 6) {
      const top = x < 960 ? 440 - (x - 740) * .6 : 308 + (x - 960) * 1.1;
      if (y < top || hash(x, y) > .63) continue;
      ctx.fillStyle = '#cbd0bc';
      ctx.fillText(hash(y, x) > .6 ? ':' : '.', x, y);
    }
  }
  for (let y = 182; y <= 478; y += 8) {
    for (let x = 300; x < 1080; x += 5.8) {
      const left = 320 + (470 - y) / .58;
      const right = 820 + (y - 180) * .79;
      if (x < left || x > right) continue;
      const n = hash(Math.round(x), y);
      const depth = y - slope(x);
      const ridge = 820 + (y - 180) * .22 + Math.sin(y * .028) * 13;
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
  const stride = Math.sin(time * (returning ? 9 : 6)) * 5;
  const headX = x + (returning ? -5 : 11), headY = footY - 42;
  type Point = [number, number];
  const hip: Point = [x - 3, footY - 19];
  const shoulder: Point = [x + (returning ? -3 : 6), footY - 33];
  const segments: [Point, Point, number][] = [
    [hip, shoulder, 5],
    [shoulder, [x + (returning ? -14 : 20), footY - 27], 2.5],
    [[x + (returning ? -14 : 20), footY - 27], [x + (returning ? -9 : 31), footY - 37], 2.2],
    [hip, [x - 12 - stride, footY - 9], 3],
    [[x - 12 - stride, footY - 9], [x - 18 - stride, slope(x - 18 - stride)], 2.4],
    [hip, [x + 5 + stride, footY - 12], 3],
    [[x + 5 + stride, footY - 12], [x + 10 + stride, slope(x + 10 + stride)], 2.4],
  ];
  const distanceToSegment = (px: number, py: number, a: Point, b: Point) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  };
  ctx.font = '7px "Courier New", monospace';
  for (let dy = -51; dy < 19; dy += 3.5) {
    for (let dx = -29; dx < 35; dx += 3) {
      const px = x + dx, py = footY + dy;
      const head = Math.hypot(px - headX, py - headY) < 6.3;
      const body = segments.some(([a, b, width]) => distanceToSegment(px, py, a, b) < width);
      const tunic = dy > -26 && dy < -13 && dx > -10 && dx < 4 + (-dy - 13) * .4;
      if (!head && !body && !tunic) continue;
      ctx.fillStyle = tunic ? '#a96c4e' : '#424b39';
      ctx.fillText(head ? '@' : body ? '#' : '+', px, py);
    }
  }
}

export function mountSisyphus(root: HTMLElement) {
  const canvas = root.querySelector('canvas')!;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const target = root.querySelector<HTMLButtonElement>('.boulder-target')!;
  const hint = root.querySelector<HTMLElement>('.boulder-hint')!;
  const stateLabel = root.querySelector<HTMLElement>('[data-state]')!;
  const ascentLabel = root.querySelector<HTMLElement>('[data-ascent]')!;
  const announcement = root.querySelector<HTMLElement>('[data-announcement]')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-action="pause"]')!;
  const pauseIcon = root.querySelector<HTMLElement>('[data-pause-icon]')!;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const model = new Climb();
  const terrain = landscape();
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let paused = media.matches, visible = true, frame = 0, last = 0, disposed = false;
  let width = 0, height = 0, scale = 1, offsetX = 0, offsetY = 0;
  let drag: { id: number; x: number; y: number; progress: number; moved: boolean } | null = null;
  let used = false, feedback = '', feedbackUntil = 0;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.drawImage(terrain, 0, 0, W, H);
    const rockX = 360 + model.progress * 440;
    const bounce = model.phase === 'falling' ? Math.abs(Math.sin(model.time * 17)) * Math.abs(model.velocity) * 10 : 0;
    const rockY = slope(rockX) - 30 - bounce;
    drawPerson(ctx, 316 + model.person * 440, model.time, model.phase === 'falling' || model.phase === 'returning');
    drawBoulder(ctx, rockX, rockY, model.progress * 18);
    // Dust follows the stone, on the same typographic lattice.
    if (model.phase === 'falling') {
      ctx.font = '9px monospace';
      for (let i = 0; i < 12; i++) {
        const age = (model.time * 1.6 + i / 12) % 1;
        ctx.globalAlpha = (1 - age) * .55;
        ctx.fillStyle = i % 5 === 0 ? '#aa6e50' : '#7c8963';
        ctx.fillText(i % 3 ? '.' : "'", rockX + 25 + age * 65, rockY + 20 - age * 23 + Math.sin(i) * 8);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    const screenX = rockX * scale + offsetX, screenY = rockY * scale + offsetY;
    target.style.left = `${screenX}px`;
    target.style.top = `${screenY}px`;
    target.style.width = `${Math.max(44, 65 * scale)}px`;
    target.style.height = `${Math.max(44, 65 * scale)}px`;
    hint.style.left = `${screenX + 12 * scale}px`;
    hint.style.top = `${screenY - 43 * scale}px`;
    hint.style.opacity = used ? '0' : '1';
    const states = { climbing: 'On the way up', summit: 'Almost, almost…', falling: 'There it goes…', returning: 'And we begin again' };
    const label = paused ? 'Taking a breath' : feedbackUntil > model.time ? feedback : states[model.phase];
    if (stateLabel.textContent !== label) stateLabel.textContent = label;
    ascentLabel.textContent = String(model.ascent).padStart(3, '0');
    root.dataset.phase = model.phase;
  };

  const tick = (now: number) => {
    frame = 0;
    if (disposed || paused || !visible || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (!drag) model.step(dt);
    draw();
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    pauseIcon.textContent = paused ? '▷' : 'Ⅱ';
    draw();
    if (!disposed && !paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const mobile = matchMedia('(max-width: 760px)').matches;
    scale = mobile ? width / 850 : width / W;
    offsetX = mobile ? -240 * scale : 0;
    offsetY = height - H * scale;
    draw();
  };
  const push = (direction: number) => {
    used = true;
    const accepted = model.push(direction, paused);
    feedback = accepted ? (direction > 0 ? 'A little kindness helps' : 'Still, he persists') : 'Let him catch his breath';
    feedbackUntil = model.time + 2;
    announcement.textContent = feedback;
    draw();
  };
  root.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
  root.querySelector('[data-action="help"]')!.addEventListener('click', () => push(1), options);
  root.querySelector('[data-action="hinder"]')!.addEventListener('click', () => push(-1), options);
  pause.addEventListener('click', () => { paused = !paused; sync(); }, options);
  root.addEventListener('keydown', event => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); push(event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1);
    }
  }, options);
  target.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, progress: model.progress, moved: false };
    target.setPointerCapture(event.pointerId);
  }, options);
  target.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) < 4 && !drag.moved) return;
    drag.moved = true; used = true;
    // Project the gesture onto the incline so vertical and diagonal drags both work.
    model.dragTo(drag.progress + (dx - dy * .58) / (scale * 440 * (1 + .58 ** 2)));
    draw();
  }, options);
  let suppressClick = false;
  target.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    drag = null;
    target.releasePointerCapture(event.pointerId);
  }, options);
  const cancelDrag = () => { drag = null; suppressClick = true; };
  target.addEventListener('pointercancel', cancelDrag, options);
  target.addEventListener('lostpointercapture', () => { drag = null; }, options);
  target.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) push(event.shiftKey ? -1 : 1);
    suppressClick = false;
  }, options);
  media.addEventListener('change', () => { paused = media.matches; sync(); }, options);
  document.addEventListener('visibilitychange', sync, options);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  visibility.observe(root);
  resize(); sync();
  return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); abort.abort(); };
}
