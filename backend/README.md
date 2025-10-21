# 🚀 KOULIO Backend API

Modernní REST API pro aplikaci KOULIO s PostgreSQL databází, JWT autentifikací a pokročilými bezpečnostními funkcemi.

## ✨ Funkce

### 🔐 **Autentifikace a autorizace**
- **JWT autentifikace** s access a refresh tokeny
- **Role-based Access Control (RBAC)** - admin, user, guest role
- **Bezpečné hashování hesel** pomocí Argon2/bcrypt
- **Rate limiting** pro ochranu proti útokům
- **Session management** s automatickým refresh tokenů

### 📊 **Monitoring a logování**
- **Strukturované logování** s Winston
- **Audit trail** pro všechny uživatelské akce
- **Health checks** pro CapRover/Kubernetes
- **Performance monitoring** s metrikami
- **Error tracking** s detaillovanými logy

### 🔒 **Bezpečnost**
- **Helmet.js** pro HTTP security headers
- **Input sanitization** proti XSS útokům
- **SQL injection detection** a ochrana
- **Suspicious activity monitoring**
- **CORS konfigurace** pouze pro povolené domény

### 📧 **Email notifikace**
- **Registrační potvrzení** s email verification
- **Reset hesla** s bezpečnými tokeny
- **Notifikace o změnách** účtu
- **SendGrid/SMTP podpora**

### 📤 **Export dat**
- **CSV export** uživatelských dat
- **PDF export** s formátováním
- **JSON export** s audit logy
- **Automatické čištění** temp souborů

### 🧪 **Testování a CI/CD**
- **Jest testování** s coverage reporty
- **ESLint + Prettier** pro code quality
- **GitHub Actions** CI/CD pipeline
- **Automatické deployment** na CapRover

### 📚 **Dokumentace**
- **Swagger/OpenAPI** dokumentace
- **Automatická generace** z kódu
- **Interaktivní API explorer**
- **Comprehensive README**

## 🛠️ Technologie

- **Node.js** 18+ s Express.js
- **PostgreSQL** 15+ s SSL připojením
- **JWT** pro token-based autentifikaci
- **Winston** pro logování
- **Jest** pro testování
- **Swagger** pro dokumentaci
- **Docker** pro containerizaci

## 🚀 Rychlý start

### Předpoklady
- Node.js 18+
- PostgreSQL 15+
- npm nebo yarn

### Instalace

```bash
# Klonování repository
git clone <repository-url>
cd koulio-backend

# Instalace závislostí
npm install

# Nastavení environment proměnných
cp env.example .env
# Upravte .env soubor podle vašeho prostředí

# Spuštění databázových migrací
npm run migrate

# Spuštění aplikace
npm run dev
```

### Environment proměnné

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_FROM=noreply@koulio.cz
SENDGRID_API_KEY=your-sendgrid-key

# Security
CORS_ORIGIN=https://unrollit.aici.cz
```

## 📖 API dokumentace

Po spuštění aplikace je dokumentace dostupná na:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health check**: `http://localhost:3000/health`

### Hlavní endpointy

```
POST /api/auth/register     # Registrace uživatele
POST /api/auth/login        # Přihlášení
POST /api/auth/refresh      # Refresh token
POST /api/auth/logout       # Odhlášení
GET  /api/auth/profile      # Profil uživatele

GET  /api/user/profile      # Uživatelský profil
PUT  /api/user/profile      # Aktualizace profilu
POST /api/user/change-password # Změna hesla
GET  /api/user/export       # Export dat
DELETE /api/user/account    # Smazání účtu

GET  /api/admin/users       # Seznam uživatelů (admin)
GET  /api/admin/audit       # Audit logy (admin)
GET  /api/admin/stats       # Statistiky (admin)

GET  /health                # Health check
GET  /api-docs              # API dokumentace
```

## 🧪 Testování

```bash
# Spuštění všech testů
npm test

# Testy s coverage
npm run test:coverage

# Testy ve watch módu
npm run test:watch

# CI testy
npm run test:ci
```

### Test coverage
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🔧 Vývoj

### Code quality

```bash
# Linting
npm run lint
npm run lint:fix

# Formátování
npm run format
npm run format:check

# Security audit
npm run security:check
```

### Databáze

```bash
# Migrace
npm run migrate

# Seed data
npm run seed

# Backup
npm run backup
```

### Logy a monitoring

```bash
# Sledování logů
npm run logs
npm run logs:error

# Vyčištění temp souborů
npm run cleanup:temp

# Vyčištění starých logů
npm run cleanup:logs
```

## 🐳 Docker

```bash
# Build image
docker build -t koulio-backend .

# Run container
docker run -d \
  --name koulio-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  koulio-backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: koulio_db
      POSTGRES_USER: koulio_user
      POSTGRES_PASSWORD: your_password

  redis:
    image: redis:7-alpine
```

## 🚀 Deployment

### CapRover

1. **Příprava aplikace**:
```bash
tar -czf koulio-backend.tar.gz \
    src/ scripts/ package.json Dockerfile captain-definition
```

2. **Upload do CapRover** a nastavení environment proměnných

3. **Deploy** - automaticky přes GitHub Actions

### Environment proměnné pro produkci

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://unrollit.aici.cz
EMAIL_FROM=noreply@koulio.cz
SENDGRID_API_KEY=your-sendgrid-key
LOG_LEVEL=info
```

## 📊 Monitoring

### Health checks
- `GET /health` - Kompletní health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Metriky
- Response time tracking
- Memory usage monitoring
- Database performance
- Error rate tracking

### Logy
- **Error logy**: `logs/error-YYYY-MM-DD.log`
- **Combined logy**: `logs/combined-YYYY-MM-DD.log`
- **Retention**: 30 dní

## 🔒 Bezpečnost

### Rate limiting
- **Auth endpoints**: 5 requests / 15 min
- **Registration**: 3 requests / 1 hour
- **API endpoints**: 100 requests / 15 min

### Security headers
- Content Security Policy
- HSTS s preload
- X-Frame-Options
- X-Content-Type-Options

### Audit logging
- Všechny uživatelské akce
- Login/logout events
- Profile changes
- Admin actions

## 🛠️ Údržba

### Zálohování
```bash
# Manuální záloha
npm run backup

# Automatické zálohování (cron)
0 2 * * * cd /app && npm run backup:cron
```

### Čištění
```bash
# Vyčištění temp souborů
npm run cleanup:temp

# Vyčištění starých logů
npm run cleanup:logs

# Všechno najednou
npm run cleanup:all
```

## 🤝 Contributing

1. Fork repository
2. Vytvořte feature branch (`git checkout -b feature/amazing-feature`)
3. Commit změny (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otevřete Pull Request

### Code style
- ESLint + Prettier konfigurace
- Jest testy pro nové funkce
- Swagger dokumentace pro API endpointy

## 📄 Licence

Tento projekt je licencován pod MIT licencí - viz [LICENSE](LICENSE) soubor.

## 📞 Support

- **Email**: admin@koulio.cz
- **Dokumentace**: `/api-docs`
- **Health check**: `/health`
- **Logy**: `logs/` adresář

---

**🎯 Backend je připraven pro produkční nasazení s enterprise-level funkcionalitami!**