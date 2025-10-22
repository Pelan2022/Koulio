# 🚨 KRITICKÁ OPRAVA PRODUCTION ENVIRONMENT VARIABLES

## Problém
Aplikace používá `CORS_ORIGIN` ale v produkci je nastaveno `ALLOWED_ORIGINS`.

## Okamžitá oprava - změňte v CapRover:

### 1. PŘEJMENUJTE proměnnou (KRITICKÉ!)
```
❌ SMAZAT: ALLOWED_ORIGINS
✅ PŘIDAT: CORS_ORIGIN=https://srv-captain--unrollit
```

### 2. Přidejte zabezpečení databáze
```
✅ PŘIDAT: DB_SSL=true
✅ PŘIDAT: DB_SSL_REJECT_UNAUTHORIZED=false
```

### 3. Vygenerujte silnější JWT secrety
```bash
# Na vašem serveru spusťte:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Výstup použijte pro:
JWT_SECRET=<vysledek>
JWT_REFRESH_SECRET=<vysledek_2>
```

## Jak změnit v CapRover:

1. Přejděte do Apps → unrollit
2. Klikněte na "App Configs"
3. Scroll dolů na "Environment Variables"
4. Klikněte "Bulk Edit"
5. Změňte ALLOWED_ORIGINS na CORS_ORIGIN
6. Přidejte DB_SSL=true a DB_SSL_REJECT_UNAUTHORIZED=false
7. Vygenerujte nové JWT secrety
8. Klikněte "Save & Update"
9. Restartujte aplikaci

## Po změně ověřte:

1. Zkuste se připojit z frontendu
2. Zkontrolujte logy: `captain logs unrollit`
3. Ověřte health endpoint: `https://srv-captain--unrollit/health`

## Testování CORS:

```bash
# Tento příkaz by měl vrátit CORS headers:
curl -H "Origin: https://srv-captain--unrollit" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://srv-captain--unrollit/api/auth/login -v
```

Měli byste vidět:
```
< access-control-allow-origin: https://srv-captain--unrollit
< access-control-allow-credentials: true
```

## Minimální konfigurace pro fungující aplikaci:

```bash
# Database
DB_HOST=srv-captain--postgres
DB_PORT=5432
DB_NAME=unrollit
DB_USER=postgres
DB_PASSWORD=5880ac3aed402767
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Server
NODE_ENV=production
PORT=3000

# CORS - OPRAVENO!
CORS_ORIGIN=https://srv-captain--unrollit

# JWT
JWT_SECRET=<nový_silný_secret>
JWT_REFRESH_SECRET=<nový_silný_secret_2>
```

## Poznámky:

- `DB_SSL_REJECT_UNAUTHORIZED=false` je potřeba pokud PostgreSQL nepoužívá validní SSL certifikát
- Pokud máte více frontend domén (např. www.), použijte: `CORS_ORIGIN=https://srv-captain--unrollit,https://www.unrollit.com`
- JWT secrety by měly mít minimálně 64 znaků pro produkci
