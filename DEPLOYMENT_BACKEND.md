# 🚀 Nasazení KOULIO s Backend API

## 📋 Přehled

KOULIO aplikace byla upgradována na profesionální autentifikační systém s:

- ✅ **Flask Backend API** s PostgreSQL databází
- ✅ **JWT token-based autentifikace**
- ✅ **bcrypt hashování hesel**
- ✅ **HTTPS zabezpečení**
- ✅ **MCP server komunikace**

## 🔧 Rychlé spuštění

### 1. Lokální vývoj
```bash
# Spuštění backend serveru
python start_backend.py

# Backend API: http://localhost:5000/api
# Frontend: otevřete index.html v prohlížeči
```

### 2. Docker deployment
```bash
# Build a spuštění
docker build -t koulio-app .
docker run -p 80:80 -p 5000:5000 koulio-app
```

## 🌐 API Endpoints

### Autentifikace
- `POST /api/register` - Registrace
- `POST /api/login` - Přihlášení
- `POST /api/refresh` - Obnovení tokenu
- `POST /api/logout` - Odhlášení

### Správa profilu
- `GET /api/profile` - Získání profilu
- `PUT /api/profile` - Aktualizace profilu
- `POST /api/change-password` - Změna hesla
- `DELETE /api/delete-account` - Smazání účtu

### Utility
- `GET /api/health` - Health check

## 🔐 Bezpečnostní funkce

### Hesla
- **bcrypt** hashování s automatickým salt
- Minimální délka 6 znaků
- Ověření současného hesla při změně

### Tokeny
- **JWT** access tokeny (24 hodin)
- **JWT** refresh tokeny (30 dní)
- Automatické obnovení při vypršení

### Databáze
- **UUID** primární klíče
- **Unique** indexy na email
- **Soft delete** (is_active flag)
- **MCP server** komunikace

## 📊 Databázové schéma

```sql
users table:
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- full_name: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP
- is_active: BOOLEAN
```

## 🧪 Testování

### Demo účet (stále funkční)
- **Email:** `demo@koulio.cz`
- **Heslo:** `demo123`

### API testování
```bash
# Health check
curl http://localhost:5000/api/health

# Registrace
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'
```

## 🔄 Migrace z localStorage

### Před
```javascript
// localStorage
localStorage.setItem('koulio_users', JSON.stringify(users));
```

### Po
```javascript
// API
await koulioAPI.register(email, password, fullName);
```

## 🚀 Nasazení na unrollit.aici.cz

### 1. Příprava souborů
Všechny potřebné soubory jsou připraveny:
- `app.py` - Backend API
- `api-client.js` - Frontend API client
- `requirements.txt` - Python závislosti
- `Dockerfile` - Docker konfigurace
- Aktualizované HTML soubory

### 2. CapRover deployment
```bash
# Použijte deploy skript
./deploy.sh koulio captain.yourdomain.com

# Nebo manuálně nahrajte tar archiv
```

### 3. Environment variables
```bash
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret-key
```

## 📝 Nové funkce

### Backend API
- Kompletní REST API
- JWT autentifikace
- bcrypt hashování hesel
- PostgreSQL databáze
- Error handling
- CORS podpora

### Frontend
- API client pro komunikaci
- Automatické obnovení tokenů
- Fallback na demo účet
- Vylepšená error handling

### Bezpečnost
- Hashované hesla
- Token-based autentifikace
- HTTPS podpora
- CORS konfigurace
- Input validace

## 🎯 Výsledek

**KOULIO aplikace je nyní připravena pro produkční nasazení s:**

- ✅ Profesionální backend API
- ✅ Bezpečné hashování hesel
- ✅ JWT token autentifikace
- ✅ PostgreSQL databáze
- ✅ HTTPS zabezpečení
- ✅ Scalabilní architektura

**Systém je připraven k nasazení na unrollit.aici.cz!** 🚀
