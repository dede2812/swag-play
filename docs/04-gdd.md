# 04 · Game Design Document — SWAG RUSH: La Semana Imposible

> Fases 4-7 del Prompt Maestro — diseño definitivo, mecánicas, recompensas y conexión publicitaria.

## 1. Visión

Un runner arcade vertical donde **sobrevivir la semana escolar** es el desafío. El jugador corre de lunes a viernes recogiendo sus tres pilares —Academia, Deporte, Bienestar— mientras esquiva el caos (notificaciones, distracciones, barreras). La fantasía es 100% SWAG: *tu semana parece imposible hasta que la equilibras*.

- **Público:** 12-23 años, estudiantes y deportistas. Sesión objetivo: 2 minutos.
- **Fantasía:** "Mi semana es imposible… pero yo puedo".
- **Promesa publicitaria (implícita):** lo que equilibras en el juego, SWAG lo equilibra contigo en la vida real.

## 2. Bucle de juego

```
Ver carril → decidir (moverse / saltar / quedarse) → recoger pilar o esquivar caos
   → energía sube/baja → perseguir el combo de 3 pilares (MODO SWAG ×2)
   → aguantar hasta el viernes → medalla + récord + tarjeta para compartir → otra partida
```

- **Controles:** swipe ◀▶ / flechas / A-D para cambiar de carril; swipe ▲ / W / ↑ / tap para saltar. Pausa: P/Esc/botón. Móvil-first, jugable con una mano.
- **Cámara:** pseudo-3D tras el jugador, 3 carriles que convergen en el horizonte (Canvas 2D, proyección `p = k/(k+z)`).

## 3. Sistemas

### Energía ⚡ (vida)
- Inicia en 100. Drena ~2.1/s (+0.16 por día): *no recoger tus pilares te desgasta*.
- Ítem de pilar: +6. MODO SWAG activado: +12. Obstáculo: −18 (con 1.1 s de invulnerabilidad y ruptura de combo).
- A 0: derrota ("La semana te ganó").

### Pilares y MODO SWAG ✨ (mecánica firma)
- Recoger **A + D + B dentro de una ventana de 10 s** activa MODO SWAG: ×2 puntos durante 6 s, líneas de velocidad doradas; cada ítem dentro del modo lo extiende +2 s.
- Los pips del HUD muestran qué pilares llevas encendidos. El spawner **sugiere el pilar más descuidado** (55% de probabilidad) para que el equilibrio sea alcanzable y se sienta justo — la lección de Duolingo: retos alcanzables, no frustrantes.

### Días (5 etapas)
| Día | Cielo | Velocidad | Ritmo de spawn |
|---|---|---|---|
| Lunes | Amanecer aqua | 300 px/s | 1.05 s |
| Martes | Cobalto | 334 | 0.96 s |
| Miércoles | Atardecer dorado | 368 | 0.87 s |
| Jueves | Violeta (estrellas) | 402 | 0.78 s |
| Viernes | Noche roja | 436 | 0.69 s |

Cada día superado: **+500** y banner de transición. Viernes completado = **victoria**.

### Entidades
- **Ítems de pilar** (📖 libro azul / 👟 tenis roja / 💙 corazón aqua): +100 ×mult, +6 ⚡.
- **Estrella SWAG** ⭐ (5%): +250 ×mult.
- **Torre de notificaciones** 📱 (obstáculo alto): esquivar cambiando de carril.
- **Barrera de caos** 🚧 (obstáculo bajo): saltable; superarla limpio da +20 ("¡SALVO!").
- **Regla de justicia:** el spawner nunca bloquea los 3 carriles (invariante verificado en tests con 10 000 filas).

### Puntuación
Distancia 10/s (×mult) · Ítem 100 · Estrella 250 · Bono MODO SWAG 300 · Día 500.
Medallas: 🥉 3 500 · 🥈 7 500 · 🥇 11 500 · 🏆 insignia **Semana Imposible Superada** al ganar (supera a cualquier medalla).

## 4. Recompensas y gamificación (fase 6)

| Recompensa | Cómo se gana | Tipo |
|---|---|---|
| Puntos SWAG | Cada partida | Interna |
| Medallas Bronce/Plata/Oro | Umbrales de puntuación | Interna |
| 🏆 Semana Imposible Superada | Completar lunes-viernes | Interna |
| Estilo **Cobalto** | Medalla de Bronce (o completar semana) | Cosmética, persistente |
| Estilo **Iridiscente** (hoodie animado) | Medalla de Oro | Cosmética, persistente |
| Récord personal | Superar tu mejor puntuación | Local (sin servidor) |
| **Tarjeta de resultado** 1080×1350 | Al terminar | Compartible (generada en el cliente) |

**Líneas rojas respetadas:** sin compras, sin azar pagado, sin presión, sin leaderboard público (público con menores), sin prometer beneficios reales de SWAG. La tarjeta y los CTAs invitan a *conocer el proyecto* — nada más, porque SWAG está en prototipo.

## 5. Conexión publicitaria (fase 7)

- La publicidad **es la mecánica**: equilibrar pilares = propuesta de valor de SWAG. Nada interrumpe el juego.
- Pantalla final: puntuación → medalla → desglose → botones: 🔁 otra partida, 📤 compartir, ✨ **Conoce el proyecto** (overlay con los 3 pilares de la app, nota "Interfaz del prototipo", CTA de interés en el lanzamiento).
- El overlay **no inventa URLs ni promesas**: declara el estado real del producto (pre-lanzamiento).

## 6. Dirección de arte y audio

- **Paleta oficial SWAG** (tokens en `src/config/brand.js`), modo oscuro como la app; cielos por día con acentos aqua/cobalto/dorado/violeta/rojo.
- Personaje: corredor de espaldas con hoodie de marca (S en la espalda), ciclo de carrera procedural, squash & stretch en salto/aterrizaje, estela de polvo, invulnerabilidad parpadeante.
- Juice: partículas en recogida, anillo de pulso, popups de puntos, screen shake en golpes (desactivado con `prefers-reduced-motion`), viñeta roja de daño, confeti en victoria, banners de día, líneas de velocidad en MODO SWAG.
- Audio: sintetizado WebAudio (blips pentatónicos por pilar, riser de combo, fanfarria de victoria, bajo+hat a 104 BPM). Sin archivos, con silencio persistente.

## 7. Accesibilidad y seguridad

- `prefers-reduced-motion`: sin shake, menos partículas, animaciones DOM reducidas.
- Pausa automática al cambiar de pestaña/app. Sin datos personales: todo en `localStorage`. Sin red, sin trackers, sin cookies.
- Teclado completo, botones con `aria-label`, contraste alto (Ice White sobre SWAG Black).

## 8. Técnica

- ES Modules sin build; `index.html` + `styles/main.css` + `src/` (core, game, scenes, config).
- Lógica pura separada (`balance.js`, `scoring.js`, `spawner.js`) → tests en `tests/logic.test.mjs` (13 pruebas, `node --test`/`bun test`).
- Debug: `?debug=1` expone `window.__swag` (usado por las pruebas E2E de Playwright).
- Despliegue: GitHub Pages sirviendo la raíz de `main`.
