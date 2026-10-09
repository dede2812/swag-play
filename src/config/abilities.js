// Habilidades ACADEMIA — conexión directa con la app SWAG:
// Concentración ≈ sesiones de enfoque · Memoria ≈ repaso · Estrategia ≈ motor
// de sugerencias ("Un ajuste que suma") · Velocidad ≈ ritmo de estudio ·
// Multiplicador ≈ constancia que rinde el doble.
// Cada habilidad: duración, recarga, desbloqueo por nivel y 3 grados de mejora.
export const ABILITIES = [
  {
    id: 'velocidad', name: 'Velocidad', ico: '💨', color: '#35D6E6', key: '1',
    short: 'Corre más rápido y suma +50% por distancia.',
    unlockLevel: 1,
    duration: [4, 5, 6],        // segundos por grado
    cooldown: [16, 14, 12],     // recarga por grado
  },
  {
    id: 'concentracion', name: 'Concentración', ico: '🎯', color: '#7C96FF', key: '2',
    short: 'El caos se mueve al 55%. Tú sigues igual.',
    unlockLevel: 2,
    duration: [4.5, 5.5, 6.5],
    cooldown: [20, 18, 16],
  },
  {
    id: 'memoria', name: 'Memoria', ico: '👁️', color: '#B79CFF', key: '3',
    short: 'Visualiza lo que viene antes de llegar.',
    unlockLevel: 3,
    duration: [6, 7, 8],
    cooldown: [24, 21, 18],
  },
  {
    id: 'estrategia', name: 'Estrategia', ico: '🧭', color: '#64D8AB', key: '4',
    short: 'SWAG te marca el mejor carril, como en la app.',
    unlockLevel: 4,
    duration: [6, 7, 8],
    cooldown: [26, 23, 20],
  },
  {
    id: 'multiplicador', name: 'Multiplicador', ico: '✖️', color: '#F2A900', key: '5',
    short: 'Todos tus puntos valen ×3.',
    unlockLevel: 5,
    duration: [5, 6, 7],
    cooldown: [30, 27, 24],
  },
];

export const abilityById = (id) => ABILITIES.find((a) => a.id === id);

// Coste de mejora por grado (grado 2 y 3) en Energía SWAG
export const UPGRADE_COST = [0, 90, 180];

// Efectos derivados de las habilidades activas (puro, se prueba en Node)
export function effectsOf(active, now) {
  const on = (id) => (active[id] ?? -Infinity) > now;
  return {
    speedBoost: on('velocidad'),
    slowmo: on('concentracion'),
    xray: on('memoria'),
    guide: on('estrategia'),
    mult: on('multiplicador'),
  };
}

// Estado de las 5 habilidades para una partida
export function createAbilityState(levels) {
  // levels: { id: grado 1..3 } — solo habilidades desbloqueadas llegan
  const slots = {};
  for (const a of ABILITIES) {
    const lvl = levels[a.id] || 0;
    if (lvl > 0) slots[a.id] = { lvl, cdUntil: -Infinity, activeUntil: -Infinity };
  }
  return slots;
}

export function canCast(slots, id, now) {
  const s = slots[id];
  return !!s && now >= s.cdUntil && now >= s.activeUntil;
}

// Lanza una habilidad; devuelve true si se activó
export function cast(slots, id, now) {
  if (!canCast(slots, id, now)) return false;
  const a = abilityById(id);
  const s = slots[id];
  s.activeUntil = now + a.duration[s.lvl - 1];
  s.cdUntil = now + a.cooldown[s.lvl - 1];
  return true;
}

export function activeMap(slots) {
  const out = {};
  for (const [id, s] of Object.entries(slots)) out[id] = s.activeUntil;
  return out;
}

// El mejor carril según lo que se acerca (habilidad Estrategia). Puro.
// entities: [{ kind, lane, z, moverLane? }] — lane actual del jugador 0..2
export function bestLane(entities, playerLane, zMin = 60, zMax = 640) {
  const cost = [0, 0, 0];
  for (const e of entities) {
    if (e.z < zMin || e.z > zMax) continue;
    const near = 1 - (e.z - zMin) / (zMax - zMin); // 1 = muy cerca
    const lane = e.moverLane != null ? Math.round(e.moverLane) : e.lane;
    if (e.kind === 'tower' || e.kind === 'barrier' || e.kind === 'mover') {
      cost[lane] += 3 * near;
      if (e.kind === 'mover') { // el movimiento barre carriles vecinos
        cost[Math.max(0, lane - 1)] += 1.2 * near;
        cost[Math.min(2, lane + 1)] += 1.2 * near;
      }
    } else {
      cost[lane] -= 0.6 * near; // ítems/monedas atraen
    }
  }
  let best = playerLane;
  for (let l = 0; l < 3; l++) if (cost[l] < cost[best] - 0.05) best = l;
  return best;
}
