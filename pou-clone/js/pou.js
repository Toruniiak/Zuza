/* ===== Pou Clone — renderer postaci (czysta funkcja stanu) ===== */
'use strict';

const PouRenderer = (() => {
  let blinkT = 0, nextBlink = 2 + Math.random() * 3;
  let mouthOpenT = 0;     // animacja jedzenia
  let bobPhase = 0;

  /* uniwersalne rysowanie Pou — używane w pokoju, u przyjaciół i w mini-grach */
  function drawPou(ctx, cx, cy, size, opts = {}) {
    const {
      color = '#c9a24b', mood = 'happy', equipped = {},
      blink = false, mouthOpen = 0, bob = 0,
    } = opts;
    const r = size / 2;
    cy += bob;

    ctx.save();

    // cień
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.92, r * 0.72, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // ciało — "kropla" (trójkątno-owalny blob)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.bezierCurveTo(cx + r * 0.85, cy - r * 0.9, cx + r * 0.95, cy + r * 0.15, cx + r * 0.78, cy + r * 0.62);
    ctx.bezierCurveTo(cx + r * 0.55, cy + r * 0.95, cx - r * 0.55, cy + r * 0.95, cx - r * 0.78, cy + r * 0.62);
    ctx.bezierCurveTo(cx - r * 0.95, cy + r * 0.15, cx - r * 0.85, cy - r * 0.9, cx, cy - r);
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.2, cx, cy, r * 1.15);
    grad.addColorStop(0, lighten(color, 28));
    grad.addColorStop(1, darken(color, 18));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = darken(color, 30);
    ctx.lineWidth = Math.max(1.5, size * 0.012);
    ctx.stroke();

    // koszulka (pas na dole ciała)
    if (equipped.shirt) {
      ctx.font = `${r * 0.55}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DATA.clothes.find(c => c.id === equipped.shirt)?.emoji || '', cx, cy + r * 0.55);
    }

    // oczy
    const eyeY = cy - r * 0.28;
    const eyeDX = r * 0.3;
    const eyeR = r * 0.22;
    const closed = blink || mood === 'sleeping';
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeDX;
      if (closed) {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = Math.max(2, size * 0.018);
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeR, eyeR * 1.15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#2a2a2a';
        const pupilDrop = mood === 'sad' ? eyeR * 0.25 : 0;
        ctx.beginPath(); ctx.arc(ex, eyeY + eyeR * 0.15 + pupilDrop, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex - eyeR * 0.15, eyeY - eyeR * 0.1 + pupilDrop, eyeR * 0.14, 0, Math.PI * 2); ctx.fill();
      }
    }

    // okulary
    if (equipped.glasses) {
      ctx.font = `${r * 0.72}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(DATA.clothes.find(c => c.id === equipped.glasses)?.emoji || '', cx, eyeY + r * 0.02);
    }

    // usta wg nastroju
    const mouthY = cy + r * 0.18;
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = Math.max(2, size * 0.02);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (mouthOpen > 0) {
      ctx.fillStyle = '#7a3030';
      ctx.ellipse(cx, mouthY + r * 0.05, r * 0.2, r * 0.2 * mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (mood === 'happy') {
      ctx.arc(cx, mouthY - r * 0.08, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (mood === 'sad') {
      ctx.arc(cx, mouthY + r * 0.28, r * 0.3, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
    } else { // neutral / sleeping
      ctx.moveTo(cx - r * 0.2, mouthY);
      ctx.lineTo(cx + r * 0.2, mouthY);
      ctx.stroke();
    }

    // rumieńce gdy happy
    if (mood === 'happy' && !closed) {
      ctx.fillStyle = 'rgba(255,120,120,.35)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(cx + side * r * 0.55, cy + r * 0.02, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // czapka
    if (equipped.hat) {
      ctx.font = `${r * 0.8}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(DATA.clothes.find(c => c.id === equipped.hat)?.emoji || '', cx, cy - r * 1.02);
    }

    // buty
    if (equipped.shoes) {
      const shoe = DATA.clothes.find(c => c.id === equipped.shoes)?.emoji || '';
      ctx.font = `${r * 0.42}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(shoe, cx - r * 0.35, cy + r * 0.92);
      ctx.fillText(shoe, cx + r * 0.35, cy + r * 0.92);
    }

    ctx.restore();
  }

  /* animowany Pou na głównym canvasie pokoju */
  let canvas = null, ctx2d = null;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx2d = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 240 * dpr;
    canvas.height = 240 * dpr;
    ctx2d.scale(dpr, dpr);
  }

  function triggerEat() { mouthOpenT = 0.6; }

  function frame(dt) {
    if (!ctx2d) return;
    const s = State.get();
    blinkT += dt; bobPhase += dt;
    let blink = false;
    if (blinkT > nextBlink) {
      blink = true;
      if (blinkT > nextBlink + 0.15) { blinkT = 0; nextBlink = 2 + Math.random() * 4; }
    }
    if (mouthOpenT > 0) mouthOpenT = Math.max(0, mouthOpenT - dt);

    ctx2d.clearRect(0, 0, 240, 240);
    const mood = State.mood();
    const bob = Math.sin(bobPhase * (mood === 'happy' ? 2.2 : 1.2)) * 4;
    drawPou(ctx2d, 120, 130, 170, {
      color: s.color, mood, equipped: s.equipped,
      blink, mouthOpen: mouthOpenT > 0 ? Math.min(1, mouthOpenT * 3) : 0, bob,
    });
  }

  return { drawPou, init, frame, triggerEat };
})();

/* pomocnicze operacje na kolorach */
function lighten(hex, amt) { return shade(hex, amt); }
function darken(hex, amt) { return shade(hex, -amt); }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
