const { body, validationResult } = require('express-validator');
const security = require('../config/security');

/**
 * Validation middleware factory
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(error => ({
                    field: error.path,
                    message: error.msg,
                    value: error.value
                }))
            });
        }

        next();
    };
};

/**
 * Registration validation rules - simplified for debug
 */
const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    
    body('confirmPassword')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
];

/**
 * Login validation rules
 */
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1 })
        .withMessage('Password cannot be empty')
];

/**
 * Password change validation rules
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .custom((value) => {
            const validation = security.validatePassword(value);
            if (!validation.isValid) {
                throw new Error(`Password requirements: ${validation.errors.join(', ')}`);
            }
            return true;
        }),
    
    body('confirmNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        })
];

/**
 * Profile update validation rules
 */
const validateProfileUpdate = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]+$/)
        .withMessage('Full name can only contain letters and spaces'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
        .custom(async (value) => {
            if (!security.validateEmail(value)) {
                throw new Error('Invalid email format');
            }
            return true;
        })
];

/**
 * Password reset request validation
 */
const validatePasswordResetRequest = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
];

/**
 * Password reset validation
 */
const validatePasswordReset = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required')
        .isLength({ min: 32 })
        .withMessage('Invalid reset token format'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .custom((value) => {
            const validation = security.validatePassword(value);
            if (!validation.isValid) {
                throw new Error(`Password requirements: ${validation.errors.join(', ')}`);
            }
            return true;
        }),
    
    body('confirmNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        })
];

/**
 * Refresh token validation
 */
const validateRefreshToken = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
        .isLength({ min: 100 })
        .withMessage('Invalid refresh token format')
];

/**
 * Sanitize input middleware
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize string inputs
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = security.sanitizeInput(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) {
        sanitizeObject(req.body);
    }
    
    if (req.query) {
        sanitizeObject(req.query);
    }
    
    if (req.params) {
        sanitizeObject(req.params);
    }

    next();
};

module.exports = {
    validate,
    validateRegistration,
    validateLogin,
    validatePasswordChange,
    validateProfileUpdate,
    validatePasswordResetRequest,
    validatePasswordReset,
    validateRefreshToken,
    sanitizeInput
};
