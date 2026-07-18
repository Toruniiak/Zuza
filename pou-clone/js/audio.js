/* ===== Pou Clone — dźwięki proceduralne (Web Audio) + wibracje ===== */
'use strict';

const AudioFX = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, delay = 0) {
    if (!State.get().settings.sound) return;
    try {
      const a = ac();
      const t0 = a.currentTime + delay;
      const osc = a.createOscillator();
      const gain = a.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(a.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch (e) { /* audio niedostępne — ignoruj */ }
  }

  return {
    tone,
    tap:     () => tone(600, 0.06, 'sine', 0.1),
    eat:     () => { tone(300, 0.08, 'square', 0.08); tone(220, 0.1, 'square', 0.08, 0.09); },
    wash:    () => { tone(900, 0.15, 'sine', 0.08); tone(1200, 0.15, 'sine', 0.06, 0.1); },
    coin:    () => { tone(988, 0.07, 'square', 0.08); tone(1319, 0.18, 'square', 0.08, 0.07); },
    buy:     () => { tone(660, 0.08); tone(880, 0.12, 'sine', 0.15, 0.08); },
    giggle:  () => { tone(500, 0.06); tone(700, 0.06, 'sine', 0.15, 0.07); tone(900, 0.08, 'sine', 0.15, 0.14); },
    sad:     () => { tone(300, 0.2, 'sine', 0.1); tone(240, 0.3, 'sine', 0.1, 0.18); },
    levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'square', 0.1, i * 0.12)),
    gameOver:() => [400, 330, 260, 200].forEach((f, i) => tone(f, 0.18, 'sawtooth', 0.07, i * 0.15)),
    jump:    () => tone(450, 0.1, 'square', 0.06),
    pop:     () => tone(800 + Math.random() * 400, 0.05, 'sine', 0.12),
    bad:     () => tone(150, 0.25, 'sawtooth', 0.12),
    sleep:   () => { tone(400, 0.3, 'sine', 0.08); tone(300, 0.4, 'sine', 0.08, 0.25); },
    simon:   i => tone([330, 415, 494, 587][i % 4], 0.28, 'square', 0.12),
  };
})();

function vibrate(pattern) {
  if (State.get().settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
}
