#!/bin/bash

# KOULIO Deployment Script podle cursorrules
# Tento script nasadí aplikaci na CapRover server

echo "🚀 KOULIO Deployment Script"
echo "=========================="

# Zkontroluj, zda je git repository čistý
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Git repository není čistý. Commitněte změny před nasazením."
    exit 1
fi

# Push změn do Git repository
echo "📤 Push změn do Git repository..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Git push úspěšný"
    echo "🔄 CapRover automaticky nasadí aplikaci z Git repository"
    echo "⏳ Počkejte na dokončení build procesu"
    echo "🌐 Aplikace bude dostupná na: https://your-app-name.aici.cz"
    echo "🔍 Health check: https://your-app-name.aici.cz/health"
else
    echo "❌ Git push selhal"
    exit 1
fi

echo ""
echo "📋 Deployment checklist:"
echo "  ✅ Git push dokončen"
echo "  ⏳ CapRover build probíhá"
echo "  🔍 Zkontrolujte health endpoint"
echo "  🌐 Ověřte funkčnost aplikace"
echo ""
echo "🎯 Pro monitoring použijte:"
echo "  caprover logs -a your-app-name -f"