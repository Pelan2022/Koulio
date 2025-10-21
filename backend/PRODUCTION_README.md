# 🚀 KOULIO Backend - Produkční nasazení

## 📋 Přehled

Tento dokument popisuje produkční nasazení KOULIO backend API s PostgreSQL databází, včetně logování, monitoringu, zálohování a bezpečnostních opatření.

## 🔧 Požadavky

- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 13.0
- **Docker**: >= 20.0 (pro containerizaci)
- **CapRover**: Pro deployment

## 📦 Instalace závislostí

```bash
cd backend
npm install
```

## 🔐 Environment proměnné

Zkopírujte `env.example` na `.env` a nastavte:

```bash
cp env.example .env
```

### Povinné proměnné:

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=koulio_db
DB_USER=koulio_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
CORS_ORIGIN=https://unrollit.aici.cz
ALLOWED_IPS=127.0.0.1,::1

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here

# Backup
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=30
```

## 🗄️ Databáze

### Inicializace:

```bash
# Spuštění migrace
npm run migrate

# Naplnění testovacími daty (volitelné)
npm run seed
```

### SSL připojení:

Databáze musí používat SSL připojení (`sslmode=require` v DATABASE_URL).

## 📊 Logování a monitoring

### Strukturované logování:

- **Console**: Barevné logy pro development
- **Files**: Rotované logy v `logs/` adresáři
- **Levels**: error, warn, info, debug

### Health checks:

- `GET /health` - Kompletní health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Monitoring metriky:

- Response time tracking
- Memory usage monitoring
- Database performance
- Error rate tracking

## 🔒 Bezpečnost

### Implementované opatření:

1. **Helmet.js** - HTTP security headers
2. **Rate limiting** - Omezení počtu requestů
3. **CORS** - Cross-origin resource sharing
4. **Input sanitization** - Sanitizace vstupů
5. **SQL injection protection** - Detekce SQL injection
6. **Suspicious activity detection** - Detekce podezřelých aktivit

### Rate limiting:

- **Auth endpoints**: 5 requests / 15 min
- **Registration**: 3 requests / 1 hour
- **API endpoints**: 100 requests / 15 min
- **Password change**: 3 requests / 1 hour

## 💾 Zálohování

### Automatické zálohování:

```bash
# Manuální záloha
node scripts/backup.js

# Cron job (denně v 2:00 AM)
0 2 * * * cd /app && node scripts/backup-cron.js
```

### Zálohovací soubory:

- **Lokace**: `/app/backups/`
- **Formát**: `koulio_backup_YYYY-MM-DDTHH-mm-ss.sql.gz`
- **Retention**: 30 dní (nastavitelné)
- **Komprese**: Gzip komprese

### Obnovení zálohy:

```bash
# Dekomprese
gunzip koulio_backup_2024-01-15T02-00-00.sql.gz

# Obnovení
psql -h host -U user -d database < koulio_backup_2024-01-15T02-00-00.sql
```

## 🐳 Docker deployment

### Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN mkdir -p logs backups

EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db?sslmode=require
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs
      - ./backups:/app/backups

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: koulio_db
      POSTGRES_USER: koulio_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🚀 CapRover deployment

### 1. Příprava aplikace:

```bash
# Vytvoření tar archivu
tar -czf koulio-backend.tar.gz \
    src/ \
    scripts/ \
    package.json \
    package-lock.json \
    Dockerfile \
    captain-definition \
    .env.example
```

### 2. CapRover konfigurace:

```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### 3. Environment proměnné v CapRover:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `CORS_ORIGIN=https://unrollit.aici.cz`

## 📈 Monitoring a alerting

### Logy:

- **Error logy**: `logs/error-YYYY-MM-DD.log`
- **Combined logy**: `logs/combined-YYYY-MM-DD.log`
- **Retention**: 30 dní

### Metriky:

- **Response time**: Průměrná doba odezvy
- **Memory usage**: Využití paměti
- **Database performance**: Čas dotazů
- **Error rate**: Míra chyb

### Alerting:

- **High error rate**: > 5% chyb
- **Slow responses**: > 5s response time
- **Memory usage**: > 80% využití paměti
- **Database errors**: Chyby databáze

## 🔧 Údržba

### Log rotation:

Logy se automaticky rotují denně a staré se mažou po 30 dnech.

### Database maintenance:

```sql
-- Analýza databáze
ANALYZE;

-- Vakuum
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE koulio_db;
```

### Backup verification:

```bash
# Kontrola integrity zálohy
pg_restore --list backup_file.sql.gz
```

## 🚨 Troubleshooting

### Časté problémy:

1. **Database connection failed**:
   - Zkontrolujte DATABASE_URL
   - Ověřte SSL připojení
   - Zkontrolujte firewall

2. **High memory usage**:
   - Zkontrolujte logy pro memory leaks
   - Restart aplikace
   - Zvyšte memory limit

3. **Slow performance**:
   - Zkontrolujte database indexy
   - Analyzujte pomalé query
   - Zkontrolujte rate limiting

### Logy pro debugging:

```bash
# Error logy
tail -f logs/error-$(date +%Y-%m-%d).log

# Všechny logy
tail -f logs/combined-$(date +%Y-%m-%d).log

# Real-time monitoring
docker logs -f container_name
```

## 📞 Support

Pro technickou podporu kontaktujte:
- **Email**: admin@koulio.cz
- **Logs**: Zkontrolujte logy v `logs/` adresáři
- **Health check**: `GET /health` endpoint

---

**🎯 Aplikace je připravena pro produkční nasazení s kompletním monitoring, zálohováním a bezpečnostními opatřeními!**
