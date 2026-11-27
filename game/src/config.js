// Gobble Dash — tuning and world constants.
// One place for every number the rest of the game reads, so a playtest
// tweak never means hunting through the update code.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 604;
export const SKY_H = GROUND_Y;

export const TURKEY_START_X = 430;
export const TURKEY_MIN_X = 170;
export const TURKEY_MAX_X = 780;
export const TURKEY_W = 92;
export const TURKEY_H = 78;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = -980;
export const MOVE_SPEED = 210;
export const RUN_SPEED = 300;
export const DASH_SPEED = 560;
export const DASH_TIME = 0.34;
export const DASH_COOLDOWN = 2.4;

export const FARMER_CATCH_DISTANCE = 46;
export const FARMER_BASE_SPEED = 288;
export const FARMER_LUNGE_SPEED = 430;

export const ESCAPE_DISTANCE_M = 1000;
export const PIXELS_PER_METER = 42;

export const MAX_LIVES = 3;
export const INVULNERABLE_TIME = 1.6;
export const CORN_SCORE = 50;
export const FEATHER_SCORE = 25;
export const METER_SCORE = 2;

// Distance bands (in meters) where each stage of the escape takes place.
export const STAGES = [
  { name: 'FARMYARD', start: 0, end: 350, speed: 300, knifeEvery: [1.9, 3.1], fenceEvery: [2.6, 4.2], cornEvery: [1.1, 2.0], hayEvery: [7, 11] },
  { name: 'BARN', start: 350, end: 700, speed: 350, knifeEvery: [1.5, 2.5], fenceEvery: [2.2, 3.4], cornEvery: [1.0, 1.8], hayEvery: [8, 12], pumpkinEvery: [3.2, 5.0] },
  { name: 'KITCHEN', start: 700, end: 1000, speed: 400, knifeEvery: [1.2, 2.1], fenceEvery: [2.0, 3.2], cornEvery: [0.9, 1.7], hayEvery: [9, 13], pumpkinEvery: [2.8, 4.4], ovenEvery: [260, 380] },
];

// Autumn dusk palette, shared by every drawing routine.
export const PALETTE = {
  skyTop: '#2e1a3d',
  skyMid: '#b34a2e',
  skyLow: '#f2a541',
  sunCore: '#ffd97a',
  sunGlow: '#ff9e45',
  groundFar: '#8a5a33',
  groundNear: '#6e4525',
  dirt: '#5a351d',
  hay: '#e8b64c',
  hayDark: '#c98f2e',
  hayLight: '#f7d774',
  fence: '#7d4f28',
  fenceDark: '#5f3a1c',
  turkeyBody: '#7a4a21',
  turkeyDark: '#5d3413',
  turkeyLight: '#a06a35',
  tailRed: '#c0392b',
  tailOrange: '#e67e22',
  tailYellow: '#f1c40f',
  wattle: '#d42a2a',
  beak: '#f39c12',
  farmerShirt: '#3e6fb0',
  farmerShirtDark: '#2c5282',
  overalls: '#2f5d8a',
  skin: '#f0c08a',
  hat: '#e8c25a',
  hatBand: '#8a5a2b',
  ovenIron: '#3a3f46',
  ovenIronDark: '#23262b',
  flameCore: '#ffe066',
  flameMid: '#ff8c1a',
  flameEdge: '#e2481f',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#4a2c14',
  corn: '#ffd23f',
  cornHusk: '#5da244',
  featherGold: '#ffd94d',
  leafRed: '#c0392b',
  leafOrange: '#e67e22',
  hudPanel: 'rgba(30, 16, 8, 0.62)',
  hudText: '#ffe9b8',
  hudAccent: '#ffb347',
};
