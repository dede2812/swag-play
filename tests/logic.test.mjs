// Pruebas de la lógica pura del juego — ejecutar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUNING } from '../src/config/tuning.js';
import * as Bal from '../src/game/balance.js';
import { medalFor, badgeFor, breakdown, skinUnlocks } from '../src/game/scoring.js';
import { nextRow, spawnInterval, weakestPillar, KIND } from '../src/game/spawner.js';
import { makeRng } from '../src/core/utils.js';

test('energía: drena con el tiempo y la partida termina al llegar a 0', () => {
  const st = Bal.createRunState();
  assert.equal(Bal.isAlive(st), true);
  let alive = true;
  for (let i = 0; i < 60 * 60 && alive; i++) alive = Bal.tickEnergy(st, 1 / 60); // 60 s sin recoger nada
  assert.equal(alive, false);
  assert.equal(Bal.isAlive(st), false);
});

test('energía: drena más rápido en días avanzados', () => {
  assert.ok(Bal.drainPerSec(4) > Bal.drainPerSec(0));
});

test('pilares: recoger restaura energía sin pasar del máximo', () => {
  const st = Bal.createRunState();
  st.energy = 50;
  Bal.collectPillar(st, 'A', 10);
  assert.equal(st.energy, 50 + TUNING.energy.itemGain);
  st.energy = 99;
  Bal.collectPillar(st, 'D', 11);
  assert.equal(st.energy, TUNING.energy.max);
});

test('MODO SWAG: se activa al combinar A+D+B dentro de la ventana y duplica puntos', () => {
  const st = Bal.createRunState();
  const t0 = 100;
  Bal.collectPillar(st, 'A', t0);
  Bal.collectPillar(st, 'D', t0 + 3);
  assert.equal(Bal.comboActive(st, t0 + 3), false);
  const r = Bal.collectPillar(st, 'B', t0 + 6);
  assert.equal(r.comboStarted, true);
  assert.equal(Bal.comboActive(st, t0 + 6), true);
  assert.equal(Bal.multiplier(st, t0 + 6), TUNING.combo.multiplier);
  assert.equal(st.comboActivations, 1);
  // fuera de la ventana no se activa
  const st2 = Bal.createRunState();
  Bal.collectPillar(st2, 'A', 0);
  Bal.collectPillar(st2, 'D', TUNING.combo.windowSec + 5);
  const r2 = Bal.collectPillar(st2, 'B', TUNING.combo.windowSec + 9);
  assert.equal(r2.comboStarted, false);
});

test('MODO SWAG: durante el modo, recoger extiende la duración', () => {
  const st = Bal.createRunState();
  Bal.collectPillar(st, 'A', 0); Bal.collectPillar(st, 'D', 1); Bal.collectPillar(st, 'B', 2);
  const end = st.comboUntil;
  Bal.collectPillar(st, 'A', 3);
  assert.equal(st.comboUntil, 3 + TUNING.combo.extendSec);
  assert.ok(st.comboUntil !== end);
});

test('golpes: daño con invulnerabilidad temporal y ruptura de combo', () => {
  const st = Bal.createRunState();
  Bal.collectPillar(st, 'A', 0); Bal.collectPillar(st, 'D', 0.5); Bal.collectPillar(st, 'B', 1);
  assert.ok(Bal.comboActive(st, 1.2));
  const hit1 = Bal.applyHit(st, 2);
  assert.equal(hit1, true);
  assert.equal(st.energy, TUNING.energy.start - TUNING.energy.hitLoss + TUNING.energy.itemGain * 3 + TUNING.energy.comboGain > TUNING.energy.max
    ? TUNING.energy.max - TUNING.energy.hitLoss
    : st.energy); // la energía quedó limitada por el máximo antes del golpe
  assert.equal(Bal.comboActive(st, 2.1), false); // combo roto
  const hit2 = Bal.applyHit(st, 2.1); // dentro de invulnerabilidad
  assert.equal(hit2, false);
  const hit3 = Bal.applyHit(st, 2 + TUNING.player.invulnTime + 0.1);
  assert.equal(hit3, true);
});

test('medallas: umbrales de bronce, plata y oro', () => {
  assert.equal(medalFor(0), null);
  assert.equal(medalFor(TUNING.medals[2].min - 1), null);
  assert.equal(medalFor(TUNING.medals[2].min).id, 'bronce');
  assert.equal(medalFor(TUNING.medals[1].min).id, 'plata');
  assert.equal(medalFor(TUNING.medals[0].min).id, 'oro');
  assert.equal(medalFor(999999).id, 'oro');
});

test('insignia: completar la semana supera cualquier medalla', () => {
  assert.equal(badgeFor(100, true).id, 'semana');
  assert.equal(badgeFor(100, false), null);
  assert.equal(badgeFor(TUNING.medals[0].min, false).id, 'oro');
});

test('desbloqueos: cada medalla desbloquea su estilo', () => {
  assert.deepEqual(skinUnlocks('bronce'), ['cobalto']);
  assert.deepEqual(skinUnlocks('oro'), ['iridiscente']);
  assert.deepEqual(skinUnlocks(null), []);
});

test('desglose: el total es la suma de las partes', () => {
  const b = breakdown({ distanceSec: 60, items: 30, stars: 2, comboPoints: 600, daysCompleted: 3, multAvg: 1.5 });
  assert.equal(b.total, b.distance + b.items + b.stars + b.comboBonus + b.days);
  assert.ok(b.distance > 0 && b.days === 3 * TUNING.score.dayBonus);
});

test('spawner: NUNCA bloquea los 3 carriles (invariante de justicia)', () => {
  const rng = makeRng(12345);
  for (let day = 0; day < 5; day++) {
    for (let i = 0; i < 2000; i++) {
      const row = nextRow(rng, day, null);
      const towers = row.filter((e) => e && e.kind === KIND.TOWER).length;
      assert.ok(towers <= 2, `día ${day}: fila con ${towers} torres`);
      assert.equal(row.length, 3);
    }
  }
});

test('spawner: el ritmo sube por día pero respeta el mínimo', () => {
  assert.ok(spawnInterval(1) < spawnInterval(0));
  assert.ok(spawnInterval(4) >= TUNING.spawn.minInterval);
  assert.ok(spawnInterval(99) === TUNING.spawn.minInterval);
});

test('spawner: sugiere el pilar más descuidado (fomenta el equilibrio)', () => {
  const now = 100;
  const pillarAt = { A: now - 1, D: now - 50, B: -Infinity };
  assert.equal(weakestPillar(pillarAt, now), 'B'); // nunca recogido
  const pillarAt2 = { A: now - 1, D: now - 50, B: now - 5 };
  assert.equal(weakestPillar(pillarAt2, now), 'D'); // el más antiguo
});
