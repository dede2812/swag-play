// Identidad oficial SWAG — tokens 3.0 tomados del repositorio SWAG:
// SWAG_IDENTIDAD_VISUAL_FINAL/11_RECURSOS_DE_DESARROLLO/brand-tokens.json
export const BRAND = {
  black: '#0B0B0D',
  ice: '#F7F9FC',
  ink: '#18243D',
  muted: '#59657B',
  paper: '#F5F8FF',
  red: '#D7262E',
  redLight: '#FF7379',
  gold: '#F2A900',
  yellow: '#FFC857',
  silver: '#B8C5D6',
  // módulos oficiales (brand-tokens.json → modules)
  blue: '#3456E8',    // estudio / Academia
  coral: '#FF766C',   // entreno / Deporte
  cyan: '#35D6E6',    // bienestar
  mint: '#64D8AB',
  violet: '#9273EF',
  cardDark: '#17171B',
  cardLine: '#2B2B32',
  // alias heredados (cielos y efectos)
  aqua: '#5DC1B9',
  aquaLight: '#9CE0DB',
  card: '#16161B',
  line: '#2C2C36',
  fontBrand: "'Montserrat', 'Segoe UI', system-ui, sans-serif",
  fontBody: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

// Cielo de cada día (amanecer aqua → noche roja): atmósfera de la campaña
export const DAY_SKIES = [
  { top: '#0A0E1E', mid: '#123043', glow: '#5DC1B9' }, // Lunes: amanecer aqua
  { top: '#0B0A1C', mid: '#231A3E', glow: '#9273EF' }, // Martes: violeta
  { top: '#0A0D1F', mid: '#1B2B4A', glow: '#3456E8' }, // Miércoles: cobalto
  { top: '#100A18', mid: '#3A1626', glow: '#FF766C' }, // Jueves: coral
  { top: '#050507', mid: '#2A0E14', glow: '#D7262E' }, // Viernes: noche roja
];

export const PILLARS = {
  A: { id: 'A', name: 'Academia',  color: BRAND.blue,  glow: '#8FA6FF', freq: 523 },
  D: { id: 'D', name: 'Deporte',   color: BRAND.coral, glow: '#FFAB9E', freq: 659 },
  B: { id: 'B', name: 'Bienestar', color: BRAND.cyan,  glow: '#9BEEF6', freq: 784 },
};

export const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];

export const COPY = {
  winKicker: '¡NIVEL SUPERADO!',
  winTitle: 'Domaste el día',
  loseKicker: 'PERDISTE EL RITMO…',
  loseTitle: 'El caos te alcanzó',
  weekKicker: '¡SEMANA COMPLETADA!',
  weekTitle: 'Domaste la semana imposible',
};
