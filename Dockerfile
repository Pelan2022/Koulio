# Multi-stage build pro frontend i backend
# Stage 1: Frontend (nginx)
FROM nginx:alpine as frontend

# Zkopíruj všechny HTML soubory do nginx html složky
COPY koulio_complete_app.html /usr/share/nginx/html/koulio_complete_app.html
COPY login.html /usr/share/nginx/html/login.html
COPY register.html /usr/share/nginx/html/register.html
COPY profile.html /usr/share/nginx/html/profile.html
COPY index.html /usr/share/nginx/html/index.html
COPY api-client.js /usr/share/nginx/html/api-client.js

# Zkopíruj obrázky pokud existují
COPY vanocni_koule.jpg /usr/share/nginx/html/vanocni_koule.jpg

# Zkopíruj favicon soubory
COPY favicon.ico /usr/share/nginx/html/favicon.ico
COPY favicon-16x16.png /usr/share/nginx/html/favicon-16x16.png
COPY favicon-32x32.png /usr/share/nginx/html/favicon-32x32.png
COPY apple-touch-icon.png /usr/share/nginx/html/apple-touch-icon.png
COPY android-chrome-192x192.png /usr/share/nginx/html/android-chrome-192x192.png
COPY android-chrome-256x256.png /usr/share/nginx/html/android-chrome-256x256.png
COPY android-chrome-512x512.png /usr/share/nginx/html/android-chrome-512x512.png
COPY maskable-icon-512x512.png /usr/share/nginx/html/maskable-icon-512x512.png
COPY mstile-150x150.png /usr/share/nginx/html/mstile-150x150.png

# Zkopíruj manifest soubory
COPY manifest.webmanifest /usr/share/nginx/html/manifest.webmanifest
COPY site.webmanifest /usr/share/nginx/html/site.webmanifest

# Stage 2: Backend (Python)
FROM python:3.11-slim as backend

WORKDIR /app

# Instalace systémových závislostí
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Kopírování requirements a instalace Python závislostí
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopírování aplikace
COPY app.py .

# Vytvoření uživatele pro bezpečnost
RUN useradd -m -u 1000 koulio && chown -R koulio:koulio /app
USER koulio

# Exponování portu
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Spuštění aplikace
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]

# Stage 3: Final image s nginx a backend
FROM nginx:alpine

# Kopírování frontend souborů z frontend stage
COPY --from=frontend /usr/share/nginx/html /usr/share/nginx/html

# Instalace Python a závislostí pro backend
RUN apk add --no-cache python3 py3-pip gcc musl-dev libffi-dev libpq-dev

# Kopírování backend souborů a závislostí z backend stage
COPY --from=backend /app /app
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
WORKDIR /app

# Vytvoření uživatele pro bezpečnost
RUN adduser -D -u 1000 koulio && chown -R koulio:koulio /app

# Vytvoř nginx konfiguraci pro SPA s backend API
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Povol gzip kompresi \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Cache pro statické soubory \
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webmanifest)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Backend API proxy \
    location /api { \
        proxy_pass http://localhost:5000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_connect_timeout 30s; \
        proxy_send_timeout 30s; \
        proxy_read_timeout 30s; \
    } \
    \
    # Specifické routy pro autentifikaci \
    location /login { \
        try_files /login.html =404; \
    } \
    \
    location /register { \
        try_files /register.html =404; \
    } \
    \
    location /profile { \
        try_files /profile.html =404; \
    } \
    \
    location /app { \
        try_files /koulio_complete_app.html =404; \
    } \
    \
    # Fallback pro SPA routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Vytvoření startovacího skriptu
RUN echo '#!/bin/sh \
# Spuštění backend API na pozadí \
cd /app && PYTHONPATH=/usr/local/lib/python3.11/site-packages python3 app.py & \
# Spuštění nginx na popředí \
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

# Exponování portů
EXPOSE 80 5000

# Spuštění obou služeb
CMD ["/start.sh"]
