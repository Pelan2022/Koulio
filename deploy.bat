@echo off
REM KOULIO Deployment Script podle cursorrules
REM Tento script nasadí aplikaci na CapRover server

echo 🚀 KOULIO Deployment Script
echo ==========================

REM Zkontroluj, zda je git repository čistý
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git repository není čistý. Commitněte změny před nasazením.
    pause
    exit /b 1
)

REM Push změn do Git repository
echo 📤 Push změn do Git repository...
git push origin main

if %errorlevel% equ 0 (
    echo ✅ Git push úspěšný
    echo 🔄 CapRover automaticky nasadí aplikaci z Git repository
    echo ⏳ Počkejte na dokončení build procesu
    echo 🌐 Aplikace bude dostupná na: https://your-app-name.aici.cz
    echo 🔍 Health check: https://your-app-name.aici.cz/health
) else (
    echo ❌ Git push selhal
    pause
    exit /b 1
)

echo.
echo 📋 Deployment checklist:
echo   ✅ Git push dokončen
echo   ⏳ CapRover build probíhá
echo   🔍 Zkontrolujte health endpoint
echo   🌐 Ověřte funkčnost aplikace
echo.
echo 🎯 Pro monitoring použijte:
echo   caprover logs -a your-app-name -f

pause