// Gobble Dash — the farmer's chase brain.
// The farmer runs behind the turkey, closes in whenever the turkey is
// slowed, lunges when he is close, and searches (then gives up ground)
// when the turkey hides in a haystack.
import { FARMER_BASE_SPEED, FARMER_LUNGE_SPEED, FARMER_CATCH_DISTANCE, TURKEY_START_X } from './config.js';

export function createFarmer() {
  return {
    // gap: pixels between the farmer's nose and the turkey's tail.
    gap: 300,
    x: TURKEY_START_X - 300,
    y: 0,
    runPhase: 0,
    lungeTimer: 0,
    searchTimer: 0,
    searching: false,
    shoutCooldown: 0,
    caught: false,
  };
}

export function updateFarmer(farmer, dt, turkey, world) {
  farmer.shoutCooldown = Math.max(0, farmer.shoutCooldown - dt);

  // Hiding: the farmer runs up to the haystack, looks around, then
  // loses the trail and falls back — the turkey earns breathing room.
  if (turkey.hidden) {
    if (!farmer.searching) {
      farmer.searching = true;
      farmer.searchTimer = 1.8;
    }
    farmer.searchTimer -= dt;
    farmer.x += FARMER_LUNGE_SPEED * 0.5 * dt;
    if (farmer.x > turkey.x + 30) farmer.x = turkey.x + 30;
    if (farmer.searchTimer <= 0) {
      farmer.searching = false;
      farmer.gap = 260;
      farmer.x = turkey.x - farmer.gap;
    }
    farmer.runPhase += dt * 6;
    return;
  }

  farmer.searching = false;
  // The farmer matches the turkey's speed, plus a little extra when the
  // turkey stumbles (slowTimer) or dawdles — that is the chase pressure.
  // Rubber-banding keeps him on screen: if he falls far behind he runs
  // harder, so the chase is always visible, never forgotten off-screen.
  let speed = FARMER_BASE_SPEED + world.stageIndex * 14;
  if (farmer.gap > 300) speed += (farmer.gap - 300) * 0.9;
  if (turkey.slowTimer > 0) speed += 150;
  if (turkey.dashing) speed -= 60;
  if (farmer.gap < 130 && farmer.lungeTimer <= 0) {
    farmer.lungeTimer = 0.55;
    farmer.shoutCooldown = 0; // a lunge always comes with a shout
  }
  if (farmer.lungeTimer > 0) {
    farmer.lungeTimer -= dt;
    speed = FARMER_LUNGE_SPEED;
  }
  farmer.gap -= (speed - world.turkeySpeed) * dt;
  farmer.gap = Math.max(8, Math.min(400, farmer.gap));
  farmer.x = turkey.x - farmer.gap;
  farmer.runPhase += dt * (7 + world.stageIndex);

  if (farmer.gap <= FARMER_CATCH_DISTANCE) {
    farmer.caught = true;
  }
}

// How close the farmer is, 0 (far away) to 1 (about to grab the turkey).
export function farmerThreat(farmer) {
  return Math.max(0, Math.min(1, 1 - (farmer.gap - FARMER_CATCH_DISTANCE) / 300));
}
