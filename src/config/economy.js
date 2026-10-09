// Economía BIENESTAR — «Energía SWAG» ⚡, la moneda del juego.
// Coherente con la app oficial: en SWAG registras tu energía diaria
// (check-in de Bienestar); en el juego la ganas cuidando tu equilibrio.
// Sin compras con dinero real: solo se gana jugando. Valores virtuales.

// Cuánto se gana
export const EARN = {
  coinPickup: 1,          // cada moneda recogida en la pista
  levelClear: (lvl) => 25 + (lvl - 1) * 5,   // completar nivel 1..5 → 25..45
  firstClearMultiplier: 2, // primera vez que superas el nivel
  star: [10, 25, 50],     // por alcanzar 1/2/3 estrellas (solo la 1.ª vez)
  comboActivation: 8,     // cada MODO SWAG
  noHitBonus: 15,         // terminar sin golpes
  hiddenCard: 30,         // carta SWAG oculta (1 por nivel, solo la 1.ª vez)
  ring: 2,                // anillo de precisión
  replayFactor: 0.5,      // recompensa de nivel ya superado (sin contar pickups)
};

// Catálogo de la tienda (las mejoras de habilidades viven en abilities.js)
export const SKINS = [
  { id: 'clasico',     name: 'Clásico',     hoodie: '#D7262E', pants: '#1B1B24', cost: 0 },
  { id: 'cobalto',     name: 'Cobalto',     hoodie: '#3456E8', pants: '#141A2E', cost: 120 },
  { id: 'menta',       name: 'Menta',       hoodie: '#64D8AB', pants: '#14211C', cost: 200 },
  { id: 'iridiscente', name: 'Iridiscente', hoodie: 'irid',    pants: '#191320', cost: 350 },
];

export const EFFECTS = [
  { id: 'ninguno', name: 'Sin estela',  color: null,       cost: 0 },
  { id: 'cian',    name: 'Estela cian', color: '#35D6E6',  cost: 80 },
  { id: 'dorada',  name: 'Estela dorada', color: '#F2A900', cost: 80 },
  { id: 'violeta', name: 'Estela violeta', color: '#9273EF', cost: 80 },
];

// Cartas coleccionables ocultas (1 por nivel)
export const CARDS = [
  { id: 1, name: 'Carta Academia',  ico: '📖', color: '#3456E8' },
  { id: 2, name: 'Carta Deporte',   ico: '👟', color: '#FF766C' },
  { id: 3, name: 'Carta Bienestar', ico: '⚡', color: '#35D6E6' },
  { id: 4, name: 'Carta Enfoque',   ico: '🎯', color: '#9273EF' },
  { id: 5, name: 'Carta SWAG Master', ico: '🏆', color: '#F2A900' },
];

// Aritmética pura de monedas (se prueba en Node). Nunca baja de 0 y
// cada recompensa «única» se marca para que no pueda cobrarse dos veces.
export function canAfford(coins, cost) { return coins >= cost; }

export function spend(coins, cost) {
  if (!canAfford(coins, cost)) return null;
  return coins - cost;
}

// Resumen de monedas de una partida → desglose para resultados.
// flags: { firstClear, newStars (1..3 mayores que antes), cardNew, noHit, replayed }
export function coinsEarned({ level, pickups = 0, combos = 0, rings = 0, flags = {} }) {
  const rows = [];
  const add = (label, n) => { if (n > 0) rows.push({ label, n }); return n; };
  let total = 0;
  total += add(`⚡ Monedas recogidas (${pickups})`, pickups * EARN.coinPickup);
  const clearBase = flags.cleared ? EARN.levelClear(level) : 0;
  if (flags.cleared) {
    const clear = flags.firstClear ? clearBase * EARN.firstClearMultiplier
      : flags.replayed ? Math.round(clearBase * EARN.replayFactor) : clearBase;
    total += add(flags.firstClear ? 'Primera victoria (×2)' : flags.replayed ? 'Nivel superado (repetición)' : 'Nivel superado', clear);
  }
  if (flags.newStars > 0) {
    // se otorga la diferencia respecto a estrellas previas
    const prev = flags.prevStars || 0;
    let starCoins = 0;
    for (let s = prev + 1; s <= flags.newStars; s++) starCoins += EARN.star[s - 1];
    total += add(`Estrellas nuevas (${'★'.repeat(flags.newStars - prev)})`, starCoins);
  }
  total += add(`MODO SWAG ×${combos}`, combos * EARN.comboActivation);
  total += add(`Anillos de precisión (${rings})`, rings * EARN.ring);
  total += add('Sin golpes', flags.noHit && flags.cleared ? EARN.noHitBonus : 0);
  total += add('Carta SWAG oculta', flags.cardNew ? EARN.hiddenCard : 0);
  return { rows, total };
}
