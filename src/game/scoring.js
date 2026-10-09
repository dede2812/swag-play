// Puntuación por nivel, estrellas y desglose (sin DOM: se prueba en Node)
import { TUNING } from '../config/tuning.js';

// Estrellas del nivel según su configuración: 0..3
export function starsFor(level, score) {
  let n = 0;
  for (const th of level.stars) if (score >= th) n++;
  return n;
}

// Desglose de puntos para la pantalla de resultados
export function breakdown({ distance = 0, items = 0, stars = 0, rings = 0, coinScore = 0, combo = 0, clear = 0 }) {
  const rows = [
    ['🏃 Distancia', Math.round(distance)],
    ['📚 Ítems de pilar', Math.round(items)],
    ['⭐ Estrellas SWAG', Math.round(stars)],
    ['◎ Anillos de precisión', Math.round(rings)],
    ['⚡ Puntos por monedas', Math.round(coinScore)],
    ['✨ Bonos MODO SWAG', Math.round(combo)],
    ['🏁 Nivel superado', Math.round(clear)],
  ].filter(([, v]) => v > 0);
  return { rows, total: Math.round(distance + items + stars + rings + coinScore + combo + clear) };
}

export function fmt(n) {
  return Math.round(n).toLocaleString('es-SV');
}
