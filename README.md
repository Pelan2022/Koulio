# KOULIO - Full-Stack Web Application

## 🏗️ Architektura projektu

KOULIO je full-stack webová aplikace postavená podle moderních best practices s následující architekturou:

- **Frontend**: Vanilla HTML/CSS/JS s moderním designem
- **Backend**: Node.js/Express API připojený k PostgreSQL
- **Deployment**: Docker + CapRover + Nginx
- **Database**: PostgreSQL s JSONB pro flexibilní data
- **Source Control**: Git repository pro verzování kódu

## 🛠️ Technologie

### Frontend
- **HTML5**: Semantic markup, modern features
- **CSS**: Custom CSS s moderním designem
- **JavaScript**: Vanilla JS s API komunikací
- **Icons**: Favicon a PWA manifest

### Backend
- **Node.js**: >=18.0.0 (ES modules)
- **Express**: Web framework
- **PostgreSQL**: Externí databáze s pg driver
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variables

### Deployment
- **Docker**: Multi-stage build (Node.js + Nginx Alpine)
- **CapRover**: Container orchestration
- **Nginx**: Reverse proxy a static file serving
- **Supervisor**: Process management

## 🚀 Deployment Architecture

### Git-based Deployment
1. **Source Control**: Kód je verzován v Git repository
2. **Deployment Process**: Git push → CapRover automatický build
3. **Hosting**: CapRover na hostovaném serveru
4. **Build Process**: Docker multi-stage build
5. **Runtime**: Nginx + Node.js via Supervisor
6. **Health Checks**: `/health` endpoint
7. **SSL**: Let's Encrypt automaticky
8. **Scaling**: Horizontal scaling podporováno

### Docker Configuration
```dockerfile
# Multi-stage build for Full-Stack Application

# Stage 1: Build Node.js API
FROM node:18-alpine AS api
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./
COPY env.example ./.env

# Stage 2: Production image with Nginx + Node.js
FROM nginx:alpine

# Install Node.js and supervisor for process management
RUN apk add --no-cache nodejs npm supervisor curl

# Copy API from builder stage
COPY --from=api /app /app

# Copy frontend files
COPY index.html /usr/share/nginx/html/
COPY api-client.js /usr/share/nginx/html/
COPY favicon.ico /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisord.conf

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl --fail http://localhost/health || exit 1

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
```

## 🔧 Environment Variables

```bash
# Database
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# API
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com

# Security
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
```

**Poznámka**: Environment variables se nastavují přímo v CapRover dashboardu.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení uživatele
- `POST /api/auth/logout` - Odhlášení uživatele
- `GET /api/auth/verify` - Ověření tokenu

### User Management
- `GET /api/user/profile` - Získání profilu uživatele
- `PUT /api/user/profile` - Aktualizace profilu
- `DELETE /api/user/account` - Smazání účtu

### Health Check
- `GET /health` - Kontrola zdraví aplikace

## 🔐 Security Features

### Security Headers
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **CORS**: Configurable origins

### Authentication
- **JWT**: JSON Web Tokens pro autentifikaci
- **Password Hashing**: bcrypt pro bezpečné ukládání hesel
- **Rate Limiting**: Omezení počtu požadavků
- **Input Validation**: Validace vstupních dat

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection**: Check DB_HOST, DB_PORT, credentials
2. **CORS Issues**: Verify ALLOWED_ORIGINS setting
3. **Build Failures**: Check Docker build logs
4. **SSL Issues**: Verify domain configuration v CapRover

### Debug Commands
```bash
# Check CapRover logs
caprover logs -a your_app_name -f

# Test API endpoints
curl https://your_app_name.aici.cz/health
curl https://your_app_name.aici.cz/api/auth/register
```

## 📝 Development Workflow

### Git-based Deployment Process
1. **Code Changes**: Commit a push do Git repository
2. **Automatic Build**: CapRover automaticky buildí z Git
3. **Deployment**: CapRover deployuje na hostovaný server
4. **Health Check**: Verify `/health` endpoint
5. **SSL**: Automatic Let's Encrypt
6. **Monitoring**: Check logs a metrics

## 🎯 Best Practices

### Code Organization
- **Separation of Concerns**: Frontend/Backend/Database
- **Error Handling**: Consistent error responses
- **Logging**: Comprehensive logging
- **Documentation**: Clear comments a README files

### Performance
- **Gzip Compression**: Nginx gzip enabled
- **Browser Caching**: 1 year cache pro static assets
- **Database Indexes**: Optimized queries
- **Connection Pooling**: Efficient database connections

### Security
- **Environment Variables**: Never commit secrets
- **CORS**: Restrict origins v production
- **SQL Injection**: Use prepared statements
- **HTTPS**: Force HTTPS v production

## 📋 Customization Checklist

Při použití této šablony pro nový projekt:

### 1. Název a popis
- [ ] Změňte název aplikace v dokumentaci
- [ ] Upravte popis funkcionalit
- [ ] Aktualizujte README.md

### 2. Database Schema
- [ ] Definujte specifické tabulky pro vaši aplikaci
- [ ] Vytvořte indexy pro vaše query patterns
- [ ] Nastavte views pro často používané dotazy

### 3. API Endpoints
- [ ] Definujte RESTful endpoints pro vaše entity
- [ ] Implementujte CRUD operace
- [ ] Nastavte error handling

### 4. Frontend
- [ ] Upravte HTML strukturu pro vaše potřeby
- [ ] Implementujte JavaScript funkcionality
- [ ] Nastavte CSS framework dle potřeby

### 5. Environment Variables
- [ ] Nastavte environment variables v CapRover dashboardu
- [ ] Aktualizujte env.example jako template
- [ ] Konfigurujte CORS origins

### 6. Deployment
- [ ] Upravte Dockerfile pro specifické potřeby
- [ ] Nastavte nginx.conf
- [ ] Konfigurujte CapRover settings
- [ ] Nastavte Git → CapRover deployment

---

**Poznámky:**
- Tato šablona je navržena pro full-stack webové aplikace
- Frontend je standalone HTML soubor s API komunikací
- Backend je lightweight Express API
- Deployment je optimalizovaný pro CapRover s Docker
- Database schema je navržena pro flexibilní data storage
