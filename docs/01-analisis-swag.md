# 01 · Análisis de SWAG y del estado actual en GitHub

> Fase 1 del Prompt Maestro — investigación del producto antes de programar.

## Qué es SWAG

SWAG es una aplicación móvil en **etapa de prototipo** (pre-lanzamiento) dirigida a estudiantes y deportistas jóvenes (~12-23 años). Su propuesta: organizar el día equilibrando tres pilares — **Academia, Deporte y Bienestar** — con un plan flexible ("Tu plan es flexible", "Tu día, con espacio"). La pantalla principal (`hoy-oscuro.png`) muestra: tarjeta de ajuste inteligente ("Química necesita 30 min más"), accesos a los tres pilares y agenda del día.

**Propuesta de valor**: tu día, con espacio — el plan se adapta sin que el usuario tenga que rehacerlo.

## Estado del desarrollo (verificado)

| Pregunta | Hallazgo | Fuente |
|---|---|---|
| ¿Repo de la app en GitHub? | **No existe.** La cuenta `dede2812` no tiene repositorios SWAG; el único repo previo (`cubo-ai-workshop-website`) es de otro proyecto. | Búsqueda `user:dede2812` en GitHub API (2026-10-09) |
| ¿Dónde vive la app hoy? | Prototipo visual local (67 pantallas, 3 apariencias) dentro del kit `SWAG_IDENTIDAD_VISUAL_FINAL` en Drive. Sin backend, cuentas, pagos ni sync reales. | `LEEME_PRIMERO.txt` del kit |
| ¿Identidad visual oficial? | Kit 3.0 consolidado: logos (iridiscente, plano rojo, blanco/negro), wordmarks, manual de 164 págs., 42 banners, iconos SVG. | Kit en Drive + copia local |
| ¿Gamificación existente? | Pilares, progreso y rachas visibles en pantallas del prototipo ("Progreso", "Metas deporte"). Gancho natural para el juego. | Pantallas del prototipo |
| ¿Público? | Estudiantes y deportistas 12-23 años. Incluye **menores de edad** → decisiones de privacidad y no presión comercial. | Documentos de campaña |
| ¿Estado comercial? | Pre-lanzamiento. Regla de marca: CTA "Conoce el proyecto", pantallas etiquetadas "Interfaz del prototipo", no prometer funciones futuras ni premios. | Reglas de campaña SWAG |

## Identidad visual aplicada al juego

| Token | Valor | Uso en SWAG RUSH |
|---|---|---|
| SWAG Black | `#0B0B0D` | Fondo base, cielos nocturnos |
| Ice White | `#F7F9FC` | Texto, suelas, números |
| SWAG Red | `#D7262E` | CTA principal, pilar Deporte, alertas |
| Red Light | `#FF7379` | Acentos, glow de alertas |
| SWAG Aqua | `#5DC1B9` | Pilar Bienestar, confirmaciones |
| Aqua Light | `#9CE0DB` | Glows, textos de éxito |
| Gold | `#F2A900` | Estrella bonus, MODO SWAG, medallas |
| Card / Line | `#16161B` / `#2C2C36` | Tarjetas UI, obstáculos |
| Academia Blue* | `#3E63DD` | Pilar Academia (tomado de la UI de la app) |

\* El azul de Academia no está en los tokens del manual pero sí en las pantallas oficiales de la app; se adopta como color del pilar.

Logos usados (derivados optimizados de los PNG oficiales, sin alterar el arte): `logo-iridiscente.png` (menú/resultados), `logo-rojo.png` (icono), `wordmark-blanco.png` (pie de menú), `favicon.png`.

## Decisión de arquitectura de repositorio

**Repo independiente `swag-play`** (público), no dentro de la app. Razones:

1. No existe repo de la app donde integrarse — no hay código que pueda romperse.
2. Un juego publicitario debe desplegarse rápido y público (GitHub Pages) sin acoplarse al ciclo del producto.
3. Permite integración futura como micrositio o iframe/`/play` cuando la app exista.
4. Privacidad: la app prototipo contiene material interno; el juego solo expone lo publicitario.

## Stack elegido y por qué

**Vanilla JS (ES Modules) + Canvas 2D + Web Audio API. Sin build, sin dependencias.**

- La investigación (doc 02) exige carga < 1.2 s: cero dependencias = ~120 KB totales con logos.
- GitHub Pages sirve el repo tal cual: no hay paso de compilación que falle.
- Canvas 2D cubre el pseudo-3D del runner con 60 fps en móviles modestos; Phaser/Three serían peso muerto (el prompt prohíbe dependencias sin justificación).
- Web Audio sintetiza efectos y música: cero archivos de audio, cero licencias.
- La lógica pura (`balance.js`, `scoring.js`, `spawner.js`) es testeable en Node/Bun sin navegador.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Público con menores | Sin registro, sin datos personales, sin leaderboard público, sin compras; récord solo local |
| Prometer lo que SWAG no tiene | CTA "Conoce el proyecto"; nota "Interfaz del prototipo"; recompensas 100% dentro del juego |
| Marca mal representada | Tokens y logos oficiales; revisión contra pantallas del kit |
