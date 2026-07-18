/* ===== Pou Clone — bootstrap i pętla główna ===== */
'use strict';

(function main() {
  // decay offline: naliczany od ostatniej wizyty
  const offline = State.load();

  PouRenderer.init(document.getElementById('pou-canvas'));
  MiniGames.bindInput();
  UI.init();

  if (offline && offline.hours > 0.05) {
    const lang = State.get().settings.lang, u = I18N[lang].ui;
    const h = Math.floor(offline.hours), m = Math.round((offline.hours - h) * 60);
    UI.toast(`👋 ${u.welcomeBack} ${u.wasAway} ${h > 0 ? h + ' h ' : ''}${m} min`);
  }

  // pętla animacji Pou
  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (document.getElementById('game-screen').classList.contains('hidden')) {
      PouRenderer.frame(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // tick logiki: decay + HUD co sekundę
  setInterval(() => {
    State.tick();
    UI.refreshHud();
  }, 1000);

  // zapis przy zamknięciu / zwinięciu aplikacji
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') State.saveNow();
    else State.tick();
  });
  window.addEventListener('beforeunload', () => State.saveNow());

  // PWA
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline i tak działa po 1. wczytaniu */ });
  }
})();
