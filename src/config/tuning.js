// Ajustes de jugabilidad — todos los números del balance en un solo lugar
export const TUNING = {
  logicalWidth: 420,
  logicalHeight: 760,
  horizonY: 218,          // y del horizonte en coordenadas lógicas
  groundY: 668,           // y del jugador
  farZ: 1400,             // z donde aparecen entidades
  laneSpreadNear: 108,    // separación de carriles cerca de cámara
  laneSpreadFar: 22,

  player: {
    laneLerp: 14,         // velocidad de cambio de carril
    jumpVel: 720,         // impulso de salto (px/s)
    gravity: 1900,
    jumpScaleY: 150,      // altura visual máx. del salto
    invulnTime: 1.1,      // s de invulnerabilidad tras golpe
  },

  energy: {
    max: 100,
    start: 100,
    drainPerSec: 2.1,     // +0.16 por día
    drainPerDay: 0.16,
    hitLoss: 18,
    itemGain: 6,
    comboGain: 12,
  },

  days: {
    count: 5,
    lengthSec: 23,        // duración de cada día
    baseSpeed: 300,       // px/s de avance del mundo
    speedPerDay: 34,      // incremento por día
    graceSec: 1.4,        // pausa de spawns tras cambio de día
  },

  combo: {
    windowSec: 10,        // recolectar A+D+B dentro de esta ventana
    durationSec: 6,       // duración del MODO SWAG
    extendSec: 2,         // extensión por ítem durante el modo
    multiplier: 2,
  },

  score: {
    distancePerSec: 10,
    item: 100,
    star: 250,
    dayBonus: 500,
    comboBonus: 300,
  },

  medals: [               // de mayor a menor
    { id: 'oro',    name: 'MEDALLA DE ORO',    min: 11500, ico: '🥇' },
    { id: 'plata',  name: 'MEDALLA DE PLATA',  min: 7500,  ico: '🥈' },
    { id: 'bronce', name: 'MEDALLA DE BRONCE', min: 3500,  ico: '🥉' },
  ],
  weekBadge: { id: 'semana', name: 'SEMANA IMPOSIBLE SUPERADA', ico: '🏆' },

  skins: [
    { id: 'clasico',     name: 'Clásico',     hoodie: '#D7262E', pants: '#1B1B24', unlock: null },
    { id: 'cobalto',     name: 'Cobalto',     hoodie: '#3E63DD', pants: '#141A2E', unlock: 'bronce' },
    { id: 'iridiscente', name: 'Iridiscente', hoodie: 'irid',    pants: '#191320', unlock: 'oro' },
  ],

  spawn: {
    baseInterval: 1.05,   // s entre filas de spawn (día 1)
    intervalPerDay: -0.09,
    minInterval: 0.58,
    itemWeight: 0.52,
    obstacleWeight: 0.34,
    starChance: 0.05,
    lowObstacleChance: 0.45, // barreras (saltables) vs torres (esquivar)
  },
};
