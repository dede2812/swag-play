// Persistencia local: récord, medallas, estilos, ajustes. Sin datos personales, sin red.
const KEY = 'swag_rush_v1';

const DEFAULTS = {
  best: 0,
  bestMedal: null,       // id de medalla
  unlockedSkins: ['clasico'],
  skin: 'clasico',
  sound: true,
  seenHowto: false,
  runs: 0,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return { ...DEFAULTS }; }
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
};
