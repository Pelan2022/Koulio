# Simple Node.js Backend Application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source files
COPY backend/src ./src

# Copy frontend files to serve statically
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

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]