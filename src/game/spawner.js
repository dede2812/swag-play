// Generador de filas de entidades — puro (rng inyectable) para pruebas.
// Regla de diseño: NUNCA se bloquean los 3 carriles a la vez; si hay 2 torres,
// el carril restante queda libre o contiene una barrera saltable.
import { TUNING } from '../config/tuning.js';

export const KIND = { ITEM: 'item', STAR: 'star', TOWER: 'tower', BARRIER: 'barrier' };

export function spawnInterval(day) {
  return Math.max(
    TUNING.spawn.minInterval,
    TUNING.spawn.baseInterval + day * TUNING.spawn.intervalPerDay
  );
}

// pillarBias: pilar menos recogido recientemente (fomenta el equilibrio)
export function nextRow(rng, day, pillarBias = null) {
  const S = TUNING.spawn;
  const row = [null, null, null];
  const lanes = [0, 1, 2].sort(() => rng() - 0.5);

  let blocked = 0; // carriles con torre (no saltable)
  for (const lane of lanes) {
    const roll = rng();
    if (roll < S.obstacleWeight && blocked < 2) {
      const low = rng() < S.lowObstacleChance;
      if (!low) blocked++;
      row[lane] = { kind: low ? KIND.BARRIER : KIND.TOWER, lane };
    } else if (roll < S.obstacleWeight + S.itemWeight) {
      const pillar = pillarBias && rng() < 0.55 ? pillarBias : 'ADB'[Math.floor(rng() * 3)];
      row[lane] = { kind: KIND.ITEM, lane, pillar };
    } else if (rng() < S.starChance) {
      row[lane] = { kind: KIND.STAR, lane };
    }
  }

  // Invariante de seguridad: al menos un carril pasable (libre, ítem o barrera)
  const passable = row.some((e) => !e || e.kind !== KIND.TOWER);
  if (!passable) {
    const lane = Math.floor(rng() * 3);
    row[lane] = { kind: KIND.BARRIER, lane };
  }
  return row;
}

// Elige el pilar con más tiempo sin recogerse
export function weakestPillar(pillarAt, now) {
  let worst = 'A', worstAgo = -1;
  for (const p of ['A', 'D', 'B']) {
    const at = pillarAt[p] ?? -Infinity;
    if (!Number.isFinite(at)) return p; // nunca recogido
    const ago = now - at;
    if (ago > worstAgo) { worstAgo = ago; worst = p; }
  }
  return worst;
}
