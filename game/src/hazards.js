// Gobble Dash — hazards and pickups: falling carving knives, rolling
// pumpkins, fences to jump, flaming ovens, corn, golden feathers and
// haystacks to hide in. Spawning, movement and collisions live here;
// the world owns the timers that call spawn*().
import { GROUND_Y, PIXELS_PER_METER, STAGES } from './config.js';

// A tiny seeded RNG so a shot with seed=1 always plays the same run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHazardState() {
  return {
    knives: [],      // { x, y, vy, state: 'warn'|'fall'|'stuck', warnT, targetX }
    pumpkins: [],    // { x, vx, r, rot }
    fences: [],      // { x, w }
    ovens: [],       // { x, phase: 'idle'|'warn'|'fire', t, cycle }
    corn: [],        // { x, y, taken }
    feathers: [],    // { x, y, taken }
    haystacks: [],   // { x, scale }
    gateX: null,     // world x of the forest gate (set near the end)
  };
}

function randIn(rng, lo, hi) { return lo + rng() * (hi - lo); }

// Knives telegraph first: a shadow grows on the ground for 0.55s, then
// the blade drops fast. The turkey can read the shadow and move away.
export function spawnKnife(h, rng, turkeyX, scrollSpeed) {
  const ahead = turkeyX + randIn(rng, 120, 620);
  h.knives.push({ x: ahead, y: -70, vy: 0, state: 'warn', warnT: 0.55, targetX: ahead, stuckT: 0 });
}

export function spawnPumpkin(h, rng, turkeyX) {
  h.pumpkins.push({ x: turkeyX + 900, vx: -randIn(rng, 190, 260), r: 30, rot: 0 });
}

export function spawnFence(h, rng, turkeyX) {
  h.fences.push({ x: turkeyX + 880, w: 110 });
}

export function spawnOven(h, rng, turkeyX) {
  h.ovens.push({ x: turkeyX + 900, phase: 'idle', t: randIn(rng, 0.4, 1.2), cycle: randIn(rng, 2.6, 3.4) });
}

export function spawnCorn(h, rng, turkeyX) {
  const y = rng() < 0.45 ? GROUND_Y - 150 : GROUND_Y - 46;
  h.corn.push({ x: turkeyX + 820, y, taken: false });
}

export function spawnFeather(h, rng, turkeyX) {
  h.feathers.push({ x: turkeyX + 840, y: GROUND_Y - 170, taken: false });
}

export function spawnHaystack(h, rng, turkeyX) {
  h.haystacks.push({ x: turkeyX + 860, scale: randIn(rng, 0.95, 1.15) });
}

// Move everything with the scrolling world and advance each hazard's
// own state machine. Returns event flags the world turns into feedback.
export function updateHazards(h, dt, scrollPx, turkey, audio, events) {
  // Knives.
  for (const k of h.knives) {
    k.x -= scrollPx;
    if (k.state === 'warn') {
      k.warnT -= dt;
      if (k.warnT <= 0) {
        k.state = 'fall';
        k.vy = 240;
        audio.whoosh();
      }
    } else if (k.state === 'fall') {
      k.vy += 4200 * dt;
      k.y += k.vy * dt;
      if (k.y >= GROUND_Y - 8) {
        k.y = GROUND_Y - 8;
        k.state = 'stuck';
        k.stuckT = 0.9;
        audio.thud();
        events.shake = 0.12;
      }
    } else {
      k.stuckT -= dt;
    }
  }
  h.knives = h.knives.filter((k) => k.x > -80 && (k.state !== 'stuck' || k.stuckT > 0));

  // Pumpkins roll left, faster than the scroll so they close in.
  for (const p of h.pumpkins) {
    p.x -= scrollPx;
    p.x += p.vx * dt;
    p.rot += dt * 4;
  }
  h.pumpkins = h.pumpkins.filter((p) => p.x > -90);

  // Fences, corn, feathers, haystacks just scroll.
  for (const f of h.fences) f.x -= scrollPx;
  h.fences = h.fences.filter((f) => f.x + f.w > -40);
  for (const c of h.corn) c.x -= scrollPx;
  h.corn = h.corn.filter((c) => !c.taken && c.x > -40);
  for (const f of h.feathers) f.x -= scrollPx;
  h.feathers = h.feathers.filter((f) => !f.taken && f.x > -40);
  for (const s of h.haystacks) s.x -= scrollPx;
  h.haystacks = h.haystacks.filter((s) => s.x > -140);

  // Ovens cycle: idle -> warn (door glows) -> fire (flame jet) -> idle.
  // The cycle is fixed length, so a careful player can learn the rhythm.
  let anyFire = false;
  for (const o of h.ovens) {
    o.x -= scrollPx;
    o.t -= dt;
    if (o.phase === 'idle' && o.t <= 0) { o.phase = 'warn'; o.t = 0.55; }
    else if (o.phase === 'warn' && o.t <= 0) { o.phase = 'fire'; o.t = 0.85; audio.startSizzle(); }
    else if (o.phase === 'fire' && o.t <= 0) { o.phase = 'idle'; o.t = o.cycle; audio.stopSizzle(); }
    if (o.phase === 'fire') anyFire = true;
  }
  if (!anyFire) audio.stopSizzle();
  h.ovens = h.ovens.filter((o) => o.x > -160);

  // Forest gate appears in the last stretch of the run.
  if (h.gateX !== null) h.gateX -= scrollPx;
}

// Collision checks against the turkey's box. Returns 'knife' | 'flame' |
// 'trip' | null. A trip (fence/pumpkin) only slows the turkey; a knife or
// flame costs a life.
export function checkHits(h, turkey) {
  if (turkey.invulnerable > 0 || turkey.hidden) return null;
  const tx0 = turkey.x - 34;
  const tx1 = turkey.x + 40;
  const ty0 = turkey.y - 40;
  const ty1 = turkey.y + 36;
  for (const k of h.knives) {
    if (k.state !== 'fall') continue;
    if (k.x > tx0 - 8 && k.x < tx1 + 8 && k.y > ty0 - 30 && k.y < ty1) return 'knife';
  }
  for (const o of h.ovens) {
    if (o.phase !== 'fire') continue;
    // Flame jet rises from the oven door mouth (oven sits on the ground).
    if (turkey.x > o.x - 52 && turkey.x < o.x + 52 && turkey.y > GROUND_Y - 150) return 'flame';
  }
  for (const p of h.pumpkins) {
    if (Math.abs(p.x - turkey.x) < 46 && turkey.y > GROUND_Y - 90) return 'trip';
  }
  for (const f of h.fences) {
    if (turkey.x + 30 > f.x && turkey.x - 30 < f.x + f.w && turkey.y > GROUND_Y - 78) return 'trip';
  }
  return null;
}

// Pickups: corn adds score, a golden feather refills the dash.
export function collectPickups(h, turkey, events) {
  for (const c of h.corn) {
    if (!c.taken && Math.abs(c.x - turkey.x) < 52 && Math.abs(c.y - turkey.y) < 56) {
      c.taken = true;
      events.corn++;
    }
  }
  for (const f of h.feathers) {
    if (!f.taken && Math.abs(f.x - turkey.x) < 54 && Math.abs(f.y - turkey.y) < 60) {
      f.taken = true;
      events.feather++;
    }
  }
}

// The nearest haystack the turkey could dive into, or null.
export function nearbyHaystack(h, turkey) {
  for (const s of h.haystacks) {
    if (Math.abs(s.x - turkey.x) < 95) return s;
  }
  return null;
}

// Distance in meters from scroll pixels.
export function metersFromScroll(scrollPx) {
  return scrollPx / PIXELS_PER_METER;
}

export function stageForDistance(meters) {
  for (let i = 0; i < STAGES.length; i++) {
    if (meters < STAGES[i].end) return i;
  }
  return STAGES.length - 1;
}
