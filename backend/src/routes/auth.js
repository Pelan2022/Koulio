const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, authenticateRefreshToken } = require('../middleware/auth');
const { 
    validate, 
    validateRegistration, 
    validateLogin, 
    validatePasswordChange, 
    validateProfileUpdate,
    validateRefreshToken,
    sanitizeInput
} = require('../middleware/validation');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
    authLimiter,
    sanitizeInput,
    validate(validateRegistration),
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
    authLimiter,
    sanitizeInput,
    validate(validateLogin),
    authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token)
 */
router.post('/refresh', 
    sanitizeInput,
    validate(validateRefreshToken),
    authenticateRefreshToken,
    authController.refreshToken
);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
    authenticateToken,
    authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
    authenticateToken,
    authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
    authenticateToken,
    sanitizeInput,
    validate(validateProfileUpdate),
    authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', 
    strictAuthLimiter,
    authenticateToken,
    sanitizeInput,
    validate(validatePasswordChange),
    authController.changePassword
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', 
    strictAuthLimiter,
    authenticateToken,
    sanitizeInput,
    authController.deleteAccount
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Private
 */
router.get('/verify', 
    authenticateToken,
    (req, res) => {
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: req.user.toJSON()
            }
        });
    }
);

module.exports = router;
