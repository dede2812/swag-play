// Escena principal: la semana imposible — correr, equilibrar pilares, esquivar el caos
import { TUNING } from '../config/tuning.js';
import { DAYS, PILLARS, BRAND } from '../config/brand.js';
import { clamp, lerp, makeRng, rand } from '../core/utils.js';
import { audio } from '../core/audio.js';
import { Particles } from '../game/particles.js';
import { Player } from '../game/player.js';
import { buildSkylines, drawSky, drawSkyline, drawTrack, project, skyFor } from '../game/world.js';
import { drawItem, drawObstacle } from '../game/entities.js';
import { nextRow, spawnInterval, weakestPillar, KIND } from '../game/spawner.js';
import * as Bal from '../game/balance.js';
import { fmt } from '../game/scoring.js';

const PHASE = { COUNTDOWN: 'countdown', RUNNING: 'running', PAUSED: 'paused', WINNING: 'winning', DYING: 'dying' };

export class PlayScene {
  constructor(engine, ui, onEnd) {
    this.engine = engine;
    this.ui = ui;           // puente con el DOM (main.js)
    this.onEnd = onEnd;
    // ?seed=N (con ?debug=1) hace las partidas deterministas para pruebas
    const urlSeed = new URLSearchParams(location.search).get('seed');
    this.rng = makeRng(urlSeed ? Number(urlSeed) : (Date.now() % 2147483647) || 42);
    this.skylines = buildSkylines(makeRng(7));
  }

  enter({ skin }) {
    this.player = new Player();
    this.player.setSkin(TUNING.skins.find((s) => s.id === skin) || TUNING.skins[0]);
    this.state = Bal.createRunState();
    this.entities = [];
    this.particles = new Particles(this.engine.reducedMotion);
    this.phase = PHASE.COUNTDOWN;
    this.now = 0;
    this.distance = 0;
    this.dayT = 0;
    this.spawnT = -0.6;
    this.speed = TUNING.days.baseSpeed;
    this.acc = { distance: 0, items: 0, stars: 0, combo: 0, days: 0 };
    this.shake = 0;
    this.flash = 0;
    this.cdT = 0;
    this.cdStep = -1;
    this.endT = 0;
    this.lastScoreShown = -1;
    this.pausedFrom = null;
    this.ui.showHud(true);
    this.ui.setDayDots(0);
    this.ui.setPips([]);
    this.ui.showCombo(false);
    this.ui.setEnergy(1);
    this.ui.setScore('0');
  }

  exit() {
    this.ui.showHud(false);
    this.ui.showCombo(false);
    audio.musicStop();
  }

  pause() {
    if (this.phase !== PHASE.RUNNING) return;
    this.phase = PHASE.PAUSED;
    audio.musicStop();
    this.ui.showPause(true, DAYS[this.state.day]);
  }

  resume() {
    if (this.phase !== PHASE.PAUSED) return;
    this.phase = PHASE.RUNNING;
    this.ui.showPause(false);
    audio.musicStart();
    this.spawnT = Math.min(this.spawnT, -0.5); // mini-gracia al volver
  }

  quitToMenu() { this.onEnd(null); }

  // ---------- actualización ----------
  update(dt, input) {
    this.now += dt;
    for (const a of input) this._handleInput(a);

    switch (this.phase) {
      case PHASE.COUNTDOWN: this._updateCountdown(dt); break;
      case PHASE.RUNNING:   this._updateRunning(dt); break;
      case PHASE.WINNING:
      case PHASE.DYING:     this._updateEnding(dt); break;
      case PHASE.PAUSED:    break;
    }
    this.particles.update(dt);
  }

  _handleInput(a) {
    if (a === 'pause') {
      if (this.phase === PHASE.RUNNING) this.pause();
      else if (this.phase === PHASE.PAUSED) this.resume();
      return;
    }
    if (this.phase === PHASE.COUNTDOWN && a === 'confirm') { this._startRun(); return; }
    if (this.phase !== PHASE.RUNNING) return;
    if (a === 'left')  { if (this.player.move(-1)) audio.click(); }
    if (a === 'right') { if (this.player.move(1)) audio.click(); }
    if (a === 'jump' || a === 'confirm') { if (this.player.jump()) audio.jump(); }
  }

  _updateCountdown(dt) {
    this.cdT += dt;
    this.distance += this.speed * 0.35 * dt; // el mundo respira durante la cuenta atrás
    this.player.update(dt, this.speed);
    const steps = ['3', '2', '1', '¡YA!'];
    const idx = Math.floor(this.cdT / 0.72);
    if (idx !== this.cdStep && idx < steps.length) {
      this.cdStep = idx;
      this.ui.countdown(steps[idx]);
      audio.click();
    }
    if (this.cdT >= steps.length * 0.72) this._startRun();
  }

  _startRun() {
    if (this.phase !== PHASE.COUNTDOWN) return;
    this.phase = PHASE.RUNNING;
    this.ui.countdown(null);
    this.ui.banner(DAYS[0]);
    audio.musicStart();
  }

  _updateRunning(dt) {
    const st = this.state;
    const day = st.day;
    const targetSpeed = TUNING.days.baseSpeed + day * TUNING.days.speedPerDay;
    this.speed = lerp(this.speed, targetSpeed, 1 - Math.exp(-1.2 * dt));
    this.distance += this.speed * dt;
    this.dayT += dt;

    // puntuación por distancia (con multiplicador)
    const mult = Bal.multiplier(st, this.now);
    this.acc.distance += TUNING.score.distancePerSec * mult * dt;

    // energía
    if (!Bal.tickEnergy(st, dt)) return this._beginEnd(false);

    // cambio de día
    if (this.dayT >= TUNING.days.lengthSec) {
      this.dayT = 0;
      this.acc.days += TUNING.score.dayBonus;
      this.particles.popup(this.engine.W / 2, 300, `+${TUNING.score.dayBonus} DÍA SUPERADO`, BRAND.aquaLight, 24);
      if (day + 1 >= TUNING.days.count) return this._beginEnd(true);
      st.day++;
      this.ui.banner(DAYS[st.day]);
      this.ui.setDayDots(st.day);
      this.spawnT = -TUNING.days.graceSec;
      audio.day();
    }

    // spawns
    this.spawnT += dt;
    if (this.spawnT >= spawnInterval(day)) {
      this.spawnT = 0;
      const row = nextRow(this.rng, day, weakestPillar(st.pillarAt, this.now));
      for (const e of row) {
        if (!e) continue;
        this.entities.push({ ...e, z: TUNING.farZ + rand(-20, 20), scale: 0, x: 0, y: 0 });
      }
    }

    // entidades
    const cx = this.engine.W / 2;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.z -= this.speed * dt;
      const pr = project(e.z, e.lane, cx);
      e.x = pr.x; e.y = pr.y; e.scale = pr.scale;
      if (e.z < 70 && e.z > -50 && e.lane === this.player.lane) {
        if (e.kind === KIND.ITEM || e.kind === KIND.STAR) this._collect(e);
        else this._hit(e);
        this.entities.splice(i, 1);
        continue;
      }
      if (e.z < -60) this.entities.splice(i, 1);
    }

    // jugador y efectos
    this.player.update(dt, this.speed);
    if (this.player.grounded && !this.engine.reducedMotion && Math.random() < 0.5) {
      this.particles.trail(cx + this.player.x * TUNING.laneSpreadNear, TUNING.groundY + 4, 'rgba(183,190,201,.5)');
    }
    this.shake = Math.max(0, this.shake - dt * 26);
    this.flash = Math.max(0, this.flash - dt * 2.4);

    // HUD
    this.ui.setEnergy(st.energy / TUNING.energy.max);
    const sc = this._score();
    if (sc !== this.lastScoreShown) { this.ui.setScore(fmt(sc)); this.lastScoreShown = sc; }
    const lit = Bal.litPillars(st, this.now);
    this.ui.setPips(lit);
    this.ui.showCombo(Bal.comboActive(st, this.now));
  }

  _collect(e) {
    const st = this.state;
    const mult = Bal.multiplier(st, this.now);
    if (e.kind === KIND.STAR) {
      Bal.collectStar(st);
      const pts = TUNING.score.star * mult;
      this.acc.stars += pts;
      this.particles.popup(e.x, e.y - 60, `+${pts}`, BRAND.gold, 26);
      this.particles.burst(e.x, e.y - 40, BRAND.gold, 18, 300);
      audio.star();
      return;
    }
    const { comboStarted } = Bal.collectPillar(st, e.pillar, this.now);
    const pts = TUNING.score.item * mult;
    this.acc.items += pts;
    const col = PILLARS[e.pillar];
    this.particles.popup(e.x, e.y - 60, `+${pts}`, col.glow, 22);
    this.particles.burst(e.x, e.y - 40, col.color, 14, 260);
    this.particles.ring(e.x, e.y - 34, col.glow);
    audio.blip(col.freq);
    if (comboStarted) {
      this.acc.combo += TUNING.score.comboBonus;
      this.particles.popup(this.engine.W / 2, 260, '¡MODO SWAG ×2!', BRAND.gold, 34);
      this.particles.burst(this.engine.W / 2, 300, BRAND.gold, 30, 420);
      audio.combo();
    }
  }

  _hit(e) {
    if (e.kind === KIND.BARRIER && this.player.jumpY > 45) {
      // barrera superada: pequeño premio de estilo
      this.acc.items += 20;
      this.particles.popup(e.x, e.y - 70, '¡SALVO! +20', BRAND.aquaLight, 18);
      return;
    }
    const applied = Bal.applyHit(this.state, this.now);
    if (!applied) return;
    this.shake = this.engine.reducedMotion ? 0 : 11;
    this.flash = 0.65;
    this.particles.burst(e.x, e.y - 50, BRAND.red, 20, 340);
    this.particles.popup(e.x, e.y - 90, `-${TUNING.energy.hitLoss} ⚡`, BRAND.redLight, 24);
    audio.hit();
    if (!Bal.isAlive(this.state)) this._beginEnd(false);
  }

  _beginEnd(win) {
    this.phase = win ? PHASE.WINNING : PHASE.DYING;
    this.endT = 0;
    audio.musicStop();
    if (win) {
      this.ui.banner('¡SEMANA COMPLETADA!');
      this.particles.confetti(this.engine.W, this.engine.H, 110);
      audio.win();
    } else {
      this.flash = 1;
      this.shake = this.engine.reducedMotion ? 0 : 14;
      audio.lose();
    }
  }

  _updateEnding(dt) {
    this.speed = lerp(this.speed, 0, 1 - Math.exp(-2.2 * dt));
    this.distance += this.speed * dt;
    this.player.update(dt, this.speed);
    for (const e of this.entities) {
      e.z -= this.speed * dt;
      const pr = project(e.z, e.lane, this.engine.W / 2);
      e.x = pr.x; e.y = pr.y; e.scale = pr.scale;
    }
    this.shake = Math.max(0, this.shake - dt * 20);
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.endT += dt;
    if (this.phase === PHASE.WINNING && this.endT < 1.6 && Math.random() < 0.3) {
      this.particles.confetti(this.engine.W, this.engine.H * 0.5, 6);
    }
    const wait = this.phase === PHASE.WINNING ? 2.6 : 1.8;
    if (this.endT >= wait) {
      const won = this.phase === PHASE.WINNING;
      this.phase = 'done';
      this.onEnd(this._results(won));
    }
  }

  _score() {
    const a = this.acc;
    return Math.round(a.distance + a.items + a.stars + a.combo + a.days);
  }

  _results(win) {
    return {
      win,
      score: this._score(),
      acc: { ...this.acc, distance: Math.round(this.acc.distance) },
      daysCompleted: win ? TUNING.days.count : this.state.day,
      stats: {
        items: this.state.itemsCollected,
        stars: this.state.starsCollected,
        hits: this.state.hits,
        combos: this.state.comboActivations,
        timeSec: Math.round(this.now),
      },
    };
  }

  // ---------- render ----------
  render(ctx) {
    const W = this.engine.W;
    const blend = clamp(this.dayT / TUNING.days.lengthSec, 0, 1);
    const sky = skyFor(this.state.day, Math.max(0, (blend - 0.85) / 0.15));
    const starAmt = clamp((this.state.day - 1) / 2, 0, 1) * 0.9 + (this.phase === PHASE.WINNING ? 0.5 : 0);

    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));

    drawSky(ctx, W, this.engine.H, sky, this.now, clamp(starAmt, 0, 1));
    for (const layer of this.skylines) drawSkyline(ctx, layer, this.distance, W);
    drawTrack(ctx, W, this.distance, sky.glow);

    // líneas de velocidad en MODO SWAG
    if (Bal.comboActive(this.state, this.now) && !this.engine.reducedMotion) {
      ctx.strokeStyle = 'rgba(242,169,0,.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const yy = (this.now * 900 + i * 140) % this.engine.H;
        const xx = (i * 97) % W;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 60); ctx.stroke();
      }
    }

    // entidades de atrás hacia adelante
    const sorted = [...this.entities].sort((a, b) => b.z - a.z);
    for (const e of sorted) {
      if (e.scale <= 0) continue;
      if (e.kind === KIND.ITEM || e.kind === KIND.STAR) drawItem(ctx, e, this.now);
      else drawObstacle(ctx, e, this.now);
    }

    // jugador
    const invuln = this.now - this.state.lastHitAt < TUNING.player.invulnTime;
    this.player.render(ctx, W / 2, TUNING.groundY, invuln);

    this.particles.render(ctx);

    // destello de golpe
    if (this.flash > 0) {
      const g = ctx.createRadialGradient(W / 2, this.engine.H / 2, 80, W / 2, this.engine.H / 2, 460);
      g.addColorStop(0, 'rgba(215,38,46,0)');
      g.addColorStop(1, `rgba(215,38,46,${this.flash * 0.55})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, this.engine.H);
    }
    ctx.restore();
  }
}
