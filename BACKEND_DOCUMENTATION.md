# 🚀 KOULIO Backend API - Dokumentace

## 📋 Přehled

KOULIO aplikace byla upgradována na profesionální autentifikační systém s následujícími funkcemi:

- ✅ **Backend API** s Flask
- ✅ **Databáze** PostgreSQL přes MCP server
- ✅ **Hashování hesel** pomocí bcrypt
- ✅ **Token-based autentifikace** s JWT
- ✅ **HTTPS zabezpečení** pro produkci

## 🏗️ Architektura

### Frontend
- HTML/CSS/JavaScript aplikace
- API client pro komunikaci s backendem
- Fallback na localStorage pro demo účet

### Backend
- **Flask** web framework
- **PostgreSQL** databáze přes MCP server
- **JWT** tokeny pro autentifikaci
- **bcrypt** pro hashování hesel
- **CORS** podpora pro frontend

### Databáze
- **PostgreSQL** s tabulkou `users`
- **UUID** primární klíče
- **Timestamp** sloupce pro audit
- **Indexy** pro optimalizaci

## 🔧 Instalace a spuštění

### Lokální vývoj

1. **Instalace závislostí:**
```bash
pip install -r requirements.txt
```

2. **Spuštění backend serveru:**
```bash
python start_backend.py
```

3. **Otevření aplikace:**
- Frontend: `http://localhost:3000` nebo `https://unrollit.aici.cz`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

### Docker deployment

```bash
# Build image
docker build -t koulio-app .

# Spuštění kontejneru
docker run -p 80:80 -p 5000:5000 koulio-app
```

## 📡 API Endpoints

### Autentifikace

#### `POST /api/register`
Registrace nového uživatele
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Jan Novák"
}
```

#### `POST /api/login`
Přihlášení uživatele
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### `POST /api/refresh`
Obnovení access tokenu
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### `POST /api/logout`
Odhlášení uživatele (vyžaduje Authorization header)

### Správa profilu

#### `GET /api/profile`
Získání profilu uživatele (vyžaduje Authorization header)

#### `PUT /api/profile`
Aktualizace profilu (vyžaduje Authorization header)
```json
{
  "full_name": "Jan Nový",
  "email": "newemail@example.com"
}
```

#### `POST /api/change-password`
Změna hesla (vyžaduje Authorization header)
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

#### `DELETE /api/delete-account`
Smazání účtu (vyžaduje Authorization header)
```json
{
  "password": "currentpassword"
}
```

### Utility

#### `GET /api/health`
Health check endpoint

## 🔐 Bezpečnost

### Hesla
- **bcrypt** hashování s salt
- Minimální délka 6 znaků
- Kontrola současného hesla při změně

### Tokeny
- **JWT** access tokeny (24 hodin)
- **JWT** refresh tokeny (30 dní)
- Automatické obnovení tokenů

### Databáze
- **UUID** primární klíče
- **Unique** indexy na email
- **Soft delete** (is_active flag)

### CORS
- Povolené domény: `localhost:3000`, `unrollit.aici.cz`
- Podpora preflight requestů

## 📊 Databázové schéma

### Tabulka `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Indexy
- `idx_users_email` - index na email
- `users_email_key` - unique constraint na email
- `users_pkey` - primární klíč

## 🔄 Migrace z localStorage

### Před (localStorage)
```javascript
// Uložení uživatele
localStorage.setItem('koulio_users', JSON.stringify(users));

// Kontrola přihlášení
const isLoggedIn = localStorage.getItem('koulio_logged_in');
```

### Po (API)
```javascript
// Registrace přes API
const response = await koulioAPI.register(email, password, fullName);

// Přihlášení přes API
const response = await koulioAPI.login(email, password);

// Kontrola přihlášení
const isLoggedIn = koulioAPI.isLoggedIn();
```

## 🧪 Testování

### API Client testování
```javascript
// Test registrace
const api = new KoulioAPI();
const user = await api.register('test@example.com', 'password123', 'Test User');

// Test přihlášení
const login = await api.login('test@example.com', 'password123');

// Test profilu
const profile = await api.getProfile();
```

### Health check
```bash
curl http://localhost:5000/api/health
```

## 🚀 Produkční nasazení

### Environment variables
```bash
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret-key
PORT=5000
```

### HTTPS konfigurace
- Nginx proxy s SSL certifikáty
- Let's Encrypt automatické certifikáty
- Force HTTPS redirect

### Monitoring
- Health check endpointy
- Logování všech API volání
- Error tracking

## 📝 Changelog

### v2.0.0 - Backend API Integration
- ✅ Přidán Flask backend API
- ✅ Integrace s PostgreSQL databází
- ✅ JWT token-based autentifikace
- ✅ bcrypt hashování hesel
- ✅ API client pro frontend
- ✅ Fallback na localStorage pro demo účet

### v1.0.0 - localStorage Implementation
- ✅ Základní autentifikace s localStorage
- ✅ Demo účet pro testování
- ✅ Správa uživatelských účtů

## 🎯 Další kroky

### Plánované funkce
- [ ] Reset hesla přes email
- [ ] Email verifikace
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Audit logging
- [ ] User roles a permissions

### Optimalizace
- [ ] Database connection pooling
- [ ] Redis cache pro session
- [ ] API response caching
- [ ] Database query optimization

---

**KOULIO Backend API je nyní připraveno pro produkční použití s plnou bezpečnostní podporou!** 🚀
