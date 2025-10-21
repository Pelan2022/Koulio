const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Middleware pro audit logging
 */

/**
 * Middleware pro logování uživatelských akcí
 * @param {string} action - Název akce
 * @param {string} resourceType - Typ zdroje
 * @returns {Function} Express middleware
 */
const auditLog = (action, resourceType = null) => {
    return async (req, res, next) => {
        // Zachytit původní send metodu
        const originalSend = res.send;
        const originalJson = res.json;

        let responseBody = null;

        // Override send metodu pro zachycení response
        res.send = function(data) {
            responseBody = data;
            return originalSend.call(this, data);
        };

        res.json = function(data) {
            responseBody = data;
            return originalJson.call(this, data);
        };

        res.on('finish', async () => {
            try {
                // Logovat pouze úspěšné akce (2xx status codes)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const userId = req.user ? req.user.id : null;
                    const resourceId = req.params.id || req.params.userId || null;
                    
                    // Připravit detaily
                    const details = {
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode,
                        timestamp: new Date().toISOString()
                    };

                    // Přidat relevantní data z requestu
                    if (req.body && Object.keys(req.body).length > 0) {
                        // Vyfiltrovat citlivé údaje
                        const sanitizedBody = { ...req.body };
                        delete sanitizedBody.password;
                        delete sanitizedBody.passwordHash;
                        delete sanitizedBody.refreshToken;
                        details.requestBody = sanitizedBody;
                    }

                    // Přidat response data pro některé akce
                    if (responseBody && typeof responseBody === 'object') {
                        const sanitizedResponse = { ...responseBody };
                        delete sanitizedResponse.token;
                        delete sanitizedResponse.refreshToken;
                        details.responseData = sanitizedResponse;
                    }

                    // Vytvořit audit log
                    await AuditLog.create({
                        userId,
                        action,
                        resourceType,
                        resourceId,
                        details,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    });

                    logger.info('Audit log created', {
                        userId,
                        action,
                        resourceType,
                        resourceId,
                        ipAddress: req.ip
                    });
                }
            } catch (error) {
                logger.error('Error creating audit log', {
                    error: error.message,
                    stack: error.stack,
                    action,
                    resourceType,
                    userId: req.user?.id
                });
            }
        });

        next();
    };
};

/**
 * Middleware pro logování přihlášení
 */
const auditLogin = auditLog('LOGIN', 'user');

/**
 * Middleware pro logování odhlášení
 */
const auditLogout = auditLog('LOGOUT', 'user');

/**
 * Middleware pro logování registrace
 */
const auditRegister = auditLog('REGISTER', 'user');

/**
 * Middleware pro logování změny profilu
 */
const auditProfileUpdate = auditLog('PROFILE_UPDATE', 'user');

/**
 * Middleware pro logování změny hesla
 */
const auditPasswordChange = auditLog('PASSWORD_CHANGE', 'user');

/**
 * Middleware pro logování smazání účtu
 */
const auditAccountDelete = auditLog('ACCOUNT_DELETE', 'user');

/**
 * Middleware pro logování exportu dat
 */
const auditDataExport = auditLog('DATA_EXPORT', 'user');

/**
 * Middleware pro logování admin akcí
 */
const auditAdminAction = (action) => auditLog(`ADMIN_${action}`, 'admin');

/**
 * Middleware pro logování refresh tokenu
 */
const auditTokenRefresh = auditLog('TOKEN_REFRESH', 'user');

/**
 * Middleware pro logování neúspěšných pokusů
 */
const auditFailedAttempt = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const details = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString(),
            error: res.statusCode >= 400 ? 'Failed attempt' : null
        };

        await AuditLog.create({
            userId,
            action: 'FAILED_ATTEMPT',
            resourceType: 'user',
            resourceId: null,
            details,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        logger.warn('Failed attempt logged', {
            userId,
            ipAddress: req.ip,
            url: req.url,
            method: req.method,
            statusCode: res.statusCode
        });
    } catch (error) {
        logger.error('Error logging failed attempt', {
            error: error.message
        });
    }

    next();
};

/**
 * Middleware pro logování podezřelých aktivit
 */
const auditSuspiciousActivity = async (req, res, next) => {
    try {
        const details = {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            reason: 'Suspicious activity detected'
        };

        await AuditLog.create({
            userId: null,
            action: 'SUSPICIOUS_ACTIVITY',
            resourceType: 'security',
            resourceId: null,
            details,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        logger.warn('Suspicious activity logged', {
            ipAddress: req.ip,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent')
        });
    } catch (error) {
        logger.error('Error logging suspicious activity', {
            error: error.message
        });
    }

    next();
};

module.exports = {
    auditLog,
    auditLogin,
    auditLogout,
    auditRegister,
    auditProfileUpdate,
    auditPasswordChange,
    auditAccountDelete,
    auditDataExport,
    auditAdminAction,
    auditTokenRefresh,
    auditFailedAttempt,
    auditSuspiciousActivity
};
