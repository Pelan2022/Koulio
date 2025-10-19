# Nasazení KOULIO aplikace na CapRover

## Požadavky
- CapRover server s nainstalovaným CapRover
- Git repository s aplikací
- Přístup k CapRover dashboardu

## Kroky pro nasazení

### 1. Příprava aplikace
Aplikace je již připravena s potřebnými soubory:
- `captain-definition` - konfigurace pro CapRover
- `Dockerfile` - Docker konfigurace pro nginx
- `koulio_complete_app.html` - hlavní HTML aplikace

### 2. Nasazení přes CapRover Dashboard

1. **Přihlaste se do CapRover dashboardu**
   - Otevřete `https://captain.yourdomain.com` (nahraďte yourdomain.com vaší doménou)

2. **Vytvořte novou aplikaci**
   - Klikněte na "Create New App"
   - Zadejte název aplikace (např. `koulio`)
   - Klikněte na "Create New App"

3. **Nahrajte a nasaďte aplikaci**
   - V sekci "Deployment" klikněte na "Upload tar file"
   - Nebo použijte "Deploy via Git Repository" pokud máte Git repo

4. **Konfigurace HTTPS**
   - Po úspěšném nasazení přejděte do sekce "HTTP Settings"
   - Zapněte "HTTPS" a "Force HTTPS"
   - Klikněte na "Enable HTTPS" pro automatické SSL certifikáty (Let's Encrypt)

### 3. Nasazení přes CLI (alternativa)

```bash
# Nainstalujte CapRover CLI
npm install -g caprover

# Přihlaste se do CapRover
caprover login

# Nasajte aplikaci
caprover deploy
```

### 4. Ověření nasazení

Po nasazení by měla být aplikace dostupná na:
- `https://koulio.yourdomain.com` (nebo váš zvolený název)

## Funkce aplikace

- ✅ Statická HTML aplikace s CSS a JavaScriptem
- ✅ Responzivní design
- ✅ Gzip komprese
- ✅ Cache pro statické soubory
- ✅ HTTPS podpora
- ✅ Let's Encrypt SSL certifikáty

## Řešení problémů

### Aplikace se nenačítá
- Zkontrolujte, zda je aplikace úspěšně nasazená v CapRover dashboardu
- Zkontrolujte logy aplikace v sekci "App Logs"

### HTTPS nefunguje
- Ujistěte se, že máte správně nakonfigurovanou doménu
- Zkontrolujte, zda je "Force HTTPS" zapnuté
- Počkejte několik minut na vygenerování SSL certifikátu

### Problémy s nasazením
- Zkontrolujte, zda jsou všechny potřebné soubory v root složce projektu
- Ujistěte se, že `captain-definition` a `Dockerfile` jsou správně vytvořené
