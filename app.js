/* =====================================================================
   EDUKACYJNA WYSPA — core systems
   ===================================================================== */

/* ---------- AUDIO ENGINE (Web Audio, offline, no external files) ----------
   Generuje ciepłe, przyjazne melodyjki i efekty dźwiękowe proceduralnie.
   8 nastrojów muzycznych (pentatonika = zawsze brzmi przyjemnie). */
const Audio_ = {
  ctx:null, musicGain:null, sfxGain:null, on:true, vol:0.55,
  loopTimer:null, step:0, mood:'map', started:false,
  // pentatoniczne skale (Hz) — ciepłe, bezpieczne dla ucha
  moods:{
    loading:{ scale:[392.0,440.0,523.25,587.33,659.25], tempo:520, wave:'sine' },
    map:    { scale:[261.63,293.66,329.63,392.0,440.0], tempo:480, wave:'triangle' },
    z1:     { scale:[349.23,392.0,440.0,523.25,587.33], tempo:440, wave:'sine' },
    z2:     { scale:[293.66,349.23,392.0,440.0,523.25], tempo:560, wave:'triangle' },
    z3:     { scale:[329.63,392.0,493.88,523.25,659.25], tempo:420, wave:'sine' },
    z4:     { scale:[261.63,329.63,392.0,440.0,523.25], tempo:380, wave:'triangle' },
    z5:     { scale:[293.66,329.63,440.0,493.88,587.33], tempo:500, wave:'sine' },
    z6:     { scale:[349.23,440.0,523.25,587.33,698.46], tempo:540, wave:'triangle' }
  },
  init(){
    if(this.ctx) return;
    try{
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.applyVol();
    }catch(e){ this.ctx=null; }
  },
  applyVol(){
    if(!this.ctx) return;
    this.musicGain.gain.value = this.on ? this.vol*0.18 : 0;  // muzyka cicho w tle
    this.sfxGain.gain.value   = this.on ? Math.max(0.25,this.vol*0.6) : 0;
  },
  note(freq,dur,when,gainNode,wave='sine',peak=0.5){
    if(!this.ctx) return;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=wave; o.frequency.value=freq;
    o.connect(g); g.connect(gainNode);
    const t=when||this.ctx.currentTime;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(peak,t+0.04);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur+0.05);
  },
  startMusic(mood){
    this.init();
    if(!this.ctx) return;
    if(mood) this.mood=mood;
    if(this.ctx.state==='suspended') this.ctx.resume();
    clearInterval(this.loopTimer);
    this.step=0;
    const play=()=>{
      if(!this.on||!this.ctx) return;
      const m=this.moods[this.mood]||this.moods.map;
      const sc=m.scale;
      const idx=this.step%(sc.length+2);
      // prosta przyjemna melodia: chód w górę i w dół
      let f;
      if(idx<sc.length) f=sc[idx];
      else f=sc[sc.length-1-(idx-sc.length)] ;
      this.note(f,0.5,0,this.musicGain,m.wave,0.5);
      // co 4 nuty dodaj cichy bas
      if(this.step%4===0) this.note(sc[0]/2,0.8,0,this.musicGain,'sine',0.35);
      this.step++;
    };
    const m=this.moods[this.mood]||this.moods.map;
    play();
    this.loopTimer=setInterval(play,m.tempo);
  },
  switchMood(mood){ if(this.mood!==mood){ this.startMusic(mood);} },
  stopMusic(){ clearInterval(this.loopTimer); },
  // ---- efekty dźwiękowe ----
  sfx(type){
    this.init(); if(!this.ctx||!this.on) return;
    if(this.ctx.state==='suspended') this.ctx.resume();
    const t=this.ctx.currentTime, g=this.sfxGain;
    switch(type){
      case 'click': this.note(660,0.08,t,g,'triangle',0.4); break;
      case 'success': [523.25,659.25,783.99].forEach((f,i)=>this.note(f,0.22,t+i*0.09,g,'sine',0.5)); break;
      case 'levelup': [392,523.25,659.25,783.99,1046.5].forEach((f,i)=>this.note(f,0.28,t+i*0.1,g,'triangle',0.5)); break;
      case 'fail': this.note(330,0.18,t,g,'sine',0.35); this.note(247,0.25,t+0.12,g,'sine',0.3); break;
      case 'confetti': for(let i=0;i<8;i++) this.note(700+Math.random()*900,0.16,t+i*0.04,g,'sine',0.3); break;
      case 'dress': this.note(880,0.1,t,g,'triangle',0.4); this.note(1175,0.12,t+0.06,g,'sine',0.35); break;
      case 'draw': this.note(520+Math.random()*200,0.05,t,g,'sine',0.18); break;
      case 'pop': this.note(900,0.06,t,g,'triangle',0.4); this.note(500,0.08,t+0.03,g,'sine',0.3); break;
      case 'count': this.note(440+(window._countPitch||0)*40,0.14,t,g,'triangle',0.45); break;
    }
  }
};
function toggleMusic(){
  Audio_.on=!Audio_.on; Audio_.applyVol();
  if(Audio_.on){ Audio_.startMusic(); } else { Audio_.stopMusic(); }
  const icon=Audio_.on?'🎵':'🔇';
  document.getElementById('music-toggle').textContent=icon;
  const pp=document.getElementById('pp-music'); if(pp) pp.textContent=Audio_.on?'WŁ':'WYŁ';
  saveAudioPrefs();
}
function setVolume(v){ Audio_.vol=v/100; Audio_.applyVol(); saveAudioPrefs(); }
function saveAudioPrefs(){ try{ localStorage.setItem('edwyspa_audio',JSON.stringify({on:Audio_.on,vol:Audio_.vol})); }catch(e){} }
function loadAudioPrefs(){
  try{ const a=JSON.parse(localStorage.getItem('edwyspa_audio')); if(a){ Audio_.on=a.on!==false; Audio_.vol=a.vol??0.55; } }catch(e){}
  const vs=document.getElementById('vol-slider'); if(vs) vs.value=Math.round(Audio_.vol*100);
  document.getElementById('music-toggle').textContent=Audio_.on?'🎵':'🔇';
}

/* ---------- PROGRESS / STARS (localStorage) ---------- */
let PROGRESS = { stars:{}, level:1, totalStars:0, stickers:[], daily:null };
const ALL_GAMES = ['z1a','z1b','z1c','z1d','z2','z3a','z3b','z3c','z4a','z4b','z4c',
                   'z5a','z5b','z5c','z5d','z6a','z6b','z6c','z6d','cbn','shadow','sort','beads',
                   'z7a','z7b','z7c','z8a','z8b','z9a','z9b','z9c','z10a','z10b','z11a','z11b'];
/* wymagania odblokowania (gwiazdki potrzebne łącznie) */
const UNLOCKS = { z1d:3, z3c:4, z5:6, z6:9, cbn:5, shadow:5, sort:7, beads:4 };

function loadProgress(){
  try{ const p=JSON.parse(localStorage.getItem('edwyspa_progress')); if(p) PROGRESS=Object.assign(PROGRESS,p); }catch(e){}
  recomputeTotals();
}
function saveProgress(){ try{ localStorage.setItem('edwyspa_progress',JSON.stringify(PROGRESS)); }catch(e){} }
function recomputeTotals(){
  let t=0; for(const k in PROGRESS.stars) t+=PROGRESS.stars[k];
  PROGRESS.totalStars=t;
  PROGRESS.level=Math.min(20, 1+Math.floor(t/3));
}
function getStars(id){ return PROGRESS.stars[id]||0; }
function setStars(id,n){
  n=Math.max(0,Math.min(3,n));
  if(n>(PROGRESS.stars[id]||0)){ PROGRESS.stars[id]=n; recomputeTotals(); checkAchievements(); saveProgress(); }
}
function isUnlocked(id){ const req=UNLOCKS[id]; return !req || PROGRESS.totalStars>=req; }
function starStr(n){ return '⭐'.repeat(n)+'☆'.repeat(3-n); }

/* ---------- ACHIEVEMENTS / STICKERS ---------- */
const ACHIEVEMENTS=[
  {id:'first',emoji:'🌟',name:'Pierwsza gwiazdka',test:p=>p.totalStars>=1},
  {id:'stars10',emoji:'✨',name:'10 gwiazdek',test:p=>p.totalStars>=10},
  {id:'stars25',emoji:'💫',name:'25 gwiazdek',test:p=>p.totalStars>=25},
  {id:'stars50',emoji:'🌠',name:'50 gwiazdek',test:p=>p.totalStars>=50},
  {id:'reader',emoji:'📖',name:'Mistrz liter',test:p=>['z1a','z1b','z1c','z1d'].every(g=>(p.stars[g]||0)>=2)},
  {id:'writer',emoji:'✏️',name:'Mały pisarz',test:p=>(p.stars['z2']||0)>=3},
  {id:'mathwiz',emoji:'🧮',name:'Geniusz liczb',test:p=>['z3a','z3b','z3c'].every(g=>(p.stars[g]||0)>=2)},
  {id:'gamer',emoji:'🎮',name:'Gracz',test:p=>['z4a','z4b','z4c'].every(g=>(p.stars[g]||0)>=1)},
  {id:'thinker',emoji:'🧠',name:'Bystrzak',test:p=>['z5a','z5b','z5c','z5d'].every(g=>(p.stars[g]||0)>=1)},
  {id:'stylist',emoji:'👗',name:'Stylista',test:p=>(p.stars['z6a']||0)>=1},
  {id:'caretaker',emoji:'🐾',name:'Opiekun',test:p=>(p.stars['z6b']||0)>=2},
  {id:'chef',emoji:'🍳',name:'Kucharz',test:p=>(p.stars['z6c']||0)>=2},
  {id:'level10',emoji:'🏆',name:'Poziom 10',test:p=>p.level>=10},
  {id:'level20',emoji:'👑',name:'Poziom 20',test:p=>p.level>=20},
  {id:'daily',emoji:'🎯',name:'Wyzwanie dnia',test:p=>p.daily&&p.daily.done}
];
function checkAchievements(){
  let newOne=null;
  ACHIEVEMENTS.forEach(a=>{
    if(a.test(PROGRESS) && !PROGRESS.stickers.includes(a.id)){
      PROGRESS.stickers.push(a.id); newOne=a;
    }
  });
  if(newOne){ saveProgress(); setTimeout(()=>{ Audio_.sfx('levelup'); showMascot('🏅'); },600); }
}
function renderAchievements(){
  const grid=document.getElementById('ach-grid'); grid.innerHTML='';
  const earned=PROGRESS.stickers.length;
  document.getElementById('ach-summary').textContent=`Zdobyto ${earned} z ${ACHIEVEMENTS.length} naklejek • ⭐ ${PROGRESS.totalStars} • Poziom ${PROGRESS.level}`;
  ACHIEVEMENTS.forEach(a=>{
    const got=PROGRESS.stickers.includes(a.id);
    const el=document.createElement('div');
    el.className='ach-item '+(got?'earned':'locked');
    el.innerHTML=`<div class="ach-emoji">${got?a.emoji:'❔'}</div><div class="ach-name">${got?a.name:'???'}</div>`;
    grid.appendChild(el);
  });
}

/* ---------- DAILY CHALLENGE ---------- */
const GAME_TITLES={z1a:'Klawiatura',z1b:'Układanie słów',z1c:'Sylaby',z1d:'Dopasuj słowo',z2:'Pisanie',
  z3a:'Diamenty',z3b:'Działania',z3c:'Balony',z4a:'Memory',z4b:'Kółko i krzyżyk',z4c:'Chińczyk',
  z5a:'Wzory',z5b:'Różnice',z5c:'Puzzle',z5d:'Labirynt',z6a:'Ubieranki',z6b:'Opieka',z6c:'Gotowanie',
  z6d:'Salon',cbn:'Maluj po numerach',shadow:'Cienie',sort:'Sortowanie',beads:'Koraliki',
  z7a:'Kliknij kolor',z7b:'Sortuj kolory',z7c:'Mieszanie kolorów',z8a:'Poznaj kształty',z8b:'Dopasuj kształt',
  z9a:'Głosy zwierząt',z9b:'Gdzie mieszka',z9c:'Czym się żywi',z10a:'Pory dnia',z10b:'Która godzina',
  z11a:'Pianino',z11b:'Zapamiętaj melodię'};
function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function setupDaily(){
  const today=todayStr();
  if(!PROGRESS.daily || PROGRESS.daily.date!==today){
    // deterministyczny wybór gry z daty
    const seed=today.split('-').reduce((a,b)=>a+parseInt(b),0);
    const pool=ALL_GAMES.filter(isUnlocked);
    const gid=pool[seed%pool.length];
    PROGRESS.daily={date:today,game:gid,done:false}; saveProgress();
  }
  updateDailyBanner();
}
function updateDailyBanner(){
  const b=document.getElementById('daily-banner');
  const t=document.getElementById('daily-text');
  if(PROGRESS.daily.done){ b.classList.add('done'); t.textContent='Wyzwanie dnia ukończone! ⭐'; }
  else { b.classList.remove('done'); t.textContent='Wyzwanie dnia: '+(GAME_TITLES[PROGRESS.daily.game]||'gra'); }
}
let dailyActive=false;
function startDaily(){ Audio_.sfx('click'); dailyActive=true; openGame(PROGRESS.daily.game); }
function completeDaily(gid){
  if(dailyActive && PROGRESS.daily && PROGRESS.daily.game===gid && !PROGRESS.daily.done){
    PROGRESS.daily.done=true; checkAchievements(); saveProgress(); updateDailyBanner();
  }
  dailyActive=false;
}

/* ---------- NAVIGATION ---------- */
const APP={ history:[] };
const MOOD_BY_SCREEN={ 's-loading':'loading','s-map':'map','s-ach':'map',
  's-z1':'z1','s-z1a':'z1','s-z1b':'z1','s-z1c':'z1','s-z1d':'z1',
  's-z2':'z2','s-z3':'z3','s-z3a':'z3','s-z3b':'z3','s-z3c':'z3',
  's-z4':'z4','s-z4a':'z4','s-z4b':'z4','s-z4c':'z4',
  's-z5':'z5','s-z5a':'z5','s-z5b':'z5','s-z5c':'z5','s-z5d':'z5',
  's-z6':'z6','s-z6a':'z6','s-z6b':'z6','s-z6c':'z6','s-z6d':'z6',
  's-cbn':'z5','s-shadow':'z5','s-sort':'z5','s-beads':'z6',
  's-z7':'z6','s-z7a':'z6','s-z7b':'z6','s-z7c':'z6',
  's-z8':'z3','s-z8a':'z3','s-z8b':'z3',
  's-z9':'z1','s-z9a':'z1','s-z9b':'z1','s-z9c':'z1',
  's-z10':'z5','s-z10a':'z5','s-z10b':'z5',
  's-z11':'z6','s-z11a':'z6','s-z11b':'z6',
  's-board':'z2','s-cert':'map','s-onboard':'loading' };
function goToScreen(id){
  document.querySelectorAll('.screen.active').forEach(s=>s.classList.remove('active'));
  stopBackgroundTimers(id);
  const sc=document.getElementById(id);
  if(sc){ sc.classList.add('active'); if(APP.history[APP.history.length-1]!==id) APP.history.push(id); }
  hideHint();
  const mood=MOOD_BY_SCREEN[id]; if(mood) Audio_.switchMood(mood);
  if(id==='s-z2' && drawCanvas && APP.z2 && APP.z2.activeChar){
    requestAnimationFrame(()=>{ const r=drawCanvas.getBoundingClientRect(); if(r.width) canvasScale=drawCanvas.width/r.width; });
  }
}
function goBack(){
  Audio_.sfx('click'); hideHint();
  APP.history.pop();
  const prev=APP.history[APP.history.length-1]||'s-map';
  document.querySelectorAll('.screen.active').forEach(s=>s.classList.remove('active'));
  document.getElementById(prev)?.classList.add('active');
  const mood=MOOD_BY_SCREEN[prev]; if(mood) Audio_.switchMood(mood);
  if(prev==='s-map'){ renderPortals(); }
}
/* otwiera grę po id (np. z wyzwania dnia) — przechodzi przez właściwą strefę */
function openGame(gid){
  const map={z1a:['s-z1','initKeyboard'],z1b:['s-z1','initWordBuild'],z1c:['s-z1','initSyllables'],z1d:['s-z1','initMatch'],
    z2:[null,'initDrawing'],z3a:['s-z3','initDiamonds'],z3b:['s-z3','initMath'],z3c:['s-z3','initBalloons'],
    z4a:['s-z4','initMemory'],z4b:['s-z4','initTTT'],z4c:['s-z4','initChinczyk'],
    z5a:['s-z5','initSequence'],z5b:['s-z5','initDifference'],z5c:['s-z5','initPuzzle'],z5d:['s-z5','initMaze'],
    z6a:['s-z6','initDressup'],z6b:['s-z6','initPet'],z6c:['s-z6','initCooking'],z6d:['s-z6','initSalon'],
    cbn:['s-z5','initCBN'],shadow:['s-z5','initShadow'],sort:['s-z5','initSort'],beads:['s-z6','initBeads'],
    z7a:['s-z7','initColorClick'],z7b:['s-z7','initColorSort'],z7c:['s-z7','initColorMix'],
    z8a:['s-z8','initShapeLearn'],z8b:['s-z8','initShapeMatch'],
    z9a:['s-z9','initAnimalSounds'],z9b:['s-z9','initAnimalHome'],z9c:['s-z9','initAnimalFood'],
    z10a:['s-z10','initTimeOfDay'],z10b:['s-z10','initClock'],
    z11a:['s-z11','initPiano'],z11b:['s-z11','initSimon'] };
  const scr='s-'+gid;
  const [hub,initFn]=map[gid]||[null,null];
  if(hub) goToScreen(hub);
  goToScreen(scr);
  if(initFn && window[initFn]) window[initFn]();
}

/* ---------- SPEECH ---------- */
let speechReady=false;
function speak(text,rate=0.85,pitch=1.1){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='pl-PL'; u.rate=rate; u.pitch=pitch;
  window.speechSynthesis.speak(u);
}

/* ---------- TUTORIALS + HINTS ---------- */
const TUTORIALS={
  z1a:'Witaj! To klawiatura liter. Dotknij dowolnej litery, a usłyszysz, jak ona brzmi. Spróbuj!',
  z1b:'Tutaj układamy słowa. Popatrz na obrazek, a potem przeciągaj literki na puste miejsca. Zaczynamy!',
  z1c:'To są sylaby. Klikaj je po kolei, żeby ułożyć całe słowo. Słuchaj uważnie!',
  z1d:'Popatrz na obrazek i wybierz napis, który do niego pasuje. Dasz radę!',
  z2:'Tutaj uczymy się pisać. Wybierz literę, a potem rysuj palcem po kropkach. Powodzenia!',
  z3a:'Policzmy diamenty! Dotykaj każdy diament po kolei, a potem wybierz, ile ich było.',
  z3b:'To są zadania z liczbami. Policz obrazki i wybierz dobrą odpowiedź. Spróbuj!',
  z3c:'Lecą balony z liczbami! Dotknij balona z właściwym wynikiem, zanim odleci.',
  z4a:'To gra Memory. Odkrywaj karty i szukaj takich samych par. Zapamiętuj, gdzie są!',
  z4b:'Zagrajmy w kółko i krzyżyk! Dotknij pustego pola, żeby postawić swój znak.',
  z4c:'To Chińczyk. Rzuć kostką, odpowiedz na pytanie i idź do przodu, aż dojdziesz do mety!',
  z5a:'Popatrz na wzór. Jaki obrazek powinien być następny? Wybierz właściwy!',
  z5b:'Popatrz uważnie. Dotknij to, co jest inne niż reszta. Bądź spostrzegawczy!',
  z5c:'Ułóż puzzle! Przeciągaj części na pasujące miejsca.',
  z5d:'Pomóż Stichowi dojść do mety! Przesuwaj palcem po ścieżce do pucharu.',
  z6a:'Ubierzmy bohatera! Dotykaj ubrań, kapeluszy i butów, żeby go przystroić.',
  z6b:'Zaopiekuj się zwierzakiem. Karm go, myj, baw się i pozwól mu spać!',
  z6c:'Zróbmy coś pysznego! Dotykaj składników i układaj je na talerzu.',
  z6d:'Pomalujmy paznokcie! Wybierz kolor i dotknij każdego paznokcia.',
  cbn:'Maluj po numerach! Wybierz kolor i dotknij pól z tą samą cyfrą.',
  shadow:'Popatrz na czarny cień. Który obrazek do niego pasuje? Wybierz go!',
  sort:'Posortuj przedmioty. Przeciągnij każdy do właściwego pojemnika.',
  beads:'Zrób naszyjnik! Dotykaj koralików, żeby stworzyć swój własny wzór.'
};
function playTutorial(zoneId,gameId){
  const txt=TUTORIALS[gameId]||'Baw się dobrze i ucz się przez zabawę!';
  speak(txt,0.74,1.22);
  showToast('💡 '+txt);
}
let hintTimer=null;
function showToast(msg,ms=4200){
  const t=document.getElementById('hint-toast');
  t.textContent=msg; t.style.display='block';
  clearTimeout(hintTimer); hintTimer=setTimeout(()=>t.style.display='none',ms);
}
/* wizualna wskazówka — "ręka" + pierścień na elemencie */
function pointAt(selector,text){
  const el=typeof selector==='string'?document.querySelector(selector):selector;
  if(!el) return;
  const r=el.getBoundingClientRect();
  const layer=document.getElementById('hint-layer');
  layer.innerHTML='';
  layer.style.display='block';
  const ring=document.createElement('div'); ring.className='hint-ring';
  ring.style.left=(r.left+r.width/2)+'px'; ring.style.top=(r.top+r.height/2)+'px';
  const hand=document.createElement('div'); hand.className='hint-hand'; hand.textContent='👆';
  hand.style.left=(r.left+r.width/2)+'px'; hand.style.top=(r.top+r.height/2+14)+'px';
  layer.appendChild(ring); layer.appendChild(hand);
  if(text) showToast('💡 '+text);
  setTimeout(hideHint,3600);
}
function hideHint(){ const l=document.getElementById('hint-layer'); if(l){ l.style.display='none'; l.innerHTML=''; } }

/* ---------- STARS / CELEBRATION ---------- */
let _countPitch=0;
function confetti(){
  Audio_.sfx('confetti');
  const colors=['#f4a61a','#e8498a','#3dd5f3','#4caf50','#fff','#ffeb3b','#b39ddb','#ff8a65'];
  const shapes=['2px','50%','0'];
  for(let i=0;i<80;i++){
    const p=document.createElement('div'); p.className='confetti-piece';
    const s=6+Math.random()*10;
    p.style.cssText=`left:${Math.random()*100}%;background:${colors[i%colors.length]};top:-20px;animation-delay:${Math.random()*0.9}s;animation-duration:${1.4+Math.random()*0.8}s;width:${s}px;height:${s}px;border-radius:${shapes[i%3]};opacity:.9`;
    document.body.appendChild(p); setTimeout(()=>p.remove(),2400);
  }
}
function showMascot(emoji){
  const m=document.getElementById('mascot-pop');
  m.textContent=emoji||(Math.random()>0.5?'👽':'🧱');
  m.classList.remove('show'); void m.offsetWidth; m.classList.add('show');
  setTimeout(()=>m.classList.remove('show'),1400);
}
/* pula wariantywnych pochwał — nie powtarzamy w kółko "Brawo" */
const PRAISES=['Brawo!','Super!','Wspaniale!','Doskonale!','Jesteś gwiazdą!','Świetnie!','Genialnie!','Ekstra!','Cudownie!','Mistrzostwo!'];
function randomPraise(){ return PRAISES[Math.floor(Math.random()*PRAISES.length)]; }
/* celebrate(msg,sub,stars,gameId) — przyznaje gwiazdki i zapisuje postęp */
function celebrate(msg='Brawo! 🎉',sub='Świetna robota!',stars=0,gameId=null){
  confetti();
  const before=PROGRESS.level;
  if(gameId){ setStars(gameId,stars); completeDaily(gameId); }
  const leveledUp=PROGRESS.level>before;
  Audio_.sfx(leveledUp?'levelup':'success');
  const who=PROGRESS.childName?(PROGRESS.childName+', '):'';
  speak(who+randomPraise()+' '+sub,0.85,1.18);
  showMascot();
  document.querySelectorAll('.celebrate').forEach(e=>e.remove());
  const el=document.createElement('div'); el.className='celebrate';
  el.innerHTML=`<div class="celebrate-content">
    <div class="celebrate-emoji dancing">🌟</div>
    <div class="celebrate-text">${msg}</div>
    ${stars?`<div class="celebrate-stars">${starStr(stars)}</div>`:''}
    <div class="celebrate-sub">${sub}</div>
    ${leveledUp?`<div style="margin-top:8px;color:var(--gold);font-weight:800">🏆 Poziom ${PROGRESS.level}!</div>`:''}
    <div style="font-size:2.4rem;margin:8px 0">👽🧱💖</div>
    <button class="big-btn" style="margin-top:10px" onclick="this.closest('.celebrate').remove();refreshHUD()">Dalej! →</button>
  </div>`;
  document.body.appendChild(el);
  setTimeout(()=>{ if(el.parentNode){ el.remove(); refreshHUD(); } },6000);
  refreshHUD();
}
function refreshHUD(){
  document.getElementById('hud-stars').textContent=PROGRESS.totalStars;
  document.getElementById('hud-level').textContent=PROGRESS.level;
  const pct=((PROGRESS.totalStars%3)/3)*100;
  document.getElementById('hud-levelbar').style.width=(PROGRESS.level>=20?100:pct)+'%';
}

/* ---------- MAP PORTALS ---------- */
const ZONES=[
  {id:'z1',scr:'s-z1',icon:'📖',name:'LITERY',cls:'p1',games:['z1a','z1b','z1c','z1d']},
  {id:'z2',scr:'s-z2',icon:'✏️',name:'PISANIE',cls:'p2',games:['z2'],direct:'initDrawing'},
  {id:'z3',scr:'s-z3',icon:'💎',name:'MATEMATYKA',cls:'p3',games:['z3a','z3b','z3c']},
  {id:'z4',scr:'s-z4',icon:'🎮',name:'GRY',cls:'p4',games:['z4a','z4b','z4c']},
  {id:'z5',scr:'s-z5',icon:'🧠',name:'LOGIKA',cls:'p5',games:['z5a','z5b','z5c','z5d','cbn','shadow','sort']},
  {id:'z6',scr:'s-z6',icon:'👗',name:'UBIERANKI',cls:'p6',games:['z6a','z6b','z6c','z6d','beads']},
  {id:'z7',scr:'s-z7',icon:'🎨',name:'KOLORY',cls:'p7',games:['z7a','z7b','z7c']},
  {id:'z8',scr:'s-z8',icon:'🔷',name:'KSZTAŁTY',cls:'p8',games:['z8a','z8b']},
  {id:'z9',scr:'s-z9',icon:'🦁',name:'ZWIERZĘTA',cls:'p9',games:['z9a','z9b','z9c']},
  {id:'z10',scr:'s-z10',icon:'🕐',name:'CZAS',cls:'p10',games:['z10a','z10b']},
  {id:'z11',scr:'s-z11',icon:'🎹',name:'MUZYKA',cls:'p11',games:['z11a','z11b']}
];
function zoneStars(z){ return z.games.reduce((a,g)=>a+getStars(g),0); }
function zoneMax(z){ return z.games.length*3; }
function renderPortals(){
  refreshHUD();
  const grid=document.getElementById('portal-grid'); grid.innerHTML='';
  ZONES.forEach(z=>{
    const locked=!isUnlocked(z.id);
    const el=document.createElement('div');
    el.className='portal '+z.cls+(locked?' locked':'');
    el.innerHTML=`${locked?'<div class="lock-badge">🔒</div>':''}
      <div class="p-icon">${z.icon}</div>${z.name}
      <div class="p-stars">⭐ ${zoneStars(z)}/${zoneMax(z)}</div>`;
    el.onclick=()=>{
      Audio_.sfx('click');
      if(locked){ const req=UNLOCKS[z.id]; speak('Zdobądź '+req+' gwiazdek, żeby odblokować!',0.85); showToast('🔒 Potrzebujesz '+req+' gwiazdek!'); return; }
      if(z.direct){ recordZoneVisit(z.id); goToScreen(z.scr); window[z.direct](); } else { recordZoneVisit(z.id); goToScreen(z.scr); renderHub(z.id); }
    };
    grid.appendChild(el);
  });
}

/* ---------- HUB CARDS ---------- */
const HUB_DATA={
  z1:[{g:'z1a',i:'🔤',t:'Klawiatura Sticha',d:'Ucz się liter alfabetu!',fn:'initKeyboard'},
      {g:'z1b',i:'🧩',t:'Układanie Słów',d:'Przeciągaj litery!',fn:'initWordBuild'},
      {g:'z1c',i:'🎵',t:'Sylabowe Puzzle',d:'Czytaj sylaby!',fn:'initSyllables'},
      {g:'z1d',i:'🖼️',t:'Dopasuj słowo',d:'Obrazek → słowo',fn:'initMatch'}],
  z3:[{g:'z3a',i:'💎',t:'Liczenie Diamentów',d:'Licz do 30!',fn:'initDiamonds'},
      {g:'z3b',i:'🧮',t:'Działania',d:'+ − × ÷',fn:'initMath'},
      {g:'z3c',i:'🎈',t:'Balony Matematyczne',d:'Trafiaj wyniki!',fn:'initBalloons'}],
  z4:[{g:'z4a',i:'🃏',t:'Memory',d:'Znajdź pary!',fn:'initMemory'},
      {g:'z4b',i:'⭕',t:'Kółko i Krzyżyk',d:'Stich vs Wojan',fn:'initTTT'},
      {g:'z4c',i:'🎲',t:'Chińczyk',d:'Rzuć i odpowiedz!',fn:'initChinczyk'}],
  z5:[{g:'z5a',i:'🔢',t:'Co dalej?',d:'Dokończ wzór',fn:'initSequence'},
      {g:'z5b',i:'🔍',t:'Znajdź różnicę',d:'Co jest inne?',fn:'initDifference'},
      {g:'z5c',i:'🧩',t:'Puzzle',d:'Ułóż obrazek',fn:'initPuzzle'},
      {g:'z5d',i:'🌀',t:'Labirynt',d:'Dojdź do mety',fn:'initMaze'},
      {g:'cbn',i:'🎨',t:'Maluj po numerach',d:'Koloruj!',fn:'initCBN'},
      {g:'shadow',i:'🌚',t:'Znajdź cień',d:'Dopasuj cień',fn:'initShadow'},
      {g:'sort',i:'📦',t:'Sortowanie',d:'Posortuj!',fn:'initSort'}],
  z6:[{g:'z6a',i:'👗',t:'Ubieranki',d:'Stich i Wiola',fn:'initDressup'},
      {g:'z6b',i:'🐾',t:'Opieka',d:'Karm i baw się',fn:'initPet'},
      {g:'z6c',i:'🍳',t:'Gotowanie',d:'Zrób posiłek',fn:'initCooking'},
      {g:'z6d',i:'💅',t:'Salon piękności',d:'Maluj paznokcie',fn:'initSalon'},
      {g:'beads',i:'📿',t:'Koraliki',d:'Twórz wzory',fn:'initBeads'}],
  z7:[{g:'z7a',i:'👆',t:'Kliknij kolor',d:'Wskaż kolor!',fn:'initColorClick'},
      {g:'z7b',i:'📦',t:'Sortuj kolory',d:'Do koszyków!',fn:'initColorSort'},
      {g:'z7c',i:'🌈',t:'Mieszanie',d:'Łącz kolory!',fn:'initColorMix'}],
  z8:[{g:'z8a',i:'🔍',t:'Poznaj kształty',d:'Koło, kwadrat...',fn:'initShapeLearn'},
      {g:'z8b',i:'🧩',t:'Dopasuj kształt',d:'Który przedmiot?',fn:'initShapeMatch'}],
  z9:[{g:'z9a',i:'🔊',t:'Głosy zwierząt',d:'Posłuchaj!',fn:'initAnimalSounds'},
      {g:'z9b',i:'🏠',t:'Gdzie mieszka?',d:'Znajdź dom',fn:'initAnimalHome'},
      {g:'z9c',i:'🍽️',t:'Czym się żywi?',d:'Co je?',fn:'initAnimalFood'}],
  z10:[{g:'z10a',i:'🌅',t:'Pory dnia',d:'Rano czy wieczór?',fn:'initTimeOfDay'},
      {g:'z10b',i:'🕐',t:'Która godzina?',d:'Czytaj zegar',fn:'initClock'}],
  z11:[{g:'z11a',i:'🎹',t:'Pianino',d:'Graj melodie!',fn:'initPiano'},
      {g:'z11b',i:'🎵',t:'Zapamiętaj melodię',d:'Powtórz wzór',fn:'initSimon'}]
};
function renderHub(zoneId){
  const data=HUB_DATA[zoneId]; if(!data) return;
  const wrap=document.getElementById(zoneId+'-cards'); wrap.innerHTML='';
  data.forEach(c=>{
    const locked=!isUnlocked(c.g);
    const stars=getStars(c.g);
    const card=document.createElement('div');
    card.className='hub-card'+(locked?' locked':'');
    card.innerHTML=`<div class="hub-card-icon">${c.i}</div>
      <div class="hub-card-text"><h3>${c.t}</h3><p>${c.d}</p></div>
      ${locked?'<div class="card-lock">🔒</div>':`<div class="card-stars">${starStr(stars)}</div>`}`;
    card.onclick=()=>{
      Audio_.sfx('click');
      if(locked){ const req=UNLOCKS[c.g]; speak('Zdobądź '+req+' gwiazdek!',0.85); showToast('🔒 Potrzebujesz '+req+' gwiazdek!'); return; }
      const scr='s-'+c.g;
      goToScreen(scr);
      if(window[c.fn]) window[c.fn]();
    };
    wrap.appendChild(card);
  });
}

/* ---------- PARENT PANEL (long-press tytułu) ---------- */
let ppTimer=null;
function parentLongPressStart(){ ppTimer=setTimeout(openParent,1200); }
function parentLongPressEnd(){ clearTimeout(ppTimer); }
function openParent(){
  Audio_.sfx('pop'); ensureStats();
  const s=document.getElementById('parent-stats');
  let perZone=ZONES.map(z=>`<div class="stat-row"><span>${z.icon} ${z.name}</span><span>⭐ ${zoneStars(z)}/${zoneMax(z)}</span></div>`).join('');
  const lim=PROGRESS.timeLimit||0;
  s.innerHTML=`<div class="stat-row"><span>👤 Dziecko</span><span>${PROGRESS.avatar||''} ${PROGRESS.childName||'—'}</span></div>
    <div class="stat-row"><span>Poziom</span><span>🏆 ${PROGRESS.level}/20</span></div>
    <div class="stat-row"><span>Łącznie gwiazdek</span><span>⭐ ${PROGRESS.totalStars}</span></div>
    <div class="stat-row"><span>Naklejki</span><span>🏅 ${PROGRESS.stickers.length}/${ACHIEVEMENTS.length}</span></div>
    <div class="stat-row"><span>⏱️ Czas dzisiaj</span><span>${fmtTime(PROGRESS.stats.seconds)}</span></div>
    <div class="stat-row"><span>⭐ Ulubiona strefa</span><span>${topZone()}</span></div>
    <details style="margin-top:6px"><summary style="cursor:pointer;font-size:.85rem;opacity:.8">Postęp wg stref ▾</summary>${perZone}</details>
    <div style="margin-top:12px;font-size:.9rem;font-weight:700">⏰ Limit czasu sesji</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      ${[0,15,30,60].map(m=>`<button class="diff-btn ${lim===m?'active':''}" onclick="setTimeLimit(${m})">${m===0?'Bez limitu':m+' min'}</button>`).join('')}
    </div>`;
  document.getElementById('pp-music').textContent=Audio_.on?'WŁ':'WYŁ';
  document.getElementById('parent-modal').classList.add('show');
}
function setTimeLimit(m){ PROGRESS.timeLimit=m; saveProgress(); Audio_.sfx('click'); openParent(); }
function closeParent(){ document.getElementById('parent-modal').classList.remove('show'); }
function resetProgress(){
  if(confirm('Na pewno zresetować cały postęp dziecka? Tej operacji nie można cofnąć.')){
    const keepName=PROGRESS.childName, keepAvatar=PROGRESS.avatar;
    PROGRESS={stars:{},level:1,totalStars:0,stickers:[],daily:null,childName:keepName,avatar:keepAvatar,timeLimit:0,stats:null};
    saveProgress(); recomputeTotals(); setupDaily(); refreshHUD(); renderPortals(); closeParent();
    speak('Postęp został wyczyszczony.',0.85);
  }
}

/* ---------- PWA ---------- */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; const b=document.getElementById('install-btn'); if(b) b.style.display='flex'; });
function installPWA(){ if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt.userChoice.then(()=>{ deferredPrompt=null; const b=document.getElementById('install-btn'); if(b) b.style.display='none'; }); }
function setupManifest(){
  /* Manifest jest teraz dołączony bezpośrednio w <head> jako manifest.json — nic do zrobienia. */
}
function setupSW(){
  if(!('serviceWorker' in navigator)) return;
  /* Rejestracja prawdziwego pliku sw.js (ścieżka względna — działa też w podkatalogu GitHub Pages). */
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').catch(()=>{}); });
}
/* =====================================================================
   ZONE 1 — LITERY I CZYTANIE
   ===================================================================== */
const PHONEMES={'A':'aaa','Ą':'ooong','B':'byy','C':'cyy','Ć':'ćiii','D':'dyy','E':'eee','Ę':'eng','F':'fff','G':'gyy','H':'hyy','I':'iii','J':'jot','K':'kyy','L':'lll','Ł':'łyy','M':'mmm','N':'nnn','Ń':'ńiii','O':'ooo','Ó':'uuu','P':'pyy','R':'rrr','S':'sss','Ś':'śiii','T':'tyy','U':'uuu','W':'wyy','Y':'yyy','Z':'zzz','Ź':'źiii','Ż':'żee'};
const LETTER_EMOJIS={'A':'🍎','Ą':'🌊','B':'🐝','C':'🍋','Ć':'🌸','D':'🎯','E':'🐘','Ę':'⭐','F':'🦋','G':'🎸','H':'🏠','I':'💎','J':'🦔','K':'🐈','L':'🦁','Ł':'🛶','M':'🐭','N':'🌙','Ń':'🐻','O':'🦉','Ó':'🍬','P':'🐧','R':'🌈','S':'☀️','Ś':'🌲','T':'🐢','U':'👂','W':'🐺','Y':'🌻','Z':'🦓','Ź':'🎈','Ż':'🐸'};

function initKeyboard(){
  const grid=document.getElementById('letter-grid'); grid.innerHTML='';
  'AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ'.split('').forEach(l=>{
    const t=document.createElement('div'); t.className='letter-tile';
    t.innerHTML=`<div class="lt">${l}</div><div class="le">${LETTER_EMOJIS[l]||''}</div>`;
    t.onclick=()=>{ t.classList.add('popped'); setTimeout(()=>t.classList.remove('popped'),300); Audio_.sfx('pop'); speak(PHONEMES[l]||l,0.7); };
    grid.appendChild(t);
  });
  // gwiazdki za eksplorację: po klikaniu kilku liter
  if(!APP.z1aSeen){ APP.z1aSeen=true; setTimeout(()=>setStars('z1a',Math.max(1,getStars('z1a'))),300); }
}

/* --- 40+ słów do układania --- */
const WORDS_DATA=[
  {word:'KOT',emoji:'🐱',hint:'Miau!'},{word:'DOM',emoji:'🏠',hint:'Tu mieszkamy'},{word:'SER',emoji:'🧀',hint:'Żółty i pyszny'},
  {word:'LAS',emoji:'🌲',hint:'Dużo drzew'},{word:'BUS',emoji:'🚌',hint:'Żółty pojazd'},{word:'SOK',emoji:'🧃',hint:'Owocowy napój'},
  {word:'RAK',emoji:'🦀',hint:'Ma szczypce'},{word:'NOS',emoji:'👃',hint:'Wącha zapachy'},{word:'LEW',emoji:'🦁',hint:'Król zwierząt'},
  {word:'UL',emoji:'🐝',hint:'Domek pszczół'},{word:'OKO',emoji:'👁️',hint:'Nim patrzymy'},{word:'EGO',emoji:'🥚',hint:'Z kury'},
  {word:'MAMA',emoji:'👩',hint:'Najlepsza!'},{word:'TATA',emoji:'👨',hint:'Silny'},{word:'BABA',emoji:'👵',hint:'Piecze ciasto'},
  {word:'KURA',emoji:'🐔',hint:'Gdak gdak'},{word:'RYBA',emoji:'🐟',hint:'Pływa'},{word:'PIES',emoji:'🐶',hint:'Hau hau!'},
  {word:'KOZA',emoji:'🐐',hint:'Daje mleko'},{word:'KACZ',emoji:'🦆',hint:'Kwa kwa'},{word:'OSA',emoji:'🐝',hint:'Lata i bzyczy'},
  {word:'MOTYL',emoji:'🦋',hint:'Kolorowy'},{word:'SOWA',emoji:'🦉',hint:'Mądra'},{word:'WODA',emoji:'💧',hint:'Pijemy ją'},
  {word:'GÓRA',emoji:'⛰️',hint:'Wysoka'},{word:'MORZE',emoji:'🌊',hint:'Słona woda'},{word:'CHLEB',emoji:'🍞',hint:'Pieczywo'},
  {word:'JABŁKO',emoji:'🍎',hint:'Owoc'},{word:'BANAN',emoji:'🍌',hint:'Żółty owoc'},{word:'SERCE',emoji:'❤️',hint:'Kocham!'},
  {word:'SŁOŃCE',emoji:'☀️',hint:'Świeci za dnia'},{word:'KSIĘŻYC',emoji:'🌙',hint:'Świeci w nocy'},{word:'GWIAZDA',emoji:'⭐',hint:'Na niebie'},
  {word:'KWIAT',emoji:'🌸',hint:'Pachnie'},{word:'DRZEWO',emoji:'🌳',hint:'Ma liście'},{word:'ZAMEK',emoji:'🏰',hint:'Mieszka tu król'},
  {word:'AUTO',emoji:'🚗',hint:'Jeździ po drodze'},{word:'POCIĄG',emoji:'🚂',hint:'Jedzie po szynach'},{word:'STATEK',emoji:'🚢',hint:'Pływa po morzu'},
  {word:'PIRAT',emoji:'🏴‍☠️',hint:'Szuka skarbu'},{word:'SMOK',emoji:'🐉',hint:'Zieje ogniem'},{word:'ROBOT',emoji:'🤖',hint:'Z metalu'},
  {word:'MISIE',emoji:'🧸',hint:'Pluszowe'},{word:'TORT',emoji:'🎂',hint:'Na urodziny'}
];
let wordIdx=0, dragState=null, ghost=null, z1bErr=0;
function initWordBuild(){ wordIdx=Math.floor(Math.random()*WORDS_DATA.length); z1bErr=0; APP.z1bSolved=APP.z1bSolved||0; renderWord(); }
function renderWord(){
  const w=WORDS_DATA[wordIdx%WORDS_DATA.length];
  document.getElementById('word-emoji').textContent=w.emoji;
  document.getElementById('word-hint').textContent=w.hint;
  const slots=document.getElementById('slot-row'), opts=document.getElementById('letter-options');
  slots.innerHTML=''; opts.innerHTML='';
  w.word.split('').forEach((_,i)=>{
    const s=document.createElement('div'); s.className='letter-slot'; s.dataset.idx=i; s.dataset.expected=w.word[i];
    s.addEventListener('touchend',onDropSlot,{passive:false}); s.addEventListener('mouseup',onDropSlot);
    slots.appendChild(s);
  });
  w.word.split('').map((l,i)=>({l,i})).sort(()=>Math.random()-.5).forEach(({l})=>{
    const d=document.createElement('div'); d.className='drag-letter'; d.textContent=l; d.dataset.letter=l;
    d.addEventListener('touchstart',onDragStart,{passive:false}); d.addEventListener('mousedown',onDragStartMouse);
    opts.appendChild(d);
  });
  speak('Ułóż słowo: '+w.hint,0.82);
}
function makeGhost(letter,x,y){ ghost=document.createElement('div'); ghost.className='drag-ghost'; ghost.textContent=letter; document.body.appendChild(ghost); moveGhost(x,y); }
function moveGhost(x,y){ if(ghost){ ghost.style.left=x+'px'; ghost.style.top=y+'px'; } }
function onDragStart(e){ e.preventDefault(); const el=e.currentTarget; if(el.style.visibility==='hidden') return; dragState={el,letter:el.dataset.letter}; el.classList.add('dragging'); const t=e.touches[0]; makeGhost(el.dataset.letter,t.clientX,t.clientY); document.addEventListener('touchmove',onDragMove,{passive:false}); document.addEventListener('touchend',onDragEnd); Audio_.sfx('pop'); }
function onDragStartMouse(e){ const el=e.currentTarget; if(el.style.visibility==='hidden') return; dragState={el,letter:el.dataset.letter}; el.classList.add('dragging'); makeGhost(el.dataset.letter,e.clientX,e.clientY); document.addEventListener('mousemove',onDragMoveMouse); document.addEventListener('mouseup',onDragEndMouse); Audio_.sfx('pop'); }
function onDragMove(e){ e.preventDefault(); moveGhost(e.touches[0].clientX,e.touches[0].clientY); }
function onDragMoveMouse(e){ moveGhost(e.clientX,e.clientY); }
function onDragEnd(e){ if(!dragState) return; if(ghost) ghost.style.display='none'; const t=e.changedTouches[0]; const tgt=document.elementFromPoint(t.clientX,t.clientY); if(ghost) ghost.style.display=''; tryDropOn(tgt); cleanupDrag(); }
function onDragEndMouse(e){ if(!dragState) return; if(ghost) ghost.style.display='none'; const tgt=document.elementFromPoint(e.clientX,e.clientY); if(ghost) ghost.style.display=''; tryDropOn(tgt); document.removeEventListener('mousemove',onDragMoveMouse); document.removeEventListener('mouseup',onDragEndMouse); cleanupDrag(); }
function onDropSlot(e){ e.preventDefault(); if(!dragState) return; tryDropOn(e.currentTarget); cleanupDrag(); }
function tryDropOn(target){
  if(!dragState) return;
  const slot=target?.closest?.('.letter-slot'); if(!slot||slot.classList.contains('filled')) return;
  if(dragState.letter===slot.dataset.expected){
    slot.textContent=dragState.letter; slot.classList.add('filled'); dragState.el.style.visibility='hidden';
    Audio_.sfx('success'); speak(dragState.letter,0.7); checkWordComplete();
  } else {
    z1bErr++; Audio_.sfx('fail'); speak('Spróbuj inną literkę!',0.9);
    const el=dragState.el; el.classList.remove('dragging'); el.style.transition='transform .1s'; el.style.transform='translateX(-6px)';
    setTimeout(()=>{ el.style.transform='translateX(6px)'; setTimeout(()=>el.style.transform='',100); },100);
    if(z1bErr>=2){ const next=document.querySelector('.letter-slot:not(.filled)'); if(next) pointAt(next,'Tutaj pasuje litera '+next.dataset.expected); z1bErr=0; }
  }
}
function cleanupDrag(){ if(!dragState) return; dragState.el?.classList.remove('dragging'); dragState=null; if(ghost){ ghost.remove(); ghost=null; } document.removeEventListener('touchmove',onDragMove); document.removeEventListener('touchend',onDragEnd); }
function checkWordComplete(){
  const filled=document.querySelectorAll('.letter-slot.filled'), all=document.querySelectorAll('.letter-slot');
  if(filled.length===all.length){
    const w=WORDS_DATA[wordIdx%WORDS_DATA.length];
    w.word.split('').forEach((l,i)=>setTimeout(()=>speak(l,0.75),i*300));
    APP.z1bSolved++;
    const stars=APP.z1bSolved>=5?3:APP.z1bSolved>=3?2:1;
    setTimeout(()=>{ speak(w.word,0.7); celebrate('Wspaniale! 🌟','Słowo: '+w.word,stars,'z1b'); },w.word.length*300+150);
  }
}
function nextWord(){ Audio_.sfx('click'); wordIdx++; z1bErr=0; renderWord(); }

/* --- sylaby (rozbudowane) --- */
const SYL_WORDS=[
  {word:'MAMA',syls:['MA','MA'],emoji:'👩'},{word:'TATA',syls:['TA','TA'],emoji:'👨'},{word:'BABA',syls:['BA','BA'],emoji:'👵'},
  {word:'WOJAN',syls:['WO','JAN'],emoji:'🧱'},{word:'WIOLA',syls:['WI','OLA'],emoji:'💖'},{word:'KURA',syls:['KU','RA'],emoji:'🐔'},
  {word:'OKNO',syls:['OK','NO'],emoji:'🪟'},{word:'RYBA',syls:['RY','BA'],emoji:'🐟'},{word:'MLEKO',syls:['MLE','KO'],emoji:'🥛'},
  {word:'SERCE',syls:['SER','CE'],emoji:'❤️'},{word:'LATO',syls:['LA','TO'],emoji:'☀️'},{word:'ZIMA',syls:['ZI','MA'],emoji:'❄️'},
  {word:'KOTEK',syls:['KO','TEK'],emoji:'🐱'},{word:'PIESEK',syls:['PIE','SEK'],emoji:'🐶'},{word:'DOMEK',syls:['DO','MEK'],emoji:'🏠'},
  {word:'LALKA',syls:['LAL','KA'],emoji:'🪆'},{word:'AUTO',syls:['AU','TO'],emoji:'🚗'},{word:'BANAN',syls:['BA','NAN'],emoji:'🍌'},
  {word:'MOTYL',syls:['MO','TYL'],emoji:'🦋'},{word:'WODA',syls:['WO','DA'],emoji:'💧'}
];
let sylIdx=0, sylProgress=[], z1cSolved=0;
function initSyllables(){ sylIdx=Math.floor(Math.random()*SYL_WORDS.length); z1cSolved=0; renderSylWord(); }
function renderSylWord(){
  const wd=SYL_WORDS[sylIdx%SYL_WORDS.length];
  document.getElementById('syl-word-name').textContent=wd.emoji+' '+wd.word;
  document.getElementById('word-progress').textContent='';
  sylProgress=[];
  const btns=document.getElementById('syl-buttons'); btns.innerHTML='';
  wd.syls.slice().sort(()=>Math.random()-.5).forEach(syl=>{
    const b=document.createElement('button'); b.className='syl-btn'; b.textContent=syl;
    b.onclick=()=>onSylClick(syl,wd); btns.appendChild(b);
  });
  speak('Ułóż sylaby: '+wd.syls.join(', '),0.8);
}
function onSylClick(syl,wd){
  if(syl===wd.syls[sylProgress.length]){
    sylProgress.push(syl); Audio_.sfx('pop'); speak(syl,0.75);
    document.getElementById('word-progress').textContent=sylProgress.join('·');
    if(sylProgress.length===wd.syls.length){
      z1cSolved++; const stars=z1cSolved>=5?3:z1cSolved>=3?2:1;
      setTimeout(()=>{ speak(wd.word,0.8); celebrate('Doskonale! 🎵','Słowo: '+wd.word,stars,'z1c'); },400);
    }
  } else { Audio_.sfx('fail'); speak('Najpierw: '+wd.syls[sylProgress.length],0.9); }
}
function nextSylWord(){ Audio_.sfx('click'); sylIdx++; renderSylWord(); }

/* --- dopasuj obrazek -> słowo --- */
const MATCH_DATA=[
  {emoji:'🐱',word:'KOT'},{emoji:'🐶',word:'PIES'},{emoji:'🏠',word:'DOM'},{emoji:'🌞',word:'SŁOŃCE'},
  {emoji:'🌙',word:'KSIĘŻYC'},{emoji:'🐟',word:'RYBA'},{emoji:'🦋',word:'MOTYL'},{emoji:'🌳',word:'DRZEWO'},
  {emoji:'🚗',word:'AUTO'},{emoji:'🐝',word:'PSZCZOŁA'},{emoji:'❤️',word:'SERCE'},{emoji:'🍎',word:'JABŁKO'},
  {emoji:'🌈',word:'TĘCZA'},{emoji:'⭐',word:'GWIAZDA'},{emoji:'🐢',word:'ŻÓŁW'},{emoji:'🦁',word:'LEW'}
];
let matchIdx=0, matchSolved=0, z1dErr=0;
function initMatch(){ matchIdx=Math.floor(Math.random()*MATCH_DATA.length); matchSolved=0; z1dErr=0; renderMatch(); }
function renderMatch(){
  const m=MATCH_DATA[matchIdx%MATCH_DATA.length];
  document.getElementById('match-pic').textContent=m.emoji;
  const opts=document.getElementById('match-opts'); opts.innerHTML='';
  const wrong=MATCH_DATA.filter(x=>x.word!==m.word).sort(()=>Math.random()-.5).slice(0,2).map(x=>x.word);
  [m.word,...wrong].sort(()=>Math.random()-.5).forEach(w=>{
    const b=document.createElement('div'); b.className='match-opt'; b.textContent=w;
    b.onclick=()=>{
      if(w===m.word){ b.classList.add('correct'); matchSolved++; const stars=matchSolved>=5?3:matchSolved>=3?2:1; celebrate('Świetnie! 🖼️',m.word,stars,'z1d'); }
      else { b.classList.add('wrong'); z1dErr++; Audio_.sfx('fail'); speak('To nie to słowo. Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),600); if(z1dErr>=2){ const correct=[...opts.children].find(c=>c.textContent===m.word); if(correct) pointAt(correct,'To słowo pasuje do obrazka'); z1dErr=0; } }
    };
    opts.appendChild(b);
  });
  speak('Który napis pasuje do obrazka?',0.84);
}
function nextMatch(){ Audio_.sfx('click'); matchIdx++; z1dErr=0; renderMatch(); }

/* =====================================================================
   ZONE 2 — PISANIE (canvas + poziomy + zapis)
   ===================================================================== */
const DRAW_LEVELS={
  easy:['A','O','T','E','I','1','2','3'],
  medium:['B','C','D','L','M','N','P','S','4','5','6'],
  hard:['F','G','H','K','R','W','Z','7','8','9']
};
let drawDiff='easy';
let drawCtx=null, drawCanvas=null, pathPoints=[], coveredPoints=new Set(), canvasScale=1;
const Z2_DONE={};
function initDrawing(){
  drawCanvas=document.getElementById('draw-canvas'); drawCtx=drawCanvas.getContext('2d');
  const diff=document.getElementById('z2-diff'); diff.innerHTML='';
  [['easy','Łatwy'],['medium','Średni'],['hard','Trudny']].forEach(([k,label])=>{
    const b=document.createElement('button'); b.className='diff-btn'+(k===drawDiff?' active':''); b.textContent=label;
    b.onclick=()=>{ drawDiff=k; Audio_.sfx('click'); initDrawing(); }; diff.appendChild(b);
  });
  const chars=document.getElementById('char-picker'); chars.innerHTML='';
  DRAW_LEVELS[drawDiff].forEach((c,i)=>{
    const b=document.createElement('button'); b.className='char-pick-btn'; b.textContent=c;
    if(Z2_DONE[c]) b.style.borderColor='#56c275';
    b.onclick=()=>selectChar(c,b); chars.appendChild(b);
    if(i===0) selectChar(c,b);
  });
  renderGallery();
}
function selectChar(ch,btn){
  document.querySelectorAll('.char-pick-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  APP.z2={...(APP.z2||{}),activeChar:ch,celebrated:false,drawing:false,lastX:0,lastY:0};
  const r=drawCanvas.getBoundingClientRect(); canvasScale=r.width?drawCanvas.width/r.width:1;
  clearDrawing(); drawTemplate(ch);
  document.getElementById('cov-text').textContent='Rysuj palcem po kropkach!';
  document.getElementById('cov-bar').style.width='0%';
  speak('Narysuj: '+ch,0.8);
}
function getCharPath(ch){
  const W=320,H=220,cx=W/2,cy=H/2,pts=[];
  const L=(x1,y1,x2,y2,n=18)=>{for(let t=0;t<=n;t++)pts.push({x:x1+(x2-x1)*t/n,y:y1+(y2-y1)*t/n});};
  const A=(ox,oy,rx,ry,s,e,n=22)=>{for(let i=0;i<=n;i++){const a=s+(e-s)*i/n;pts.push({x:ox+rx*Math.cos(a),y:oy+ry*Math.sin(a)});}};
  switch(ch){
    case 'A':L(cx-60,H-30,cx,30);L(cx,30,cx+60,H-30);L(cx-32,cy+10,cx+32,cy+10);break;
    case 'B':L(80,30,80,H-30);A(80,cy-30,52,42,-Math.PI/2,Math.PI/2);A(80,cy+28,60,48,-Math.PI/2,Math.PI/2);break;
    case 'C':A(cx,cy,78,78,0.4,2*Math.PI-0.4,26);break;
    case 'D':L(80,30,H-30,30);L(80,30,80,H-30);A(80,cy,92,cy-30,-Math.PI/2,Math.PI/2);break;
    case 'E':L(80,30,80,H-30);L(80,30,210,30);L(80,cy,185,cy);L(80,H-30,210,H-30);break;
    case 'F':L(80,30,80,H-30);L(80,30,210,30);L(80,cy,180,cy);break;
    case 'G':A(cx,cy,78,78,0.4,2*Math.PI-0.1,26);L(cx+55,cy,cx+55,cy+30);L(cx+25,cy,cx+55,cy);break;
    case 'H':L(80,30,80,H-30);L(240,30,240,H-30);L(80,cy,240,cy);break;
    case 'I':L(cx,30,cx,H-30);L(cx-40,30,cx+40,30);L(cx-40,H-30,cx+40,H-30);break;
    case 'K':L(80,30,80,H-30);L(80,cy,210,30);L(80,cy,210,H-30);break;
    case 'L':L(80,30,80,H-30);L(80,H-30,210,H-30);break;
    case 'M':L(70,H-30,70,30);L(70,30,cx,cy);L(cx,cy,250,30);L(250,30,250,H-30);break;
    case 'N':L(80,H-30,80,30);L(80,30,240,H-30);L(240,H-30,240,30);break;
    case 'O':A(cx,cy,78,80,0,2*Math.PI,30);break;
    case 'P':L(80,30,80,H-30);A(80,cy-28,58,46,-Math.PI/2,Math.PI/2);break;
    case 'R':L(80,30,80,H-30);A(80,cy-28,56,46,-Math.PI/2,Math.PI/2);L(80,cy,210,H-30);break;
    case 'S':A(cx,cy-26,52,44,-0.3,Math.PI+0.6);A(cx,cy+26,52,44,Math.PI-0.3,2*Math.PI+0.6);break;
    case 'T':L(70,30,250,30);L(cx,30,cx,H-30);break;
    case 'W':L(60,30,100,H-30);L(100,H-30,cx,cy);L(cx,cy,220,H-30);L(220,H-30,260,30);break;
    case 'Z':L(80,30,240,30);L(240,30,80,H-30);L(80,H-30,240,H-30);break;
    case '1':L(cx-28,55,cx,30);L(cx,30,cx,H-30);L(cx-38,H-30,cx+38,H-30);break;
    case '2':A(cx,80,58,48,Math.PI,2*Math.PI);L(cx+58,80,cx-48,H-30);L(cx-48,H-30,cx+58,H-30);break;
    case '3':A(cx,80,56,46,Math.PI,2*Math.PI);A(cx,H-66,56,46,Math.PI,2*Math.PI);L(cx+56,80,cx+56,H-66);break;
    case '4':L(cx+28,30,cx-50,cy+10);L(cx-50,cy+10,cx+50,cy+10);L(cx+28,30,cx+28,H-30);break;
    case '5':L(cx+48,30,cx-48,30);L(cx-48,30,cx-48,cy);L(cx-48,cy,cx+28,cy);A(cx+8,H-62,54,52,-Math.PI/2,Math.PI/2+0.3,18);break;
    case '6':A(cx+8,cy,54,80,-0.6,Math.PI*1.4,24);A(cx,cy+24,46,40,0,2*Math.PI,18);break;
    case '7':L(80,30,240,30);L(240,30,cx-10,H-30);break;
    case '8':A(cx,cy-26,42,40,0,2*Math.PI,20);A(cx,cy+30,50,46,0,2*Math.PI,22);break;
    case '9':A(cx,cy-20,46,42,0,2*Math.PI,20);L(cx+44,cy-20,cx+30,H-30);break;
    default:A(cx,cy,78,80,0,2*Math.PI,28);
  }
  return pts;
}
function drawTemplate(ch){
  if(!drawCtx) return; const W=drawCanvas.width,H=drawCanvas.height;
  drawCtx.clearRect(0,0,W,H); drawCtx.fillStyle='#110020'; drawCtx.fillRect(0,0,W,H);
  drawCtx.save(); drawCtx.font=`bold ${Math.min(W,H)*0.7}px Arial`; drawCtx.fillStyle='rgba(255,255,255,0.045)'; drawCtx.textAlign='center'; drawCtx.textBaseline='middle'; drawCtx.fillText(ch,W/2,H/2); drawCtx.restore();
  pathPoints=getCharPath(ch); coveredPoints=new Set();
  pathPoints.forEach(p=>{ drawCtx.beginPath(); drawCtx.arc(p.x,p.y,8,0,7); drawCtx.fillStyle='rgba(232,73,138,0.15)'; drawCtx.fill(); drawCtx.beginPath(); drawCtx.arc(p.x,p.y,4,0,7); drawCtx.fillStyle='rgba(232,73,138,0.65)'; drawCtx.fill(); });
  if(pathPoints[0]){ drawCtx.font='18px Arial'; drawCtx.fillStyle='rgba(255,255,255,0.5)'; drawCtx.textAlign='center'; drawCtx.fillText('▶',pathPoints[0].x,pathPoints[0].y-14); }
}
function initCanvasEvents(){
  drawCanvas=document.getElementById('draw-canvas'); if(!drawCanvas) return;
  const pos=(cx,cy)=>{ const r=drawCanvas.getBoundingClientRect(); return {x:(cx-r.left)*(drawCanvas.width/r.width),y:(cy-r.top)*(drawCanvas.height/r.height)}; };
  const start=(cx,cy)=>{ APP.z2=APP.z2||{}; APP.z2.drawing=true; const p=pos(cx,cy); APP.z2.lastX=p.x; APP.z2.lastY=p.y; };
  const move=(cx,cy)=>{ if(!APP.z2||!APP.z2.drawing) return; const p=pos(cx,cy); drawStroke(APP.z2.lastX,APP.z2.lastY,p.x,p.y); updateCoverage(p.x,p.y); APP.z2.lastX=p.x; APP.z2.lastY=p.y; Audio_.sfx('draw'); };
  drawCanvas.addEventListener('touchstart',e=>{e.preventDefault();start(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  drawCanvas.addEventListener('touchmove',e=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  drawCanvas.addEventListener('touchend',()=>{if(APP.z2)APP.z2.drawing=false;});
  drawCanvas.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
  drawCanvas.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  drawCanvas.addEventListener('mouseup',()=>{if(APP.z2)APP.z2.drawing=false;});
  drawCanvas.addEventListener('mouseleave',()=>{if(APP.z2)APP.z2.drawing=false;});
}
function drawStroke(x1,y1,x2,y2){ if(!drawCtx) return; drawCtx.beginPath(); drawCtx.moveTo(x1,y1); drawCtx.lineTo(x2,y2); drawCtx.strokeStyle='#e8498a'; drawCtx.lineWidth=12; drawCtx.lineCap='round'; drawCtx.stroke(); }
function updateCoverage(x,y){
  if(!pathPoints.length) return;
  pathPoints.forEach((p,i)=>{ if(!coveredPoints.has(i)&&Math.hypot(x-p.x,y-p.y)<24){ coveredPoints.add(i); drawCtx.beginPath(); drawCtx.arc(p.x,p.y,6,0,7); drawCtx.fillStyle='#56c275'; drawCtx.fill(); } });
  const pct=Math.round(coveredPoints.size/pathPoints.length*100);
  document.getElementById('cov-bar').style.width=pct+'%';
  const stars=pct>=90?'⭐⭐⭐':pct>=65?'⭐⭐':pct>=40?'⭐':'';
  document.getElementById('cov-text').textContent=`Pokrycie: ${pct}% ${stars}`;
  if(pct>=65 && !APP.z2.celebrated){
    APP.z2.celebrated=true; const ch=APP.z2.activeChar; Z2_DONE[ch]=true;
    const st=pct>=90?3:pct>=80?2:1;
    setTimeout(()=>{ celebrate('Wspaniale! ✏️','Narysowałeś: '+ch,Math.max(st,getStars('z2')),'z2'); document.querySelectorAll('.char-pick-btn').forEach(b=>{if(b.textContent===ch)b.style.borderColor='#56c275';}); },350);
  }
}
function clearDrawing(){ APP.z2=APP.z2||{}; APP.z2.celebrated=false; coveredPoints=new Set(); if(APP.z2.activeChar) drawTemplate(APP.z2.activeChar); document.getElementById('cov-bar').style.width='0%'; document.getElementById('cov-text').textContent='Rysuj palcem po kropkach!'; }
function checkCoverage(){ if(!pathPoints.length){speak('Wybierz literę!',0.9);return;} const pct=Math.round(coveredPoints.size/pathPoints.length*100); if(pct>=65){ celebrate('Super! ✅','Pokrycie '+pct+'%',pct>=90?3:2,'z2'); } else { speak('Rysuj dalej! Masz '+pct+' procent.',0.9); } }
/* zapis rysunku do galerii (localStorage, max 8) */
function saveDrawing(){
  try{
    const data=drawCanvas.toDataURL('image/png');
    let g=JSON.parse(localStorage.getItem('edwyspa_gallery')||'[]');
    g.unshift(data); g=g.slice(0,8); localStorage.setItem('edwyspa_gallery',JSON.stringify(g));
    Audio_.sfx('success'); speak('Zapisałem twój rysunek!',0.85); showToast('💾 Rysunek zapisany!'); renderGallery();
  }catch(e){ showToast('Nie udało się zapisać.'); }
}
function renderGallery(){
  const g=document.getElementById('draw-gallery'); if(!g) return;
  let arr=[]; try{ arr=JSON.parse(localStorage.getItem('edwyspa_gallery')||'[]'); }catch(e){}
  g.innerHTML=arr.map(d=>`<img src="${d}" alt="rysunek">`).join('');
}

/* =====================================================================
   ZONE 3 — MATEMATYKA (liczenie do 30, +/-/×/÷, balony)
   ===================================================================== */
let diamondTotal=0, diamondCounted=0;
function initDiamonds(){
  const solved=APP.z3aSolved||0;
  const max=solved>=6?30:solved>=3?20:12, min=solved>=6?15:solved>=3?8:5;
  diamondTotal=min+Math.floor(Math.random()*(max-min+1));
  diamondCounted=0; renderDiamonds();
}
function renderDiamonds(){
  const grid=document.getElementById('diamond-grid'); grid.innerHTML='';
  const emojis=['💎','🔷','💠'];
  for(let i=0;i<diamondTotal;i++){
    const d=document.createElement('div'); d.className='diamond-item'; d.textContent=emojis[i%emojis.length]; d.dataset.idx=i;
    d.onclick=()=>tapDiamond(d); grid.appendChild(d);
  }
  document.getElementById('count-display').textContent='0';
  document.getElementById('diamond-answers').innerHTML='';
  speak('Policz diamenty! Dotykaj je po kolei.',0.85);
}
function tapDiamond(el){
  if(el.classList.contains('lit')) return;
  el.classList.add('lit'); diamondCounted++;
  window._countPitch=diamondCounted%10; Audio_.sfx('count');
  document.getElementById('count-display').textContent=diamondCounted;
  speak(String(diamondCounted),0.95,1.2);
  if(diamondCounted===diamondTotal) setTimeout(showDiamondAnswers,450);
}
function showDiamondAnswers(){
  const wrap=document.getElementById('diamond-answers'); wrap.innerHTML='';
  const opts=new Set([diamondTotal]);
  while(opts.size<3){ const v=diamondTotal+Math.floor(Math.random()*5)-2; if(v>0&&v!==diamondTotal) opts.add(v); }
  [...opts].sort(()=>Math.random()-.5).forEach(v=>{
    const b=document.createElement('button'); b.className='ans-btn'; b.textContent=v;
    b.onclick=()=>{
      if(v===diamondTotal){
        b.classList.add('correct'); document.querySelectorAll('#diamond-answers .ans-btn').forEach(x=>x.disabled=true);
        APP.z3aSolved=(APP.z3aSolved||0)+1; const s=APP.z3aSolved>=6?3:APP.z3aSolved>=3?2:1;
        celebrate('Brawo! 💎','Razem: '+diamondTotal,s,'z3a');
      } else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Spróbuj jeszcze raz!',0.9); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
}
function nextDiamond(){ Audio_.sfx('click'); initDiamonds(); }

const MATH_EMOJIS={'+':'🍎','-':'🎈','×':'⭐','÷':'🍪'};
let mathOp='+', mathErr=0;
function initMath(){
  const ops=document.getElementById('z3b-ops'); ops.innerHTML='';
  ['+','-','×','÷'].forEach(op=>{
    const b=document.createElement('button'); b.className='diff-btn'+(op===mathOp?' active':''); b.textContent=op;
    b.onclick=()=>{ mathOp=op; Audio_.sfx('click'); initMath(); };
    ops.appendChild(b);
  });
  nextMath();
}
function nextMath(){
  mathErr=0; const solved=APP.z3bSolved||0;
  const emoji=MATH_EMOJIS[mathOp]; let a,b,ans,html;
  if(mathOp==='+'){ a=1+Math.floor(Math.random()*(solved>=4?15:8)); b=1+Math.floor(Math.random()*(solved>=4?10:6)); ans=a+b;
    html=emoji.repeat(Math.min(a,10))+' <span style="opacity:.5">➕</span> '+emoji.repeat(Math.min(b,10)); }
  else if(mathOp==='-'){ a=2+Math.floor(Math.random()*(solved>=4?18:10)); b=1+Math.floor(Math.random()*a); ans=a-b;
    html=emoji.repeat(Math.min(a,14)); }
  else if(mathOp==='×'){ a=1+Math.floor(Math.random()*5); b=1+Math.floor(Math.random()*5); ans=a*b;
    html=Array.from({length:a},()=>`<span style="margin-right:6px">${emoji.repeat(b)}</span>`).join(''); }
  else { b=1+Math.floor(Math.random()*5); ans=1+Math.floor(Math.random()*5); a=b*ans;
    html=Array.from({length:b},()=>`<span style="margin-right:6px;padding:0 4px;border-right:2px dashed rgba(255,255,255,.3)">${emoji.repeat(ans)}</span>`).join(''); }
  document.getElementById('math-eq').textContent=`${a} ${mathOp} ${b} = ?`;
  document.getElementById('math-emoji').innerHTML=html;
  renderMathAnswers(ans);
  const w=mathOp==='+'?'plus':mathOp==='-'?'minus':mathOp==='×'?'razy':'podzielić przez';
  speak(`${a} ${w} ${b}`,0.85);
}
function renderMathAnswers(ans){
  const wrap=document.getElementById('math-answers'); wrap.innerHTML='';
  const opts=new Set([ans]);
  while(opts.size<3){ const v=Math.max(0,ans+Math.floor(Math.random()*5)-2); if(v!==ans) opts.add(v); }
  [...opts].sort(()=>Math.random()-.5).forEach(v=>{
    const btn=document.createElement('button'); btn.className='ans-btn'; btn.textContent=v;
    btn.onclick=()=>{
      if(v===ans){
        btn.classList.add('correct'); document.querySelectorAll('#math-answers .ans-btn').forEach(x=>x.disabled=true);
        APP.z3bSolved=(APP.z3bSolved||0)+1; const s=APP.z3bSolved>=8?3:APP.z3bSolved>=4?2:1;
        celebrate('Brawo! 🧮','Wynik: '+ans,s,'z3b');
      } else {
        btn.classList.add('wrong'); mathErr++; Audio_.sfx('fail'); speak('Nie, spróbuj jeszcze!',0.9);
        setTimeout(()=>btn.classList.remove('wrong'),500);
        if(mathErr>=2){ const c=[...wrap.children].find(x=>+x.textContent===ans); if(c) pointAt(c,'Tutaj jest poprawna odpowiedź'); mathErr=0; }
      }
    };
    wrap.appendChild(btn);
  });
}

/* --- balony matematyczne --- */
let balloonState=null;
function initBalloons(){
  clearBalloonTimers();
  const target=2+Math.floor(Math.random()*10);
  document.getElementById('balloon-target').textContent=`🎯 Złap balon z liczbą: ${target}`;
  document.getElementById('balloon-score').textContent='Trafienia: 0 / 5';
  const field=document.getElementById('balloon-field'); field.innerHTML='';
  balloonState={target,hits:0,balloons:[]};
  speak('Złap balon z liczbą '+target,0.85);
  balloonState.spawnTimer=setInterval(spawnBalloon,1300);
  balloonState.tickTimer=setInterval(tickBalloons,40);
  spawnBalloon();
}
function clearBalloonTimers(){ if(balloonState){ clearInterval(balloonState.spawnTimer); clearInterval(balloonState.tickTimer); } }
function spawnBalloon(){
  if(!balloonState) return;
  const field=document.getElementById('balloon-field'); const fw=field.clientWidth||300, fh=field.clientHeight||340;
  const isTarget=Math.random()<0.42;
  const num=isTarget?balloonState.target:Math.max(1,balloonState.target+(Math.floor(Math.random()*9)-4));
  const colors=['#e8498a','#3dd5f3','#f4a61a','#4caf50','#9b6dff'];
  const el=document.createElement('div'); el.className='balloon'; el.textContent=num;
  el.style.background=colors[Math.floor(Math.random()*colors.length)];
  el.style.left=(10+Math.random()*(fw-72))+'px'; el.style.top=fh+'px'; el.dataset.num=num;
  el.onclick=()=>popBalloon(el,num);
  field.appendChild(el); balloonState.balloons.push(el);
}
function tickBalloons(){
  if(!balloonState) return;
  balloonState.balloons.forEach(el=>{
    if(!el.parentNode) return;
    const top=parseFloat(el.style.top)-1.6; el.style.top=top+'px';
    if(top<-90) el.remove();
  });
  balloonState.balloons=balloonState.balloons.filter(el=>el.parentNode);
}
function popBalloon(el,num){
  if(!balloonState) return; Audio_.sfx('pop');
  if(num===balloonState.target){
    el.style.transition='transform .2s,opacity .2s'; el.style.transform='scale(1.4)'; el.style.opacity='0'; setTimeout(()=>el.remove(),200);
    balloonState.hits++; document.getElementById('balloon-score').textContent=`Trafienia: ${balloonState.hits} / 5`; speak(String(num),0.9);
    if(balloonState.hits>=5){
      clearBalloonTimers(); balloonState.balloons.forEach(b=>b.remove());
      APP.z3cSolved=(APP.z3cSolved||0)+1; const s=APP.z3cSolved>=4?3:APP.z3cSolved>=2?2:1;
      setTimeout(()=>celebrate('Brawo! 🎈','Złapałeś 5 balonów!',s,'z3c'),250);
      balloonState=null;
    }
  } else { el.style.transition='transform .15s,opacity .15s'; el.style.transform='scale(.6)'; el.style.opacity='0'; setTimeout(()=>el.remove(),150); }
}

/* =====================================================================
   ZONE 4 — GRY I ZABAWY (Memory, Kółko i Krzyżyk, Chińczyk)
   ===================================================================== */
const MEM_PAIRS=['👽','🧱','💎','🌺','🐊','👾','🌙','💗','🦋','🌈'];
const MEM_NAMES={'👽':'Stich','🧱':'Wojan','💎':'Diament','🌺':'Kwiat','🐊':'Krokodyl','👾':'Creeper','🌙':'Księżyc','💗':'Wiola','🦋':'Motyl','🌈':'Tęcza'};
let memSize='small';
function initMemory(){
  const dw=document.getElementById('mem-diff'); dw.innerHTML='';
  [['small','Łatwy (6 par)'],['medium','Średni (8 par)'],['large','Trudny (10 par)']].forEach(([k,l])=>{
    const b=document.createElement('button'); b.className='diff-btn'+(k===memSize?' active':''); b.textContent=l;
    b.onclick=()=>{ memSize=k; Audio_.sfx('click'); initMemory(); }; dw.appendChild(b);
  });
  const pairsCount=memSize==='small'?6:memSize==='medium'?8:10, cols=memSize==='small'?3:4;
  const cards=MEM_PAIRS.slice(0,pairsCount).flatMap(s=>[s,s]).sort(()=>Math.random()-.5);
  APP.z4a={first:null,locked:false,matched:[],pairs:0,total:pairsCount};
  const grid=document.getElementById('memory-grid'); grid.innerHTML=''; grid.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  cards.forEach((sym,idx)=>{
    const card=document.createElement('div'); card.className='mem-card'; card.dataset.sym=sym; card.dataset.idx=idx;
    card.innerHTML=`<div class="mem-card-inner"><div class="mem-front">❓</div><div class="mem-back">${sym}</div></div>`;
    card.onclick=()=>flipCard(card); grid.appendChild(card);
  });
  document.getElementById('mem-score').textContent=`Pary: 0 / ${pairsCount}`;
  speak('Znajdź pary! Odkrywaj karty.',0.85);
}
function flipCard(card){
  if(APP.z4a.locked||card.classList.contains('flipped')||APP.z4a.matched.includes(+card.dataset.idx)) return;
  card.classList.add('flipped'); Audio_.sfx('click');
  if(!APP.z4a.first){ APP.z4a.first=card; speak(MEM_NAMES[card.dataset.sym]||card.dataset.sym,0.9); }
  else {
    APP.z4a.locked=true;
    if(APP.z4a.first.dataset.sym===card.dataset.sym){
      APP.z4a.matched.push(+APP.z4a.first.dataset.idx,+card.dataset.idx); APP.z4a.pairs++;
      document.getElementById('mem-score').textContent=`Pary: ${APP.z4a.pairs} / ${APP.z4a.total}`;
      speak('Para! '+(MEM_NAMES[card.dataset.sym]||'')+'!',0.9);
      APP.z4a.first=null; APP.z4a.locked=false;
      if(APP.z4a.pairs===APP.z4a.total){
        APP.z4aSolved=(APP.z4aSolved||0)+1; const s=memSize==='large'?3:memSize==='medium'?2:1;
        setTimeout(()=>celebrate('Wygrałeś! 🎉','Wszystkie pary znalezione!',s,'z4a'),400);
      }
    } else {
      Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.85);
      setTimeout(()=>{ card.classList.remove('flipped'); APP.z4a.first.classList.remove('flipped'); APP.z4a.first=null; APP.z4a.locked=false; },900);
    }
  }
}

let tttBoard=[], tttOver=false;
function initTTT(){
  tttBoard=Array(9).fill(null); tttOver=false;
  const grid=document.getElementById('ttt-grid'); grid.innerHTML='';
  for(let i=0;i<9;i++){ const c=document.createElement('div'); c.className='ttt-cell'; c.dataset.idx=i; c.onclick=()=>tttClick(i); grid.appendChild(c); }
  document.getElementById('ttt-status').textContent='Twoja kolej! 💙';
  speak('Twoja kolej! Dotknij pole.',0.85);
}
function tttClick(i){ if(tttOver||tttBoard[i]) return; tttPlace(i,'X'); if(checkOver()) return; document.getElementById('ttt-status').textContent='Wojan myśli... 💖'; setTimeout(tttAI,650); }
function tttPlace(i,player){ tttBoard[i]=player; const cell=document.querySelector(`.ttt-cell[data-idx="${i}"]`); cell.textContent=player==='X'?'💙':'💖'; cell.dataset.player=player; Audio_.sfx('click'); }
function tttAI(){
  if(tttOver) return;
  const empty=tttBoard.map((v,i)=>v?null:i).filter(v=>v!==null); if(!empty.length) return;
  const move=Math.random()<0.3?(findTacticalMove()??empty[Math.floor(Math.random()*empty.length)]):empty[Math.floor(Math.random()*empty.length)];
  tttPlace(move,'O'); if(checkOver()) return;
  document.getElementById('ttt-status').textContent='Twoja kolej! 💙';
}
function findTacticalMove(){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const player of ['O','X']) for(const line of lines){
    const vals=line.map(i=>tttBoard[i]); const count=vals.filter(v=>v===player).length; const empties=line.filter(i=>!tttBoard[i]);
    if(count===2&&empties.length===1) return empties[0];
  }
  return null;
}
function tttWinner(){
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,b,c] of lines) if(tttBoard[a]&&tttBoard[a]===tttBoard[b]&&tttBoard[b]===tttBoard[c]) return tttBoard[a];
  return tttBoard.every(v=>v)?'draw':null;
}
function checkOver(){
  const w=tttWinner(); if(!w) return false; tttOver=true;
  if(w==='draw'){ document.getElementById('ttt-status').textContent='Remis! 🤝'; speak('Remis! Zagrajmy jeszcze raz!',0.85); }
  else if(w==='X'){ document.getElementById('ttt-status').textContent='Wygrałeś! 💙🎉'; APP.z4bSolved=(APP.z4bSolved||0)+1; const s=APP.z4bSolved>=5?3:APP.z4bSolved>=2?2:1; setTimeout(()=>celebrate('Wygrałeś! 🎉','Pokonałeś Wojana!',s,'z4b'),300); }
  else { document.getElementById('ttt-status').textContent='Wojan wygrał! 💖'; speak('Wojan wygrał! Spróbuj jeszcze raz!',0.85); }
  return true;
}

const QUIZ_QS=[
  {q:'Jaki to kolor? 🍎',opts:['Czerwony','Niebieski','Zielony'],ans:'Czerwony'},
  {q:'2 + 2 = ?',opts:['3','4','5'],ans:'4'},
  {q:'Jaka to litera? A',opts:['A','B','C'],ans:'A'},
  {q:'Ile nóg ma pies?',opts:['2','4','6'],ans:'4'},
  {q:'Co świeci za dnia?',opts:['Słońce','Księżyc','Gwiazdy'],ans:'Słońce'},
  {q:'5 - 2 = ?',opts:['2','3','4'],ans:'3'},
  {q:'Jaki to kształt? ⚪',opts:['Kwadrat','Koło','Trójkąt'],ans:'Koło'},
  {q:'Co ma głowę i ogon, a nie jest zwierzęciem?',opts:['Moneta','Jabłko','Chmura'],ans:'Moneta'},
  {q:'3 + 2 = ?',opts:['4','5','6'],ans:'5'},
  {q:'Jaka litera jest po C?',opts:['B','D','E'],ans:'D'},
  {q:'Ile rogów ma krowa?',opts:['2','4','0'],ans:'2'},
  {q:'4 - 1 = ?',opts:['2','3','5'],ans:'3'},
  {q:'Co świeci w nocy?',opts:['Słońce','Księżyc','Deszcz'],ans:'Księżyc'},
  {q:'2 × 2 = ?',opts:['3','4','5'],ans:'4'},
  {q:'Jakiego koloru jest trawa?',opts:['Zielona','Czerwona','Niebieska'],ans:'Zielona'},
  {q:'Co robi pszczoła?',opts:['Bzyczy','Szczeka','Miauczy'],ans:'Bzyczy'}
];
const DICE_EMOJI=['⚀','⚁','⚂'];
let diceRolling=false;
function initChinczyk(){
  APP.z4c={cells:16,playerPos:0,cpuPos:0,rollAmt:0};
  renderTrack();
  document.getElementById('quiz-area').innerHTML='';
  document.getElementById('dice-disp').textContent='🎲';
  document.getElementById('chin-roll-btn').style.display='';
  document.getElementById('chin-info').textContent='💙 Ty | 💚 Creeper — dotrzyj do mety!';
  speak('Rzuć kostką i odpowiadaj na pytania!',0.85);
}
function renderTrack(){
  const track=document.getElementById('chin-track'); track.innerHTML='';
  for(let i=0;i<=APP.z4c.cells;i++){
    const cell=document.createElement('div'); cell.className='track-cell'+(i===0?' start-cell':'')+(i===APP.z4c.cells?' end-cell':'');
    let c=''; if(i===APP.z4c.playerPos&&i===APP.z4c.cpuPos) c='💙💚'; else if(i===APP.z4c.playerPos) c='💙'; else if(i===APP.z4c.cpuPos) c='💚'; else if(i===0) c='🏁'; else if(i===APP.z4c.cells) c='🏆';
    cell.textContent=c; track.appendChild(cell);
  }
}
function rollDice(){
  if(diceRolling) return; diceRolling=true; document.getElementById('chin-roll-btn').disabled=true;
  let flips=0; const anim=setInterval(()=>{ document.getElementById('dice-disp').textContent=DICE_EMOJI[Math.floor(Math.random()*3)]; if(++flips>=6) clearInterval(anim); },100);
  setTimeout(()=>{
    const roll=Math.floor(Math.random()*3)+1; APP.z4c.rollAmt=roll;
    document.getElementById('dice-disp').textContent=DICE_EMOJI[roll-1]+' '+roll;
    document.getElementById('chin-roll-btn').style.display='none'; document.getElementById('chin-roll-btn').disabled=false; diceRolling=false;
    speak('Wyrzuciłeś '+roll+'! Odpowiedz na pytanie!',0.9); showQuiz();
  },700);
}
function showQuiz(){
  const wrap=document.getElementById('quiz-area'); const q=QUIZ_QS[Math.floor(Math.random()*QUIZ_QS.length)];
  wrap.innerHTML=`<div class="quiz-box"><div class="quiz-q">${q.q}</div><div class="quiz-opts">${q.opts.map(o=>`<div class="quiz-opt">${o}</div>`).join('')}</div></div>`;
  [...wrap.querySelectorAll('.quiz-opt')].forEach(el=>{ el.onclick=()=>quizAns(el.textContent,q.ans,APP.z4c.rollAmt); });
  speak(q.q,0.85);
}
function quizAns(chosen,ans,roll){
  document.querySelectorAll('.quiz-opt').forEach(b=>{ b.style.pointerEvents='none'; });
  if(chosen===ans){ Audio_.sfx('success'); speak('Dobrze! Idziesz do przodu!',0.9); APP.z4c.playerPos=Math.min(APP.z4c.playerPos+roll,APP.z4c.cells); }
  else { Audio_.sfx('fail'); speak('Nie! Stoisz w miejscu.',0.9); }
  renderTrack();
  if(APP.z4c.playerPos>=APP.z4c.cells){
    document.getElementById('quiz-area').innerHTML=''; document.getElementById('dice-disp').textContent='🏆';
    APP.z4cSolved=(APP.z4cSolved||0)+1; const s=APP.z4cSolved>=4?3:APP.z4cSolved>=2?2:1;
    celebrate('Wygrałeś! 🏆','Dotarłeś do mety!',s,'z4c'); speak('Hurra! Wygrałeś!',0.9);
    document.getElementById('chin-roll-btn').style.display='none'; return;
  }
  setTimeout(()=>{
    document.getElementById('quiz-area').innerHTML='';
    APP.z4c.cpuPos=Math.min(APP.z4c.cpuPos+Math.floor(Math.random()*2)+1,APP.z4c.cells); renderTrack();
    if(APP.z4c.cpuPos>=APP.z4c.cells){
      document.getElementById('dice-disp').textContent='💚'; speak('Creeper dotarł do mety! Spróbuj jeszcze raz!',0.85);
      document.getElementById('chin-info').textContent='💚 Creeper wygrał! Zagraj jeszcze raz!'; document.getElementById('chin-roll-btn').style.display='none'; return;
    }
    setTimeout(()=>{ document.getElementById('chin-roll-btn').style.display=''; document.getElementById('dice-disp').textContent='🎲'; },600);
  },900);
}

/* =====================================================================
   ZONE 5 — LOGIKA I OBSERWACJA
   ===================================================================== */
const SEQ_ITEMS=['🔴','🔵','🟡','🟢','🟣','🟠'];
const SEQ_SHAPES=['⭐','🔺','⬛','⬢','💠','🔷'];
function initSequence(){ nextSequence(); }
function nextSequence(){
  const fullPool=Math.random()<0.5?SEQ_SHAPES:SEQ_ITEMS;
  const unitLen=2+(Math.random()<0.5?0:1);
  const unit=fullPool.slice().sort(()=>Math.random()-.5).slice(0,unitLen);
  const seq=[]; const shown=5;
  for(let i=0;i<shown;i++) seq.push(unit[i%unit.length]);
  const answer=unit[shown%unit.length];
  const row=document.getElementById('seq-row'); row.innerHTML='';
  seq.forEach(s=>{ const d=document.createElement('div'); d.className='seq-item'; d.textContent=s; row.appendChild(d); });
  const q=document.createElement('div'); q.className='seq-item qmark'; q.textContent='❓'; row.appendChild(q);
  const distractors=fullPool.filter(p=>!unit.includes(p)).sort(()=>Math.random()-.5).slice(0,2);
  const opts=[answer,...distractors].sort(()=>Math.random()-.5);
  const optWrap=document.getElementById('seq-opts'); optWrap.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('div'); b.className='seq-opt'; b.textContent=o;
    b.onclick=()=>{
      if(o===answer){
        b.classList.add('correct'); document.querySelectorAll('#seq-opts .seq-opt').forEach(x=>x.style.pointerEvents='none');
        APP.z5aSolved=(APP.z5aSolved||0)+1; const st=APP.z5aSolved>=6?3:APP.z5aSolved>=3?2:1;
        celebrate('Brawo! 🔢','Świetnie dopasowałeś wzór!',st,'z5a');
      } else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    optWrap.appendChild(b);
  });
  speak('Co pasuje w miejsce znaku zapytania?',0.85);
}

let diffFound=0, diffTotal=0, diffLevel=0;
function initDifference(){ diffLevel=0; nextDifference(); }
function nextDifference(){
  diffLevel++;
  const baseEmojis=['🐱','🐶','🦋','🌸','⭐','🍎','🐠','🌙'];
  const base=baseEmojis[Math.floor(Math.random()*baseEmojis.length)];
  const altPool=baseEmojis.filter(e=>e!==base);
  const oddCount=diffLevel>=3?2:1;
  const gridSize=diffLevel>=4?16:9, cols=Math.sqrt(gridSize);
  const grid=document.getElementById('diff-grid'); grid.innerHTML=''; grid.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  const oddIdxs=new Set(); while(oddIdxs.size<oddCount) oddIdxs.add(Math.floor(Math.random()*gridSize));
  diffFound=0; diffTotal=oddCount;
  document.getElementById('diff-found').textContent='0'; document.getElementById('diff-total').textContent=oddCount;
  const oddEmoji=altPool[Math.floor(Math.random()*altPool.length)];
  for(let i=0;i<gridSize;i++){
    const cell=document.createElement('div'); cell.className='diff-cell';
    const isOdd=oddIdxs.has(i); cell.textContent=isOdd?oddEmoji:base;
    cell.onclick=()=>{
      if(cell.classList.contains('found')) return;
      if(isOdd){
        cell.classList.add('found'); Audio_.sfx('success'); diffFound++; document.getElementById('diff-found').textContent=diffFound;
        if(diffFound>=diffTotal){ APP.z5bSolved=(APP.z5bSolved||0)+1; const st=APP.z5bSolved>=6?3:APP.z5bSolved>=3?2:1; setTimeout(()=>celebrate('Brawo! 🔍','Znalazłeś różnice!',st,'z5b'),300); }
      } else {
        Audio_.sfx('fail'); cell.style.transition='transform .1s'; cell.style.transform='translateX(-6px)';
        setTimeout(()=>{ cell.style.transform='translateX(6px)'; setTimeout(()=>cell.style.transform='',100); },100);
      }
    };
    grid.appendChild(cell);
  }
  speak('Dotknij to, co jest inne!',0.85);
}

const PUZZLES=[
  {emoji:['🌴','☀️','👽','🏖️','⛵','🌊'],cols:3},
  {emoji:['🚀','⭐','👽','🪐','🌙','💫'],cols:3},
  {emoji:['🧱','⛏️','💎','🟩','🟫','⭐'],cols:3},
  {emoji:['👑','🏰','💖','🌸','🦄','✨'],cols:3}
];
let puzCurrent=null, puzPlaced=[], puzDragState=null, puzGhost=null;
function initPuzzle(){
  puzCurrent=PUZZLES[Math.floor(Math.random()*PUZZLES.length)];
  puzPlaced=Array(puzCurrent.emoji.length).fill(null);
  const board=document.getElementById('puzzle-board'); board.innerHTML=''; board.style.gridTemplateColumns=`repeat(${puzCurrent.cols},64px)`;
  puzCurrent.emoji.forEach((_,i)=>{
    const slot=document.createElement('div'); slot.className='puz-slot'; slot.style.width='64px'; slot.style.height='64px'; slot.dataset.idx=i;
    slot.addEventListener('touchend',onPuzDropSlot,{passive:false}); slot.addEventListener('mouseup',onPuzDropSlot);
    board.appendChild(slot);
  });
  const tray=document.getElementById('puzzle-tray'); tray.innerHTML='';
  puzCurrent.emoji.map((e,i)=>({e,i})).sort(()=>Math.random()-.5).forEach(({e,i})=>{
    const p=document.createElement('div'); p.className='puz-piece'; p.textContent=e; p.dataset.correct=i;
    p.addEventListener('touchstart',onPuzDragStart,{passive:false}); p.addEventListener('mousedown',onPuzDragStartMouse);
    tray.appendChild(p);
  });
  speak('Przeciągnij części na właściwe miejsca!',0.85);
}
function puzMakeGhost(txt,x,y){ puzGhost=document.createElement('div'); puzGhost.className='drag-ghost'; puzGhost.textContent=txt; document.body.appendChild(puzGhost); puzMoveGhost(x,y); }
function puzMoveGhost(x,y){ if(puzGhost){ puzGhost.style.left=x+'px'; puzGhost.style.top=y+'px'; } }
function onPuzDragStart(e){ e.preventDefault(); const el=e.currentTarget; puzDragState={el}; el.classList.add('dragging'); const t=e.touches[0]; puzMakeGhost(el.textContent,t.clientX,t.clientY); document.addEventListener('touchmove',onPuzDragMove,{passive:false}); document.addEventListener('touchend',onPuzDragEnd); Audio_.sfx('pop'); }
function onPuzDragStartMouse(e){ const el=e.currentTarget; puzDragState={el}; el.classList.add('dragging'); puzMakeGhost(el.textContent,e.clientX,e.clientY); document.addEventListener('mousemove',onPuzDragMoveMouse); document.addEventListener('mouseup',onPuzDragEndMouse); Audio_.sfx('pop'); }
function onPuzDragMove(e){ e.preventDefault(); puzMoveGhost(e.touches[0].clientX,e.touches[0].clientY); }
function onPuzDragMoveMouse(e){ puzMoveGhost(e.clientX,e.clientY); }
function onPuzDragEnd(e){ if(!puzDragState) return; if(puzGhost) puzGhost.style.display='none'; const t=e.changedTouches[0]; const tgt=document.elementFromPoint(t.clientX,t.clientY); if(puzGhost) puzGhost.style.display=''; tryPuzDrop(tgt); cleanupPuzDrag(); }
function onPuzDragEndMouse(e){ if(!puzDragState) return; if(puzGhost) puzGhost.style.display='none'; const tgt=document.elementFromPoint(e.clientX,e.clientY); if(puzGhost) puzGhost.style.display=''; tryPuzDrop(tgt); document.removeEventListener('mousemove',onPuzDragMoveMouse); document.removeEventListener('mouseup',onPuzDragEndMouse); cleanupPuzDrag(); }
function onPuzDropSlot(e){ e.preventDefault(); if(!puzDragState) return; tryPuzDrop(e.currentTarget); cleanupPuzDrag(); }
function tryPuzDrop(target){
  if(!puzDragState) return;
  const slot=target?.closest?.('.puz-slot'); if(!slot||slot.children.length||slot.textContent) return;
  const correctIdx=+puzDragState.el.dataset.correct, slotIdx=+slot.dataset.idx;
  if(correctIdx===slotIdx){
    slot.textContent=puzDragState.el.textContent; slot.style.fontSize='2.2rem'; slot.style.display='flex'; slot.style.alignItems='center'; slot.style.justifyContent='center';
    puzDragState.el.remove(); Audio_.sfx('success'); puzPlaced[slotIdx]=true;
    if(puzPlaced.every(p=>p)){ APP.z5cSolved=(APP.z5cSolved||0)+1; const st=APP.z5cSolved>=5?3:APP.z5cSolved>=2?2:1; setTimeout(()=>celebrate('Świetnie! 🧩','Ułożyłeś cały obrazek!',st,'z5c'),300); }
  } else { Audio_.sfx('fail'); speak('Nie tu! Spróbuj gdzie indziej.',0.9); }
}
function cleanupPuzDrag(){ if(!puzDragState) return; puzDragState.el?.classList.remove('dragging'); puzDragState=null; if(puzGhost){ puzGhost.remove(); puzGhost=null; } document.removeEventListener('touchmove',onPuzDragMove); document.removeEventListener('touchend',onPuzDragEnd); }

const MAZES=[
  ["S....",".####",".....","####.","....G"],
  ["S..#.",".##..","....#","#.##.","...#G"],
  ["S....","####.","....#",".###.","....G"]
];
let mazeGrid=[], mazePlayer={r:0,c:0}, mazeGoal={r:0,c:0}, mazeRows=0, mazeCols=0, mazeTrail=new Set(), mazeTouchStart=null, mazeListenerAttached=false;
function initMaze(){
  const layout=MAZES[Math.floor(Math.random()*MAZES.length)];
  mazeRows=layout.length; mazeCols=layout[0].length; mazeGrid=layout.map(row=>row.split(''));
  for(let r=0;r<mazeRows;r++) for(let c=0;c<mazeCols;c++){ if(mazeGrid[r][c]==='S') mazePlayer={r,c}; if(mazeGrid[r][c]==='G') mazeGoal={r,c}; }
  mazeTrail=new Set([`${mazePlayer.r},${mazePlayer.c}`]);
  mazeSwipeInit(); renderMaze();
  speak('Przesuwaj palcem, aby dojść do mety!',0.85);
}
function renderMaze(){
  const wrap=document.getElementById('maze-wrap'); wrap.innerHTML='';
  const cellSize=Math.min(48,Math.floor(280/mazeCols));
  wrap.style.gridTemplateColumns=`repeat(${mazeCols}, ${cellSize}px)`; wrap.style.gridTemplateRows=`repeat(${mazeRows}, ${cellSize}px)`;
  for(let r=0;r<mazeRows;r++) for(let c=0;c<mazeCols;c++){
    const cell=document.createElement('div'); cell.className='maze-cell'; const ch=mazeGrid[r][c];
    if(ch==='#') cell.classList.add('wall'); else cell.classList.add('path');
    if(r===mazePlayer.r&&c===mazePlayer.c){ cell.classList.add('player'); cell.textContent='💙'; }
    else if(ch==='G'){ cell.classList.add('goal'); cell.textContent='🏆'; }
    else if(mazeTrail.has(`${r},${c}`)) cell.classList.add('trail');
    wrap.appendChild(cell);
  }
}
function mazeSwipeInit(){
  if(mazeListenerAttached) return; mazeListenerAttached=true;
  const wrap=document.getElementById('maze-wrap');
  wrap.addEventListener('touchstart',e=>{ mazeTouchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; },{passive:true});
  wrap.addEventListener('touchend',e=>{
    if(!mazeTouchStart) return;
    const dx=e.changedTouches[0].clientX-mazeTouchStart.x, dy=e.changedTouches[0].clientY-mazeTouchStart.y;
    if(Math.abs(dx)<20&&Math.abs(dy)<20){ mazeTouchStart=null; return; }
    if(Math.abs(dx)>Math.abs(dy)) moveMaze(dx>0?1:-1,0); else moveMaze(0,dy>0?1:-1);
    mazeTouchStart=null;
  });
}
function moveMaze(dc,dr){
  const nr=mazePlayer.r+dr, nc=mazePlayer.c+dc;
  if(nr<0||nr>=mazeRows||nc<0||nc>=mazeCols) return;
  if(mazeGrid[nr][nc]==='#'){ Audio_.sfx('fail'); return; }
  mazePlayer={r:nr,c:nc}; mazeTrail.add(`${nr},${nc}`); Audio_.sfx('click'); renderMaze();
  if(nr===mazeGoal.r&&nc===mazeGoal.c){ APP.z5dSolved=(APP.z5dSolved||0)+1; const st=APP.z5dSolved>=5?3:APP.z5dSolved>=2?2:1; setTimeout(()=>celebrate('Dotarłeś! 🏆','Pomogłeś dojść do mety!',st,'z5d'),300); }
}

/* =====================================================================
   ZONE 6 — UBIERANKI I KREATYWNA OPIEKA
   ===================================================================== */
const DRESS_CHARS={stich:'👽',wiola:'👧'};
const DRESS_THEMES=[
  {id:'pirates',name:'🏴‍☠️ Piraci',hat:['🏴‍☠️','👒','⛑️'],acc:['🦜','⚔️','🔭'],body:['🥻','🦺','👕'],feet:['🥾','👞','🩴']},
  {id:'princess',name:'👑 Księżniczki',hat:['👑','🎀','💐'],acc:['💍','🌸','✨'],body:['👗','💃','🎽'],feet:['👠','🩰','👟']},
  {id:'hero',name:'🦸 Superbohaterowie',hat:['🦸','🎭','🥽'],acc:['⚡','🛡️','💪'],body:['🦹','👕','🎽'],feet:['👟','🥾','🩴']},
  {id:'beach',name:'🏖️ Plażowi',hat:['🕶️','👒','🧢'],acc:['🏖️','🍹','🐚'],body:['🩱','👙','🩳'],feet:['🩴','👡','👟']},
  {id:'space',name:'🚀 Kosmiczni',hat:['🪐','👽','🛸'],acc:['🚀','⭐','🛰️'],body:['🥽','👨‍🚀','🎽'],feet:['👢','🥾','👟']}
];
let dressChar='stich', dressTheme='pirates', dressSel={hat:0,acc:0,body:0,feet:0};
function initDressup(){
  const toggle=document.getElementById('dress-char-toggle'); toggle.innerHTML='';
  [['stich','👽 Stich'],['wiola','👧 Wiola']].forEach(([k,l],i)=>{
    const b=document.createElement('button'); b.className=k===dressChar?'active':''; b.textContent=l;
    b.onclick=()=>{ dressChar=k; Audio_.sfx('click'); document.getElementById('dress-base').textContent=DRESS_CHARS[k]; document.querySelectorAll('#dress-char-toggle button').forEach((x,xi)=>x.classList.toggle('active',xi===i)); };
    toggle.appendChild(b);
  });
  document.getElementById('dress-base').textContent=DRESS_CHARS[dressChar];
  const themeRow=document.getElementById('dress-themes'); themeRow.innerHTML='';
  DRESS_THEMES.forEach(t=>{
    const b=document.createElement('button'); b.className='theme-btn'+(t.id===dressTheme?' active':''); b.textContent=t.name;
    b.onclick=()=>{ dressTheme=t.id; dressSel={hat:0,acc:0,body:0,feet:0}; Audio_.sfx('click'); initDressup(); };
    themeRow.appendChild(b);
  });
  renderWardrobe(); applyDressLayers();
  speak('Ubierz '+(dressChar==='stich'?'Sticha':'Wiolę')+'!',0.85);
}
function renderWardrobe(){
  const theme=DRESS_THEMES.find(t=>t.id===dressTheme);
  const wrap=document.getElementById('wardrobe'); wrap.innerHTML='';
  [['hat','Czapka'],['acc','Akcesoria'],['body','Strój'],['feet','Buty']].forEach(([cat,label])=>{
    const row=document.createElement('div'); row.className='wardrobe-row';
    row.innerHTML=`<div class="cat">${label}</div>`;
    theme[cat].forEach((emo,i)=>{
      const b=document.createElement('button'); b.className='cloth-btn'+(dressSel[cat]===i?' sel':''); b.textContent=emo||'∅';
      b.onclick=()=>{ dressSel[cat]=i; Audio_.sfx('dress'); applyDressLayers(); row.querySelectorAll('.cloth-btn').forEach((x,xi)=>x.classList.toggle('sel',xi===i)); };
      row.appendChild(b);
    });
    wrap.appendChild(row);
  });
}
function applyDressLayers(){
  const theme=DRESS_THEMES.find(t=>t.id===dressTheme);
  document.getElementById('dl-hat').textContent=theme.hat[dressSel.hat]||'';
  document.getElementById('dl-acc').textContent=theme.acc[dressSel.acc]||'';
  document.getElementById('dl-body').textContent=theme.body[dressSel.body]||'';
  document.getElementById('dl-feet').textContent=theme.feet[dressSel.feet]||'';
}
function celebrateDress(){ APP.z6aSolved=(APP.z6aSolved||0)+1; const st=APP.z6aSolved>=5?3:APP.z6aSolved>=2?2:1; celebrate('Wyglądasz świetnie! ✨','Gotowy strój!',st,'z6a'); }

const PETS={dog:'🐶',cat:'🐱',croc:'🐊'};
let petType='dog', petMeters={hunger:70,clean:70,fun:70,sleep:70}, petTimer=null;
function initPet(){
  const toggle=document.getElementById('pet-toggle'); toggle.innerHTML='';
  [['dog','🐶 Pies'],['cat','🐱 Kot'],['croc','🐊 Krokodyl']].forEach(([k,l],i)=>{
    const b=document.createElement('button'); b.className=k===petType?'active':''; b.textContent=l;
    b.onclick=()=>{ petType=k; Audio_.sfx('click'); document.getElementById('pet-stage').textContent=PETS[k]; document.querySelectorAll('#pet-toggle button').forEach((x,xi)=>x.classList.toggle('active',xi===i)); };
    toggle.appendChild(b);
  });
  document.getElementById('pet-stage').textContent=PETS[petType];
  petMeters={hunger:70,clean:70,fun:70,sleep:70}; renderPetMeters();
  clearInterval(petTimer);
  petTimer=setInterval(()=>{ ['hunger','clean','fun','sleep'].forEach(k=>petMeters[k]=Math.max(0,petMeters[k]-1)); renderPetMeters(); },4000);
  speak('Zaopiekuj się swoim zwierzakiem!',0.85);
}
function renderPetMeters(){
  const wrap=document.getElementById('pet-meters'); wrap.innerHTML='';
  const labels={hunger:['🍖 Głód','#f4a61a'],clean:['🧼 Czystość','#3dd5f3'],fun:['🎾 Zabawa','#4caf50'],sleep:['😴 Sen','#9b6dff']};
  Object.keys(petMeters).forEach(k=>{
    const [label,color]=labels[k];
    const row=document.createElement('div'); row.className='meter';
    row.innerHTML=`<div class="m-label">${label}</div><div class="m-bar"><div class="m-fill" style="width:${petMeters[k]}%;background:${color}"></div></div>`;
    wrap.appendChild(row);
  });
}
function petAction(action){
  const map={feed:'hunger',wash:'clean',play:'fun',sleep:'sleep'}; const key=map[action];
  petMeters[key]=Math.min(100,petMeters[key]+30); renderPetMeters();
  const stage=document.getElementById('pet-stage'); stage.classList.remove('happy'); void stage.offsetWidth; stage.classList.add('happy');
  Audio_.sfx({feed:'pop',wash:'click',play:'success',sleep:'click'}[action]||'click');
  speak({feed:'Mniam, dziękuję!',wash:'Teraz jestem czyściutki!',play:'To było super!',sleep:'Już się wyspałem!'}[action],0.9);
  if(Object.values(petMeters).every(v=>v>=85) && !APP.petCelebrated){
    APP.petCelebrated=true; APP.z6bSolved=(APP.z6bSolved||0)+1; const st=APP.z6bSolved>=5?3:APP.z6bSolved>=2?2:1;
    setTimeout(()=>{ celebrate('Wspaniały opiekun! 🐾','Twój zwierzak jest szczęśliwy!',st,'z6b'); APP.petCelebrated=false; },400);
  }
}

const INGREDIENTS=['🍞','🧀','🥬','🍅','🥓','🥒','🍳','🥕','🍗','🧈','🍇','🥑'];
const ING_NAMES={'🍞':'chleb','🧀':'ser','🥬':'sałata','🍅':'pomidor','🥓':'bekon','🥒':'ogórek','🍳':'jajko','🥕':'marchewka','🍗':'kurczak','🧈':'masło','🍇':'winogrona','🥑':'awokado'};
let cookPlateItems=[];
function initCooking(){
  cookPlateItems=[];
  const goals=['Zrób pyszną kanapkę! 🥪','Zrób kolorową sałatkę! 🥗','Przygotuj śniadanie! 🍳'];
  document.getElementById('cook-goal').textContent=goals[Math.floor(Math.random()*goals.length)];
  renderPlate();
  const tray=document.getElementById('cook-tray'); tray.innerHTML='';
  INGREDIENTS.slice().sort(()=>Math.random()-.5).slice(0,8).forEach(ing=>{
    const b=document.createElement('div'); b.className='ingredient'; b.textContent=ing;
    b.onclick=()=>{ if(cookPlateItems.length>=6) return; cookPlateItems.push(ing); Audio_.sfx('pop'); renderPlate(); speak(ING_NAMES[ing]||'składnik',0.9); };
    tray.appendChild(b);
  });
  speak('Dotykaj składniki, żeby ułożyć je na talerzu!',0.85);
}
function renderPlate(){ document.getElementById('cook-plate').innerHTML=cookPlateItems.map(i=>`<span>${i}</span>`).join(''); }
function serveDish(){
  if(!cookPlateItems.length){ speak('Dodaj coś na talerz!',0.9); return; }
  Audio_.sfx('success'); APP.z6cSolved=(APP.z6cSolved||0)+1;
  const st=cookPlateItems.length>=5?3:cookPlateItems.length>=3?2:1;
  celebrate('Smacznego! 🍽️','Twoje danie: '+cookPlateItems.map(i=>ING_NAMES[i]).join(', '),st,'z6c');
}

const NAIL_COLORS=['#ff6fa5','#ff3d3d','#ffd23d','#3dd5f3','#9b6dff','#4caf50','#fff','#222'];
let selNailColor=NAIL_COLORS[0];
function initSalon(){
  const nails=document.getElementById('nails'); nails.innerHTML='';
  for(let i=0;i<5;i++){ const n=document.createElement('div'); n.className='nail'; n.onclick=()=>{ n.style.background=selNailColor; Audio_.sfx('dress'); }; nails.appendChild(n); }
  const pal=document.getElementById('nail-palette'); pal.innerHTML='';
  NAIL_COLORS.forEach((c,i)=>{
    const s=document.createElement('div'); s.className='swatch'+(i===0?' sel':''); s.style.background=c;
    s.onclick=()=>{ selNailColor=c; document.querySelectorAll('#nail-palette .swatch').forEach(x=>x.classList.remove('sel')); s.classList.add('sel'); Audio_.sfx('click'); };
    pal.appendChild(s);
  });
  speak('Wybierz kolor i pomaluj paznokcie!',0.85);
}

/* =====================================================================
   GRY DODATKOWE: maluj po numerach, cienie, sortowanie, koraliki
   ===================================================================== */
const CBN_PICS=[
  {name:'Gwiazda',cols:6,cells:[0,0,1,1,0,0, 0,1,1,1,1,0, 1,1,1,1,1,1, 0,1,1,1,1,0, 0,1,0,0,1,0, 1,0,0,0,0,1],colors:{1:'#ffd23d'}},
  {name:'Łódka',cols:6,cells:[0,0,2,0,0,0, 0,2,2,2,0,0, 0,0,2,0,0,0, 0,0,2,0,0,0, 1,1,1,1,1,1, 0,1,1,1,1,0],colors:{1:'#8a5a2b',2:'#ff6fa5'}},
  {name:'Domek',cols:6,cells:[0,0,1,1,0,0, 0,1,1,1,1,0, 1,1,1,1,1,1, 0,2,2,2,2,0, 0,2,2,2,2,0, 0,2,3,3,2,0],colors:{1:'#e53935',2:'#3dd5f3',3:'#8a5a2b'}}
];
let cbnCurrent=null, cbnSelColor=null, cbnFilled=0, cbnTotal=0;
function initCBN(){
  cbnCurrent=CBN_PICS[Math.floor(Math.random()*CBN_PICS.length)];
  cbnFilled=0; cbnTotal=cbnCurrent.cells.filter(c=>c!==0).length; cbnSelColor=null;
  const grid=document.getElementById('cbn-grid'); grid.innerHTML=''; grid.style.gridTemplateColumns=`repeat(${cbnCurrent.cols},32px)`;
  cbnCurrent.cells.forEach(val=>{
    const cell=document.createElement('div'); cell.className='cbn-cell'; cell.style.width='32px'; cell.style.height='32px';
    if(val!==0){ cell.textContent=val; cell.onclick=()=>fillCBN(cell,val); } else cell.style.opacity='0';
    grid.appendChild(cell);
  });
  const pal=document.getElementById('cbn-palette'); pal.innerHTML='';
  Object.entries(cbnCurrent.colors).forEach(([num,color])=>{
    const sw=document.createElement('div'); sw.className='cbn-swatch'; sw.style.background=color; sw.textContent=num;
    sw.onclick=()=>{ cbnSelColor={num:+num,color}; document.querySelectorAll('.cbn-swatch').forEach(x=>x.classList.remove('sel')); sw.classList.add('sel'); Audio_.sfx('click'); };
    pal.appendChild(sw);
  });
  speak('Wybierz kolor i dotknij pól z tą samą cyfrą!',0.85);
}
function fillCBN(cell,val){
  if(cell.classList.contains('done')) return;
  if(!cbnSelColor){ speak('Najpierw wybierz kolor!',0.9); return; }
  if(cbnSelColor.num===val){
    cell.style.background=cbnSelColor.color; cell.classList.add('done'); cell.style.color='transparent'; Audio_.sfx('pop'); cbnFilled++;
    if(cbnFilled>=cbnTotal){ APP.cbnSolved=(APP.cbnSolved||0)+1; const st=APP.cbnSolved>=4?3:APP.cbnSolved>=2?2:1; setTimeout(()=>celebrate('Piękny obrazek! 🎨','To: '+cbnCurrent.name,st,'cbn'),300); }
  } else Audio_.sfx('fail');
}

const SHADOW_SET=['🐶','🐱','🐰','🐸','🦋','🐠','🌳','⭐','🚗','🎈','🍎','🌙'];
let shadowAnswer=null, shadowErr=0;
function initShadow(){ nextShadow(); }
function nextShadow(){
  shadowErr=0; shadowAnswer=SHADOW_SET[Math.floor(Math.random()*SHADOW_SET.length)];
  document.getElementById('shadow-target').textContent=shadowAnswer;
  const wrap=document.getElementById('shadow-opts'); wrap.innerHTML='';
  const distractors=SHADOW_SET.filter(s=>s!==shadowAnswer).sort(()=>Math.random()-.5).slice(0,2);
  [shadowAnswer,...distractors].sort(()=>Math.random()-.5).forEach(opt=>{
    const b=document.createElement('div'); b.className='shadow-opt'; b.textContent=opt;
    b.onclick=()=>{
      if(opt===shadowAnswer){ b.classList.add('correct'); APP.shadowSolved=(APP.shadowSolved||0)+1; const st=APP.shadowSolved>=6?3:APP.shadowSolved>=3?2:1; celebrate('Brawo! 🌚','To było to!',st,'shadow'); }
      else { b.classList.add('wrong'); shadowErr++; Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),500);
        if(shadowErr>=2){ const c=[...wrap.children].find(x=>x.textContent===shadowAnswer); if(c) pointAt(c,'Ten obrazek pasuje do cienia'); shadowErr=0; } }
    };
    wrap.appendChild(b);
  });
  speak('Który obrazek pasuje do cienia?',0.85);
}

const SORT_SETS=[
  {goal:'Rozdziel zwierzęta i pojazdy!',bins:[{id:'animals',label:'🐾 Zwierzęta',color:'#4caf50'},{id:'vehicles',label:'🚗 Pojazdy',color:'#3dd5f3'}],
    items:[{e:'🐶',bin:'animals'},{e:'🚗',bin:'vehicles'},{e:'🐱',bin:'animals'},{e:'✈️',bin:'vehicles'},{e:'🐸',bin:'animals'},{e:'🚂',bin:'vehicles'},{e:'🐦',bin:'animals'},{e:'🚲',bin:'vehicles'}]},
  {goal:'Rozdziel owoce i warzywa!',bins:[{id:'fruit',label:'🍎 Owoce',color:'#ff6fa5'},{id:'veg',label:'🥦 Warzywa',color:'#4caf50'}],
    items:[{e:'🍎',bin:'fruit'},{e:'🥕',bin:'veg'},{e:'🍌',bin:'fruit'},{e:'🥦',bin:'veg'},{e:'🍇',bin:'fruit'},{e:'🍅',bin:'veg'},{e:'🍓',bin:'fruit'},{e:'🥒',bin:'veg'}]},
  {goal:'Rozdziel duże i małe rzeczy!',bins:[{id:'big',label:'🔵 Duże',color:'#9b6dff'},{id:'small',label:'🔹 Małe',color:'#f4a61a'}],
    items:[{e:'🐘',bin:'big'},{e:'🐜',bin:'small'},{e:'🏠',bin:'big'},{e:'🐭',bin:'small'},{e:'🐋',bin:'big'},{e:'🐝',bin:'small'},{e:'🚢',bin:'big'},{e:'🔘',bin:'small'}]}
];
let sortCurrent=null, sortPlacedCount=0, sortDragState=null, sortGhost=null;
function initSort(){
  sortCurrent=SORT_SETS[Math.floor(Math.random()*SORT_SETS.length)]; sortPlacedCount=0;
  document.getElementById('sort-goal').textContent=sortCurrent.goal;
  const itemsWrap=document.getElementById('sort-items'); itemsWrap.innerHTML='';
  sortCurrent.items.slice().sort(()=>Math.random()-.5).forEach(it=>{
    const el=document.createElement('div'); el.className='sort-item'; el.textContent=it.e; el.dataset.bin=it.bin;
    el.addEventListener('touchstart',onSortDragStart,{passive:false}); el.addEventListener('mousedown',onSortDragStartMouse);
    itemsWrap.appendChild(el);
  });
  const binsWrap=document.getElementById('sort-bins'); binsWrap.innerHTML='';
  sortCurrent.bins.forEach(b=>{
    const binEl=document.createElement('div'); binEl.className='bin'; binEl.style.borderColor=b.color; binEl.dataset.binId=b.id;
    binEl.innerHTML=`<div class="bin-label" style="color:${b.color}">${b.label}</div><div class="bin-content"></div>`;
    binEl.addEventListener('touchend',onSortDropBin,{passive:false}); binEl.addEventListener('mouseup',onSortDropBin);
    binsWrap.appendChild(binEl);
  });
  speak(sortCurrent.goal,0.85);
}
function sortMakeGhost(txt,x,y){ sortGhost=document.createElement('div'); sortGhost.className='drag-ghost'; sortGhost.style.background='transparent'; sortGhost.style.fontSize='2.2rem'; sortGhost.textContent=txt; document.body.appendChild(sortGhost); sortMoveGhost(x,y); }
function sortMoveGhost(x,y){ if(sortGhost){ sortGhost.style.left=x+'px'; sortGhost.style.top=y+'px'; } }
function onSortDragStart(e){ e.preventDefault(); const el=e.currentTarget; if(el.classList.contains('used')) return; sortDragState={el}; el.style.opacity='.3'; const t=e.touches[0]; sortMakeGhost(el.textContent,t.clientX,t.clientY); document.addEventListener('touchmove',onSortDragMove,{passive:false}); document.addEventListener('touchend',onSortDragEnd); Audio_.sfx('pop'); }
function onSortDragStartMouse(e){ const el=e.currentTarget; if(el.classList.contains('used')) return; sortDragState={el}; el.style.opacity='.3'; sortMakeGhost(el.textContent,e.clientX,e.clientY); document.addEventListener('mousemove',onSortDragMoveMouse); document.addEventListener('mouseup',onSortDragEndMouse); Audio_.sfx('pop'); }
function onSortDragMove(e){ e.preventDefault(); sortMoveGhost(e.touches[0].clientX,e.touches[0].clientY); }
function onSortDragMoveMouse(e){ sortMoveGhost(e.clientX,e.clientY); }
function onSortDragEnd(e){ if(!sortDragState) return; if(sortGhost) sortGhost.style.display='none'; const t=e.changedTouches[0]; const tgt=document.elementFromPoint(t.clientX,t.clientY); if(sortGhost) sortGhost.style.display=''; trySortDrop(tgt); cleanupSortDrag(); }
function onSortDragEndMouse(e){ if(!sortDragState) return; if(sortGhost) sortGhost.style.display='none'; const tgt=document.elementFromPoint(e.clientX,e.clientY); if(sortGhost) sortGhost.style.display=''; trySortDrop(tgt); document.removeEventListener('mousemove',onSortDragMoveMouse); document.removeEventListener('mouseup',onSortDragEndMouse); cleanupSortDrag(); }
function onSortDropBin(e){ e.preventDefault(); if(!sortDragState) return; trySortDrop(e.currentTarget); cleanupSortDrag(); }
function trySortDrop(target){
  if(!sortDragState) return;
  const bin=target?.closest?.('.bin'); const el=sortDragState.el;
  if(!bin){ el.style.opacity=''; return; }
  if(el.dataset.bin===bin.dataset.binId){
    el.classList.add('used'); el.style.opacity='.25';
    bin.querySelector('.bin-content').insertAdjacentHTML('beforeend',`<span>${el.textContent}</span>`);
    Audio_.sfx('success'); sortPlacedCount++;
    if(sortPlacedCount>=sortCurrent.items.length){ APP.sortSolved=(APP.sortSolved||0)+1; const st=APP.sortSolved>=5?3:APP.sortSolved>=2?2:1; setTimeout(()=>celebrate('Super sortowanie! 📦','Wszystko na swoim miejscu!',st,'sort'),300); }
  } else { el.style.opacity=''; Audio_.sfx('fail'); speak('Spróbuj innego pojemnika!',0.9); }
}
function cleanupSortDrag(){ if(!sortDragState) return; sortDragState=null; if(sortGhost){ sortGhost.remove(); sortGhost=null; } document.removeEventListener('touchmove',onSortDragMove); document.removeEventListener('touchend',onSortDragEnd); }

const BEAD_COLORS=['#ff6fa5','#ffd23d','#3dd5f3','#9b6dff','#4caf50','#ff8a65','#fff'];
let beadString=[];
function initBeads(){
  beadString=[]; renderBeadString();
  const pal=document.getElementById('bead-palette'); pal.innerHTML='';
  BEAD_COLORS.forEach(c=>{
    const b=document.createElement('div'); b.className='bead-pick'; b.style.background=c;
    b.onclick=()=>{ if(beadString.length>=30) return; beadString.push(c); Audio_.sfx('pop'); renderBeadString(); };
    pal.appendChild(b);
  });
  speak('Twórz własny wzór z koralików!',0.85);
}
function renderBeadString(){ const wrap=document.getElementById('bead-string'); wrap.innerHTML=''; beadString.forEach(c=>{ const b=document.createElement('div'); b.className='bead'; b.style.background=c; wrap.appendChild(b); }); }
function clearBeads(){ beadString=[]; renderBeadString(); Audio_.sfx('click'); }

/* =====================================================================
   ROZSZERZENIE: personalizacja, nowe strefy, sesja, certyfikat, tablica
   ===================================================================== */
Object.assign(TUTORIALS,{
  z7a:'Popatrz, jaki kolor jest napisany, i dotknij go na tablicy. Powodzenia!',
  z7b:'Przeciągnij każdy przedmiot do koszyka w tym samym kolorze.',
  z7c:'Wybierz dwa kolory i zobacz, jaki nowy kolor powstanie po ich zmieszaniu!',
  z8a:'To są kształty. Dotykaj je, żeby poznać ich nazwy. Spróbuj!',
  z8b:'Popatrz na kształt i wybierz przedmiot, który tak właśnie wygląda.',
  z9a:'Dotknij zwierzę, a usłyszysz, jaki wydaje dźwięk!',
  z9b:'Gdzie mieszka to zwierzę? Wybierz jego dom.',
  z9c:'Co lubi jeść to zwierzę? Wybierz jego ulubione jedzenie.',
  z10a:'Kiedy robimy tę czynność? Wybierz właściwą porę dnia.',
  z10b:'Popatrz na zegar i wybierz, która jest godzina.',
  z11a:'Dotykaj klawisze pianina i twórz własne melodie!',
  z11b:'Zapamiętaj kolejność świecących pól, a potem powtórz ją!'
});
/* dodatkowe odznaki */
ACHIEVEMENTS.push(
  {id:'artist',emoji:'🎨',name:'Artysta',test:p=>(p.stars['z7c']||0)>=1||(p.stars['cbn']||0)>=2},
  {id:'shapes',emoji:'🔷',name:'Mistrz kształtów',test:p=>(p.stars['z8a']||0)>=1&&(p.stars['z8b']||0)>=1},
  {id:'zoolog',emoji:'🦁',name:'Przyjaciel zwierząt',test:p=>['z9a','z9b','z9c'].every(g=>(p.stars[g]||0)>=1)},
  {id:'musician',emoji:'🎹',name:'Muzyk',test:p=>(p.stars['z11b']||0)>=1}
);

/* ---------- PERSONALIZACJA (imię + awatar) ---------- */
const AVATARS=['😀','😎','🦊','🐱','🐶','🦄','🐸','🦁','🐼','🐯','👽','🤖'];
let pendingAvatar='😀';
function renderAvatarPicker(){
  const wrap=document.getElementById('avatar-picker'); wrap.innerHTML='';
  AVATARS.forEach((a,i)=>{
    const b=document.createElement('button'); b.textContent=a;
    b.style.cssText='font-size:2rem;width:56px;height:56px;border-radius:14px;border:3px solid '+(i===0?'#f4a61a':'rgba(255,255,255,.25)')+';background:rgba(255,255,255,.08);cursor:pointer';
    b.onclick=()=>{ pendingAvatar=a; Audio_.sfx('pop'); [...wrap.children].forEach(c=>c.style.borderColor='rgba(255,255,255,.25)'); b.style.borderColor='#f4a61a'; };
    wrap.appendChild(b);
  });
}
function finishOnboard(){
  const name=(document.getElementById('name-input').value||'').trim().slice(0,12);
  PROGRESS.childName=name||'Przyjacielu'; PROGRESS.avatar=pendingAvatar; saveProgress();
  Audio_.sfx('levelup');
  enterMap();
  speak('Witaj '+PROGRESS.childName+'! Wybierz strefę i baw się dobrze!',0.85);
}
function updateGreeting(){
  const g=document.getElementById('map-greeting');
  if(g) g.textContent=PROGRESS.childName?`${PROGRESS.avatar||'🙂'} Cześć, ${PROGRESS.childName}!`:'';
}

/* ---------- SESJA / STATYSTYKI / LIMIT CZASU ---------- */
let sessionTimer=null;
function ensureStats(){
  const today=todayStr();
  if(!PROGRESS.stats || PROGRESS.stats.date!==today) PROGRESS.stats={date:today,seconds:0,zones:{}};
}
function startSession(){
  ensureStats(); clearInterval(sessionTimer);
  sessionTimer=setInterval(()=>{
    ensureStats(); PROGRESS.stats.seconds+=5; saveProgress();
    const lim=PROGRESS.timeLimit||0;
    if(lim>0 && PROGRESS.stats.seconds>=lim*60) showTimeWarn();
  },5000);
}
function recordZoneVisit(zoneId){ ensureStats(); PROGRESS.stats.zones[zoneId]=(PROGRESS.stats.zones[zoneId]||0)+1; saveProgress(); }
function fmtTime(s){ const m=Math.floor(s/60); return m<1?'<1 min':m+' min'; }
function topZone(){
  ensureStats(); const z=PROGRESS.stats.zones; let best=null,bv=0;
  for(const k in z) if(z[k]>bv){ bv=z[k]; best=k; }
  const found=ZONES.find(x=>x.id===best); return found?found.name:'—';
}
function showTimeWarn(){
  if(document.getElementById('timer-warn-el')) return;
  const el=document.createElement('div'); el.className='timer-warn show'; el.id='timer-warn-el';
  el.innerHTML=`<div style="font-size:4rem">⏰</div><div style="font-size:1.5rem;font-weight:900;color:var(--gold);margin:12px 0">Czas na przerwę!</div>
    <div style="opacity:.85;max-width:300px">Pobawiliśmy się już dużo. Odpocznij chwilę dla oczu! 👀</div>
    <button class="big-btn" style="margin-top:18px" onclick="document.getElementById('timer-warn-el').remove()">OK 😊</button>`;
  document.body.appendChild(el); speak('Czas na przerwę! Odpocznij chwilę.',0.82);
}

/* ---------- LICZNIK ODWIEDZIN (lokalny, offline) ---------- */
function bumpVisits(){
  let n=0; try{ n=parseInt(localStorage.getItem('edwyspa_visits')||'0',10)||0; }catch(e){}
  n++; try{ localStorage.setItem('edwyspa_visits',String(n)); }catch(e){}
  renderVisits(n);
}
function renderVisits(n){
  if(n===undefined){ try{ n=parseInt(localStorage.getItem('edwyspa_visits')||'0',10)||0; }catch(e){ n=0; } }
  const el=document.getElementById('visit-counter'); if(el) el.textContent='👣 Odwiedziny: '+n;
}

/* ---------- CERTYFIKAT ---------- */
function renderCertificate(){
  const box=document.getElementById('cert-box');
  const d=new Date(); const date=d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
  box.innerHTML=`<div class="cert-seal">🏆</div><h2>CERTYFIKAT</h2>
    <p>Ten certyfikat otrzymuje:</p>
    <div class="cert-name">${(PROGRESS.avatar||'🌟')} ${PROGRESS.childName||'Mały Odkrywca'}</div>
    <p>za wspaniałą naukę i zabawę na<br><b>Edukacyjnej Wyspie</b>!</p>
    <div class="cert-stars">${'⭐'.repeat(Math.min(5,Math.max(1,Math.ceil(PROGRESS.level/4))))}</div>
    <p>Poziom ${PROGRESS.level} • ${PROGRESS.totalStars} gwiazdek • ${PROGRESS.stickers.length} odznak</p>
    <p style="margin-top:10px;font-size:.82rem;opacity:.7">Data: ${date}</p>`;
  Audio_.sfx('success');
}

/* ---------- TABLICA RYSUNKOWA ---------- */
const BOARD_COLORS=['#ff3b30','#ff9500','#ffd23d','#4caf50','#3dd5f3','#9b6dff','#ff6fa5','#fff','#000'];
let boardCtx=null,boardCanvas=null,boardColor='#ff3b30',boardErasing=false,boardDrawing=false,boardLast=null,boardEventsBound=false;
function initBoard(){
  boardCanvas=document.getElementById('board-canvas'); boardCtx=boardCanvas.getContext('2d');
  boardCtx.fillStyle='#fffef8'; boardCtx.fillRect(0,0,boardCanvas.width,boardCanvas.height);
  const pal=document.getElementById('board-palette'); pal.innerHTML='';
  BOARD_COLORS.forEach((c,i)=>{ const b=document.createElement('div'); b.className='bead-pick'+(i===0?' sel':''); b.style.background=c;
    b.onclick=()=>{ boardColor=c; boardErasing=false; document.getElementById('board-erase-btn').classList.remove('green'); document.querySelectorAll('#board-palette .bead-pick').forEach(x=>x.style.outline=''); b.style.outline='3px solid #fff'; Audio_.sfx('click'); };
    if(i===0) b.style.outline='3px solid #fff'; pal.appendChild(b);
  });
  if(!boardEventsBound){ bindBoardEvents(); boardEventsBound=true; }
  speak('Rysuj, co tylko chcesz!',0.85);
}
function bindBoardEvents(){
  const pos=(cx,cy)=>{ const r=boardCanvas.getBoundingClientRect(); return {x:(cx-r.left)*(boardCanvas.width/r.width),y:(cy-r.top)*(boardCanvas.height/r.height)}; };
  const start=(cx,cy)=>{ boardDrawing=true; boardLast=pos(cx,cy); };
  const move=(cx,cy)=>{ if(!boardDrawing) return; const p=pos(cx,cy); boardCtx.beginPath(); boardCtx.moveTo(boardLast.x,boardLast.y); boardCtx.lineTo(p.x,p.y); boardCtx.strokeStyle=boardErasing?'#fffef8':boardColor; boardCtx.lineWidth=boardErasing?22:8; boardCtx.lineCap='round'; boardCtx.stroke(); boardLast=p; };
  boardCanvas.addEventListener('touchstart',e=>{e.preventDefault();start(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  boardCanvas.addEventListener('touchmove',e=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
  boardCanvas.addEventListener('touchend',()=>{boardDrawing=false;});
  boardCanvas.addEventListener('mousedown',e=>start(e.clientX,e.clientY));
  boardCanvas.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  boardCanvas.addEventListener('mouseup',()=>{boardDrawing=false;});
  boardCanvas.addEventListener('mouseleave',()=>{boardDrawing=false;});
}
function boardClear(){ if(!boardCtx) return; boardCtx.fillStyle='#fffef8'; boardCtx.fillRect(0,0,boardCanvas.width,boardCanvas.height); Audio_.sfx('click'); }
function boardErase(){ boardErasing=!boardErasing; document.getElementById('board-erase-btn').classList.toggle('green',boardErasing); Audio_.sfx('click'); }

/* =====================================================================
   STREFA 7 — KOLORY
   ===================================================================== */
const COLORS12=[
  {name:'czerwony',hex:'#e53935'},{name:'niebieski',hex:'#1e88e5'},{name:'żółty',hex:'#fdd835'},
  {name:'zielony',hex:'#43a047'},{name:'pomarańczowy',hex:'#fb8c00'},{name:'fioletowy',hex:'#8e24aa'},
  {name:'różowy',hex:'#ec407a'},{name:'brązowy',hex:'#6d4c41'},{name:'czarny',hex:'#212121'},
  {name:'biały',hex:'#fafafa'},{name:'szary',hex:'#9e9e9e'},{name:'turkusowy',hex:'#26c6da'}
];
let colorTarget=null,colorSolved=0;
function initColorClick(){ colorSolved=0; nextColorClick(); }
function nextColorClick(){
  colorTarget=COLORS12[Math.floor(Math.random()*COLORS12.length)];
  document.getElementById('color-prompt').textContent='Kliknij kolor: '+colorTarget.name.toUpperCase();
  speak('Kliknij kolor '+colorTarget.name,0.85);
  const grid=document.getElementById('color-grid'); grid.innerHTML='';
  COLORS12.slice().sort(()=>Math.random()-.5).forEach(c=>{
    const cell=document.createElement('div'); cell.className='color-cell'; cell.style.background=c.hex;
    cell.onclick=()=>{
      if(c.name===colorTarget.name){ cell.classList.add('correct'); Audio_.sfx('success'); colorSolved++;
        const st=colorSolved>=6?3:colorSolved>=3?2:1;
        if(colorSolved>=3) setStars('z7a',st);
        setTimeout(()=>{ if(colorSolved>=6){ celebrate('Mistrz kolorów! 🎨','Znasz wszystkie kolory!',3,'z7a'); colorSolved=0; } else { speak('Brawo!',0.9); nextColorClick(); } },500);
      } else { cell.classList.add('wrong'); Audio_.sfx('fail'); speak('To '+c.name+'. Szukamy '+colorTarget.name+'!',0.85); setTimeout(()=>cell.classList.remove('wrong'),500); }
    };
    grid.appendChild(cell);
  });
}
let csortSel=null,csortPlaced=0,csortTotal=0;
function initColorSort(){
  const palette=COLORS12.slice().sort(()=>Math.random()-.5).slice(0,3);
  csortPlaced=0; csortSel=null;
  const items=[]; palette.forEach(c=>{ for(let i=0;i<2;i++) items.push(c); });
  csortTotal=items.length;
  document.getElementById('csort-goal').textContent='Dotknij przedmiot, potem koszyk w tym kolorze!';
  const itemsWrap=document.getElementById('csort-items'); itemsWrap.innerHTML='';
  items.sort(()=>Math.random()-.5).forEach((c,idx)=>{
    const el=document.createElement('div'); el.className='color-cell'; el.style.width='54px'; el.style.height='54px'; el.style.background=c.hex; el.dataset.name=c.name;
    el.onclick=()=>{ if(el.classList.contains('used')) return; csortSel=el; document.querySelectorAll('#csort-items .color-cell').forEach(x=>x.style.outline=''); el.style.outline='4px solid #fff'; Audio_.sfx('pop'); };
    itemsWrap.appendChild(el);
  });
  const binsWrap=document.getElementById('csort-bins'); binsWrap.innerHTML='';
  palette.forEach(c=>{
    const bin=document.createElement('div'); bin.className='bin'; bin.style.borderColor=c.hex; bin.dataset.name=c.name;
    bin.innerHTML=`<div class="bin-label" style="color:${c.hex}">${c.name}</div><div class="bin-content"></div>`;
    bin.onclick=()=>{
      if(!csortSel){ speak('Najpierw dotknij przedmiot!',0.9); return; }
      if(csortSel.dataset.name===c.name){ csortSel.classList.add('used'); csortSel.style.opacity='.2'; csortSel.style.outline='';
        bin.querySelector('.bin-content').insertAdjacentHTML('beforeend',`<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${c.hex}"></span>`);
        Audio_.sfx('success'); csortSel=null; csortPlaced++;
        if(csortPlaced>=csortTotal){ const st=3; setTimeout(()=>celebrate('Świetne sortowanie! 📦','Wszystkie kolory na miejscu!',st,'z7b'),300); }
      } else { Audio_.sfx('fail'); speak('To inny kolor!',0.9); }
    };
    binsWrap.appendChild(bin);
  });
  speak('Posortuj kolory do koszyków!',0.85);
}
const MIX_TABLE={'niebieski+żółty':{name:'zielony',hex:'#43a047'},'żółty+niebieski':{name:'zielony',hex:'#43a047'},
  'czerwony+żółty':{name:'pomarańczowy',hex:'#fb8c00'},'żółty+czerwony':{name:'pomarańczowy',hex:'#fb8c00'},
  'czerwony+niebieski':{name:'fioletowy',hex:'#8e24aa'},'niebieski+czerwony':{name:'fioletowy',hex:'#8e24aa'},
  'czerwony+biały':{name:'różowy',hex:'#ec407a'},'biały+czerwony':{name:'różowy',hex:'#ec407a'}};
const MIX_PRIMARIES=[{name:'czerwony',hex:'#e53935'},{name:'niebieski',hex:'#1e88e5'},{name:'żółty',hex:'#fdd835'},{name:'biały',hex:'#fafafa'}];
let mixSel=[];
function initColorMix(){
  mixSel=[]; document.getElementById('mix-result').textContent='❓'; document.getElementById('mix-result').style.background='#222';
  document.getElementById('mix-goal').textContent='Wybierz dwa kolory i zmieszaj je!';
  const row=document.getElementById('mix-row'); row.innerHTML='';
  MIX_PRIMARIES.forEach(c=>{
    const b=document.createElement('div'); b.className='mix-pick'; b.style.background=c.hex; b.dataset.name=c.name;
    b.onclick=()=>{
      if(mixSel.length>=2){ mixSel=[]; document.querySelectorAll('#mix-row .mix-pick').forEach(x=>x.classList.remove('sel')); document.getElementById('mix-result').textContent='❓'; document.getElementById('mix-result').style.background='#222'; }
      mixSel.push(c); b.classList.add('sel'); Audio_.sfx('pop');
      if(mixSel.length===2) doMix();
    };
    row.appendChild(b);
  });
  speak('Wybierz dwa kolory, żeby je zmieszać!',0.85);
}
function doMix(){
  const key=mixSel[0].name+'+'+mixSel[1].name; const res=MIX_TABLE[key];
  const out=document.getElementById('mix-result');
  if(res){ out.textContent=''; out.style.background=res.hex; document.getElementById('mix-goal').textContent='Powstał kolor: '+res.name.toUpperCase()+'! 🎉';
    Audio_.sfx('success'); speak(mixSel[0].name+' i '+mixSel[1].name+' to '+res.name+'!',0.85);
    setStars('z7c',Math.max(2,getStars('z7c'))); setTimeout(()=>celebrate('Wow! 🌈','Zrobiłeś kolor '+res.name+'!',3,'z7c'),700);
  } else { out.textContent='🤔'; out.style.background='#555'; document.getElementById('mix-goal').textContent='Spróbuj innych dwóch kolorów!'; Audio_.sfx('click'); }
}

/* =====================================================================
   STREFA 8 — KSZTAŁTY
   ===================================================================== */
function shapeSVG(type,color='#5b8def',size=54){
  const c=color;
  switch(type){
    case 'circle': return `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="${c}"/></svg>`;
    case 'square': return `<svg viewBox="0 0 60 60"><rect x="6" y="6" width="48" height="48" rx="4" fill="${c}"/></svg>`;
    case 'triangle': return `<svg viewBox="0 0 60 60"><polygon points="30,6 54,52 6,52" fill="${c}"/></svg>`;
    case 'rect': return `<svg viewBox="0 0 60 60"><rect x="4" y="16" width="52" height="28" rx="4" fill="${c}"/></svg>`;
    case 'diamond': return `<svg viewBox="0 0 60 60"><polygon points="30,4 56,30 30,56 4,30" fill="${c}"/></svg>`;
    case 'star': return `<svg viewBox="0 0 60 60"><polygon points="30,4 37,23 57,23 41,36 47,55 30,43 13,55 19,36 3,23 23,23" fill="${c}"/></svg>`;
    case 'heart': return `<svg viewBox="0 0 60 60"><path d="M30 52 C2 33 10 8 30 22 C50 8 58 33 30 52 Z" fill="${c}"/></svg>`;
    default: return '';
  }
}
const SHAPES=[
  {type:'circle',name:'koło',color:'#e53935'},{type:'square',name:'kwadrat',color:'#1e88e5'},
  {type:'triangle',name:'trójkąt',color:'#43a047'},{type:'rect',name:'prostokąt',color:'#fb8c00'},
  {type:'diamond',name:'romb',color:'#8e24aa'},{type:'star',name:'gwiazda',color:'#fdd835'}
];
function initShapeLearn(){
  const grid=document.getElementById('shape-grid'); grid.innerHTML='';
  document.getElementById('shape-prompt').textContent='Dotknij kształt, aby poznać jego nazwę!';
  SHAPES.forEach(s=>{
    const cell=document.createElement('div'); cell.className='shape-cell';
    cell.innerHTML=shapeSVG(s.type,s.color)+`<div class="sname">${s.name}</div>`;
    cell.onclick=()=>{ Audio_.sfx('pop'); speak('To '+s.name,0.8); cell.style.transform='scale(.92)'; setTimeout(()=>cell.style.transform='',150); };
    grid.appendChild(cell);
  });
  setStars('z8a',Math.max(1,getStars('z8a')));
  speak('Poznaj kształty! Dotykaj je.',0.85);
}
const SHAPE_OBJECTS={circle:['🍕','⚽','🌕','🍩'],square:['📦','🧱','🟦','📺'],triangle:['🍕','⛰️','🔺','🍦'],rect:['🚪','📱','🚌','🧱'],diamond:['💎','🔶','🪁','♦️'],star:['⭐','🌟','✨','🌠']};
let shapeMatchTarget=null,shapeMatchSolved=0;
function initShapeMatch(){ shapeMatchSolved=0; nextShapeMatch(); }
function nextShapeMatch(){
  shapeMatchTarget=SHAPES[Math.floor(Math.random()*SHAPES.length)];
  document.getElementById('shape-big').innerHTML=shapeSVG(shapeMatchTarget.type,shapeMatchTarget.color,96);
  const correct=SHAPE_OBJECTS[shapeMatchTarget.type][Math.floor(Math.random()*SHAPE_OBJECTS[shapeMatchTarget.type].length)];
  const others=SHAPES.filter(s=>s.type!==shapeMatchTarget.type).sort(()=>Math.random()-.5).slice(0,2).map(s=>SHAPE_OBJECTS[s.type][0]);
  const opts=[correct,...others].sort(()=>Math.random()-.5);
  const wrap=document.getElementById('shapematch-opts'); wrap.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('div'); b.className='shape-opt'; b.textContent=o;
    b.onclick=()=>{
      if(o===correct){ b.classList.add('correct'); shapeMatchSolved++; const st=shapeMatchSolved>=6?3:shapeMatchSolved>=3?2:1; celebrate('Brawo! 🔷','To '+shapeMatchTarget.name+'!',st,'z8b'); }
      else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Szukamy kształtu: '+shapeMatchTarget.name,0.85); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
  speak('Który przedmiot ma kształt: '+shapeMatchTarget.name+'?',0.85);
}

/* =====================================================================
   STREFA 9 — ZWIERZĘTA
   ===================================================================== */
const ANIMALS=[
  {emoji:'🐶',name:'pies',sound:'Hau hau!',home:'🏠',homeName:'buda',food:'🦴'},
  {emoji:'🐱',name:'kot',sound:'Miau!',home:'🏠',homeName:'dom',food:'🐟'},
  {emoji:'🐮',name:'krowa',sound:'Muuu!',home:'🚜',homeName:'obora',food:'🌾'},
  {emoji:'🐷',name:'świnka',sound:'Chrum chrum!',home:'🚜',homeName:'zagroda',food:'🌽'},
  {emoji:'🐔',name:'kura',sound:'Ko ko ko!',home:'🪺',homeName:'kurnik',food:'🌾'},
  {emoji:'🐸',name:'żaba',sound:'Kum kum!',home:'🌊',homeName:'staw',food:'🦟'},
  {emoji:'🐝',name:'pszczoła',sound:'Bzzz!',home:'🍯',homeName:'ul',food:'🌸'},
  {emoji:'🦁',name:'lew',sound:'Rrraa!',home:'🌳',homeName:'sawanna',food:'🥩'},
  {emoji:'🐑',name:'owca',sound:'Beee!',home:'🚜',homeName:'zagroda',food:'🌿'},
  {emoji:'🦆',name:'kaczka',sound:'Kwa kwa!',home:'🌊',homeName:'staw',food:'🍞'},
  {emoji:'🐴',name:'koń',sound:'Ihaha!',home:'🚜',homeName:'stajnia',food:'🥕'},
  {emoji:'🐭',name:'myszka',sound:'Pi pi!',home:'🕳️',homeName:'norka',food:'🧀'}
];
function initAnimalSounds(){
  const grid=document.getElementById('animal-grid'); grid.innerHTML='';
  ANIMALS.forEach(a=>{
    const cell=document.createElement('div'); cell.className='animal-cell'; cell.textContent=a.emoji;
    cell.onclick=()=>{ Audio_.sfx('pop'); cell.style.transform='scale(1.25)'; setTimeout(()=>cell.style.transform='',250); speak(a.name+' robi: '+a.sound,0.82,1.25); };
    grid.appendChild(cell);
  });
  setStars('z9a',Math.max(1,getStars('z9a')));
  speak('Dotknij zwierzę i posłuchaj jego głosu!',0.85);
}
let homeTarget=null,homeSolved=0;
function initAnimalHome(){ homeSolved=0; nextAnimalHome(); }
function nextAnimalHome(){
  homeTarget=ANIMALS[Math.floor(Math.random()*ANIMALS.length)];
  document.getElementById('home-q').textContent='Gdzie mieszka: '+homeTarget.name+'?';
  document.getElementById('home-animal').innerHTML=`<div style="font-size:5rem">${homeTarget.emoji}</div>`;
  const homes=[...new Set(ANIMALS.map(a=>JSON.stringify({h:a.home,n:a.homeName})))].map(s=>JSON.parse(s));
  const correct={h:homeTarget.home,n:homeTarget.homeName};
  const others=homes.filter(h=>h.n!==correct.n).sort(()=>Math.random()-.5).slice(0,2);
  const opts=[correct,...others].sort(()=>Math.random()-.5);
  const wrap=document.getElementById('home-opts'); wrap.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('div'); b.className='shape-opt'; b.innerHTML=`${o.h}<div style="font-size:.7rem;margin-top:2px">${o.n}</div>`;
    b.onclick=()=>{
      if(o.n===correct.n){ b.classList.add('correct'); homeSolved++; const st=homeSolved>=6?3:homeSolved>=3?2:1; celebrate('Brawo! 🏠',homeTarget.name+' mieszka w: '+correct.n,st,'z9b'); }
      else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
  speak('Gdzie mieszka '+homeTarget.name+'?',0.85);
}
let foodTarget=null,foodSolved=0;
function initAnimalFood(){ foodSolved=0; nextAnimalFood(); }
function nextAnimalFood(){
  foodTarget=ANIMALS[Math.floor(Math.random()*ANIMALS.length)];
  document.getElementById('food-q').textContent='Co lubi jeść: '+foodTarget.name+'?';
  document.getElementById('food-animal').innerHTML=`<div style="font-size:5rem">${foodTarget.emoji}</div>`;
  const foods=[...new Set(ANIMALS.map(a=>a.food))];
  const others=foods.filter(f=>f!==foodTarget.food).sort(()=>Math.random()-.5).slice(0,2);
  const opts=[foodTarget.food,...others].sort(()=>Math.random()-.5);
  const wrap=document.getElementById('food-opts'); wrap.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('div'); b.className='shape-opt'; b.textContent=o;
    b.onclick=()=>{
      if(o===foodTarget.food){ b.classList.add('correct'); foodSolved++; const st=foodSolved>=6?3:foodSolved>=3?2:1; celebrate('Pyszne! 🍽️',foodTarget.name+' to lubi!',st,'z9c'); }
      else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
  speak('Czym żywi się '+foodTarget.name+'?',0.85);
}

/* =====================================================================
   STREFA 10 — CZAS
   ===================================================================== */
const TIME_ACTIVITIES=[
  {emoji:'🌅',act:'budzenie się',time:'rano'},{emoji:'🥣',act:'śniadanie',time:'rano'},
  {emoji:'🏫',act:'przedszkole',time:'południe'},{emoji:'🍲',act:'obiad',time:'południe'},
  {emoji:'⚽',act:'zabawa na dworze',time:'popołudnie'},{emoji:'🛁',act:'kąpiel',time:'wieczór'},
  {emoji:'🦷',act:'mycie zębów',time:'wieczór'},{emoji:'😴',act:'spanie',time:'noc'},{emoji:'🌙',act:'dobranoc',time:'noc'}
];
const TIMES=['rano','południe','popołudnie','wieczór','noc'];
let todTarget=null,todSolved=0;
function initTimeOfDay(){ todSolved=0; nextTimeOfDay(); }
function nextTimeOfDay(){
  todTarget=TIME_ACTIVITIES[Math.floor(Math.random()*TIME_ACTIVITIES.length)];
  document.getElementById('tod-q').textContent='Kiedy to robimy?';
  document.getElementById('tod-activity').innerHTML=`<div style="font-size:5rem">${todTarget.emoji}</div><div style="font-size:1rem;opacity:.85">${todTarget.act}</div>`;
  const others=TIMES.filter(t=>t!==todTarget.time).sort(()=>Math.random()-.5).slice(0,2);
  const opts=[todTarget.time,...others].sort(()=>Math.random()-.5);
  const wrap=document.getElementById('tod-opts'); wrap.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('div'); b.className='shape-opt'; b.style.fontSize='1.1rem'; b.style.fontWeight='800'; b.textContent=o;
    b.onclick=()=>{
      if(o===todTarget.time){ b.classList.add('correct'); todSolved++; const st=todSolved>=6?3:todSolved>=3?2:1; celebrate('Zgadza się! 🌅',todTarget.act+' — '+todTarget.time,st,'z10a'); }
      else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Spróbuj jeszcze!',0.9); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
  speak('Kiedy robimy to: '+todTarget.act+'?',0.85);
}
let clockHour=3,clockSolved=0;
function initClock(){ clockSolved=0; nextClock(); }
function drawClock(hour){
  const cx=100,cy=100,r=86;
  let svg=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffef5" stroke="#ffb443" stroke-width="6"/>`;
  for(let i=1;i<=12;i++){ const a=(i/12)*2*Math.PI-Math.PI/2; const x=cx+Math.cos(a)*(r-18); const y=cy+Math.sin(a)*(r-18); svg+=`<text x="${x}" y="${y+6}" font-size="16" font-weight="700" fill="#444" text-anchor="middle">${i}</text>`; }
  const ha=(hour%12/12)*2*Math.PI-Math.PI/2; const hx=cx+Math.cos(ha)*40,hy=cy+Math.sin(ha)*40;
  svg+=`<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#e53935" stroke-width="6" stroke-linecap="round"/>`;
  const ma=-Math.PI/2; const mx=cx+Math.cos(ma)*62,my=cy+Math.sin(ma)*62;
  svg+=`<line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#1e88e5" stroke-width="4" stroke-linecap="round"/>`;
  svg+=`<circle cx="${cx}" cy="${cy}" r="6" fill="#444"/>`;
  document.getElementById('clock-svg').innerHTML=svg;
}
function nextClock(){
  clockHour=1+Math.floor(Math.random()*12); drawClock(clockHour);
  const opts=new Set([clockHour]); while(opts.size<3){ const v=1+Math.floor(Math.random()*12); opts.add(v); }
  const wrap=document.getElementById('clock-opts'); wrap.innerHTML='';
  [...opts].sort(()=>Math.random()-.5).forEach(v=>{
    const b=document.createElement('button'); b.className='ans-btn'; b.textContent=v+':00';
    b.onclick=()=>{
      if(v===clockHour){ b.classList.add('correct'); clockSolved++; const st=clockSolved>=6?3:clockSolved>=3?2:1; celebrate('Dobrze! 🕐','Jest godzina '+clockHour+':00',st,'z10b'); }
      else { b.classList.add('wrong'); Audio_.sfx('fail'); speak('Popatrz na czerwoną wskazówkę!',0.85); setTimeout(()=>b.classList.remove('wrong'),500); }
    };
    wrap.appendChild(b);
  });
  speak('Która jest godzina?',0.85);
}

/* =====================================================================
   STREFA 11 — MUZYKA
   ===================================================================== */
const PIANO_KEYS=[{n:'C',f:261.63},{n:'D',f:293.66},{n:'E',f:329.63},{n:'F',f:349.23},{n:'G',f:392.0},{n:'A',f:440.0},{n:'H',f:493.88},{n:'C',f:523.25}];
function initPiano(){
  const p=document.getElementById('piano'); p.innerHTML='';
  PIANO_KEYS.forEach(k=>{
    const key=document.createElement('div'); key.className='piano-key'; key.textContent=k.n;
    const play=()=>{ Audio_.init(); if(Audio_.ctx&&Audio_.ctx.state==='suspended') Audio_.ctx.resume(); if(Audio_.ctx) Audio_.note(k.f,0.5,0,Audio_.sfxGain,'triangle',0.5); key.classList.add('active'); setTimeout(()=>key.classList.remove('active'),200); };
    key.addEventListener('touchstart',e=>{e.preventDefault();play();},{passive:false});
    key.addEventListener('mousedown',play);
    p.appendChild(key);
  });
  setStars('z11a',Math.max(1,getStars('z11a')));
  speak('Graj na pianinie! Dotykaj klawisze.',0.85);
}
const SIMON_PADS=[{c:'#e53935',f:329.63},{c:'#43a047',f:392.0},{c:'#1e88e5',f:261.63},{c:'#fdd835',f:493.88}];
let simonSeq=[],simonStep=0,simonPlaying=false,simonRound=0;
function initSimon(){
  simonSeq=[]; simonRound=0; document.getElementById('simon-status').textContent='Naciśnij Start i powtórz melodię!';
  const grid=document.getElementById('simon-grid'); grid.innerHTML='';
  SIMON_PADS.forEach((p,i)=>{
    const pad=document.createElement('div'); pad.className='simon-pad'; pad.style.background=p.c; pad.dataset.i=i;
    pad.onclick=()=>simonClick(i); grid.appendChild(pad);
  });
  document.getElementById('simon-start').style.display='';
  speak('Zapamiętaj kolejność i powtórz ją!',0.85);
}
function simonFlash(i,dur=500){
  const pad=document.querySelector(`.simon-pad[data-i="${i}"]`); if(!pad) return;
  pad.classList.add('lit'); Audio_.init(); if(Audio_.ctx){ if(Audio_.ctx.state==='suspended')Audio_.ctx.resume(); Audio_.note(SIMON_PADS[i].f,dur/1000,0,Audio_.sfxGain,'sine',0.5); }
  setTimeout(()=>pad.classList.remove('lit'),dur-60);
}
function simonStart(){
  document.getElementById('simon-start').style.display='none';
  simonSeq=[]; simonRound=0; simonNextRound();
}
function simonNextRound(){
  simonRound++; simonStep=0; simonSeq.push(Math.floor(Math.random()*4));
  document.getElementById('simon-status').textContent='Runda '+simonRound+' — patrz uważnie!';
  simonPlaying=true;
  simonSeq.forEach((idx,k)=>{ setTimeout(()=>{ simonFlash(idx); if(k===simonSeq.length-1) setTimeout(()=>{ simonPlaying=false; document.getElementById('simon-status').textContent='Twoja kolej! Powtórz 🎵'; },600); },700*(k+1)); });
}
function simonClick(i){
  if(simonPlaying) return; if(!simonSeq.length) return;
  simonFlash(i,300);
  if(i===simonSeq[simonStep]){
    simonStep++;
    if(simonStep>=simonSeq.length){
      if(simonRound>=4){ const st=3; document.getElementById('simon-start').style.display=''; setTimeout(()=>celebrate('Genialny słuch! 🎵','Powtórzyłeś całą melodię!',st,'z11b'),400); simonSeq=[]; }
      else { Audio_.sfx('success'); setTimeout(simonNextRound,800); }
    }
  } else {
    Audio_.sfx('fail'); document.getElementById('simon-status').textContent='Prawie! Spróbuj jeszcze raz 😊';
    setStars('z11b',Math.max(1,getStars('z11b')));
    setTimeout(()=>{ simonStep=0; simonPlaying=true; document.getElementById('simon-status').textContent='Patrz jeszcze raz...'; simonSeq.forEach((idx,k)=>{ setTimeout(()=>{ simonFlash(idx); if(k===simonSeq.length-1) setTimeout(()=>{ simonPlaying=false; document.getElementById('simon-status').textContent='Twoja kolej! 🎵'; },600); },600*(k+1)); }); },900);
  }
}


function createStars(){
  const wrap=document.getElementById('stars'); if(!wrap) return; wrap.innerHTML='';
  for(let i=0;i<50;i++){
    const s=document.createElement('div'); s.className='star';
    const size=1+Math.random()*2;
    s.style.width=size+'px'; s.style.height=size+'px'; s.style.left=Math.random()*100+'%'; s.style.top=Math.random()*70+'%';
    s.style.animationDelay=Math.random()*2+'s';
    wrap.appendChild(s);
  }
}
function animateLoadingChars(){
  const el=document.getElementById('load-emoji'); if(!el) return;
  const chars=['🌺','👽','🧱','💎','🌊','🌟','🎲','✏️'];
  let i=0; setInterval(()=>{ el.textContent=chars[i++%chars.length]; },350);
}
/* zatrzymuje timery gier-w-tle przy zmianie ekranu (balony, zwierzak) */
function stopBackgroundTimers(exceptScreen){
  if(exceptScreen!=='s-z3c') clearBalloonTimers();
  if(exceptScreen!=='s-z6b') clearInterval(petTimer);
}

function init(){
  createStars();
  animateLoadingChars();
  setupManifest();
  setupSW();
  loadProgress();
  loadAudioPrefs();
  initCanvasEvents();
  renderVisits();
  if(window.speechSynthesis){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged',()=>{ speechReady=true; });
    const warm=new SpeechSynthesisUtterance(' '); warm.volume=0; window.speechSynthesis.speak(warm);
  }
  window.addEventListener('resize',()=>{
    if(APP.z2 && APP.z2.activeChar && drawCanvas){
      const r=drawCanvas.getBoundingClientRect();
      if(r.width>0) canvasScale=drawCanvas.width/r.width;
      clearDrawing();
    }
  });
  let progress=0; const bar=document.getElementById('load-bar');
  const tick=setInterval(()=>{
    progress+=Math.random()*16;
    if(progress>=100){ progress=100; clearInterval(tick); document.getElementById('tap-start').style.display='block'; }
    bar.style.width=progress+'%';
  },130);
}
/* wchodzi na mapę (po starcie lub po onboardingu) */
function enterMap(){
  setupDaily();
  goToScreen('s-map');
  APP.history=['s-map'];
  renderPortals();
  updateGreeting();
  Audio_.startMusic('map');
}
function startApp(){
  Audio_.init();
  if(Audio_.ctx && Audio_.ctx.state==='suspended') Audio_.ctx.resume();
  bumpVisits();
  startSession();
  if(!PROGRESS.childName){
    renderAvatarPicker();
    goToScreen('s-onboard');
    Audio_.startMusic('loading');
    speak('Cześć! Jak masz na imię? Wpisz swoje imię i wybierz bohatera!',0.8);
  } else {
    enterMap();
    speak('Witaj z powrotem, '+PROGRESS.childName+'! Wybierz strefę i baw się dobrze!',0.85);
  }
}
document.addEventListener('DOMContentLoaded', init);
