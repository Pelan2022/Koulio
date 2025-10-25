# Unroll - Deployment Architecture

## 🏗️ Architektura aplikace

### **Komponenty:**
1. **Frontend (Nginx)** - Port 80/443
2. **Backend API (Node.js)** - Port 3000
3. **PostgreSQL Database** - Port 5432

### **Routing:**
- **Frontend:** `https://unrollit.aici.cz/` → Nginx (statické soubory)
- **API:** `https://unrollit.aici.cz/api/*` → Nginx proxy → Backend (port 3000)
- **Health:** `https://unrollit.aici.cz/health` → Nginx proxy → Backend

## 🐳 Docker Deployment

### **1. Spuštění celé aplikace:**
```bash
# Klonování a příprava
git clone <repository>
cd Unroll

# Nastavení environment proměnných
cp .env.example .env
# Upravte .env soubor s vašimi hodnotami

# Spuštění všech služeb
docker-compose up -d

# Kontrola stavu
docker-compose ps
```

### **2. Environment proměnné (.env):**
```bash
# Database Configuration
DB_PASSWORD=your_secure_password_here

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_at_least_32_characters

# CORS Configuration
CORS_ORIGIN=http://localhost,https://unrollit.aici.cz

# Production Configuration
NODE_ENV=production
```

## 🌐 Nginx Proxy Configuration

### **API Routing:**
```nginx
# API proxy - routuje /api/* požadavky na backend
location /api/ {
    proxy_pass http://unroll-backend:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### **Health Check:**
```nginx
# Health check proxy
location /health {
    proxy_pass http://unroll-backend:3000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🔧 API Client Configuration

### **Automatická detekce URL:**
```javascript
// Lokální vývoj
localhost → http://localhost:3000

// Produkce
unrollit.aici.cz → https://unrollit.aici.cz/api
```

### **Fallback mechanismus:**
- HTTPS → HTTP fallback při SSL problémech
- Automatická detekce prostředí
- Robustní error handling

## 📊 Monitoring

### **Health Checks:**
- **Frontend:** `https://unrollit.aici.cz/`
- **Backend:** `https://unrollit.aici.cz/health`
- **Database:** Interní připojení

### **Logy:**
```bash
# Backend logy
docker-compose logs unroll-backend

# Frontend logy  
docker-compose logs unroll-frontend

# Database logy
docker-compose logs postgres
```

## 🚀 Production Deployment

### **1. Příprava serveru:**
```bash
# Instalace Docker a Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalace Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **2. Nasazení aplikace:**
```bash
# Klonování repository
git clone <repository>
cd Unroll

# Nastavení environment proměnných
cp .env.example .env
nano .env  # Upravte hodnoty

# Spuštění aplikace
docker-compose up -d

# Kontrola stavu
docker-compose ps
curl https://unrollit.aici.cz/health
```

### **3. SSL Certifikáty:**
```bash
# Let's Encrypt certifikáty
sudo apt install certbot
sudo certbot certonly --standalone -d unrollit.aici.cz

# Aktualizace nginx konfigurace pro HTTPS
# (bude přidáno do nginx konfigurace)
```

## 🔒 Bezpečnost

### **Firewall:**
```bash
# Povolení pouze potřebných portů
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### **Database:**
- SSL připojení povinné
- Silná hesla
- Pravidelné zálohy

### **API:**
- JWT autentifikace
- Rate limiting
- CORS ochrana
- Input sanitization

## 📈 Škálování

### **Horizontal scaling:**
```yaml
# docker-compose.yml
services:
  unroll-backend:
    deploy:
      replicas: 3
      
  unroll-frontend:
    deploy:
      replicas: 2
```

### **Load balancing:**
- Nginx upstream konfigurace
- Health checks
- Session affinity

## 🛠️ Údržba

### **Backup:**
```bash
# Database backup
docker-compose exec postgres pg_dump -U unroll_user unroll_db > backup.sql

# Automatické zálohování
docker-compose exec unroll-backend npm run backup
```

### **Updates:**
```bash
# Aktualizace aplikace
git pull
docker-compose build
docker-compose up -d

# Rollback
git checkout <previous-commit>
docker-compose up -d
```

## 🎯 Výsledek

**Kompletní produkční architektura s:**
- ✅ **Nginx proxy** pro API routing
- ✅ **Správné URL** (stejná doména, různé porty)
- ✅ **Docker orchestration** (docker-compose)
- ✅ **SSL podpora** (Let's Encrypt)
- ✅ **Monitoring** (health checks, logy)
- ✅ **Škálovatelnost** (horizontal scaling)
- ✅ **Bezpečnost** (firewall, SSL, JWT)
