const https = require('https');
const fs = require('fs');
const path = require('path');

// Try to require modules with error handling
let app, database, logger;

try {
    app = require('./app');
    database = require('./config/database');
    logger = require('./utils/logger');
} catch (error) {
    console.error('Failed to load modules:', error.message);
    process.exit(1);
}

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';

// Log startup information
console.log('=== KOULIO Backend Startup ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('HOST:', HOST);
console.log('HTTPS_ENABLED:', HTTPS_ENABLED);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('===============================');

async function startServer() {
    try {
        // Connect to database (optional for health checks)
        logger.info('Connecting to database...');
        try {
            await database.connect();
        } catch (dbError) {
            logger.warn('Database connection failed, but continuing without database:', dbError.message);
        }
        
        let server;
        
        if (HTTPS_ENABLED && process.env.NODE_ENV === 'production') {
            // HTTPS configuration for production
            const sslOptions = {
                key: fs.readFileSync(process.env.SSL_KEY_PATH || './certs/key.pem'),
                cert: fs.readFileSync(process.env.SSL_CERT_PATH || './certs/cert.pem')
            };
            
            server = https.createServer(sslOptions, app);
            logger.info('HTTPS server configured');
        } else {
            // HTTP server for development
            const http = require('http');
            server = http.createServer(app);
            logger.info('HTTP server configured');
        }

        // Start server
        server.listen(PORT, HOST, () => {
            logger.info(`🚀 KOULIO Backend API server started`);
            logger.info(`📡 Server running on ${HTTPS_ENABLED ? 'https' : 'http'}://${HOST}:${PORT}`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🗄️  Database: ${database.isConnected() ? 'Connected' : 'Disconnected'}`);
            logger.info(`🔐 Security: ${HTTPS_ENABLED ? 'HTTPS Enabled' : 'HTTP Only'}`);
            
            console.log('\n' + '='.repeat(50));
            console.log('🎯 KOULIO Backend API');
            console.log('='.repeat(50));
            console.log(`🌐 Server: ${HTTPS_ENABLED ? 'https' : 'http'}://${HOST}:${PORT}`);
            console.log(`📊 Health: ${HTTPS_ENABLED ? 'https' : 'http'}://${HOST}:${PORT}/health`);
            console.log(`📚 API Docs: ${HTTPS_ENABLED ? 'https' : 'http'}://${HOST}:${PORT}/api`);
            console.log('='.repeat(50));
        });

        // Handle server errors
        server.on('error', (error) => {
            logger.error('Server error:', error);
            
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use`);
                process.exit(1);
            } else {
                throw error;
            }
        });

        // Graceful shutdown
        server.on('close', () => {
            logger.info('Server closed');
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();
