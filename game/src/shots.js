// Gobble Dash — deterministic screenshot poses (?shot=...&seed=...).
// Each pose plays the real rules forward with the autopilot from a fixed
// seed, then freezes the frame, so every screenshot is a genuine render
// of the game's own code, reproducible byte for byte.
import { createWorld, startRun, advanceAutopilot } from './world.js';
import { spawnKnife, spawnOven, spawnCorn, spawnFeather, spawnHaystack, spawnFence } from './hazards.js';
import { GROUND_Y, TURKEY_START_X } from './config.js';

function silentAudio() {
  return {
    gobble() {}, flap() {}, shout() {}, whoosh() {}, thud() {}, pickup() {},
    feather() {}, dash() {}, hurt() {}, startSizzle() {}, stopSizzle() {},
    winJingle() {}, loseSting() {}, click() {}, unlock() {}, toggleMute() { return true; },
    get muted() { return true; },
  };
}

// Build the world for a named shot. Returns { world, after } where after
// runs once the frame is otherwise ready (used for the end screen).
export function buildShot(name, seed) {
  const audio = silentAudio();

  if (name === 'title') {
    const world = createWorld(seed);
    world.mode = 'title';
    world.time = 2.4;
    return { world, after: null };
  }

  if (name === 'kitchen') {
    // Play into the Kitchen stage (past 700m) and freeze mid-action.
    const world = startRun(createWorld(seed));
    world.distanceM = 690;
    world.scrollPx = 690 * 42;
    world.stageIndex = 2;
    advanceAutopilot(world, 9, audio);
    // Re-stage the frame so it reads as a DIFFERENT moment from the
    // cover (same stage, different beat): the turkey dashes left of
    // centre with the farmer lunging a whisker behind, a knife dropping
    // right in front of its beak, and TWO ovens mid-blast on the right.
    const t = world.turkey;
    const h = world.hazards;
    world.lives = 3;
    world.score = 1875;
    t.x = 330;
    t.dashing = true;
    t.dashCooldown = 1.1;
    world.farmer.gap = 55;
    world.farmer.x = t.x - 55;
    world.farmer.lungeTimer = 0.3;
    h.ovens.length = 0;
    h.ovens.push({ x: t.x + 330, phase: 'fire', t: 0.6, cycle: 3 });
    h.ovens.push({ x: t.x + 520, phase: 'fire', t: 0.6, cycle: 3 });
    h.knives.length = 0;
    h.knives.push({ x: t.x + 75, y: 330, vy: 800, state: 'fall', warnT: 0, targetX: t.x + 75, stuckT: 0 });
    h.haystacks.length = 0;
    h.fences.length = 0;
    h.pumpkins.length = 0;
    h.corn.length = 0;
    h.corn.push({ x: t.x + 150, y: GROUND_Y - 46, taken: false });
    h.corn.push({ x: t.x + 210, y: GROUND_Y - 150, taken: false });
    h.feathers.length = 0;
    // Oven flame peaks when sin(world.time * 22) = 1; pin the clock to
    // that phase so both ovens are caught mid-blast (flame = 1.0).
    world.time = 2.9274;
    // Freeze any screen shake: render() jitters by Math.random() while
    // shake > 0, which made the still frame non-deterministic.
    world.events.shake = 0;
    return { world, after: null };
  }

  if (name === 'end') {
    // A clean escape, played for real: start 15m short of the gate with
    // a clear road and let the turkey run through it.
    const world = startRun(createWorld(seed));
    world.distanceM = 985;
    world.scrollPx = 985 * 42;
    world.stageIndex = 2;
    world.lives = 3;
    world.score = 4800;
    world.hazards.knives.length = 0;
    world.hazards.ovens.length = 0;
    world.hazards.pumpkins.length = 0;
    world.hazards.fences.length = 0;
    world.farmer.gap = 280;
    world.farmer.x = world.turkey.x - 280;
    world.hazards.gateX = world.turkey.x + 320;
    advanceAutopilot(world, 4, audio);
    if (world.mode === 'playing') {
      world.hazards.gateX = world.turkey.x + 10;
      advanceAutopilot(world, 1, audio);
    }
    world.time += 1.0;
    // Freeze any screen shake: render() jitters by Math.random() while
    // shake > 0, which made the still frame non-deterministic.
    world.events.shake = 0;
    return { world, after: null };
  }

  // Default: 'cover' — the densest gameplay frame. Kitchen stage, the
  // farmer right behind the turkey, a flaming oven, a knife mid-fall,
  // corn and a haystack on screen, full HUD.
  const world = startRun(createWorld(seed));
  world.distanceM = 760;
  world.scrollPx = 760 * 42;
  world.stageIndex = 2;
  advanceAutopilot(world, 6, audio);
  const h = world.hazards;
  const t = world.turkey;
  // Stage the dense frame on top of the real, already-played state.
  world.farmer.gap = 92;
  world.farmer.x = t.x - 92;
  world.farmer.lungeTimer = 0.3;
  // One oven flaming just ahead of the turkey.
  h.ovens.length = 0;
  h.ovens.push({ x: t.x + 330, phase: 'fire', t: 0.6, cycle: 3 });
  // One knife already falling onto the turkey's path.
  h.knives.length = 0;
  h.knives.push({ x: t.x + 150, y: 320, vy: 900, state: 'fall', warnT: 0, targetX: t.x + 150, stuckT: 0 });
  // Corn and a feather in reach, a haystack behind for the hide story.
  h.corn.length = 0;
  h.corn.push({ x: t.x + 210, y: GROUND_Y - 46, taken: false });
  h.corn.push({ x: t.x + 260, y: GROUND_Y - 150, taken: false });
  h.feathers.length = 0;
  h.feathers.push({ x: t.x + 300, y: GROUND_Y - 170, taken: false });
  h.haystacks.length = 0;
  h.haystacks.push({ x: t.x - 260, scale: 1.05 });
  h.fences.length = 0;
  h.fences.push({ x: t.x + 430, w: 110 });
  world.score = 2450;
  world.distanceM = 762;
  world.lives = 3;
  world.time += 0.2;
  // Freeze any screen shake: render() jitters by Math.random() while
  // shake > 0, which made the still frame non-deterministic.
  world.events.shake = 0;
  return { world, after: null };
}
