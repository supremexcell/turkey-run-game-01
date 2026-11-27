// Gobble Dash — every sprite is drawn with canvas paths, no image files.
// The turkey, the farmer, the oven, haystacks, pumpkins, fences, corn and
// the autumn farm itself are all original vector art in this one module.
import { PALETTE as P, GROUND_Y, VIEW_W, VIEW_H } from './config.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------- turkey
// Drawn facing right, mid-stride. (x, y) is the centre of the body.
// bob: vertical run-cycle offset; legPhase: 0..1 stride; hiding: ducked pose.
export function drawTurkey(ctx, x, y, opts = {}) {
  const { bob = 0, legPhase = 0, hiding = false, blink = false, invulnerable = false } = opts;
  ctx.save();
  if (invulnerable) ctx.globalAlpha = 0.55 + 0.35 * Math.sin(performance.now() / 60);
  ctx.translate(x, y + bob);

  // Tail fan: five feathers, red -> orange -> yellow.
  const tailColors = [P.tailRed, P.tailOrange, P.tailYellow, P.tailOrange, P.tailRed];
  ctx.save();
  ctx.translate(-30, -6);
  ctx.rotate(hiding ? -0.9 : -0.55);
  for (let i = 0; i < 5; i++) {
    const ang = (i - 2) * 0.34;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(-16, 0, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-30, 0, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs: two orange sticks alternating with the stride.
  const stride = Math.sin(legPhase * Math.PI * 2) * 9;
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 16);
  ctx.lineTo(-8 + stride, 34);
  ctx.moveTo(8, 16);
  ctx.lineTo(8 - stride, 34);
  ctx.stroke();

  // Body: warm brown oval, lighter belly.
  ctx.fillStyle = P.turkeyBody;
  ellipse(ctx, 0, 0, 34, 26);
  ctx.fillStyle = P.turkeyLight;
  ellipse(ctx, 6, 8, 22, 15);

  // Wing: darker arc that flaps with the stride.
  const flap = Math.sin(legPhase * Math.PI * 2) * 5;
  ctx.fillStyle = P.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-4, -2 + flap * 0.4, 20, 12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.turkeyDark;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-16 + i * 6, 2 + flap * 0.4);
    ctx.lineTo(-22 + i * 6, 12 + flap * 0.4);
    ctx.stroke();
  }

  // Neck and head.
  ctx.fillStyle = P.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(26, -26, 10, 18, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d5a2b';
  circle(ctx, 32, -44, 13);
  // Beak.
  ctx.fillStyle = P.beak;
  ctx.beginPath();
  ctx.moveTo(42, -48);
  ctx.lineTo(58, -42);
  ctx.lineTo(42, -38);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = P.wattle;
  ctx.beginPath();
  ctx.ellipse(40, -34, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = blink ? P.turkeyBody : '#fff';
  circle(ctx, 34, -48, 4.5);
  if (!blink) {
    ctx.fillStyle = '#1a1a1a';
    circle(ctx, 35.5, -48, 2.2);
  }
  // Little head feather tuft.
  ctx.strokeStyle = P.turkeyDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(28, -56);
  ctx.lineTo(24, -64);
  ctx.moveTo(32, -57);
  ctx.lineTo(32, -66);
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------- farmer
// Overalls, straw hat, red shirt — chasing from the left. (x, y) is the
// centre of the body; runPhase drives the legs; lunge leans him forward.
export function drawFarmer(ctx, x, y, opts = {}) {
  const { runPhase = 0, lunge = false, searching = false } = opts;
  ctx.save();
  ctx.translate(x, y);
  if (lunge) ctx.rotate(0.16);
  if (searching) ctx.rotate(-0.06);

  const stride = Math.sin(runPhase * Math.PI * 2) * 12;
  // Legs (dark trousers under the overalls).
  ctx.strokeStyle = '#2b3a4a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 22);
  ctx.lineTo(-6 + stride, 52);
  ctx.moveTo(6, 22);
  ctx.lineTo(6 - stride, 52);
  ctx.stroke();

  // Overalls: blue bib + straps.
  ctx.fillStyle = P.overalls;
  ctx.fillRect(-16, -6, 32, 32);
  ctx.fillStyle = P.farmerShirt;
  ctx.fillRect(-16, -22, 32, 18);
  ctx.fillStyle = P.overalls;
  ctx.fillRect(-13, -26, 6, 12);
  ctx.fillRect(7, -26, 6, 12);
  // Shirt sleeves.
  ctx.fillStyle = P.farmerShirt;
  ellipse(ctx, -18, -12, 8, 12);
  ellipse(ctx, 18, -12, 8, 12);
  // Arms reaching forward (or scratching his head while searching).
  ctx.strokeStyle = P.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (searching) {
    ctx.moveTo(16, -14);
    ctx.lineTo(26, -34);
  } else {
    ctx.moveTo(16, -12);
    ctx.lineTo(38, -2 + Math.sin(runPhase * Math.PI * 2) * 4);
  }
  ctx.moveTo(-16, -12);
  ctx.lineTo(-34, 2 - Math.sin(runPhase * Math.PI * 2) * 4);
  ctx.stroke();
  // Hands.
  ctx.fillStyle = P.skin;
  if (searching) {
    circle(ctx, 26, -36, 5);
  } else {
    circle(ctx, 40, -1 + Math.sin(runPhase * Math.PI * 2) * 4, 5);
  }
  circle(ctx, -36, 3 - Math.sin(runPhase * Math.PI * 2) * 4, 5);

  // Head + straw hat.
  ctx.fillStyle = P.skin;
  circle(ctx, 0, -38, 15);
  // Moustache and angry brows.
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(-9, -30, 18, 4);
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -46);
  ctx.lineTo(-2, -43);
  ctx.moveTo(10, -46);
  ctx.lineTo(2, -43);
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = '#1a1a1a';
  circle(ctx, -6, -40, 2);
  circle(ctx, 6, -40, 2);
  // Straw hat: wide brim + dome + band.
  ctx.fillStyle = P.hat;
  ctx.beginPath();
  ctx.ellipse(0, -50, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -54, 13, 9, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = P.hatBand;
  ctx.fillRect(-13, -56, 26, 4);
  ctx.restore();
}

// ------------------------------------------------------------------- oven
// A cast-iron Thanksgiving oven. flame 0..1 controls the jet from its mouth;
// warn flashes the door glow before the jet fires.
export function drawOven(ctx, x, y, flame = 0, warn = false) {
  ctx.save();
  ctx.translate(x, y);
  // Body.
  ctx.fillStyle = P.ovenIron;
  ctx.beginPath();
  ctx.roundRect(-70, -150, 140, 150, 10);
  ctx.fill();
  ctx.fillStyle = P.ovenIronDark;
  ctx.beginPath();
  ctx.roundRect(-70, -150, 140, 26, 10);
  ctx.fill();
  // Chimney.
  ctx.fillStyle = P.ovenIronDark;
  ctx.fillRect(-14, -186, 28, 40);
  ctx.fillStyle = P.ovenIron;
  ctx.fillRect(-20, -192, 40, 10);
  // Door with window.
  ctx.fillStyle = '#17191d';
  ctx.beginPath();
  ctx.roundRect(-52, -118, 104, 78, 8);
  ctx.fill();
  const glow = warn ? 0.85 : 0.25 + flame * 0.75;
  ctx.fillStyle = `rgba(255, ${Math.floor(120 + flame * 80)}, 20, ${glow})`;
  ctx.beginPath();
  ctx.roundRect(-42, -108, 84, 58, 6);
  ctx.fill();
  // Door handle + legs.
  ctx.fillStyle = '#8b939e';
  ctx.fillRect(-52, -78, 104, 6);
  ctx.fillRect(-58, 0, 12, 14);
  ctx.fillRect(46, 0, 12, 14);
  // Flame jet from the open door mouth.
  if (flame > 0.05) {
    const h = 34 + flame * 78;
    const w = 60 + flame * 46;
    ctx.fillStyle = P.flameEdge;
    ctx.beginPath();
    ctx.moveTo(-w / 2, -30);
    ctx.quadraticCurveTo(-w * 0.7, -30 - h * 0.55, 0, -30 - h);
    ctx.quadraticCurveTo(w * 0.7, -30 - h * 0.55, w / 2, -30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.flameMid;
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, -30);
    ctx.quadraticCurveTo(-w * 0.42, -30 - h * 0.4, 0, -30 - h * 0.72);
    ctx.quadraticCurveTo(w * 0.42, -30 - h * 0.4, w * 0.32, -30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.flameCore;
    ctx.beginPath();
    ctx.moveTo(-w * 0.16, -30);
    ctx.quadraticCurveTo(-w * 0.2, -30 - h * 0.25, 0, -30 - h * 0.45);
    ctx.quadraticCurveTo(w * 0.2, -30 - h * 0.25, w * 0.16, -30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// -------------------------------------------------------------- haystack
export function drawHaystack(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = P.hayDark;
  ctx.beginPath();
  ctx.ellipse(0, 0, 74, 30, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.hay;
  ctx.beginPath();
  ctx.ellipse(0, -6, 66, 46, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.hayDark;
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 16, -8);
    ctx.quadraticCurveTo(i * 18, -30, i * 12, -48);
    ctx.stroke();
  }
  ctx.fillStyle = P.hayLight;
  ctx.beginPath();
  ctx.ellipse(-14, -18, 20, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --------------------------------------------------------------- pumpkin
export function drawPumpkin(ctx, x, y, r = 30) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d35400';
  ellipse(ctx, 0, 0, r, r * 0.85);
  ctx.fillStyle = '#e67e22';
  ellipse(ctx, -r * 0.45, 0, r * 0.5, r * 0.8);
  ellipse(ctx, r * 0.45, 0, r * 0.5, r * 0.8);
  ctx.strokeStyle = '#a04000';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(i * r * 0.3, 0, r * 0.28, r * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d6d2e';
  ctx.fillRect(-4, -r * 0.95, 8, 12);
  ctx.restore();
}

// ------------------------------------------------------------------ fence
export function drawFence(ctx, x, y, w = 110) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = P.fenceDark;
  ctx.fillRect(6, -58, 10, 58);
  ctx.fillRect(w - 16, -58, 10, 58);
  ctx.fillStyle = P.fence;
  ctx.fillRect(0, -52, w, 10);
  ctx.fillRect(0, -30, w, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, -52, w, 3);
  ctx.fillRect(0, -30, w, 3);
  ctx.restore();
}

// ------------------------------------------------------------------- corn
export function drawCorn(ctx, x, y, bob = 0) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = P.cornHusk;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.lineTo(-16, 26);
  ctx.lineTo(-2, 18);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 10);
  ctx.lineTo(16, 26);
  ctx.lineTo(2, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = P.corn;
  ctx.beginPath();
  ctx.ellipse(0, -6, 11, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a800';
  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      circle(ctx, c * 5, r * 9 - 6, 1.6);
    }
  }
  ctx.restore();
}

// ----------------------------------------------------------- golden feather
export function drawFeather(ctx, x, y, bob = 0, spin = 0) {
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(spin) * 0.25);
  ctx.fillStyle = P.featherGold;
  ctx.beginPath();
  ctx.ellipse(0, -6, 9, 18, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.ellipse(-2, -8, 4, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c99600';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(6, 26);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ knife
// A carving knife mid-fall, blade down, with a glint.
export function drawKnife(ctx, x, y, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = P.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-5, -34);
  ctx.lineTo(5, -34);
  ctx.lineTo(5, 8);
  ctx.lineTo(0, 22);
  ctx.lineTo(-5, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(-2, -30, 2, 34);
  ctx.fillStyle = P.knifeHandle;
  ctx.beginPath();
  ctx.roundRect(-6, -52, 12, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-6, -34, 12, 3);
  ctx.restore();
}

// ------------------------------------------------------------------ leaves
export function drawLeaf(ctx, x, y, size, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(size + 4, -2);
  ctx.lineTo(size + 4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------- stage backgrounds
// Sunset sky, sun, far hills, barn silhouette (Barn), kitchen windows
// (Kitchen) and the warm dirt track the turkey runs on.
export function drawBackground(ctx, stage, scroll, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  if (stage === 'KITCHEN') {
    grad.addColorStop(0, '#3a1c2e');
    grad.addColorStop(0.55, '#8a3a2a');
    grad.addColorStop(1, '#e08a3c');
  } else {
    grad.addColorStop(0, P.skyTop);
    grad.addColorStop(0.5, P.skyMid);
    grad.addColorStop(1, P.skyLow);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

  // Low sun with a warm halo.
  const sunX = 980 - (scroll * 0.02) % 200;
  const sunY = 180;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
  halo.addColorStop(0, 'rgba(255, 217, 122, 0.85)');
  halo.addColorStop(1, 'rgba(255, 158, 69, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
  ctx.fillStyle = P.sunCore;
  circle(ctx, sunX, sunY, 52);

  // Rolling hills, two parallax layers.
  ctx.fillStyle = stage === 'KITCHEN' ? '#5a2a1e' : '#7a3f22';
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, 470 + Math.sin((x + scroll * 0.25) * 0.008) * 26);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = stage === 'KITCHEN' ? '#4a2115' : '#63301a';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  for (let x = 0; x <= VIEW_W; x += 40) {
    ctx.lineTo(x, 520 + Math.sin((x + scroll * 0.5) * 0.01 + 2) * 20);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  if (stage === 'BARN') {
    // Big red barn silhouette on the horizon.
    const bx = 900 - ((scroll * 0.35) % 1600);
    ctx.fillStyle = '#8e2f1d';
    ctx.fillRect(bx, 330, 260, 180);
    ctx.fillStyle = '#6e2214';
    ctx.beginPath();
    ctx.moveTo(bx - 14, 330);
    ctx.lineTo(bx + 130, 250);
    ctx.lineTo(bx + 274, 330);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2d8a0';
    ctx.fillRect(bx + 110, 420, 40, 90);
  }
  if (stage === 'KITCHEN') {
    // Warm kitchen windows glowing on the horizon.
    for (let i = 0; i < 4; i++) {
      const wx = 180 + i * 300 - ((scroll * 0.3) % 300);
      ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
      ctx.fillRect(wx, 380, 90, 110);
      ctx.fillStyle = '#2a1408';
      ctx.fillRect(wx + 42, 380, 6, 110);
      ctx.fillRect(wx, 428, 90, 6);
    }
  }

  // Drifting leaves, a few always in the air.
  const leafColors = [P.leafRed, P.leafOrange, P.tailYellow];
  for (let i = 0; i < 14; i++) {
    const lx = ((i * 173 + scroll * 0.6 + time * 22 * (1 + (i % 3) * 0.3)) % 1400) - 60;
    const ly = 60 + ((i * 97) % 380) + Math.sin(time * 1.4 + i) * 18;
    drawLeaf(ctx, lx, ly, 7 + (i % 3) * 2, time * 0.8 + i, leafColors[i % 3]);
  }

  // Ground: near dirt band with a lighter track.
  ctx.fillStyle = P.groundFar;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = P.groundNear;
  ctx.fillRect(0, GROUND_Y + 34, VIEW_W, VIEW_H - GROUND_Y - 34);
  ctx.fillStyle = 'rgba(255, 220, 150, 0.10)';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 6);
  // Scuff marks rushing past.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 10; i++) {
    const sx = ((i * 211 - scroll * 1.0) % 1400 + 1400) % 1400 - 60;
    ctx.fillRect(sx, GROUND_Y + 56 + (i % 3) * 18, 46, 5);
  }
}

// The forest gate at the end of the run: two pines and a wooden arch.
// opts.label hides the "FOREST GATE" text — the end screens ask for
// that, because the label used to ghost through the score card.
export function drawForestGate(ctx, x, y, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  for (const px of [-150, 150]) {
    ctx.fillStyle = '#2e5d33';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px - 46 + i * 8, -40 - i * 52);
      ctx.lineTo(px, -96 - i * 52);
      ctx.lineTo(px + 46 - i * 8, -40 - i * 52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#5a351d';
    ctx.fillRect(px - 8, -40, 16, 40);
  }
  ctx.fillStyle = '#7d4f28';
  ctx.fillRect(-150, -190, 300, 18);
  if (opts.label !== false) {
    ctx.fillStyle = '#f2d8a0';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST GATE', 0, -200);
  }
  ctx.restore();
}
