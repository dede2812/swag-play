// Fondo del mundo: cielo por día, skyline en paralaje y pista con carriles
import { TUNING } from '../config/tuning.js';
import { DAY_SKIES } from '../config/brand.js';
import { lerp, roundRect } from '../core/utils.js';

function hexRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
export function mixColor(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
export function skyFor(day, blend) {
  const A = DAY_SKIES[Math.min(day, DAY_SKIES.length - 1)];
  const B = DAY_SKIES[Math.min(day + 1, DAY_SKIES.length - 1)];
  return {
    top: mixColor(A.top, B.top, blend),
    mid: mixColor(A.mid, B.mid, blend),
    glow: mixColor(A.glow, B.glow, blend),
  };
}

// Skyline procedural estable (dos capas)
function makeSkyline(seedRand, count, minH, maxH, color, winColor) {
  const b = [];
  let x = -40;
  for (let i = 0; i < count; i++) {
    const w = 34 + seedRand() * 70;
    const h = minH + seedRand() * (maxH - minH);
    const wins = [];
    const cols = Math.floor(w / 14), rows = Math.floor(h / 18);
    for (let cx = 0; cx < cols; cx++) for (let cy = 0; cy < rows; cy++)
      if (seedRand() < 0.16) wins.push([6 + cx * 14, 10 + cy * 18]);
    b.push({ x, w, h, wins });
    x += w + 6 + seedRand() * 26;
  }
  return { color, winColor, buildings: b, width: x };
}

export function buildSkylines(rand) {
  return [
    { ...makeSkyline(rand, 26, 40, 130, '#0D0D16', 'rgba(93,193,185,.5)'), par: 0.14, baseY: TUNING.horizonY + 2 },
    { ...makeSkyline(rand, 22, 70, 190, '#12121E', 'rgba(242,169,0,.45)'), par: 0.32, baseY: TUNING.horizonY + 4 },
  ];
}

export function drawSky(ctx, W, H, sky, t, starAmount) {
  const g = ctx.createLinearGradient(0, 0, 0, TUNING.groundY);
  g.addColorStop(0, sky.top);
  g.addColorStop(0.62, sky.mid);
  g.addColorStop(1, sky.glow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // estrellas
  if (starAmount > 0.02) {
    ctx.fillStyle = '#F7F9FC';
    for (let i = 0; i < 42; i++) {
      const sx = (i * 97.3) % W, sy = (i * 53.7) % (TUNING.horizonY - 20);
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
      ctx.globalAlpha = starAmount * tw * 0.8;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // resplandor del horizonte
  const hg = ctx.createRadialGradient(W / 2, TUNING.horizonY, 10, W / 2, TUNING.horizonY, 260);
  hg.addColorStop(0, sky.glow.replace(')', ',.5)').replace('rgb', 'rgba'));
  hg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, TUNING.horizonY + 130);
}

export function drawSkyline(ctx, layer, distance, W) {
  const off = (distance * layer.par) % layer.width;
  ctx.fillStyle = layer.color;
  for (let rep = -1; rep <= Math.ceil(W / layer.width) + 1; rep++) {
    const ox = rep * layer.width - off;
    for (const b of layer.buildings) {
      const bx = ox + b.x;
      if (bx + b.w < -20 || bx > W + 20) continue;
      ctx.fillRect(bx, layer.baseY - b.h, b.w, b.h);
      ctx.fillStyle = layer.winColor;
      for (const [wx, wy] of b.wins) ctx.fillRect(bx + wx, layer.baseY - b.h + wy, 3, 4);
      ctx.fillStyle = layer.color;
    }
  }
}

export function project(z, lane, cx) {
  const k = 340;
  const p = k / (k + z);
  return {
    p,
    x: cx + (lane - 1) * TUNING.laneSpreadNear * p,
    y: TUNING.horizonY + (TUNING.groundY - TUNING.horizonY) * p,
    scale: p,
  };
}

export function drawTrack(ctx, W, distance, glow) {
  const cx = W / 2;
  const { horizonY, groundY, laneSpreadNear } = TUNING;
  // asfalto
  const g = ctx.createLinearGradient(0, horizonY, 0, TUNING.logicalHeight);
  g.addColorStop(0, '#101018');
  g.addColorStop(1, '#17171F');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 14, horizonY); ctx.lineTo(cx + 14, horizonY);
  ctx.lineTo(cx + laneSpreadNear * 1.9, TUNING.logicalHeight);
  ctx.lineTo(cx - laneSpreadNear * 1.9, TUNING.logicalHeight);
  ctx.closePath(); ctx.fill();
  // rieles laterales con brillo del día
  ctx.strokeStyle = glow; ctx.lineWidth = 3;
  ctx.shadowColor = glow; ctx.shadowBlur = 12;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 16, horizonY);
    ctx.lineTo(cx + s * laneSpreadNear * 1.85, TUNING.logicalHeight);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // líneas de carril (discontinuas, en movimiento)
  ctx.strokeStyle = 'rgba(247,249,252,.35)';
  ctx.lineWidth = 2.5;
  const stripeLen = 130, gap = 150, cycle = stripeLen + gap;
  for (const laneEdge of [-0.5, 0.5]) {
    for (let z = -(distance % cycle); z < TUNING.farZ; z += cycle) {
      const p1 = project(z, 0, cx), p2 = project(z + stripeLen, 0, cx);
      const x1 = cx + laneEdge * laneSpreadNear * p1.p;
      const x2 = cx + laneEdge * laneSpreadNear * p2.p;
      ctx.globalAlpha = Math.min(1, p1.p * 1.6);
      ctx.beginPath(); ctx.moveTo(x1, p1.y); ctx.lineTo(x2, p2.y); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // línea de meta/suelo del jugador
  ctx.fillStyle = 'rgba(247,249,252,.06)';
  ctx.fillRect(0, groundY + 30, W, TUNING.logicalHeight - groundY);
}
