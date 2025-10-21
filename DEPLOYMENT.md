# KOULIO Deployment Guide

## 🚀 Deployment podle cursorrules

Tento dokument popisuje, jak nasadit KOULIO aplikaci na CapRover server podle architektury definované v cursorrules.

## 📋 Předpoklady

### 1. CapRover Server
- Funkční CapRover server na `aici.cz`
- Přístup k CapRover dashboardu
- Nakonfigurovaná doména pro aplikaci

### 2. Database
- PostgreSQL databáze dostupná z CapRover serveru
- Připravené database schema
- Environment variables pro připojení k databázi

### 3. Git Repository
- Kód je verzován v Git repository
- CapRover má přístup k repository
- Nakonfigurovaný Git-based deployment

## 🔧 Konfigurace Environment Variables

V CapRover dashboardu nastavte následující environment variables:

### Database Configuration
```bash
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

### API Configuration
```bash
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-name.aici.cz
```

### Security
```bash
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
```

## 🐳 Docker Configuration

### Multi-stage Build
Aplikace používá multi-stage Docker build podle cursorrules:

1. **Stage 1**: Build Node.js API
2. **Stage 2**: Production image s Nginx + Node.js

### Process Management
- **Supervisor**: Spravuje Nginx a Node.js procesy
- **Nginx**: Reverse proxy pro frontend a API
- **Node.js**: Backend API na portu 3000

### Health Checks
- **Endpoint**: `/health`
- **Docker**: HEALTHCHECK directive
- **CapRover**: Automatické health monitoring

## 📁 File Structure

```
Project/
├── Dockerfile              # Multi-stage build
├── nginx.conf              # Nginx configuration
├── supervisord.conf        # Process management
├── captain-definition      # CapRover configuration
├── env.example            # Environment variables template
├── deploy.sh              # Linux deployment script
├── deploy.bat             # Windows deployment script
├── README.md              # Main documentation
├── DEPLOYMENT.md          # This file
├── index.html             # Frontend files
├── login.html
├── register.html
├── profile.html
├── src/
│   └── js/
│       └── api-client.js  # API communication
└── backend/               # Backend API
    ├── src/
    │   ├── app.js
    │   ├── server.js
    │   └── ...
    └── package.json
```

## 🚀 Deployment Process

### 1. Git-based Deployment
```bash
# Push changes to Git repository
git add .
git commit -m "Deploy KOULIO application"
git push origin main
```

### 2. CapRover Automatic Build
- CapRover automaticky detekuje změny v Git repository
- Spustí Docker build proces
- Nasadí aplikaci na server

### 3. Health Check
```bash
# Test health endpoint
curl https://your-app-name.aici.cz/health
```

### 4. Verify Application
```bash
# Test API endpoints
curl https://your-app-name.aici.cz/api/auth/register
curl https://your-app-name.aici.cz/api/user/profile
```

## 🔍 Monitoring a Logs

### CapRover Logs
```bash
# View application logs
caprover logs -a your-app-name -f

# View specific log files
caprover logs -a your-app-name --tail 100
```

### Health Monitoring
- **Endpoint**: `/health`
- **Response**: JSON s informacemi o stavu aplikace
- **Database**: Connection status
- **Environment**: Production/development mode

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database credentials
# Verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# Test database connectivity from CapRover server
```

#### 2. CORS Errors
```bash
# Check ALLOWED_ORIGINS environment variable
# Verify frontend domain is included
# Check nginx proxy configuration
```

#### 3. Build Failures
```bash
# Check Docker build logs
# Verify all required files are present
# Check package.json dependencies
```

#### 4. SSL Issues
```bash
# Verify domain configuration in CapRover
# Check Let's Encrypt certificate status
# Verify nginx SSL configuration
```

### Debug Commands
```bash
# Check application status
caprover status -a your-app-name

# View deployment history
caprover logs -a your-app-name --deployment

# Test API endpoints
curl -X POST https://your-app-name.aici.cz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Performance Optimization

### Nginx Configuration
- **Gzip Compression**: Enabled pro textové soubory
- **Static File Caching**: 1 rok cache pro assets
- **Security Headers**: X-Frame-Options, X-XSS-Protection
- **API Proxy**: Optimized proxy configuration

### Node.js Optimization
- **Connection Pooling**: PostgreSQL connection pool
- **Compression**: Express compression middleware
- **Rate Limiting**: API rate limiting
- **Error Handling**: Comprehensive error handling

## 🔐 Security Considerations

### Environment Variables
- **Never commit secrets**: Environment variables v CapRover
- **Secure passwords**: Strong database passwords
- **JWT secrets**: Random, secure JWT secrets

### Network Security
- **HTTPS Only**: Force HTTPS v production
- **CORS**: Restrict origins
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Validate all inputs

### Database Security
- **Connection Pooling**: Limit connections
- **Prepared Statements**: SQL injection protection
- **User Permissions**: Separate app user

## 📈 Scaling

### Horizontal Scaling
- **Multiple Instances**: CapRover podporuje scaling
- **Load Balancing**: Automatické load balancing
- **Database**: Consider read replicas

### Vertical Scaling
- **Resource Limits**: Adjust CPU/memory limits
- **Database**: Optimize database performance
- **Caching**: Implement Redis caching

## 🔄 Maintenance

### Regular Tasks
- **Database Backups**: Automated backups
- **Log Rotation**: Manage log file sizes
- **Security Updates**: Keep dependencies updated
- **Monitoring**: Check health endpoints

### Updates
- **Code Updates**: Git push → automatic deployment
- **Dependency Updates**: Update package.json
- **Security Patches**: Apply security updates
- **Database Migrations**: Run database migrations

## 📞 Support

### Documentation
- **README.md**: Main application documentation
- **API Documentation**: Swagger UI na `/api-docs`
- **Health Endpoint**: Application status

### Monitoring
- **CapRover Dashboard**: Application monitoring
- **Health Checks**: Automated health monitoring
- **Logs**: Comprehensive logging

---

**Poznámky:**
- Deployment je optimalizovaný pro CapRover s Docker
- Aplikace používá multi-stage build pro optimalizaci
- Health checks zajišťují dostupnost aplikace
- Monitoring a logging jsou integrované