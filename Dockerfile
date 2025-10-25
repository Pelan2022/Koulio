# Multi-stage build for Full-Stack Application

# Stage 1: Build Node.js API
FROM node:18-alpine AS api
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src ./src
COPY backend/start.sh ./
COPY backend/test_connection.js ./
RUN chmod +x start.sh

# Stage 2: Production image with Nginx + Node.js
FROM nginx:alpine

# Install Node.js and supervisor for process management
RUN apk add --no-cache nodejs npm supervisor curl

# Copy API from builder stage
COPY --from=api /app /app

# Copy frontend files
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