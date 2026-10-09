// SWAG RUSH v2 — arranque, puente DOM↔juego, niveles, tienda y resultados
import { Engine } from './core/engine.js';
import { audio } from './core/audio.js';
import { storage, levelProgress, setLevelProgress, highestUnlocked } from './core/storage.js';
import { TUNING } from './config/tuning.js';
import { DAYS, COPY } from './config/brand.js';
import { LEVELS, levelById } from './config/levels.js';
import { ABILITIES, abilityById, UPGRADE_COST } from './config/abilities.js';
import { SKINS, EFFECTS, CARDS, EARN, coinsEarned, spend } from './config/economy.js';
import { MenuScene } from './scenes/menu.js';
import { PlayScene } from './scenes/play.js';
import { ResultsScene } from './scenes/results.js';
import { breakdown, starsFor, fmt } from './game/scoring.js';
import { shareResults } from './game/sharecard.js';

const $ = (id) => document.getElementById(id);
const engine = new Engine($('game'));
const PARAMS = new URLSearchParams(location.search);
const DEBUG = PARAMS.has('debug');

// ---------- pantallas ----------
const SCREENS = ['screen-menu', 'screen-levels', 'screen-shop', 'screen-howto', 'screen-pause', 'screen-results', 'screen-swag'];
function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('active', s === id);
}
let backTarget = 'screen-menu'; // de dónde se abrió la tienda

let toastTimer = null;
function toast(msg, ms = 2400) {
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
  setCoins(n) { $('hud-coins').innerHTML = `⚡ <b>${fmt(n)}</b>`; },
  setProgress(p) { $('progress-fill').style.width = `${(p * 100).toFixed(1)}%`; },
  setLevelChip(level) { $('level-chip').textContent = `${level.day} · ${level.name.toUpperCase()}`; },
  setPips(lit) {
    document.querySelectorAll('#pillar-pips .pip').forEach((p) =>
      p.classList.toggle('lit', lit.includes(p.dataset.p)));
  },
  showCombo(v, mult) {
    const el = $('combo-badge');
    el.classList.toggle('hidden', !v && !mult);
    el.textContent = mult ? 'MULTIPLICADOR ×3' : 'MODO SWAG ×2';
    el.classList.toggle('gold', !!mult && !v);
  },
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
  // barra de habilidades: se construye al entrar al nivel y se actualiza cada frame
  buildAbilityBar(abilities, slots, levelId) {
    const bar = $('ability-bar');
    bar.innerHTML = '';
    for (const ab of abilities) {
      const owned = slots[ab.id];
      const locked = !owned;
      const el = document.createElement('button');
      el.className = `ab-slot ${locked ? 'locked' : ''}`;
      el.dataset.id = ab.id;
      el.setAttribute('aria-label', locked ? `${ab.name}: se desbloquea en el nivel ${ab.unlockLevel}` : `${ab.name} (tecla ${ab.key})`);
      el.innerHTML = `
        <span class="ab-ico" style="--ab:${ab.color}">${ab.ico}</span>
        <span class="ab-key">${ab.key}</span>
        <span class="ab-cd"></span>
        ${locked ? `<span class="ab-lock">Nv.${ab.unlockLevel}</span>` : `<span class="ab-lvl">${'●'.repeat(owned.lvl)}</span>`}`;
      el.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        if (locked) { toast(`🔒 ${ab.name} se desbloquea en el nivel ${ab.unlockLevel}`); audio.deny(); return; }
        engine.queue.push(`ab${ab.key}`);
      });
      bar.appendChild(el);
    }
  },
  updateAbilityBar(abilities, slots, now) {
    document.querySelectorAll('#ability-bar .ab-slot').forEach((el) => {
      const ab = abilities.find((a) => a.id === el.dataset.id);
      const s = slots[ab.id];
      if (!s) return;
      const cdEl = el.querySelector('.ab-cd');
      const active = s.activeUntil > now;
      const cdLeft = s.cdUntil - now;
      el.classList.toggle('active', active);
      el.classList.toggle('cooling', !active && cdLeft > 0);
      if (active) {
        const total = ab.duration[s.lvl - 1];
        cdEl.style.setProperty('--p', String(1 - (s.activeUntil - now) / total));
        cdEl.textContent = '';
      } else if (cdLeft > 0) {
        const total = ab.cooldown[s.lvl - 1];
        cdEl.style.setProperty('--p', String(1 - cdLeft / total));
        cdEl.textContent = Math.ceil(cdLeft);
      } else {
        cdEl.style.setProperty('--p', '1');
        cdEl.textContent = '';
      }
    });
  },
};

// ---------- flujo ----------
const menuScene = new MenuScene(engine);
const resultsScene = new ResultsScene(engine);
let playScene = null;
let lastResults = null;
let lastLevelId = 1;

function syncAbilityUnlocks() {
  // desbloquea habilidades según el nivel más alto alcanzado
  const max = highestUnlocked();
  const abilities = { ...storage.get('abilities') };
  let changed = false;
  for (const ab of ABILITIES) {
    if (ab.unlockLevel <= max && !abilities[ab.id]) { abilities[ab.id] = 1; changed = true; }
  }
  if (changed) storage.set('abilities', abilities);
}

function startGame(levelId) {
  const level = levelById(levelId);
  if (!level) return;
  lastLevelId = level.id;
  syncAbilityUnlocks();
  showScreen(null);
  const skin = SKINS.find((s) => s.id === storage.get('skin')) || SKINS[0];
  const effect = EFFECTS.find((e) => e.id === storage.get('effect')) || EFFECTS[0];
  playScene = new PlayScene(engine, ui, endRun);
  engine.setScene(playScene, {
    level, skin, effect,
    abilities: storage.get('abilities'),
    firstRun: (storage.get('runs') || 0) === 0,
  });
}

// Objetivos del nivel: evaluación para ✓ en resultados
function objectiveMet(id, results) {
  const s = results.stats;
  if (id === 'clear') return results.win;
  if (id === 'nohit') return results.win && s.noHit;
  let m = id.match(/^coins(\d+)$/); if (m) return s.coins >= Number(m[1]);
  m = id.match(/^combo(\d+)$/); if (m) return s.combos >= Number(m[1]);
  m = id.match(/^rings(\d+)$/); if (m) return s.rings >= Number(m[1]);
  m = id.match(/^ability(\d+)$/); if (m) return s.abilitiesUsed >= Number(m[1]);
  m = id.match(/^stars(\d+)$/); if (m) return s.stars >= Number(m[1]);
  return false;
}

function endRun(results) {
  playScene = null;
  lastResults = results;
  if (DEBUG) window.__swag.lastResults = results;
  if (!results) { goMenu(); return; }

  const level = levelById(results.levelId);
  const prev = levelProgress(level.id);
  const stars = results.win ? starsFor(level, results.score) : 0;
  const newStars = Math.max(stars, prev.stars);
  const isRecord = results.score > (prev.best || 0);

  // monedas ganadas (con reglas anti-farm: primeras veces y repetición)
  const earn = coinsEarned({
    level: level.id,
    pickups: results.stats.coins,
    combos: results.stats.combos,
    rings: results.stats.rings,
    flags: {
      cleared: results.win,
      firstClear: results.win && !prev.cleared,
      replayed: !!prev.cleared,
      newStars, prevStars: prev.stars,
      noHit: results.stats.noHit,
      cardNew: results.stats.card && !prev.card,
    },
  });
  storage.set('coins', (storage.get('coins') || 0) + earn.total);

  // progreso del nivel
  if (results.win) {
    setLevelProgress(level.id, {
      cleared: true,
      stars: newStars,
      best: Math.max(prev.best || 0, results.score),
      card: prev.card || results.stats.card,
    });
    if (results.score > (storage.get('best') || 0)) storage.set('best', results.score);
    syncAbilityUnlocks();
    const allCleared = LEVELS.every((l) => levelProgress(l.id).cleared);
    if (allCleared && !storage.get('weekCleared')) storage.set('weekCleared', true);
  } else if (results.stats.card && !prev.card) {
    setLevelProgress(level.id, { card: true });
  }
  storage.set('runs', (storage.get('runs') || 0) + 1);
  lastResults.earn = earn;
  lastResults.stars = stars;
  lastResults.isRecord = isRecord;
  lastResults.weekCleared = storage.get('weekCleared') === true;

  renderResults(results, level, stars, isRecord, earn);
  showScreen('screen-results');
  engine.setScene(resultsScene, { win: results.win });
}

function renderResults(results, level, stars, isRecord, earn) {
  const weekJust = results.win && level.id === 5 && storage.get('weekCleared');
  $('results-kicker').textContent = !results.win ? COPY.loseKicker : weekJust ? COPY.weekKicker : COPY.winKicker;
  $('results-kicker').classList.toggle('lose', !results.win);
  $('results-title').textContent = !results.win ? COPY.loseTitle : weekJust ? COPY.weekTitle : `${COPY.winTitle}: ${level.day.toLowerCase()}`;
  // estrellas
  document.querySelectorAll('#results-stars span').forEach((el, i) => {
    el.textContent = results.win ? '★' : '☆';
    el.classList.toggle('on', results.win && i < stars);
  });
  $('final-score').textContent = fmt(results.score);
  $('new-record').classList.toggle('hidden', !isRecord || !results.win);
  const bd = breakdown(results.acc);
  $('breakdown').innerHTML = bd.rows.map(([k, v]) => `<li><span>${k}</span><b>+${fmt(v)}</b></li>`).join('');
  // monedas
  $('coins-breakdown').innerHTML = earn.rows.length
    ? earn.rows.map((r) => `<li><span>${r.label}</span><b>+${fmt(r.n)} ⚡</b></li>`).join('')
    : '<li><span>Sin monedas esta vez — ¡inténtalo de nuevo!</span><b>+0 ⚡</b></li>';
  $('coins-total').textContent = `+${fmt(earn.total)} ⚡`;
  // objetivos
  $('objectives').innerHTML = level.objectives.map((o) => {
    const met = objectiveMet(o.id, results);
    return `<li class="${met ? 'met' : ''}">${met ? '✅' : '⬜'} ${o.text}</li>`;
  }).join('');
  // desbloqueos nuevos
  const notes = [];
  if (results.win && level.id < 5 && !levelProgress(level.id + 1).cleared && level.id + 1 <= highestUnlocked()) {
    notes.push(`🔓 Nivel desbloqueado: ${levelById(level.id + 1).day}`);
  }
  for (const ab of ABILITIES) {
    if (ab.unlockLevel === level.id + 1 && results.win) notes.push(`🎓 Habilidad desbloqueada: ${ab.ico} ${ab.name} (tecla ${ab.key})`);
  }
  if (results.stats.card) notes.push('🂠 Encontraste la carta oculta de este día');
  const un = $('unlock-note');
  if (notes.length) { un.innerHTML = notes.join('<br>'); un.classList.remove('hidden'); }
  else un.classList.add('hidden');
  // botón siguiente
  const next = $('btn-next');
  const canNext = results.win && level.id < 5;
  next.classList.toggle('hidden', !canNext);
}

function goMenu() {
  refreshMenu();
  showScreen('screen-menu');
  engine.setScene(menuScene);
}

// ---------- menú ----------
function refreshMenu() {
  $('menu-best').textContent = fmt(storage.get('best') || 0);
  $('menu-coins').textContent = fmt(storage.get('coins') || 0);
  $('menu-week').classList.toggle('hidden', !storage.get('weekCleared'));
}

// ---------- niveles ----------
function renderLevels() {
  syncAbilityUnlocks();
  const max = highestUnlocked();
  const list = $('levels-list');
  list.innerHTML = '';
  for (const lv of LEVELS) {
    const p = levelProgress(lv.id);
    const locked = lv.id > max;
    const el = document.createElement('button');
    el.className = `level-card ${locked ? 'locked' : ''} ${p.cleared ? 'cleared' : ''}`;
    el.innerHTML = `
      <div class="lv-day">${lv.day}</div>
      <div class="lv-body">
        <b>${lv.name}</b>
        <span>${locked ? `Supera el ${DAYS[lv.id - 2]} para desbloquear` : lv.desc}</span>
        <div class="lv-meta">
          <span class="lv-stars">${[1, 2, 3].map((i) => `<i class="${i <= p.stars ? 'on' : ''}">★</i>`).join('')}</span>
          ${p.best ? `<span class="lv-best">Récord: ${fmt(p.best)}</span>` : ''}
          ${p.card ? '<span class="lv-card" title="Carta encontrada">🂠</span>' : ''}
        </div>
      </div>
      <div class="lv-state">${locked ? '🔒' : p.cleared ? '✅' : '▶'}</div>`;
    el.addEventListener('click', () => {
      audio.click();
      if (locked) { toast(`🔒 Supera el ${DAYS[lv.id - 2]} para desbloquear este día`); return; }
      if (!storage.get('seenHowto')) { pendingLevel = lv.id; showScreen('screen-howto'); return; }
      startGame(lv.id);
    });
    list.appendChild(el);
  }
}
let pendingLevel = null;

// ---------- tienda ----------
let shopTab = 'abilities';
function renderShop() {
  $('shop-coins').textContent = fmt(storage.get('coins') || 0);
  document.querySelectorAll('.shop-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === shopTab));
  const grid = $('shop-grid');
  grid.innerHTML = '';
  const coins = storage.get('coins') || 0;

  if (shopTab === 'abilities') {
    syncAbilityUnlocks();
    const owned = storage.get('abilities');
    for (const ab of ABILITIES) {
      const lvl = owned[ab.id] || 0;
      const el = document.createElement('div');
      el.className = 'shop-item';
      let action;
      if (!lvl) action = `<span class="shop-lock">🔒 Se desbloquea en el nivel ${ab.unlockLevel}</span>`;
      else if (lvl >= 3) action = `<span class="shop-max">NIVEL MÁXIMO</span>`;
      else {
        const cost = UPGRADE_COST[lvl];
        action = `<button class="btn btn-primary btn-buy" data-id="${ab.id}" ${coins < cost ? 'disabled' : ''}>Mejorar · ${cost} ⚡</button>`;
      }
      el.innerHTML = `
        <div class="si-ico" style="--ab:${ab.color}">${ab.ico}</div>
        <div class="si-body">
          <b>${ab.name} ${lvl ? `<small class="si-lvl">${'●'.repeat(lvl)}${'○'.repeat(3 - lvl)}</small>` : ''}</b>
          <span>${ab.short}</span>
          ${lvl ? `<small class="si-stats">Duración ${ab.duration[lvl - 1]}s · Recarga ${ab.cooldown[lvl - 1]}s</small>` : ''}
        </div>
        <div class="si-action">${action}</div>`;
      grid.appendChild(el);
    }
    grid.querySelectorAll('.btn-buy').forEach((b) => b.addEventListener('click', () => {
      const ab = abilityById(b.dataset.id);
      const owned2 = { ...storage.get('abilities') };
      const lvl = owned2[ab.id] || 0;
      const cost = UPGRADE_COST[lvl];
      const left = spend(storage.get('coins') || 0, cost);
      if (left == null || lvl >= 3) { audio.deny(); return; }
      owned2[ab.id] = lvl + 1;
      storage.merge({ coins: left, abilities: owned2 });
      audio.buy();
      toast(`🎓 ${ab.name} mejorada a nivel ${lvl + 1}`);
      renderShop();
    }));
  }

  if (shopTab === 'skins' || shopTab === 'effects') {
    const isSkins = shopTab === 'skins';
    const catalog = isSkins ? SKINS : EFFECTS;
    const ownedKey = isSkins ? 'skins' : 'effects';
    const selKey = isSkins ? 'skin' : 'effect';
    const owned = storage.get(ownedKey);
    const selected = storage.get(selKey);
    for (const item of catalog) {
      const has = owned.includes(item.id);
      const sel = selected === item.id;
      const el = document.createElement('div');
      el.className = 'shop-item';
      const sw = isSkins
        ? (item.hoodie === 'irid' ? 'linear-gradient(135deg,#D7262E,#F2A900,#35D6E6,#3456E8)' : item.hoodie)
        : (item.color || '#2C2C36');
      el.innerHTML = `
        <div class="si-ico si-sw" style="background:${sw}">${isSkins ? '' : '✨'}</div>
        <div class="si-body"><b>${item.name}</b><span>${isSkins ? 'Apariencia del corredor' : item.id === 'ninguno' ? 'El corredor no deja estela' : 'Estela de color al correr'}</span></div>
        <div class="si-action">
          ${sel ? '<span class="shop-max">EN USO</span>'
            : has ? `<button class="btn btn-ghost btn-pick" data-id="${item.id}">Usar</button>`
            : `<button class="btn btn-primary btn-pick" data-id="${item.id}" ${coins < item.cost ? 'disabled' : ''}>${item.cost} ⚡</button>`}
        </div>`;
      grid.appendChild(el);
    }
    grid.querySelectorAll('.btn-pick').forEach((b) => b.addEventListener('click', () => {
      const item = catalog.find((x) => x.id === b.dataset.id);
      const has2 = storage.get(ownedKey).includes(item.id);
      if (!has2) {
        const left = spend(storage.get('coins') || 0, item.cost);
        if (left == null) { audio.deny(); return; }
        storage.merge({ coins: left, [ownedKey]: [...storage.get(ownedKey), item.id] });
        audio.buy();
        toast(`✨ «${item.name}» desbloqueado`);
      } else audio.click();
      storage.set(selKey, item.id);
      renderShop();
    }));
  }

  if (shopTab === 'cards') {
    for (const c of CARDS) {
      const found = levelProgress(c.id).card;
      const el = document.createElement('div');
      el.className = `shop-item card-item ${found ? '' : 'missing'}`;
      el.innerHTML = `
        <div class="si-ico" style="--ab:${c.color}">${found ? c.ico : '❔'}</div>
        <div class="si-body"><b>${found ? c.name : 'Carta oculta'}</b>
        <span>${found ? `Encontrada el ${DAYS[c.id - 1].toLowerCase()}` : `Escondida en el nivel ${c.id} · +${EARN.hiddenCard} ⚡`}</span></div>
        <div class="si-action">${found ? '<span class="shop-max">✓</span>' : ''}</div>`;
      grid.appendChild(el);
    }
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
$('btn-play').addEventListener('click', () => { audio.click(); renderLevels(); showScreen('screen-levels'); });
$('btn-levels-back').addEventListener('click', () => { audio.click(); goMenu(); });
$('btn-shop').addEventListener('click', () => { audio.click(); backTarget = 'screen-menu'; renderShop(); showScreen('screen-shop'); });
$('btn-shop-back').addEventListener('click', () => {
  audio.click();
  if (backTarget === 'screen-results') showScreen('screen-results');
  else goMenu();
});
document.querySelectorAll('.shop-tab').forEach((t) => t.addEventListener('click', () => {
  audio.click(); shopTab = t.dataset.tab; renderShop();
}));
$('btn-howto').addEventListener('click', () => { audio.click(); pendingLevel = null; showScreen('screen-howto'); });
$('btn-howto-play').addEventListener('click', () => {
  audio.click();
  storage.set('seenHowto', true);
  startGame(pendingLevel || 1);
});
$('btn-howto-back').addEventListener('click', () => { audio.click(); goMenu(); });
$('btn-sound').addEventListener('click', toggleSound);
$('btn-pause-sound').addEventListener('click', toggleSound);
$('btn-pause').addEventListener('click', () => playScene?.pause());
$('btn-resume').addEventListener('click', () => { audio.click(); playScene?.resume(); });
$('btn-quit').addEventListener('click', () => { audio.click(); playScene?.quitToMenu(); });
$('btn-again').addEventListener('click', () => { audio.click(); startGame(lastLevelId); });
$('btn-next').addEventListener('click', () => { audio.click(); startGame(Math.min(5, lastLevelId + 1)); });
$('btn-results-shop').addEventListener('click', () => { audio.click(); backTarget = 'screen-results'; renderShop(); showScreen('screen-shop'); });
$('btn-menu').addEventListener('click', () => { audio.click(); goMenu(); });
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
    const level = levelById(r.levelId);
    const mode = await shareResults({
      score: r.score, stars: r.stars || 0, win: r.win,
      levelName: level.name, day: level.day,
      coinsEarned: r.earn?.total || 0,
      weekCleared: r.win && level.id === 5 && r.weekCleared,
      best: r.isRecord,
    });
    toast(mode === 'shared' ? '📤 ¡Compartido!' : mode === 'cancelled' ? 'Compartir cancelado' : '📥 Tarjeta descargada. ¡Publícala!');
  } catch { toast('No se pudo generar la tarjeta'); }
  btn.disabled = false; btn.textContent = '📤 Compartir';
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) playScene?.pause();
});

const unlock = () => { audio.unlock(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
addEventListener('pointerdown', unlock);
addEventListener('keydown', unlock);

// ---------- depuración (?debug=1[&seed=N][&level=N]) ----------
if (DEBUG) {
  window.__swag = {
    get scene() { return playScene; },
    press(a) { engine.queue.push(a); },
    cast(k) { engine.queue.push(`ab${k}`); },
    setRitmo(v) { if (playScene) playScene.state.energy = v; },
    winNow() { if (playScene) playScene.levelT = playScene.level.lengthSec - 0.05; },
    loseNow() { if (playScene) playScene.state.energy = 0.01; },
    grantCoins(n) { storage.set('coins', (storage.get('coins') || 0) + n); },
    unlockAll() {
      const abilities = {};
      for (const ab of ABILITIES) abilities[ab.id] = 3;
      storage.merge({
        coins: 9999, abilities,
        skins: SKINS.map((s) => s.id), effects: EFFECTS.map((e) => e.id),
      });
      for (const l of LEVELS) setLevelProgress(l.id, { cleared: true, stars: 3, best: 9999, card: true });
      storage.set('weekCleared', true);
    },
    start: startGame,
    lastResults: null,
    storage,
  };
}

// ---------- arranque ----------
syncSoundButtons();
refreshMenu();
engine.setScene(menuScene);
const lvlParam = PARAMS.get('level');
if (DEBUG && lvlParam) {
  storage.set('seenHowto', true);
  startGame(Number(lvlParam));
}
