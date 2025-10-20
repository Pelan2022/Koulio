@echo off
REM Skript pro nasazení KOULIO aplikace na CapRover (Windows)
REM Použití: deploy.bat [app-name] [captain-domain]

set APP_NAME=%1
set CAPTAIN_DOMAIN=%2

if "%APP_NAME%"=="" set APP_NAME=koulio
if "%CAPTAIN_DOMAIN%"=="" set CAPTAIN_DOMAIN=captain.yourdomain.com

echo 🚀 Nasazení KOULIO aplikace na CapRover...
echo 📱 Název aplikace: %APP_NAME%
echo 🌐 CapRover doména: %CAPTAIN_DOMAIN%

REM Kontrola, zda jsou všechny potřebné soubory přítomny
echo 📋 Kontrola souborů...

if not exist "captain-definition" (
    echo ❌ Chyba: Soubor captain-definition nebyl nalezen!
    pause
    exit /b 1
)

if not exist "Dockerfile" (
    echo ❌ Chyba: Soubor Dockerfile nebyl nalezen!
    pause
    exit /b 1
)

if not exist "index.html" (
    echo ❌ Chyba: Soubor index.html nebyl nalezen!
    pause
    exit /b 1
)

if not exist "login.html" (
    echo ❌ Chyba: Soubor login.html nebyl nalezen!
    pause
    exit /b 1
)

if not exist "register.html" (
    echo ❌ Chyba: Soubor register.html nebyl nalezen!
    pause
    exit /b 1
)

if not exist "profile.html" (
    echo ❌ Chyba: Soubor profile.html nebyl nalezen!
    pause
    exit /b 1
)

if not exist "koulio_complete_app.html" (
    echo ❌ Chyba: Soubor koulio_complete_app.html nebyl nalezen!
    pause
    exit /b 1
)

echo ✅ Všechny potřebné soubory jsou přítomny

REM Vytvoření zip archivu (Windows ekvivalent tar)
echo 📦 Vytváření zip archivu...

powershell -command "Compress-Archive -Path 'captain-definition', 'Dockerfile', 'index.html', 'login.html', 'register.html', 'profile.html', 'koulio_complete_app.html', '*.png', '*.ico', '*.jpg', '*.webmanifest' -DestinationPath 'koulio-app.zip' -Force"

echo ✅ Zip archiv vytvořen: koulio-app.zip

REM Instrukce pro nasazení
echo.
echo 🎯 Nyní postupujte podle těchto kroků:
echo.
echo 1. Otevřete CapRover dashboard: https://%CAPTAIN_DOMAIN%
echo 2. Přihlaste se do dashboardu
echo 3. Vytvořte novou aplikaci s názvem: %APP_NAME%
echo 4. V sekci 'Deployment' klikněte na 'Upload tar file'
echo 5. Nahrajte soubor: koulio-app.zip (nebo extrahujte a nahrajte tar)
echo 6. Počkejte na dokončení nasazení
echo 7. V sekci 'HTTP Settings' zapněte HTTPS
echo 8. Aplikace bude dostupná na: https://%APP_NAME%.yourdomain.com
echo.
echo.
echo ✨ Nasazení dokončeno! Váš autentifikační systém je připraven.
echo.
pause
