/* ===== Pou Clone — katalogi treści (statyczne, wersjonowane z kodem) ===== */
'use strict';

const DATA = {

  /* --- Jedzenie: cat = fruits|fastfood|sweets|drinks --- */
  foods: [
    { id: 'apple',      cat: 'fruits',   emoji: '🍎', price: 5,  hunger: 10, fun: 2,  hygiene: 0,  xp: 3, lvl: 1 },
    { id: 'banana',     cat: 'fruits',   emoji: '🍌', price: 6,  hunger: 12, fun: 2,  hygiene: 0,  xp: 3, lvl: 1 },
    { id: 'strawberry', cat: 'fruits',   emoji: '🍓', price: 7,  hunger: 10, fun: 4,  hygiene: 0,  xp: 4, lvl: 2 },
    { id: 'watermelon', cat: 'fruits',   emoji: '🍉', price: 10, hunger: 16, fun: 3,  hygiene: -2, xp: 5, lvl: 4 },
    { id: 'fries',      cat: 'fastfood', emoji: '🍟', price: 10, hunger: 18, fun: 5,  hygiene: -6, xp: 6, lvl: 2 },
    { id: 'burger',     cat: 'fastfood', emoji: '🍔', price: 12, hunger: 22, fun: 6,  hygiene: -8, xp: 8, lvl: 3 },
    { id: 'pizza',      cat: 'fastfood', emoji: '🍕', price: 14, hunger: 26, fun: 6,  hygiene: -8, xp: 9, lvl: 5 },
    { id: 'hotdog',     cat: 'fastfood', emoji: '🌭', price: 11, hunger: 20, fun: 5,  hygiene: -7, xp: 7, lvl: 7 },
    { id: 'candy',      cat: 'sweets',   emoji: '🍬', price: 4,  hunger: 6,  fun: 8,  hygiene: -4, xp: 3, lvl: 1 },
    { id: 'donut',      cat: 'sweets',   emoji: '🍩', price: 9,  hunger: 14, fun: 10, hygiene: -6, xp: 6, lvl: 3 },
    { id: 'icecream',   cat: 'sweets',   emoji: '🍦', price: 8,  hunger: 10, fun: 12, hygiene: -5, xp: 5, lvl: 4 },
    { id: 'cake',       cat: 'sweets',   emoji: '🍰', price: 13, hunger: 18, fun: 14, hygiene: -8, xp: 8, lvl: 6 },
    { id: 'water',      cat: 'drinks',   emoji: '💧', price: 2,  hunger: 4,  fun: 0,  hygiene: 2,  xp: 1, lvl: 1 },
    { id: 'milk',       cat: 'drinks',   emoji: '🥛', price: 5,  hunger: 8,  fun: 2,  hygiene: 0,  xp: 2, lvl: 1 },
    { id: 'juice',      cat: 'drinks',   emoji: '🧃', price: 6,  hunger: 8,  fun: 4,  hygiene: 0,  xp: 3, lvl: 2 },
    { id: 'soda',       cat: 'drinks',   emoji: '🥤', price: 7,  hunger: 6,  fun: 8,  hygiene: -4, xp: 4, lvl: 5 },
  ],
  foodCats: ['fruits', 'fastfood', 'sweets', 'drinks'],

  /* --- Ubrania: slot = hat|glasses|shirt|shoes --- */
  clothes: [
    { id: 'hat_cap',    slot: 'hat',     emoji: '🧢', price: 40,  lvl: 1 },
    { id: 'hat_top',    slot: 'hat',     emoji: '🎩', price: 90,  lvl: 3 },
    { id: 'hat_grad',   slot: 'hat',     emoji: '🎓', price: 120, lvl: 5 },
    { id: 'hat_crown',  slot: 'hat',     emoji: '👑', price: 300, lvl: 8 },
    { id: 'gls_sun',    slot: 'glasses', emoji: '🕶️', price: 60,  lvl: 1 },
    { id: 'gls_nerd',   slot: 'glasses', emoji: '👓', price: 45,  lvl: 2 },
    { id: 'shirt_tee',  slot: 'shirt',   emoji: '👕', price: 50,  lvl: 1 },
    { id: 'shirt_bow',  slot: 'shirt',   emoji: '🎀', price: 70,  lvl: 3 },
    { id: 'shirt_tux',  slot: 'shirt',   emoji: '🤵', price: 160, lvl: 6 },
    { id: 'shoes_snkr', slot: 'shoes',   emoji: '👟', price: 70,  lvl: 2 },
    { id: 'shoes_boot', slot: 'shoes',   emoji: '🥾', price: 95,  lvl: 4 },
  ],
  clothSlots: ['hat', 'glasses', 'shirt', 'shoes'],

  /* --- Tapety (tło pokoju; kupione raz, dostępne w każdym pokoju) --- */
  wallpapers: [
    { id: 'wp_lavender', price: 0,   c1: '#4e3d8f', c2: '#2b2153' },
    { id: 'wp_sky',      price: 60,  c1: '#3d7bb5', c2: '#1d3d63' },
    { id: 'wp_mint',     price: 60,  c1: '#2f8f6b', c2: '#174534' },
    { id: 'wp_sunset',   price: 90,  c1: '#c96a3b', c2: '#5e2440' },
    { id: 'wp_pink',     price: 90,  c1: '#c95b9b', c2: '#5a2050' },
    { id: 'wp_night',    price: 140, c1: '#1f2a5e', c2: '#0a0e26' },
    { id: 'wp_gold',     price: 220, c1: '#b98a2f', c2: '#4f3608' },
  ],

  /* --- Mikstury (laboratorium) --- */
  potions: [
    { id: 'pot_energy', emoji: '🧪', price: 60,  effect: 'energy',  lvl: 1 },
    { id: 'pot_clean',  emoji: '🫧', price: 50,  effect: 'hygiene', lvl: 1 },
    { id: 'pot_feast',  emoji: '🍲', price: 70,  effect: 'hunger',  lvl: 2 },
    { id: 'pot_joy',    emoji: '🎉', price: 70,  effect: 'fun',     lvl: 2 },
    { id: 'pot_max',    emoji: '⚗️', price: 200, effect: 'all',     lvl: 5 },
    { id: 'pot_xp',     emoji: '📗', price: 120, effect: 'xp',      lvl: 3 },
    { id: 'col_classic',emoji: '🟤', price: 0,   effect: 'color', color: '#c9a24b', lvl: 1 },
    { id: 'col_red',    emoji: '🔴', price: 80,  effect: 'color', color: '#d95555', lvl: 2 },
    { id: 'col_blue',   emoji: '🔵', price: 80,  effect: 'color', color: '#5b8dd9', lvl: 2 },
    { id: 'col_green',  emoji: '🟢', price: 80,  effect: 'color', color: '#6dbf67', lvl: 3 },
    { id: 'col_pink',   emoji: '🩷', price: 120, effect: 'color', color: '#e087c0', lvl: 4 },
    { id: 'col_gold',   emoji: '🟡', price: 400, effect: 'color', color: '#e8c33f', lvl: 8 },
  ],

  /* --- Dekoracje ogrodu --- */
  decorations: [
    { id: 'dec_flower', emoji: '🌸', price: 30,  lvl: 1 },
    { id: 'dec_plant',  emoji: '🪴', price: 45,  lvl: 1 },
    { id: 'dec_gnome',  emoji: '🍄', price: 80,  lvl: 3 },
    { id: 'dec_flam',   emoji: '🦩', price: 120, lvl: 4 },
    { id: 'dec_fount',  emoji: '⛲', price: 250, lvl: 6 },
  ],

  /* --- Pokoje --- */
  rooms: [
    { id: 'bedroom',  ico: '🛏️' },
    { id: 'bathroom', ico: '🛁' },
    { id: 'kitchen',  ico: '🍽️' },
    { id: 'living',   ico: '🛋️' },
    { id: 'garden',   ico: '🌳' },
    { id: 'lab',      ico: '⚗️' },
    { id: 'shop',     ico: '🛒' },
  ],

  /* --- Mini-gry --- */
  minigames: [
    { id: 'foodDrop', emoji: '🍎', divisor: 3, accel: true },
    { id: 'skyJump',  emoji: '☁️', divisor: 6, accel: true },
    { id: 'memory',   emoji: '🃏', divisor: 4, accel: false },
    { id: 'runner',   emoji: '🏃', divisor: 5, accel: false },
    { id: 'bubbles',  emoji: '🫧', divisor: 3, accel: false },
    { id: 'simon',    emoji: '🎵', divisor: 1, accel: false },
  ],
  diffMult: { easy: 1, med: 1.5, hard: 2.2 },

  /* --- Osiągnięcia: cond(state) → bool, nagroda w gemach --- */
  achievements: [
    { id: 'feed1',   emoji: '🍽️', gems: 1, cond: s => s.totals.fed >= 1 },
    { id: 'feed25',  emoji: '🍔', gems: 2, cond: s => s.totals.fed >= 25 },
    { id: 'wash10',  emoji: '🧼', gems: 2, cond: s => s.totals.washed >= 10 },
    { id: 'games10', emoji: '🎮', gems: 2, cond: s => s.totals.games >= 10 },
    { id: 'lvl5',    emoji: '⭐', gems: 3, cond: s => s.level >= 5 },
    { id: 'lvl10',   emoji: '🌟', gems: 5, cond: s => s.level >= 10 },
    { id: 'rich',    emoji: '🪙', gems: 3, cond: s => s.totals.coinsEarned >= 1000 },
    { id: 'shopper', emoji: '🛍️', gems: 2, cond: s => s.totals.bought >= 5 },
    { id: 'friend',  emoji: '🤝', gems: 1, cond: s => s.totals.visits >= 1 },
    { id: 'sleepy',  emoji: '😴', gems: 1, cond: s => s.totals.sleeps >= 3 },
  ],

  /* --- Przyjaciele (lokalni boci) --- */
  friends: [
    { id: 'fr_lola',  name: 'Lola',  color: '#e087c0', hat: 'hat_crown' },
    { id: 'fr_max',   name: 'Max',   color: '#5b8dd9', hat: 'hat_cap' },
    { id: 'fr_kiwi',  name: 'Kiwi',  color: '#6dbf67', hat: null },
  ],
};

/* ===== i18n ===== */
const I18N = {
  pl: {
    rooms: { bedroom: 'Sypialnia', bathroom: 'Łazienka', kitchen: 'Kuchnia', living: 'Salon', garden: 'Ogród', lab: 'Laboratorium', shop: 'Sklep' },
    cats: { fruits: 'Owoce', fastfood: 'Fast food', sweets: 'Słodycze', drinks: 'Napoje' },
    slots: { hat: 'Czapki', glasses: 'Okulary', shirt: 'Ubrania', shoes: 'Buty' },
    mg: { foodDrop: 'Food Drop', skyJump: 'Sky Jump', memory: 'Memory', runner: 'Pou Runner', bubbles: 'Bąbelki', simon: 'Pou Simon' },
    diff: { easy: 'Łatwy', med: 'Średni', hard: 'Trudny' },
    ach: {
      feed1: ['Pierwszy kęs', 'Nakarm Pou po raz pierwszy'], feed25: ['Smakosz', 'Nakarm Pou 25 razy'],
      wash10: ['Czyścioch', 'Umyj Pou 10 razy'], games10: ['Gracz', 'Zagraj w 10 mini-gier'],
      lvl5: ['Piątka!', 'Osiągnij poziom 5'], lvl10: ['Dziesiątka!', 'Osiągnij poziom 10'],
      rich: ['Bogacz', 'Zarób łącznie 1000 monet'], shopper: ['Klient', 'Kup 5 przedmiotów'],
      friend: ['Towarzyski', 'Odwiedź przyjaciela'], sleepy: ['Śpioch', 'Połóż Pou spać 3 razy'],
    },
    potions: {
      pot_energy: 'Energia+', pot_clean: 'Czystość+', pot_feast: 'Uczta', pot_joy: 'Radość',
      pot_max: 'Eliksir MAX', pot_xp: '+100 XP', col_classic: 'Klasyczny', col_red: 'Czerwony',
      col_blue: 'Niebieski', col_green: 'Zielony', col_pink: 'Różowy', col_gold: 'Złoty',
    },
    wp: { wp_lavender: 'Lawenda', wp_sky: 'Niebo', wp_mint: 'Mięta', wp_sunset: 'Zachód', wp_pink: 'Róż', wp_night: 'Noc', wp_gold: 'Złoto' },
    ui: {
      sleep: 'Zgaś światło', wake: 'Obudź', shower: 'Prysznic', soap: 'Mydło (pocieraj!)', teeth: 'Umyj zęby',
      wardrobe: 'Szafa', games: 'Mini-gry', friends: 'Przyjaciele', achievements: 'Osiągnięcia',
      settings: 'Ustawienia', wallpaper: 'Tapeta', decor: 'Dekoracje', buy: 'Kup', equipped: 'założone',
      owned: 'kupione', level: 'Poziom', best: 'Rekord', score: 'Wynik', newRecord: 'NOWY REKORD!',
      playAgain: 'Zagraj ponownie', back: 'Wróć', chooseDiff: 'Wybierz poziom trudności',
      sound: 'Dźwięk', vibration: 'Wibracje', language: 'Język', notifyOpt: 'Powiadomienia',
      reset: 'Resetuj grę', resetConfirm: 'Na pewno? Cały postęp zostanie usunięty!',
      notEnough: 'Za mało monet!', notEnoughGems: 'Za mało gemów!', lockedLvl: 'Od poziomu', gift: 'Prezent od',
      giftTaken: 'Prezent odebrany dziś', visit: 'Odwiedź', tooTired: 'Pou jest zbyt zmęczony! Połóż go spać.',
      tapToStart: 'Dotknij, aby zacząć', gameOver: 'Koniec gry', levelUp: 'POZIOM W GÓRĘ!',
      welcomeBack: 'Witaj z powrotem!', wasAway: 'Pou tęsknił przez', sleepingNow: 'Pou śpi... 💤',
      hunger: 'Głód', hygiene: 'Higiena', energy: 'Energia', fun: 'Zabawa',
      exchange: 'Wymień 1 💎 → 100 🪙', tabClothes: 'Ubrania', tabWp: 'Tapety', tabDecor: 'Dekoracje', tabGems: 'Gemy',
      accelHint: 'Przechylaj telefon lub przeciągaj palcem', tapHint: 'Tap = skok', memHint: 'Znajdź wszystkie pary!',
      simonHint: 'Powtórz sekwencję dźwięków', bubbleHint: 'Przebijaj bąbelki zanim znikną!',
      askName: 'Jak nazwiesz swojego zwierzaka?',
    },
  },
  en: {
    rooms: { bedroom: 'Bedroom', bathroom: 'Bathroom', kitchen: 'Kitchen', living: 'Living room', garden: 'Garden', lab: 'Laboratory', shop: 'Shop' },
    cats: { fruits: 'Fruits', fastfood: 'Fast food', sweets: 'Sweets', drinks: 'Drinks' },
    slots: { hat: 'Hats', glasses: 'Glasses', shirt: 'Clothes', shoes: 'Shoes' },
    mg: { foodDrop: 'Food Drop', skyJump: 'Sky Jump', memory: 'Memory', runner: 'Pou Runner', bubbles: 'Bubbles', simon: 'Pou Simon' },
    diff: { easy: 'Easy', med: 'Medium', hard: 'Hard' },
    ach: {
      feed1: ['First bite', 'Feed Pou for the first time'], feed25: ['Foodie', 'Feed Pou 25 times'],
      wash10: ['Squeaky clean', 'Wash Pou 10 times'], games10: ['Gamer', 'Play 10 mini-games'],
      lvl5: ['High five!', 'Reach level 5'], lvl10: ['Perfect ten!', 'Reach level 10'],
      rich: ['Rich', 'Earn 1000 coins total'], shopper: ['Shopper', 'Buy 5 items'],
      friend: ['Sociable', 'Visit a friend'], sleepy: ['Sleepyhead', 'Put Pou to sleep 3 times'],
    },
    potions: {
      pot_energy: 'Energy+', pot_clean: 'Clean+', pot_feast: 'Feast', pot_joy: 'Joy',
      pot_max: 'MAX Elixir', pot_xp: '+100 XP', col_classic: 'Classic', col_red: 'Red',
      col_blue: 'Blue', col_green: 'Green', col_pink: 'Pink', col_gold: 'Gold',
    },
    wp: { wp_lavender: 'Lavender', wp_sky: 'Sky', wp_mint: 'Mint', wp_sunset: 'Sunset', wp_pink: 'Pink', wp_night: 'Night', wp_gold: 'Gold' },
    ui: {
      sleep: 'Lights off', wake: 'Wake up', shower: 'Shower', soap: 'Soap (rub!)', teeth: 'Brush teeth',
      wardrobe: 'Wardrobe', games: 'Mini-games', friends: 'Friends', achievements: 'Achievements',
      settings: 'Settings', wallpaper: 'Wallpaper', decor: 'Decorations', buy: 'Buy', equipped: 'equipped',
      owned: 'owned', level: 'Level', best: 'Best', score: 'Score', newRecord: 'NEW RECORD!',
      playAgain: 'Play again', back: 'Back', chooseDiff: 'Choose difficulty',
      sound: 'Sound', vibration: 'Vibration', language: 'Language', notifyOpt: 'Notifications',
      reset: 'Reset game', resetConfirm: 'Are you sure? All progress will be lost!',
      notEnough: 'Not enough coins!', notEnoughGems: 'Not enough gems!', lockedLvl: 'From level', gift: 'Gift from',
      giftTaken: 'Gift already collected today', visit: 'Visit', tooTired: 'Pou is too tired! Put him to bed.',
      tapToStart: 'Tap to start', gameOver: 'Game over', levelUp: 'LEVEL UP!',
      welcomeBack: 'Welcome back!', wasAway: 'Pou missed you for', sleepingNow: 'Pou is sleeping... 💤',
      hunger: 'Hunger', hygiene: 'Hygiene', energy: 'Energy', fun: 'Fun',
      exchange: 'Trade 1 💎 → 100 🪙', tabClothes: 'Clothes', tabWp: 'Wallpapers', tabDecor: 'Decorations', tabGems: 'Gems',
      accelHint: 'Tilt your phone or drag with a finger', tapHint: 'Tap = jump', memHint: 'Find all pairs!',
      simonHint: 'Repeat the sound sequence', bubbleHint: 'Pop bubbles before they vanish!',
      askName: 'What will you name your pet?',
    },
  },
};
