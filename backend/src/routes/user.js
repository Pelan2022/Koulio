const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { 
    validate, 
    validatePasswordChange, 
    validateProfileUpdate,
    sanitizeInput
} = require('../middleware/validation');

// Protected routes (authentication required)

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
    authenticateToken,
    userController.getProfile
);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
    authenticateToken,
    sanitizeInput,
    validate(validateProfileUpdate),
    userController.updateProfile
);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', 
    authenticateToken,
    sanitizeInput,
    userController.deleteAccount
);

/**
 * @route   GET /api/user/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', 
    authenticateToken,
    userController.getUserStats
);

/**
 * @route   GET /api/user/export
 * @desc    Export user data
 * @access  Private
 */
router.get('/export', 
    authenticateToken,
    userController.exportUserData
);

module.exports = router;
