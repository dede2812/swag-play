// Escena principal: un nivel de la semana imposible.
// DEPORTE: esquivar, saltar, reaccionar · ACADEMIA: habilidades con recarga
// BIENESTAR: monedas ⚡ y ritmo · todo conectado en el mismo sistema.
import { TUNING } from '../config/tuning.js';
import { PILLARS, BRAND } from '../config/brand.js';
import { phaseFor } from '../config/levels.js';
import { ABILITIES, abilityById, createAbilityState, cast, activeMap, effectsOf, bestLane } from '../config/abilities.js';
import { clamp, lerp, makeRng, rand } from '../core/utils.js';
import { audio } from '../core/audio.js';
import { Particles } from '../game/particles.js';
import { Player } from '../game/player.js';
import { buildSkylines, drawSky, drawSkyline, drawTrack, project, skyFor } from '../game/world.js';
import { drawItem, drawObstacle, drawXrayMarker, drawGuideArrow } from '../game/entities.js';
import { KIND, patternRows, pickPattern, weakestPillar } from '../game/spawner.js';
import * as Bal from '../game/balance.js';
import { fmt } from '../game/scoring.js';
import { hint, hideCoach } from '../game/coach.js';

const PHASE = { COUNTDOWN: 'countdown', RUNNING: 'running', PAUSED: 'paused', WINNING: 'winning', DYING: 'dying' };

export class PlayScene {
  constructor(engine, ui, onEnd) {
    this.engine = engine;
    this.ui = ui;
    this.onEnd = onEnd;
    const urlSeed = new URLSearchParams(location.search).get('seed');
    this.rng = makeRng(urlSeed ? Number(urlSeed) : (Date.now() % 2147483647) || 42);
    this.skylines = buildSkylines(makeRng(7));
  }

  enter({ level, skin, effect, abilities, firstRun }) {
    this.level = level;
    this.effectColor = effect?.color || null;
    this.player = new Player();
    if (skin) this.player.setSkin(skin);
    this.state = Bal.createRunState();
    this.slots = createAbilityState(abilities || {});
    this.firstRun = firstRun;
    this.entities = [];
    this.patternQueue = [];
    this.cardSpawned = false;
    this.particles = new Particles(this.engine.reducedMotion);
    this.phase = PHASE.COUNTDOWN;
    this.now = 0;
    this.distance = 0;
    this.levelT = 0;
    this.spawnT = -0.6;
    this.speed = level.speed0;
    this.phaseName = null;
    this.acc = { distance: 0, items: 0, stars: 0, rings: 0, coinScore: 0, combo: 0, clear: 0 };
    this.abilityFx = { slowmo: 0, scan: 0, cast: 0 };
    this.shake = 0;
    this.flash = 0;
    this.cdT = 0;
    this.cdStep = -1;
    this.endT = 0;
    this.lastScoreShown = -1;
    this.lastCoinsShown = -1;
    this.pausedFrom = null;
    this.ui.showHud(true);
    this.ui.setPips([]);
    this.ui.showCombo(false);
    this.ui.setEnergy(1);
    this.ui.setScore('0');
    this.ui.setCoins(0);
    this.ui.setLevelChip(level);
    this.ui.buildAbilityBar(ABILITIES, this.slots, level.id);
  }

  exit() {
    this.ui.showHud(false);
    this.ui.showCombo(false);
    hideCoach();
    audio.musicStop();
  }

  pause() {
    if (this.phase !== PHASE.RUNNING) return;
    this.phase = PHASE.PAUSED;
    audio.musicStop();
    this.ui.showPause(true, `${this.level.day} · ${this.level.name}`);
  }

  resume() {
    if (this.phase !== PHASE.PAUSED) return;
    this.phase = PHASE.RUNNING;
    this.ui.showPause(false);
    audio.musicStart();
    this.spawnT = Math.min(this.spawnT, -0.5);
  }

  quitToMenu() { this.onEnd(null); }

  progress() { return clamp(this.levelT / this.level.lengthSec, 0, 1); }

  // ---------- entrada ----------
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
    if (a.startsWith('ab')) this._castAbility(a.slice(2));
  }

  _castAbility(key) {
    const ab = ABILITIES.find((x) => x.key === key);
    if (!ab) return;
    if (cast(this.slots, ab.id, this.now)) {
      this.state.abilitiesUsed++;
      this.abilityFx.cast = 1;
      const cx = this.engine.W / 2;
      this.particles.popup(cx, 300, `${ab.ico} ${ab.name.toUpperCase()}`, ab.color, 30);
      this.particles.burst(cx, TUNING.groundY - 60, ab.color, 22, 380);
      audio.ability();
      if (ab.id === 'concentracion') this.abilityFx.slowmo = 1;
      if (ab.id === 'memoria') this.abilityFx.scan = 1;
    } else {
      audio.deny();
    }
    this._syncAbilityBar();
  }

  _syncAbilityBar() {
    this.ui.updateAbilityBar(ABILITIES, this.slots, this.now);
  }

  _updateCountdown(dt) {
    this.cdT += dt;
    this.distance += this.speed * 0.35 * dt;
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
    this.ui.banner(`${this.level.day} · ${this.level.name}`);
    audio.musicStart();
    if (this.firstRun) hint('move', { ms: 3600 });
  }

  fx() { return effectsOf(activeMap(this.slots), this.now); }

  scoreMult() {
    const f = this.fx();
    return Bal.multiplier(this.state, this.now) * (f.mult ? 3 : 1);
  }

  _updateRunning(dt) {
    const st = this.state;
    const prog = this.progress();
    const level = this.level;

    // fases (nivel 5)
    const ph = phaseFor(level, prog);
    if (ph && ph.name !== this.phaseName) {
      this.phaseName = ph.name;
      this.ui.banner(ph.name);
      this.spawnT = Math.min(this.spawnT, -TUNING.spawn.graceSec);
      audio.day();
    }

    const f = this.fx();
    const targetSpeed = lerp(level.speed0, level.speed1, prog) * (ph?.speedMul || 1);
    this.speed = lerp(this.speed, targetSpeed, 1 - Math.exp(-1.2 * dt));
    const worldFactor = (f.slowmo ? 0.55 : 1) * (f.speedBoost ? 1.45 : 1);
    const effSpeed = this.speed * worldFactor;
    this.distance += effSpeed * dt;
    this.levelT += dt;

    // puntuación por distancia (Velocidad suma +50%)
    const mult = this.scoreMult();
    this.acc.distance += TUNING.score.distancePerSec * mult * (f.speedBoost ? 1.5 : 1) * dt;

    // ritmo (antes «energía» del jugador)
    if (!Bal.tickEnergy(st, dt, Bal.drainPerSec(level.drain, prog))) return this._beginEnd(false);

    // fin de nivel
    if (this.levelT >= level.lengthSec) {
      this.acc.clear = TUNING.score.clearBonus(level.id);
      return this._beginEnd(true);
    }

    // spawns por patrones del nivel/fase
    this.spawnT += dt;
    const interval = Math.max(level.minInterval, level.interval - prog * 0.16);
    if (this.spawnT >= interval) {
      this.spawnT = 0;
      if (!this.patternQueue.length) {
        // carta oculta una sola vez por nivel
        if (!this.cardSpawned && prog >= level.cardAt) {
          this.cardSpawned = true;
          const lane = Math.floor(this.rng() * 3);
          this.patternQueue.push([null, null, null].map((_, l) => l === lane ? { kind: KIND.CARD, lane } : null));
        } else {
          const pool = ph?.pool || level.pool;
          const rows = patternRows(this.rng, pickPattern(this.rng, pool), level, weakestPillar(st.pillarAt, this.now));
          this.patternQueue.push(...rows);
        }
      }
      const row = this.patternQueue.shift();
      row.forEach((e, i) => {
        if (!e) return;
        this.entities.push({ ...e, z: TUNING.farZ + rand(-20, 20), scale: 0, x: 0, y: 0 });
      });
    }

    // entidades
    const cx = this.engine.W / 2;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.z -= effSpeed * dt;
      if (e.kind === KIND.MOVER) {
        const t = this.now * 1.7 + (e.phase || 0);
        e.moverLane = e.lane + (e.laneB - e.lane) * (0.5 + 0.5 * Math.sin(t));
      }
      const pr = project(e.z, e.moverLane ?? e.lane, cx);
      e.x = pr.x; e.y = pr.y; e.scale = pr.scale;
      if (e.z < 70 && e.z > -50) {
        const isPickup = [KIND.ITEM, KIND.STAR, KIND.COIN, KIND.RING, KIND.CARD].includes(e.kind);
        if (isPickup && e.lane === this.player.lane) { this._collect(e); this.entities.splice(i, 1); continue; }
        if (!isPickup) {
          const laneHit = e.kind === KIND.MOVER ? Math.abs((e.moverLane ?? e.lane) - this.player.lane) < 0.42 : e.lane === this.player.lane;
          if (laneHit) { this._hit(e); this.entities.splice(i, 1); continue; }
        }
      }
      if (e.z < -60) this.entities.splice(i, 1);
    }

    // coach contextual
    this._coach(prog);

    // jugador y efectos
    this.player.update(dt, effSpeed);
    if (this.player.grounded && !this.engine.reducedMotion && Math.random() < 0.5) {
      this.particles.trail(cx + this.player.x * TUNING.laneSpreadNear, TUNING.groundY + 4, this.effectColor || 'rgba(184,197,214,.5)');
    }
    this.shake = Math.max(0, this.shake - dt * 26);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.abilityFx.slowmo = Math.max(0, this.abilityFx.slowmo - dt * 0.8);
    this.abilityFx.scan = Math.max(0, this.abilityFx.scan - dt * 1.2);
    this.abilityFx.cast = Math.max(0, this.abilityFx.cast - dt * 2);

    // HUD
    this.ui.setEnergy(st.energy / TUNING.energy.max);
    this.ui.setProgress(prog);
    const sc = this._score();
    if (sc !== this.lastScoreShown) { this.ui.setScore(fmt(sc)); this.lastScoreShown = sc; }
    if (st.coinsCollected !== this.lastCoinsShown) { this.ui.setCoins(st.coinsCollected); this.lastCoinsShown = st.coinsCollected; }
    this.ui.setPips(Bal.litPillars(st, this.now));
    this.ui.showCombo(Bal.comboActive(st, this.now), f.mult);
    this._syncAbilityBar();
  }

  _coach(prog) {
    const st = this.state;
    if (prog > 0.02 && this.slots.velocidad) hint('ability');
    for (const e of this.entities) {
      if (e.kind === KIND.BARRIER && e.z < 420 && e.lane === this.player.lane) { hint('jump'); break; }
    }
    for (const e of this.entities) {
      if (e.kind === KIND.COIN && e.z < 500) { hint('coins'); break; }
      if (e.kind === KIND.MOVER && e.z < 560) { hint('mover'); break; }
      if (e.kind === KIND.RING && e.z < 500) { hint('ring'); break; }
    }
    if (Bal.litPillars(st, this.now).length === 2) hint('combo');
    if (st.energy < 30) hint('ritmo');
  }

  _collect(e) {
    const st = this.state;
    const mult = this.scoreMult();
    switch (e.kind) {
      case KIND.STAR: {
        Bal.collectStar(st);
        const pts = TUNING.score.star * mult;
        this.acc.stars += pts;
        this.particles.popup(e.x, e.y - 60, `+${pts}`, BRAND.gold, 26);
        this.particles.burst(e.x, e.y - 40, BRAND.gold, 18, 300);
        audio.star();
        return;
      }
      case KIND.COIN: {
        Bal.collectCoin(st);
        this.acc.coinScore += TUNING.score.coinScore * mult;
        this.particles.popup(e.x, e.y - 60, '+1 ⚡', BRAND.cyan, 20);
        this.particles.burst(e.x, e.y - 40, BRAND.cyan, 10, 220);
        audio.coin();
        return;
      }
      case KIND.RING: {
        Bal.passRing(st);
        const pts = TUNING.score.ring * mult;
        this.acc.rings += pts;
        this.particles.popup(e.x, e.y - 60, `¡PRECISIÓN! +${pts}`, BRAND.gold, 22);
        this.particles.ring(e.x, e.y - 34, BRAND.gold);
        audio.ring();
        return;
      }
      case KIND.CARD: {
        Bal.collectCard(st);
        this.particles.popup(this.engine.W / 2, 280, '🂠 ¡CARTA SWAG OCULTA!', '#FFFFFF', 28);
        this.particles.burst(e.x, e.y - 40, '#FFFFFF', 24, 340);
        audio.cardFound();
        return;
      }
      default: {
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
    }
  }

  _hit(e) {
    if (e.kind === KIND.BARRIER && this.player.jumpY > 45) {
      this.acc.items += 20;
      this.particles.popup(e.x, e.y - 70, '¡SALVO! +20', BRAND.aquaLight, 18);
      return;
    }
    const applied = Bal.applyHit(this.state, this.now);
    if (!applied) return;
    this.shake = this.engine.reducedMotion ? 0 : 11;
    this.flash = 0.65;
    this.particles.burst(e.x, e.y - 50, BRAND.red, 20, 340);
    this.particles.popup(e.x, e.y - 90, `-${TUNING.energy.hitLoss} RITMO`, BRAND.redLight, 22);
    audio.hit();
    if (!Bal.isAlive(this.state)) this._beginEnd(false);
  }

  _beginEnd(win) {
    this.phase = win ? PHASE.WINNING : PHASE.DYING;
    this.endT = 0;
    audio.musicStop();
    if (win) {
      this.ui.banner(this.level.id === 5 ? '¡SEMANA COMPLETADA!' : '¡NIVEL SUPERADO!');
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
      const pr = project(e.z, e.moverLane ?? e.lane, this.engine.W / 2);
      e.x = pr.x; e.y = pr.y; e.scale = pr.scale;
    }
    this.shake = Math.max(0, this.shake - dt * 20);
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.endT += dt;
    if (this.phase === PHASE.WINNING && this.endT < 1.6 && Math.random() < 0.3) {
      this.particles.confetti(this.engine.W, this.engine.H * 0.5, 6);
    }
    const wait = this.phase === PHASE.WINNING ? 2.4 : 1.8;
    if (this.endT >= wait) {
      const won = this.phase === PHASE.WINNING;
      this.phase = 'done';
      this.onEnd(this._results(won));
    }
  }

  _score() {
    const a = this.acc;
    return Math.round(a.distance + a.items + a.stars + a.rings + a.coinScore + a.combo + a.clear);
  }

  _results(win) {
    return {
      win,
      levelId: this.level.id,
      score: this._score(),
      acc: { ...this.acc, distance: Math.round(this.acc.distance) },
      stats: {
        items: this.state.itemsCollected,
        stars: this.state.starsCollected,
        coins: this.state.coinsCollected,
        rings: this.state.ringsPassed,
        hits: this.state.hits,
        combos: this.state.comboActivations,
        abilitiesUsed: this.state.abilitiesUsed,
        card: this.state.cardCollected,
        noHit: this.state.hits === 0,
        timeSec: Math.round(this.now),
      },
    };
  }

  // ---------- render ----------
  render(ctx) {
    const W = this.engine.W;
    const H = this.engine.H;
    const prog = this.progress();
    const sky = skyFor(this.level.id - 1, clamp((prog - 0.82) / 0.18, 0, 1));
    const starAmt = clamp((this.level.id - 1) / 2, 0, 1) * 0.9 + (this.phase === PHASE.WINNING ? 0.5 : 0);
    const f = this.phase === PHASE.RUNNING ? this.fx() : {};

    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));

    drawSky(ctx, W, H, sky, this.now, clamp(starAmt, 0, 1));
    for (const layer of this.skylines) drawSkyline(ctx, layer, this.distance, W);
    drawTrack(ctx, W, this.distance, sky.glow);

    // MEMORIA: pistas de lo que viene
    if (f.xray) {
      for (const e of this.entities) {
        if (e.z > 520) drawXrayMarker(ctx, e.x, TUNING.horizonY + 14, e);
      }
    }
    // ESTRATEGIA: mejor carril
    if (f.guide) {
      const lane = bestLane(this.entities, this.player.lane);
      const x = W / 2 + (lane - 1) * TUNING.laneSpreadNear;
      drawGuideArrow(ctx, x, TUNING.groundY + 58, this.now);
    }

    // líneas de velocidad (MODO SWAG, Velocidad o Multiplicador)
    if ((f.speedBoost || f.mult || Bal.comboActive(this.state, this.now)) && !this.engine.reducedMotion) {
      ctx.strokeStyle = f.mult ? 'rgba(242,169,0,.4)' : 'rgba(53,214,230,.32)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const yy = (this.now * 900 + i * 140) % H;
        const xx = (i * 97) % W;
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 60); ctx.stroke();
      }
    }

    // entidades de atrás hacia adelante
    const sorted = [...this.entities].sort((a, b) => b.z - a.z);
    for (const e of sorted) {
      if (e.scale <= 0) continue;
      if ([KIND.ITEM, KIND.STAR, KIND.COIN, KIND.RING, KIND.CARD].includes(e.kind)) drawItem(ctx, e, this.now);
      else drawObstacle(ctx, e, this.now);
    }

    // jugador
    const invuln = this.now - this.state.lastHitAt < TUNING.player.invulnTime;
    this.player.render(ctx, W / 2, TUNING.groundY, invuln);

    // aura de habilidad activa
    const activeId = Object.entries(activeMap(this.slots)).find(([, until]) => until > this.now)?.[0];
    if (activeId) {
      const ab = abilityById(activeId);
      const x = W / 2 + this.player.x * TUNING.laneSpreadNear;
      const jumpH = this.player.jumpY * 0.35;
      ctx.save();
      ctx.strokeStyle = ab.color;
      ctx.globalAlpha = 0.55 + Math.sin(this.now * 8) * 0.2;
      ctx.lineWidth = 3;
      ctx.shadowColor = ab.color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.ellipse(x, TUNING.groundY - jumpH - 50, 40, 58, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    this.particles.render(ctx);

    // CONCENTRACIÓN: viñeta azul de calma
    if (f.slowmo) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 480);
      g.addColorStop(0, 'rgba(52,86,232,0)');
      g.addColorStop(1, 'rgba(52,86,232,.34)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // MEMORIA: barrido de escaneo violeta al activar
    if (this.abilityFx.scan > 0) {
      const y = H * (1 - this.abilityFx.scan);
      const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
      g.addColorStop(0, 'rgba(146,115,239,0)');
      g.addColorStop(0.5, `rgba(146,115,239,${0.35 * this.abilityFx.scan})`);
      g.addColorStop(1, 'rgba(146,115,239,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 60, W, 120);
    }
    // MULTIPLICADOR: brillo dorado en esquinas
    if (f.mult) {
      ctx.fillStyle = `rgba(242,169,0,${0.05 + Math.sin(this.now * 6) * 0.02})`;
      ctx.fillRect(0, 0, W, H);
    }
    // destello de golpe
    if (this.flash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 460);
      g.addColorStop(0, 'rgba(215,38,46,0)');
      g.addColorStop(1, `rgba(215,38,46,${this.flash * 0.55})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
}
