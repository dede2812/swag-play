// Niveles DEPORTE — la semana imposible, 5 etapas progresivas.
// Cada nivel introduce mecánicas nuevas (no solo más velocidad):
//  L1 tutorial guiado · L2 combinaciones y puertas · L3 ráfagas y anillos de
//  precisión · L4 torres móviles y patrones densos · L5 SWAG Master en 3 fases.
import { DAYS } from './brand.js';

export const LEVELS = [
  {
    id: 1, day: DAYS[0], name: 'Calentamiento',
    desc: 'Aprende a moverte, saltar y recoger tu primera Energía SWAG.',
    lengthSec: 40, speed0: 285, speed1: 305, drain: 1.9,
    interval: 1.04, minInterval: 0.66,
    pool: ['mixed', 'coinsLine', 'slalom'],
    moverW: 0, ringW: 0, doubleBarrier: false,
    cardAt: 0.68,
    stars: [1400, 2400, 3400],
    objectives: [
      { id: 'clear', text: 'Termina el nivel' },
      { id: 'coins8', text: 'Recoge 8 ⚡ Energía SWAG' },
      { id: 'nohit', text: 'Sin recibir golpes' },
    ],
  },
  {
    id: 2, day: DAYS[1], name: 'Ritmo',
    desc: 'Puertas de notificaciones y decisiones rápidas entre carriles.',
    lengthSec: 48, speed0: 305, speed1: 340, drain: 2.05,
    interval: 0.97, minInterval: 0.6,
    pool: ['mixed', 'coinsLine', 'gate', 'slalom'],
    moverW: 0, ringW: 0.05, doubleBarrier: false,
    cardAt: 0.55,
    stars: [2000, 3300, 4600],
    objectives: [
      { id: 'clear', text: 'Termina el nivel' },
      { id: 'combo1', text: 'Activa 1 MODO SWAG' },
      { id: 'coins14', text: 'Recoge 14 ⚡' },
    ],
  },
  {
    id: 3, day: DAYS[2], name: 'Velocidad y precisión',
    desc: 'Ráfagas de saltos y anillos de precisión: pásalos para bonos.',
    lengthSec: 55, speed0: 330, speed1: 380, drain: 2.2,
    interval: 0.9, minInterval: 0.55,
    pool: ['mixed', 'gate', 'barrierRun', 'ringChallenge', 'coinsLine'],
    moverW: 0, ringW: 0.14, doubleBarrier: true,
    cardAt: 0.8,
    stars: [2700, 4400, 6100],
    objectives: [
      { id: 'clear', text: 'Termina el nivel' },
      { id: 'rings3', text: 'Atraviesa 3 anillos' },
      { id: 'ability2', text: 'Usa 2 habilidades' },
    ],
  },
  {
    id: 4, day: DAYS[3], name: 'Desafío combinado',
    desc: 'Torres móviles y patrones densos: tus habilidades mandan.',
    lengthSec: 64, speed0: 350, speed1: 410, drain: 2.35,
    interval: 0.85, minInterval: 0.5,
    pool: ['mixed', 'gate', 'barrierRun', 'ringChallenge', 'moverWatch', 'slalom'],
    moverW: 0.16, ringW: 0.1, doubleBarrier: true,
    cardAt: 0.5,
    stars: [3400, 5600, 7800],
    objectives: [
      { id: 'clear', text: 'Termina el nivel' },
      { id: 'combo2', text: 'Activa 2 MODO SWAG' },
      { id: 'nohit', text: 'Sin recibir golpes' },
    ],
  },
  {
    id: 5, day: DAYS[4], name: 'SWAG Master',
    desc: 'La final: tres fases, todo lo aprendido, dificultad alta pero justa.',
    lengthSec: 78, speed0: 370, speed1: 445, drain: 2.5,
    interval: 0.8, minInterval: 0.46,
    pool: ['mixed', 'gate', 'barrierRun', 'moverWatch', 'ringChallenge', 'coinsLine', 'slalom'],
    moverW: 0.2, ringW: 0.12, doubleBarrier: true,
    cardAt: 0.9,
    stars: [4600, 7400, 10000],
    phases: [
      { until: 0.34, name: 'FASE 1 · SLALOM', pool: ['slalom', 'coinsLine', 'gate'], speedMul: 0.97 },
      { until: 0.67, name: 'FASE 2 · CIRCUITO', pool: ['barrierRun', 'ringChallenge', 'mixed'], speedMul: 1.0 },
      { until: 1.01, name: 'FASE FINAL · RUSH', pool: ['mixed', 'gate', 'moverWatch', 'barrierRun'], speedMul: 1.06 },
    ],
    objectives: [
      { id: 'clear', text: 'Termina el nivel' },
      { id: 'stars2', text: 'Recoge 2 ⭐ estrellas' },
      { id: 'ability3', text: 'Usa 3 habilidades' },
    ],
  },
];

export const levelById = (id) => LEVELS.find((l) => l.id === Number(id));

// Fase activa del nivel (si define fases) según progreso 0..1
export function phaseFor(level, progress) {
  if (!level.phases) return null;
  return level.phases.find((p) => progress < p.until) || level.phases[level.phases.length - 1];
}
