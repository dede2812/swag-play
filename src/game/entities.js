// Dibujo vectorial de entidades: ítems de pilar, estrella y obstáculos del caos
import { PILLARS, BRAND } from '../config/brand.js';
import { roundRect } from '../core/utils.js';

function withGlow(ctx, color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

// 📖 Libro de Academia
export function drawBook(ctx, s) {
  const c = PILLARS.A;
  withGlow(ctx, c.glow, 14 * s, () => {
    ctx.fillStyle = c.color;
    roundRect(ctx, -16 * s, -12 * s, 32 * s, 24 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#F7F9FC';
    roundRect(ctx, -13 * s, -9 * s, 11 * s, 18 * s, 2 * s); ctx.fill();
    roundRect(ctx, 2 * s, -9 * s, 11 * s, 18 * s, 2 * s); ctx.fill();
    ctx.strokeStyle = c.color; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(0, -9 * s); ctx.lineTo(0, 9 * s); ctx.stroke();
    ctx.strokeStyle = '#B7BEC9'; ctx.lineWidth = 1.1 * s;
    for (const yy of [-4, 0, 4]) {
      ctx.beginPath(); ctx.moveTo(-10 * s, yy * s); ctx.lineTo(-4 * s, yy * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4 * s, yy * s); ctx.lineTo(10 * s, yy * s); ctx.stroke();
    }
  });
}

// 👟 Tenis de Deporte
export function drawShoe(ctx, s) {
  const c = PILLARS.D;
  withGlow(ctx, c.glow, 14 * s, () => {
    ctx.fillStyle = c.color;
    ctx.beginPath(); // silueta de tenis
    ctx.moveTo(-16 * s, 6 * s);
    ctx.lineTo(-16 * s, -2 * s);
    ctx.quadraticCurveTo(-14 * s, -10 * s, -6 * s, -8 * s);
    ctx.quadraticCurveTo(2 * s, -6 * s, 8 * s, -1 * s);
    ctx.quadraticCurveTo(16 * s, 2 * s, 16 * s, 6 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F7F9FC'; // suela
    roundRect(ctx, -17 * s, 6 * s, 34 * s, 5 * s, 2.5 * s); ctx.fill();
    ctx.strokeStyle = '#F7F9FC'; ctx.lineWidth = 1.4 * s; // agujetas
    for (const xx of [-8, -3, 2]) {
      ctx.beginPath(); ctx.moveTo(xx * s, -6 * s); ctx.lineTo((xx + 4) * s, -1 * s); ctx.stroke();
    }
  });
}

// 💙 Corazón de Bienestar
export function drawHeart(ctx, s, pulse = 0) {
  const c = PILLARS.B;
  const k = s * (1 + Math.sin(pulse * 6) * 0.06);
  withGlow(ctx, c.glow, 16 * k, () => {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(0, 12 * k);
    ctx.bezierCurveTo(-20 * k, -2 * k, -12 * k, -16 * k, 0, -7 * k);
    ctx.bezierCurveTo(12 * k, -16 * k, 20 * k, -2 * k, 0, 12 * k);
    ctx.fill();
    // línea de pulso
    ctx.strokeStyle = '#0B0B0D'; ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-9 * k, -2 * k); ctx.lineTo(-4 * k, -2 * k); ctx.lineTo(-1.5 * k, -6 * k);
    ctx.lineTo(1.5 * k, 2 * k); ctx.lineTo(4 * k, -2 * k); ctx.lineTo(9 * k, -2 * k);
    ctx.stroke();
  });
}

// ⭐ Estrella SWAG (bonus)
export function drawStar(ctx, s, t) {
  const rot = t * 1.8;
  withGlow(ctx, BRAND.gold, 18 * s, () => {
    ctx.save(); ctx.rotate(rot);
    ctx.fillStyle = BRAND.gold;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 15 * s : 6.5 * s;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });
}

// Obstáculo torre: pila de notificaciones (distracción)
export function drawTower(ctx, w, h, t) {
  ctx.save();
  const shake = Math.sin(t * 22) * 1.5;
  ctx.translate(shake, 0);
  // cuerpo del teléfono
  ctx.fillStyle = '#1B1B24';
  ctx.strokeStyle = BRAND.redLight; ctx.lineWidth = 2.5;
  ctx.shadowColor = BRAND.red; ctx.shadowBlur = 18;
  roundRect(ctx, -w / 2, -h, w, h, 10); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  // notificaciones apiladas (detalle sólo cuando la torre es suficientemente grande)
  if (w > 34) {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const yy = -h + 12 + i * ((h - 20) / n);
      const hh = (h - 24) / n - 6;
      ctx.fillStyle = i === 0 ? BRAND.red : '#2C2C36';
      roundRect(ctx, -w / 2 + 7, yy, w - 14, hh, 5); ctx.fill();
      ctx.fillStyle = i === 0 ? '#F7F9FC' : '#5A5A6B';
      ctx.beginPath(); ctx.arc(-w / 2 + 15, yy + hh / 2, 3.2, 0, Math.PI * 2); ctx.fill();
      roundRect(ctx, -w / 2 + 23, yy + hh / 2 - 2.4, w - 30, 4.8, 2.4); ctx.fill();
    }
    // badge de alerta
    const bb = 1 + Math.sin(t * 8) * 0.12;
    ctx.fillStyle = BRAND.red;
    ctx.beginPath(); ctx.arc(w / 2 - 4, -h + 2, 9 * bb, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', w / 2 - 4, -h + 3);
  }
  ctx.restore();
}

// Obstáculo bajo: barrera de caos (saltable)
export function drawBarrier(ctx, w, h, t) {
  ctx.save();
  ctx.shadowColor = BRAND.gold; ctx.shadowBlur = 12;
  // postes
  ctx.fillStyle = '#2C2C36';
  roundRect(ctx, -w / 2, -h, 6, h, 3); ctx.fill();
  roundRect(ctx, w / 2 - 6, -h, 6, h, 3); ctx.fill();
  // tabla rayada
  ctx.beginPath(); roundRect(ctx, -w / 2 - 3, -h - 2, w + 6, h * 0.55, 6); ctx.clip();
  ctx.fillStyle = BRAND.red; ctx.fillRect(-w / 2 - 3, -h - 2, w + 6, h * 0.55);
  ctx.fillStyle = '#F7F9FC';
  for (let x = -w / 2 - 3 - h; x < w / 2 + 3; x += h * 0.9) {
    ctx.save(); ctx.translate(x + ((t * 40) % (h * 1.8)), -h - 2); ctx.rotate(0.5);
    ctx.fillRect(0, -h, h * 0.42, h * 2.4);
    ctx.restore();
  }
  ctx.restore();
}

export function drawItem(ctx, ent, t) {
  const bob = Math.sin(t * 3 + ent.lane * 2) * 4 * ent.scale;
  ctx.save();
  ctx.translate(ent.x, ent.y - 34 * ent.scale + bob);
  if (ent.kind === 'star') drawStar(ctx, ent.scale, t);
  else if (ent.pillar === 'A') drawBook(ctx, ent.scale);
  else if (ent.pillar === 'D') drawShoe(ctx, ent.scale);
  else drawHeart(ctx, ent.scale, t);
  ctx.restore();
}

export function drawObstacle(ctx, ent, t) {
  ctx.save();
  ctx.translate(ent.x, ent.y);
  const s = ent.scale;
  if (ent.kind === 'tower') drawTower(ctx, 44 * s, 108 * s, t + ent.lane);
  else drawBarrier(ctx, 62 * s, 34 * s, t);
  ctx.restore();
}
