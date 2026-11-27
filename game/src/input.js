// Gobble Dash — keyboard, mouse and touch input.
// Keeps one live picture of which keys are held plus which actions were
// just pressed, so the update step never reads the DOM directly.
export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let anyKeyAt = 0;

  const KEYMAP = {
    Space: 'jump',
    ArrowUp: 'jump',
    KeyW: 'jump',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowDown: 'hide',
    KeyS: 'hide',
    ShiftLeft: 'dash',
    ShiftRight: 'dash',
    KeyX: 'dash',
    KeyP: 'pause',
    KeyM: 'mute',
    KeyR: 'restart',
    Enter: 'confirm',
  };

  function onDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
    if (!held.has(action)) pressed.add(action);
    held.add(action);
    anyKeyAt = performance.now();
  }

  function onUp(event) {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);

  // Click / tap on the canvas counts as a confirm (start, restart) and,
  // while running, as a jump — the game is fully playable with a mouse.
  let clicked = false;
  let clickX = 0;
  let clickY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    clicked = true;
    clickX = event.clientX;
    clickY = event.clientY;
    pressed.add('confirm');
    anyKeyAt = performance.now();
  });

  return {
    held(action) { return held.has(action); },
    // True only on the frame the key went down; the game clears it.
    wasPressed(action) { return pressed.has(action); },
    consume(action) { pressed.delete(action); },
    endFrame() { pressed.clear(); clicked = false; },
    takeClick() {
      if (!clicked) return null;
      clicked = false;
      return { x: clickX, y: clickY };
    },
    lastActivityAt() { return anyKeyAt; },
  };
}
