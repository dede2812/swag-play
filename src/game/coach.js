// Coach contextual: micro-pistas durante las primeras partidas.
// Cada pista se muestra UNA sola vez (persistida en storage.hints).
import { storage } from '../core/storage.js';

const HINTS = {
  move:    { ico: '↔️', text: 'Desliza ◀ ▶ o usa ← → para cambiar de carril' },
  jump:    { ico: '⬆️', text: '¡Barrera! Salta con ▲, W o desliza hacia arriba' },
  coins:   { ico: '⚡', text: 'Energía SWAG: recógela y gástala en Mejoras' },
  ability: { ico: '💨', text: 'Pulsa 1 o el botón para activar tu habilidad' },
  combo:   { ico: '✨', text: 'Te falta 1 pilar para el MODO SWAG ×2' },
  ritmo:   { ico: '⚠️', text: 'Ritmo bajo: recoge pilares para recargar' },
  mover:   { ico: '📱', text: 'Torre móvil: mira sus flechas ◀ ▶ y anticipa' },
  ring:    { ico: '◎', text: 'Anillo dorado: atraviésalo en su carril' },
};

let el = null;
let timer = null;

function bubble() {
  if (!el) {
    el = document.createElement('div');
    el.id = 'coach';
    el.className = 'hidden';
    el.setAttribute('role', 'status');
    document.getElementById('app').appendChild(el);
  }
  return el;
}

// Muestra una pista si nunca se mostró. Devuelve true si se mostró.
export function hint(id, { force = false, ms = 3200 } = {}) {
  const h = HINTS[id];
  if (!h) return false;
  const shown = storage.get('hints') || {};
  if (!force && shown[id]) return false;
  shown[id] = true;
  storage.set('hints', shown);
  const b = bubble();
  b.innerHTML = `<span class="coach-ico">${h.ico}</span><span>${h.text}</span>`;
  b.classList.remove('hidden', 'coach-in');
  void b.offsetWidth;
  b.classList.add('coach-in');
  clearTimeout(timer);
  timer = setTimeout(() => b.classList.add('hidden'), ms);
  return true;
}

export function hideCoach() {
  clearTimeout(timer);
  if (el) el.classList.add('hidden');
}
