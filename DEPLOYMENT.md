# Nasazení KOULIO aplikace na CapRover s autentifikací

## Požadavky
- CapRover server s nainstalovaným CapRover
- Git repository s aplikací
- Přístup k CapRover dashboardu

## Kroky pro nasazení

### 1. Příprava aplikace
Aplikace je připravena s kompletním autentifikačním systémem:
- `captain-definition` - konfigurace pro CapRover
- `Dockerfile` - Docker konfigurace pro nginx
- `index.html` - vstupní stránka s přesměrováním
- `login.html` - přihlašovací stránka
- `register.html` - registrační stránka
- `profile.html` - správa uživatelského účtu
- `koulio_complete_app.html` - hlavní aplikace s autentifikací
- Všechny favicon a manifest soubory

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

- ✅ Kompletní autentifikační systém (registrace + přihlášení)
- ✅ Správa uživatelských účtů
- ✅ Demo účet pro testování
- ✅ Statická HTML aplikace s CSS a JavaScriptem
- ✅ Responzivní design
- ✅ Gzip komprese
- ✅ Cache pro statické soubory
- ✅ HTTPS podpora
- ✅ Let's Encrypt SSL certifikáty
- ✅ SPA routing s nginx

## Autentifikační systém

### Demo účet
- **Email:** demo@koulio.cz
- **Heslo:** demo123

### Registrace
- Uživatelé se mohou zaregistrovat s vlastním emailem
- Validace formulářů a kontrola síly hesla
- Automatické přesměrování po registraci

### Přihlášení
- Podpora demo i registrovaných účtů
- Automatické rozpoznání typu účtu
- Session management

### Správa účtu
- Změna hesla
- Export dat
- Smazání účtu
- Zobrazení informací o účtu

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
