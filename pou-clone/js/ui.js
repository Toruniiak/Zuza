/* ===== Pou Clone — UI: pokoje, nawigacja, modale, efekty ===== */
'use strict';

const UI = (() => {
  let currentRoom = 'living';
  let scrubDist = 0, lastScrub = null;

  const $ = sel => document.querySelector(sel);
  const t = () => I18N[State.get().settings.lang];

  /* domyślne tła pokoi (nadpisywane tapetą) */
  const ROOM_BG = {
    bedroom:  ['#2a2258', '#141031'], bathroom: ['#1f5f6b', '#0e2f38'],
    kitchen:  ['#7a5230', '#3e2814'], living:   ['#4e3d8f', '#2b2153'],
    garden:   ['#2f8f6b', '#174534'], lab:      ['#3e1f5e', '#1a0c2b'],
    shop:     ['#8a6d2f', '#463610'],
  };
  const ROOM_DECOR = {
    bedroom: [['🛏️', 8, 62], ['🪟', 70, 18], ['🧸', 82, 70]],
    bathroom: [['🛁', 6, 64], ['🚿', 78, 16], ['🪥', 84, 66]],
    kitchen: [['🧊', 4, 45], ['🍳', 80, 20], ['🥣', 86, 68]],
    living: [['🛋️', 6, 64], ['🖼️', 72, 16], ['🪴', 86, 66]],
    garden: [['🌳', 4, 30], ['🌞', 80, 8], ['🦋', 70, 40]],
    lab: [['⚗️', 6, 30], ['🔬', 80, 26], ['🧫', 84, 68]],
    shop: [['🏪', 6, 20], ['🧾', 82, 24], ['🛍️', 84, 68]],
  };
  const STAT_ROOM = { hunger: 'kitchen', hygiene: 'bathroom', energy: 'bedroom', fun: 'garden' };

  /* ---------- HUD ---------- */
  function refreshHud() {
    const s = State.get();
    $('#pou-name').textContent = s.name;
    $('#pou-level').textContent = `Lv ${s.level}`;
    $('#coins-val').textContent = s.coins;
    $('#gems-val').textContent = s.gems;
    $('#xp-bar').style.width = `${(s.xp / State.xpNeeded()) * 100}%`;
    $('#xp-label').textContent = `XP ${s.xp} / ${State.xpNeeded()}`;
    for (const el of document.querySelectorAll('.stat')) {
      const v = s.stats[el.dataset.stat];
      const fill = el.querySelector('.fill');
      fill.style.width = `${v}%`;
      fill.className = 'fill' + (v < 25 ? ' crit' : v < 50 ? ' warn' : '');
    }
    // kropki alarmowe na nawigacji
    for (const btn of document.querySelectorAll('.nav-btn')) {
      const dot = btn.querySelector('.alert-dot');
      if (dot) dot.remove();
    }
    for (const [stat, room] of Object.entries(STAT_ROOM)) {
      if (s.stats[stat] < 25) {
        const btn = document.querySelector(`.nav-btn[data-room="${room}"]`);
        if (btn && !btn.querySelector('.alert-dot')) {
          const d = document.createElement('span');
          d.className = 'alert-dot';
          btn.appendChild(d);
        }
      }
    }
    $('#sleep-overlay').classList.toggle('hidden', !s.sleeping);
  }

  /* ---------- nawigacja ---------- */
  function renderNav() {
    const nav = $('#room-nav');
    nav.innerHTML = '';
    for (const r of DATA.rooms) {
      const b = document.createElement('button');
      b.className = 'nav-btn' + (r.id === currentRoom ? ' active' : '');
      b.dataset.room = r.id;
      b.innerHTML = `${r.ico}<small>${t().rooms[r.id]}</small>`;
      b.onclick = () => { AudioFX.tap(); showRoom(r.id); };
      nav.appendChild(b);
    }
    const gear = document.createElement('button');
    gear.className = 'nav-btn';
    gear.innerHTML = `⚙️<small>${t().ui.settings}</small>`;
    gear.onclick = () => { AudioFX.tap(); openSettings(); };
    nav.appendChild(gear);
  }

  /* ---------- pokoje ---------- */
  function roomBg(roomId) {
    const s = State.get();
    const wpId = s.wallpaperActive[roomId];
    const wp = wpId && DATA.wallpapers.find(w => w.id === wpId);
    const [c1, c2] = wp ? [wp.c1, wp.c2] : ROOM_BG[roomId];
    return `linear-gradient(180deg, ${c1}, ${c2})`;
  }

  function showRoom(id) {
    currentRoom = id;
    const view = $('#room-view');
    view.style.background = roomBg(id);
    view.classList.remove('room-anim');
    void view.offsetWidth;
    view.classList.add('room-anim');
    $('#room-title').textContent = `${DATA.rooms.find(r => r.id === id).ico} ${t().rooms[id]}`;

    const decor = $('#room-decor');
    decor.innerHTML = '';
    for (const [emo, x, y] of ROOM_DECOR[id]) addDecor(decor, emo, x, y);
    if (id === 'garden') {
      State.get().gardenDecor.forEach((dId, i) => {
        const d = DATA.decorations.find(dd => dd.id === dId);
        if (d) addDecor(decor, d.emoji, 12 + i * 18, 78);
      });
    }
    renderNav();
    buildRoomUI(id);
    refreshHud();
  }

  function addDecor(parent, emoji, xPct, yPct) {
    const el = document.createElement('span');
    el.className = 'decor-item';
    el.textContent = emoji;
    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;
    parent.appendChild(el);
  }

  function btn(label, onclick, primary = false) {
    const b = document.createElement('button');
    b.className = 'action-btn' + (primary ? ' primary' : '');
    b.textContent = label;
    b.onclick = () => { AudioFX.tap(); onclick(); };
    return b;
  }

  function row(...buttons) {
    const d = document.createElement('div');
    d.className = 'action-row';
    buttons.forEach(b => d.appendChild(b));
    return d;
  }

  function buildRoomUI(id) {
    const ui = $('#room-ui');
    ui.innerHTML = '';
    const s = State.get();

    if (id === 'bedroom') {
      const sleepBtn = btn(s.sleeping ? t().ui.wake : `💡 ${t().ui.sleep}`, () => {
        const sleeping = State.toggleSleep();
        if (sleeping) AudioFX.sleep();
        toast(sleeping ? t().ui.sleepingNow : '☀️');
        buildRoomUI('bedroom'); refreshHud();
      }, true);
      ui.appendChild(row(sleepBtn, btn(`🖼️ ${t().ui.wallpaper}`, () => openWallpapers())));

    } else if (id === 'bathroom') {
      ui.appendChild(row(
        btn(`🚿 ${t().ui.shower}`, () => {
          State.wash(30, 3); AudioFX.wash(); bubblesFx(8); refreshHud();
        }, true),
        btn(`🪥 ${t().ui.teeth}`, () => {
          State.wash(10, 2); AudioFX.wash(); bubblesFx(3); refreshHud();
        }),
      ));
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:.75rem;opacity:.8';
      hint.textContent = `🧼 ${t().ui.soap}`;
      ui.appendChild(hint);

    } else if (id === 'kitchen') {
      buildKitchen(ui);

    } else if (id === 'living') {
      ui.appendChild(row(
        btn(`👕 ${t().ui.wardrobe}`, () => openWardrobe(), true),
        btn(`🤝 ${t().ui.friends}`, () => openFriends()),
        btn(`🏆 ${t().ui.achievements}`, () => openAchievements()),
      ));
      ui.appendChild(row(btn(`🖼️ ${t().ui.wallpaper}`, () => openWallpapers())));

    } else if (id === 'garden') {
      ui.appendChild(row(
        btn(`🎮 ${t().ui.games}`, () => openMinigames(), true),
        btn(`🌸 ${t().ui.decor}`, () => openDecorations()),
      ));

    } else if (id === 'lab') {
      buildLab(ui);

    } else if (id === 'shop') {
      openShop();
    }
  }

  /* ---------- kuchnia ---------- */
  let activeFoodCat = 'fruits';
  function buildKitchen(ui) {
    const tabs = document.createElement('div');
    tabs.id = 'food-tabs';
    for (const cat of DATA.foodCats) {
      const b = document.createElement('button');
      b.className = 'food-tab' + (cat === activeFoodCat ? ' active' : '');
      b.textContent = t().cats[cat];
      b.onclick = () => { activeFoodCat = cat; AudioFX.tap(); buildRoomUI('kitchen'); };
      tabs.appendChild(b);
    }
    ui.appendChild(tabs);

    const strip = document.createElement('div');
    strip.id = 'food-strip';
    const s = State.get();
    for (const f of DATA.foods.filter(f => f.cat === activeFoodCat)) {
      const locked = f.lvl > s.level;
      const el = document.createElement('button');
      el.className = 'food-item' + (locked ? ' locked' : '');
      el.innerHTML = `<span class="fi-emoji">${f.emoji}</span><span class="fi-price">${locked ? `🔒 Lv ${f.lvl}` : `🪙 ${f.price}`}</span>`;
      el.onclick = () => {
        if (locked) { toast(`🔒 ${t().ui.lockedLvl} ${f.lvl}`); return; }
        const res = State.feed(f);
        if (!res.ok) {
          toast(res.reason === 'coins' ? t().ui.notEnough : t().ui.sleepingNow);
          AudioFX.sad();
          return;
        }
        AudioFX.eat(); vibrate(25);
        PouRenderer.triggerEat();
        flyFx(f.emoji, el);
        refreshHud();
      };
      strip.appendChild(el);
    }
    ui.appendChild(strip);
  }

  /* ---------- laboratorium ---------- */
  function buildLab(ui) {
    const grid = document.createElement('div');
    grid.className = 'item-grid';
    grid.style.width = '100%';
    const s = State.get();
    for (const p of DATA.potions) {
      const locked = p.lvl > s.level;
      const isColor = p.effect === 'color';
      const ownedColor = isColor && s.owned.colors.includes(p.id);
      const activeColor = isColor && s.color === p.color;
      const el = document.createElement('button');
      el.className = 'shop-item' + (locked ? ' locked' : '') + (activeColor ? ' equipped' : ownedColor ? ' owned' : '');
      el.innerHTML = `<span class="si-emoji">${p.emoji}</span>
        <span class="si-name">${t().potions[p.id]}</span>
        <span class="si-price">${locked ? `🔒 Lv ${p.lvl}` : ownedColor ? `✓` : `🪙 ${State.price(p.price)}`}</span>`;
      el.onclick = () => {
        if (locked) { toast(`🔒 ${t().ui.lockedLvl} ${p.lvl}`); return; }
        if (State.usePotion(p)) {
          AudioFX.buy(); flyFx(p.emoji, el);
          refreshHud(); buildRoomUI('lab');
        } else { toast(t().ui.notEnough); AudioFX.sad(); }
      };
      grid.appendChild(el);
    }
    ui.appendChild(grid);
  }

  /* ---------- modale ---------- */
  function openModal(title, buildFn) {
    $('#modal-title').textContent = title;
    const body = $('#modal-body');
    body.innerHTML = '';
    buildFn(body);
    $('#modal-backdrop').classList.remove('hidden');
  }
  function closeModal() {
    $('#modal-backdrop').classList.add('hidden');
    if (currentRoom === 'shop') showRoom('living');
  }

  /* ---------- sklep ---------- */
  let shopTab = 'clothes';
  function openShop() {
    openModal(`🛒 ${t().rooms.shop}`, body => {
      const tabs = document.createElement('div');
      tabs.className = 'shop-tabs';
      const tabDefs = [['clothes', t().ui.tabClothes], ['wp', t().ui.tabWp], ['decor', t().ui.tabDecor], ['gems', t().ui.tabGems]];
      for (const [id, label] of tabDefs) {
        const b = document.createElement('button');
        b.className = 'food-tab' + (shopTab === id ? ' active' : '');
        b.textContent = label;
        b.onclick = () => { shopTab = id; AudioFX.tap(); openShop(); };
        tabs.appendChild(b);
      }
      body.appendChild(tabs);
      const grid = document.createElement('div');
      grid.className = 'item-grid';
      body.appendChild(grid);
      const s = State.get();

      if (shopTab === 'clothes') {
        for (const c of DATA.clothes) renderClothing(grid, c, () => openShop());
      } else if (shopTab === 'wp') {
        for (const w of DATA.wallpapers) {
          const owned = s.owned.wallpapers.includes(w.id);
          const el = document.createElement('button');
          el.className = 'shop-item' + (owned ? ' owned' : '');
          el.innerHTML = `<span class="si-swatch" style="background:linear-gradient(180deg,${w.c1},${w.c2})"></span>
            <span class="si-name">${t().wp[w.id]}</span>
            <span class="si-price">${owned ? `✓ ${t().ui.owned}` : `🪙 ${State.price(w.price)}`}</span>`;
          el.onclick = () => {
            if (owned) { toast(`✓ ${t().ui.owned}`); return; }
            if (State.buyItem('wallpapers', w.id, w.price)) { AudioFX.buy(); openShop(); refreshHud(); }
            else { toast(t().ui.notEnough); AudioFX.sad(); }
          };
          grid.appendChild(el);
        }
      } else if (shopTab === 'decor') {
        for (const d of DATA.decorations) {
          const locked = d.lvl > s.level;
          const owned = s.owned.decorations.includes(d.id);
          const el = document.createElement('button');
          el.className = 'shop-item' + (locked ? ' locked' : '') + (owned ? ' owned' : '');
          el.innerHTML = `<span class="si-emoji">${d.emoji}</span>
            <span class="si-price">${locked ? `🔒 Lv ${d.lvl}` : owned ? `✓ ${t().ui.owned}` : `🪙 ${State.price(d.price)}`}</span>`;
          el.onclick = () => {
            if (locked) { toast(`🔒 ${t().ui.lockedLvl} ${d.lvl}`); return; }
            if (owned) { toast(`✓ ${t().ui.owned}`); return; }
            if (State.buyItem('decorations', d.id, d.price)) {
              State.get().gardenDecor.push(d.id); State.save();
              AudioFX.buy(); openShop(); refreshHud();
            } else { toast(t().ui.notEnough); AudioFX.sad(); }
          };
          grid.appendChild(el);
        }
      } else if (shopTab === 'gems') {
        const el = document.createElement('button');
        el.className = 'shop-item';
        el.style.gridColumn = '1 / -1';
        el.innerHTML = `<span class="si-emoji">💎➡️🪙</span><span class="si-name">${t().ui.exchange}</span>`;
        el.onclick = () => {
          if (State.spendGems(1)) { State.earnCoins(100); AudioFX.coin(); refreshHud(); toast('🪙 +100'); }
          else { toast(t().ui.notEnoughGems); AudioFX.sad(); }
        };
        grid.appendChild(el);
      }
    });
  }

  function renderClothing(grid, c, rerender) {
    const s = State.get();
    const locked = c.lvl > s.level;
    const owned = s.owned.items.includes(c.id);
    const equipped = s.equipped[c.slot] === c.id;
    const el = document.createElement('button');
    el.className = 'shop-item' + (locked ? ' locked' : '') + (equipped ? ' equipped' : owned ? ' owned' : '');
    el.innerHTML = `<span class="si-emoji">${c.emoji}</span>
      <span class="si-price">${locked ? `🔒 Lv ${c.lvl}` : equipped ? `★ ${t().ui.equipped}` : owned ? `✓ ${t().ui.owned}` : `🪙 ${State.price(c.price)}`}</span>`;
    el.onclick = () => {
      if (locked) { toast(`🔒 ${t().ui.lockedLvl} ${c.lvl}`); return; }
      if (!owned) {
        if (!State.buyItem('items', c.id, c.price)) { toast(t().ui.notEnough); AudioFX.sad(); return; }
        AudioFX.buy();
      }
      // przełącz założenie
      s.equipped[c.slot] = equipped ? null : c.id;
      State.save();
      AudioFX.tap();
      rerender(); refreshHud();
    };
    grid.appendChild(el);
  }

  /* ---------- szafa ---------- */
  function openWardrobe() {
    openModal(`👕 ${t().ui.wardrobe}`, body => {
      for (const slot of DATA.clothSlots) {
        const h = document.createElement('div');
        h.style.cssText = 'font-weight:700;margin:10px 0 6px;font-size:.85rem;opacity:.85';
        h.textContent = t().slots[slot];
        body.appendChild(h);
        const grid = document.createElement('div');
        grid.className = 'item-grid';
        for (const c of DATA.clothes.filter(c => c.slot === slot)) renderClothing(grid, c, () => openWardrobe());
        body.appendChild(grid);
      }
    });
  }

  /* ---------- tapety ---------- */
  function openWallpapers() {
    openModal(`🖼️ ${t().ui.wallpaper}`, body => {
      const grid = document.createElement('div');
      grid.className = 'item-grid';
      const s = State.get();
      for (const w of DATA.wallpapers) {
        const owned = s.owned.wallpapers.includes(w.id);
        const active = s.wallpaperActive[currentRoom] === w.id;
        const el = document.createElement('button');
        el.className = 'shop-item' + (active ? ' equipped' : owned ? ' owned' : '');
        el.innerHTML = `<span class="si-swatch" style="background:linear-gradient(180deg,${w.c1},${w.c2})"></span>
          <span class="si-name">${t().wp[w.id]}</span>
          <span class="si-price">${active ? '★' : owned ? '✓' : `🪙 ${State.price(w.price)}`}</span>`;
        el.onclick = () => {
          if (!owned && !State.buyItem('wallpapers', w.id, w.price)) { toast(t().ui.notEnough); AudioFX.sad(); return; }
          s.wallpaperActive[currentRoom] = w.id;
          State.save();
          AudioFX.buy();
          $('#room-view').style.background = roomBg(currentRoom);
          openWallpapers(); refreshHud();
        };
        grid.appendChild(el);
      }
    });
  }

  /* ---------- dekoracje ogrodu ---------- */
  function openDecorations() {
    openModal(`🌸 ${t().ui.decor}`, body => {
      const grid = document.createElement('div');
      grid.className = 'item-grid';
      const s = State.get();
      for (const d of DATA.decorations) {
        const locked = d.lvl > s.level;
        const owned = s.owned.decorations.includes(d.id);
        const placed = s.gardenDecor.includes(d.id);
        const el = document.createElement('button');
        el.className = 'shop-item' + (locked ? ' locked' : '') + (placed ? ' equipped' : owned ? ' owned' : '');
        el.innerHTML = `<span class="si-emoji">${d.emoji}</span>
          <span class="si-price">${locked ? `🔒 Lv ${d.lvl}` : placed ? '★' : owned ? '✓' : `🪙 ${State.price(d.price)}`}</span>`;
        el.onclick = () => {
          if (locked) { toast(`🔒 ${t().ui.lockedLvl} ${d.lvl}`); return; }
          if (!owned) {
            if (!State.buyItem('decorations', d.id, d.price)) { toast(t().ui.notEnough); AudioFX.sad(); return; }
            AudioFX.buy();
          }
          if (placed) s.gardenDecor = s.gardenDecor.filter(x => x !== d.id);
          else s.gardenDecor.push(d.id);
          State.save();
          openDecorations();
          if (currentRoom === 'garden') showRoom('garden');
        };
        grid.appendChild(el);
      }
    });
  }

  /* ---------- mini-gry ---------- */
  function openMinigames() {
    openModal(`🎮 ${t().ui.games}`, body => {
      const grid = document.createElement('div');
      grid.className = 'mg-grid';
      const s = State.get();
      for (const g of DATA.minigames) {
        const hs = s.highScores[g.id];
        const best = hs ? Math.max(hs.easy, hs.med, hs.hard) : 0;
        const el = document.createElement('button');
        el.className = 'mg-card';
        el.innerHTML = `<span class="mg-emoji">${g.emoji}</span>
          <span class="mg-name">${t().mg[g.id]}</span>
          <span class="mg-best">🏆 ${t().ui.best}: ${best}${g.accel ? ' · 📱' : ''}</span>`;
        el.onclick = () => { AudioFX.tap(); openDifficulty(g.id); };
        grid.appendChild(el);
      }
      body.appendChild(grid);
    });
  }

  function openDifficulty(gameId) {
    openModal(t().mg[gameId], body => {
      const p = document.createElement('p');
      p.style.cssText = 'text-align:center;margin:8px 0;opacity:.85;font-size:.9rem';
      p.textContent = t().ui.chooseDiff;
      body.appendChild(p);
      const rowEl = document.createElement('div');
      rowEl.className = 'diff-row';
      const s = State.get();
      for (const d of ['easy', 'med', 'hard']) {
        const b = document.createElement('button');
        b.className = 'diff-btn';
        b.dataset.d = d;
        const hs = s.highScores[gameId];
        b.innerHTML = `${t().diff[d]}<br><small>🏆 ${hs ? hs[d] : 0}</small>`;
        b.onclick = () => { closeModal(); MiniGames.start(gameId, d); };
        rowEl.appendChild(b);
      }
      body.appendChild(rowEl);
    });
  }

  /* ---------- osiągnięcia ---------- */
  function openAchievements() {
    openModal(`🏆 ${t().ui.achievements}`, body => {
      const s = State.get();
      for (const a of DATA.achievements) {
        const done = !!s.achievements[a.id];
        const [title, sub] = t().ach[a.id];
        const rowEl = document.createElement('div');
        rowEl.className = 'list-row' + (done ? ' done' : '');
        rowEl.innerHTML = `<span class="lr-emoji">${done ? a.emoji : '🔒'}</span>
          <div class="lr-main"><div class="lr-title">${title}</div><div class="lr-sub">${sub}</div></div>
          <span>${done ? '✅' : `💎 ${a.gems}`}</span>`;
        body.appendChild(rowEl);
      }
    });
  }

  /* ---------- przyjaciele ---------- */
  function openFriends() {
    openModal(`🤝 ${t().ui.friends}`, body => {
      for (const f of DATA.friends) {
        const rowEl = document.createElement('div');
        rowEl.className = 'list-row';
        const cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        cv.style.cssText = 'width:48px;height:48px';
        const c = cv.getContext('2d');
        c.scale(2, 2);
        PouRenderer.drawPou(c, 24, 26, 40, { color: f.color, mood: 'happy', equipped: { hat: f.hat } });
        rowEl.appendChild(cv);
        const main = document.createElement('div');
        main.className = 'lr-main';
        main.innerHTML = `<div class="lr-title">${f.name}</div>`;
        rowEl.appendChild(main);
        const b = btn(t().ui.visit, () => {
          if (State.collectGift()) {
            toast(`🎁 ${t().ui.gift} ${f.name}: 🪙 +20`);
            AudioFX.coin();
          } else toast(t().ui.giftTaken);
          refreshHud();
        }, true);
        rowEl.appendChild(b);
        body.appendChild(rowEl);
      }
    });
  }

  /* ---------- ustawienia ---------- */
  function openSettings() {
    openModal(`⚙️ ${t().ui.settings}`, body => {
      const s = State.get();
      const mkToggle = (label, key, onFlip) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'list-row';
        rowEl.innerHTML = `<div class="lr-main"><div class="lr-title">${label}</div></div>`;
        const tg = document.createElement('button');
        tg.className = 'toggle' + (s.settings[key] ? ' on' : '');
        tg.onclick = () => {
          s.settings[key] = !s.settings[key];
          State.save();
          tg.classList.toggle('on');
          if (onFlip) onFlip(s.settings[key]);
        };
        rowEl.appendChild(tg);
        body.appendChild(rowEl);
      };
      mkToggle(`🔊 ${t().ui.sound}`, 'sound');
      mkToggle(`📳 ${t().ui.vibration}`, 'vibration', on => on && vibrate(60));
      mkToggle(`🔔 ${t().ui.notifyOpt}`, 'notify', on => {
        if (on && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      });

      const langRow = document.createElement('div');
      langRow.className = 'list-row';
      langRow.innerHTML = `<div class="lr-main"><div class="lr-title">🌐 ${t().ui.language}</div></div>`;
      const langBtn = btn(s.settings.lang.toUpperCase(), () => {
        s.settings.lang = s.settings.lang === 'pl' ? 'en' : 'pl';
        State.save();
        openSettings(); showRoom(currentRoom);
      });
      langRow.appendChild(langBtn);
      body.appendChild(langRow);

      const resetRow = document.createElement('div');
      resetRow.className = 'list-row';
      resetRow.innerHTML = `<div class="lr-main"><div class="lr-title">🗑️ ${t().ui.reset}</div></div>`;
      resetRow.appendChild(btn('⚠️', () => {
        if (confirm(t().ui.resetConfirm)) { State.reset(); location.reload(); }
      }));
      body.appendChild(resetRow);
    });
  }

  /* ---------- efekty wizualne ---------- */
  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    $('#toast-wrap').appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function flyFx(emoji, fromEl) {
    const fx = document.createElement('span');
    fx.className = 'fx';
    fx.textContent = emoji;
    const layer = $('#fx-layer');
    const lr = layer.getBoundingClientRect();
    const fr = fromEl.getBoundingClientRect();
    const pou = $('#pou-canvas').getBoundingClientRect();
    fx.style.left = `${fr.left + fr.width / 2 - lr.left}px`;
    fx.style.top = `${fr.top - lr.top}px`;
    fx.style.setProperty('--dx', `${(pou.left + pou.width / 2) - (fr.left + fr.width / 2)}px`);
    fx.style.setProperty('--dy', `${(pou.top + pou.height / 2) - fr.top}px`);
    layer.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }

  function bubblesFx(n) {
    const layer = $('#fx-layer');
    const pou = $('#pou-canvas').getBoundingClientRect();
    const lr = layer.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const fx = document.createElement('span');
      fx.className = 'fx bubble';
      fx.textContent = '🫧';
      fx.style.left = `${pou.left - lr.left + Math.random() * pou.width}px`;
      fx.style.top = `${pou.top - lr.top + Math.random() * pou.height * 0.7}px`;
      layer.appendChild(fx);
      setTimeout(() => fx.remove(), 1600);
    }
  }

  /* ---------- interakcje z Pou (głaskanie, szorowanie) ---------- */
  function bindPouCanvas() {
    const cv = $('#pou-canvas');
    cv.addEventListener('pointerdown', () => {
      if (State.get().sleeping) return;
      if (currentRoom !== 'bathroom') {
        State.pet();
        AudioFX.giggle(); vibrate(20);
        heartFx();
        refreshHud();
      }
      lastScrub = null;
    });
    cv.addEventListener('pointermove', e => {
      if (currentRoom !== 'bathroom' || State.get().sleeping) return;
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      if (lastScrub) {
        scrubDist += Math.hypot(e.clientX - lastScrub[0], e.clientY - lastScrub[1]);
        if (scrubDist > 60) {   // co 60 px pocierania +1 higieny
          scrubDist = 0;
          State.wash(1, 0);
          bubblesFx(1);
          if (Math.random() < 0.3) AudioFX.wash();
          refreshHud();
        }
      }
      lastScrub = [e.clientX, e.clientY];
    });
    cv.addEventListener('pointerup', () => { lastScrub = null; });
  }

  function heartFx() {
    const layer = $('#fx-layer');
    const pou = $('#pou-canvas').getBoundingClientRect();
    const lr = layer.getBoundingClientRect();
    const fx = document.createElement('span');
    fx.className = 'fx';
    fx.textContent = '❤️';
    fx.style.left = `${pou.left - lr.left + pou.width * (0.3 + Math.random() * 0.4)}px`;
    fx.style.top = `${pou.top - lr.top + 20}px`;
    layer.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }

  /* ---------- pierwsze uruchomienie: imię ---------- */
  function askNameIfNeeded() {
    const s = State.get();
    if (s.named) return;
    const name = prompt(t().ui.askName, 'Pou');
    if (name && name.trim()) s.name = name.trim().slice(0, 14);
    s.named = true;
    State.saveNow();
  }

  /* ---------- powiadomienia lokalne ---------- */
  let lastNotify = 0;
  function maybeNotify(stat) {
    const s = State.get();
    if (!s.settings.notify || document.visibilityState === 'visible') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (Date.now() - lastNotify < 30 * 60 * 1000) return;
    lastNotify = Date.now();
    const msgs = { hunger: '🍔', hygiene: '🧼', energy: '😴', fun: '🎈' };
    try { new Notification(`${s.name} ${msgs[stat]}`, { body: `${t().ui[stat]} < 25%!`, icon: 'icon.svg' }); } catch (e) { /* mobile wymaga SW */ }
  }

  function init() {
    $('#modal-close').onclick = closeModal;
    $('#modal-backdrop').addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closeModal(); });
    bindPouCanvas();

    EventBus.on('levelUp', ({ level, coins }) => {
      AudioFX.levelUp(); vibrate([60, 40, 60]);
      toast(`⭐ ${t().ui.levelUp} ${t().ui.level} ${level} · 🪙 +${coins} 💎 +1`);
      refreshHud();
    });
    EventBus.on('achievementUnlocked', a => {
      AudioFX.coin();
      toast(`🏆 ${t().ach[a.id][0]} · 💎 +${a.gems}`);
    });
    EventBus.on('statLow', stat => maybeNotify(stat));

    askNameIfNeeded();
    showRoom('living');
  }

  return { init, showRoom, refreshHud, toast, get room() { return currentRoom; } };
})();
