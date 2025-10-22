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
 * Rate limiting pro autentifikaci
 * Max 5 pokusů za 15 minut
 */
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minut
    5, // max 5 pokusů
    'Too many login attempts, please try again later.'
);

/**
 * Rate limiting pro registraci
 * Max 3 registrace za hodinu z jedné IP
 */
const registerRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hodina
    3, // max 3 registrace
    'Too many registration attempts, please try again later.'
);

/**
 * Rate limiting pro API
 * Max 100 požadavků za 15 minut
 */
const apiRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minut
    100, // max 100 požadavků
    'Too many API requests, please try again later.'
);

/**
 * Rate limiting pro změnu hesla
 * Max 3 pokusy za hodinu
 */
const passwordChangeRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hodina
    3, // max 3 pokusy
    'Too many password change attempts, please try again later.'
);

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
 * Sanitize string to prevent XSS attacks
 * NOTE: For production, consider using a library like DOMPurify or xss
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;

    return str
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove object tags
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        // Remove embed tags
        .replace(/<embed\b[^<]*>/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol for images (can be used for XSS)
        .replace(/data:text\/html/gi, '')
        // Remove event handlers (onclick, onerror, onload, etc.)
        .replace(/on\w+\s*=/gi, '')
        // Remove vbscript: protocol
        .replace(/vbscript:/gi, '')
        // Remove style tags that could contain expressions
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove expression() from CSS
        .replace(/expression\s*\(/gi, '')
        // Remove import statements
        .replace(/@import/gi, '')
        // Remove meta refresh
        .replace(/<meta\b[^>]*http-equiv\s*=\s*["\']?refresh["\']?[^>]*>/gi, '')
        // Remove base tag
        .replace(/<base\b[^>]*>/gi, '')
        // Remove link tags with suspicious rel
        .replace(/<link\b[^>]*rel\s*=\s*["\']?(stylesheet|import)["\']?[^>]*>/gi, '');
};

/**
 * Middleware pro sanitizaci vstupů
 * NOTE: This provides basic XSS protection. For production use, consider:
 * - npm install xss (https://www.npmjs.com/package/xss)
 * - npm install isomorphic-dompurify (https://www.npmjs.com/package/isomorphic-dompurify)
 */
const inputSanitization = (req, res, next) => {
    // Sanitizace query parametrů
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }

    // Sanitizace body
    if (req.body) {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
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
