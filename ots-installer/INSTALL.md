# Automatyczny instalator Tibia 8.60 OTS — instrukcja (1 kliknięcie)

Instalator sam łączy się z Twoim VPS, robi porządek, instaluje **wszystko**
(silnik, bazę danych, stronę WWW, firewall, usługę autostartu) i kończy pracę
dopiero, gdy serwer jest **ONLINE** i można zalogować się do gry.

## Czego potrzebujesz (tylko to)

1. **VPS** z czystym systemem: Ubuntu 20.04 / 22.04 / 24.04 lub Debian 11 / 12
   (min. 2 GB RAM — instalator sam dorobi swap, zalecane 4 GB+).
2. **IP serwera** i **hasło roota** (dostajesz je mailem od firmy hostingowej).
3. Windows 10/11 z wbudowanym SSH (jest domyślnie) — albo dowolny terminal.

## Sposób 1 — Windows, jedno kliknięcie

1. Pobierz z tego folderu dwa pliki: `ZAINSTALUJ-OTS.bat` oraz `install-ots.sh`
   (muszą leżeć w tym samym folderze).
2. Kliknij dwukrotnie **`ZAINSTALUJ-OTS.bat`**.
3. Wpisz IP swojego VPS, potem hasło roota (raz).
4. Czekaj — kompilacja silnika trwa 5–20 minut. **Nie zamykaj okna.**
5. Na końcu zobaczysz zielony komunikat `SERWER JEST ONLINE` oraz dane
   logowania (konto, hasło, IP, port).

## Sposób 2 — jedna komenda z terminala (Linux/Mac/Windows PowerShell)

```bash
ssh root@TWOJE_IP "bash -s" < install-ots.sh
```

## Sposób 3 — bezpośrednio na VPS

```bash
wget https://raw.githubusercontent.com/Toruniiak/Zuza/claude/tibia-ots-server-guide-x7unt9/ots-installer/install-ots.sh
sudo bash install-ots.sh
```

## Logowanie do gry po instalacji

W **OTClient** (https://github.com/edubart/otclient/releases):

| Pole | Wartość |
|------|---------|
| Server / Host | IP Twojego VPS |
| Port | `7171` |
| Client version | `8.60` (860) |
| Account | `god` |
| Password | wyświetlone na końcu instalacji |

Postać **God** ma pełne uprawnienia administratora.

## Co dokładnie robi instalator

1. Sprawdza system i wykrywa publiczne IP VPS.
2. Zatrzymuje/porządkuje ewentualne stare instalacje.
3. Aktualizuje system i instaluje wszystkie pakiety oraz biblioteki.
4. Tworzy swap, jeśli VPS ma mało RAM (kompilacja tego wymaga).
5. Instaluje i konfiguruje MariaDB, tworzy bazę + użytkownika
   (hasła generowane losowo — bezpieczne).
6. Pobiera i kompiluje silnik **TFS 1.5 downgrade 8.60** (nekiro) —
   nowoczesny, stabilny silnik z protokołem Tibii 8.60, z wbudowaną mapą.
7. Importuje schemat bazy i tworzy konto `god` z postacią **God**.
8. Konfiguruje `config.lua` tak, aby **IP, porty i baza były spójne** —
   klient, strona i serwer używają tych samych danych.
9. Instaluje stronę WWW (MyAAC) połączoną z tą samą bazą.
10. Konfiguruje firewall UFW (otwarte tylko: 22, 80, 443, 7171, 7172).
11. Tworzy usługę `systemd` z auto-restartem i autostartem po reboocie.
12. **Czeka, aż port gry 7171 realnie odpowiada** — dopiero wtedy ogłasza
    sukces i wypisuje dane logowania.

Wszystkie hasła i dane trafiają do `/root/ots-credentials.txt` na VPS.
Pełny log instalacji: `/root/ots-install.log`.

## Najważniejsze komendy po instalacji

```bash
systemctl status tibia     # stan serwera
systemctl restart tibia    # restart
journalctl -u tibia -f     # podgląd na żywo
cat /root/ots-credentials.txt   # dane logowania i hasła
tail -f /opt/tibia/server/logs/server.log
```

## Gdy coś pójdzie nie tak

- Instalator jest **idempotentny** — po przerwaniu (zerwane SSH, restart VPS)
  uruchom go ponownie: dokończy pracę od miejsca, w którym skończył, nie
  psując tego, co już zrobił.
- Każdy błąd wypisuje nazwę etapu i ostatnie linie logu.
- Jeśli automatyczna instalacja strony WWW się nie powiedzie, serwer gry
  działa dalej — stronę dokończysz w przeglądarce pod `http://IP/install`
  (4 kliknięcia); instalator wyraźnie o tym poinformuje.

## Uwagi

- Silnik to TFS 1.5 downgrade do protokołu 8.60, a nie stary TFS 0.3.6 —
  celowo: 0.3.6 nie kompiluje się automatycznie na współczesnych systemach.
  Dla gracza różnicy nie ma (klient 8.60 loguje się normalnie), a stabilność
  i bezpieczeństwo są znacznie wyższe.
- Instalator używa wbudowanej mapy TFS (w pełni grywalna, z miastem).
  Real Map 8.6 możesz podmienić później: wgraj `.otbm` do
  `/opt/tibia/server/data/world/` i zmień `mapName` w `config.lua`.
