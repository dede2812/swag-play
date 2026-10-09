// Pruebas unitarias de la lógica pura de SWAG RUSH v2 (sin DOM)
// Ejecutar: bun test  ·  node --test (Node 22+)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ABILITIES, UPGRADE_COST, createAbilityState, cast, canCast, activeMap, effectsOf, bestLane } from '../src/config/abilities.js';
import { LEVELS, levelById, phaseFor } from '../src/config/levels.js';
import { EARN, SKINS, EFFECTS, CARDS, coinsEarned, spend, canAfford } from '../src/config/economy.js';
import { starsFor, breakdown } from '../src/game/scoring.js';
import { KIND, patternRows, pickPattern, weakestPillar } from '../src/game/spawner.js';
import * as Bal from '../src/game/balance.js';
import { makeRng } from '../src/core/utils.js';

// ---------- Habilidades (Academia) ----------
describe('habilidades', () => {
  test('solo existen las desbloqueadas y cada una tiene grado', () => {
    const slots = createAbilityState({ velocidad: 1, concentracion: 2 });
    assert.equal(Object.keys(slots).length, 2);
    assert.equal(slots.concentracion.lvl, 2);
    assert.equal(slots.multiplicador, undefined);
  });

  test('lanzar aplica duración y recarga del grado correcto', () => {
    const slots = createAbilityState({ velocidad: 2 });
    const ab = ABILITIES.find((a) => a.id === 'velocidad');
    assert.ok(cast(slots, 'velocidad', 10));
    assert.equal(slots.velocidad.activeUntil, 10 + ab.duration[1]);
    assert.equal(slots.velocidad.cdUntil, 10 + ab.cooldown[1]);
    // durante el efecto no se puede relanzar; durante la recarga tampoco
    assert.equal(canCast(slots, 'velocidad', 11), false);
    assert.equal(canCast(slots, 'velocidad', 10 + ab.cooldown[1] - 0.1), false);
    assert.equal(canCast(slots, 'velocidad', 10 + ab.cooldown[1]), true);
  });

  test('lanzar sin la habilidad o en recarga devuelve false', () => {
    const slots = createAbilityState({});
    assert.equal(cast(slots, 'memoria', 0), false);
  });

  test('effectsOf refleja las habilidades activas', () => {
    const slots = createAbilityState({ velocidad: 1, multiplicador: 3 });
    cast(slots, 'velocidad', 0);
    cast(slots, 'multiplicador', 0);
    const fx = effectsOf(activeMap(slots), 1);
    assert.equal(fx.speedBoost, true);
    assert.equal(fx.mult, true);
    assert.equal(fx.slowmo, false);
    const fx2 = effectsOf(activeMap(slots), 100);
    assert.equal(fx2.speedBoost, false);
  });

  test('mejorar sube duración y baja recarga (balance: nunca gratis)', () => {
    for (const ab of ABILITIES) {
      assert.ok(ab.duration[2] > ab.duration[0], `${ab.id}: duración crece`);
      assert.ok(ab.cooldown[2] < ab.cooldown[0], `${ab.id}: recarga baja`);
      assert.ok(ab.cooldown[2] > ab.duration[2] * 1.5, `${ab.id}: recarga siempre mayor que el efecto`);
    }
    assert.deepEqual(UPGRADE_COST, [0, 90, 180]);
  });

  test('bestLane evita torres y torres móviles, prefiere premios', () => {
    const ents = [
      { kind: 'tower', lane: 1, z: 200 },
      { kind: 'mover', lane: 0, laneB: 1, z: 300, moverLane: 0 },
      { kind: 'coin', lane: 2, z: 250 },
    ];
    assert.equal(bestLane(ents, 1), 2);
    // sin peligro se queda en el carril actual
    assert.equal(bestLane([{ kind: 'coin', lane: 0, z: 900 }], 1), 1);
  });
});

// ---------- Economía (Bienestar) ----------
describe('economía', () => {
  test('primera victoria paga el bonus ×2; repetir paga el 50%', () => {
    const first = coinsEarned({ level: 1, pickups: 10, flags: { cleared: true, firstClear: true } });
    const replay = coinsEarned({ level: 1, pickups: 10, flags: { cleared: true, replayed: true } });
    assert.ok(first.total > replay.total, 'la primera vez paga más');
    const baseClear = EARN.levelClear(1);
    assert.ok(first.rows.some((r) => r.n === baseClear * 2));
    assert.ok(replay.rows.some((r) => r.n === Math.round(baseClear * 0.5)));
  });

  test('estrellas nuevas pagan solo la diferencia (anti doble cobro)', () => {
    const a = coinsEarned({ level: 2, flags: { cleared: true, newStars: 2, prevStars: 0 } });
    const b = coinsEarned({ level: 2, flags: { cleared: true, newStars: 3, prevStars: 2 } });
    const sumA = a.rows.find((r) => r.label.includes('Estrellas')).n;
    const sumB = b.rows.find((r) => r.label.includes('Estrellas')).n;
    assert.equal(sumA, EARN.star[0] + EARN.star[1]);
    assert.equal(sumB, EARN.star[2]);
    // sin estrellas nuevas no hay fila de estrellas
    const c = coinsEarned({ level: 2, flags: { cleared: true, newStars: 2, prevStars: 2 } });
    assert.equal(c.rows.find((r) => r.label.includes('Estrellas')), undefined);
  });

  test('carta oculta y sin-golpes solo cuando corresponde', () => {
    const withCard = coinsEarned({ level: 3, flags: { cleared: true, cardNew: true, noHit: true } });
    assert.ok(withCard.rows.some((r) => r.label.includes('Carta')));
    assert.ok(withCard.rows.some((r) => r.label.includes('Sin golpes')));
    const lose = coinsEarned({ level: 3, flags: { cleared: false, cardNew: true, noHit: true } });
    assert.equal(lose.rows.find((r) => r.label.includes('Sin golpes')), undefined);
    assert.equal(lose.rows.find((r) => r.label.includes('Nivel superado')), undefined);
  });

  test('gastar respeta el saldo (sin negativos)', () => {
    assert.equal(canAfford(100, 90), true);
    assert.equal(spend(100, 90), 10);
    assert.equal(spend(50, 90), null);
  });

  test('catálogo: cada skin/efecto tiene coste y hay carta por nivel', () => {
    assert.ok(SKINS.every((s) => typeof s.cost === 'number'));
    assert.ok(EFFECTS.every((e) => typeof e.cost === 'number'));
    assert.equal(CARDS.length, 5);
    assert.equal(SKINS[0].cost, 0); // el clásico siempre gratis
  });
});

// ---------- Niveles (Deporte) ----------
describe('niveles', () => {
  test('hay 5 niveles progresivos con dificultad creciente', () => {
    assert.equal(LEVELS.length, 5);
    for (let i = 1; i < 5; i++) {
      assert.ok(LEVELS[i].speed1 > LEVELS[i - 1].speed1, 'velocidad final crece');
      assert.ok(LEVELS[i].lengthSec > LEVELS[i - 1].lengthSec, 'duración crece');
      assert.ok(LEVELS[i].stars[0] > LEVELS[i - 1].stars[0], 'umbrales de estrella crecen');
    }
    for (const lv of LEVELS) {
      assert.ok(lv.stars[0] < lv.stars[1] && lv.stars[1] < lv.stars[2]);
      assert.equal(lv.objectives.length, 3);
      assert.ok(lv.cardAt > 0.3 && lv.cardAt < 1);
    }
  });

  test('cada nivel introduce mecánicas (pool distinto, no solo velocidad)', () => {
    const pools = LEVELS.map((l) => l.pool.join(','));
    assert.equal(new Set(pools).size, 5, 'cada nivel tiene su propio pool de patrones');
    assert.ok(LEVELS[3].moverW > 0, 'nivel 4 introduce torres móviles');
    assert.ok(LEVELS[2].ringW > 0 || LEVELS[2].pool.includes('ringChallenge'), 'nivel 3 introduce anillos');
  });

  test('nivel 5 tiene 3 fases ordenadas', () => {
    const l5 = levelById(5);
    assert.equal(l5.phases.length, 3);
    assert.equal(phaseFor(l5, 0.1).name, l5.phases[0].name);
    assert.equal(phaseFor(l5, 0.5).name, l5.phases[1].name);
    assert.equal(phaseFor(l5, 0.9).name, l5.phases[2].name);
  });

  test('starsFor otorga 0..3 estrellas por umbral', () => {
    const l1 = levelById(1);
    assert.equal(starsFor(l1, 0), 0);
    assert.equal(starsFor(l1, l1.stars[0]), 1);
    assert.equal(starsFor(l1, l1.stars[2] + 500), 3);
  });
});

// ---------- Spawner: invariantes de justicia ----------
describe('spawner', () => {
  const BLOCKERS = new Set([KIND.TOWER, KIND.MOVER]);
  test('ningún patrón bloquea los 3 carriles (5000 filas por nivel)', () => {
    for (const lv of LEVELS) {
      const rng = makeRng(lv.id * 77);
      for (let i = 0; i < 5000; i++) {
        const pool = lv.pool;
        const rows = patternRows(rng, pickPattern(rng, pool), lv, null);
        for (const row of rows) {
          const blocked = row.filter((e) => e && BLOCKERS.has(e.kind)).length;
          assert.ok(blocked <= 2, `nivel ${lv.id}: fila injusta ${JSON.stringify(row)}`);
          const movers = row.filter((e) => e && e.kind === KIND.MOVER).length;
          assert.ok(movers <= 1, 'máximo 1 torre móvil por fila');
        }
      }
    }
  });

  test('las torres móviles siempre tienen destino distinto y válido', () => {
    const rng = makeRng(9);
    const lv = levelById(4);
    for (let i = 0; i < 2000; i++) {
      for (const row of patternRows(rng, pickPattern(rng, lv.pool), lv, null)) {
        for (const e of row) {
          if (e && e.kind === KIND.MOVER) {
            assert.notEqual(e.laneB, e.lane);
            assert.ok(e.laneB >= 0 && e.laneB <= 2);
          }
        }
      }
    }
  });

  test('weakestPillar sugiere el pilar más descuidado', () => {
    const now = 100;
    const p = weakestPillar({ A: 95, D: 10, B: 90 }, now);
    assert.equal(p, 'D');
    assert.equal(weakestPillar({ A: -Infinity, D: 1, B: 2 }, now), 'A');
  });
});

// ---------- Balance: ritmo, monedas, anillos, combo ----------
describe('balance', () => {
  test('el ritmo drena con la curva del nivel y muere a 0', () => {
    const st = Bal.createRunState();
    assert.ok(Bal.tickEnergy(st, 1, 2));
    st.energy = 1;
    assert.equal(Bal.tickEnergy(st, 1, 2), false);
    assert.ok(Bal.drainPerSec(2, 1) > Bal.drainPerSec(2, 0), 'drena más al final del nivel');
  });

  test('monedas, anillos y carta se registran', () => {
    const st = Bal.createRunState();
    Bal.collectCoin(st); Bal.collectCoin(st);
    Bal.passRing(st);
    Bal.collectCard(st);
    assert.equal(st.coinsCollected, 2);
    assert.equal(st.ringsPassed, 1);
    assert.equal(st.cardCollected, true);
  });

  test('MODO SWAG: 3 pilares en ventana, ×2, golpe lo rompe', () => {
    const st = Bal.createRunState();
    Bal.collectPillar(st, 'A', 0);
    Bal.collectPillar(st, 'D', 1);
    const r = Bal.collectPillar(st, 'B', 2);
    assert.equal(r.comboStarted, true);
    assert.equal(Bal.multiplier(st, 3), 2);
    Bal.applyHit(st, 4);
    assert.equal(Bal.multiplier(st, 4.5), 1);
  });
});

// ---------- Desglose de puntuación ----------
describe('puntuación', () => {
  test('el desglose suma el total y omite filas en cero', () => {
    const bd = breakdown({ distance: 500, items: 300, stars: 0, rings: 150, coinScore: 25, combo: 0, clear: 500 });
    assert.equal(bd.total, 1475);
    assert.ok(bd.rows.every(([, v]) => v > 0));
    assert.equal(bd.rows.find(([k]) => k.includes('Estrellas')), undefined);
  });
});
