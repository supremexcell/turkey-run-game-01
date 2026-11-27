// Gobble Dash — synthesized sound effects (WebAudio, no audio files).
// Every effect is built from oscillators and filtered noise at call time,
// so the game ships zero audio assets and still gobbles, flaps and sizzles.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo, when = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, filterFreq, type = 'bandpass', when = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      if (muted) this.stopSizzle();
      return muted;
    },

    // The turkey's signature: three quick descending clucks.
    gobble(big = false) {
      const base = big ? 340 : 420;
      for (let i = 0; i < 3; i++) {
        tone(base - i * 40, 0.11, 'square', big ? 0.22 : 0.15, base - i * 40 - 90, i * 0.09);
      }
      tone(base * 0.5, 0.22, 'triangle', 0.12, base * 0.4, 0.28);
    },
    // Short wing flap: a soft noise puff.
    flap() { noise(0.14, 0.16, 900, 'bandpass'); },
    // Farmer's angry shout: a falling sawtooth bark.
    shout() {
      tone(220, 0.28, 'sawtooth', 0.2, 110);
      tone(165, 0.22, 'square', 0.1, 90, 0.05);
    },
    // Knife whoosh as it drops past.
    whoosh() { noise(0.32, 0.2, 2400, 'highpass'); },
    // A knife thudding into the dirt.
    thud() {
      tone(90, 0.16, 'sine', 0.35, 45);
      noise(0.08, 0.2, 300, 'lowpass');
    },
    // Corn pickup: two bright pops.
    pickup() {
      tone(880, 0.08, 'sine', 0.18);
      tone(1318, 0.12, 'sine', 0.16, null, 0.07);
    },
    feather() {
      tone(1046, 0.1, 'triangle', 0.16);
      tone(1568, 0.16, 'triangle', 0.14, null, 0.08);
    },
    // Dash whoosh, lower and longer than the knife.
    dash() { noise(0.22, 0.18, 1400, 'bandpass'); },
    // Hurt: a squawk plus a low thump.
    hurt() {
      tone(620, 0.18, 'sawtooth', 0.22, 180);
      tone(70, 0.2, 'sine', 0.3, 40, 0.02);
    },
    // Oven flame loop: a crackling noise bed, started and stopped by the world.
    startSizzle() {
      if (!ensure() || muted || sizzleNodes) return;
      const len = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
      sizzleNodes = { src, gain };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
    // Win jingle: a rising autumn arpeggio.
    winJingle() {
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      notes.forEach((f, i) => tone(f, 0.24, 'triangle', 0.18, null, i * 0.13));
    },
    // Caught: a sad descending trombone-ish slide.
    loseSting() {
      tone(392, 0.5, 'sawtooth', 0.16, 196);
      tone(311, 0.7, 'sawtooth', 0.14, 155, 0.45);
    },
    // UI click.
    click() { tone(700, 0.06, 'sine', 0.14); },
  };
}
