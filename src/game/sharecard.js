// Tarjeta de resultado compartible (1080×1350, 4:5) generada 100% en el cliente
import { BRAND } from '../config/brand.js';
import { fmt } from './scoring.js';
import { roundRect } from '../core/utils.js';

const W = 1080, H = 1350;

export async function makeShareCard({ score, stars, levelName, day, coinsEarned, win, weekCleared, best }) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // fondo con degradado de marca
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0B0B0D');
  bg.addColorStop(0.55, '#16161B');
  bg.addColorStop(1, win ? '#0E3A40' : '#3A0E14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // aros decorativos cian (bienestar)
  ctx.strokeStyle = 'rgba(53,214,230,.16)'; ctx.lineWidth = 2;
  for (const r of [380, 520, 660]) {
    ctx.beginPath(); ctx.arc(W / 2, 560, r, 0, Math.PI * 2); ctx.stroke();
  }

  // logo iridiscente oficial
  try {
    const logo = await loadImage('assets/brand/logo-iridiscente.png');
    const lw = 420, lh = logo.height * (lw / logo.width);
    ctx.drawImage(logo, (W - lw) / 2, 90, lw, lh);
  } catch { /* si falta el logo, sigue sin él */ }

  ctx.textAlign = 'center';
  // kicker
  ctx.fillStyle = win ? '#9BEEF6' : BRAND.redLight;
  ctx.font = '900 44px Montserrat, "Segoe UI", system-ui, sans-serif';
  const kicker = weekCleared ? '¡SEMANA IMPOSIBLE COMPLETADA!' : win ? `¡${day} SUPERADO!` : `EL ${day} ME GANÓ…`;
  ctx.fillText(kicker, W / 2, 480);

  // puntuación
  ctx.fillStyle = BRAND.ice;
  ctx.font = '900 210px Montserrat, "Segoe UI", system-ui, sans-serif';
  ctx.shadowColor = 'rgba(53,214,230,.45)'; ctx.shadowBlur = 60;
  ctx.fillText(fmt(score), W / 2, 690);
  ctx.shadowBlur = 0;
  ctx.fillStyle = BRAND.silver;
  ctx.font = '800 38px Montserrat, "Segoe UI", system-ui, sans-serif';
  ctx.fillText('P U N T O S   S W A G', W / 2, 752);

  // estrellas del nivel
  if (win) {
    ctx.font = '400 84px system-ui';
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < stars ? 1 : 0.25;
      ctx.fillText('⭐', W / 2 + (i - 1) * 110, 860);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = BRAND.silver;
    ctx.font = '800 34px Montserrat, "Segoe UI", system-ui, sans-serif';
    ctx.fillText(levelName.toUpperCase(), W / 2, 930);
  }

  // energía ganada
  if (coinsEarned > 0) {
    ctx.fillStyle = BRAND.cyan;
    ctx.font = '900 46px Montserrat, "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`+${fmt(coinsEarned)} ⚡ ENERGÍA SWAG`, W / 2, 1010);
  }
  if (best) {
    ctx.fillStyle = BRAND.gold;
    ctx.font = '900 38px Montserrat, "Segoe UI", system-ui, sans-serif';
    ctx.fillText('🔥 NUEVO RÉCORD PERSONAL', W / 2, 1080);
  }

  // CTA
  ctx.fillStyle = BRAND.red;
  roundRect(ctx, W / 2 - 330, 1130, 660, 96, 48); ctx.fill();
  ctx.fillStyle = BRAND.ice;
  ctx.font = '900 40px Montserrat, "Segoe UI", system-ui, sans-serif';
  ctx.fillText('JUEGA SWAG RUSH', W / 2, 1192);

  ctx.fillStyle = BRAND.silver;
  ctx.font = '700 30px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SWAG · Tu día, con espacio · Conoce el proyecto', W / 2, 1290);

  return cv;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Descarga o comparte la tarjeta según capacidad del dispositivo
export async function shareResults(stats) {
  const cv = await makeShareCard(stats);
  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
  const fileName = 'swag-rush-resultado.png';
  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'SWAG RUSH', text: `Hice ${fmt(stats.score)} puntos en SWAG RUSH — La Semana Imposible. ¿Me superas?` });
      return 'shared';
    }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
