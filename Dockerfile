# Multi-stage build: Node.js + Nginx
# Stage 1: Build Node.js backend
FROM node:18-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src ./src

# Stage 2: Production with Nginx + Node.js
FROM nginx:alpine

# Install Node.js
RUN apk add --no-cache nodejs npm

# Copy backend from stage 1
COPY --from=backend /app /app

# Copy frontend files to nginx
COPY index.html /usr/share/nginx/html/
COPY koulio_complete_app.html /usr/share/nginx/html/
COPY login.html /usr/share/nginx/html/
COPY register.html /usr/share/nginx/html/
COPY profile.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/
COPY favicon.ico /usr/share/nginx/html/
COPY favicon-16x16.png /usr/share/nginx/html/
COPY favicon-32x32.png /usr/share/nginx/html/
COPY apple-touch-icon.png /usr/share/nginx/html/
COPY android-chrome-192x192.png /usr/share/nginx/html/
COPY android-chrome-256x256.png /usr/share/nginx/html/
COPY android-chrome-512x512.png /usr/share/nginx/html/
COPY maskable-icon-512x512.png /usr/share/nginx/html/
COPY mstile-150x150.png /usr/share/nginx/html/
COPY manifest.webmanifest /usr/share/nginx/html/
COPY site.webmanifest /usr/share/nginx/html/

# Create nginx config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # API proxy to Node.js backend \
    location /api/ { \
        proxy_pass http://localhost:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Health check proxy \
    location /health { \
        proxy_pass http://localhost:3000/health; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Static files \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/sh \
# Start nginx in background \
nginx & \
# Start Node.js backend in foreground (so logs show in CapRover) \
cd /app && npm start' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start both services
CMD ["/start.sh"]