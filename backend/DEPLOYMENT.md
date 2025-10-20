# 🚀 KOULIO Backend Deployment Guide

## 📋 Přehled pouze

Kompletní backend API s PostgreSQL databází, JWT autentifikací a moderními bezpečnostními standardy.

## 🏗️ Architektura

```
backend/
├── src/
│   ├── config/          # Konfigurace (database, security, logger)
│   ├── controllers/     # API controllery
│   ├── middleware/      # Middleware (auth, validation)
│   ├── models/          # Databázové modely
│   ├── routes/          # API routes
│   ├── database/        # Databázové schéma a migrace
│   ├── app.js           # Express aplikace
│   └── server.js        # Server entry point
├── logs/                # Log soubory
├── certs/               # SSL certifikáty (produkce)
├── Dockerfile           # Docker konfigurace
├── docker-compose.yml   # Lokální development
└── captain-definition   # CapRover deployment
```

## 🔧 Funkce

- ✅ **PostgreSQL databáze** s kompletním schématem
- ✅ **Argon2 + bcrypt** hashování hesel
- ✅ **JWT autentifikace** s refresh tokeny
- ✅ **REST API** s validací a sanitizací
- ✅ **Rate limiting** a bezpečnostní middleware
- ✅ **HTTPS podpora** pro produkci
- ✅ **Logging** s Winston
- ✅ **Docker** kontejnerizace
- ✅ **PgAdmin** pro správu databáze

## 🚀 Rychlé nasazení

### 1. Lokální development s Docker Compose

```bash
# Klonování a příprava
cd backend
cp env.example .env
# Upravte .env soubor podle potřeby

# Spuštění všech služeb
docker-compose up -d

# Kontrola stavu
docker-compose ps
docker-compose logs backend
```

### 2. CapRover deployment

```bash
# Příprava deployment balíčku
tar -czf koulio-backend.tar.gz \
    src/ \
    package.json \
    Dockerfile \
    captain-definition \
    logs/

# Nasaďte přes CapRover dashboard
# 1. Vytvořte novou aplikaci
# 2. Nahrajte koulio-backend.tar.gz
# 3. Nastavte environment proměnné
# 4. Zapněte HTTPS
```

## 🔐 Environment proměnné

### Povinné proměnné:
```bash
# Databáze
DB_HOST=postgres
DB_PORT=5432
DB_NAME=koulio_db
DB_USER=koulio_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure

# CORS
CORS_ORIGIN=https://unrollit.aici.cz,http://localhost:3000
```

### Volitelné proměnné:
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 📊 API Endpoints

### Autentifikace
- `POST /api/auth/register` - Registrace
- `POST /api/auth/login` - Přihlášení
- `POST /api/auth/refresh` - Obnovení tokenu
- `POST /api/auth/logout` - Odhlášení

### Uživatelský profil
- `GET /api/auth/profile` - Získání profilu
- `PUT /api/auth/profile` - Aktualizace profilu
- `POST /api/auth/change-password` - Změna hesla
- `DELETE /api/auth/account` - Smazání účtu

### Systém
- `GET /health` - Health check
- `GET /api` - API dokumentace

## 🗄️ Databáze

### PostgreSQL schéma:
- `users` - Uživatelské účty
- `user_sessions` - Sledování relací
- `password_reset_tokens` - Reset hesla
- `email_verification_tokens` - Ověření emailu
- `audit_log` - Audit trail


## 🔍 Testování

### 1. Health check
```bash
curl http://localhost:3000/health
```

### 2. Registrace uživatele
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "fullName": "Test User",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'
```

### 3. Přihlášení
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "password": "TestPassword123!"
  }'
```

## 🛠️ PgAdmin přístup

### Lokální development:
- **URL:** http://localhost:5050
- **Email:** admin@koulio.cz
- **Heslo:** admin123

### Připojení k databázi:
- **Host:** postgres
- **Port:** 5432
- **Database:** koulio_db
- **Username:** koulio_user
- **Password:** secure_password_123

## 📝 Logy

Logy se ukládají do:
- `logs/app.log` - Všechny logy
- `logs/error.log` - Pouze chyby
- `logs/exceptions.log` - Nezpracované výjimky

## 🔒 Bezpečnost

- **Helmet.js** pro HTTP hlavičky
- **CORS** konfigurace
- **Rate limiting** proti útokům
- **Input validation** a sanitizace
- **Password hashing** (Argon2/bcrypt)
- **JWT** tokeny s expirací
- **Account lockout** po neúspěšných pokusech

## 🚨 Řešení problémů

### Databáze se nepřipojuje:
```bash
# Kontrola stavu PostgreSQL
docker-compose logs postgres

# Test připojení
docker-compose exec postgres psql -U koulio_user -d koulio_db -c "SELECT NOW();"
```

### Backend se nespouští:
```bash
# Kontrola logů
docker-compose logs backend

# Kontrola dependencies
docker-compose exec backend npm list
```

### HTTPS problémy:
- Zkontrolujte SSL certifikáty
- Ověřte HTTPS_ENABLED=true
- Zkontrolujte CapRover SSL nastavení

## 📞 Podpora

Pro technickou podporu kontaktujte vývojový tým nebo vytvořte issue v repository.
