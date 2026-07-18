/* ===== Pou Clone — GameState: jedyne źródło prawdy ===== */
'use strict';

const EventBus = (() => {
  const handlers = {};
  return {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    emit(evt, data) { (handlers[evt] || []).forEach(fn => fn(data)); },
  };
})();

const State = (() => {
  const SAVE_KEY = 'pouCloneSave_v1';
  const SAVE_VERSION = 1;

  /* stawki spadku statów na godzinę */
  const DECAY_PER_H = { hunger: 8, fun: 7, energy: 6, hygiene: 5 };
  const SLEEP_REGEN_PER_H = 40;      // energia podczas snu
  const OFFLINE_CAP_H = 12;          // maks. naliczanie decay offline
  const STAT_FLOOR = 5;              // Pou nigdy nie "umiera"

  const DEFAULT = () => ({
    version: SAVE_VERSION,
    name: 'Pou',
    named: false,
    stats: { hunger: 80, hygiene: 80, energy: 80, fun: 80 },
    xp: 0, level: 1,
    coins: 150, gems: 5,
    color: '#c9a24b',
    sleeping: false,
    lastTick: Date.now(),
    equipped: { hat: null, glasses: null, shirt: null, shoes: null },
    owned: { items: [], wallpapers: ['wp_lavender'], decorations: [], colors: ['col_classic'] },
    wallpaperActive: {},             // roomId → wallpaperId
    gardenDecor: [],                 // id dekoracji ustawionych w ogrodzie
    highScores: {},                  // gameId → { easy, med, hard }
    achievements: {},
    totals: { fed: 0, washed: 0, games: 0, coinsEarned: 0, bought: 0, visits: 0, sleeps: 0 },
    friends: { lastGiftDay: '' },
    settings: { sound: true, vibration: true, lang: 'pl', notify: false },
  });

  let s = DEFAULT();
  let saveTimer = null;

  /* ---------- zapis / odczyt ---------- */
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* brak miejsca */ }
    }, 400);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignoruj */ }
  }

  function migrate(raw) {
    // łańcuch migracji przyszłych wersji zapisu
    return raw;
  }

  function load() {
    let offlineInfo = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = migrate(JSON.parse(raw));
        s = Object.assign(DEFAULT(), parsed);
        s.stats = Object.assign(DEFAULT().stats, parsed.stats);
        s.totals = Object.assign(DEFAULT().totals, parsed.totals);
        s.settings = Object.assign(DEFAULT().settings, parsed.settings);
        offlineInfo = applyOfflineDecay();
      }
    } catch (e) { s = DEFAULT(); }
    s.lastTick = Date.now();
    return offlineInfo;
  }

  /* ---------- decay ---------- */
  function applyDecay(hours) {
    for (const k of Object.keys(DECAY_PER_H)) {
      if (k === 'energy' && s.sleeping) continue;
      s.stats[k] = Math.max(STAT_FLOOR, s.stats[k] - DECAY_PER_H[k] * hours);
    }
    if (s.sleeping) {
      s.stats.energy = Math.min(100, s.stats.energy + SLEEP_REGEN_PER_H * hours);
      if (s.stats.energy >= 100) s.sleeping = false;  // Pou budzi się sam
    }
  }

  function applyOfflineDecay() {
    const elapsedH = Math.max(0, (Date.now() - s.lastTick) / 3600000);
    const counted = Math.min(elapsedH, OFFLINE_CAP_H);
    if (counted < 0.02) return null;
    applyDecay(counted);
    return { hours: elapsedH };
  }

  function tick() {
    const now = Date.now();
    const dtH = Math.min((now - s.lastTick) / 3600000, OFFLINE_CAP_H);
    s.lastTick = now;
    if (dtH <= 0) return;
    applyDecay(dtH);
    for (const k of Object.keys(s.stats)) {
      if (s.stats[k] < 25) EventBus.emit('statLow', k);
    }
    save();
  }

  /* ---------- nastrój ---------- */
  function mood() {
    if (s.sleeping) return 'sleeping';
    const min = Math.min(...Object.values(s.stats));
    if (min < 30) return 'sad';
    if (min < 60) return 'neutral';
    return 'happy';
  }

  /* ---------- XP / poziomy ---------- */
  function xpNeeded() { return s.level * 100; }

  function addXp(amount) {
    s.xp += amount;
    while (s.xp >= xpNeeded()) {
      s.xp -= xpNeeded();
      s.level++;
      const reward = 50 * s.level;
      s.coins += reward;
      s.gems += 1;
      s.totals.coinsEarned += reward;
      EventBus.emit('levelUp', { level: s.level, coins: reward });
    }
    save();
  }

  /* ---------- ekonomia ---------- */
  function price(base) { return Math.round(base * (1 + 0.1 * (s.level - 1))); }

  function spendCoins(amount) {
    if (s.coins < amount) return false;
    s.coins -= amount; save();
    return true;
  }
  function spendGems(amount) {
    if (s.gems < amount) return false;
    s.gems -= amount; save();
    return true;
  }
  function earnCoins(amount) {
    s.coins += amount;
    s.totals.coinsEarned += amount;
    save();
  }

  /* ---------- akcje opieki ---------- */
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function bump(stat, delta) { s.stats[stat] = clamp(s.stats[stat] + delta); }

  function feed(food) {
    if (s.sleeping) return { ok: false, reason: 'sleeping' };
    if (!spendCoins(food.price)) return { ok: false, reason: 'coins' };
    bump('hunger', food.hunger);
    bump('fun', food.fun);
    bump('hygiene', food.hygiene);
    s.totals.fed++;
    addXp(food.xp);
    checkAchievements();
    return { ok: true };
  }

  function wash(amount, xp = 2) {
    bump('hygiene', amount);
    s.totals.washed++;
    addXp(xp);
    checkAchievements();
  }

  function toggleSleep() {
    s.sleeping = !s.sleeping;
    if (s.sleeping) s.totals.sleeps++;
    checkAchievements();
    save();
    return s.sleeping;
  }

  function pet() {
    bump('fun', 2);
    save();
  }

  /* ---------- mini-gry ---------- */
  function canPlay() { return !s.sleeping && s.stats.energy > 15; }

  function startGame() {
    bump('energy', -10);
    bump('hygiene', -3);
    save();
  }

  function finishGame(gameId, diff, score, divisor) {
    const mult = DATA.diffMult[diff];
    const coins = Math.max(1, Math.floor(score * mult / divisor));
    const xp = Math.max(1, Math.floor(coins / 2));
    earnCoins(coins);
    bump('fun', 15);
    addXp(xp);
    s.totals.games++;
    if (!s.highScores[gameId]) s.highScores[gameId] = { easy: 0, med: 0, hard: 0 };
    const isRecord = score > s.highScores[gameId][diff];
    if (isRecord) s.highScores[gameId][diff] = score;
    checkAchievements();
    save();
    return { coins, xp, isRecord };
  }

  /* ---------- zakupy ---------- */
  function buyItem(listName, id, basePrice) {
    const p = price(basePrice);
    if (!spendCoins(p)) return false;
    s.owned[listName].push(id);
    s.totals.bought++;
    checkAchievements();
    save();
    return true;
  }

  function usePotion(pot) {
    if (pot.effect === 'color') {
      if (!s.owned.colors.includes(pot.id)) {
        if (!spendCoins(price(pot.price))) return false;
        s.owned.colors.push(pot.id);
        s.totals.bought++;
      }
      s.color = pot.color;
    } else {
      if (!spendCoins(price(pot.price))) return false;
      if (pot.effect === 'all') for (const k of Object.keys(s.stats)) s.stats[k] = 100;
      else if (pot.effect === 'xp') addXp(100);
      else bump(pot.effect, 100);
    }
    checkAchievements();
    save();
    return true;
  }

  /* ---------- osiągnięcia ---------- */
  function checkAchievements() {
    for (const a of DATA.achievements) {
      if (!s.achievements[a.id] && a.cond(s)) {
        s.achievements[a.id] = true;
        s.gems += a.gems;
        EventBus.emit('achievementUnlocked', a);
      }
    }
  }

  /* ---------- przyjaciele ---------- */
  function collectGift() {
    const today = new Date().toISOString().slice(0, 10);
    if (s.friends.lastGiftDay === today) return false;
    s.friends.lastGiftDay = today;
    s.totals.visits++;
    earnCoins(20);
    checkAchievements();
    return true;
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    s = DEFAULT();
    saveNow();
  }

  return {
    get: () => s, load, save, saveNow, tick, mood,
    xpNeeded, addXp, price, spendCoins, spendGems, earnCoins,
    feed, wash, toggleSleep, pet,
    canPlay, startGame, finishGame,
    buyItem, usePotion, collectGift, checkAchievements, reset,
  };
})();
