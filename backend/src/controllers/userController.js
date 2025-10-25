const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const exportService = require('../services/exportService');
const emailService = require('../services/emailService');
const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get user profile
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

        // Update user data
        const updateData = {};
        if (fullName) updateData.full_name = fullName;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
            const query = `
                UPDATE users 
                SET ${Object.keys(updateData).map(key => `${key} = $${Object.keys(updateData).indexOf(key) + 2}`).join(', ')}, updated_at = $1
                WHERE id = $${Object.keys(updateData).length + 2}
                RETURNING *
            `;
            
            const values = [new Date(), ...Object.values(updateData), user.id];
            const result = await database.query(query, values);
            
            logger.info('Profile updated successfully', { 
                userId: user.id,
                changes: updateData
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: new User(result.rows[0]).toJSON()
                }
            });
        } else {
            res.json({
                success: true,
                message: 'No changes to update',
                data: {
                    user: user.toJSON()
                }
            });
        }

    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
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

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
    try {
        const user = req.user;
        
        // Get user statistics from database
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
                (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
        `;
        
        const result = await database.query(statsQuery);
        const stats = result.rows[0];

        logger.info('User stats retrieved', { userId: user.id });

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers: parseInt(stats.total_users),
                    activeUsers: parseInt(stats.active_users),
                    newUsersLast30Days: parseInt(stats.new_users_last_30_days)
                }
            }
        });

    } catch (error) {
        logger.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics'
        });
    }
};

/**
 * Export user data
 */
const exportUserData = async (req, res) => {
    try {
        const { format = 'json', type = 'profile' } = req.query;
        const user = req.user;

        // Export podle formátu
        if (format === 'csv' || format === 'pdf') {
            const exportResult = await exportService.exportData(user.toJSON(), format, type);
            
            // Nastavit headers pro download
            res.setHeader('Content-Type', exportResult.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
            res.setHeader('Content-Length', exportResult.size);

            // Číst a odeslat soubor
            const fileData = await exportService.readExportFile(exportResult.filepath);
            res.send(fileData);

            // Vyčistit temp soubor
            setTimeout(() => {
                try {
                    const fs = require('fs');
                    fs.unlinkSync(exportResult.filepath);
                } catch (error) {
                    logger.error('Error deleting temp file', { error: error.message });
                }
            }, 5000);

        } else {
            // JSON export
            const auditLogs = await AuditLog.findByUserId(user.id, 100);
            
            const exportData = {
                userProfile: user.toJSON(),
                auditLogs: auditLogs.map(log => log.toJSON()),
                exportInfo: {
                    exportedAt: new Date().toISOString(),
                    format: 'json',
                    version: '1.0'
                }
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="unroll_user_data_${user.id}.json"`);
            res.json(exportData);
        }

        logger.info('User data exported', {
            userId: user.id,
            format,
            type
        });

    } catch (error) {
        logger.error('Export user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export user data'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount,
    getUserStats,
    exportUserData
};
