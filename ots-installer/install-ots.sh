#!/usr/bin/env bash
# ============================================================================
#  TIBIA 8.60 OTS — W PEŁNI AUTOMATYCZNY INSTALATOR (ONE-CLICK)
# ============================================================================
#  Silnik:  TFS 1.5 downgrade 8.60 (nekiro/TFS-1.5-Downgrades)
#  Baza:    MariaDB (auto-konfiguracja, losowe bezpieczne hasła)
#  WWW:     MyAAC + Apache2 + PHP (auto-konfiguracja)
#  System:  Ubuntu 20.04 / 22.04 / 24.04 lub Debian 11 / 12, użytkownik root
#
#  Skrypt jest IDEMPOTENTNY — można go uruchomić ponownie po przerwaniu.
#  Kończy pracę dopiero gdy port gry odpowiada (serwer ONLINE).
#  Dane logowania zapisuje w /root/ots-credentials.txt i wyświetla na końcu.
# ============================================================================
set -Eeuo pipefail

# ----------------------------------------------------------------------------
# KONFIGURACJA (możesz zmienić, ale wszystko działa też bez zmian)
# ----------------------------------------------------------------------------
SERVER_NAME="${SERVER_NAME:-MojOTS}"
OTS_DIR="/opt/tibia"
SRC_DIR="$OTS_DIR/src"
SERVER_DIR="$OTS_DIR/server"
WEB_DIR="/var/www/html"
DB_NAME="${DB_NAME:-tibia_db}"
DB_USER="${DB_USER:-tibia_user}"
TFS_REPO="https://github.com/nekiro/TFS-1.5-Downgrades.git"
TFS_BRANCH="8.60"
MYAAC_REPO="https://github.com/slawkens/myaac.git"
GOD_ACCOUNT="${GOD_ACCOUNT:-god}"
LOG_FILE="/root/ots-install.log"
CRED_FILE="/root/ots-credentials.txt"

# ----------------------------------------------------------------------------
# POMOCNICZE
# ----------------------------------------------------------------------------
C_GREEN='\033[0;32m'; C_RED='\033[0;31m'; C_YELLOW='\033[1;33m'; C_BLUE='\033[0;34m'; C_NC='\033[0m'
STEP=""

log()  { echo -e "${C_GREEN}[OK]${C_NC}   $*" | tee -a "$LOG_FILE"; }
info() { echo -e "${C_BLUE}[...]${C_NC}  $*" | tee -a "$LOG_FILE"; }
warn() { echo -e "${C_YELLOW}[UWAGA]${C_NC} $*" | tee -a "$LOG_FILE"; }
die()  { echo -e "${C_RED}[BŁĄD]${C_NC} $*" | tee -a "$LOG_FILE"; exit 1; }

on_error() {
    echo -e "${C_RED}============================================================${C_NC}"
    echo -e "${C_RED}[BŁĄD] Instalacja przerwana na etapie: ${STEP}${C_NC}"
    echo -e "${C_RED}Pełny log: ${LOG_FILE}${C_NC}"
    echo -e "${C_RED}Ostatnie linie logu:${C_NC}"
    tail -n 20 "$LOG_FILE" 2>/dev/null || true
    echo -e "${C_RED}Możesz bezpiecznie uruchomić skrypt ponownie — dokończy pracę.${C_NC}"
    echo -e "${C_RED}============================================================${C_NC}"
}
trap on_error ERR

run() {
    # Wykonuje polecenie, cały output do logu; przy błędzie pokazuje log.
    "$@" >>"$LOG_FILE" 2>&1
}

set_config() {
    # set_config <plik> <klucz> <wartość-lua>
    local file="$1" key="$2" value="$3"
    if grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$file"; then
        sed -i "s|^[[:space:]]*${key}[[:space:]]*=.*|${key} = ${value}|" "$file"
    else
        echo "${key} = ${value}" >> "$file"
    fi
}

# ----------------------------------------------------------------------------
# ETAP 0 — WERYFIKACJA ŚRODOWISKA
# ----------------------------------------------------------------------------
STEP="Weryfikacja środowiska"
: > "$LOG_FILE"
echo "============================================================"
echo "  TIBIA 8.60 OTS — AUTOMATYCZNY INSTALATOR"
echo "============================================================"

[[ $EUID -eq 0 ]] || die "Uruchom jako root: sudo bash $0"

if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "$ID" in
        ubuntu|debian) log "System: $PRETTY_NAME" ;;
        *) die "Nieobsługiwany system: $PRETTY_NAME (wymagany Ubuntu 20.04+/Debian 11+)" ;;
    esac
else
    die "Nie mogę wykryć systemu operacyjnego."
fi

# Publiczne IP serwera (3 metody, fallback na lokalne):
info "Wykrywanie publicznego IP..."
SERVER_IP="$(curl -4 -s --max-time 10 https://ifconfig.me 2>/dev/null \
          || curl -4 -s --max-time 10 https://api.ipify.org 2>/dev/null \
          || hostname -I | awk '{print $1}')"
[[ -n "$SERVER_IP" ]] || die "Nie udało się wykryć IP serwera."
log "IP serwera: $SERVER_IP"

# Hasła: wczytaj istniejące (idempotencja) lub wygeneruj nowe:
if [[ -f "$CRED_FILE" ]]; then
    DB_PASS="$(grep '^DB_PASS='  "$CRED_FILE" | cut -d= -f2)"
    GOD_PASS="$(grep '^GOD_PASS=' "$CRED_FILE" | cut -d= -f2)"
    log "Wczytano istniejące hasła z $CRED_FILE"
fi
DB_PASS="${DB_PASS:-$(openssl rand -hex 16)}"
GOD_PASS="${GOD_PASS:-$(openssl rand -hex 8)}"
cat > "$CRED_FILE" <<EOF
DB_PASS=$DB_PASS
GOD_PASS=$GOD_PASS
EOF
chmod 600 "$CRED_FILE"

# ----------------------------------------------------------------------------
# ETAP 1 — PORZĄDKI I PAKIETY SYSTEMOWE
# ----------------------------------------------------------------------------
STEP="Instalacja pakietów systemowych"
export DEBIAN_FRONTEND=noninteractive

info "Zatrzymuję ewentualną starą instancję serwera..."
systemctl stop tibia 2>/dev/null || true
pkill -f "$SERVER_DIR/tfs" 2>/dev/null || true

info "Aktualizacja systemu (apt update/upgrade)..."
run apt-get update -y
run apt-get upgrade -y

info "Instalacja pakietów (kompilator, biblioteki, baza, WWW)..."
run apt-get install -y \
    git cmake build-essential curl wget unzip \
    libluajit-5.1-dev liblua5.1-0-dev \
    default-libmysqlclient-dev \
    libboost-system-dev libboost-iostreams-dev libboost-filesystem-dev \
    libpugixml-dev libcrypto++-dev libfmt-dev zlib1g-dev \
    mariadb-server mariadb-client \
    apache2 php php-mysql php-curl php-gd php-mbstring php-xml php-zip \
    ufw ca-certificates
log "Pakiety zainstalowane."

# SWAP jeśli mało RAM (kompilacja TFS potrzebuje ~2GB):
STEP="Konfiguracja SWAP"
TOTAL_RAM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [[ $TOTAL_RAM_MB -lt 3500 && ! -f /swapfile ]]; then
    info "RAM = ${TOTAL_RAM_MB}MB — tworzę 4GB swap na czas kompilacji..."
    run fallocate -l 4G /swapfile
    run chmod 600 /swapfile
    run mkswap /swapfile
    run swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "Swap aktywny."
fi

# ----------------------------------------------------------------------------
# ETAP 2 — BAZA DANYCH
# ----------------------------------------------------------------------------
STEP="Konfiguracja MariaDB"
info "Uruchamiam MariaDB..."
run systemctl enable --now mariadb

info "Tworzę bazę '$DB_NAME' i użytkownika '$DB_USER'..."
mysql --protocol=socket -uroot <<SQL >>"$LOG_FILE" 2>&1
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
log "Baza danych gotowa."

# ----------------------------------------------------------------------------
# ETAP 3 — POBRANIE I KOMPILACJA SILNIKA
# ----------------------------------------------------------------------------
STEP="Pobieranie silnika TFS 8.60"
mkdir -p "$OTS_DIR"
if [[ ! -d "$SRC_DIR/.git" ]]; then
    info "Klonuję TFS 1.5 downgrade 8.60 (nekiro)..."
    run git clone --depth 1 --branch "$TFS_BRANCH" "$TFS_REPO" "$SRC_DIR"
else
    info "Repozytorium już istnieje — aktualizuję..."
    run git -C "$SRC_DIR" pull --ff-only || true
fi
log "Źródła pobrane."

STEP="Kompilacja silnika (może potrwać 5-20 minut)"
if [[ ! -x "$SRC_DIR/build/tfs" ]]; then
    info "Kompiluję TFS (make -j$(nproc))... To najdłuższy etap."
    mkdir -p "$SRC_DIR/build"
    ( cd "$SRC_DIR/build" && run cmake .. -DCMAKE_BUILD_TYPE=Release && run make -j"$(nproc)" )
fi
[[ -x "$SRC_DIR/build/tfs" ]] || die "Kompilacja nie wytworzyła pliku tfs."
log "Silnik skompilowany."

# Katalog serwera = data/ + config + binarka:
STEP="Instalacja plików serwera"
mkdir -p "$SERVER_DIR" "$SERVER_DIR/logs"
run cp -r "$SRC_DIR/data" "$SERVER_DIR/"
run cp "$SRC_DIR/build/tfs" "$SERVER_DIR/tfs"
run cp "$SRC_DIR/config.lua.dist" "$SERVER_DIR/config.lua"
[[ -f "$SRC_DIR/schema.sql" ]] && run cp "$SRC_DIR/schema.sql" "$SERVER_DIR/schema.sql"
chmod +x "$SERVER_DIR/tfs"
log "Pliki serwera zainstalowane w $SERVER_DIR"

# ----------------------------------------------------------------------------
# ETAP 4 — IMPORT SCHEMATU I KONTO GOD
# ----------------------------------------------------------------------------
STEP="Import schematu bazy danych"
TABLES=$(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "SHOW TABLES LIKE 'accounts';" | wc -l)
if [[ "$TABLES" -eq 0 ]]; then
    info "Importuję schema.sql..."
    mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SERVER_DIR/schema.sql" >>"$LOG_FILE" 2>&1
    log "Schemat zaimportowany."
else
    log "Schemat już istnieje — pomijam import."
fi

STEP="Tworzenie konta GOD"
ACC_EXISTS=$(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e \
    "SELECT COUNT(*) FROM accounts WHERE name='$GOD_ACCOUNT';")
if [[ "$ACC_EXISTS" -eq 0 ]]; then
    info "Tworzę konto '$GOD_ACCOUNT' i postać 'God'..."
    mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<SQL >>"$LOG_FILE" 2>&1
INSERT INTO accounts (name, password, type, email) VALUES ('$GOD_ACCOUNT', SHA1('$GOD_PASS'), 5, 'admin@localhost');
SET @accid = LAST_INSERT_ID();
INSERT INTO players (name, group_id, account_id, level, vocation, health, healthmax,
    experience, looktype, maglevel, mana, manamax, manaspent, soul, town_id,
    posx, posy, posz, conditions, cap, sex)
VALUES ('God', 6, @accid, 2, 0, 155, 155, 100, 75, 0, 60, 60, 0, 100, 1,
    0, 0, 0, '', 410, 1);
SQL
    log "Konto GOD utworzone."
else
    log "Konto GOD już istnieje — pomijam."
fi

# ----------------------------------------------------------------------------
# ETAP 5 — KONFIGURACJA config.lua (SPÓJNA Z IP SERWERA)
# ----------------------------------------------------------------------------
STEP="Konfiguracja config.lua"
CFG="$SERVER_DIR/config.lua"
info "Ustawiam parametry serwera w config.lua..."
set_config "$CFG" "ip"                  "\"$SERVER_IP\""
set_config "$CFG" "bindOnlyGlobalAddress" "false"
set_config "$CFG" "loginProtocolPort"   "7171"
set_config "$CFG" "gameProtocolPort"    "7172"
set_config "$CFG" "statusProtocolPort"  "7171"
set_config "$CFG" "serverName"          "\"$SERVER_NAME\""
set_config "$CFG" "maxPlayers"          "500"
set_config "$CFG" "motd"                "\"Witaj na serwerze $SERVER_NAME!\""
set_config "$CFG" "mysqlHost"           "\"127.0.0.1\""
set_config "$CFG" "mysqlUser"           "\"$DB_USER\""
set_config "$CFG" "mysqlPass"           "\"$DB_PASS\""
set_config "$CFG" "mysqlDatabase"       "\"$DB_NAME\""
set_config "$CFG" "mysqlPort"           "3306"
set_config "$CFG" "allowClones"         "false"
set_config "$CFG" "kickIdlePlayerAfterMinutes" "15"
log "config.lua skonfigurowany (IP: $SERVER_IP, baza: $DB_NAME)."

# ----------------------------------------------------------------------------
# ETAP 6 — STRONA WWW (MyAAC)
# ----------------------------------------------------------------------------
STEP="Instalacja MyAAC"
if [[ ! -d "$WEB_DIR/system" ]]; then
    info "Instaluję MyAAC..."
    rm -f "$WEB_DIR/index.html" 2>/dev/null || true
    if [[ -z "$(ls -A "$WEB_DIR" 2>/dev/null)" ]]; then
        run git clone --depth 1 "$MYAAC_REPO" "$WEB_DIR"
    else
        run git clone --depth 1 "$MYAAC_REPO" /tmp/myaac
        cp -rn /tmp/myaac/. "$WEB_DIR/" && rm -rf /tmp/myaac
    fi
fi

cat > "$WEB_DIR/config.local.php" <<PHP
<?php
\$config['installed'] = true;
\$config['server_path'] = '$SERVER_DIR/';
\$config['mail_enabled'] = false;
\$config['env'] = 'prod';
PHP

chown -R www-data:www-data "$WEB_DIR"
run systemctl enable --now apache2
run systemctl reload apache2

# MyAAC importuje własne tabele przy pierwszym wejściu na /install —
# próbujemy zautomatyzować przez lokalne wywołanie PHP CLI, a jak się nie
# uda, informujemy (strona wciąż zadziała po ręcznym przejściu 4 kroków):
MYAAC_OK=0
if AAC_SCHEMA=$(find "$WEB_DIR/install" -maxdepth 3 -name '*.sql' 2>/dev/null | head -1); then
    if [[ -n "$AAC_SCHEMA" ]]; then
        info "Importuję schemat MyAAC: $AAC_SCHEMA"
        mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$AAC_SCHEMA" >>"$LOG_FILE" 2>&1 && MYAAC_OK=1 || true
    fi
fi
if [[ "$MYAAC_OK" -eq 1 ]]; then
    log "Strona WWW (MyAAC) zainstalowana automatycznie."
else
    warn "MyAAC wymaga dokończenia w przeglądarce: http://$SERVER_IP/install (4 kliknięcia). Serwer gry działa niezależnie od tego."
fi

# ----------------------------------------------------------------------------
# ETAP 7 — FIREWALL
# ----------------------------------------------------------------------------
STEP="Konfiguracja firewalla (UFW)"
info "Konfiguruję UFW..."
run ufw --force reset
run ufw default deny incoming
run ufw default allow outgoing
run ufw allow 22/tcp
run ufw allow 80/tcp
run ufw allow 443/tcp
run ufw allow 7171/tcp
run ufw allow 7172/tcp
run ufw --force enable
log "Firewall aktywny (otwarte: 22, 80, 443, 7171, 7172)."

# ----------------------------------------------------------------------------
# ETAP 8 — USŁUGA SYSTEMD + START
# ----------------------------------------------------------------------------
STEP="Konfiguracja usługi systemd"
id -u tibia &>/dev/null || useradd -r -s /usr/sbin/nologin -d "$OTS_DIR" tibia
chown -R tibia:tibia "$OTS_DIR"

cat > /etc/systemd/system/tibia.service <<EOF
[Unit]
Description=The Forgotten Server (Tibia OTS 8.60)
After=network.target mariadb.service
Requires=mariadb.service

[Service]
Type=simple
User=tibia
Group=tibia
WorkingDirectory=$SERVER_DIR
ExecStart=$SERVER_DIR/tfs
Restart=always
RestartSec=10
LimitNOFILE=65535
StandardOutput=append:$SERVER_DIR/logs/server.log
StandardError=append:$SERVER_DIR/logs/errors.log

[Install]
WantedBy=multi-user.target
EOF

run systemctl daemon-reload
run systemctl enable tibia
info "Uruchamiam serwer gry..."
run systemctl restart tibia

# ----------------------------------------------------------------------------
# ETAP 9 — WERYFIKACJA: CZEKAM AŻ SERWER BĘDZIE ONLINE
# ----------------------------------------------------------------------------
STEP="Weryfikacja — czekam na port 7171"
info "Czekam aż serwer wstanie (max 120 s)..."
ONLINE=0
for i in $(seq 1 60); do
    if ss -tln | grep -q ':7171 '; then ONLINE=1; break; fi
    if ! systemctl is-active --quiet tibia; then
        echo "--- logi serwera ---"
        tail -n 30 "$SERVER_DIR/logs/errors.log" 2>/dev/null || true
        tail -n 30 "$SERVER_DIR/logs/server.log" 2>/dev/null || true
        die "Serwer nie wystartował — sprawdź logi powyżej."
    fi
    sleep 2
done
[[ "$ONLINE" -eq 1 ]] || die "Port 7171 nie odpowiada po 120 s. Logi: $SERVER_DIR/logs/"

# ----------------------------------------------------------------------------
# PODSUMOWANIE
# ----------------------------------------------------------------------------
cat >> "$CRED_FILE" <<EOF
SERVER_IP=$SERVER_IP
LOGIN_PORT=7171
CLIENT_VERSION=8.60
GOD_ACCOUNT=$GOD_ACCOUNT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
WWW=http://$SERVER_IP/
EOF

echo ""
echo -e "${C_GREEN}============================================================${C_NC}"
echo -e "${C_GREEN}  ✔ SERWER JEST ONLINE — INSTALACJA ZAKOŃCZONA POMYŚLNIE${C_NC}"
echo -e "${C_GREEN}============================================================${C_NC}"
echo ""
echo "  DANE DO LOGOWANIA W GRZE (OTClient / Tibia 8.60):"
echo "  ------------------------------------------------"
echo "  Adres (IP):     $SERVER_IP"
echo "  Port:           7171"
echo "  Wersja klienta: 8.60 (860)"
echo "  Konto:          $GOD_ACCOUNT"
echo "  Hasło:          $GOD_PASS"
echo "  Postać:         God (pełne uprawnienia administratora)"
echo ""
echo "  STRONA WWW:     http://$SERVER_IP/"
echo "  BAZA DANYCH:    $DB_NAME (user: $DB_USER, hasło w $CRED_FILE)"
echo ""
echo "  Wszystkie dane zapisane w: $CRED_FILE"
echo "  Zarządzanie serwerem:  systemctl {start|stop|restart|status} tibia"
echo "  Logi serwera:          $SERVER_DIR/logs/"
echo ""
echo -e "${C_GREEN}  Możesz się teraz zalogować do gry. Miłej zabawy!${C_NC}"
echo -e "${C_GREEN}============================================================${C_NC}"
