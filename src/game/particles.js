// Sistema de partículas con pool: chispas, estelas, confeti, popups de texto
import { rand, clamp } from '../core/utils.js';

const MAX = 260;

export class Particles {
  constructor(reducedMotion = false) {
    this.pool = [];
    this.reduced = reducedMotion;
  }

  _add(p) {
    if (this.pool.length >= MAX) this.pool.shift();
    this.pool.push(p);
  }

  burst(x, y, color, n = 14, speed = 260) {
    const count = this.reduced ? Math.ceil(n / 3) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(Math.PI * 2), v = rand(speed * 0.3, speed);
      this._add({ t: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rand(0.35, 0.7), age: 0, color, size: rand(2, 5) });
    }
  }

  trail(x, y, color) {
    if (this.reduced && Math.random() < 0.6) return;
    this._add({ t: 'spark', x: x + rand(-8, 8), y: y + rand(0, 10), vx: rand(-30, 30), vy: rand(20, 80), life: 0.4, age: 0, color, size: rand(2, 4) });
  }

  confetti(w, h, n = 90) {
    const colors = ['#D7262E', '#5DC1B9', '#F2A900', '#F7F9FC', '#7D97F4'];
    const count = this.reduced ? Math.ceil(n / 3) : n;
    for (let i = 0; i < count; i++) {
      this._add({
        t: 'confetti', x: rand(w), y: rand(-h * 0.4, 0), vx: rand(-40, 40), vy: rand(90, 260),
        life: rand(2.2, 4), age: 0, color: colors[i % colors.length], size: rand(4, 8), rot: rand(Math.PI * 2), vr: rand(-6, 6),
      });
    }
  }

  popup(x, y, text, color = '#F7F9FC', size = 20) {
    this._add({ t: 'text', x, y, vx: 0, vy: -70, life: 0.9, age: 0, text, color, size });
  }

  ring(x, y, color) {
    this._add({ t: 'ring', x, y, life: 0.5, age: 0, color });
  }

  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.age += dt;
      if (p.age >= p.life) { this.pool.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      if (p.t === 'confetti') { p.vy += 120 * dt; p.rot += p.vr * dt; p.x += Math.sin(p.age * 5) * 30 * dt; }
      if (p.t === 'spark') p.vy += 340 * dt;
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = clamp(k, 0, 1);
      if (p.t === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k + 0.5, 0, Math.PI * 2); ctx.fill();
      } else if (p.t === 'confetti') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.t === 'text') {
        ctx.font = `900 ${p.size}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(5,5,7,.85)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
      } else if (p.t === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, (1 - k) * 70 + 8, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
}
