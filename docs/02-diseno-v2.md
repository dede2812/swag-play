# 02 · Diseño de la v2 — mecánicas, economía y niveles

> Cómo las tres áreas de SWAG dejan de ser decoración y se convierten en sistemas conectados.

## El bucle que conecta todo

```
DEPORTE (juegas)  →  BIENESTAR (ganas ⚡)  →  ACADEMIA (mejoras)  →  DEPORTE (más lejos)
Superas desafíos     Energía SWAG: monedas,    Mejoras de habilidades,   Niveles más duros,
de habilidad         objetivos, rachas,        estilos y efectos con     mejores recompensas,
(running, saltos,    cartas ocultas            esa Energía               carta del día siguiente
precisión)
```

## A · Academia — 5 habilidades especiales

| # | Habilidad | Efecto real | Duración (grado 1→3) | Recarga (1→3) | Desbloqueo | Coste mejora |
|---|---|---|---|---|---|---|
| 1 | 💨 Velocidad | Mundo +45%, puntos por distancia +50% | 4/5/6 s | 16/14/12 s | Nivel 1 | 90/180 ⚡ |
| 2 | 🎯 Concentración | El caos se mueve al 55% | 4.5/5.5/6.5 s | 20/18/16 s | Nivel 2 | 90/180 ⚡ |
| 3 | 👁️ Memoria | Pistas de lo que viene (marcadores en el horizonte) | 6/7/8 s | 24/21/18 s | Nivel 3 | 90/180 ⚡ |
| 4 | 🧭 Estrategia | Flecha al mejor carril (réplica del motor de sugerencias de la app) | 6/7/8 s | 26/23/20 s | Nivel 4 | 90/180 ⚡ |
| 5 | ✖️ Multiplicador | Todos los puntos ×3 | 5/6/7 s | 30/27/24 s | Nivel 5 | 90/180 ⚡ |

Reglas de diseño:
- **Decisión, no spam:** cada recarga es >1.5× su efecto; no se puede relanzar durante el efecto.
- **Cada habilidad tiene firma visual propia:** estelas cian (Velocidad), viñeta azul de calma (Concentración), barrido violeta + marcadores (Memoria), flecha menta (Estrategia), brillo dorado + ×3 (Multiplicador), y aura del color correspondiente sobre el corredor.
- **Progresión real:** el grado sube duración y baja recarga; mejorar cuesta Energía SWAG.
- Controles: teclas 1-5 en escritorio, botones táctiles con barrido de recarga en móvil.

## B · Deporte — desafíos y progresión por niveles

| Nivel | Día | Nombre | Duración | Mecánica nueva | Objetivos |
|---|---|---|---|---|---|
| 1 | Lunes | Calentamiento | 40 s | Tutorial contextual (coach), monedas | Terminar · 8⚡ · sin golpes |
| 2 | Martes | Ritmo | 48 s | Puertas (2 torres + premio), decisiones | Terminar · 1 MODO SWAG · 14⚡ |
| 3 | Miércoles | Velocidad y precisión | 55 s | Ráfagas de saltos, anillos de precisión | Terminar · 3 anillos · 2 habilidades |
| 4 | Jueves | Desafío combinado | 64 s | Torres móviles (barren carriles) | Terminar · 2 MODO SWAG · sin golpes |
| 5 | Viernes | SWAG Master | 78 s | 3 fases: Slalom → Circuito → Rush final | Terminar · 2 ⭐ · 3 habilidades |

- **Dificultad inteligente:** cada nivel tiene su propio pool de patrones (7 patrones: mixed, coinsLine, slalom, gate, barrierRun, ringChallenge, moverWatch); no es "lo mismo más rápido".
- **Justicia garantizada por pruebas:** nunca 3 carriles bloqueados; máx. 1 torre móvil por fila; anillos y cartas siempre alcanzables (5000 filas simuladas por nivel).
- **Récords personales por nivel** y estrellas (1-3) por umbrales; repetir niveles paga menos (anti-grind) pero siempre da las monedas recogidas.
- **Coach contextual:** pistas únicas la primera vez (moverse, saltar, monedas, habilidad, combo, ritmo bajo, torre móvil, anillo).

## C · Bienestar — Energía SWAG ⚡, la moneda

Nombre elegido: **Energía SWAG** — coherente con la app oficial, cuyo check-in diario de Bienestar registra tu energía (`wellness.energy`). El recurso de vida se renombra **RITMO** para no confundirlos.

**Se gana por:**
| Fuente | Cantidad | Límite anti-grind |
|---|---|---|
| Moneda recogida en pista | 1 ⚡ c/u | spawns fijos por partida |
| Superar nivel | 25-45 ⚡ (según nivel) | repetición paga 50% |
| Primera victoria del nivel | bonus ×2 | una sola vez |
| Estrellas nuevas | 10/25/50 ⚡ por ★ | solo la diferencia nueva |
| MODO SWAG (combo A+D+B) | 8 ⚡ c/u | requiere habilidad |
| Anillo de precisión | 2 ⚡ c/u | spawns fijos |
| Sin golpes | 15 ⚡ | por partida |
| Carta oculta (1 por nivel) | 30 ⚡ | una vez por nivel |

**Se gasta en:** mejoras de habilidades (90/180 ⚡ por grado), estilos (120-350 ⚡), efectos de estela (80 ⚡). Total del catálogo ≈ 2.100 ⚡; una vuelta completa con objetivos da ~800-1.000 ⚡ → progresión de varias sesiones sin grind forzado. **Sin dinero real, sin azar pagado.**

## Interfaz y explicación del juego

- Pantalla de bienvenida con propuesta clara + contador de ⚡ siempre visible.
- "Cómo jugar" en 5 pasos con iconos (movimiento, pilares, habilidades, moneda, niveles).
- HUD: barra de RITMO, ⚡, chip de nivel, barra de progreso, pips de pilares, barra de habilidades con recarga visible.
- Resultados: estrellas, desglose de puntos, desglose de ⚡ ganada, objetivos ✅/⬜, desbloqueos y botón "Siguiente día".
- Sin párrafos largos: todo es visual, contextual o de una línea.
