// Gobble Dash — boot, the frame loop and the menu plumbing.
// Reads ?shot= for the deterministic screenshot poses, otherwise starts
// on the title screen and hands control to the player.
import { VIEW_W, VIEW_H } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, startRun, updateWorld } from './world.js';
import { render } from './render.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// Keep the 1280x720 logical field scaled to the window, letterboxed.
// Runs before any render (including the one-shot screenshot poses).
function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = Math.round(VIEW_W * scale * window.devicePixelRatio);
  canvas.height = Math.round(VIEW_H * scale * window.devicePixelRatio);
  canvas.style.width = `${Math.round(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.round(VIEW_H * scale)}px`;
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const input = createInput(canvas);
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let world;
let shotMode = false;
if (shotName) {
  shotMode = true;
  const built = buildShot(shotName, seed);
  world = built.world;
  // One still frame, rendered synchronously so the screenshot is stable.
  render(ctx, world);
  if (built.after) built.after();
  render(ctx, world);
  announce(world);
} else {
  world = createWorld(seed);
  requestAnimationFrame(frame);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  step(dt);
  requestAnimationFrame(frame);
}

function step(dt) {
  // Global keys, whatever the mode.
  if (input.wasPressed('mute')) {
    const muted = audio.toggleMute();
    announce(world, muted ? 'Sound off.' : 'Sound on.');
  }

  if (world.mode === 'title') {
    world.time += dt;
    if (input.wasPressed('confirm')) {
      audio.unlock();
      audio.click();
      audio.gobble(true);
      world = startRun(world);
      announce(world, 'Run! Jump the fences, dodge the knives.');
    }
  } else if (world.mode === 'playing') {
    if (input.wasPressed('pause')) {
      world.mode = 'paused';
      audio.click();
      announce(world, 'Paused.');
    } else {
      updateWorld(world, dt, input, audio);
      if (world.mode === 'escaped') {
        audio.winJingle();
        announce(world, 'Escaped! You outran Thanksgiving.');
      } else if (world.mode === 'caught') {
        audio.loseSting();
        announce(world, 'Caught! Press R to run again.');
      }
    }
  } else if (world.mode === 'paused') {
    if (input.wasPressed('pause') || input.wasPressed('confirm')) {
      world.mode = 'playing';
      audio.click();
    }
  } else if (world.mode === 'escaped' || world.mode === 'caught') {
    world.time += dt;
    if (input.wasPressed('restart') || input.wasPressed('confirm')) {
      audio.click();
      world = startRun(world);
      announce(world, 'Run! Jump the fences, dodge the knives.');
    }
  }

  input.endFrame();
  render(ctx, world);
}

function announce(world, extra) {
  const parts = [extra || ''];
  if (world.mode === 'playing') {
    parts.push(`Score ${world.score}, ${Math.floor(world.distanceM)} meters, ${world.lives} lives.`);
  }
  const text = parts.filter(Boolean).join(' ');
  if (statusEl && text) statusEl.textContent = text;
}
