const express = require('express');
const router = express.Router();

const { requireAdminAccess } = require('../middleware/rbac');
const { auditAdminAction } = require('../middleware/audit');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const database = require('../config/database');
const logger = require('../utils/logger');

/**
 * @route   GET /api/admin/audit
 * @desc    Get audit logs (admin only)
 * @access  Private (Admin)
 */
router.get('/audit', 
    requireAdminAccess,
    auditAdminAction('AUDIT_VIEW'),
    async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 50, 
                action, 
                userId, 
                resourceType,
                dateFrom,
                dateTo 
            } = req.query;

            const offset = (page - 1) * limit;
            const filters = {
                action,
                userId,
                resourceType,
                dateFrom: dateFrom ? new Date(dateFrom) : null,
                dateTo: dateTo ? new Date(dateTo) : null
            };

            const [logs, total] = await Promise.all([
                AuditLog.findAll(parseInt(limit), offset, filters),
                AuditLog.count(filters)
            ]);

            res.json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            logger.error('Get audit logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get audit logs'
            });
        }
    }
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', 
    requireAdminAccess,
    auditAdminAction('USERS_VIEW'),
    async (req, res) => {
        try {
            const { page = 1, limit = 50, role, isActive } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT id, email, full_name, role, is_active, is_email_verified, 
                       created_at, updated_at, last_login_at
                FROM users
                WHERE 1=1
            `;
            
            const values = [];
            let paramCount = 0;

            if (role) {
                paramCount++;
                query += ` AND role = $${paramCount}`;
                values.push(role);
            }

            if (isActive !== undefined) {
                paramCount++;
                query += ` AND is_active = $${paramCount}`;
                values.push(isActive === 'true');
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            values.push(parseInt(limit), offset);

            const result = await database.query(query, values);

            // Počet celkem
            let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
            const countValues = [];
            let countParamCount = 0;

            if (role) {
                countParamCount++;
                countQuery += ` AND role = $${countParamCount}`;
                countValues.push(role);
            }

            if (isActive !== undefined) {
                countParamCount++;
                countQuery += ` AND is_active = $${countParamCount}`;
                countValues.push(isActive === 'true');
            }

            const countResult = await database.query(countQuery, countValues);
            const total = parseInt(countResult.rows[0].total);

            res.json({
                success: true,
                data: {
                    users: result.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            logger.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get users'
            });
        }
    }
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:id', 
    requireAdminAccess,
    auditAdminAction('USER_UPDATE'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { role, isActive, fullName } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const updateData = {};
            if (role !== undefined) updateData.role = role;
            if (isActive !== undefined) updateData.is_active = isActive;
            if (fullName !== undefined) updateData.full_name = fullName;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
            }

            const query = `
                UPDATE users 
                SET ${Object.keys(updateData).map(key => `${key} = $${Object.keys(updateData).indexOf(key) + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, email, full_name, role, is_active, is_email_verified, created_at, updated_at
            `;
            
            const values = [id, ...Object.values(updateData)];
            const result = await database.query(query, values);

            logger.info('User updated by admin', {
                adminId: req.user.id,
                targetUserId: id,
                changes: updateData
            });

            res.json({
                success: true,
                message: 'User updated successfully',
                data: {
                    user: result.rows[0]
                }
            });

        } catch (error) {
            logger.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        }
    }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin)
 */
router.delete('/users/:id', 
    requireAdminAccess,
    auditAdminAction('USER_DELETE'),
    async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Admin nemůže smazat sám sebe
            if (id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            await user.delete();

            logger.info('User deleted by admin', {
                adminId: req.user.id,
                deletedUserId: id,
                deletedUserEmail: user.email
            });

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            logger.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        }
    }
);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', 
    requireAdminAccess,
    auditAdminAction('STATS_VIEW'),
    async (req, res) => {
        try {
            const [
                userStats,
                auditStats,
                recentActivity
            ] = await Promise.all([
                database.query(`
                    SELECT 
                        COUNT(*) as total_users,
                        COUNT(*) FILTER (WHERE is_active = true) as active_users,
                        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
                        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
                    FROM users
                `),
                AuditLog.getStatistics(),
                AuditLog.findAll(10, 0)
            ]);

            res.json({
                success: true,
                data: {
                    users: userStats.rows[0],
                    auditStats,
                    recentActivity
                }
            });

        } catch (error) {
            logger.error('Get admin stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get statistics'
            });
        }
    }
);

module.exports = router;
