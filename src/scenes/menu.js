// Escena de menú: fondo ambientado con el mundo del juego (cielo ciclando, ítems flotando)
import { TUNING } from '../config/tuning.js';
import { DAY_SKIES } from '../config/brand.js';
import { makeRng, rand, clamp } from '../core/utils.js';
import { buildSkylines, drawSky, drawSkyline, drawTrack, mixColor } from '../game/world.js';
import { drawBook, drawShoe, drawHeart, drawStar } from '../game/entities.js';

export class MenuScene {
  constructor(engine) {
    this.engine = engine;
    this.skylines = buildSkylines(makeRng(7));
    this.t = 0;
    this.floats = [];
    const kinds = ['A', 'D', 'B', 'star'];
    for (let i = 0; i < 10; i++) {
      this.floats.push({
        kind: kinds[i % kinds.length],
        x: rand(30, TUNING.logicalWidth - 30),
        y: rand(0, TUNING.logicalHeight),
        s: rand(0.5, 0.9),
        v: rand(14, 30),
        ph: rand(Math.PI * 2),
      });
    }
  }

  enter() {}
  exit() {}

  update(dt) {
    this.t += dt;
    for (const f of this.floats) {
      f.y -= f.v * dt;
      if (f.y < -40) { f.y = TUNING.logicalHeight + 40; f.x = rand(30, TUNING.logicalWidth - 30); }
    }
  }

  render(ctx) {
    const W = this.engine.W, H = this.engine.H;
    const cyc = (this.t / 5) % DAY_SKIES.length;
    const i = Math.floor(cyc), blend = cyc - i;
    const A = DAY_SKIES[i], B = DAY_SKIES[(i + 1) % DAY_SKIES.length];
    const sky = {
      top: mixColor(A.top, B.top, blend),
      mid: mixColor(A.mid, B.mid, blend),
      glow: mixColor(A.glow, B.glow, blend),
    };
    drawSky(ctx, W, H, sky, this.t, 0.6);
    for (const layer of this.skylines) drawSkyline(ctx, layer, this.t * 60, W);
    drawTrack(ctx, W, this.t * 160, sky.glow);

    // ítems flotando hacia arriba (vitrina de pilares)
    for (const f of this.floats) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.t * 2 + f.ph);
      ctx.translate(f.x + Math.sin(this.t + f.ph) * 8, f.y);
      if (f.kind === 'A') drawBook(ctx, f.s);
      else if (f.kind === 'D') drawShoe(ctx, f.s);
      else if (f.kind === 'B') drawHeart(ctx, f.s, this.t + f.ph);
      else drawStar(ctx, f.s * 0.8, this.t);
      ctx.restore();
    }

    // viñeta para legibilidad del menú
    const v = ctx.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, 'rgba(5,5,7,.18)');
    v.addColorStop(1, 'rgba(5,5,7,.78)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}
