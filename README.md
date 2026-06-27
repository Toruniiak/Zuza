# 🏝️ Edukacyjna Wyspa

Magiczna wyspa nauki i zabawy dla dzieci — aplikacja PWA (działa offline,
można ją zainstalować na telefonie/tablecie jak zwykłą apkę).

## 📁 Struktura plików

| Plik | Opis |
|------|------|
| `index.html` | Strona główna (HTML) |
| `styles.css` | Wszystkie style |
| `app.js` | Cała logika aplikacji |
| `manifest.json` | Manifest PWA (nazwa, ikony, kolory) |
| `sw.js` | Service Worker — cache i tryb offline |
| `icon.svg` | Ikona aplikacji |
| `.nojekyll` | Wyłącza przetwarzanie Jekyll na GitHub Pages |

## 🚀 Publikacja na GitHub Pages

1. Wgraj **wszystkie pliki z tego folderu** do repozytorium (zachowaj nazwy bez zmian).
2. Wejdź w repo → **Settings → Pages**.
3. W sekcji *Build and deployment* wybierz **Source: Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)` → **Save**.
5. Po chwili aplikacja będzie dostępna pod adresem:
   `https://<twoja-nazwa>.github.io/<nazwa-repo>/`

> Ścieżki są **względne**, więc apka działa zarówno w katalogu głównym,
> jak i w podkatalogu repozytorium — nic nie trzeba zmieniać.

## 🔄 Aktualizacja wersji (ważne!)

Service Worker buforuje pliki, więc po zmianach użytkownicy mogą widzieć starą wersję.
Po każdej edycji **podbij numer wersji** w `sw.js`:

```js
const CACHE = 'edwyspa-v3';   // → zmień na 'edwyspa-v4' itd.
```

Dzięki temu stary cache zostanie usunięty i wczyta się nowa wersja.

## 📲 Instalacja jako aplikacja

Na telefonie/tablecie: otwórz stronę w przeglądarce → menu → **„Dodaj do ekranu głównego"**.
Aplikacja działa najlepiej w **orientacji poziomej (landscape)**.

## 💾 Dane

Postęp dziecka (imię, gwiazdki, ukończone zadania) zapisywany jest lokalnie
w `localStorage` przeglądarki — nic nie jest wysyłane na żadne serwery.
