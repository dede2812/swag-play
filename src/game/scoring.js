// Lógica pura de puntuación, medallas y desbloqueos (sin DOM: se prueba en Node)
import { TUNING } from '../config/tuning.js';

export function medalFor(score) {
  for (const m of TUNING.medals) if (score >= m.min) return m;
  return null;
}

// Mejor reconocimiento de la partida: completar la semana supera a cualquier medalla
export function badgeFor(score, weekCompleted) {
  if (weekCompleted) return TUNING.weekBadge;
  return medalFor(score);
}

export function skinUnlocks(badgeId) {
  return TUNING.skins.filter((s) => s.unlock && s.unlock === badgeId).map((s) => s.id);
}

// Desglose de puntos para la pantalla de resultados
export function breakdown({ distanceSec = 0, items = 0, stars = 0, comboPoints = 0, daysCompleted = 0, multAvg = 1 }) {
  const distance = Math.round(distanceSec * TUNING.score.distancePerSec * multAvg);
  const itemPts = items * TUNING.score.item;
  const starPts = stars * TUNING.score.star;
  const dayPts = daysCompleted * TUNING.score.dayBonus;
  return {
    distance,
    items: itemPts,
    stars: starPts,
    comboBonus: comboPoints,
    days: dayPts,
    total: distance + itemPts + starPts + comboPoints + dayPts,
  };
}

export function fmt(n) {
  return Math.round(n).toLocaleString('es-SV');
}
