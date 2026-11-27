// Gobble Dash — drawing the frame: background, entities, HUD, menus and
// end screens. It reads the world and never changes it.
import { VIEW_W, VIEW_H, GROUND_Y, ESCAPE_DISTANCE_M, STAGES, PALETTE as P } from './config.js';
import { drawBackground, drawTurkey, drawFarmer, drawOven, drawHaystack, drawPumpkin, drawFence, drawCorn, drawFeather, drawKnife, drawForestGate } from './art.js';
import { farmerThreat } from './farmer.js';

export function render(ctx, world) {
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // Screen shake on hits.
  if (world.events.shake > 0) {
    const s = world.events.shake * 22;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  const stage = STAGES[world.stageIndex];
  drawBackground(ctx, stage.name, world.scrollPx, world.time);

  if (world.mode === 'title') {
    drawTitleScene(ctx, world);
    ctx.restore();
    return;
  }

  drawWorld(ctx, world);

  if (world.mode === 'playing' || world.mode === 'paused') {
    drawHud(ctx, world);
    if (world.mode === 'paused') drawPaused(ctx);
  } else if (world.mode === 'escaped' || world.mode === 'caught') {
    // End screen: no HUD here — the score card already carries score /
    // distance / best, and the HUD text used to ghost through the card
    // (the "FOREST GATE" label bled through "SCORE 5300" in 4-end.jpg).
    drawEndScreen(ctx, world);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ world
function drawWorld(ctx, world) {
  const h = world.hazards;
  const t = world.turkey;

  // Forest gate at the end of the run. Its label is hidden on the end
  // screens, where it used to ghost through the score card.
  if (h.gateX !== null) {
    const endMode = world.mode === 'escaped' || world.mode === 'caught';
    drawForestGate(ctx, h.gateX, GROUND_Y, { label: !endMode });
  }

  // Haystacks first (the turkey hides behind one).
  for (const s of h.haystacks) drawHaystack(ctx, s.x, GROUND_Y, s.scale);

  // Fences and pumpkins.
  for (const f of h.fences) drawFence(ctx, f.x, GROUND_Y, f.w);
  for (const p of h.pumpkins) {
    ctx.save();
    ctx.translate(p.x, GROUND_Y - p.r * 0.8);
    ctx.rotate(p.rot);
    drawPumpkin(ctx, 0, 0, p.r);
    ctx.restore();
  }

  // Ovens (kitchen stage).
  for (const o of h.ovens) {
    const flame = o.phase === 'fire' ? 0.65 + 0.35 * Math.sin(world.time * 22) : 0;
    drawOven(ctx, o.x, GROUND_Y, flame, o.phase === 'warn');
  }

  // Pickups.
  for (const c of h.corn) drawCorn(ctx, c.x, c.y, Math.sin(world.time * 4 + c.x * 0.01) * 4);
  for (const f of h.feathers) drawFeather(ctx, f.x, f.y, Math.sin(world.time * 3 + f.x * 0.01) * 6, world.time);

  // Knife shadows first (the telegraph), then the blades.
  for (const k of h.knives) {
    if (k.state === 'warn') {
      const grow = 1 - k.warnT / 0.55;
      ctx.fillStyle = `rgba(0,0,0,${0.15 + grow * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(k.x, GROUND_Y + 6, 8 + grow * 22, 5 + grow * 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,60,40,0.85)';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', k.x, GROUND_Y - 64);
    }
  }
  for (const k of h.knives) {
    if (k.state === 'fall' || k.state === 'stuck') drawKnife(ctx, k.x, k.y, k.state === 'stuck' ? 0.35 : 0);
  }

  // The farmer, chasing from the left.
  const f = world.farmer;
  drawFarmer(ctx, f.x, GROUND_Y - 4, {
    runPhase: f.runPhase,
    lunge: f.lungeTimer > 0,
    searching: f.searching,
  });

  // The turkey — hidden inside the haystack, or running free.
  if (!t.hidden) {
    drawTurkey(ctx, t.x, t.y, {
      bob: t.bob,
      legPhase: t.legPhase,
      blinking: t.blinking,
      invulnerable: t.invulnerable > 0,
    });
    // Dash streaks.
    if (t.dashing) {
      ctx.strokeStyle = 'rgba(255, 217, 77, 0.8)';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(t.x - 44 - i * 14, t.y - 24 + i * 16);
        ctx.lineTo(t.x - 84 - i * 14, t.y - 24 + i * 16);
        ctx.stroke();
      }
    }
  } else if (t.hideStack) {
    // Just the turkey's eyes peeking out of the hay.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(t.hideStack.x - 8, GROUND_Y - 46, 5, 0, Math.PI * 2);
    ctx.arc(t.hideStack.x + 8, GROUND_Y - 46, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(t.hideStack.x - 7, GROUND_Y - 46, 2.4, 0, Math.PI * 2);
    ctx.arc(t.hideStack.x + 9, GROUND_Y - 46, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stage banner.
  if (world.events.bannerT > 0) {
    const a = Math.min(1, world.events.bannerT);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = P.hudText;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(world.events.banner, VIEW_W / 2, 190);
    ctx.restore();
  }

  // Hit flash.
  if (world.events.flash) {
    ctx.fillStyle = world.events.flash === 'flame' ? 'rgba(255,90,20,0.22)' : 'rgba(255,40,40,0.18)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    world.events.flash = null;
  }
}

// -------------------------------------------------------------------- HUD
function drawHud(ctx, world) {
  const t = world.turkey;
  const f = world.farmer;
  const stage = STAGES[world.stageIndex];

  // Top bar: score, distance, stage, lives.
  ctx.fillStyle = P.hudPanel;
  ctx.beginPath();
  ctx.roundRect(14, 12, 560, 64, 12);
  ctx.fill();
  ctx.fillStyle = P.hudText;
  ctx.textAlign = 'left';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score}`, 30, 40);
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(world.distanceM)}m / ${ESCAPE_DISTANCE_M}m`, 30, 66);
  ctx.fillStyle = P.hudAccent;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stage.name, 480, 40);
  ctx.fillStyle = P.hudText;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('GOBBLE DASH', 480, 64);

  // Lives: hearts.
  for (let i = 0; i < 3; i++) {
    const lx = 620 + i * 44;
    ctx.fillStyle = i < world.lives ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(lx, 44);
    ctx.bezierCurveTo(lx - 16, 28, lx - 24, 44, lx, 58);
    ctx.bezierCurveTo(lx + 24, 44, lx + 16, 28, lx, 44);
    ctx.fill();
  }

  // Distance progress bar to the forest gate.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(14, 84, 560, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#7dd069';
  ctx.beginPath();
  ctx.roundRect(14, 84, Math.max(12, 560 * (world.distanceM / ESCAPE_DISTANCE_M)), 12, 6);
  ctx.fill();
  ctx.fillStyle = P.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🌲 FOREST GATE', 584, 96);

  // Farmer gap meter: the chase pressure, bottom-left.
  const threat = farmerThreat(f);
  ctx.fillStyle = P.hudPanel;
  ctx.beginPath();
  ctx.roundRect(14, VIEW_H - 66, 340, 52, 12);
  ctx.fill();
  ctx.fillStyle = '#ffb3b3';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', 28, VIEW_H - 40);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.roundRect(110, VIEW_H - 52, 220, 14, 7);
  ctx.fill();
  ctx.fillStyle = threat > 0.7 ? '#ff3b30' : threat > 0.4 ? '#ff9500' : '#7dd069';
  ctx.beginPath();
  ctx.roundRect(110, VIEW_H - 52, Math.max(10, 220 * threat), 14, 7);
  ctx.fill();
  if (threat > 0.7) {
    ctx.fillStyle = '#ff5b4d';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText('HE IS RIGHT BEHIND YOU!', 28, VIEW_H - 20);
  }

  // Dash cooldown, bottom-right.
  const dashReady = t.dashCooldown <= 0;
  ctx.fillStyle = P.hudPanel;
  ctx.beginPath();
  ctx.roundRect(VIEW_W - 214, VIEW_H - 66, 200, 52, 12);
  ctx.fill();
  ctx.fillStyle = dashReady ? P.featherGold : 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dashReady ? '⚡ DASH READY [Shift]' : 'DASH…', VIEW_W - 114, VIEW_H - 32);
  if (!dashReady) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.roundRect(VIEW_W - 194, VIEW_H - 52, 160, 8, 4);
    ctx.fill();
    ctx.fillStyle = P.featherGold;
    ctx.beginPath();
    ctx.roundRect(VIEW_W - 194, VIEW_H - 52, 160 * (1 - t.dashCooldown / 2.4), 8, 4);
    ctx.fill();
  }

  // Controls hint, faint, bottom centre.
  ctx.fillStyle = 'rgba(255,233,184,0.55)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Space jump · Shift dash · hold ↓ hide in hay · P pause · M mute', VIEW_W / 2, VIEW_H - 18);
}

// ------------------------------------------------------------- title scene
function drawTitleScene(ctx, world) {
  // A lively farmyard behind the title: haystack, fence, pumpkins, corn.
  drawHaystack(ctx, 210, GROUND_Y, 1.1);
  drawFence(ctx, 900, GROUND_Y, 130);
  drawPumpkin(ctx, 1080, GROUND_Y - 24, 34);
  drawPumpkin(ctx, 1150, GROUND_Y - 18, 24);
  drawCorn(ctx, 700, GROUND_Y - 46, Math.sin(world.time * 3) * 4);
  drawCorn(ctx, 890, GROUND_Y - 150, Math.sin(world.time * 3 + 1) * 4);
  drawTurkey(ctx, 430, GROUND_Y, { legPhase: world.time * 1.4, bob: Math.sin(world.time * 4) * -2 });
  drawFarmer(ctx, 180, GROUND_Y - 4, { runPhase: world.time * 1.2 });
  drawOven(ctx, 1060, GROUND_Y, 0.4 + 0.3 * Math.sin(world.time * 3), false);

  // Title card.
  ctx.fillStyle = 'rgba(20, 8, 4, 0.55)';
  ctx.beginPath();
  ctx.roundRect(240, 78, 800, 300, 20);
  ctx.fill();
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 10;
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 168);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('A TURKEY ESCAPE — THANKSGIVING IS COMING!', VIEW_W / 2, 216);
  ctx.fillStyle = P.hudText;
  ctx.font = '21px system-ui, sans-serif';
  ctx.fillText('The farmer wants you for dinner. Run 1000m to the forest gate!', VIEW_W / 2, 258);
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('SPACE / ↑ jump · SHIFT dash · hold ↓ hide in a haystack', VIEW_W / 2, 296);
  ctx.fillText('Dodge falling carving knives · jump fences & pumpkins · beware the oven!', VIEW_W / 2, 326);
  ctx.fillText('Corn = points · golden feather = free dash · 3 lives', VIEW_W / 2, 356);

  // Start prompt, pulsing. Dark green button, white text: readable at a glance.
  const pulse = 0.82 + 0.18 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 190, 420, 380, 62, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER OR CLICK TO RUN!', VIEW_W / 2, 460);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,233,184,0.7)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Best score: ' + world.bestScore, VIEW_W / 2, 520);
}

// ----------------------------------------------------------------- paused
function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = P.hudText;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 330);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Press P to keep running — the farmer waits for no turkey.', VIEW_W / 2, 380);
}

// -------------------------------------------------------------- end screen
function drawEndScreen(ctx, world) {
  const escaped = world.mode === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(60, 8, 8, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = escaped ? '#a8e063' : '#ff6b5e';
  ctx.font = 'bold 78px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 220);
  ctx.shadowBlur = 0;
  ctx.fillStyle = P.hudText;
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText(world.endReason, VIEW_W / 2, 272);
  if (escaped) {
    ctx.fillText('The forest gate closes behind you. Thanksgiving is cancelled!', VIEW_W / 2, 308);
  } else {
    ctx.fillText('The farmer is already sharpening the carving knife…', VIEW_W / 2, 308);
  }

  // Score card — near-opaque on purpose: the old 0.62-alpha panel let
  // the "FOREST GATE" label ghost through the score text.
  ctx.fillStyle = 'rgba(30, 16, 8, 0.94)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 260, 340, 520, 130, 16);
  ctx.fill();
  ctx.fillStyle = P.hudText;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`SCORE  ${world.score}`, VIEW_W / 2, 388);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`Distance  ${Math.floor(world.distanceM)}m  ·  Best  ${world.bestScore}`, VIEW_W / 2, 428);
  ctx.fillStyle = P.hudAccent;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(escaped ? '🏆 YOU OUTRAN THANKSGIVING!' : '🍗 SO CLOSE — RUN AGAIN!', VIEW_W / 2, 458);

  const pulse = 0.82 + 0.18 * Math.sin(world.time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 190, 510, 380, 62, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 550);
  ctx.restore();
}
