const security = require('../config/security');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = security.verifyToken(token);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        // Add user to request object
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.message.includes('invalid')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                code: 'TOKEN_INVALID'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to verify refresh token
 */
const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = security.verifyToken(refreshToken);
        
        // Check if user exists and has matching refresh token
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Verify refresh token matches stored token
        if (user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if refresh token has expired
        if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token has expired'
            });
        }

        // Add user to request object
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        logger.error('Refresh token authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = security.verifyToken(token);
            const user = await User.findById(decoded.userId);
            
            if (user && user.isActive && !user.isLocked()) {
                req.user = user;
                req.userId = user.id;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

/**
 * Middleware to check if user is admin (if needed in future)
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // For now, we don't have admin roles, but this is prepared for future use
    // if (!req.user.isAdmin) {
    //     return res.status(403).json({
    //         success: false,
    //         message: 'Admin access required'
    //     });
    // }

    next();
};

/**
 * Middleware to log user actions
 */
const logUserAction = (action) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after response is sent
            if (req.user && req.userId) {
                logger.info('User action', {
                    userId: req.userId,
                    action: action,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    authenticateToken,
    authenticateRefreshToken,
    optionalAuth,
    requireAdmin,
    logUserAction
};
