// Gobble Dash — the game state: modes, the turkey's physics, spawning,
// scoring, lives, stages and the deterministic autopilot the screenshots
// use. Rendering lives in render.js; this module only decides what happens.
import {
  GRAVITY, JUMP_VELOCITY, MOVE_SPEED, DASH_SPEED, DASH_TIME, DASH_COOLDOWN,
  TURKEY_START_X, TURKEY_MIN_X, TURKEY_MAX_X, TURKEY_W, TURKEY_H,
  GROUND_Y, MAX_LIVES, INVULNERABLE_TIME, CORN_SCORE, FEATHER_SCORE,
  METER_SCORE, ESCAPE_DISTANCE_M, STAGES,
} from './config.js';
import { createFarmer, updateFarmer, farmerThreat } from './farmer.js';
import {
  createHazardState, mulberry32, spawnKnife, spawnPumpkin, spawnFence,
  spawnOven, spawnCorn, spawnFeather, spawnHaystack, updateHazards,
  checkHits, collectPickups, nearbyHaystack, metersFromScroll, stageForDistance,
} from './hazards.js';

export function createWorld(seed = 1) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    mode: 'title', // title | playing | paused | escaped | caught
    time: 0,
    scrollPx: 0,
    distanceM: 0,
    score: 0,
    lives: MAX_LIVES,
    stageIndex: 0,
    turkeySpeed: 0,
    turkey: {
      x: TURKEY_START_X, y: GROUND_Y, vy: 0,
      onGround: true, legPhase: 0, bob: 0,
      dashing: false, dashTimer: 0, dashCooldown: 0,
      slowTimer: 0, invulnerable: 0, hidden: false, hideStack: null,
      blinkTimer: 2.4, blinking: false,
    },
    farmer: createFarmer(),
    hazards: createHazardState(),
    timers: { knife: 1.4, fence: 2.2, corn: 0.8, feather: 9, hay: 6, pumpkin: 4, oven: 3 },
    events: { corn: 0, feather: 0, shake: 0, flash: null, banner: null, bannerT: 0 },
    endReason: null,
    endTime: 0,
    bestScore: 0,
    farmerShouted: false,
  };
}

export function startRun(world) {
  const fresh = createWorld(world.seed);
  fresh.mode = 'playing';
  fresh.bestScore = world.bestScore;
  return fresh;
}

// One fixed update step. `input` is the live input object; in shot mode
// the caller passes the autopilot's synthetic input instead.
export function updateWorld(world, dt, input, audio) {
  if (world.mode !== 'playing') return;

  world.time += dt;
  const t = world.turkey;
  const stage = STAGES[world.stageIndex];
  const ev = world.events;
  ev.corn = 0;
  ev.feather = 0;
  ev.shake = Math.max(0, ev.shake - dt);
  if (ev.bannerT > 0) ev.bannerT -= dt;

  // --- hiding: hold Down near a haystack to dive in; let go to pop out.
  const stack = nearbyHaystack(world.hazards, t);
  if (input.held('hide') && stack && t.onGround && !t.hidden) {
    t.hidden = true;
    t.hideStack = stack;
    audio.flap();
  }
  if (t.hidden && (!input.held('hide') || !stack)) {
    t.hidden = false;
    t.hideStack = null;
    if (world.farmer.searching) {
      world.farmer.searching = false;
      world.farmer.gap = 240;
    }
  }

  // --- dash: a burst of speed on a cooldown; a golden feather refills it.
  t.dashCooldown = Math.max(0, t.dashCooldown - dt);
  if (input.wasPressed('dash') && t.dashCooldown <= 0 && !t.hidden) {
    t.dashing = true;
    t.dashTimer = DASH_TIME;
    t.dashCooldown = DASH_COOLDOWN;
    audio.dash();
  }
  if (t.dashing) {
    t.dashTimer -= dt;
    if (t.dashTimer <= 0) t.dashing = false;
  }

  // --- jump: only from the ground, with a flap sound.
  if (input.wasPressed('jump') && t.onGround && !t.hidden) {
    t.vy = JUMP_VELOCITY;
    t.onGround = false;
    audio.flap();
    if (Math.random() < 0.4) audio.gobble();
  }

  // --- horizontal drift: the turkey runs on its own; the player steers.
  let move = 0;
  if (input.held('left')) move -= 1;
  if (input.held('right')) move += 1;
  const baseSpeed = stage.speed;
  world.turkeySpeed = t.dashing ? DASH_SPEED : baseSpeed + move * MOVE_SPEED * 0.4;
  if (t.slowTimer > 0) {
    t.slowTimer -= dt;
    world.turkeySpeed *= 0.55;
  }
  if (t.hidden) world.turkeySpeed = 0;
  t.x += move * MOVE_SPEED * dt;
  t.x = Math.max(TURKEY_MIN_X, Math.min(TURKEY_MAX_X, t.x));

  // --- gravity and landing.
  if (!t.onGround) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.onGround = true;
      audio.thud();
    }
  }

  // --- run cycle animation + blinking.
  t.legPhase += dt * (t.dashing ? 16 : 11);
  t.bob = t.onGround ? Math.abs(Math.sin(t.legPhase * Math.PI)) * -3 : 0;
  t.blinkTimer -= dt;
  t.blinking = t.blinkTimer < 0.12;
  if (t.blinkTimer <= 0) t.blinkTimer = 2 + world.rng() * 2.5;
  t.invulnerable = Math.max(0, t.invulnerable - dt);

  // --- scroll the world and count the distance.
  const scrollPx = t.hidden ? 0 : world.turkeySpeed * dt;
  world.scrollPx += scrollPx;
  world.distanceM = metersFromScroll(world.scrollPx);
  world.score += Math.floor(scrollPx * METER_SCORE / 42);

  // --- stage progression, with a banner when the scene changes.
  const nextStage = stageForDistance(world.distanceM);
  if (nextStage !== world.stageIndex) {
    world.stageIndex = nextStage;
    ev.banner = nextStage === 1 ? 'THE BARN — IT GOT FASTER!' : 'THE KITCHEN — WATCH THE OVEN!';
    ev.bannerT = 2.2;
    audio.gobble(true);
  }

  // --- the forest gate: the last 60 meters, then freedom.
  if (world.distanceM >= ESCAPE_DISTANCE_M - 60 && world.hazards.gateX === null) {
    world.hazards.gateX = 1500;
  }

  // --- spawn timers, scaled by stage.
  const tm = world.timers;
  const rng = world.rng;
  const spawn = (key, lo, hi, fn) => {
    tm[key] -= dt;
    if (tm[key] <= 0) {
      fn();
      tm[key] = lo + rng() * (hi - lo);
    }
  };
  spawn('knife', stage.knifeEvery[0], stage.knifeEvery[1], () => spawnKnife(world.hazards, rng, t.x, world.turkeySpeed));
  spawn('fence', stage.fenceEvery[0], stage.fenceEvery[1], () => spawnFence(world.hazards, rng, t.x));
  spawn('corn', stage.cornEvery[0], stage.cornEvery[1], () => spawnCorn(world.hazards, rng, t.x));
  spawn('feather', 8, 13, () => spawnFeather(world.hazards, rng, t.x));
  spawn('hay', stage.hayEvery[0], stage.hayEvery[1], () => spawnHaystack(world.hazards, rng, t.x));
  if (stage.pumpkinEvery) spawn('pumpkin', stage.pumpkinEvery[0], stage.pumpkinEvery[1], () => spawnPumpkin(world.hazards, rng, t.x));
  if (stage.ovenEvery) spawn('oven', stage.ovenEvery[0] / 42, stage.ovenEvery[1] / 42, () => spawnOven(world.hazards, rng, t.x));

  updateHazards(world.hazards, dt, scrollPx, t, audio, ev);
  collectPickups(world.hazards, t, ev);
  if (ev.corn > 0) {
    world.score += CORN_SCORE * ev.corn;
    audio.pickup();
  }
  if (ev.feather > 0) {
    world.score += FEATHER_SCORE * ev.feather;
    t.dashCooldown = 0;
    audio.feather();
  }

  // --- the farmer closes in.
  const wasSearching = world.farmer.searching;
  updateFarmer(world.farmer, dt, t, world);
  if (world.farmer.shoutCooldown <= 0 && farmerThreat(world.farmer) > 0.72 && !world.farmerShouted) {
    audio.shout();
    world.farmer.shoutCooldown = 2.5;
  }
  if (wasSearching && !world.farmer.searching) world.farmerShouted = false;

  // --- hits.
  const hit = checkHits(world.hazards, t);
  if (hit === 'knife' || hit === 'flame') {
    world.lives -= 1;
    t.invulnerable = INVULNERABLE_TIME;
    ev.flash = hit;
    ev.shake = 0.3;
    audio.hurt();
    if (world.lives <= 0) {
      endRun(world, 'caught', 'A knife found the turkey…');
      return;
    }
  } else if (hit === 'trip') {
    if (t.slowTimer <= 0) {
      t.slowTimer = 0.7;
      ev.shake = 0.18;
      audio.thud();
    }
  }

  // --- caught by the farmer.
  if (world.farmer.caught) {
    endRun(world, 'caught', 'The farmer caught the turkey!');
    return;
  }

  // --- escaped: run through the forest gate.
  if (world.hazards.gateX !== null && world.hazards.gateX < t.x + 40) {
    world.score += 500;
    endRun(world, 'escaped', 'The turkey made it to the forest!');
  }
}

function endRun(world, mode, reason) {
  world.mode = mode;
  world.endReason = reason;
  world.endTime = world.time;
  world.bestScore = Math.max(world.bestScore, world.score);
}

// ---------------------------------------------------------------- autopilot
// A simple scripted player for the deterministic screenshots: it plays the
// real rules (jump, dash, hide) from a fixed seed, no cheating.
export function createAutopilot() {
  return { jumpHeld: false };
}

export function autopilotInput(world, autopilot) {
  const t = world.turkey;
  const h = world.hazards;
  const held = new Set();
  const pressed = new Set();

  // Jump if a fence or pumpkin is close ahead and we are on the ground.
  let nearest = Infinity;
  for (const f of h.fences) if (f.x > t.x && f.x - t.x < nearest) nearest = f.x - t.x;
  for (const p of h.pumpkins) if (p.x > t.x && p.x - t.x < nearest) nearest = p.x - t.x;
  if (t.onGround && nearest < 150) pressed.add('jump');
  // Dash when the farmer is breathing down the turkey's neck.
  if (world.farmer.gap < 130 && t.dashCooldown <= 0) pressed.add('dash');
  // Hide when the farmer is very close and a haystack is right here.
  const stack = nearbyHaystack(h, t);
  if (world.farmer.gap < 90 && stack) held.add('hide');
  // Drift right when there is room, to keep the action centred.
  if (t.x < 520) held.add('right');
  if (t.x > 640) held.add('left');

  return {
    held: (a) => held.has(a),
    wasPressed: (a) => pressed.has(a),
    consume: () => {},
    endFrame: () => {},
  };
}

// Advance the world `seconds` of play with a fixed timestep, using the
// autopilot — deterministic for a given seed.
export function advanceAutopilot(world, seconds, audio) {
  const ap = createAutopilot();
  const step = 1 / 60;
  const steps = Math.round(seconds / step);
  for (let i = 0; i < steps; i++) {
    updateWorld(world, step, autopilotInput(world, ap), audio);
    if (world.mode !== 'playing') break;
  }
}

export { farmerThreat };
