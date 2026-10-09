# SWAG RUSH — La Semana Imposible 🏃‍♂️⚡

Videojuego publicitario interactivo de **SWAG** (*Tu día, con espacio*). Un runner arcade móvil-first: corre de lunes a viernes, equilibra **Academia 📖 · Deporte 👟 · Bienestar 💙**, esquiva el caos y activa el **MODO SWAG ×2**.

**▶ Jugar:** https://dede2812.github.io/swag-play/

Sin instalación, sin registro, sin anuncios. HTML + Canvas 2D + Web Audio en JavaScript puro — cero dependencias, cero build, ~120 KB.

---

## Cómo se juega

| Acción | Móvil | Teclado |
|---|---|---|
| Cambiar de carril | Deslizar ◀ ▶ | ← → o A / D |
| Saltar barreras | Deslizar ▲ o tocar | ↑, W o Espacio |
| Pausa | Botón ❚❚ | P o Esc |

- Recoge ítems de los **3 pilares**: cada uno recarga energía ⚡ (+6).
- Combina **A+D+B en 10 s** → **MODO SWAG ×2** durante 6 s (cada ítem lo extiende).
- Esquiva **torres de notificaciones** 📱 y salta **barreras de caos** 🚧 (−18 ⚡ si te golpean).
- La energía se agota sola: quien no equilibra su semana, se desgasta.
- Sobrevive los 5 días → 🏆 **Semana Imposible Superada**. Medallas 🥉 3 500 · 🥈 7 500 · 🥇 11 500.
- Desbloquea estilos: **Cobalto** (bronce) e **Iridiscente** (oro). Comparte tu tarjeta de resultado.

## Ejecutar en local

Es un sitio estático; solo necesitas un servidor (los ES Modules no cargan desde `file://`):

```bash
cd swag-play
python3 -m http.server 8080
# abre http://localhost:8080
```

## Pruebas

```bash
# Lógica pura (13 pruebas: energía, combo, medallas, spawner justo…)
node --test tests/        # o: bun test

# E2E con Playwright (menú, tutorial, gameplay, pausa, victoria, derrota,
# tarjeta compartible, persistencia) — ver docs/05-pruebas.md
```

Modo depuración: abre con `?debug=1` (expone `window.__swag`) y `&seed=N` para partidas deterministas.

## Estructura

```
swag-play/
├── index.html            # pantallas DOM (menú, tutorial, pausa, resultados, SWAG)
├── styles/main.css       # identidad SWAG (tokens oficiales)
├── assets/brand/         # logos oficiales optimizados para web
├── src/
│   ├── main.js           # arranque y flujo de pantallas
│   ├── config/           # brand.js (tokens oficiales) · tuning.js (balance del juego)
│   ├── core/             # engine (loop/input) · audio (WebAudio) · storage · utils
│   ├── game/             # balance · scoring · spawner · world · entities · player · particles · sharecard
│   └── scenes/           # menu · play · results
├── tests/logic.test.mjs
└── docs/                 # 01 análisis · 02 investigación · 03 conceptos · 04 GDD · 05 pruebas · 06 lanzamiento
```

## Actualizar el juego

1. Clona el repo y crea una rama: `git checkout -b feat/mi-mejora`.
2. **Ajustar dificultad/puntuación:** todo está en `src/config/tuning.js` (velocidades, energía, umbrales de medallas, pesos de spawn). No toques la lógica para retocar números.
3. **Cambiar textos/colores de marca:** `src/config/brand.js` y `styles/main.css` (variables CSS).
4. Corre `node --test tests/` y verifica en móvil (`?debug=1` ayuda).
5. Pull Request a `main`. Al fusionarse, GitHub Pages republica solo en ~1 min.

### Reglas de marca SWAG (obligatorias)

- SWAG está en **pre-lanzamiento**: CTA siempre "Conoce el proyecto"; pantallas de la app se etiquetan "Interfaz del prototipo".
- No prometer funciones futuras, premios, descuentos ni beneficios económicos.
- Público con menores: sin registro, sin datos personales, sin leaderboards públicos, sin compras.
- Logos oficiales sin alterar (derivados solo de tamaño). Tokens de color del manual.

## Privacidad

El juego no envía ningún dato: el récord, estilos y ajustes viven en `localStorage` del dispositivo. La tarjeta para compartir se genera localmente en el navegador.

---

Hecho con la identidad visual oficial de SWAG · Juego publicitario de la campaña *La semana imposible*.
