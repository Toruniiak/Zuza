# Pou Clone — Dokumentacja techniczna i plan implementacji

**Wersja:** 1.0 · **Data:** 2026-07-18 · **Status:** gotowe do wdrożenia

To repozytorium zawiera **w pełni grywalną implementację referencyjną** w HTML5/PWA (katalog `pou-clone/`), której architektura odwzorowuje 1:1 opisany niżej projekt. Docelowym silnikiem produkcyjnym (sekcja 6) jest **Godot 4** — implementacja webowa służy jako działający prototyp mechanik, balansu i UX oraz jako specyfikacja wykonywalna dla zespołu.

---

## 1. Architektura systemów

Gra jest zbudowana wokół **jednego źródła prawdy — obiektu `GameState`** — oraz modułów, które go czytają i modyfikują wyłącznie przez publiczne API. Żaden moduł nie trzyma własnej kopii statów.

```
┌────────────────────────────────────────────────────────┐
│                      GameLoop (tick 1 s)               │
│  decay statów · regeneracja snu · autosave · nastrój   │
└──────────────┬─────────────────────────────────────────┘
               ▼
┌──────────────────────────┐    zdarzenia (EventBus)
│        GameState         │◄──────────────────────────┐
│ staty · XP/level · coins │                           │
│ ekwipunek · high-scores  │                           │
└──────┬──────────┬────────┘                           │
       ▼          ▼                                    │
┌───────────┐ ┌───────────┐ ┌────────────┐ ┌──────────┴─┐
│ RoomMgr   │ │ PouRender │ │ MiniGameFW │ │ Shop/Econ  │
│ 7 pokoi   │ │ canvas,   │ │ wspólna    │ │ katalogi,  │
│ akcje     │ │ nastroje, │ │ pętla,     │ │ ceny,      │
│ pokojowe  │ │ ubrania   │ │ wyniki     │ │ unlocki    │
└───────────┘ └───────────┘ └────────────┘ └────────────┘
       ▼
┌───────────────────────────┐
│ Persistence (localStorage │  ← w Godot: JSON + user://
│ / SQLite w produkcji)     │
└───────────────────────────┘
```

Zasady wiązania modułów:

- **RoomManager** wie tylko, który pokój jest aktywny i jakie akcje udostępnia; efekty akcji (np. „nakarm jabłkiem") wywołują metody `GameState.feed(food)`.
- **MiniGameFramework** dostarcza wspólny cykl życia (`init → update → render → gameOver`), ekran trudności i tabelę wyników; konkretne gry są wtyczkami implementującymi ten interfejs. Nagrody wypłaca framework, nie gra — jeden punkt kontroli ekonomii.
- **EventBus** (`levelUp`, `statLow`, `purchase`, `achievementUnlocked`) rozpina zależności: osiągnięcia, powiadomienia i dźwięk tylko nasłuchują.
- **PouRenderer** jest czystą funkcją stanu: `draw(state, mood, outfit)` — dzięki temu ten sam kod rysuje Pou w pokoju, u przyjaciela i w mini-grach.

## 2. Struktura danych i model bazy

Zapis lokalny to pojedynczy dokument JSON (w produkcji: SQLite z tabelami odpowiadającymi kluczom). Kluczowe pola:

```jsonc
{
  "version": 1,                       // migracje zapisu
  "name": "Pou",
  "stats":  { "hunger": 80, "hygiene": 80, "energy": 80, "fun": 80 }, // 0–100
  "xp": 0, "level": 1,
  "coins": 150, "gems": 5,            // waluta zwykła i premium
  "color": "#c9a24b", "sleeping": false,
  "lastTick": 1760000000000,          // epoch ms — decay offline
  "equipped":  { "hat": null, "glasses": null, "shirt": null, "shoes": null },
  "owned":     { "items": ["hat_cap"], "wallpapers": {"bedroom": ["wp_blue"]},
                 "furniture": [], "potions": {"pot_red": 1} },
  "wallpaperActive": { "bedroom": "wp_blue", "...": "..." },
  "highScores": { "foodDrop": {"easy": 120, "med": 0, "hard": 0}, "...": {} },
  "achievements": { "feeder1": true },
  "totals":   { "fed": 12, "washed": 4, "games": 9, "coinsEarned": 830 },
  "friends":  { "lastGiftDay": "2026-07-18" },
  "settings": { "sound": true, "vibration": true, "lang": "pl", "notify": false }
}
```

Katalogi treści (jedzenie, ubrania, tapety, mikstury, mini-gry) są **statycznymi danymi wersjonowanymi z kodem** (w Godot: pliki `Resource`/JSON), nie częścią zapisu — zapis przechowuje tylko referencje po `id`. Wpis jedzenia:

```jsonc
{ "id": "burger", "cat": "fastfood", "emoji": "🍔", "price": 12,
  "hunger": +22, "fun": +6, "hygiene": -8, "xp": 8, "unlockLevel": 3 }
```

Migracje: pole `version` + łańcuch funkcji `migrate_1_to_2(save)`; zapis atomowy (zapis do pliku tymczasowego → rename), autosave po każdej mutacji (debounce 500 ms) i przy pauzie aplikacji.

## 3. Przepływ logiki gry

**Tick czasu rzeczywistego (co 1 s):**

1. `dt = now - lastTick`; `lastTick = now`.
2. Decay (wartości/godzinę, prototyp): głód **−8**, zabawa **−7**, energia **−6** (0 podczas snu), higiena **−5**.
3. Sen: energia **+40/h**; przy 100 Pou budzi się sam.
4. Nastrój = f(min stat): `>60` happy, `30–60` neutral, `<30` sad, `sleeping` — steruje animacją i muzyką.
5. Progi alarmowe (stat < 25) → event `statLow` → wibracja/ikona/powiadomienie.

**Powrót do gry (decay offline):** przy starcie liczymy `elapsed = now − lastTick` i stosujemy te same stawki, z limitem **12 h** naliczania (kara nie może być frustrująca) i podłogą 5 pkt (Pou nigdy nie „umiera"). Jeśli Pou spał — offline liczy się regeneracja energii zamiast jej spadku.

**Priorytety aktualizacji w klatce:** input → logika mini-gry (jeśli aktywna, pokój zamrożony) → tick statów → render → UI. Mini-gra pauzuje decay, ale kosztuje energię (−10) i podnosi zabawę przy starcie nagrody.

**Ekonomia:** monety wyłącznie z mini-gier, osiągnięć i level-upów; ceny sklepu skalowane `cena_bazowa × (1 + 0.1 × (level−1))` — drenaż podąża za podażą. Gemy: rzadkie nagrody + (w produkcji) IAP; wymienialne na monety, nigdy odwrotnie. XP: jedzenie + mini-gry; próg poziomu `level × 100`, level-up wypłaca `50 × level` monet i 1 gem oraz odblokowuje treści.

## 4. Szczegółowy opis mini-gier (4 z 12)

Wszystkie gry: 3 poziomy trudności (mnożnik nagród ×1/×1.5/×2.2), zapis rekordu per trudność, wypłata `coins = floor(score × mult / dzielnik_gry)`, XP = `floor(coins/2)`, koszt energii 10, bonus zabawy +15.

**4.1 Food Drop** *(refleks, akcelerometr lub dotyk)*
Pou stoi na dole ekranu; z góry spada jedzenie (+1 pkt) i przedmioty złe (🧦💣 — utrata życia). Sterowanie: przechylanie telefonu (DeviceOrientation, oś gamma) lub przeciąganie palcem. 3 życia. Trudność podnosi prędkość spadania (140/200/270 px/s), częstotliwość spawnów i odsetek złych obiektów (15/25/35 %). Co 10 pkt prędkość +8 %. Punktacja: 1 pkt/obiekt, złote jedzenie (5 % szans) = 5 pkt.

**4.2 Sky Jump** *(zręcznościowa, akcelerometr)*
Klon doodle-jump: Pou skacze po platformach w górę; ekran przewija się za nim, spadnięcie poza dół = koniec. Przechylanie steruje poziomo (zawijanie krawędzi ekranu). Platformy: zwykłe, sprężynowe (×2 wybicia, 10 %), kruszące się (znikają po odbiciu — 0/15/30 % zależnie od trudności). Rozstaw platform rośnie z trudnością (70/85/100 px). Punktacja: 1 pkt za każdy metr wysokości (max osiągnięty), rekord = wysokość.

**4.3 Memory** *(pamięciowa)*
Plansza kart z emoji jedzenia: 4×3 / 4×4 / 5×4 par zależnie od trudności. Odkrywamy po 2; para znika, pomyłka zakrywa po 700 ms. Punktacja premiuje pamięć i tempo: `score = pary_bazowe×10 + max(0, limit_czasu − czas)×2 − pomyłki×3`. Limit czasu: 60/90/120 s (przekroczenie nie kończy gry, zeruje tylko bonus).

**4.4 Pou Runner** *(endless runner)*
Pou biegnie automatycznie; tap = skok (przytrzymanie = wyższy skok, podwójny tap = podwójny skok na trudności łatwej). Przeszkody: kaktusy (skok) i ptaki na dwóch wysokościach. Prędkość startowa 260/320/380 px/s, rośnie +4 px/s co sekundę do limitu. Punktacja: dystans/10 + monety zbierane na trasie (1 pkt, wliczane też bezpośrednio do portfela ×trudność). Jedno uderzenie kończy bieg.

## 5. Plan wdrażania fazowego

| Faza | Zakres | Kryterium wyjścia |
|---|---|---|
| **F0 — Fundament (1–2 tyg.)** | GameState, pętla, decay online/offline, zapis/odczyt, rendering Pou z nastrojami | staty spadają i zapisują się między sesjami |
| **F1 — MVP (3–4 tyg.)** | 4 pokoje (sypialnia, łazienka, kuchnia, salon), karmienie z kategoriami, sen, mycie, 2 mini-gry (Food Drop, Memory), monety, XP/level | pełna pętla dnia: nakarm → pobaw → umyj → uśpij |
| **F2 — Ekonomia i wygląd (3 tyg.)** | Sklep, ubrania, tapety, rosnące ceny, laboratorium (mikstury, kolory), osiągnięcia | gracz ma na co wydawać monety |
| **F3 — Rozbudowa (3 tyg.)** | Ogród, +2 mini-gry (Sky Jump, Runner) z akcelerometrem, powiadomienia, ustawienia, przyjaciele (lokalni boci) | 12 h retencji testerów bez znudzenia |
| **F4 — Monetyzacja i wydanie (2–3 tyg.)** | IAP (gemy), pozostałe mini-gry do 12+, telemetria, ASO, testy urządzeń | build w sklepach, crash-free > 99.5 % |

Ryzyka: balans decay (testować telemetrią z F1), uprawnienia akcelerometru na iOS (wymagany gest użytkownika), cheatowanie zegarem systemowym (cap 12 h + monotonic time gdzie dostępny).

## 6. Wytyczne dla silnika — **Godot 4** (wybrany)

Wybór: Godot 4 — darmowy, lekkie buildy mobilne, doskonałe 2D, `AnimationPlayer`/`Tween` idealne do „gumowego" Pou; eksport Android/iOS z jednego projektu.

- **Struktura scen:** `Main.tscn` (autoload UI + HUD statów) → `RoomManager` podmienia sceny pokoju (`Bedroom.tscn`…); każda mini-gra to osobna scena ładowana przez `MiniGameFramework.gd`.
- **Autoloady (singletony):** `GameState.gd`, `EventBus.gd` (sygnały), `Economy.gd`, `SaveSystem.gd` (JSON w `user://save.json`, zapis w `NOTIFICATION_APPLICATION_PAUSED`), `Audio.gd`.
- **Decay:** `Timer` 1 s w `GameState`; decay offline w `_ready()` z `Time.get_unix_time_from_system()`.
- **Katalogi treści:** zasoby `.tres` (custom `Resource`: `FoodItem`, `ClothingItem`, `Potion`) — edytowalne przez game designera bez kodu.
- **Pou:** `Skeleton2D`/`Polygon2D` lub sprite'y warstwowe (ciało → oczy → usta → ubrania jako `Sprite2D` z atlasu); kolor przez `modulate`/shader.
- **Akcelerometr:** `Input.get_accelerometer()` (fallback: `get_gravity()`); na iOS dodać opis użycia w `Info.plist`.
- **Powiadomienia:** plugin `godot-local-notification` — planowane lokalnie przy pauzie („Pou jest głodny!" za X h wg bieżących statów), kasowane przy wznowieniu.
- **IAP:** oficjalne pluginy Google Play Billing / StoreKit; walidacja paragonów po stronie backendu dopiero, gdy pojawi się backend — do tego czasu gemy tylko lokalne.
- **Testy:** GUT (Godot Unit Test) dla `GameState`/`Economy` (decay, ceny, level-up); testy balansu jako symulacje headless.

---

**Jak korzystać z tego repo:** `pou-clone/index.html` uruchamia kompletny, grywalny prototyp (patrz `pou-clone/README.md`). Kod JS jest podzielony na moduły odpowiadające sekcjom 1–2, więc służy jako referencja portowania do Godota moduł po module.
