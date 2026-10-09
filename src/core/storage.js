// Persistencia local v2: monedas, habilidades, niveles, tienda, pistas.
// Sin datos personales, sin red: todo vive en localStorage del dispositivo.
const KEY = 'swag_rush_v2';

const DEFAULTS = {
  coins: 0,
  abilities: { velocidad: 1 },            // id → grado (1..3); solo desbloqueadas
  levels: {},                             // { 1: { stars, best, cleared, card } }
  skins: ['clasico'],
  skin: 'clasico',
  effects: ['ninguno'],
  effect: 'ninguno',
  sound: true,
  seenHowto: false,
  runs: 0,
  best: 0,                                // mejor puntuación en un nivel
  weekCleared: false,
  hints: {},                              // pistas del coach ya mostradas
  waitlistInterest: false,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...data, abilities: { ...data.abilities }, levels: { ...data.levels }, hints: { ...data.hints } };
  } catch { return structuredClone(DEFAULTS); }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado */ }
}

let state = load();

export const storage = {
  get: (k) => state[k],
  set(k, v) { state[k] = v; save(state); },
  merge(obj) { state = { ...state, ...obj }; save(state); },
  all: () => ({ ...state }),
  reset() { state = structuredClone(DEFAULTS); save(state); },
};

// Progreso de un nivel con valores seguros
export function levelProgress(id) {
  return { stars: 0, best: 0, cleared: false, card: false, ...(state.levels[id] || {}) };
}
export function setLevelProgress(id, patch) {
  state.levels[id] = { ...levelProgress(id), ...patch };
  save(state);
}

// Nivel más alto disponible: el siguiente al último superado (máx. 5)
export function highestUnlocked() {
  let h = 1;
  for (let i = 1; i <= 5; i++) if (levelProgress(i).cleared) h = Math.max(h, Math.min(5, i + 1));
  return h;
}
