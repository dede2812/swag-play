# 05 · Pruebas y resultados

> Fase 11 del Prompt Maestro — revisión integral antes de publicar.

## Estrategia

1. **Pruebas unitarias** de la lógica pura (sin navegador): energía, combo, puntuación, medallas, spawner.
2. **Pruebas E2E** con Playwright en viewport móvil (390×844, táctil, DPR 2) con partida determinista (`?debug=1&seed=5`: 7 torres, 10 ítems, 4 barreras y 1 estrella en las primeras 8 filas).
3. **Revisión visual** de capturas de cada pantalla.
4. **Checklist** de marca, seguridad y privacidad.

## Unitarias — `tests/logic.test.mjs` (13/13 ✓)

| Área | Pruebas |
|---|---|
| Energía | Drena con el tiempo · muerte a 0 · drena más en días avanzados · ítems recargan sin pasar del máximo |
| MODO SWAG | Se activa con A+D+B en ventana · multiplicador ×2 · extensión por ítem · no activa fuera de ventana |
| Golpes | Daño correcto · invulnerabilidad temporal · ruptura de combo |
| Puntuación | Umbrales de medallas · insignia de semana supera medallas · desbloqueos por medalla · desglose suma el total |
| Spawner | **Invariante de justicia: nunca 3 carriles bloqueados** (10 000 filas simuladas) · ritmo crece por día con mínimo · sugiere el pilar más descuidado |

## E2E — Playwright/Chromium móvil (10/10 ✓, 0 errores de consola)

| # | Prueba | Resultado |
|---|---|---|
| 1 | Menú carga con logo, récord y estilos | ✓ |
| 2 | Tutorial aparece en el primer arranque | ✓ |
| 3 | Gameplay: HUD visible, puntuación y energía avanzan | ✓ (score>0, energía bajando) |
| 4 | Pausa con teclado y reanudación | ✓ |
| 5 | Victoria → pantalla de resultados con medalla, desglose y récord | ✓ |
| 6 | Tarjeta compartible se genera y descarga (1080×1350) | ✓ `swag-rush-resultado.png` |
| 7 | Overlay "Conoce el proyecto" con nota de prototipo | ✓ |
| 8 | Derrota → variante de resultados | ✓ |
| 9 | Persistencia: récord y estilos sobreviven recarga | ✓ |
| 10 | Selector de estilos (3, con bloqueo) | ✓ |

## Defectos encontrados y corregidos durante las pruebas

1. **`roundRect` con dimensiones negativas** mataba el bucle de render al dibujar torres lejanas (`Failed to execute 'arcTo': radius negative`). Corregido: guarda en `roundRect` + detalle de la torre solo cuando es visible. Detectado por el E2E (pausa no respondía porque el loop había muerto).
2. **`weakestPillar` invertido**: sugería el pilar más reciente en vez del más descuidado. Detectado por prueba unitaria; corregido y con regresión.
3. **Victoria siempre "true"** al cerrar la partida: se leía la fase después de sobrescribirla. Corregido.
4. **Compartir dependía del modo debug**: los resultados solo se guardaban con `?debug=1`. Corregido (variable de módulo).

## Rendimiento y compatibilidad

- **Peso:** ~120 KB en total (HTML+CSS+JS+logos optimizados), 0 dependencias, 0 peticiones externas → carga < 1.2 s incluso en 3G (objetivo de la investigación).
- **Motor:** Canvas 2D con pool de partículas (máx. 260) y dt limitado (50 ms) → estable en móviles modestos; DPR limitado a 2.
- **Entrada:** teclado, swipe y tap; `touch-action:none` en canvas para evitar scroll.
- **Audio:** WebAudio sintetizado; se inicializa solo tras el primer gesto (política de autoplay); silencio persistente.
- **Accesibilidad:** `prefers-reduced-motion` (sin shake, menos partículas), aria-labels, pausa automática al perder foco, contraste alto.
- **Navegadores objetivo:** Chrome/Safari móviles y escritorio (ES2020+).

## Seguridad y privacidad (público con menores) ✓

- Sin registro, sin formularios, sin datos personales, sin cookies, sin trackers.
- Sin leaderboard público: el récord es local (`localStorage`).
- La tarjeta compartible se genera en el dispositivo; compartir usa Web Share API del propio usuario.
- Sin compras, sin azar pagado, sin presión comercial; CTA "Conoce el proyecto" coherente con el estado pre-lanzamiento de SWAG.
- Sin secretos ni claves en el repo; solo recursos públicos de marca.

## Pendiente de verificación humana

- Prueba en dispositivos físicos (iPhone/Android) para tacto y audio real.
- Ajuste fino de umbrales de medallas tras ver puntuaciones de jugadores reales.
