#!/bin/bash

# Skript pro nasazení KOULIO aplikace na CapRover
# Použití: ./deploy.sh [app-name] [captain-domain]

APP_NAME=${1:-"koulio"}
CAPTAIN_DOMAIN=${2:-"captain.yourdomain.com"}

echo "🚀 Nasazení KOULIO aplikace na CapRover..."
echo "📱 Název aplikace: $APP_NAME"
echo "🌐 CapRover doména: $CAPTAIN_DOMAIN"

# Kontrola, zda jsou všechny potřebné soubory přítomny
echo "📋 Kontrola souborů..."

required_files=(
    "captain-definition"
    "Dockerfile"
    "index.html"
    "login.html"
    "register.html"
    "profile.html"
    "koulio_complete_app.html"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Chyba: Soubor $file nebyl nalezen!"
        exit 1
    fi
done

echo "✅ Všechny potřebné soubory jsou přítomny"

# Vytvoření tar archivu
echo "📦 Vytváření tar archivu..."
tar -czf koulio-app.tar.gz \
    captain-definition \
    Dockerfile \
    index.html \
    login.html \
    register.html \
    profile.html \
    koulio_complete_app.html \
    *.png \
    *.ico \
    *.jpg \
    *.webmanifest

echo "✅ Tar archiv vytvořen: koulio-app.tar.gz"

# Instrukce pro nasazení
echo ""
echo "🎯 Nyní postupujte podle těchto kroků:"
echo ""
echo "1. Otevřete CapRover dashboard: https://$CAPTAIN_DOMAIN"
echo "2. Přihlaste se do dashboardu"
echo "3. Vytvořte novou aplikaci s názvem: $APP_NAME"
echo "4. V sekci 'Deployment' klikněte na 'Upload tar file'"
echo "5. Nahrajte soubor: koulio-app.tar.gz"
echo "6. Počkejte na dokončení nasazení"
echo "7. V sekci 'HTTP Settings' zapněte HTTPS"
echo "8. Aplikace bude dostupná na: https://$APP_NAME.yourdomain.com"
echo ""
echo "🔐 Demo přihlašovací údaje:"
echo "   Email: demo@koulio.cz"
echo "   Heslo: demo123"
echo ""
echo "✨ Nasazení dokončeno! Váš autentifikační systém je připraven."
