# Kompletny Przewodnik: Tibia 8.6 OTS (TFS 0.3.6 / TFS 1.x downgrade)

> Cel: serwer dla 200–700 graczy | 99.9% uptime | zero crashów | pełne bezpieczeństwo

---

## ETAP 1 — NARZĘDZIA: LISTA DO INSTALACJI

### 1. Silnik TFS (The Forgotten Server)

**Opcja A — TFS 0.3.6 Crying Damson (natywny 8.6, stabilny, sprawdzony)**
```
https://github.com/otland/forgottenserver                  # główne repo
https://github.com/edubart/otserv/tree/crying-damson       # Crying Damson fork
```

Klonowanie:
```bash
git clone https://github.com/edubart/otserv.git --branch crying-damson tfs036
# lub gotowy release z patchem 8.6:
git clone https://github.com/slawkens/myaac.git            # (dla CMS - patrz etap 5)
```

**Opcja B — TFS 1.5 z downgradem protokołu do 8.6 (nowszy engine, lepszy Lua 5.4)**
```
https://github.com/otland/forgottenserver                  # branch: master (TFS 1.5)
```
Downgrade protokołu wymaga patcha — patrz sekcja 3.3.

---

### 2. Baza danych: MariaDB 10.6 LTS (zalecana nad MySQL 5.7)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y mariadb-server mariadb-client
sudo mysql_secure_installation     # ustaw root password, usuń anonimowe konta
sudo systemctl enable mariadb
sudo systemctl start mariadb
```

**CentOS/RHEL:**
```bash
sudo dnf install -y mariadb-server mariadb
sudo systemctl enable --now mariadb
sudo mysql_secure_installation
```

**Windows:** Pobierz instalator z https://mariadb.org/download/ (MariaDB 10.6 MSI x64)

Weryfikacja po instalacji:
```bash
mysql --version        # MariaDB 10.6.x
sudo systemctl status mariadb
```

---

### 3. CMS: MyAAC (zalecany) lub Gesior 2012

**MyAAC (aktywnie rozwijany, PHP 7.4–8.2):**
```
https://github.com/slawkens/myaac
```
```bash
git clone https://github.com/slawkens/myaac.git /var/www/html/ots
```

**Gesior ACC 2012 (klasyczny, sprawdzony):**
```
https://github.com/gesior/Gesior2012
```
```bash
git clone https://github.com/gesior/Gesior2012.git /var/www/html/ots
```

Wymagania PHP:
```bash
sudo apt-get install -y php8.1 php8.1-mysql php8.1-curl php8.1-gd \
  php8.1-mbstring php8.1-xml php8.1-zip php8.1-bcmath
```

---

### 4. Kompilator

**Windows — Visual Studio Community 2022:**
```
https://visualstudio.microsoft.com/vs/community/
```
Podczas instalacji zaznacz:
- "Desktop development with C++"
- Windows 10/11 SDK (najnowszy)
- MSVC v143 toolset

**Linux — GCC 11+ (domyślny w Ubuntu 22.04):**
```bash
sudo apt-get install -y build-essential gcc g++ cmake make
g++ --version    # powinno pokazać 11.x lub wyżej
cmake --version  # 3.18+
```

---

### 5. Git

**Linux:**
```bash
sudo apt-get install -y git
git config --global user.name "TwojaNazwa"
git config --global user.email "twoj@email.com"
```

**Windows:** https://git-scm.com/download/win (Git for Windows 2.43+)

---

### 6. Biblioteki zależności TFS

**Ubuntu/Debian (wszystkie naraz):**
```bash
sudo apt-get install -y \
  libboost-all-dev \
  libssl-dev \
  zlib1g-dev \
  liblua5.4-dev \
  libmysqlclient-dev \
  libmariadb-dev \
  libxml2-dev \
  libgmp-dev \
  libpugixml-dev \
  pkg-config
```

**Wersje minimalne:**
| Biblioteka | Wersja min |
|------------|-----------|
| Boost      | 1.74      |
| OpenSSL    | 1.1.1     |
| zlib       | 1.2.11    |
| Lua        | 5.4       |
| libmariadb | 3.x       |

---

### 7. Narzędzia pomocnicze

**OTClient (klient do testów):**
```
https://github.com/edubart/otclient/releases
```
Pobierz `otclient-standalone-windows.zip` lub skompiluj dla Linuxa.

**RME — Real Map Editor (edytor map):**
```
https://github.com/hampusborgos/rme/releases
```
Pobierz `RME_v3.x.x_win64.zip`

**WinSCP (transfer plików na VPS):**
```
https://winscp.net/eng/download.php
```
Wersja 6.x, protokół SFTP.

**Checklist weryfikacji Etap 1:**
- [ ] TFS sklonowany lokalnie
- [ ] MariaDB uruchomiona (`systemctl status mariadb`)
- [ ] PHP z wymaganymi rozszerzeniami (`php -m | grep -E 'mysql|curl|gd'`)
- [ ] GCC/MSVC dostępny w PATH (`g++ --version`)
- [ ] Wszystkie biblioteki zainstalowane (`pkg-config --libs libmariadb`)
- [ ] Git skonfigurowany (`git config --list`)

---

## ETAP 2 — UMIEJĘTNOŚCI I SKILE DO OPANOWANIA

### 1. Lua Scripting

**Dlaczego ważne:** Cała logika serwera (spawny, spelle, questy, eventy) jest w Lua. Błąd = crash lub exploit.

**Podstawy składni Lua dla TFS:**
```lua
-- config.lua: odczyt globalnych ustawień
local maxPlayers = getConfigValue("maxPlayers")

-- Funkcja z typem zwracanym
function onLogin(player)
    if player:getAccountType() < ACCOUNT_TYPE_NORMAL then
        return false
    end
    player:sendTextMessage(MESSAGE_STATUS_CONSOLE_BLUE, "Witaj na serwerze!")
    return true
end

-- Tabele (odpowiednik obiektów JSON)
local monsters = {
    ["rat"] = { health = 20, exp = 5, speed = 100 },
    ["orc"] = { health = 150, exp = 25, speed = 130 },
}

-- Iteracja
for name, data in pairs(monsters) do
    print(name .. " HP: " .. data.health)
end
```

**Ważne pliki Lua w TFS 0.3.6:**
```
data/
├── lib/
│   ├── 050-function.lua     # funkcje globalne (sendMail, getItemName itp.)
│   ├── 060-storage.lua      # stałe storage value
│   └── 004-theActionids.lua # action ID stałe
├── scripts/
│   ├── login.lua            # obsługa logowania
│   └── logout.lua           # obsługa wylogowania
├── actions/scripts/         # interakcje z przedmiotami
├── creaturescripts/scripts/ # eventy na potworach
├── movements/scripts/       # wejście na tile
├── spells/scripts/          # spelle
└── talkactions/scripts/     # komendy /!command
```

**Przykład edycji lib/050-function.lua — dodanie własnej funkcji:**
```lua
-- Dodaj na końcu pliku 050-function.lua
function sendServerMessage(msg)
    for _, player in ipairs(Game.getPlayers()) do
        player:sendTextMessage(MESSAGE_STATUS_WARNING, "[SERVER] " .. msg)
    end
end

function getPlayerByNameSafe(name)
    local player = Player(name)
    if not player then
        return nil
    end
    return player
end
```

**Przykład talkaction (komenda gracza):**
```lua
-- data/talkactions/scripts/serverinfo.lua
function onSay(player, words, param)
    local online = #Game.getPlayers()
    player:sendTextMessage(MESSAGE_STATUS_CONSOLE_BLUE,
        "Online: " .. online .. " | Max: " .. getConfigValue("maxPlayers"))
    return true
end
-- data/talkactions/talkactions.xml:
-- <talkaction words="!info" script="serverinfo.lua" />
```

---

### 2. MySQL/MariaDB Management

**Struktura kluczowych tabel:**
```sql
-- Główne tabele TFS 0.3.6
accounts         -- konta graczy (id, name, password, email, type)
players          -- postacie (id, name, account_id, vocation, level, health...)
player_items     -- ekwipunek (player_id, pid, sid, itemtype, count, attributes)
player_storage   -- storage values (player_id, key, value)
guilds           -- gildie
guild_membership -- przynależność do gildii
tiles            -- zapisane tilesy (dla house items)
houses           -- domy
bans             -- bany (ip, account, player)
```

**Tworzenie usera i bazy:**
```sql
-- Jako root:
CREATE DATABASE tibia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tibia_user'@'localhost' IDENTIFIED BY 'SecurePass123!';
GRANT ALL PRIVILEGES ON tibia_db.* TO 'tibia_user'@'localhost';
FLUSH PRIVILEGES;

-- Weryfikacja:
SHOW GRANTS FOR 'tibia_user'@'localhost';
```

**Import schematu:**
```bash
mysql -u root -p tibia_db < /path/to/tfs/schema.sql
# Weryfikacja:
mysql -u tibia_user -p tibia_db -e "SHOW TABLES;"
mysql -u tibia_user -p tibia_db -e "SELECT COUNT(*) FROM players;"
```

**Backup:**
```bash
# Pełny backup z kompresją:
mysqldump -u tibia_user -p'SecurePass123!' tibia_db | gzip > /backups/tibia_$(date +%F).sql.gz

# Restore:
gunzip < /backups/tibia_2024-01-15.sql.gz | mysql -u tibia_user -p tibia_db

# Cron: codzienny backup o 4:00
echo "0 4 * * * tibia_user mysqldump -u tibia_user -p'SecurePass123!' tibia_db | gzip > /backups/tibia_\$(date +\%F).sql.gz" | sudo tee /etc/cron.d/tibia-backup
```

**Użyteczne zapytania diagnostyczne:**
```sql
-- Najwyżej poziomowi gracze:
SELECT name, level, vocation, online FROM players ORDER BY level DESC LIMIT 10;

-- Ostatnio zalogowani (Unix timestamp):
SELECT name, FROM_UNIXTIME(lastlogin) as last FROM players ORDER BY lastlogin DESC LIMIT 20;

-- Rozmiar tabel:
SELECT table_name, ROUND(data_length/1024/1024, 2) AS 'MB'
FROM information_schema.tables WHERE table_schema = 'tibia_db' ORDER BY data_length DESC;
```

---

### 3. Linux Admin (VPS)

**SSH access:**
```bash
ssh -i ~/.ssh/id_rsa user@twoj.serwer.ip
# Lub z hasłem (odradzane):
ssh user@IP -p 22
```

**Zarządzanie procesem TFS:**
```bash
# Uruchomienie w tle z nohup:
nohup ./tfs > logs/server.log 2>&1 &
echo $! > tfs.pid

# Sprawdzenie czy działa:
ps aux | grep tfs
cat tfs.pid | xargs kill -0 && echo "Działa" || echo "Nie działa"

# Zatrzymanie:
kill $(cat tfs.pid)

# Jako systemd service (patrz Etap 8):
sudo systemctl start tibia
sudo systemctl stop tibia
sudo systemctl restart tibia
sudo systemctl status tibia
```

**Uprawnienia plików:**
```bash
chmod 755 tfs                          # wykonywalny binary
chmod 644 config.lua                   # konfiguracja (do odczytu)
chmod -R 644 data/                     # skrypty (do odczytu)
chown -R tibia:tibia /opt/tibia/       # właściciel procesu
```

**Monitorowanie:**
```bash
# RAM i CPU:
htop
# lub:
ps aux --sort=-%mem | head -5

# Logi w czasie rzeczywistym:
tail -f logs/server.log
tail -f logs/errors.log

# Użycie dysku:
df -h
du -sh /opt/tibia/logs/
```

---

### 4. Bezpieczeństwo

**SQL Injection — prepared statements w Lua TFS:**
```lua
-- ŹLE (podatne na injection):
local result = db.query("SELECT * FROM players WHERE name = '" .. playerName .. "'")

-- DOBRZE (prepared statement):
local result = db.query(string.format(
    "SELECT `id`, `name`, `level` FROM `players` WHERE `name` = %s LIMIT 1",
    db.escapeString(playerName)
))
```

**Hashowanie haseł:**
TFS 0.3.6 używa SHA1 — zmień na bcrypt przez patch lub tabelę accounts.password_type:
```lua
-- W data/lib/050-function.lua:
function hashPassword(password)
    -- TFS 1.x: bcrypt automatycznie
    -- TFS 0.3.6: zmień w config.lua:
    -- passwordType = "bcrypt"
    return password  -- TFS obsługuje hash automatycznie wg config
end
```

```
# config.lua:
passwordType = "bcrypt"
-- lub: "sha1", "md5", "sha256", "sha512"
-- Zalecane: "bcrypt" (TFS 1.x) lub "sha256" (TFS 0.3.6 z patchem)
```

**DDoS — iptables rate limiting:**
```bash
# Ogranicz połączenia do portu 7171 do 20/minutę per IP:
sudo iptables -A INPUT -p tcp --dport 7171 -m state --state NEW \
  -m recent --set --name TIBIA
sudo iptables -A INPUT -p tcp --dport 7171 -m state --state NEW \
  -m recent --update --seconds 60 --hitcount 20 --name TIBIA -j DROP

# Ogranicz SYN flood:
sudo iptables -A INPUT -p tcp --syn --dport 7171 -m limit \
  --limit 25/s --limit-burst 50 -j ACCEPT
sudo iptables -A INPUT -p tcp --syn --dport 7171 -j DROP

# Zapisz reguły:
sudo iptables-save > /etc/iptables/rules.v4
```

---

### 5. Optymalizacja

**MariaDB — my.cnf dla serwera OTS:**
```ini
# /etc/mysql/mariadb.conf.d/99-tibia.cnf
[mysqld]
innodb_buffer_pool_size     = 2G          # ~50-70% dostępnego RAM
innodb_log_file_size        = 256M
innodb_flush_log_at_trx_commit = 2        # szybsze zapisy, ryzyko utraty 1s danych
query_cache_type            = 1
query_cache_size            = 128M
max_connections             = 200
thread_cache_size           = 50
table_open_cache            = 2000
key_buffer_size             = 128M
```

**Indeksy bazy danych (dodaj po imporcie schematu):**
```sql
-- Przyspiesza logowanie i wyszukiwanie:
ALTER TABLE players ADD INDEX idx_name (name);
ALTER TABLE players ADD INDEX idx_account (account_id);
ALTER TABLE player_storage ADD INDEX idx_player_key (player_id, key);
ALTER TABLE bans ADD INDEX idx_ip (ip);
ALTER TABLE bans ADD INDEX idx_account (account_id);
```

**Log rotation:**
```bash
# /etc/logrotate.d/tibia
/opt/tibia/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    postrotate
        kill -HUP $(cat /opt/tibia/tfs.pid) 2>/dev/null || true
    endscript
}
```

**RAM management — limits w systemd:**
```ini
# W pliku service (patrz Etap 8):
MemoryMax=6G
MemorySwapMax=0
```

---

### 6. HTML/CSS/PHP — personalizacja CMS

**Edycja konfiguracji MyAAC:**
```php
// config.php (MyAAC)
$config['server_name']    = 'NazwaSerwera';
$config['server_motd']    = 'Witaj na naszym serwerze!';
$config['location']       = 'Polska';
$config['vocation_names'] = ['None', 'Sorcerer', 'Druid', 'Paladin', 'Knight'];
$config['highscores_perpage'] = 50;
$config['account_management_enabled'] = true;
$config['client_version']  = 860;
$config['mysql_host']      = 'localhost';
$config['mysql_user']      = 'tibia_user';
$config['mysql_pass']      = 'SecurePass123!';
$config['mysql_db']        = 'tibia_db';
$config['admin_panel_login'] = true;
```

**Zmiana koloru motywu (CSS):**
```css
/* system/templates/default/css/style.css */
:root {
    --primary-color: #8B6914;      /* złoty kolor Tibii */
    --secondary-color: #2c1810;    /* ciemnobrązowy */
    --accent-color: #c8a84b;       /* jasne złoto */
    --bg-color: #1a0f0a;           /* ciemne tło */
}
```

**Checklist weryfikacji Etap 2:**
- [ ] Potrafisz napisać talkaction w Lua i zarejestrować go w XML
- [ ] Potrafisz wykonać backup bazy i przywrócić go
- [ ] Znasz komendy systemctl do zarządzania procesem TFS
- [ ] Rozumiesz różnicę między db.escapeString a raw query
- [ ] MariaDB skonfigurowana z właściwym innodb_buffer_pool_size

---

## ETAP 3 — SETUP: KROK PO KROKU

### 3.1 Klonowanie i struktura folderów

```bash
# Utwórz główny katalog:
sudo mkdir -p /opt/tibia
sudo chown $USER:$USER /opt/tibia
cd /opt/tibia

# TFS 0.3.6 Crying Damson:
git clone https://github.com/edubart/otserv.git --branch crying-damson server
cd server

# Struktura po klonowaniu:
/opt/tibia/server/
├── config.lua          # GŁÓWNA KONFIGURACJA
├── schema.sql          # schemat bazy danych
├── tfs (lub tfs.exe)   # skompilowany binary (po kompilacji)
├── data/
│   ├── lib/            # biblioteki Lua
│   ├── scripts/        # login/logout/events
│   ├── actions/        # interakcje z itemami
│   ├── creaturescripts/ # eventy potworów
│   ├── movements/      # tile events
│   ├── spells/         # spelle
│   ├── talkactions/    # komendy graczy
│   ├── monster/        # definicje potworów (XML)
│   ├── items/          # items.xml, items.otb
│   ├── XML/            # vocations.xml, spells.xml itp.
│   └── world/          # mapa .otbm
├── logs/               # logi serwera (utwórz ręcznie)
└── backups/            # backupy (utwórz ręcznie)

# Utwórz katalogi pomocnicze:
mkdir -p logs backups
```

---

### 3.2 Konfiguracja config.lua

Poniżej kompletny, gotowy config.lua dla serwera 8.6:

```lua
-- config.lua dla TFS 0.3.6 / Tibia 8.6
-- ============================================

-- SIEĆ
ip                  = "0.0.0.0"              -- nasłuchuj na wszystkich interfejsach
bindOnlyGlobalAddress = false
loginProtocolPort   = 7171
gameProtocolPort    = 7172
statusProtocolPort  = 7171

-- BAZA DANYCH
sqlType             = "mysql"
sqlHost             = "localhost"
sqlPort             = 3306
sqlUser             = "tibia_user"
sqlPassword         = "SecurePass123!"
sqlDatabase         = "tibia_db"
sqlFile             = "schema.sql"
sqlKeepAlive        = 60                     -- sekundy między keepalive queries

-- MAPA
mapName             = "world/map"            -- bez rozszerzenia .otbm
mapAuthor           = "Admin"

-- SERWER
serverName          = "NazwaSerwera"
statusTimeout       = 5000
loginTries          = 5
retryTimeout        = 30

-- GRACZE
maxPlayers          = 500
-- Per-IP:
maxPlayersPerAccount = 1
-- Konta:
ownerName           = "Owner"
ownerEmail          = "admin@serwer.pl"

-- KONTA (admin)
-- Po imporcie bazy zmień w tabeli accounts:
-- UPDATE accounts SET type=5 WHERE name='AccountName';

-- BEZPIECZEŃSTWO
passwordType        = "sha256"               -- lub "bcrypt" (TFS 1.x)
allowChangeOutfit   = true
combatProtectionSystem = true
loginProtection     = true
kickIdlePlayersAfterSeconds = 900            -- kick po 15 min AFK

-- PARAMETRY GRY
worldName           = "NazwaŚwiata"
worldType           = "pvp"                  -- "pvp", "non-pvp", "pvp-enforced"
pvpType             = 0                      -- 0=PvP, 1=No-PvP, 2=Hardcore PvP

-- RESPAWN / BALANS
rateExp             = 5                      -- x5 EXP
rateSkill           = 5
rateMagic           = 5
rateLoot            = 3
rateSpawn           = 1
deathLostPercent    = 10                     -- 10% straty przy śmierci

-- CZASY
saveInterval        = 1200                   -- auto-save co 20 minut (sekundy)
cleanMap            = false                  -- nie czyść mapy przy save
cleanMapCycle       = 0

-- DOMY (houses)
housePricePerSqm    = 1000                   -- cena za m2 (gold)
houseRentPeriod     = "monthly"

-- LOGI
logFile             = "logs/server.log"
errorFile           = "logs/errors.log"
warningsFile        = "logs/warnings.log"

-- GAME FEATURES
allowWalkthrough    = false
classicAttackSpeed  = false
maximumAttackSpeed  = false
criticalHitChance   = 7
criticalHitDamage   = 0.30

-- PREMIUM
premiumToCreateGuilds = true
premiumForMotd      = false
freeAccountDaysToSelect = false

-- SKALE POSTACI (balans)
gainHealthTicks     = 6
gainHealthAmount    = 1
gainManaTicks       = 6
gainManaAmount      = 1
```

---

### 3.3 Import bazy danych

```bash
# Utwórz bazę i usera:
sudo mysql -u root -p << 'EOF'
CREATE DATABASE tibia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tibia_user'@'localhost' IDENTIFIED BY 'SecurePass123!';
GRANT ALL PRIVILEGES ON tibia_db.* TO 'tibia_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Import schematu:
mysql -u tibia_user -p'SecurePass123!' tibia_db < /opt/tibia/server/schema.sql

# Weryfikacja:
mysql -u tibia_user -p'SecurePass123!' tibia_db -e "SHOW TABLES;"
mysql -u tibia_user -p'SecurePass123!' tibia_db -e "SELECT COUNT(*) as accounts FROM accounts;"
mysql -u tibia_user -p'SecurePass123!' tibia_db -e "SELECT COUNT(*) as players FROM players;"

# Utwórz konto admina (wykonaj po pierwszym uruchomieniu serwera i rejestracji):
mysql -u tibia_user -p'SecurePass123!' tibia_db -e \
  "UPDATE accounts SET type=5 WHERE name='TwojeKonto';"
```

---

### 3.4 Kompilacja TFS

**Linux (rekomendowane — CMake):**
```bash
cd /opt/tibia/server

# Sprawdź zależności:
pkg-config --exists libmariadb && echo "MariaDB: OK" || echo "MariaDB: BRAK"
pkg-config --exists openssl && echo "OpenSSL: OK" || echo "OpenSSL: BRAK"
pkg-config --exists lua5.4 && echo "Lua: OK" || echo "Lua: BRAK"

# Kompilacja (TFS 0.3.6 używa Makefile):
./autogen.sh      # jeśli istnieje
./configure --enable-mysql --enable-lua --with-optimize
make -j$(nproc)

# Wynik: plik 'tfs' w bieżącym katalogu
ls -lah tfs

# TFS 1.x (CMake):
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
cp tfs ../
cd ..
```

**Windows (Visual Studio 2022):**
1. Otwórz `TFS.sln` w Visual Studio
2. Ustaw konfigurację: `Release` + `x64`
3. Right-click projekt → Properties → C/C++ → Additional Include Dirs: dodaj ścieżki do vcpkg
4. Build → Build Solution (Ctrl+Shift+B)
5. Output: `x64/Release/tfs.exe`

**Instalacja vcpkg dla Windows:**
```powershell
git clone https://github.com/microsoft/vcpkg.git C:\vcpkg
C:\vcpkg\bootstrap-vcpkg.bat
C:\vcpkg\vcpkg install boost:x64-windows openssl:x64-windows zlib:x64-windows lua:x64-windows libmariadb:x64-windows
# W Visual Studio: Tools → Options → vcpkg → General → vcpkg directory = C:\vcpkg
```

**Częste błędy kompilacji:**

| Błąd | Przyczyna | Rozwiązanie |
|------|-----------|-------------|
| `lua.h: No such file` | Brak Lua dev | `apt install liblua5.4-dev` |
| `cannot find -lmariadb` | Brak libmariadb | `apt install libmariadb-dev` |
| `boost/asio.hpp not found` | Brak Boost | `apt install libboost-all-dev` |
| `error: C2039: 'const_iterator'` | Zły standard C++ | Dodaj `/std:c++17` w VS |
| `undefined reference to XML_*` | Brak libxml2 | `apt install libxml2-dev` |

---

### 3.5 Testowanie lokalnie

```bash
# Uruchomienie:
cd /opt/tibia/server
./tfs

# Spodziewane logi przy poprawnym starcie:
# [info] The Forgotten Server - Version X.X
# [info] Compiled with: [...]
# [info] A server is running on: 0.0.0.0 (Port: 7171)
# [info] Login Server started.

# Test połączenia (z lokalnego klienta):
# OTClient → Servers → Add:
#   Host: 127.0.0.1
#   Port: 7171
#   Version: 8.6
#   Name: Test Server

# Test statusu przez netstat:
netstat -tlnp | grep 7171
# Wynik: tcp 0 0 0.0.0.0:7171 0.0.0.0:* LISTEN PID/tfs
```

**Checklist weryfikacji Etap 3:**
- [ ] `./tfs` uruchamia się bez błędów
- [ ] Port 7171 nasłuchuje (`netstat -tlnp | grep 7171`)
- [ ] OTClient łączy się z localhost:7171
- [ ] Możesz się zalogować i poruszać postacią
- [ ] Baza danych otrzymuje dane (sprawdź tabele `players`, `player_items`)

---

## ETAP 4 — MAPA I ASETY

### 4.1 Pobranie Real Map 8.6

**Źródła mapy:**
```
# Oryginalny Tibia 8.6 map extract (OTLand forums):
https://otland.net/threads/real-8-6-map.112879/
# Alternatywnie: poszukaj "Tibia 8.60 real map otbm" na forums.otserv.pl

# Real map package zawiera zwykle:
tibia_8.6.otbm         # mapa (świat)
tibia_8.6.xml          # spawn points
creatures/             # definicje potworów (opcjonalnie)
```

### 4.2 Instalacja mapy

```bash
# Skopiuj mapę:
cp tibia_8.6.otbm /opt/tibia/server/data/world/map.otbm
cp tibia_8.6.xml  /opt/tibia/server/data/world/map.xml   # opcjonalnie

# W config.lua ustaw:
# mapName = "world/map"    (bez rozszerzenia)

# Struktura:
/opt/tibia/server/data/world/
├── map.otbm           # mapa świata
├── map.xml            # opcjonalny plik spawn/house
└── README.txt
```

### 4.3 Konfiguracja potworów

```bash
# Potwory TFS 0.3.6 (standardowe lokalizacje):
/opt/tibia/server/data/monster/
├── monsters.xml           # główny plik lista potworów
├── Animals/
│   ├── rat.xml
│   └── deer.xml
├── Humanoids/
│   ├── orc.xml
│   └── elf.xml
└── Dragons/
    └── dragon.xml

# Przykład rat.xml:
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<monster name="Rat" nameDescription="a rat" race="blood" experience="5"
         speed="100" manacost="0">
    <health now="20" max="20"/>
    <look type="21" head="0" body="0" legs="0" feet="0" addons="0" mount="0"/>
    <targetchange interval="5000" chance="8"/>
    <strategy attack="100" defense="0"/>
    <flags>
        <flag summonable="1" attackable="1" hostile="1" illusionable="1"
              convinceable="1" pushable="1" canpushitems="0"
              canpushcreatures="0" targetdistance="1" staticattack="80"
              lightenergy="0" lightcolor="0" runonhealth="0"/>
    </flags>
    <attacks>
        <attack name="melee" interval="2000" skill="10" attack="5"/>
    </attacks>
    <defenses armor="1" defense="5"/>
    <voices interval="5000" chance="10">
        <voice sentence="Squeak!"/>
    </voices>
    <loot>
        <item id="2148" chance="20000"/>  <!-- gold coin 20% -->
        <item id="2687" chance="1000"/>   <!-- cheese 1% -->
    </loot>
</monster>
```

```bash
# Plik monsters.xml (lista wszystkich potworów):
# Przykład wpisu:
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<monsters>
    <monster name="Rat"    file="Animals/rat.xml"/>
    <monster name="Orc"    file="Humanoids/orc.xml"/>
    <monster name="Dragon" file="Dragons/dragon.xml"/>
    <!-- ... -->
</monsters>
```

### 4.4 Items i Spelle

```bash
# Items:
/opt/tibia/server/data/items/
├── items.xml          # definicje itemów (ważenia, właściwości)
├── items.otb          # binarny plik itemów (wymagany)
└── README

# Spelle (spells.xml):
/opt/tibia/server/data/XML/spells.xml    # TFS 0.3.6
# lub:
/opt/tibia/server/data/spells/spells.xml # TFS 1.x
```

```xml
<!-- Fragment spells.xml - spell "exura" (heal) -->
<spells>
    <instant name="Light Healing" words="exura" lvl="8" mana="20"
             prem="0" enabled="1" needlearn="0" needTarget="0"
             needWeapon="0" selftarget="1" blockwall="0"
             exhaustion="2000" effect="0x1C" script="healing/light healing.lua">
        <vocation name="Druid" showInList="1"/>
        <vocation name="Sorcerer" showInList="1"/>
        <vocation name="Paladin" showInList="1"/>
        <vocation name="Knight" showInList="1"/>
    </instant>
</spells>
```

```bash
# Questy:
/opt/tibia/server/data/XML/quests.xml
# lub obsługiwane przez storage values + movement scripts

# Raids:
/opt/tibia/server/data/raids/
├── raids.xml          # harmonogram raidów
└── scripts/
    └── trollattack.lua

# Przykład wpisu raids.xml:
```

```xml
<raids>
    <raid name="trollattack" state="1" enabled="1">
        <announcement time="180" message="Trolls are attacking Thais!"/>
        <singlespawn name="Troll" x="160" y="55" z="7"/>
    </raid>
</raids>
```

**Checklist weryfikacji Etap 4:**
- [ ] Mapa ładuje się bez błędów (`[info] Map loading complete`)
- [ ] Potwory spawnują w odpowiednich miejscach
- [ ] Spelle działają (test `exura` i `exori`)
- [ ] Itemy mają poprawne atrybuty (sprawdź broń i pancerz)
- [ ] Domy są widoczne i możliwe do kupienia

---

## ETAP 5 — STRONA WWW

### 5.1 Instalacja MyAAC

```bash
# Instalacja Apache2 + PHP:
sudo apt-get install -y apache2 php8.1 php8.1-mysql php8.1-curl \
  php8.1-gd php8.1-mbstring php8.1-xml php8.1-zip
sudo systemctl enable apache2

# Klon MyAAC:
cd /var/www/html
sudo rm -rf *   # wyczyść domyślną stronę Apache
sudo git clone https://github.com/slawkens/myaac.git .
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Przejdź przez instalator:
# Otwórz w przeglądarce: http://TWOJE_IP/install/
# Podaj dane bazy danych i ścieżkę do serwera
```

**Plik konfiguracyjny MyAAC:**
```php
// config.php (tworzony przez installer lub ręcznie):
$config['lua']                = '/opt/tibia/server/config.lua';
$config['server_path']        = '/opt/tibia/server/';
$config['mysql_host']         = 'localhost';
$config['mysql_user']         = 'tibia_user';
$config['mysql_pass']         = 'SecurePass123!';
$config['mysql_db']           = 'tibia_db';
$config['server_name']        = 'NazwaSerwera';
$config['admin_panel']        = true;
$config['admin_panel_login']  = 'admin';
$config['admin_panel_pass']   = password_hash('AdminPass!', PASSWORD_BCRYPT);
$config['highscores_perpage'] = 50;
$config['cache']              = 'disk';
$config['cache_prefix']       = 'myaac_';
$config['template']           = 'default';
$config['language']           = 'pl';
$config['client_version']     = 860;
$config['vocations']          = [0 => 'None', 1 => 'Sorcerer', 2 => 'Druid',
                                  3 => 'Paladin', 4 => 'Knight'];
$config['account_create']     = true;
$config['account_change_password'] = true;
$config['account_lost_account'] = true;
```

### 5.2 Konfiguracja Apache VirtualHost

```bash
# /etc/apache2/sites-available/tibia.conf:
sudo tee /etc/apache2/sites-available/tibia.conf << 'EOF'
<VirtualHost *:80>
    ServerName twoja-domena.pl
    ServerAlias www.twoja-domena.pl
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        AllowOverride All
        Require all granted
        Options -Indexes
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/tibia_error.log
    CustomLog ${APACHE_LOG_DIR}/tibia_access.log combined
</VirtualHost>
EOF

sudo a2ensite tibia.conf
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### 5.3 SSL z Let's Encrypt

```bash
# Instalacja Certbot:
sudo apt-get install -y certbot python3-certbot-apache

# Pobierz certyfikat (zastąp domeną):
sudo certbot --apache -d twoja-domena.pl -d www.twoja-domena.pl \
  --email admin@twoja-domena.pl --agree-tos --non-interactive

# Auto-renewal (cron):
echo "0 3 * * 0 certbot renew --quiet --post-hook 'systemctl reload apache2'" \
  | sudo tee /etc/cron.d/certbot-renewal

# Weryfikacja certyfikatu:
sudo certbot certificates
```

### 5.4 Panel admina MyAAC

```
URL: https://twoja-domena.pl/admin/
Login: admin (ustawiony w config.php)
Funkcje:
- Player management (ban, unban, zmiana poziomu)
- Broadcast messages
- News management
- Shop management (jeśli włączony)
```

**Checklist weryfikacji Etap 5:**
- [ ] Strona WWW dostępna pod domeną/IP
- [ ] Możliwość rejestracji konta przez stronę
- [ ] Highscores pokazują prawdziwych graczy z bazy
- [ ] Panel admina dostępny i działający
- [ ] SSL aktywny (https, zielona kłódka)
- [ ] Automatyczne odnowienie certyfikatu skonfigurowane

---

## ETAP 6 — BEZPIECZEŃSTWO: CHECKLIST

### 6.1 Firewall (UFW — Ubuntu)

```bash
# Zresetuj i skonfiguruj UFW:
sudo ufw reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Dozwolone porty:
sudo ufw allow 22/tcp        # SSH (zmień jeśli używasz innego portu!)
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 7171/tcp      # Tibia game/login
sudo ufw allow 7172/tcp      # Tibia status

# Włącz:
sudo ufw enable
sudo ufw status verbose

# Opcjonalnie: ogranicz SSH do konkretnego IP:
sudo ufw allow from TWOJE_IP to any port 22
sudo ufw delete allow 22/tcp   # usuń ogólne zezwolenie na SSH
```

### 6.2 SQL Injection prevention

```lua
-- data/lib/050-function.lua - bezpieczna funkcja query:
function safeQuery(query, ...)
    local args = {...}
    for i, v in ipairs(args) do
        if type(v) == "string" then
            args[i] = db.escapeString(v)
        end
    end
    return db.query(string.format(query, table.unpack(args)))
end

-- Użycie:
local result = safeQuery(
    "SELECT `id` FROM `players` WHERE `name` = %s AND `account_id` = %d LIMIT 1",
    playerName, accountId
)
```

### 6.3 Hashowanie haseł (config.lua)

```lua
-- config.lua:
passwordType = "sha256"       -- dla TFS 0.3.6
-- Dla TFS 1.x zalecane bcrypt:
-- passwordType = "bcrypt"
-- bcryptCost = 12

-- NIGDY nie używaj plain text ani md5 w produkcji!
```

### 6.4 Ochrona przed DDoS (iptables)

```bash
# /etc/iptables/tibia-rules.sh
#!/bin/bash

# Flush istniejących reguł:
iptables -F INPUT

# Podstawowa ochrona:
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT

# Ochrona SSH:
iptables -A INPUT -p tcp --dport 22 -m recent --set --name SSH
iptables -A INPUT -p tcp --dport 22 -m recent --update --seconds 60 \
  --hitcount 6 --name SSH -j DROP
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Tibia: max 5 nowych połączeń/minutę per IP:
iptables -A INPUT -p tcp --dport 7171 -m state --state NEW \
  -m recent --set --name TIBIA_LOGIN
iptables -A INPUT -p tcp --dport 7171 -m state --state NEW \
  -m recent --update --seconds 60 --hitcount 5 \
  --name TIBIA_LOGIN -j DROP
iptables -A INPUT -p tcp --dport 7171 -j ACCEPT
iptables -A INPUT -p tcp --dport 7172 -j ACCEPT

# HTTP/HTTPS:
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# ICMP ping (ogranicz):
iptables -A INPUT -p icmp --icmp-type echo-request -m limit \
  --limit 1/s -j ACCEPT

# Odrzuć resztę:
iptables -A INPUT -j DROP

# Zapisz:
iptables-save > /etc/iptables/rules.v4

chmod +x /etc/iptables/tibia-rules.sh
sudo /etc/iptables/tibia-rules.sh
```

### 6.5 Ban system i logi

```lua
-- data/talkactions/scripts/adminban.lua (komenda dla GM/Admin)
function onSay(player, words, param)
    if player:getAccountType() < ACCOUNT_TYPE_GAMEMASTER then
        return false
    end

    local target = Player(param)
    if not target then
        player:sendTextMessage(MESSAGE_STATUS_CONSOLE_RED, "Gracz nie istnieje.")
        return true
    end

    -- Log akcji:
    local logMsg = string.format(
        "[%s] GM %s zbanował %s",
        os.date("%Y-%m-%d %H:%M:%S"),
        player:getName(),
        target:getName()
    )
    local f = io.open("logs/admin.log", "a")
    if f then f:write(logMsg .. "\n"); f:close() end

    -- Ban w bazie:
    db.query(string.format(
        "INSERT INTO bans (type, value, reason, banned_by, banned_at) "
        .. "VALUES (2, %d, 'Banned by GM', %d, UNIX_TIMESTAMP())",
        target:getId(), player:getId()
    ))

    target:kick(false, true)
    player:sendTextMessage(MESSAGE_STATUS_CONSOLE_BLUE, "Gracz " .. param .. " zbanowany.")
    return true
end
-- Rejestracja: <talkaction words="!ban" access="3" script="adminban.lua" />
```

### 6.6 Backup strategy (cron)

```bash
# /etc/cron.d/tibia-backup:
# Backup o 3:00 w nocy:
0 3 * * * tibia mysqldump -u tibia_user -p'SecurePass123!' tibia_db \
  | gzip > /backups/tibia_$(date +\%F).sql.gz

# Kasuj backupy starsze niż 30 dni:
30 3 * * * tibia find /backups/ -name "*.sql.gz" -mtime +30 -delete

# Backup plików serwera co tydzień (niedziela 4:00):
0 4 * * 0 tibia tar -czf /backups/server_files_$(date +\%F).tar.gz \
  /opt/tibia/server/data/ /opt/tibia/server/config.lua

# Test czy backup się powiódł:
0 3 30 * * tibia test -f /backups/tibia_$(date +\%F).sql.gz \
  && echo "Backup OK" >> /var/log/tibia-backup.log \
  || echo "BACKUP FAILED $(date)" >> /var/log/tibia-backup.log
```

### 6.7 Disable dangerous Lua

```lua
-- data/lib/050-function.lua: zablokuj niebezpieczne funkcje:
os.execute   = nil          -- exec syscall
io.popen     = nil          -- shell pipe
require      = nil          -- dynamic loading (jeśli nie potrzebujesz)
loadfile     = nil
dofile       = nil
package      = nil
```

**Checklist weryfikacji Etap 6:**
- [ ] UFW aktywny i poprawnie skonfigurowany (`ufw status`)
- [ ] Tylko porty 22, 80, 443, 7171, 7172 otwarte
- [ ] SQL queries używają `db.escapeString()`
- [ ] `passwordType` ustawiony na `sha256` lub `bcrypt`
- [ ] Backup cron aktywny i testowo uruchomiony
- [ ] Admin actions logowane do `logs/admin.log`
- [ ] iptables rules zapisane do `/etc/iptables/rules.v4`
- [ ] SSL na stronie WWW

---

## ETAP 7 — TROUBLESHOOTING

### Problem 1: Server crash przy logowaniu

**Objawy:** `Segmentation fault`, serwer wyłącza się gdy gracz próbuje się zalogować.

**Diagnoza:**
```bash
# Sprawdź core dump:
ulimit -c unlimited
./tfs
# po crashu:
gdb ./tfs core
bt full      # backtrace w gdb
```

**Przyczyny i rozwiązania:**

| Przyczyna | Komenda diagnostyczna | Rozwiązanie |
|-----------|----------------------|-------------|
| Błąd w mapie | Sprawdź log przy `Map loading` | Użyj poprawnego pliku .otbm |
| Brak items.otb | `grep "items.otb" logs/errors.log` | Skopiuj prawidłowe items.otb do data/items/ |
| Zły protocol | Wersja klienta ≠ wersja serwera | Użyj OTClient 8.6 |
| Brak RAM | `free -h` | Dodaj swap lub zwiększ RAM |

```bash
# Tymczasowe rozwiązanie (restart):
sudo systemctl restart tibia
# Stałe: napraw przyczynę z logów
tail -50 logs/errors.log
```

---

### Problem 2: SQL connection error

**Objaw:** `[Error - mysql_real_connect] Can't connect to local MySQL server`

```bash
# Sprawdź status MariaDB:
sudo systemctl status mariadb
sudo systemctl start mariadb

# Sprawdź credentials z config.lua:
mysql -u tibia_user -p'SecurePass123!' tibia_db -e "SELECT 1;"

# Sprawdź uprawnienia:
mysql -u root -p -e "SHOW GRANTS FOR 'tibia_user'@'localhost';"

# Sprawdź czy baza istnieje:
mysql -u root -p -e "SHOW DATABASES;" | grep tibia_db

# Fix: reset hasła usera:
mysql -u root -p << 'EOF'
ALTER USER 'tibia_user'@'localhost' IDENTIFIED BY 'SecurePass123!';
FLUSH PRIVILEGES;
EOF
```

---

### Problem 3: Gracze rozłączają się losowo

**Objaw:** `[Error] Connection timed out`, gracze wypadają z gry co kilka minut.

```bash
# Sprawdź limit połączeń:
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Sprawdź firewall rate limiting:
sudo iptables -L INPUT -n -v | grep DROP

# Sprawdź logi TFS:
grep -i "disconnect\|timeout\|error" logs/server.log | tail -30

# Rozwiązanie — zwiększ timeout w config.lua:
# kickIdlePlayersAfterSeconds = 1800  (30 minut)

# Sprawdź czy problem jest po stronie sieci:
ping -c 100 -i 0.1 TWOJE_IP | tail -5

# Firewall — rozluźnij rate limiting:
sudo iptables -D INPUT -p tcp --dport 7171 -m recent --update \
  --seconds 60 --hitcount 5 --name TIBIA_LOGIN -j DROP
sudo iptables -A INPUT -p tcp --dport 7171 -m recent --update \
  --seconds 60 --hitcount 50 --name TIBIA_LOGIN -j DROP
```

---

### Problem 4: Serwer nie startuje (port zajęty)

```bash
# Sprawdź który proces zajmuje port 7171:
sudo netstat -tlnp | grep 7171
sudo ss -tlnp | grep 7171
sudo lsof -i :7171

# Zabij proces:
sudo kill -9 PID_PROCESU

# Upewnij się, że poprzednia instancja TFS jest zatrzymana:
pkill -f tfs
# lub:
sudo systemctl stop tibia
```

---

### Problem 5: SSL certyfikat wygasł

```bash
# Sprawdź ważność:
sudo certbot certificates
# lub:
openssl x509 -in /etc/letsencrypt/live/twoja-domena.pl/cert.pem \
  -noout -dates

# Odnów ręcznie:
sudo certbot renew --force-renewal
sudo systemctl reload apache2

# Sprawdź czy auto-renewal działa:
sudo certbot renew --dry-run
```

---

### Problem 6: Out of Memory (OOM) crash

```bash
# Sprawdź czy OOM killer zabił TFS:
sudo dmesg | grep -i "killed process\|oom"
journalctl -k | grep -i oom

# Sprawdź użycie RAM:
free -h
ps aux --sort=-%mem | head -10

# Rozwiązania:
# 1. Dodaj swap:
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Zmniejsz maxPlayers w config.lua
# 3. Zwiększ RAM serwera
# 4. Zoptymalizuj MariaDB innodb_buffer_pool_size
```

---

### Problem 7: Potwory nie respawnują

```bash
# Sprawdź logikę spawnu w config.lua:
grep -i "spawn\|rateSpawn" config.lua

# Sprawdź plik mapy — spawn XML:
grep -c "<spawn" data/world/map.xml

# W Lua — ręczny spawn do testu:
# Komenda ingame (jako GM): !reload monsters
# lub w konsoli serwera: reload monsters
```

---

### Problem 8: Wysoki ping graczy

```bash
# Sprawdź opóźnienie sieci:
mtr --report TWOJE_IP

# Sprawdź wykorzystanie CPU przez TFS:
top -p $(pgrep tfs)

# Sprawdź IO wait:
iostat -x 1 5

# Jeśli CPU > 80%: sprawdź które skrypty Lua są powolne:
# Dodaj do lua: local t = os.clock() ... print("Script took: " .. (os.clock()-t) .. "s")
```

**Checklist weryfikacji Etap 7:**
- [ ] Znasz lokalizację i format logów (`logs/server.log`, `logs/errors.log`)
- [ ] Masz alias do szybkiego restartu: `alias restarttibia='sudo systemctl restart tibia'`
- [ ] Backup działa i jest testowany
- [ ] Monitoring RAM aktywny (patrz Etap 8)

---

## ETAP 8 — DEPLOYMENT NA VPS/DEDYK

### 8.1 Wymagania sprzętowe

| Graczy | RAM | CPU | Dysk | Łącze |
|--------|-----|-----|------|-------|
| Do 200 | 4 GB | 2 vCPU | 40 GB SSD | 100 Mbps |
| 200–500 | 8 GB | 4 vCPU | 80 GB SSD | 200 Mbps |
| 500–700 | 16 GB | 6 vCPU | 100 GB SSD | 500 Mbps |
| 700+ | 32 GB | 8 vCPU | 200 GB SSD | 1 Gbps |

**System operacyjny:** Ubuntu 22.04 LTS (zalecany) lub Debian 12

**Rekomendowani hosterzy (sprawdzeni przez społeczność OTS):**
- **Hetzner Cloud** (hetzner.com) — najlepszy stosunek ceny do wydajności w EU
- **OVHcloud** (ovhcloud.com) — anty-DDoS VAC wbudowany
- **Contabo** (contabo.com) — dużo RAM za niską cenę
- **NFOservers** (nfoservers.com) — doświadczenie w hosting gier

---

### 8.2 Transfer plików (WinSCP)

```
WinSCP konfiguracja:
- Protocol: SFTP
- Host name: TWOJE_IP
- Port: 22
- User name: root (lub tibia)
- Authentication: Private key (.ppk) lub password

Ścieżka transferu:
Lokalna: C:\OTS\server\
Zdalna: /opt/tibia/server/

Ustawienia transferu:
- Transfer type: Binary (!) — nie Text
- Preserve timestamps: Yes
```

---

### 8.3 Systemd service (auto-start + auto-restart)

```bash
# Utwórz dedykowanego usera:
sudo useradd -r -s /bin/false -d /opt/tibia tibia
sudo chown -R tibia:tibia /opt/tibia

# Plik service:
sudo tee /etc/systemd/system/tibia.service << 'EOF'
[Unit]
Description=The Forgotten Server (Tibia OTS 8.6)
After=network.target mariadb.service
Requires=mariadb.service

[Service]
Type=simple
User=tibia
Group=tibia
WorkingDirectory=/opt/tibia/server
ExecStart=/opt/tibia/server/tfs
ExecStop=/bin/kill -SIGTERM $MAINPID

# Auto-restart:
Restart=always
RestartSec=10
StartLimitInterval=120
StartLimitBurst=5

# Limity zasobów:
LimitNOFILE=65535
MemoryMax=6G
MemorySwapMax=0

# Logowanie przez journald:
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tibia

[Install]
WantedBy=multi-user.target
EOF

# Aktywacja:
sudo systemctl daemon-reload
sudo systemctl enable tibia
sudo systemctl start tibia

# Sprawdzenie statusu:
sudo systemctl status tibia
journalctl -u tibia -f         # live logi
journalctl -u tibia --since "1 hour ago"  # ostatnia godzina
```

---

### 8.4 Monitoring z auto-restart

**Skrypt watchdog (backup dla systemd):**
```bash
# /opt/tibia/watchdog.sh
#!/bin/bash
LOGFILE="/opt/tibia/logs/watchdog.log"
PIDFILE="/opt/tibia/server/tfs.pid"

check_server() {
    if ! systemctl is-active --quiet tibia; then
        echo "[$(date)] TFS nie działa - restartuję..." >> $LOGFILE
        systemctl restart tibia
        sleep 15
        if systemctl is-active --quiet tibia; then
            echo "[$(date)] Restart OK" >> $LOGFILE
        else
            echo "[$(date)] RESTART NIEUDANY! Sprawdź logi!" >> $LOGFILE
            # Wyślij e-mail alert (opcjonalnie):
            echo "TFS crash na $(hostname)" | mail -s "TFS DOWN" admin@serwer.pl
        fi
    fi
}

# Test połączenia z portem gry:
check_port() {
    if ! nc -z -w5 localhost 7171 2>/dev/null; then
        echo "[$(date)] Port 7171 nie odpowiada!" >> $LOGFILE
        systemctl restart tibia
    fi
}

check_server
check_port
```

```bash
# Cron co 5 minut:
chmod +x /opt/tibia/watchdog.sh
echo "*/5 * * * * root /opt/tibia/watchdog.sh" | sudo tee /etc/cron.d/tibia-watchdog
```

---

### 8.5 Monitoring zasobów

**Instalacja narzędzi:**
```bash
sudo apt-get install -y htop iotop nethogs nmap ncdu

# Szybki status systemu:
htop              # interaktywny monitor procesów
iotop             # I/O per proces
nethogs           # ruch sieciowy per proces

# Sprawdź użycie dysku:
ncdu /opt/tibia

# Monitor logów w czasie rzeczywistym:
tail -f /opt/tibia/server/logs/server.log | grep -E "Error|Warning|Players"
```

**Prosty skrypt status:**
```bash
#!/bin/bash
# /opt/tibia/status.sh
echo "=== TIBIA SERVER STATUS ==="
echo "Service: $(systemctl is-active tibia)"
echo "Uptime:  $(systemctl show tibia --property=ActiveEnterTimestamp --value)"
echo ""
echo "=== SYSTEM RESOURCES ==="
echo "RAM:  $(free -h | awk '/Mem:/ {print $3 "/" $2}')"
echo "CPU:  $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% used"
echo "Disk: $(df -h /opt/tibia | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo ""
echo "=== DATABASE ==="
mysql -u tibia_user -p'SecurePass123!' tibia_db -se \
  "SELECT CONCAT('Players: ', COUNT(*), ' | Online: ',
   SUM(online)) FROM players;" 2>/dev/null
echo ""
echo "=== LAST ERRORS ==="
tail -5 /opt/tibia/server/logs/errors.log 2>/dev/null || echo "No errors"
```

---

### 8.6 Kompletna lista komend po wdrożeniu

```bash
# START / STOP / RESTART:
sudo systemctl start tibia
sudo systemctl stop tibia
sudo systemctl restart tibia
sudo systemctl status tibia

# LOGI:
journalctl -u tibia -f                    # live
journalctl -u tibia --since "1 hour ago"  # ostatnia godzina
tail -f /opt/tibia/server/logs/server.log
grep -i "error" /opt/tibia/server/logs/errors.log | tail -20

# BAZA DANYCH:
mysql -u tibia_user -p'SecurePass123!' tibia_db

# BACKUP:
mysqldump -u tibia_user -p'SecurePass123!' tibia_db | gzip > backup_$(date +%F).sql.gz

# FIREWALL:
sudo ufw status numbered
sudo ufw allow 7171/tcp
sudo ufw delete 5  # usuń regułę nr 5

# CERTBOT:
sudo certbot renew --dry-run
sudo certbot certificates

# AKTUALIZACJA SERWERA (bez downtime):
cd /opt/tibia/server
git fetch origin && git pull origin master
# Przebuduj i restart:
make -j$(nproc)
sudo systemctl restart tibia
```

---

## DODATEK — GOTOWE KOMENDY ADMINA (talkactions)

```lua
-- data/talkactions/scripts/admin_commands.lua
-- Rejestracja w talkactions.xml:
-- <talkaction words="!kick" access="3" script="admin_commands.lua" />
-- <talkaction words="!ban" access="3" script="admin_commands.lua" />
-- <talkaction words="!goto" access="3" script="admin_commands.lua" />
-- <talkaction words="!bring" access="3" script="admin_commands.lua" />
-- <talkaction words="!online" access="1" script="admin_commands.lua" />

local commands = {}

commands["!online"] = function(player, param)
    local players = Game.getPlayers()
    local list = string.format("Online: %d players\n", #players)
    for i, p in ipairs(players) do
        list = list .. string.format("%d. %s (Level %d)\n",
            i, p:getName(), p:getLevel())
    end
    player:showTextDialog(items[2595].id, list)
    return true
end

commands["!kick"] = function(player, param)
    if player:getAccountType() < ACCOUNT_TYPE_GAMEMASTER then return false end
    local target = Player(param)
    if not target then
        player:sendTextMessage(MESSAGE_STATUS_CONSOLE_RED, "Gracz nie znaleziony.")
        return true
    end
    target:kick(false, false)
    player:sendTextMessage(MESSAGE_STATUS_CONSOLE_BLUE, param .. " został wyrzucony.")
    return true
end

commands["!goto"] = function(player, param)
    if player:getAccountType() < ACCOUNT_TYPE_GAMEMASTER then return false end
    local target = Player(param)
    if not target then
        player:sendTextMessage(MESSAGE_STATUS_CONSOLE_RED, "Gracz nie znaleziony.")
        return true
    end
    player:teleportTo(target:getPosition())
    return true
end

function onSay(player, words, param)
    local cmd = commands[words]
    if cmd then return cmd(player, param) end
    return false
end
```

---

## SZYBKA REFERENCA — PARAMETRY CONFIG.LUA

| Parametr | Opis | Zalecana wartość |
|----------|------|-----------------|
| `rateExp` | Mnożnik doświadczenia | 5–10 (custom) |
| `rateSkill` | Mnożnik umiejętności | 3–8 |
| `rateLoot` | Mnożnik lootu | 2–5 |
| `maxPlayers` | Maks. graczy online | 500 |
| `saveInterval` | Autozapis (sekundy) | 1200 |
| `deathLostPercent` | % exp tracone przy śmierci | 10 |
| `kickIdlePlayersAfterSeconds` | AFK kick | 900 |
| `passwordType` | Algorytm hasła | `sha256` lub `bcrypt` |
| `worldType` | Typ świata | `pvp` |
| `housePricePerSqm` | Cena domu za m2 | 1000 |

---

*Wersja przewodnika: 1.0 | Kompatybilność: TFS 0.3.6 Crying Damson / TFS 1.x downgrade 8.6 | Tibia Protocol: 8.6 (860)*
