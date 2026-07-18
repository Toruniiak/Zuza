@echo off
chcp 65001 >nul
title Automatyczny instalator Tibia 8.60 OTS
echo ============================================================
echo   AUTOMATYCZNY INSTALATOR TIBIA 8.60 OTS NA VPS
echo ============================================================
echo.
echo  Ten program polaczy sie z Twoim serwerem VPS przez SSH
echo  i zainstaluje na nim kompletny, gotowy serwer OTS.
echo.
echo  Wymagania: VPS z Ubuntu 20.04/22.04/24.04 lub Debian 11/12
echo             oraz dostep root (haslo lub klucz SSH).
echo.

set /p VPS_IP=Podaj adres IP serwera VPS:
if "%VPS_IP%"=="" (
    echo [BLAD] Nie podano IP.
    pause
    exit /b 1
)

set /p VPS_USER=Uzytkownik SSH [domyslnie root]:
if "%VPS_USER%"=="" set VPS_USER=root

echo.
echo  Laczenie z %VPS_USER%@%VPS_IP% ...
echo  (jesli pojawi sie pytanie o haslo - wpisz haslo do VPS)
echo.

ssh -o StrictHostKeyChecking=accept-new %VPS_USER%@%VPS_IP% "bash -s" < "%~dp0install-ots.sh"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================================
    echo  [BLAD] Instalacja nie powiodla sie lub zostala przerwana.
    echo  Mozesz uruchomic ten plik ponownie - instalator dokonczy
    echo  prace od miejsca, w ktorym skonczyl.
    echo  Pelny log na serwerze: /root/ots-install.log
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo  GOTOWE! Dane logowania sa wyswietlone powyzej
    echo  oraz zapisane na VPS w pliku /root/ots-credentials.txt
    echo.
    echo  W OTClient ustaw:  IP: %VPS_IP%   Port: 7171   Wersja: 8.60
    echo ============================================================
)
echo.
pause
