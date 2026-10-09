// Generador de entidades por nivel — puro (rng inyectable) para pruebas.
// Invariantes de justicia:
//  · NUNCA hay 3 torres/barreras no superables a la vez en una fila.
//  · Máximo 1 torre móvil por fila y nunca junto a 2 torres estáticas.
//  · La carta oculta y los anillos siempre aparecen en carril alcanzable.
export const KIND = {
  ITEM: 'item', STAR: 'star', TOWER: 'tower', BARRIER: 'barrier',
  COIN: 'coin', RING: 'ring', CARD: 'card', MOVER: 'mover',
};

const PATTERNS = ['mixed', 'coinsLine', 'gate', 'slalom', 'barrierRun', 'ringChallenge', 'moverWatch'];

export function spawnInterval(level, phase) {
  const iv = level.interval;
  return Math.max(level.minInterval, iv);
}

// Elige un patrón del pool del nivel/fase
export function pickPattern(rng, pool) {
  const list = pool && pool.length ? pool.filter((p) => PATTERNS.includes(p)) : ['mixed'];
  return list[Math.floor(rng() * list.length)];
}

// Fila aleatoria clásica (patrón «mixed»), con sesgo al pilar más descuidado
function mixedRow(rng, level, pillarBias) {
  const row = [null, null, null];
  const lanes = shuffled(rng);
  let hard = 0;   // carriles con torre
  let movers = 0; // máximo 1 torre móvil por fila
  for (const lane of lanes) {
    const roll = rng();
    if (roll < 0.34 && hard < 2) {
      const low = rng() < 0.45;
      if (low) row[lane] = { kind: KIND.BARRIER, lane };
      else {
        hard++;
        const ob = movers === 0 ? maybeMover(rng, level, lane) : { kind: KIND.TOWER, lane };
        if (ob.kind === KIND.MOVER) movers++;
        row[lane] = ob;
      }
    } else if (roll < 0.34 + 0.5) {
      row[lane] = pickup(rng, pillarBias, lane, level);
    } else if (rng() < 0.05) {
      row[lane] = { kind: KIND.STAR, lane };
    }
  }
  return ensurePassable(row, rng);
}

function maybeMover(rng, level, lane) {
  if (level.moverW > 0 && rng() < level.moverW) {
    const dir = rng() < 0.5 ? -1 : 1;
    const target = Math.min(2, Math.max(0, lane + dir));
    if (target !== lane) return { kind: KIND.MOVER, lane, laneB: target, phase: rng() * Math.PI * 2 };
  }
  return { kind: KIND.TOWER, lane };
}

function pickup(rng, pillarBias, lane, level) {
  if (rng() < 0.3) return { kind: KIND.COIN, lane };
  const pillar = pillarBias && rng() < 0.55 ? pillarBias : 'ADB'[Math.floor(rng() * 3)];
  return { kind: KIND.ITEM, lane, pillar };
}

function shuffled(rng) {
  return [0, 1, 2].sort(() => rng() - 0.5);
}

// Invariante: al menos un carril pasable (sin torre ni móvil)
function ensurePassable(row, rng) {
  const blocked = row.filter((e) => e && (e.kind === KIND.TOWER || e.kind === KIND.MOVER)).length;
  if (blocked >= 3) {
    const movers = row.findIndex((e) => e && e.kind === KIND.MOVER);
    const idx = movers >= 0 ? movers : Math.floor(rng() * 3);
    row[idx] = { kind: KIND.BARRIER, lane: idx };
  }
  return row;
}

// Genera las filas de un patrón (1..3 filas). Siempre validadas.
export function patternRows(rng, pattern, level, pillarBias) {
  const lane = Math.floor(rng() * 3);
  switch (pattern) {
    case 'coinsLine': { // línea de monedas en zigzag
      const dir = rng() < 0.5 ? 1 : -1;
      const l2 = Math.min(2, Math.max(0, lane + dir));
      const l3 = Math.min(2, Math.max(0, l2 + dir * (l2 === 1 ? dir : -dir)));
      return [
        row_({ kind: KIND.COIN, lane }),
        row_({ kind: KIND.COIN, lane: l2 }),
        row_({ kind: KIND.COIN, lane: l3 }),
      ];
    }
    case 'slalom': { // ítems en zigzag entre obstáculos suaves
      const dir = rng() < 0.5 ? 1 : -1;
      const l2 = Math.min(2, Math.max(0, lane + dir));
      return [
        row_(pickup(rng, pillarBias, lane, level)),
        row_(pickup(rng, pillarBias, l2, level)),
        row_(pickup(rng, pillarBias, lane, level)),
      ];
    }
    case 'gate': { // dos torres + premio en el carril libre
      const free = lane;
      const r = [null, null, null];
      for (let l = 0; l < 3; l++) {
        if (l === free) continue;
        r[l] = level.doubleBarrier && rng() < 0.3 ? { kind: KIND.BARRIER, lane: l } : { kind: KIND.TOWER, lane: l };
      }
      r[free] = pickup(rng, pillarBias, free, level);
      return [r];
    }
    case 'barrierRun': { // ráfaga de saltos (2-3 barreras)
      const n = level.doubleBarrier ? (rng() < 0.5 ? 3 : 2) : 2;
      const rows = [];
      let l = lane;
      for (let i = 0; i < n; i++) {
        rows.push(row_({ kind: KIND.BARRIER, lane: l }));
        if (rng() < 0.5) l = Math.min(2, Math.max(0, l + (rng() < 0.5 ? 1 : -1)));
      }
      return rows;
    }
    case 'ringChallenge': { // anillo de precisión escoltado
      const r = [null, null, null];
      const others = [0, 1, 2].filter((x) => x !== lane);
      if (rng() < 0.6) r[others[0]] = { kind: KIND.BARRIER, lane: others[0] };
      r[lane] = { kind: KIND.RING, lane };
      return [r];
    }
    case 'moverWatch': { // torre móvil + refugio con premio
      const dir = rng() < 0.5 ? -1 : 1;
      const b = Math.min(2, Math.max(0, lane + dir));
      const r = [null, null, null];
      r[lane] = { kind: KIND.MOVER, lane, laneB: b === lane ? Math.min(2, Math.max(0, lane - dir)) : b, phase: 0 };
      const safe = [0, 1, 2].find((x) => x !== lane && x !== r[lane].laneB) ?? ((lane + 2 * dir + 3) % 3);
      r[safe] = pickup(rng, pillarBias, safe, level);
      return [r];
    }
    default:
      return [mixedRow(rng, level, pillarBias)];
  }
}

function row_(...ents) {
  const r = [null, null, null];
  for (const e of ents) r[e.lane] = e;
  return r;
}

// Elige el pilar con más tiempo sin recogerse
export function weakestPillar(pillarAt, now) {
  let worst = 'A', worstAgo = -1;
  for (const p of ['A', 'D', 'B']) {
    const at = pillarAt[p] ?? -Infinity;
    if (!Number.isFinite(at)) return p;
    const ago = now - at;
    if (ago > worstAgo) { worstAgo = ago; worst = p; }
  }
  return worst;
}
