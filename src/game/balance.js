// Lógica pura de energía, pilares y MODO SWAG (sin DOM: se prueba en Node)
import { TUNING } from '../config/tuning.js';

export function createRunState() {
  return {
    energy: TUNING.energy.start,
    day: 0,
    // ventana rodante de pilares: timestamp de la última recogida de cada pilar
    pillarAt: { A: -Infinity, D: -Infinity, B: -Infinity },
    comboUntil: -Infinity,   // fin del MODO SWAG activo
    comboActivations: 0,
    itemsCollected: 0,
    starsCollected: 0,
    hits: 0,
    lastHitAt: -Infinity,
  };
}

export function drainPerSec(day) {
  return TUNING.energy.drainPerSec + day * TUNING.energy.drainPerDay;
}

// Avanza la energía por tiempo; devuelve true si el jugador sigue con vida
export function tickEnergy(state, dt) {
  state.energy = Math.max(0, state.energy - drainPerSec(state.day) * dt);
  return state.energy > 0;
}

export function comboActive(state, now) {
  return now < state.comboUntil;
}

export function multiplier(state, now) {
  return comboActive(state, now) ? TUNING.combo.multiplier : 1;
}

// Pilares encendidos dentro de la ventana de combo
export function litPillars(state, now) {
  const w = TUNING.combo.windowSec;
  return ['A', 'D', 'B'].filter((p) => now - state.pillarAt[p] <= w);
}

// Recoger ítem de pilar. Devuelve { comboStarted:boolean }
export function collectPillar(state, pillar, now) {
  state.pillarAt[pillar] = now;
  state.itemsCollected++;
  state.energy = Math.min(TUNING.energy.max, state.energy + TUNING.energy.itemGain);
  let comboStarted = false;
  if (comboActive(state, now)) {
    state.comboUntil = now + TUNING.combo.extendSec; // extiende el modo
  } else if (litPillars(state, now).length === 3) {
    state.comboUntil = now + TUNING.combo.durationSec;
    state.comboActivations++;
    state.energy = Math.min(TUNING.energy.max, state.energy + TUNING.energy.comboGain);
    comboStarted = true;
  }
  return { comboStarted };
}

export function collectStar(state) {
  state.starsCollected++;
}

// Golpe de obstáculo (respeta invulnerabilidad). Devuelve true si aplicó daño.
export function applyHit(state, now) {
  if (now - state.lastHitAt < TUNING.player.invulnTime) return false;
  state.lastHitAt = now;
  state.hits++;
  state.energy = Math.max(0, state.energy - TUNING.energy.hitLoss);
  state.comboUntil = -Infinity; // el golpe rompe el MODO SWAG
  return true;
}

export function isAlive(state) {
  return state.energy > 0;
}
