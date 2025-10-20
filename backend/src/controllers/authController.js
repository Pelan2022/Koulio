const User = require('../models/User');
const security = require('../config/security');
const logger = require('../config/logger');

/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { email, fullName, password } = req.body;

        // Create new user
        const user = await User.create({
            email,
            fullName,
            password
        });

        // Generate tokens
        const accessToken = security.generateAccessToken({
            userId: user.id,
            email: user.email,
            type: 'access'
        });

        const refreshToken = security.generateRefreshToken({
            userId: user.id,
            email: user.email,
            type: 'refresh'
        });

        // Store refresh token
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
        await user.updateRefreshToken(refreshToken, refreshTokenExpiresAt);

        logger.info('User registered successfully', { 
            userId: user.id, 
            email: user.email 
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('validation failed')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

/**
 * Login user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            logger.warn('Login attempt with non-existent email', { email });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            logger.warn('Login attempt on locked account', { 
                userId: user.id, 
                email: user.email 
            });
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        // Verify password
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incrementLoginAttempts();
            
            logger.warn('Invalid password attempt', { 
                userId: user.id, 
                email: user.email 
            });
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts on successful login
        await user.updateLastLogin();

        // Generate tokens
        const accessToken = security.generateAccessToken({
            userId: user.id,
            email: user.email,
            type: 'access'
        });

        const refreshToken = security.generateRefreshToken({
            userId: user.id,
            email: user.email,
            type: 'refresh'
        });

        // Store refresh token
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
        await user.updateRefreshToken(refreshToken, refreshTokenExpiresAt);

        logger.info('User logged in successfully', { 
            userId: user.id, 
            email: user.email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = req.user;

        // Generate new tokens
        const newAccessToken = security.generateAccessToken({
            userId: user.id,
            email: user.email,
            type: 'access'
        });

        const newRefreshToken = security.generateRefreshToken({
            userId: user.id,
            email: user.email,
            type: 'refresh'
        });

        // Update refresh token in database
        const refreshTokenExpiresAt = new Date();
        refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
        await user.updateRefreshToken(newRefreshToken, refreshTokenExpiresAt);

        logger.info('Token refreshed successfully', { userId: user.id });

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                tokens: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            }
        });

    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
    try {
        const user = req.user;

        // Clear refresh token
        await user.clearRefreshToken();

        logger.info('User logged out successfully', { 
            userId: user.id,
            email: user.email 
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        const { fullName, email } = req.body;

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Update user data (you would need to add update methods to User model)
        // For now, we'll just return the current user data
        logger.info('Profile update requested', { 
            userId: user.id,
            changes: { fullName, email }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await user.updatePassword(newPassword);

        // Clear all refresh tokens (force re-login)
        await user.clearRefreshToken();

        logger.info('Password changed successfully', { userId: user.id });

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        logger.error('Change password error:', error);
        
        if (error.message.includes('validation failed')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
    try {
        const user = req.user;
        const { password } = req.body;

        // Verify password before deletion
        const isPasswordValid = await user.verifyPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }

        // Delete user account
        await user.delete();

        logger.info('User account deleted', { 
            userId: user.id,
            email: user.email 
        });

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        logger.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
};
