/* ===== Pou Clone — MiniGameFramework + 6 gier =====
   Każda gra to wtyczka: { init(api), update(dt), render(ctx), onPointer(type,x,y), usesTilt }
   Nagrody wypłaca framework (jeden punkt kontroli ekonomii). */
'use strict';

const MiniGames = (() => {
  const registry = {};
  const screen = () => document.getElementById('game-screen');
  const canvasEl = () => document.getElementById('game-canvas');

  let ctx, W, H, dpr;
  let current = null, gameId = null, diff = 'easy';
  let running = false, rafId = 0, lastT = 0;
  let score = 0, lives = -1;
  let tilt = 0;                    // -1..1 z akcelerometru
  let tiltActive = false;

  /* ---------- akcelerometr ---------- */
  function onOrient(e) {
    if (e.gamma === null) return;
    tilt = Math.max(-1, Math.min(1, e.gamma / 30));
    tiltActive = true;
  }
  async function enableTilt() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return;
      }
      window.addEventListener('deviceorientation', onOrient);
    } catch (e) { /* brak czujnika — sterowanie dotykiem */ }
  }

  /* ---------- API dla gier ---------- */
  const api = {
    get W() { return W; }, get H() { return H; },
    get diff() { return diff; },
    get tilt() { return tilt; },
    get tiltActive() { return tiltActive; },
    setScore(v) { score = v; document.getElementById('game-score').textContent = Math.floor(v); },
    addScore(v) { api.setScore(score + v); },
    get score() { return score; },
    setLives(v) {
      lives = v;
      document.getElementById('game-lives').textContent = v >= 0 ? '❤️'.repeat(Math.max(0, v)) : '';
    },
    get lives() { return lives; },
    loseLife() { api.setLives(lives - 1); vibrate(60); if (lives <= 0) api.end(); },
    end() { finish(); },
    drawPou(x, y, size, opts = {}) {
      const s = State.get();
      PouRenderer.drawPou(ctx, x, y, size, Object.assign({ color: s.color, mood: 'happy', equipped: s.equipped }, opts));
    },
    rnd: (a, b) => a + Math.random() * (b - a),
  };

  /* ---------- cykl życia ---------- */
  function resize() {
    const c = canvasEl();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function start(id, difficulty) {
    const t = I18N[State.get().settings.lang].ui;
    if (!State.canPlay()) { UI.toast(t.tooTired); return; }
    gameId = id; diff = difficulty;
    const def = DATA.minigames.find(m => m.id === id);
    resize();
    screen().classList.remove('hidden');
    api.setScore(0); api.setLives(-1);
    current = registry[id]();
    current.init(api);

    // ekran "dotknij, aby zacząć" — gest odblokowuje też akcelerometr (iOS)
    const msg = document.getElementById('game-msg');
    msg.innerHTML = `<h2>${I18N[State.get().settings.lang].mg[id]}</h2>
      <div class="gm-detail">${current.hint || ''}</div>
      <button class="action-btn primary" id="gm-start">${t.tapToStart}</button>`;
    msg.classList.remove('hidden');
    document.getElementById('gm-start').onclick = async () => {
      if (def.accel) await enableTilt();
      msg.classList.add('hidden');
      State.startGame();
      running = true;
      lastT = performance.now();
      rafId = requestAnimationFrame(loop);
    };
    render(); // pierwsza klatka pod komunikatem
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    current.update(dt);
    render();
    if (running) rafId = requestAnimationFrame(loop);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    current.render(ctx);
  }

  function finish() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    AudioFX.gameOver();
    const def = DATA.minigames.find(m => m.id === gameId);
    const res = State.finishGame(gameId, diff, Math.floor(score), def.divisor);
    const lang = State.get().settings.lang, t = I18N[lang].ui;
    const msg = document.getElementById('game-msg');
    msg.innerHTML = `<h2>${t.gameOver}</h2>
      <div class="gm-detail">
        ${t.score}: <b>${Math.floor(score)}</b> ${res.isRecord ? `<br>🏆 ${t.newRecord}` : ''}<br>
        🪙 +${res.coins} &nbsp; ⭐ +${res.xp} XP
      </div>
      <div class="diff-row">
        <button class="action-btn primary" id="gm-again">${t.playAgain}</button>
        <button class="action-btn" id="gm-back">${t.back}</button>
      </div>`;
    msg.classList.remove('hidden');
    document.getElementById('gm-again').onclick = () => start(gameId, diff);
    document.getElementById('gm-back').onclick = close;
    UI.refreshHud();
  }

  function close() {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('deviceorientation', onOrient);
    tiltActive = false;
    document.getElementById('game-msg').classList.add('hidden');
    screen().classList.add('hidden');
    UI.refreshHud();
  }

  /* ---------- wejście dotykowe ---------- */
  function bindInput() {
    const c = canvasEl();
    const pos = e => {
      const r = c.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return [p.clientX - r.left, p.clientY - r.top];
    };
    const handler = type => e => {
      e.preventDefault();
      if (!running || !current || !current.onPointer) return;
      const [x, y] = pos(e);
      current.onPointer(type, x, y);
    };
    c.addEventListener('pointerdown', handler('down'));
    c.addEventListener('pointermove', handler('move'));
    c.addEventListener('pointerup', handler('up'));
    document.getElementById('game-quit').onclick = () => { if (running) finish(); else close(); };
    window.addEventListener('resize', () => { if (screen().classList.contains('hidden')) return; resize(); });
  }

  /* ============================================================
     GRA 1: FOOD DROP — łap jedzenie, unikaj skarpet i bomb
     ============================================================ */
  registry.foodDrop = () => {
    const GOOD = ['🍎', '🍌', '🍓', '🍩', '🍕', '🍦'];
    const BAD = ['🧦', '💣'];
    const CFG = {
      easy: { speed: 140, spawn: 1.1, badPct: 0.15 },
      med:  { speed: 200, spawn: 0.85, badPct: 0.25 },
      hard: { speed: 270, spawn: 0.62, badPct: 0.35 },
    };
    let items, px, spawnT, cfg, speedMult, a;
    return {
      hint: I18N[State.get().settings.lang].ui.accelHint,
      init(API) {
        a = API; cfg = CFG[a.diff];
        items = []; spawnT = 0; speedMult = 1;
        px = a.W / 2;
        a.setLives(3);
      },
      update(dt) {
        if (a.tiltActive) px += a.tilt * 420 * dt;
        px = Math.max(45, Math.min(a.W - 45, px));
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = cfg.spawn;
          const bad = Math.random() < cfg.badPct;
          const golden = !bad && Math.random() < 0.05;
          items.push({
            x: a.rnd(30, a.W - 30), y: -30,
            e: bad ? BAD[(Math.random() * BAD.length) | 0] : GOOD[(Math.random() * GOOD.length) | 0],
            bad, golden,
          });
        }
        const catchY = a.H - 150;
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += cfg.speed * speedMult * dt;
          if (it.y > catchY - 30 && it.y < catchY + 50 && Math.abs(it.x - px) < 60) {
            items.splice(i, 1);
            if (it.bad) { AudioFX.bad(); a.loseLife(); }
            else {
              AudioFX.pop();
              a.addScore(it.golden ? 5 : 1);
              if (a.score % 10 === 0) speedMult *= 1.08;   // co 10 pkt szybciej
            }
          } else if (it.y > a.H + 40) {
            items.splice(i, 1);
          }
        }
      },
      render(c) {
        c.fillStyle = '#2b2153'; c.fillRect(0, 0, a.W, a.H);
        a.drawPou(px, a.H - 110, 110, { mouthOpen: 0.6 });
        c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const it of items) {
          if (it.golden) { c.save(); c.shadowColor = '#ffd75e'; c.shadowBlur = 16; }
          c.fillText(it.e, it.x, it.y);
          if (it.golden) c.restore();
        }
      },
      onPointer(type, x) { if (type !== 'up') px = x; },
    };
  };

  /* ============================================================
     GRA 2: SKY JUMP — skacz po platformach (doodle jump)
     ============================================================ */
  registry.skyJump = () => {
    const CFG = {
      easy: { gap: 70, crumble: 0 },
      med:  { gap: 85, crumble: 0.15 },
      hard: { gap: 100, crumble: 0.3 },
    };
    const GRAV = 1400, JUMP = -640;
    let a, cfg, px, py, vy, plats, camY, maxH, touchX;
    function addPlat(y) {
      const r = Math.random();
      plats.push({
        x: a.rnd(35, a.W - 35), y, w: 74,
        spring: r < 0.1, crumble: r >= 0.1 && r < 0.1 + cfg.crumble, gone: false,
      });
    }
    return {
      hint: I18N[State.get().settings.lang].ui.accelHint,
      init(API) {
        a = API; cfg = CFG[a.diff];
        px = a.W / 2; py = a.H - 140; vy = JUMP; camY = 0; maxH = 0; touchX = null;
        plats = [{ x: a.W / 2, y: a.H - 90, w: 90, spring: false, crumble: false, gone: false }];
        for (let y = a.H - 90 - cfg.gap; y > -a.H; y -= cfg.gap) addPlat(y);
      },
      update(dt) {
        if (a.tiltActive) px += a.tilt * 460 * dt;
        else if (touchX !== null) px += Math.sign(touchX - px) * Math.min(Math.abs(touchX - px), 380 * dt);
        if (px < -20) px = a.W + 20; if (px > a.W + 20) px = -20;   // zawijanie krawędzi

        vy += GRAV * dt;
        py += vy * dt;

        if (vy > 0) {
          for (const p of plats) {
            if (p.gone) continue;
            if (Math.abs(px - p.x) < p.w / 2 + 20 && py + 42 > p.y && py + 42 < p.y + 22 + vy * dt) {
              vy = p.spring ? JUMP * 1.45 : JUMP;
              AudioFX.jump();
              if (p.crumble) p.gone = true;
              break;
            }
          }
        }
        // kamera podąża w górę
        const target = a.H * 0.45;
        if (py - camY < target) camY = py - target;
        const h = Math.max(0, Math.floor(-camY / 10));
        if (h > maxH) { maxH = h; a.setScore(maxH); }
        // nowe platformy nad ekranem, sprzątanie pod
        while (plats[plats.length - 1].y > camY - 60) addPlat(plats[plats.length - 1].y - cfg.gap);
        plats = plats.filter(p => p.y < camY + a.H + 80);
        if (py - camY > a.H + 60) a.end();
      },
      render(c) {
        const g = c.createLinearGradient(0, 0, 0, a.H);
        g.addColorStop(0, '#1d3d63'); g.addColorStop(1, '#3d7bb5');
        c.fillStyle = g; c.fillRect(0, 0, a.W, a.H);
        for (const p of plats) {
          if (p.gone) continue;
          const y = p.y - camY;
          c.fillStyle = p.spring ? '#ffd75e' : p.crumble ? '#b0714f' : '#6fe06f';
          c.beginPath(); c.roundRect(p.x - p.w / 2, y, p.w, 14, 7); c.fill();
          if (p.spring) { c.font = '13px serif'; c.textAlign = 'center'; c.fillText('⬆️', p.x, y - 8); }
        }
        a.drawPou(px, py - camY, 84);
      },
      onPointer(type, x) { touchX = type === 'up' ? null : x; },
    };
  };

  /* ============================================================
     GRA 3: MEMORY — dobieranie par
     ============================================================ */
  registry.memory = () => {
    const CFG = { easy: [4, 3, 60], med: [4, 4, 90], hard: [5, 4, 120] };  // kolumny, wiersze, limit czasu
    const EMO = ['🍎', '🍔', '🍩', '🍕', '🍦', '🍓', '🥛', '🍬', '🌭', '🍰'];
    let a, cols, rows, limit, cards, open, lockT, time, mistakes, done;
    return {
      hint: I18N[State.get().settings.lang].ui.memHint,
      init(API) {
        a = API;
        [cols, rows, limit] = CFG[a.diff];
        const pairs = (cols * rows) / 2;
        const pool = [];
        for (let i = 0; i < pairs; i++) { pool.push(EMO[i % EMO.length], EMO[i % EMO.length]); }
        pool.sort(() => Math.random() - 0.5);
        cards = pool.map((e, i) => ({ e, flipped: false, matched: false, i }));
        open = []; lockT = 0; time = 0; mistakes = 0; done = 0;
      },
      update(dt) {
        time += dt;
        if (lockT > 0) {
          lockT -= dt;
          if (lockT <= 0) { for (const c of open) c.flipped = false; open = []; }
        }
      },
      layout() {
        const m = 12, topPad = 90;
        const cw = Math.min((a.W - m * (cols + 1)) / cols, 92);
        const ch = Math.min((a.H - topPad - 40 - m * (rows + 1)) / rows, 112);
        const ox = (a.W - (cw * cols + m * (cols - 1))) / 2;
        return { m, topPad, cw, ch, ox };
      },
      render(c) {
        c.fillStyle = '#241b47'; c.fillRect(0, 0, a.W, a.H);
        const { m, topPad, cw, ch, ox } = this.layout();
        c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff';
        c.fillText(`⏱️ ${Math.floor(time)} s`, a.W / 2, topPad - 22);
        cards.forEach((card, i) => {
          const col = i % cols, row = (i / cols) | 0;
          const x = ox + col * (cw + m), y = topPad + row * (ch + m);
          c.beginPath(); c.roundRect(x, y, cw, ch, 10);
          if (card.matched) { c.fillStyle = 'rgba(111,224,111,.18)'; c.fill(); return; }
          c.fillStyle = card.flipped ? '#e8dff8' : '#7b5cd6';
          c.fill();
          c.font = `${Math.min(cw, ch) * 0.55}px serif`; c.textBaseline = 'middle';
          c.fillStyle = '#241b47';
          c.fillText(card.flipped ? card.e : '❓', x + cw / 2, y + ch / 2 + 2);
        });
      },
      onPointer(type, x, y) {
        if (type !== 'down' || lockT > 0) return;
        const { m, topPad, cw, ch, ox } = this.layout();
        const col = Math.floor((x - ox) / (cw + m)), row = Math.floor((y - topPad) / (ch + m));
        if (col < 0 || col >= cols || row < 0 || row >= rows) return;
        const card = cards[row * cols + col];
        if (!card || card.matched || card.flipped) return;
        card.flipped = true;
        AudioFX.tap();
        open.push(card);
        if (open.length === 2) {
          if (open[0].e === open[1].e) {
            open.forEach(cd => cd.matched = true);
            open = []; done++;
            AudioFX.coin();
            if (done === (cols * rows) / 2) {
              // pary ×10 + bonus czasu ×2 − pomyłki ×3
              a.setScore(Math.max(5, done * 10 + Math.max(0, limit - Math.floor(time)) * 2 - mistakes * 3));
              a.end();
            }
          } else {
            mistakes++; lockT = 0.7;
          }
        }
      },
    };
  };

  /* ============================================================
     GRA 4: POU RUNNER — endless runner
     ============================================================ */
  registry.runner = () => {
    const CFG = { easy: { v: 260, dbl: true }, med: { v: 320, dbl: false }, hard: { v: 380, dbl: false } };
    const GRAV = 2600, JUMP = -950;
    let a, cfg, v, py, vy, onGround, jumps, obs, coins, spawnT, dist, groundY;
    return {
      hint: I18N[State.get().settings.lang].ui.tapHint,
      init(API) {
        a = API; cfg = CFG[a.diff]; v = cfg.v;
        groundY = a.H * 0.75;
        py = groundY; vy = 0; onGround = true; jumps = 0;
        obs = []; coins = []; spawnT = 1.2; dist = 0;
      },
      update(dt) {
        v = Math.min(v + 4 * dt, cfg.v * 2.2);
        dist += v * dt;
        a.setScore(Math.floor(dist / 10) + 0); // monety wliczane przez addScore
        vy += GRAV * dt; py += vy * dt;
        if (py >= groundY) { py = groundY; vy = 0; onGround = true; jumps = 0; }

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = a.rnd(0.9, 1.7) * (cfg.v / v);
          if (Math.random() < 0.3) {
            const high = Math.random() < 0.5;
            obs.push({ x: a.W + 40, y: groundY - (high ? 110 : 30), e: '🦅', fly: true });
          } else {
            obs.push({ x: a.W + 40, y: groundY - 6, e: '🌵', fly: false });
          }
          if (Math.random() < 0.5) {
            const n = 1 + ((Math.random() * 3) | 0);
            for (let i = 0; i < n; i++) coins.push({ x: a.W + 140 + i * 46, y: groundY - a.rnd(50, 170) });
          }
        }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i]; o.x -= v * dt;
          if (o.x < -60) { obs.splice(i, 1); continue; }
          if (Math.abs(o.x - a.W * 0.25) < 40 && Math.abs(o.y - (py - 30)) < 52) { a.end(); return; }
        }
        for (let i = coins.length - 1; i >= 0; i--) {
          const cn = coins[i]; cn.x -= v * dt;
          if (cn.x < -30) { coins.splice(i, 1); continue; }
          if (Math.abs(cn.x - a.W * 0.25) < 42 && Math.abs(cn.y - (py - 40)) < 55) {
            coins.splice(i, 1); a.addScore(1); AudioFX.coin();
          }
        }
      },
      render(c) {
        const g = c.createLinearGradient(0, 0, 0, a.H);
        g.addColorStop(0, '#5e2440'); g.addColorStop(1, '#c96a3b');
        c.fillStyle = g; c.fillRect(0, 0, a.W, a.H);
        c.fillStyle = '#3a2a20'; c.fillRect(0, groundY + 42, a.W, a.H);
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, groundY + 42); c.lineTo(a.W, groundY + 42); c.stroke();
        c.font = '38px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (const o of obs) c.fillText(o.e, o.x, o.y);
        c.font = '26px serif';
        for (const cn of coins) c.fillText('🪙', cn.x, cn.y);
        a.drawPou(a.W * 0.25, py - 40, 86, { bob: onGround ? Math.sin(dist / 24) * 3 : 0 });
      },
      onPointer(type) {
        if (type !== 'down') return;
        const maxJumps = cfg.dbl ? 2 : 1;
        if (onGround || jumps < maxJumps) {
          vy = JUMP; onGround = false; jumps++;
          AudioFX.jump(); vibrate(20);
        }
      },
    };
  };

  /* ============================================================
     GRA 5: BĄBELKI — przebijaj zanim znikną
     ============================================================ */
  registry.bubbles = () => {
    const CFG = { easy: { life: 2.6, spawn: 1.0 }, med: { life: 2.0, spawn: 0.75 }, hard: { life: 1.5, spawn: 0.55 } };
    let a, cfg, bubbles, spawnT;
    return {
      hint: I18N[State.get().settings.lang].ui.bubbleHint,
      init(API) {
        a = API; cfg = CFG[a.diff];
        bubbles = []; spawnT = 0.4;
        a.setLives(3);
      },
      update(dt) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = cfg.spawn;
          bubbles.push({ x: a.rnd(50, a.W - 50), y: a.rnd(130, a.H - 80), r: a.rnd(26, 44), t: cfg.life });
        }
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.t -= dt; b.y -= 12 * dt;
          if (b.t <= 0) { bubbles.splice(i, 1); AudioFX.bad(); a.loseLife(); }
        }
      },
      render(c) {
        const g = c.createLinearGradient(0, 0, 0, a.H);
        g.addColorStop(0, '#174534'); g.addColorStop(1, '#2f8f6b');
        c.fillStyle = g; c.fillRect(0, 0, a.W, a.H);
        for (const b of bubbles) {
          const alpha = Math.min(1, b.t / 0.6);
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          c.fillStyle = `rgba(170,220,255,${0.25 * alpha})`; c.fill();
          c.strokeStyle = `rgba(220,245,255,${0.8 * alpha})`; c.lineWidth = 2; c.stroke();
          c.beginPath(); c.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.18, 0, Math.PI * 2);
          c.fillStyle = `rgba(255,255,255,${0.7 * alpha})`; c.fill();
        }
      },
      onPointer(type, x, y) {
        if (type !== 'down') return;
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          if ((x - b.x) ** 2 + (y - b.y) ** 2 < (b.r + 14) ** 2) {
            bubbles.splice(i, 1);
            a.addScore(1); AudioFX.pop(); vibrate(15);
            return;
          }
        }
      },
    };
  };

  /* ============================================================
     GRA 6: POU SIMON — powtórz sekwencję
     ============================================================ */
  registry.simon = () => {
    const COLORS = ['#d95555', '#5b8dd9', '#6dbf67', '#e8c33f'];
    const CFG = { easy: 0.7, med: 0.5, hard: 0.36 };   // tempo odtwarzania
    let a, seq, inputIdx, phase, showIdx, showT, flash, speed;
    function nextRound() {
      seq.push((Math.random() * 4) | 0);
      inputIdx = 0; showIdx = 0; showT = 0.8; phase = 'show';
    }
    return {
      hint: I18N[State.get().settings.lang].ui.simonHint,
      init(API) {
        a = API; speed = CFG[a.diff];
        seq = []; flash = -1;
        nextRound();
      },
      update(dt) {
        showT -= dt;
        if (phase === 'show' && showT <= 0) {
          if (showIdx < seq.length) {
            flash = seq[showIdx];
            AudioFX.simon(flash);
            showIdx++; showT = speed;
            setTimeout(() => { flash = -1; }, speed * 600);
          } else {
            phase = 'input'; flash = -1;
          }
        }
      },
      pads() {
        const size = Math.min(a.W, a.H - 160) * 0.42;
        const cx = a.W / 2, cy = a.H / 2 + 20;
        return [0, 1, 2, 3].map(i => ({
          x: cx + (i % 2 === 0 ? -1 : 1) * (size / 2 + 8),
          y: cy + (i < 2 ? -1 : 1) * (size / 2 + 8),
          s: size, i,
        }));
      },
      render(c) {
        c.fillStyle = '#14102b'; c.fillRect(0, 0, a.W, a.H);
        c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff';
        c.fillText(phase === 'show' ? '👀 ...' : '🎯 !', a.W / 2, 110);
        for (const p of this.pads()) {
          c.beginPath(); c.roundRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, 18);
          c.fillStyle = flash === p.i ? '#ffffff' : COLORS[p.i];
          c.globalAlpha = flash === p.i ? 1 : 0.75;
          c.fill();
          c.globalAlpha = 1;
        }
        a.drawPou(a.W / 2, a.H / 2 + 20, 70);
      },
      onPointer(type, x, y) {
        if (type !== 'down' || phase !== 'input') return;
        for (const p of this.pads()) {
          if (Math.abs(x - p.x) < p.s / 2 && Math.abs(y - p.y) < p.s / 2) {
            flash = p.i;
            AudioFX.simon(p.i);
            setTimeout(() => { flash = -1; }, 200);
            if (p.i === seq[inputIdx]) {
              inputIdx++;
              if (inputIdx === seq.length) {
                a.setScore(seq.length * 10);
                setTimeout(nextRound, 700);
                phase = 'wait';
              }
            } else {
              a.end();
            }
            return;
          }
        }
      },
    };
  };

  return { start, close, bindInput, registry };
})();
