# 🚀 KOULIO Backend API

Moderní backend API pro KOULIO aplikaci s PostgreSQL databází, JWT autentifikací a pokročilými bezpečnostními funkcemi.

## ✨ Funkce

- 🔐 **JWT autentifikace** s refresh tokeny
- 🔒 **Argon2 + bcrypt** hashování hesel
- 🗄️ **PostgreSQL** databáze s kompletním schématem
- 🛡️ **Bezpečnostní middleware** (Helmet, CORS, Rate limiting)
- 📊 **Strukturované logování** s Winston
- 🐳 **Docker** kontejnerizace
- 🔍 **Input validace** a sanitizace
- 📈 **Account lockout** po neúspěšných pokusech
- 🔄 **HTTPS podpora** pro produkci

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
├── certs/               # SSL certifikáty
├── Dockerfile           # Docker konfigurace
├── docker-compose.yml   # Lokální development
└── captain-definition   # CapRover deployment
```

## 🚀 Rychlý start

### 1. Lokální development

```bash
# Instalace dependencies
npm install

# Nastavení environment proměnných
cp env.example .env
# Upravte .env soubor

# Spuštění s Docker Compose
docker-compose up -d

# Nebo spuštění bez Dockeru (vyžaduje PostgreSQL)
npm run migrate
npm run seed
npm run dev
```

### 2. Testování databáze

```bash
# Test připojení k databázi
node test_database.js

# Spuštění migrací
npm run migrate

# Naplnění databáze testovacími daty
npm run seed
```

### 3. API testování

```bash
# Health check
curl http://localhost:3000/health

# Registrace uživatele
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "fullName": "Test User",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'

# Přihlášení
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@koulio.cz",
    "password": "TestPassword123!"
  }'
```

## 📊 API Endpoints

### 🔐 Autentifikace
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení uživatele
- `POST /api/auth/refresh` - Obnovení access tokenu
- `POST /api/auth/logout` - Odhlášení uživatele

### 👤 Uživatelský profil
- `GET /api/auth/profile` - Získání profilu uživatele
- `PUT /api/auth/profile` - Aktualizace profilu
- `POST /api/auth/change-password` - Změna hesla
- `DELETE /api/auth/account` - Smazání účtu

### 🏥 Systém
- `GET /health` - Health check
- `GET /api` - API dokumentace


## 🗄️ Databáze

### PostgreSQL schéma:
- `users` - Uživatelské účty
- `user_sessions` - Sledování relací
- `password_reset_tokens` - Reset hesla
- `email_verification_tokens` - Ověření emailu
- `audit_log` - Audit trail

### PgAdmin přístup:
- **URL:** http://localhost:5050
- **Email:** admin@koulio.cz
- **Heslo:** admin123

## 🔧 Environment proměnné

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Databáze
DB_HOST=postgres
DB_PORT=5432
DB_NAME=koulio_db
DB_USER=koulio_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Bezpečnost
BCRYPT_ROUNDS=12
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1

# HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem

# CORS
CORS_ORIGIN=https://unrollit.aici.cz,http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🐳 Docker deployment

### Lokální development:
```bash
docker-compose up -d
```

### CapRover deployment:
```bash
# Vytvoření deployment balíčku
tar -czf koulio-backend.tar.gz \
    src/ \
    package.json \
    Dockerfile \
    captain-definition \
    logs/

# Nasaďte přes CapRover dashboard
```

## 🧪 Testování

### Jednotkové testy:
```bash
npm test
```

### Test databáze:
```bash
node test_database.js
```

### API testování:
```bash
# Health check
curl http://localhost:3000/health

# Test registrace
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test","password":"Test123!","confirmPassword":"Test123!"}'
```

## 📝 Logy

Logy se ukládají do:
- `logs/app.log` - Všechny logy
- `logs/error.log` - Pouze chyby
- `logs/exceptions.log` - Nezpracované výjimky

## 🔒 Bezpečnost

- **Helmet.js** pro HTTP bezpečnostní hlavičky
- **CORS** konfigurace pro cross-origin requests
- **Rate limiting** proti DDoS útokům
- **Input validation** a sanitizace
- **Password hashing** s Argon2 (fallback bcrypt)
- **JWT tokeny** s expirací
- **Account lockout** po neúspěšných pokusech
- **HTTPS** podpora pro produkci

## 🚨 Řešení problémů

### Databáze se nepřipojuje:
```bash
# Kontrola PostgreSQL
docker-compose logs postgres

# Test připojení
docker-compose exec postgres psql -U koulio_user -d koulio_db -c "SELECT NOW();"
```

### Backend se nespouští:
```bash
# Kontrola logů
docker-compose logs backend

# Kontrola dependencies
npm install
```

### HTTPS problémy:
- Zkontrolujte SSL certifikáty v `certs/` složce
- Ověřte `HTTPS_ENABLED=true` v environment proměnných
- Zkontrolujte CapRover SSL nastavení

## 📞 Podpora

Pro technickou podporu kontaktujte vývojový tým nebo vytvořte issue v repository.

## 📄 Licence

MIT License - viz LICENSE soubor pro detaily.
