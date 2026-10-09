// Ajustes de jugabilidad — todos los números del balance en un solo lugar
export const TUNING = {
  logicalWidth: 420,
  logicalHeight: 760,
  horizonY: 218,
  groundY: 668,
  farZ: 1400,
  laneSpreadNear: 108,
  laneSpreadFar: 22,

  player: {
    laneLerp: 14,
    jumpVel: 720,
    gravity: 1900,
    invulnTime: 1.1,
  },

  // RITMO: el recurso del jugador (barra). La moneda es Energía SWAG ⚡.
  energy: {
    max: 100,
    start: 100,
    hitLoss: 18,
    itemGain: 6,
    comboGain: 12,
  },

  combo: {
    windowSec: 10,
    durationSec: 6,
    extendSec: 2,
    multiplier: 2,
  },

  score: {
    distancePerSec: 10,
    item: 100,
    star: 250,
    ring: 150,
    coinScore: 5,
    comboBonus: 300,
    clearBonus: (lvl) => 400 + lvl * 100, // bonus por superar el nivel
  },

  spawn: {
    itemWeight: 0.5,
    obstacleWeight: 0.34,
    starChance: 0.05,
    lowObstacleChance: 0.45,
    coinChance: 0.3,      // probabilidad de convertir un ítem en moneda
    graceSec: 1.3,        // pausa de spawns al empezar / cambiar de fase
  },
};
