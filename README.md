# 🏝️ Edukacyjna Wyspa

Interaktywna aplikacja edukacyjna **PWA** dla dzieci w wieku **4–7 lat**. Działa w **100% offline**, w jednym pliku HTML — bez instalacji, bez konta, bez internetu po pierwszym wczytaniu.

> Cała aplikacja, grafiki, dźwięki i lektor są generowane lokalnie w przeglądarce. Zero zewnętrznych plików, zero śledzenia, zero reklam.

---

## ✨ Co potrafi

- **11 stref nauki:** litery, pisanie po śladzie, matematyka, gry, logika, kreatywność, kolory, kształty, zwierzęta, czas, muzyka
- **Polski lektor** w każdym ekranie i zadaniu (`SpeechSynthesis`, głos `pl-PL`) — tłumaczy dziecku, co ma zrobić
- **Dźwięki proceduralne** (Web Audio API) — reakcja na każde kliknięcie, fanfary, melodie stref
- **Gry:** Memory, Kółko i krzyżyk, **Chińczyk 1–4 graczy / vs komputer**, **Wężyk**, **Kolorowa Kostka**, Labirynt, Puzzle, Simon i więcej
- **Zadania:** liczenie, działania, **porównywanie liczb (> < =)**, **co nie pasuje**, sekwencje, dopasowania
- **System nagród:** gwiazdki, poziomy, **monety i sklepik z ulepszeniami**, odznaki, certyfikat do druku
- **Poziomy trudności** w wielu grach
- **Personalizacja:** imię dziecka + wybór bohatera
- **Panel rodzica z PIN-em:** dzienny limit czasu z blokadą, blokada wybranych stref, statystyki, przełącznik lektora, reset postępów
- **PWA:** instalacja na ekranie domowym, pełna praca offline (Service Worker)

---

## 🚀 Uruchomienie lokalne

Po prostu otwórz `index.html` w przeglądarce (Chrome, Edge, Safari, Firefox).

Dla pełnego trybu PWA (Service Worker) najlepiej serwować przez lokalny serwer:

```bash
# Python
python3 -m http.server 8000
# albo Node
npx serve .
```

Następnie wejdź na `http://localhost:8000`.

---

## 🌐 Publikacja na GitHub Pages

1. Utwórz nowe repozytorium na GitHubie (np. `edukacyjna-wyspa`).
2. Wgraj wszystkie pliki z tego folderu (zachowaj plik `.nojekyll`).
3. W repo wejdź w **Settings → Pages**.
4. W sekcji **Build and deployment** ustaw **Source: Deploy from a branch**, gałąź **main**, folder **/(root)**.
5. Zapisz. Po chwili strona będzie dostępna pod:
   `https://TWOJA-NAZWA.github.io/edukacyjna-wyspa/`

> Plik `.nojekyll` wyłącza przetwarzanie Jekyll i gwarantuje, że pliki są serwowane bez zmian.

### Szybki wariant z linii poleceń

```bash
git init
git add .
git commit -m "Edukacyjna Wyspa - PWA edukacyjna dla dzieci"
git branch -M main
git remote add origin https://github.com/TWOJA-NAZWA/edukacyjna-wyspa.git
git push -u origin main
```

Potem włącz GitHub Pages w ustawieniach repo (kroki 3–5 powyżej).

---

## 🧱 Stos technologiczny

Czysty front-end, bez frameworków i bez zależności:

- HTML + CSS (Grid, Flexbox, animacje keyframes)
- Vanilla JavaScript
- Web Audio API — dźwięki i muzyka
- SpeechSynthesis API — polski lektor
- Canvas API — rysowanie, gry
- SVG inline + emoji — grafika
- localStorage — postępy, monety, ustawienia
- Service Worker + Web App Manifest — PWA / offline
- Pointer Events — obsługa dotyku i myszy

---

## 📁 Struktura repo

```
edukacyjna-wyspa/
├── index.html      # szkielet strony (podpina CSS, JS, manifest, ikonę)
├── styles.css      # style aplikacji
├── app.js          # cała logika gier, lektor, dźwięki, postępy
├── manifest.json   # manifest PWA
├── sw.js           # Service Worker (cache offline)
├── icon.svg        # ikona aplikacji
├── README.md
├── LICENSE
├── .nojekyll       # serwowanie plików 1:1 na GitHub Pages
└── .gitignore
```

> Aplikacja pozostaje w 100% offline. `sw.js` cache'uje wszystkie powyższe pliki, więc po pierwszym wczytaniu działa bez internetu i można ją zainstalować na ekranie domowym.

---

## 👨‍👩‍👧 Dla rodziców

- Panel rodzica otwierasz **przytrzymując palcem tytuł** na mapie (~1 s).
- Przy pierwszym wejściu ustawiasz **4-cyfrowy PIN**.
- Możesz ustawić **dzienny limit czasu** — po jego przekroczeniu aplikacja blokuje się do następnego dnia (odblokowanie PIN-em).

---

## 📝 Licencja

Kod udostępniony na licencji **MIT** — patrz plik [LICENSE](LICENSE). Możesz go zmienić wedle uznania.

---

Stworzone z myślą o najmłodszych odkrywcach. Miłej zabawy i nauki! 🌟
