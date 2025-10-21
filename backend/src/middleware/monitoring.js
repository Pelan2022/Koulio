const logger = require('../utils/logger');

/**
 * Middleware pro monitoring výkonu
 */
const performanceMonitoring = (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    // Zachytit původní end metodu
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const responseTime = endTime - startTime;
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        // Logování výkonu
        logger.metrics.performance(req.url, responseTime, endMemory.heapUsed);
        
        // Logování API requestu
        logger.apiRequest(req, res, responseTime);
        
        // Upozornění na pomalé requesty
        if (responseTime > 5000) {
            logger.warn('Slow request detected', {
                url: req.url,
                method: req.method,
                responseTime: `${responseTime}ms`,
                memoryDelta: `${Math.round(memoryDelta / 1024)}KB`
            });
        }
        
        // Upozornění na vysoké využití paměti
        if (memoryDelta > 10 * 1024 * 1024) { // 10MB
            logger.warn('High memory usage detected', {
                url: req.url,
                method: req.method,
                memoryDelta: `${Math.round(memoryDelta / 1024 / 1024)}MB`
            });
        }
        
        // Volání původní end metody
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

/**
 * Middleware pro sledování chyb
 */
const errorMonitoring = (err, req, res, next) => {
    // Logování chyby
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
    });
    
    // Bezpečnostní logování pro podezřelé aktivity
    if (err.status === 401 || err.status === 403) {
        logger.security.suspiciousActivity(req.ip, 'Unauthorized access attempt', {
            url: req.url,
            method: req.method,
            error: err.message
        });
    }
    
    next(err);
};

/**
 * Middleware pro sledování rate limitingu
 */
const rateLimitMonitoring = (req, res, next) => {
    // Zachytit rate limit headers
    const rateLimitRemaining = res.get('X-RateLimit-Remaining');
    const rateLimitReset = res.get('X-RateLimit-Reset');
    
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
        logger.warn('Rate limit warning', {
            ip: req.ip,
            endpoint: req.url,
            remaining: rateLimitRemaining,
            reset: rateLimitReset
        });
    }
    
    next();
};

/**
 * Middleware pro sledování databázových operací
 */
const databaseMonitoring = (req, res, next) => {
    // Zachytit původní query metodu
    const database = require('../config/database');
    const originalQuery = database.query;
    
    database.query = function(text, params) {
        const startTime = Date.now();
        
        return originalQuery.call(this, text, params)
            .then(result => {
                const duration = Date.now() - startTime;
                logger.database.query(text, params, duration);
                return result;
            })
            .catch(error => {
                const duration = Date.now() - startTime;
                logger.database.error(error, text);
                throw error;
            });
    };
    
    next();
};

module.exports = {
    performanceMonitoring,
    errorMonitoring,
    rateLimitMonitoring,
    databaseMonitoring
};
