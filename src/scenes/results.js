// Escena de resultados: celebración con confeti detrás de la tarjeta DOM
import { TUNING } from '../config/tuning.js';
import { Particles } from '../game/particles.js';
import { drawSky, skyFor } from '../game/world.js';

export class ResultsScene {
  constructor(engine) {
    this.engine = engine;
    this.particles = new Particles(engine.reducedMotion);
    this.t = 0;
    this.win = false;
  }

  enter({ win } = { win: false }) {
    this.win = win;
    this.t = 0;
    this.particles.pool.length = 0;
    if (win) this.particles.confetti(this.engine.W, this.engine.H, 120);
  }

  update(dt) {
    this.t += dt;
    if (this.win && Math.random() < 0.12) this.particles.confetti(this.engine.W, this.engine.H * 0.4, 4);
    this.particles.update(dt);
  }

  render(ctx) {
    const sky = skyFor(this.win ? 4 : 1, 0.6);
    drawSky(ctx, this.engine.W, this.engine.H, sky, this.t, this.win ? 0.8 : 0.25);
    this.particles.render(ctx);
  }
}
