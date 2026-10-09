# 01 · Qué encontré en el repositorio SWAG y qué reutilicé

> Análisis previo a la integración (fase 2 del encargo). Repositorio: `dede2812/SWAG` (privado).

## Estructura del repositorio

| Ubicación | Contenido | Uso para el juego |
|---|---|---|
| `SWAG_Codigo_Beta_y_Atlas/beta` | App oficial: React 19 + TypeScript + Vinext/Vite + Tailwind 4 + Cloudflare D1 | Modelo de datos y tokens reales |
| `SWAG_Codigo_Beta_y_Atlas/atlas` | Documento interactivo de producto | Contexto de etapas del producto |
| `SWAG_IDENTIDAD_VISUAL_FINAL` | Identidad 3.0: 727 recursos, tokens, fuentes, logos | Recursos oficiales del juego |
| `docs` | prompt-maestro, organización, inventario | Reglas y decisiones vigentes |
| `scripts` | ejecución/verificación (Windows) | — |

## Datos clave descubiertos

1. **SWAG = "Study. Work. Achieve. Grow."** — "Estudia. Entrena. Vive." Proyecto de Los Melizz para Junior Achievement El Salvador, estudiantes y atletas de 15-23 años.
2. **La app real tiene los 3 pilares en su modelo de datos** (`beta/lib/swag.ts`):
   - **Academia:** eventos `task`/`exam`/`class` con materias y fechas límite.
   - **Deporte:** eventos `training` (perfil con deporte, p. ej. Natación).
   - **Bienestar:** eventos `rest` + check-in diario `{ energy 1-5, sleep h, stress 1-5, water }`.
   - Motor de sugerencias ("Un ajuste que suma") que mueve tareas flexibles a huecos libres.
3. **Tokens oficiales 3.0** (`11_RECURSOS_DE_DESARROLLO/brand-tokens.json`): módulos `estudio=blue #3456E8`, `entreno=coral #FF766C`, `bienestar=cyan #35D6E6`; logros en `gold #F2A900`; identidad negro/blanco/rojo; Montserrat=marca, Inter=producto; radio 16/28; objetivo de contraste 4.5; tap target 48px.
4. **La beta usa variantes para modo oscuro** (`beta/app/globals.css`): `--study:#8da9f8`, `--sport:#ff6b70`, `--well:#81c9ad` — usadas como colores de brillo/glow del juego.
5. **Recursos gráficos oficiales:** `logo-blanco-transparente.png` (favicon pedido), `logo-metal-iridiscente-transparente.png` (menú), `simbolo-s-blanco-transparente.png`, tipografías variables `Montserrat-Variable.ttf` e `Inter-Variable.ttf` con licencias OFL.
6. **No existía implementación previa del videojuego** en este repo: la v1 vivía en `dede2812/swag-play` (público, GitHub Pages). Esta versión la integra aquí como `game/` y mejora todo lo demás.

## Decisiones de integración

- **Carpeta `game/` en la raíz**, junto a `SWAG_Codigo_Beta_y_Atlas` y `SWAG_IDENTIDAD_VISUAL_FINAL`: es un entregable independiente de la beta (no compila con ella) y debe desplegarse como sitio estático.
- **Cero dependencias y sin build**, igual que la v1: la app beta usa pnpm/Node/Wrangler; exigir eso para el juego publicitario lo haría frágil y pesado. El juego es JS puro con ES Modules (~250 KB con fuentes incluidas).
- **Conexión real con la app** (no decorativa):
  - Habilidades de Academia ↔ funciones académicas: *Estrategia* replica el motor de sugerencias (marca el mejor carril como la app marca el mejor hueco); *Concentración/Memoria* ≈ enfoque y repaso.
  - Desafíos de Deporte ↔ `training`: reacción, circuitos, contrarreloj, precisión.
  - Moneda **Energía SWAG ⚡** ↔ check-in de Bienestar (`wellness.energy`): en la app registras tu energía diaria; en el juego la ganas cuidando tu equilibrio.
  - Recurso del jugador renombrado a **RITMO** ("Escucha tu ritmo", copy de Bienestar) para no confundirlo con la moneda.
- **Se corrige la paleta de la v1** a los tokens oficiales: Bienestar pasa de aqua (#5DC1B9) a **cyan #35D6E6**; Academia a blue #3456E8; Deporte a coral #FF766C.
- **No se tocó** `beta/`, `atlas/`, identidad ni `docs/` existentes: solo se añade `game/` y una fila en la tabla del README raíz.
