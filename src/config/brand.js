// Identidad oficial SWAG (Kit Visual 3.0 / Atlas ch.18)
export const BRAND = {
  black: '#0B0B0D', ice: '#F7F9FC',
  red: '#D7262E', redLight: '#FF7379',
  aqua: '#5DC1B9', aquaLight: '#9CE0DB',
  silver: '#B7BEC9', lgray: '#D9DEE8',
  gold: '#F2A900', card: '#16161B', line: '#2C2C36',
  blue: '#3E63DD', blueLight: '#7D97F4', // pilar Academia (UI de la app)
};

// Pilares SWAG = mecánica central del juego
export const PILLARS = {
  A: { key: 'A', name: 'Academia',  color: '#3E63DD', glow: '#7D97F4', freq: 523.25 }, // Do5
  D: { key: 'D', name: 'Deporte',   color: '#D7262E', glow: '#FF7379', freq: 659.25 }, // Mi5
  B: { key: 'B', name: 'Bienestar', color: '#5DC1B9', glow: '#9CE0DB', freq: 783.99 }, // Sol5
};

export const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];

// Paletas de cielo por día (horizonte → cénit), modo oscuro de marca
export const DAY_SKIES = [
  { top: '#0A0E1E', mid: '#123043', glow: '#5DC1B9' }, // Lunes: amanecer aqua
  { top: '#0B0B1F', mid: '#1B2A5E', glow: '#7D97F4' }, // Martes: azul cobalto
  { top: '#160B14', mid: '#3A1E2B', glow: '#F2A900' }, // Miércoles: atardecer dorado
  { top: '#100A1E', mid: '#2A1745', glow: '#B98CF2' }, // Jueves: violeta
  { top: '#120609', mid: '#3A0E14', glow: '#FF7379' }, // Viernes: noche roja de victoria
];

export const COPY = {
  tagline: 'Tu día, con espacio.',
  winKicker: '¡SEMANA COMPLETADA!',
  winTitle: 'Domaste la semana imposible',
  loseKicker: 'SIN ENERGÍA…',
  loseTitle: 'La semana te ganó. ¿Revancha?',
  swagNote: 'SWAG está en etapa de prototipo. Las pantallas son la interfaz del prototipo.',
};
