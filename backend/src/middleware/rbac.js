const logger = require('../utils/logger');

/**
 * Role-based Access Control middleware
 */

/**
 * Middleware pro kontrolu role uživatele
 * @param {string|string[]} allowedRoles - Povolené role
 * @returns {Function} Express middleware
 */
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Kontrola zda je uživatel přihlášen
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userRole = req.user.role;
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Kontrola zda má uživatel povolenou roli
            if (!roles.includes(userRole)) {
                logger.warn('Access denied - insufficient role', {
                    userId: req.user.id,
                    userRole: userRole,
                    requiredRoles: roles,
                    endpoint: req.url,
                    method: req.method,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            // Kontrola zda je uživatel aktivní
            if (!req.user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
};

/**
 * Middleware pro admin oprávnění
 */
const requireAdmin = authorizeRole('admin');

/**
 * Middleware pro user nebo admin oprávnění
 */
const requireUserOrAdmin = authorizeRole(['user', 'admin']);

/**
 * Middleware pro kontrolu vlastnictví zdroje
 * @param {string} resourceIdParam - Název parametru s ID zdroje
 * @returns {Function} Express middleware
 */
const requireOwnership = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;

            // Admin může přistupovat ke všem zdrojům
            if (req.user.role === 'admin') {
                return next();
            }

            // Kontrola vlastnictví zdroje
            if (resourceId !== userId) {
                logger.warn('Access denied - resource ownership', {
                    userId: userId,
                    resourceId: resourceId,
                    endpoint: req.url,
                    method: req.method,
                    ip: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied - insufficient permissions'
                });
            }

            next();
        } catch (error) {
            logger.error('Ownership middleware error', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
};

/**
 * Middleware pro kontrolu aktivního účtu
 */
const requireActiveAccount = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        next();
    } catch (error) {
        logger.error('Active account middleware error', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    };
};

/**
 * Middleware pro kontrolu ověřeného emailu
 */
const requireVerifiedEmail = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required'
            });
        }

        next();
    } catch (error) {
        logger.error('Verified email middleware error', {
            error: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    };
};

/**
 * Kombinovaný middleware pro běžné uživatele
 */
const requireUser = [
    requireActiveAccount,
    authorizeRole(['user', 'admin'])
];

/**
 * Kombinovaný middleware pro adminy
 */
const requireAdminAccess = [
    requireActiveAccount,
    requireAdmin
];

/**
 * Kombinovaný middleware pro ověřené uživatele
 */
const requireVerifiedUser = [
    requireActiveAccount,
    requireVerifiedEmail,
    authorizeRole(['user', 'admin'])
];

module.exports = {
    authorizeRole,
    requireAdmin,
    requireUserOrAdmin,
    requireOwnership,
    requireActiveAccount,
    requireVerifiedEmail,
    requireUser,
    requireAdminAccess,
    requireVerifiedUser
};
