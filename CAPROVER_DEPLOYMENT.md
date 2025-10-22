# 🚀 CapRover Deployment Guide pro KOULIO Backend

## 📋 Předpoklady

1. CapRover instance běžící na serveru
2. PostgreSQL databáze vytvořená v CapRover
3. Doménové jméno nakonfigurované

## 🔧 Krok 1: Vytvoření aplikace v CapRover

1. Přihlaste se do CapRover dashboard
2. Klikněte na "Apps" → "One-Click Apps/Databases"
3. Vytvořte PostgreSQL databázi (pokud ještě neexistuje)
4. Vytvořte novou aplikaci pro backend

## 📝 Krok 2: Konfigurace Environment Variables

V CapRover dashboard, přejděte na vaši aplikaci → App Configs → Environment Variables.

### MINIMÁLNÍ KONFIGURACE (nutné pro spuštění):

```bash
# Database - připojení k PostgreSQL
DB_HOST=srv-captain--postgres
DB_PORT=5432
DB_NAME=unrollit
DB_USER=postgres
DB_PASSWORD=<váš_db_password>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Server
NODE_ENV=production
PORT=3000

# CORS - DŮLEŽITÉ! Použijte správný název domény
CORS_ORIGIN=https://srv-captain--unrollit

# JWT - vygenerujte silné secrety!
JWT_SECRET=<generujte_64_znaku_random>
JWT_REFRESH_SECRET=<generujte_64_znaku_random>
```

### DOPORUČENÁ PRODUKČNÍ KONFIGURACE:

```bash
# === DATABASE ===
DB_HOST=srv-captain--postgres
DB_PORT=5432
DB_NAME=unrollit
DB_USER=postgres
DB_PASSWORD=<váš_db_password>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# === SERVER ===
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
HTTPS_ENABLED=false

# === CORS ===
# Pro více domén oddělte čárkou:
CORS_ORIGIN=https://srv-captain--unrollit,https://www.unrollit.com

# === JWT SECURITY ===
JWT_SECRET=<silný_random_secret_64+_znaků>
JWT_REFRESH_SECRET=<jiný_silný_random_secret_64+_znaků>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# === PASSWORD HASHING ===
BCRYPT_ROUNDS=12
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# === API DOCUMENTATION ===
API_DOCS_ENABLED=true

# === EMAIL (volitelné) ===
EMAIL_FROM=noreply@unrollit.com
SENDGRID_API_KEY=<váš_sendgrid_key>
# Nebo SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<email>
SMTP_PASS=<heslo>

# === LOGGING ===
LOG_LEVEL=info

# === MONITORING (volitelné) ===
SENTRY_DSN=<váš_sentry_dsn>
```

## 🔐 Krok 3: Vygenerování JWT Secrets

**NIKDY nepoužívejte předvídatelné secrety v produkci!**

### Metoda 1: Node.js (doporučeno)
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

### Metoda 2: OpenSSL
```bash
openssl rand -hex 64
```

### Metoda 3: Online
Použijte: https://generate-secret.vercel.app/64

## 🐳 Krok 4: Deployment

### Metoda A: Git Push (doporučeno)

1. Nastavte CapRover remote:
```bash
cd /path/to/koulio
git remote add caprover https://git.caprover.com/unrollit
```

2. Pushněte na CapRover:
```bash
git push caprover main
```

### Metoda B: CLI Deploy

1. Nainstalujte CapRover CLI:
```bash
npm install -g caprover
```

2. Přihlaste se:
```bash
caprover login
```

3. Nasaďte aplikaci:
```bash
cd backend
caprover deploy
```

## 🗄️ Krok 5: Database Setup

Po prvním nasazení inicializujte databázi:

### Metoda A: Přes CapRover Web Terminal

1. V CapRover dashboard → Apps → unrollit → "Web Terminal"
2. Spusťte:
```bash
npm run migrate
# nebo
node src/database/migrate.js
```

### Metoda B: Lokálně (s tunelem)

```bash
# Vytvořte SSH tunel k PostgreSQL
ssh -L 5432:srv-captain--postgres:5432 root@váš-server

# V jiném terminálu spusťte migrace
DB_HOST=localhost npm run migrate
```

## ✅ Krok 6: Ověření

### 1. Zkontrolujte health endpoint
```bash
curl https://srv-captain--unrollit/health
```

Měli byste vidět:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### 2. Zkontrolujte CORS
```bash
curl -H "Origin: https://srv-captain--unrollit" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://srv-captain--unrollit/api/auth/login -v
```

Měli byste vidět CORS headers:
```
< access-control-allow-origin: https://srv-captain--unrollit
< access-control-allow-credentials: true
```

### 3. Zkontrolujte API dokumentaci
Otevřete v prohlížeči:
```
https://srv-captain--unrollit/api-docs
```

### 4. Zkontrolujte logy
V CapRover dashboard:
```
Apps → unrollit → View Logs
```

Nebo přes CLI:
```bash
caprover logs unrollit --follow
```

## 🔧 Troubleshooting

### ❌ Problém: "Not allowed by CORS"

**Příčina:** Špatně nastavená `CORS_ORIGIN` proměnná

**Řešení:**
1. Ověřte, že používáte `CORS_ORIGIN` (NE `ALLOWED_ORIGINS`)
2. Zkontrolujte správnou doménu (např. `https://srv-captain--unrollit`)
3. Pokud používáte custom doménu, přidejte ji: `CORS_ORIGIN=https://unrollit.com,https://www.unrollit.com`

### ❌ Problém: "Database connection failed"

**Příčina:** Špatné databázové credentials nebo SSL

**Řešení:**
1. Ověřte `DB_HOST=srv-captain--postgres` (CapRover internal name)
2. Přidejte `DB_SSL=true` a `DB_SSL_REJECT_UNAUTHORIZED=false`
3. Zkontrolujte DB credentials v PostgreSQL app

### ❌ Problém: "Too many requests"

**Příčina:** Rate limiting je aktivní

**Řešení:**
- To je očekávané chování po security fixes
- Můžete upravit limity přes environment variables:
  - `RATE_LIMIT_WINDOW_MS=900000` (15 minut)
  - `RATE_LIMIT_MAX_REQUESTS=100`

### ❌ Problém: "Invalid token" nebo JWT errors

**Příčina:** JWT secret se změnil nebo není nastaven

**Řešení:**
1. Ověřte, že `JWT_SECRET` je nastavený
2. Pokud jste změnili JWT secret, všechny tokeny jsou neplatné
3. Uživatelé se musí znovu přihlásit

## 🔒 Security Checklist

- [ ] Silné JWT secrety (64+ znaků random)
- [ ] DB_SSL zapnuto
- [ ] CORS správně nakonfigurováno
- [ ] NODE_ENV=production
- [ ] Rate limiting zapnuto (default)
- [ ] API dokumentace vypnuta v produkci (volitelné): `API_DOCS_ENABLED=false`
- [ ] Silné databázové heslo
- [ ] Monitoring (Sentry) nakonfigurován

## 📊 Monitoring

### Přístup k logům:
```bash
# Real-time logs
caprover logs unrollit --follow

# Poslední logy
caprover logs unrollit --lines 100
```

### Metriky:
- CapRover dashboard → Apps → unrollit → "Monitoring"
- Sledujte CPU, Memory, Network

### Sentry (volitelné):
1. Vytvořte projekt na sentry.io
2. Přidejte `SENTRY_DSN` do environment variables

## 🔄 Updates

### Nasazení nové verze:

```bash
# 1. Commitněte změny
git add .
git commit -m "Update version"

# 2. Pushněte na CapRover
git push caprover main

# 3. CapRover automaticky:
#    - Stáhne nový kód
#    - Buildne Docker image
#    - Provede rolling update (zero downtime)
```

### Database migrace:

```bash
# Pokud jste změnili DB schema:
# 1. Nasaďte novou verzi
# 2. Spusťte migrace přes Web Terminal
npm run migrate
```

## 📞 Support

- Backend logs: `caprover logs unrollit`
- Database: Přihlaste se do PostgreSQL app v CapRover
- Issues: https://github.com/Pelan2022/Koulio/issues

## 📚 Další dokumentace

- [PRODUCTION_ENV_FIX.md](./PRODUCTION_ENV_FIX.md) - Oprava CORS problémů
- [backend/env.example](./backend/env.example) - Kompletní přehled env variables
- [CapRover Docs](https://caprover.com/docs/) - Oficiální dokumentace
