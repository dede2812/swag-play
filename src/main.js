// SWAG RUSH — arranque, puente DOM↔juego y flujo de pantallas
import { Engine } from './core/engine.js';
import { audio } from './core/audio.js';
import { storage } from './core/storage.js';
import { TUNING } from './config/tuning.js';
import { DAYS, COPY } from './config/brand.js';
import { MenuScene } from './scenes/menu.js';
import { PlayScene } from './scenes/play.js';
import { ResultsScene } from './scenes/results.js';
import { badgeFor, medalFor, fmt } from './game/scoring.js';
import { shareResults } from './game/sharecard.js';

const $ = (id) => document.getElementById(id);
const engine = new Engine($('game'));
const DEBUG = new URLSearchParams(location.search).has('debug');

// ---------- pantallas ----------
const SCREENS = ['screen-menu', 'screen-howto', 'screen-pause', 'screen-results', 'screen-swag'];
function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('active', s === id);
  if (!id) for (const s of SCREENS) $(s).classList.remove('active');
}

let toastTimer = null;
function toast(msg, ms = 2200) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

// ---------- puente UI para la escena de juego ----------
let bannerTimer = null;
const ui = {
  showHud(v) { $('hud').classList.toggle('hidden', !v); },
  setEnergy(pct) { $('energy-fill').style.width = `${Math.max(0, pct * 100).toFixed(1)}%`; },
  setScore(txt) { $('score').textContent = txt; },
  setDayDots(day) {
    $('day-dots').innerHTML = DAYS.map((d, i) =>
      `<div class="dot ${i < day ? 'done' : i === day ? 'now' : ''}" title="${d}"></div>`).join('');
  },
  setPips(lit) {
    document.querySelectorAll('#pillar-pips .pip').forEach((p) =>
      p.classList.toggle('lit', lit.includes(p.dataset.p)));
  },
  showCombo(v) { $('combo-badge').classList.toggle('hidden', !v); },
  countdown(txt) {
    const el = $('countdown');
    if (!txt) { el.classList.add('hidden'); return; }
    el.textContent = txt;
    el.classList.remove('hidden', 'pop');
    void el.offsetWidth;
    el.classList.add('pop');
  },
  banner(text) {
    const el = $('day-banner');
    $('day-banner-text').textContent = text;
    el.classList.remove('hidden');
    const span = el.firstElementChild;
    span.style.animation = 'none';
    void span.offsetWidth;
    span.style.animation = '';
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  },
  showPause(v, day) {
    if (v) { $('pause-day').textContent = day || ''; showScreen('screen-pause'); }
    else showScreen(null);
  },
};

// ---------- flujo ----------
const menuScene = new MenuScene(engine);
const resultsScene = new ResultsScene(engine);
let playScene = null;
let lastResults = null;

function startGame() {
  showScreen(null);
  playScene = new PlayScene(engine, ui, endRun);
  engine.setScene(playScene, { skin: storage.get('skin') });
}

function endRun(results) {
  playScene = null;
  lastResults = results;
  if (DEBUG) window.__swag.lastResults = results;
  if (!results) { // salir al menú
    refreshMenu();
    showScreen('screen-menu');
    engine.setScene(menuScene);
    return;
  }
  // récords y desbloqueos
  const badge = badgeFor(results.score, results.win);
  const best = storage.get('best') || 0;
  const isRecord = results.score > best;
  if (isRecord) storage.set('best', results.score);
  const unlocked = new Set(storage.get('unlockedSkins') || ['clasico']);
  const newUnlocks = [];
  if (badge) {
    for (const s of TUNING.skins) {
      if (s.unlock && (badge.id === s.unlock || badge.id === 'semana' && s.unlock === 'bronce') && !unlocked.has(s.id)) {
        unlocked.add(s.id); newUnlocks.push(s);
      }
    }
    // la medalla de oro también desbloquea cobalto
    if (badge.id === 'oro' && !unlocked.has('cobalto')) {
      unlocked.add('cobalto'); newUnlocks.push(TUNING.skins.find((s) => s.id === 'cobalto'));
    }
    storage.set('bestMedal', badge.id);
  }
  storage.merge({ unlockedSkins: [...unlocked], runs: (storage.get('runs') || 0) + 1 });

  // poblar DOM de resultados
  $('results-kicker').textContent = results.win ? COPY.winKicker : COPY.loseKicker;
  $('results-kicker').classList.toggle('lose', !results.win);
  $('results-title').textContent = results.win ? COPY.winTitle : COPY.loseTitle;
  const medalEl = $('medal');
  medalEl.className = 'medal';
  if (badge) {
    medalEl.classList.add(`m-${badge.id}`);
    $('medal-ico').textContent = badge.ico;
    $('medal-name').textContent = badge.name;
  } else {
    $('medal-ico').textContent = '💪';
    $('medal-name').textContent = 'SIGUE ENTRENANDO';
  }
  $('final-score').textContent = fmt(results.score);
  $('new-record').classList.toggle('hidden', !isRecord);
  const a = results.acc;
  const rows = [
    ['🏃 Distancia', a.distance],
    [`📚 Ítems de pilar (${results.stats.items})`, a.items],
    [`⭐ Estrellas SWAG (${results.stats.stars})`, a.stars],
    [`✨ Bonos MODO SWAG (×${results.stats.combos})`, a.combo],
    [`📅 Días superados (${results.daysCompleted}/5)`, a.days],
  ];
  $('breakdown').innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>+${fmt(v)}</b></li>`).join('');
  const un = $('unlock-note');
  if (newUnlocks.length) {
    un.textContent = `🔓 Estilo desbloqueado: ${newUnlocks.map((s) => s.name).join(', ')} — elígelo en el menú`;
    un.classList.remove('hidden');
  } else un.classList.add('hidden');

  showScreen('screen-results');
  engine.setScene(resultsScene, { win: results.win });
}

// ---------- menú ----------
function refreshMenu() {
  $('menu-best').textContent = fmt(storage.get('best') || 0);
  const bm = storage.get('bestMedal');
  const chip = $('menu-medal');
  if (bm) {
    const badge = bm === 'semana' ? TUNING.weekBadge : TUNING.medals.find((m) => m.id === bm);
    if (badge) { chip.textContent = `${badge.ico} ${badge.name}`; chip.classList.remove('hidden'); }
  } else chip.classList.add('hidden');
  renderSkins();
}

function renderSkins() {
  const row = $('skin-row');
  const unlocked = storage.get('unlockedSkins') || ['clasico'];
  const sel = storage.get('skin');
  row.innerHTML = '';
  for (const s of TUNING.skins) {
    const isUn = unlocked.includes(s.id);
    const el = document.createElement('button');
    el.className = `skin ${sel === s.id ? 'sel' : ''} ${isUn ? '' : 'locked'}`;
    el.setAttribute('aria-label', `Estilo ${s.name}${isUn ? '' : ' (bloqueado)'}`);
    const bg = s.hoodie === 'irid'
      ? 'linear-gradient(135deg,#D7262E,#F2A900,#5DC1B9,#3E63DD)'
      : s.hoodie;
    el.innerHTML = `<span class="sw" style="background:${bg}"></span>${isUn ? '' : '<span class="lock">🔒</span>'}`;
    el.addEventListener('click', () => {
      audio.click();
      if (!isUn) {
        const need = s.unlock === 'oro' ? 'una medalla de ORO 🥇' : 'una medalla de BRONCE 🥉';
        toast(`🔒 Desbloquea «${s.name}» con ${need}`);
        return;
      }
      storage.set('skin', s.id);
      renderSkins();
    });
    row.appendChild(el);
  }
}

// ---------- sonido ----------
function syncSoundButtons() {
  const on = storage.get('sound') !== false;
  for (const id of ['btn-sound', 'btn-pause-sound']) {
    $(id).textContent = on ? '🔊 Sonido' : '🔇 Silencio';
    $(id).setAttribute('aria-pressed', String(on));
  }
}
function toggleSound() {
  storage.set('sound', storage.get('sound') === false);
  syncSoundButtons();
  audio.click();
}

// ---------- eventos ----------
$('btn-play').addEventListener('click', () => {
  audio.click();
  if (!storage.get('seenHowto')) showScreen('screen-howto');
  else startGame();
});
$('btn-howto').addEventListener('click', () => { audio.click(); showScreen('screen-howto'); });
$('btn-howto-play').addEventListener('click', () => { audio.click(); storage.set('seenHowto', true); startGame(); });
$('btn-howto-back').addEventListener('click', () => { audio.click(); showScreen('screen-menu'); });
$('btn-sound').addEventListener('click', toggleSound);
$('btn-pause-sound').addEventListener('click', toggleSound);
$('btn-pause').addEventListener('click', () => playScene?.pause());
$('btn-resume').addEventListener('click', () => { audio.click(); playScene?.resume(); });
$('btn-quit').addEventListener('click', () => { audio.click(); playScene?.quitToMenu(); });
$('btn-again').addEventListener('click', () => { audio.click(); startGame(); });
$('btn-menu').addEventListener('click', () => { audio.click(); refreshMenu(); showScreen('screen-menu'); engine.setScene(menuScene); });
$('btn-swag').addEventListener('click', () => { audio.click(); showScreen('screen-swag'); });
$('btn-swag-back').addEventListener('click', () => { audio.click(); showScreen(playScene ? 'screen-pause' : 'screen-results'); });
$('btn-waitlist').addEventListener('click', () => {
  audio.combo();
  storage.set('waitlistInterest', true);
  $('waitlist-msg').textContent = '🎉 ¡Gracias! Serás de los primeros en saber del lanzamiento.';
  toast('✨ SWAG llega muy pronto. ¡Gracias por jugar!');
});
$('btn-share').addEventListener('click', async () => {
  audio.click();
  const btn = $('btn-share');
  btn.disabled = true; btn.textContent = '⏳ Generando…';
  try {
    const r = lastResults;
    if (!r) throw new Error('sin resultados');
    const badge = badgeFor(r.score, r.win);
    const mode = await shareResults({
      score: r.score, badge, win: r.win,
      daysCompleted: r.daysCompleted, best: r.score >= (storage.get('best') || 0),
    });
    toast(mode === 'shared' ? '📤 ¡Compartido!' : mode === 'cancelled' ? 'Compartir cancelado' : '📥 Tarjeta descargada. ¡Publícala!');
  } catch { toast('No se pudo generar la tarjeta'); }
  btn.disabled = false; btn.textContent = '📤 Compartir';
});

// pausa automática al perder foco
document.addEventListener('visibilitychange', () => {
  if (document.hidden) playScene?.pause();
});

// desbloqueo de audio en el primer gesto
const unlock = () => { audio.unlock(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
addEventListener('pointerdown', unlock);
addEventListener('keydown', unlock);

// ---------- depuración (?debug=1) ----------
if (DEBUG) {
  window.__swag = {
    get scene() { return playScene; },
    press(a) { engine.queue.push(a); },
    setEnergy(v) { if (playScene) playScene.state.energy = v; },
    winNow() { if (playScene) { playScene.state.day = TUNING.days.count - 1; playScene.dayT = TUNING.days.lengthSec - 0.05; } },
    loseNow() { if (playScene) playScene.state.energy = 0.01; },
    start: startGame,
    lastResults: null,
  };
}

// ---------- arranque ----------
syncSoundButtons();
refreshMenu();
engine.setScene(menuScene);
