# Car Tracker Detector

Natywna aplikacja Android (Kotlin + Jetpack Compose), która pomaga właścicielowi samochodu
wykryć **potencjalnie nieznane urządzenia śledzące** w jego pojeździe — przede wszystkim
poprzez skanowanie Bluetooth Low Energy (BLE) i analizę siły oraz powtarzalności sygnału.

> **Najważniejsza zasada projektu:** aplikacja nigdy nie udaje funkcji, których telefon
> fizycznie nie posiada. Nie każdy lokalizator GPS emituje Bluetooth — część działa wyłącznie
> przez sieć komórkową (GSM/LTE), do której telefon w ten sposób nie ma dostępu. Wynik skanu
> to zawsze lista **potencjalnie podejrzanych** urządzeń, nigdy stuprocentowa pewność.

---

## 1. Opis aplikacji

Aplikacja skanuje otoczenie w poszukiwaniu urządzeń BLE, ocenia każde z nich prostym,
przejrzystym algorytmem scoringowym (0–100, 4 poziomy ryzyka: 🟢 NISKIE / 🟡 NIEZNANE /
🟠 PODEJRZANE / 🔴 WYSOKIE RYZYKO) i pomaga fizycznie zlokalizować źródło podejrzanego
sygnału poprzez pomiar RSSI w czasie rzeczywistym. Jest **local-first**: żadnego konta,
serwera, analityki ani reklam — cała historia zostaje wyłącznie na telefonie.

Główny przepływ: **Start → Skanowanie (radar) → Wyniki → Szczegóły urządzenia →
Znajdź źródło sygnału → Sprawdź samochód (checklista miejsc)**.

## 2. Wymagania

- Android Studio (Ladybug/2024.2 lub nowszy zalecany)
- JDK 17+
- Android SDK: `compileSdk 35`, `minSdk 26`, `targetSdk 35`
- Fizyczny telefon z Bluetooth Low Energy do faktycznego testowania skanowania
  (emulator zwykle nie ma działającego radia BLE)

## 3. Instalacja

```bash
git clone <adres repo>
cd car-tracker-detector
```

Otwórz katalog `car-tracker-detector/` w Android Studio (**Open** → wskaż ten folder,
zawiera `settings.gradle.kts` z modułami `:core` i `:app`). Android Studio pobierze
Gradle 8.9 przez dołączony wrapper (`./gradlew`) oraz brakujące zależności/SDK automatycznie
przy pierwszej synchronizacji (wymaga dostępu do `dl.google.com`/`maven.google.com` i
`repo.maven.apache.org` — patrz sekcja 12 poniżej).

## 4. Uruchomienie

```bash
./gradlew :app:installDebug
```

albo z poziomu Android Studio: **Run ▶** na module `app`. Aplikacja poprosi o wymagane
uprawnienia przy pierwszym skanowaniu (patrz sekcja 5).

## 5. Uprawnienia

Aplikacja prosi **wyłącznie** o to, czego rzeczywiście potrzebuje do skanowania BLE:

| Android | Uprawnienie | Dlaczego |
|---|---|---|
| 8.0–11 (API 26–30) | `ACCESS_FINE_LOCATION` (runtime) | Wymóg samego systemu Android — na tych wersjach wynik skanu BLE jest traktowany jako potencjalnie ujawniający lokalizację, niezależnie od tego, czy aplikacja faktycznie z niej korzysta. Aplikacja **nie zapisuje ani nie wysyła** żadnej lokalizacji GPS. |
| 12+ (API 31+) | `BLUETOOTH_SCAN` z flagą `neverForLocation="true"` (runtime) | Aplikacja jawnie deklaruje, że NIE wylicza fizycznej lokalizacji z wyników skanu — dzięki temu na nowych Androidach **nie musi** prosić o dostęp do lokalizacji w ogóle. |
| wszystkie | `BLUETOOTH` / `BLUETOOTH_ADMIN` (do API 30, normalne, bez promptu) | Klasyczne uprawnienia wymagane przez starsze API Bluetootha. |

Celowo **nie żądamy** `BLUETOOTH_CONNECT` — aplikacja nigdy nie łączy się ani nie paruje
z żadnym urządzeniem, czyta wyłącznie pasywne dane z pakietów advertising (nazwa, RSSI,
manufacturer data, service UUID), do czego to uprawnienie nie jest wymagane.

Pełne wyjaśnienie po polsku jest też dostępne w aplikacji na ekranie **Prywatność**.

## 6. Ograniczenia Androida

- **Adresy MAC BLE bywają losowo rotowane** przez system (funkcja prywatności BLE) — to samo
  fizyczne urządzenie może w rzadkich przypadkach zostać policzone jako dwa różne wpisy,
  jeśli zmieni adres w trakcie skanowania. To ograniczenie technologii BLE, nie tej aplikacji.
- Android **nie udostępnia** telefonowi dedykowanego sprzętu do wykrywania sygnałów RF poza
  Bluetooth/Wi-Fi (żadnego "RF/bug detektora") — aplikacja korzysta wyłącznie z wbudowanego
  odbiornika BLE.
- Na API 26–30 część producentów (OEM) dodatkowo wymaga włączonych systemowych "Usług
  lokalizacji", żeby skan BLE w ogóle zwracał wyniki — aplikacja to wykrywa i informuje
  użytkownika, ale nie ma na to wpływu.
- Emulatory Androida zwykle nie mają działającej implementacji BLE — do realnego testowania
  skanowania potrzebny jest fizyczny telefon.

## 7. Ograniczenia detekcji GPS/lokalizatorów

Aplikacja **jasno i uczciwie** informuje o granicach tego, co jest możliwe na zwykłym telefonie:

- Nie wykrywa lokalizatorów, które komunikują się wyłącznie przez sieć komórkową (GSM/LTE) —
  telefon nie ma technicznego dostępu do takiego skanowania.
- Nie wykrywa urządzeń, które nie emitują żadnego sygnału radiowego (wyłączonych, w pełnym
  uśpieniu bez advertisingu BLE).
- Nie posiada dedykowanego wykrywacza RF — tylko odbiornik BLE.
- Rozpoznanie producenta (np. Apple, Samsung) **nigdy samo w sobie** nie jest traktowane jako
  dowód, że urządzenie to lokalizator — telefony, słuchawki, zegarki i smart tagi tego samego
  producenta używają tego samego identyfikatora firmy.
- Silny sygnał RSSI **sam w sobie** nigdy nie podnosi urządzenia powyżej progu "NIEZNANE" w
  algorytmie scoringu — patrz `core/.../scoring/RiskScorer.kt`.

## 8. Architektura

**MVVM + Repository pattern + Coroutines/StateFlow**, podzielona na dwa moduły Gradle:

```
car-tracker-detector/
├── core/    (czysty moduł Kotlin/JVM — ZERO zależności od Androida)
│   └── .../core/
│       ├── model/       DeviceCategory, RiskLevel, SignalDistance, BleDeviceReading,
│       │                DetectedDevice, TrackerSignature, ScanSummary, UserDeviceAction
│       ├── parser/      ManufacturerDataParser, ServiceUuidClassifier, BluetoothCompanyIds
│       ├── signature/   TrackerSignatureDatabase, SignatureMatcher
│       ├── scoring/     RiskScorer, ScoringFactor  (algorytm 0-100)
│       ├── rssi/        RssiAnalyzer (strefy odległości + trend sygnału)
│       ├── dedup/       DeviceDeduplicator
│       └── engine/      DetectionEngine (spina dedup + sygnatury + scoring w jeden krok)
│
└── app/     (moduł Android — Compose UI, Bluetooth, Room)
    └── .../trackerdetector/
        ├── data/
        │   ├── bluetooth/    BleScanner (interfejs) + AndroidBleScanner, BleAvailability, BleScanError
        │   ├── database/     Room: AppDatabase, dao/, entity/, Converters, EntityMappers
        │   └── repository/   BleRepository, HistoryRepository, KnownDeviceRepository (interfejsy + Default*Impl)
        ├── detection/        ScanResultMapper (Android ScanResult -> core.BleDeviceReading)
        ├── permissions/      BlePermissions
        ├── ui/
        │   ├── home/ scanning/ results/ device/ carmap/ history/ settings/ technical/
        │   ├── navigation/   NavGraph, Destinations
        │   ├── theme/        ciemny, techniczny motyw Compose
        │   └── common/       RiskBadge, DeviceListItem
        └── util/
```

**Dlaczego dwa moduły?** Cała logika detekcji/scoringu/parsowania (najbardziej krytyczna pod
względem poprawności i "nie wprowadzaj w błąd") jest w module `:core`, który nie zależy od
Androida w ogóle — dzięki temu można ją przetestować i zweryfikować w zwykłym środowisku
Kotlin/JVM, bez Android SDK, emulatora czy fizycznego telefonu. Moduł `:app` jest cienką
warstwą Android/Compose/Bluetooth/Room, która z tej logiki korzysta.

**DI:** ręczny, prosty `AppContainer` (bez Hilt/Dagger) — świadoma decyzja dla MVP: mniej
ruchomych części, mniejsze ryzyko niekompatybilności wersji. Repozytoria są interfejsami
(`BleRepository`, `HistoryRepository`, `KnownDeviceRepository`), więc przejście na Hilt w
przyszłości jest proste, a ViewModel można testować z fałszywymi implementacjami już teraz.

## 9. Sposób dodawania nowych sygnatur

Lokalna baza sygnatur urządzeń śledzących żyje w jednym miejscu:
`core/src/main/kotlin/pl/azonera/trackerdetector/core/signature/TrackerSignatureDatabase.kt`.

Aby dodać nową sygnaturę, dopisz kolejny wpis `TrackerSignature` do listy `all`:

```kotlin
TrackerSignature(
    id = "unikalny-identyfikator",
    manufacturer = "Nazwa producenta lub null",
    manufacturerDataPattern = ManufacturerDataPattern(companyId = 0x0000, payloadPrefix = listOf(0x01)),
    serviceUuid = null, // albo np. ServiceUuidClassifier.TILE
    deviceNamePattern = null, // albo Regex("(?i)wzorzec")
    category = DeviceCategory.GPS_TRACKER,
    confidence = SignatureConfidence.LOW, // LOW/MEDIUM/HIGH
    verified = false, // true TYLKO dla oficjalnie potwierdzonych ID (Bluetooth SIG itp.)
    descriptionPl = "Uczciwy opis źródła i pewności tego dopasowania."
)
```

**Zasada:** `verified = true` tylko wtedy, gdy sygnatura opiera się o oficjalnie przyznany
identyfikator (np. Bluetooth SIG Company ID albo Service UUID). Wzorce oparte o nazwę
urządzenia lub nieoficjalne badania społeczności zawsze mają `verified = false` — algorytm
scoringu (`RiskScorer`) świadomie nagradza je mniejszą liczbą punktów, bo nazwę i część
manufacturer data można łatwo sfałszować. Nie dodawaj sygnatur "na wyczucie" — jeśli nie masz
pewności co do źródła danych, zostaw `verified = false` i niską pewność.

## 10. Sposób testowania

```bash
# Moduł core (czysty Kotlin/JVM) - działa bez Android SDK:
./gradlew :core:test

# Moduł app (wymaga Android SDK):
./gradlew :app:testDebugUnitTest
```

- **`:core`** — JUnit 5, 45 testów: `RiskScorerTest`, `ManufacturerDataParserTest`,
  `ServiceUuidClassifierTest`, `SignatureMatcherTest`, `DeviceDeduplicatorTest`,
  `RssiAnalyzerTest`, `DetectionEngineTest`. Weryfikują m.in. że silny sygnał RSSI sam w
  sobie nigdy nie podbija ryzyka powyżej progu "NIEZNANE", że oznaczenie "Moje urządzenie"
  zawsze zeruje wynik, że niezweryfikowana sygnatura daje mniejszy bonus niż zweryfikowana,
  oraz poprawność parsowania Manufacturer Data / Service UUID.
- **`:app`** — JUnit 4 (domyślny runner Android Gradle Plugin dla `test*UnitTest`) +
  Robolectric (do testów zależnych od poziomu API) + MockK + `kotlinx-coroutines-test`:
  `ConvertersTest` (round-trip encode/decode dla Room), `BlePermissionsTest` (poprawny dobór
  uprawnień per wersja Androida, Robolectric symuluje różne `SDK_INT`), `ScanningViewModelTest`
  (pełny cykl skanowania z `FakeBleScanner`/`FakeBleRepository`/`FakeKnownDeviceRepository` —
  bez fizycznego telefonu, bez prawdziwego Bluetootha, bez bazy danych).

## 11. Build APK

```bash
./gradlew :app:assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk

./gradlew :app:assembleRelease
# wymaga skonfigurowanego podpisywania w app/build.gradle.kts
```

## 12. Ograniczenia środowiska, w którym powstał ten projekt

Ten projekt został napisany w izolowanym środowisku (sandboxie) bez dostępu do
`dl.google.com`/`maven.google.com` (organizacyjna polityka sieciowa blokuje te hosty —
zweryfikowano: `CONNECT dl.google.com:443` → `403`). To oznacza, że w tym konkretnym
środowisku **nie było możliwe**:

- pobranie Android SDK (platformy, build-tools),
- pobranie Android Gradle Plugin ani żadnej biblioteki AndroidX (Compose, Room, Navigation) —
  te pakiety są publikowane wyłącznie w repozytorium Google Maven, a nie na Maven Central,
- realny build modułu `:app` ani wygenerowanie pliku APK.

**Co faktycznie zweryfikowano w tym środowisku:** moduł `:core` (cała logika detekcji,
scoringu, parsowania, deduplikacji) skompilował się i przeszedł **45/45 testów jednostkowych**
zwykłym Gradle + JDK 17/21, bez jakiejkolwiek zależności od Androida — to była świadoma
decyzja architektoniczna właśnie po to, żeby najważniejsza pod względem poprawności logika
dała się realnie zweryfikować niezależnie od dostępności Android SDK.

Moduł `:app` (Compose UI, Bluetooth, Room) został napisany kompletnie i starannie
zrecenzowany ręcznie (poprawność API, importów, sygnatur, zgodność z `minSdk 26`), ale **jego
faktyczna kompilacja i uruchomienie testów wymaga zbudowania go w środowisku z dostępem do
Android SDK/Google Maven** — czyli w normalnym Android Studio z dostępem do internetu.
Jeśli po pierwszym `./gradlew :app:assembleDebug` w takim środowisku pojawią się błędy
kompilacji, to najbardziej prawdopodobne miejsca do sprawdzenia w pierwszej kolejności to
dokładne wersje bibliotek AndroidX Compose/Room w `gradle/libs.versions.toml` (mogły się od
napisania tego kodu pojawić nowsze, niekolidujące wersje) oraz status API `SegmentedButton`/
`LinearProgressIndicator(progress = {...})` w Material3 (w kodzie już oznaczone
`@OptIn(ExperimentalMaterial3Api::class)` tam, gdzie mogą tego wymagać).

## 13. Znane ograniczenia (poza Android SDK) i pomysły na wersję 2.0

Patrz końcowy raport w opisie zadania / commit message. Krótko: brak scan-Wi-Fi jako
dodatkowego sygnału, brak korelacji GPS-lokalizacji między sesjami (poza liczeniem powrotów
tego samego adresu MAC), brak eksportu/importu historii, brak jasnego/ciemnego motywu do
wyboru (aplikacja jest celowo zawsze ciemna).

## Licencja

Brak jawnie określonej licencji w tym katalogu — do ustalenia przez właściciela repozytorium.
