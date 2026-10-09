> **Espejo público jugable** de SWAG Rush. El código fuente de referencia vive en el repositorio privado `dede2812/SWAG` (carpeta `game/`, PR de integración). Este repo existe para desplegar el juego en GitHub Pages.

# SWAG RUSH — La Semana Imposible 🏃‍♂️⚡

Videojuego publicitario interactivo de **SWAG** (*Study. Work. Achieve. Grow.* · *Tu día, con espacio*), sitio estático independiente: **sin dependencias, sin build** — HTML + Canvas 2D + Web Audio en JavaScript puro (ES Modules), ~250 KB con las fuentes oficiales incluidas.

Runner arcade móvil-first: corre de lunes a viernes en 5 niveles progresivos, equilibra **Academia 📖 · Deporte 👟 · Bienestar ⚡**, domina **5 habilidades**, gana **Energía SWAG** y gástala en mejoras, estilos y efectos.

## Cómo se conecta con la app SWAG

| En el juego | En la app (`SWAG_Codigo_Beta_y_Atlas/beta`) |
|---|---|
| Habilidades de **Academia** (Concentración, Memoria, **Estrategia**…) | Gestión de clases/tareas/exámenes; *Estrategia* replica el motor de sugerencias ("Un ajuste que suma": la app marca el mejor hueco, el juego marca el mejor carril) |
| Desafíos de **Deporte** (esquivar, saltar, anillos de precisión, circuitos) | Eventos `training` del plan semanal |
| Moneda **Energía SWAG ⚡** | Check-in diario de Bienestar (`wellness.energy`): en la app registras tu energía; en el juego la ganas |
| Recurso de vida **RITMO** | Copy de Bienestar: "Escucha tu ritmo" |
| Colores de pilares | Tokens oficiales 3.0: estudio `#3456E8` · entreno `#FF766C` · bienestar `#35D6E6` |

## Ejecutar en local

Es un sitio estático; solo necesitas un servidor (los ES Modules no cargan desde `file://`):

```bash
cd game
python3 -m http.server 8080
# abre http://localhost:8080
```

## Pruebas

```bash
bun test          # o: node --test  → 22 pruebas de lógica pura
```

Modo depuración: `?debug=1` (expone `window.__swag`), `&seed=N` (partidas deterministas), `&level=N` (empezar en el nivel N). E2E con Playwright documentado en `docs/03-pruebas.md`.

## Estructura

```
(swag-play = raíz del juego)
├── index.html            # pantallas DOM (menú, niveles, tienda, tutorial, pausa, resultados, SWAG)
├── styles/main.css       # identidad SWAG 3.0 (Montserrat + Inter oficiales)
├── assets/
│   ├── brand/            # logos oficiales + set de favicons (letras blancas)
│   └── fonts/            # Montserrat/Inter variables, subset woff2 (OFL)
├── src/
│   ├── main.js           # arranque, niveles, tienda, resultados
│   ├── config/           # brand.js (tokens 3.0) · tuning · levels · abilities · economy
│   ├── core/             # engine (loop/input) · audio (WebAudio) · storage v2 · utils
│   ├── game/             # balance · scoring · spawner (patrones) · world · entities · player · particles · coach · sharecard
│   └── scenes/           # menu · play · results
├── tests/logic.test.mjs
└── docs/                 # 01 integración repo · 02 diseño v2 · 03 pruebas
```

## Actualizar el juego

1. Rama desde `main`: `git checkout -b feat/mi-mejora`.
2. **Dificultad/economía:** números en `src/config/tuning.js`, `levels.js`, `abilities.js`, `economy.js`. No toques la lógica para retocar valores.
3. **Marca:** tokens en `src/config/brand.js` (espejo de `SWAG_IDENTIDAD_VISUAL_FINAL/11_RECURSOS_DE_DESARROLLO/brand-tokens.json`) y variables CSS en `styles/main.css`.
4. Ejecuta `bun test` y verifica en móvil (`?debug=1`).
5. Pull Request a `main`. No commits directos a la rama estable.

### Reglas de marca SWAG (obligatorias)

- SWAG está en **pre-lanzamiento**: CTA siempre "Conoce el proyecto"; pantallas de la app se etiquetan "Interfaz del prototipo".
- No prometer funciones futuras, premios, descuentos ni beneficios económicos. La Energía SWAG es virtual, sin valor monetario ni retiro.
- Público con menores: sin registro, sin datos personales, sin leaderboards públicos, sin compras.
- Logos oficiales sin alterar (derivados solo de tamaño). Tokens de color del manual 3.0.

## Privacidad

El juego no envía ningún dato: monedas, progreso, récords y ajustes viven en `localStorage` del dispositivo. La tarjeta para compartir se genera localmente en el navegador.

---

Hecho con la identidad visual oficial 3.0 de SWAG · Campaña *La semana imposible* · Los Melizz para Junior Achievement El Salvador.
