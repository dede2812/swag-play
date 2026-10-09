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
    coinsCollected: 0,      // ⚡ monedas Energía SWAG recogidas
    ringsPassed: 0,         // anillos de precisión atravesados
    cardCollected: false,   // carta SWAG oculta
    abilitiesUsed: 0,
    hits: 0,
    lastHitAt: -Infinity,
  };
}

// El drenaje lo define el nivel (no el día): curva suave por progreso 0..1
export function drainPerSec(base, progress) {
  return base * (1 + progress * 0.25);
}

// Avanza el ritmo por tiempo (rate = drenaje/s del nivel); true si sigue con vida
export function tickEnergy(state, dt, rate) {
  state.energy = Math.max(0, state.energy - rate * dt);
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

export function collectCoin(state) {
  state.coinsCollected++;
  state.energy = Math.min(TUNING.energy.max, state.energy + 1.5); // respiro pequeño
}

export function passRing(state) {
  state.ringsPassed++;
}

export function collectCard(state) {
  state.cardCollected = true;
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
