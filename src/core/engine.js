// Motor: canvas, bucle, redimensión y entrada (teclado + gestos táctiles + ratón)
import { TUNING } from '../config/tuning.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = TUNING.logicalWidth;
    this.H = TUNING.logicalHeight;
    this.scene = null;
    this.last = 0;
    this.queue = [];            // acciones de entrada pendientes
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this._bindResize();
    this._bindInput();
    requestAnimationFrame((t) => this._frame(t));
  }

  _bindResize() {
    const fit = () => {
      const pad = innerWidth > 520 ? 24 : 0;
      const availW = innerWidth - pad, availH = innerHeight - pad;
      const scale = Math.min(availW / this.W, availH / this.H);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.style.width = `${this.W * scale}px`;
      this.canvas.style.height = `${this.H * scale}px`;
      this.canvas.width = Math.round(this.W * scale * dpr);
      this.canvas.height = Math.round(this.H * scale * dpr);
      this.viewScale = scale * dpr;
    };
    addEventListener('resize', fit);
    addEventListener('orientationchange', fit);
    fit();
  }

  _bindInput() {
    const push = (a) => this.queue.push(a);
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') push('left');
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') push('right');
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') push('jump');
      else if (k === ' ' || k === 'Enter') { push('confirm'); if (k === ' ') e.preventDefault(); }
      else if (k === 'Escape' || k === 'p' || k === 'P') push('pause');
      else if (k >= '1' && k <= '5') push(`ab${k}`); // habilidades Académicas
    });
    // Gestos táctiles sobre el canvas
    let sx = 0, sy = 0, st = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; st = performance.now();
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const quick = performance.now() - st < 500;
      if (quick && Math.max(adx, ady) < 14) push('confirm');
      else if (adx > ady && adx > 24) push(dx > 0 ? 'right' : 'left');
      else if (ady > 24 && dy < 0) push('jump');
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('mousedown', () => push('confirm'));
  }

  consume() { const q = this.queue; this.queue = []; return q; }

  setScene(scene, ...args) {
    this.scene?.exit?.();
    this.scene = scene;
    scene.enter?.(...args);
  }

  _frame(t) {
    const dt = Math.min((t - this.last) / 1000, 0.05) || 0.016;
    this.last = t;
    const input = this.consume();
    this.scene?.update?.(dt, input);
    if (this.scene?.render) {
      const c = this.ctx;
      c.setTransform(this.viewScale, 0, 0, this.viewScale, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      this.scene.render(c);
    }
    requestAnimationFrame((tt) => this._frame(tt));
  }
}
