const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const logger = require('./utils/logger');
const database = require('./config/database');

// Import security middleware
const {
    helmetConfig,
    authRateLimit,
    registerRateLimit,
    apiRateLimit,
    passwordChangeRateLimit,
    suspiciousActivityDetection,
    trackFailedAttempts,
    inputSanitization
} = require('./middleware/security');

// Import monitoring middleware
const {
    performanceMonitoring,
    errorMonitoring,
    rateLimitMonitoring,
    databaseMonitoring
} = require('./middleware/monitoring');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

// Import Swagger
const { specs, swaggerUi, swaggerOptions } = require('./config/swagger');

const app = express();

// Trust proxy (important for CapRover deployment)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);

// Monitoring middleware
app.use(performanceMonitoring);
app.use(databaseMonitoring);
app.use(rateLimitMonitoring);
app.use(suspiciousActivityDetection);
app.use(trackFailedAttempts);
app.use(inputSanitization);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
} else {
    app.use(morgan('dev'));
}

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Global rate limiting
app.use('/api/', globalLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// Serve static files from frontend
app.use(express.static(__dirname + '/../../'));

// Swagger API documentation
if (process.env.API_DOCS_ENABLED !== 'false') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
}

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'KOULIO Backend API',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new user',
                'POST /api/auth/login': 'Login user',
                'POST /api/auth/refresh': 'Refresh access token',
                'POST /api/auth/logout': 'Logout user',
                'GET /api/auth/profile': 'Get user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'POST /api/auth/change-password': 'Change password',
                'DELETE /api/auth/account': 'Delete account',
                'GET /api/auth/verify': 'Verify token'
            },
            user: {
                'GET /api/user/profile': 'Get user profile',
                'PUT /api/user/profile': 'Update user profile',
                'DELETE /api/user/account': 'Delete user account',
                'GET /api/user/stats': 'Get user statistics',
                'GET /api/user/export': 'Export user data'
            },
            health: {
                'GET /health': 'Health check'
            }
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Error monitoring middleware
app.use(errorMonitoring);

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors
        });
    }

    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized access'
        });
    }

    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation'
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 
            'Internal server error' : 
            error.message
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    try {
        await database.disconnect();
        logger.info('Database disconnected');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    
    try {
        await database.disconnect();
        logger.info('Database disconnected');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

module.exports = app;
