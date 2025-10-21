const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Vytvoření logovacího adresáře pokud neexistuje
const logDir = path.join(__dirname, '../../logs');

// Konfigurace formátu pro logy
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Konfigurace pro různé úrovně logování
const transports = [
    // Console transport pro development
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    
    // Error logy do souboru
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat
    }),
    
    // Všechny logy do souboru
    new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
    })
];

// Vytvoření logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Speciální metody pro různé typy logování
const createLogger = () => {
    return {
        // Základní logování
        info: (message, meta = {}) => logger.info(message, meta),
        warn: (message, meta = {}) => logger.warn(message, meta),
        error: (message, meta = {}) => logger.error(message, meta),
        debug: (message, meta = {}) => logger.debug(message, meta),
        
        // Speciální logování pro API
        apiRequest: (req, res, responseTime) => {
            logger.info('API Request', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                statusCode: res.statusCode,
                responseTime: `${responseTime}ms`,
                userId: req.user?.id || 'anonymous'
            });
        },
        
        // Logování autentifikace
        auth: {
            login: (email, success, ip) => {
                logger.info('User login attempt', {
                    email,
                    success,
                    ip,
                    timestamp: new Date().toISOString()
                });
            },
            
            logout: (userId, email) => {
                logger.info('User logout', {
                    userId,
                    email,
                    timestamp: new Date().toISOString()
                });
            },
            
            register: (email, success, ip) => {
                logger.info('User registration attempt', {
                    email,
                    success,
                    ip,
                    timestamp: new Date().toISOString()
                });
            },
            
            tokenRefresh: (userId, success) => {
                logger.info('Token refresh', {
                    userId,
                    success,
                    timestamp: new Date().toISOString()
                });
            }
        },
        
        // Logování databáze
        database: {
            query: (query, params, duration) => {
                logger.debug('Database query', {
                    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
                    params: params ? params.length : 0,
                    duration: `${duration}ms`
                });
            },
            
            error: (error, query) => {
                logger.error('Database error', {
                    error: error.message,
                    query: query ? query.substring(0, 200) : 'N/A',
                    stack: error.stack
                });
            },
            
            connection: (status, details) => {
                logger.info('Database connection', {
                    status,
                    details
                });
            }
        },
        
        // Logování bezpečnostních událostí
        security: {
            rateLimit: (ip, endpoint) => {
                logger.warn('Rate limit exceeded', {
                    ip,
                    endpoint,
                    timestamp: new Date().toISOString()
                });
            },
            
            suspiciousActivity: (ip, activity, details) => {
                logger.warn('Suspicious activity detected', {
                    ip,
                    activity,
                    details,
                    timestamp: new Date().toISOString()
                });
            },
            
            invalidToken: (token, ip) => {
                logger.warn('Invalid token attempt', {
                    token: token ? token.substring(0, 20) + '...' : 'null',
                    ip,
                    timestamp: new Date().toISOString()
                });
            }
        },
        
        // Logování pro monitoring
        metrics: {
            performance: (endpoint, duration, memoryUsage) => {
                logger.info('Performance metrics', {
                    endpoint,
                    duration: `${duration}ms`,
                    memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)}MB`
                });
            },
            
            health: (status, details) => {
                logger.info('Health check', {
                    status,
                    details,
                    timestamp: new Date().toISOString()
                });
            }
        }
    };
};

module.exports = createLogger();
