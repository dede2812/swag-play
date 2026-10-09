# 03 · Pruebas técnicas y resultados (v2)

## Unitarias — `tests/logic.test.mjs` → **22/22 ✓**

Ejecutar: `bun test` (o `node --test`, Node 22+).

| Área | Cobertura |
|---|---|
| Habilidades | Solo existen las desbloqueadas · duración/recarga por grado · no relanzar durante efecto ni recarga · `effectsOf` · mejora siempre sube duración y baja recarga (recarga > 1.5× efecto) · `bestLane` evita torres/móviles y prefiere premios |
| Economía | Primera victoria ×2 vs repetición 50% · estrellas pagan solo la diferencia nueva (anti doble cobro) · carta/sin-golpes solo cuando corresponde · gasto nunca deja saldo negativo · catálogo con clásico gratis |
| Niveles | 5 niveles con dificultad creciente (velocidad, duración, umbrales) · cada nivel tiene pool de patrones propio · L4 introduce móviles, L3 anillos · L5 tiene 3 fases ordenadas · `starsFor` 0-3 |
| Spawner | **Justicia: ningún patrón bloquea los 3 carriles** (5000 filas × 5 niveles) · máx. 1 torre móvil por fila · destino de móviles siempre válido · `weakestPillar` |
| Balance | Drenaje de ritmo con curva del nivel · muerte a 0 · monedas/anillos/carta se registran · MODO SWAG se activa y el golpe lo rompe |
| Puntuación | Desglose suma el total y omite filas en cero |

## E2E — Playwright/Chromium móvil (390×844, táctil, DPR 2) → **29/29 ✓ · 0 errores de consola**

Menú y chip de ⚡ · pantalla de niveles (5 tarjetas, L2 bloqueado) · tutorial en primer arranque · HUD completo (barra de habilidades con 5 slots, chip de nivel, ⚡, progreso) · **lanzar habilidad** (slot queda activo) · habilidad bloqueada no se lanza · pausa/reanudar · **victoria → resultados** (estrellas, desglose de puntos, desglose de ⚡, 3 objetivos, botón Siguiente) · **siguiente nivel desbloqueado** + habilidad del nivel 2 disponible · derrota · **tienda: compra de mejora** (saldo baja 565→475) · **compra y selección de estilo** · pestaña colección (5 cartas) · **favicon servido (200) y referenciado** · **persistencia tras recarga** (monedas y desbloqueos).

Semilla determinista `?seed=5`; ganchos `?debug=1` (`__swag.cast/grantCoins/winNow/loseNow/…`).

## Defectos encontrados y corregidos durante las pruebas

1. `player.js` referenciaba el catálogo de estilos de la v1 (`TUNING.skins`) eliminado en v2 → arranque roto. Detectado por E2E; corregido (estilo por defecto propio + regresión).
2. `mixedRow` podía generar 2 torres móviles en la misma fila. Detectado por prueba unitaria de invariantes (5000 filas/nivel); corregido con contador y regresión.

## Rendimiento, accesibilidad y privacidad

- ~460 KB totales incluyendo fuentes oficiales subsetadas (Montserrat 46 KB + Inter 81 KB woff2) y logos optimizados; 0 dependencias; 0 peticiones externas.
- Canvas 2D con pool de partículas, dt limitado, DPR ≤ 2; `prefers-reduced-motion` respetado.
- Tap targets ≥ 48 px (tokens oficiales); aria-labels en HUD y botones; pausa automática al perder foco.
- Sin datos personales, sin cookies, sin trackers, sin leaderboard público; progreso 100% en `localStorage`; la tarjeta compartible se genera en el dispositivo.
- Sin compras con dinero real; la Energía SWAG es virtual y sin valor monetario.

## Favicon (encargo §7)

- Fuente oficial: `SWAG_IDENTIDAD_VISUAL_FINAL/02_LOGOTIPOS_OFICIALES/logo-blanco-transparente.png` (letras blancas, proporciones intactas).
- Set generado: `favicon.ico` (16/32/48) + `favicon-16/32/48.png` + `apple-touch-icon.png` (180) + `icon-192/512.png`, sobre fondo negro `#0B0B0D` (identidad) con esquinas redondeadas.
- Referencias en `index.html` (`icon`, `apple-touch-icon`, tamaños 16→512); verificado HTTP 200 y sin referencias rotas; el favicon anterior de la v1 se eliminó.

## Pendiente de verificación humana

- Prueba en dispositivos físicos (tacto/audio reales) y ajuste fino de umbrales de estrellas con puntuaciones de jugadores reales.
