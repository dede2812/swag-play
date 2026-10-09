// Tarjeta de resultado compartible (1080×1350, 4:5) generada 100% en el cliente
import { BRAND, DAYS } from '../config/brand.js';
import { fmt } from './scoring.js';
import { roundRect } from '../core/utils.js';

const W = 1080, H = 1350;

export async function makeShareCard({ score, badge, daysCompleted, win, best }) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // fondo con degradado de marca
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0B0B0D');
  bg.addColorStop(0.55, '#16161B');
  bg.addColorStop(1, win ? '#123B38' : '#3A0E14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // aros decorativos
  ctx.strokeStyle = 'rgba(93,193,185,.16)'; ctx.lineWidth = 2;
  for (const r of [380, 520, 660]) {
    ctx.beginPath(); ctx.arc(W / 2, 560, r, 0, Math.PI * 2); ctx.stroke();
  }

  // logo iridiscente
  try {
    const logo = await loadImage('assets/brand/logo-iridiscente.png');
    const lw = 420, lh = logo.height * (lw / logo.width);
    ctx.drawImage(logo, (W - lw) / 2, 90, lw, lh);
  } catch { /* si falta el logo, sigue sin él */ }

  ctx.textAlign = 'center';
  // kicker
  ctx.fillStyle = win ? BRAND.aquaLight : BRAND.redLight;
  ctx.font = '900 44px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(win ? '¡SEMANA IMPOSIBLE COMPLETADA!' : 'CASI DOMO LA SEMANA', W / 2, 480);

  // puntuación
  ctx.fillStyle = BRAND.ice;
  ctx.font = '900 220px "Segoe UI", system-ui, sans-serif';
  ctx.shadowColor = 'rgba(93,193,185,.45)'; ctx.shadowBlur = 60;
  ctx.fillText(fmt(score), W / 2, 700);
  ctx.shadowBlur = 0;
  ctx.fillStyle = BRAND.silver;
  ctx.font = '800 40px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('P U N T O S   S W A G', W / 2, 765);

  // medalla
  if (badge) {
    ctx.font = '900 52px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = BRAND.gold;
    ctx.fillText(`${badge.ico} ${badge.name}`, W / 2, 870);
  }

  // días completados
  const dotY = 950;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 + (i - 2) * 90, dotY, 26, 0, Math.PI * 2);
    ctx.fillStyle = i < daysCompleted ? BRAND.aqua : '#2C2C36';
    ctx.fill();
    ctx.fillStyle = i < daysCompleted ? '#07201d' : BRAND.silver;
    ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(DAYS[i][0], W / 2 + (i - 2) * 90, dotY + 9);
  }
  if (best) {
    ctx.fillStyle = BRAND.gold;
    ctx.font = '900 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('🔥 NUEVO RÉCORD PERSONAL', W / 2, 1050);
  }

  // CTA
  ctx.fillStyle = BRAND.red;
  roundRect(ctx, W / 2 - 330, 1110, 660, 96, 48); ctx.fill();
  ctx.fillStyle = BRAND.ice;
  ctx.font = '900 40px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('JUEGA SWAG RUSH', W / 2, 1172);

  ctx.fillStyle = BRAND.silver;
  ctx.font = '700 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SWAG · Tu día, con espacio · Conoce el proyecto', W / 2, 1275);

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
