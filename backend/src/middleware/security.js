const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('../utils/logger');

/**
 * Konfigurace rate limitingu
 */
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.security.rateLimit(req.ip, req.url);
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.',
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

/**
 * Rate limiting pro autentifikaci - completely disabled for testing
 */
const authRateLimit = (req, res, next) => {
    // Dočasně vypnuto - žádné rate limiting
    next();
};

/**
 * Rate limiting pro registraci - completely disabled for testing
 */
const registerRateLimit = (req, res, next) => {
    // Dočasně vypnuto - žádné rate limiting
    next();
};

/**
 * Rate limiting pro API - completely disabled for testing
 */
const apiRateLimit = (req, res, next) => {
    // Dočasně vypnuto - žádné rate limiting
    next();
};

/**
 * Rate limiting pro změnu hesla - completely disabled for testing
 */
const passwordChangeRateLimit = (req, res, next) => {
    // Dočasně vypnuto - žádné rate limiting
    next();
};

/**
 * Helmet konfigurace pro bezpečnost
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Middleware pro detekci podezřelých aktivit
 */
const suspiciousActivityDetection = (req, res, next) => {
    const userAgent = req.get('User-Agent');
    const ip = req.ip;
    
    // Detekce podezřelých User-Agent
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /php/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
        logger.security.suspiciousActivity(ip, 'Suspicious User-Agent', {
            userAgent,
            url: req.url,
            method: req.method
        });
    }
    
    // Detekce SQL injection pokusů
    const sqlInjectionPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /or\s+1\s*=\s*1/i,
        /'\s*or\s*'/i
    ];
    
    const queryString = JSON.stringify(req.query);
    const bodyString = JSON.stringify(req.body);
    const urlString = req.url;
    
    const hasSqlInjection = sqlInjectionPatterns.some(pattern => 
        pattern.test(queryString) || 
        pattern.test(bodyString) || 
        pattern.test(urlString)
    );
    
    if (hasSqlInjection) {
        logger.security.suspiciousActivity(ip, 'SQL Injection attempt detected', {
            url: req.url,
            method: req.method,
            query: req.query,
            body: req.body
        });
        
        return res.status(400).json({
            success: false,
            message: 'Invalid request detected'
        });
    }
    
    next();
};

/**
 * Middleware pro validaci IP adres
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        if (allowedIPs.length === 0) {
            return next();
        }
        
        const clientIP = req.ip;
        const isAllowed = allowedIPs.includes(clientIP);
        
        if (!isAllowed) {
            logger.security.suspiciousActivity(clientIP, 'IP not in whitelist', {
                allowedIPs,
                clientIP
            });
            
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        next();
    };
};

/**
 * Middleware pro sledování neúspěšných pokusů
 */
const failedAttemptsTracker = new Map();

const trackFailedAttempts = (req, res, next) => {
    const key = `${req.ip}-${req.url}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minut
    
    if (!failedAttemptsTracker.has(key)) {
        failedAttemptsTracker.set(key, []);
    }
    
    const attempts = failedAttemptsTracker.get(key);
    
    // Vyčištění starých pokusů
    const validAttempts = attempts.filter(time => now - time < windowMs);
    failedAttemptsTracker.set(key, validAttempts);
    
    // Kontrola počtu pokusů - relaxed for testing
    if (validAttempts.length >= 50) { // zvýšeno z 10 na 50
        logger.security.suspiciousActivity(req.ip, 'Too many failed attempts', {
            url: req.url,
            attempts: validAttempts.length,
            window: '15 minutes'
        });
        
        return res.status(429).json({
            success: false,
            message: 'Too many failed attempts, please try again later.'
        });
    }
    
    // Zachytit response pro sledování neúspěšných pokusů
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400) {
            validAttempts.push(now);
            failedAttemptsTracker.set(key, validAttempts);
        }
        return originalSend.call(this, data);
    };
    
    next();
};

/**
 * Middleware pro sanitizaci vstupů
 */
const inputSanitization = (req, res, next) => {
    // Sanitizace query parametrů
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
        }
    }
    
    // Sanitizace body
    if (req.body) {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key]
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        
        sanitizeObject(req.body);
    }
    
    next();
};

module.exports = {
    helmetConfig,
    authRateLimit,
    registerRateLimit,
    apiRateLimit,
    passwordChangeRateLimit,
    suspiciousActivityDetection,
    ipWhitelist,
    trackFailedAttempts,
    inputSanitization
};
