// El corredor: personaje vectorial de espaldas con ciclo de carrera, salto y estilos
import { TUNING } from '../config/tuning.js';
import { BRAND } from '../config/brand.js'; // TUNING solo para físicas
import { clamp, lerp } from '../core/utils.js';

export class Player {
  constructor() {
    this.lane = 1;
    this.x = 0;               // offset visual suavizado hacia el carril
    this.jumpY = 0;           // altura de salto actual
    this.jumpVel = 0;
    this.grounded = true;
    this.runT = 0;
    this.lean = 0;            // inclinación al cambiar de carril
    this.landSquash = 0;
    this.skin = { id: 'clasico', hoodie: '#D7262E', pants: '#1B1B24' }; // estilo por defecto
    this.iridT = 0;
  }

  setSkin(skin) { this.skin = skin; }

  move(dir) {
    const next = clamp(this.lane + dir, 0, 2);
    if (next !== this.lane) {
      this.lane = next;
      this.lean = dir * 1;
      return true;
    }
    return false;
  }

  jump() {
    if (!this.grounded) return false;
    this.grounded = false;
    this.jumpVel = TUNING.player.jumpVel;
    return true;
  }

  update(dt, speed) {
    this.runT += dt * (0.9 + speed / 380);
    this.iridT += dt;
    // suavizado de carril
    const target = (this.lane - 1);
    this.x = lerp(this.x, target, 1 - Math.exp(-TUNING.player.laneLerp * dt));
    this.lean = lerp(this.lean, 0, 1 - Math.exp(-8 * dt));
    // salto
    if (!this.grounded) {
      this.jumpVel -= TUNING.player.gravity * dt;
      this.jumpY += this.jumpVel * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0; this.grounded = true; this.landSquash = 1;
      }
    }
    this.landSquash = Math.max(0, this.landSquash - dt * 5);
  }

  get airborne() { return !this.grounded; }

  hoodieColor(ctx, x, y) {
    if (this.skin.hoodie !== 'irid') return this.skin.hoodie;
    const g = ctx.createLinearGradient(x - 30, y - 90, x + 30, y);
    const h = (this.iridT * 60) % 360;
    g.addColorStop(0, `hsl(${h}, 75%, 60%)`);
    g.addColorStop(0.5, `hsl(${(h + 90) % 360}, 75%, 55%)`);
    g.addColorStop(1, `hsl(${(h + 180) % 360}, 75%, 60%)`);
    return g;
  }

  render(ctx, cx, groundY, invulnFlashing) {
    const x = cx + this.x * TUNING.laneSpreadNear;
    const jumpH = this.jumpY * 0.35;
    const y = groundY - jumpH;
    const run = this.runT * 11;
    const legSwing = this.grounded ? Math.sin(run) : 0.6;
    const armSwing = this.grounded ? Math.sin(run + Math.PI) : -0.8;
    const squash = this.landSquash * 0.14;
    const sx = 1 + squash, sy = 1 - squash;

    ctx.save();
    ctx.translate(x, y);
    if (invulnFlashing && Math.floor(this.iridT * 14) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.rotate(this.lean * 0.14);
    ctx.scale(sx, sy);

    // sombra en el suelo
    const shScale = 1 - clamp(jumpH / 220, 0, 0.55);
    ctx.save();
    ctx.translate(0, jumpH + 6);
    ctx.scale(shScale, shScale * 0.9);
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const pants = this.skin.pants;
    const hoodie = this.hoodieColor(ctx, 0, 0);

    // piernas (vista trasera, alternadas)
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const ph = side === -1 ? legSwing : -legSwing;
      const hipX = side * 9, hipY = -38;
      const kneeX = hipX + side * 3 + ph * 10, kneeY = hipY + 20 - Math.abs(ph) * 6;
      const footX = kneeX + ph * 14, footY = -4 - Math.max(0, ph) * 12;
      ctx.strokeStyle = pants; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.quadraticCurveTo(kneeX, kneeY, footX, footY); ctx.stroke();
      // tenis blancos
      ctx.strokeStyle = BRAND.ice; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(footX - 2, footY); ctx.lineTo(footX + 6, footY); ctx.stroke();
    }

    // torso (hoodie)
    ctx.fillStyle = hoodie;
    ctx.beginPath();
    ctx.moveTo(-16, -78);
    ctx.quadraticCurveTo(0, -86, 16, -78);
    ctx.lineTo(14, -40);
    ctx.quadraticCurveTo(0, -34, -14, -40);
    ctx.closePath(); ctx.fill();
    // capucha
    ctx.beginPath(); ctx.arc(0, -76, 10, Math.PI, 0); ctx.fill();

    // brazos bombeando
    for (const side of [-1, 1]) {
      const ph = side === -1 ? armSwing : -armSwing;
      const shX = side * 15, shY = -70;
      const handX = shX + side * 7 + ph * 9, handY = shY + 22 + ph * 5;
      ctx.strokeStyle = hoodie; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(shX, shY); ctx.quadraticCurveTo(shX + side * 8, shY + 12, handX, handY); ctx.stroke();
    }

    // cabeza + gorra de marca
    ctx.fillStyle = '#E8B88A';
    ctx.beginPath(); ctx.arc(0, -92, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.skin.hoodie === 'irid' ? BRAND.red : this.skin.hoodie;
    ctx.beginPath(); ctx.arc(0, -95, 12.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12.5, -97, 25, 4);
    // logo S en la espalda
    ctx.fillStyle = 'rgba(247,249,252,.92)';
    ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, -58);

    ctx.restore();
  }
}
