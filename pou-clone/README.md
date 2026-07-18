# 🥚 Pou Clone — wirtualny zwierzak (Tamagotchi)

W pełni grywalny klon Pou jako **PWA** — czysty HTML5/JS, zero zależności, działa w **100% offline** po pierwszym wczytaniu. Zaprojektowany pod telefony (dotyk + akcelerometr), działa też na desktopie.

> 📘 **Pełna dokumentacja techniczna i plan implementacji:** [`docs/DOKUMENTACJA.md`](docs/DOKUMENTACJA.md)

## ✨ Funkcje

- **4 staty** (głód, higiena, energia, zabawa) spadające w czasie rzeczywistym — **także gdy gra jest zamknięta** (decay offline z limitem 12 h)
- **Ukryty system XP i poziomów** — level-upy odblokowują jedzenie, ubrania, mikstury i dają nagrody
- **7 pokoi:** sypialnia (sen), łazienka (prysznic, mydło-pocieranie, zęby), kuchnia (4 kategorie jedzenia), salon (szafa, przyjaciele, osiągnięcia), ogród (mini-gry, dekoracje), laboratorium (mikstury i kolory Pou), sklep
- **6 mini-gier**, każda z 3 poziomami trudności i rekordami: Food Drop 🍎, Sky Jump ☁️ (obie z akcelerometrem!), Memory 🃏, Pou Runner 🏃, Bąbelki 🫧, Pou Simon 🎵
- **Ekonomia:** monety z mini-gier, gemy z osiągnięć/poziomów, rosnące ceny w sklepie
- **Customizacja:** czapki, okulary, ubrania, buty, tapety pokojów, dekoracje ogrodu, kolory Pou
- **10 osiągnięć**, przyjaciele z codziennym prezentem, powiadomienia, PL/EN, dźwięki proceduralne (Web Audio), wibracje
- **Zapis lokalny** (localStorage) z wersjonowaniem i autosave

## 🚀 Uruchomienie

Otwórz `index.html` w przeglądarce albo (pełne PWA):

```bash
python3 -m http.server 8000
# → http://localhost:8000/pou-clone/
```

Na telefonie: otwórz stronę → „Dodaj do ekranu głównego" — gra zainstaluje się jak natywna aplikacja i będzie działać bez internetu.

## 🎮 Sterowanie

- **Dotknij Pou** — głaskanie (+zabawa)
- **Łazienka:** pocieraj Pou palcem = mycie mydłem
- **Food Drop / Sky Jump:** przechylaj telefon (lub przeciągaj palcem)
- **Runner:** tap = skok (podwójny skok na łatwym)

## 🧱 Architektura

```
pou-clone/
├── index.html          # szkielet UI (HUD, pokój, nawigacja, modale, ekran gry)
├── styles.css
├── js/
│   ├── data.js         # katalogi treści (jedzenie, ubrania, mikstury…) + i18n PL/EN
│   ├── state.js        # GameState — jedyne źródło prawdy; decay, XP, ekonomia, zapis
│   ├── audio.js        # dźwięki proceduralne (Web Audio) + wibracje
│   ├── pou.js          # renderer postaci (czysta funkcja stanu, canvas)
│   ├── minigames.js    # framework mini-gier + 6 gier-wtyczek
│   ├── ui.js           # pokoje, sklep, szafa, ustawienia, efekty
│   └── main.js         # bootstrap, pętla główna
├── docs/DOKUMENTACJA.md
├── manifest.json / sw.js / icon.svg   # PWA
```

Szczegóły architektury, model danych, balans i plan portowania do **Godot 4** — w dokumentacji.
