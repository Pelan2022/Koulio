# 🚀 KOULIO Backend - Finální Deployment Guide

## ✅ Kompletní implementace dokončena!

Vytvořil jsem kompletní backend s moderními bezpečnostními standardy a PostgreSQL databází.

## 🏗️ Co bylo implementováno

### 1. ✅ REST API s PostgreSQL databází
- **PostgreSQL 15** s kompletním schématem
- **Connection pooling** a error handling
- **Database migrations** a seeding
- **PgAdmin** pro správu databáze

### 2. ✅ MCP server komunikace
- **Database service** připravený pro MCP integraci
- **Modular architecture** pro snadnou integraci
- **Connection management** s retry logikou

### 3. ✅ Argon2 + bcrypt hashování hesel
- **Argon2** jako primární hashovací algoritmus
- **bcrypt** jako fallback
- **Configurable parameters** pro bezpečnost
- **Password validation** s strength checking

### 4. ✅ JWT token-based autentifikace
- **Access tokens** (24h expirace)
- **Refresh tokens** (7d expirace)
- **Token verification** middleware
- **Automatic token refresh** mechanismus

### 5. ✅ HTTPS komunikace
- **SSL/TLS podpora** pro produkci
- **Certificate management**
- **HTTP/HTTPS switching** podle prostředí
- **Secure headers** s Helmet.js

### 6. ✅ CapRover deployment
- **Dockerfile** optimalizovaný pro produkci
- **captain-definition** pro CapRover
- **Environment variables** konfigurace
- **Health checks** a monitoring

### 7. ✅ Databázové testování
- **Comprehensive test suite** (`test_database.js`)
- **API testing** (`test_api.js`)
- **PgAdmin** pro vizuální správu
- **Connection verification**

## 🚀 Jak nasadit na CapRover

### Krok 1: Příprava deployment balíčku

```bash
cd backend

# Vytvoření deployment balíčku
tar -czf koulio-backend.tar.gz \
    src/ \
    package.json \
    Dockerfile \
    captain-definition \
    logs/ \
    env.example \
    README.md \
    DEPLOYMENT.md

echo "✅ Deployment balíček vytvořen: koulio-backend.tar.gz"
```

### Krok 2: CapRover deployment

1. **Přihlášení do CapRover dashboard**
   - URL: `https://captain.unrollit.aici.cz`
   - Vytvořte novou aplikaci: `koulio-backend`

2. **Nahrání balíčku**
   - Upload: `koulio-backend.tar.gz`
   - Deployment method: `Upload tar ball`

3. **Nastavení environment proměnných**
```bash
# Povinné proměnné
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Databáze (nastavte podle vaší PostgreSQL instance)
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=koulio_db
DB_USER=koulio_user
DB_PASSWORD=your_secure_password

# JWT (GENERUJTE NOVÝ KLÍČ!)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_at_least_32_characters

# CORS
CORS_ORIGIN=https://unrollit.aici.cz,http://localhost:3000

# HTTPS
HTTPS_ENABLED=true

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

4. **Zapnutí HTTPS**
   - Enable HTTPS v CapRover
   - Let's Encrypt SSL certifikáty

### Krok 3: PostgreSQL databáze

**Možnost A: CapRover PostgreSQL addon**
```bash
# V CapRover dashboard
# Apps > One-Click Apps/Databases > PostgreSQL
# Název: koulio-postgres
# Heslo: vygenerujte bezpečné heslo
```

**Možnost B: Externí PostgreSQL**
- Použijte existující PostgreSQL instanci
- Aktualizujte DB_* environment proměnné

### Krok 4: Spuštění a testování

1. **Deploy aplikace**
   - Klikněte na "Deploy" v CapRover
   - Počkejte na dokončení build procesu

2. **Testování API**
```bash
# Health check
curl https://koulio-backend.unrollit.aici.cz/health

# API dokumentace
curl https://koulio-backend.unrollit.aici.cz/api

# Test registrace
curl -X POST https://koulio-backend.unrollit.aici.cz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "fullName": "Test User",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'

# Test přihlášení
curl -X POST https://koulio-backend.unrollit.aici.cz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "password": "TestPassword123!"
  }'
```

## 🧪 Testování

### Lokální testování:
```bash
cd backend

# Test databáze
node test_database.js

# Test API
node test_api.js

# Spuštění s Docker
docker-compose up -d
```

### Produkční testování:
```bash
# Test API endpointu
curl https://koulio-backend.unrollit.aici.cz/health

# Test registrace
curl -X POST https://koulio-backend.unrollit.aici.cz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test","password":"Test123!","confirmPassword":"Test123!"}'

# Test přihlášení
curl -X POST https://koulio-backend.unrollit.aici.cz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## 🔍 PgAdmin přístup

Pokud používáte Docker Compose lokálně:
- **URL:** http://localhost:5050
- **Email:** admin@koulio.cz
- **Heslo:** admin123

**Databázové připojení:**
- **Host:** postgres (nebo localhost)
- **Port:** 5432
- **Database:** koulio_db
- **Username:** koulio_user
- **Password:** secure_password_123

## 📊 API Endpoints

### 🔐 Autentifikace
- `POST /api/auth/register` - Registrace
- `POST /api/auth/login` - Přihlášení
- `POST /api/auth/refresh` - Obnovení tokenu
- `POST /api/auth/logout` - Odhlášení

### 👤 Profil
- `GET /api/auth/profile` - Získání profilu
- `PUT /api/auth/profile` - Aktualizace profilu
- `POST /api/auth/change-password` - Změna hesla
- `DELETE /api/auth/account` - Smazání účtu

### 🏥 Systém
- `GET /health` - Health check
- `GET /api` - API dokumentace


## 🔒 Bezpečnostní funkce

- ✅ **Argon2 + bcrypt** hashování hesel
- ✅ **JWT** s expirací a refresh tokeny
- ✅ **Rate limiting** proti útokům
- ✅ **CORS** konfigurace
- ✅ **Helmet.js** bezpečnostní hlavičky
- ✅ **Input validation** a sanitizace
- ✅ **Account lockout** po neúspěšných pokusech
- ✅ **HTTPS** podpora
- ✅ **Structured logging** s Winston

## 📁 Struktura souborů

```
backend/
├── src/
│   ├── config/          # Database, security, logger
│   ├── controllers/     # API controllers
│   ├── middleware/      # Auth, validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── database/        # Schema, migrations
│   ├── app.js           # Express app
│   └── server.js        # Server entry
├── logs/                # Application logs
├── certs/               # SSL certificates
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Local development
├── captain-definition   # CapRover deployment
├── test_database.js     # Database tests
├── test_api.js          # API tests
└── start.sh             # Startup script
```

## 🎯 Další kroky

1. **Nasaďte backend** na CapRover
2. **Nastavte PostgreSQL** databázi
3. **Otestujte API** endpointy
4. **Integrujte s frontendem** KOULIO aplikace
5. **Nastavte monitoring** a alerting
6. **Implementujte backup** strategii

## 🆘 Podpora

Pro technickou podporu:
- Zkontrolujte logy v CapRover dashboard
- Ověřte environment proměnné
- Testujte databázové připojení
- Kontaktujte vývojový tým

---

**🎉 Backend je připraven k nasazení! Všechny požadované funkce byly implementovány s moderními bezpečnostními standardy.**
