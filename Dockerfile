# Simple Node.js backend with static files
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src ./src
COPY backend/start.sh ./
COPY backend/test_connection.js ./
RUN chmod +x start.sh

# Copy frontend files
COPY index.html ./
COPY koulio_complete_app.html ./
COPY login.html ./
COPY register.html ./
COPY profile.html ./
COPY src/ ./src/
COPY favicon.ico ./
COPY favicon-16x16.png ./
COPY favicon-32x32.png ./
COPY apple-touch-icon.png ./
COPY android-chrome-192x192.png ./
COPY android-chrome-256x256.png ./
COPY android-chrome-512x512.png ./
COPY maskable-icon-512x512.png ./
COPY mstile-150x150.png ./
COPY manifest.webmanifest ./
COPY site.webmanifest ./

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start Node.js server directly
CMD ["node", "src/server.js"]