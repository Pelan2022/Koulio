const database = require('../config/database');
const logger = require('../utils/logger');

class AuditLog {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.action = data.action;
        this.resourceType = data.resource_type;
        this.resourceId = data.resource_id;
        this.details = data.details;
        this.ipAddress = data.ip_address;
        this.userAgent = data.user_agent;
        this.createdAt = data.created_at;
    }

    /**
     * Vytvoření nového audit logu
     */
    static async create(auditData) {
        const {
            userId,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress,
            userAgent
        } = auditData;

        const query = `
            INSERT INTO audit_log (
                user_id, action, resource_type, resource_id, 
                details, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            userId,
            action,
            resourceType,
            resourceId,
            details ? JSON.stringify(details) : null,
            ipAddress,
            userAgent
        ];

        try {
            const result = await database.query(query, values);
            return new AuditLog(result.rows[0]);
        } catch (error) {
            logger.error('Error creating audit log', {
                error: error.message,
                auditData
            });
            throw error;
        }
    }

    /**
     * Získání audit logů pro uživatele
     */
    static async findByUserId(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM audit_log 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;

        const result = await database.query(query, [userId, limit, offset]);
        return result.rows.map(row => new AuditLog(row));
    }

    /**
     * Získání audit logů podle akce
     */
    static async findByAction(action, limit = 50, offset = 0) {
        const query = `
            SELECT al.*, u.email, u.full_name 
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.action = $1 
            ORDER BY al.created_at DESC 
            LIMIT $2 OFFSET $3
        `;

        const result = await database.query(query, [action, limit, offset]);
        return result.rows.map(row => ({
            ...new AuditLog(row),
            userEmail: row.email,
            userFullName: row.full_name
        }));
    }

    /**
     * Získání všech audit logů (admin)
     */
    static async findAll(limit = 100, offset = 0, filters = {}) {
        let query = `
            SELECT al.*, u.email, u.full_name 
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        
        const values = [];
        let paramCount = 0;

        // Filtry
        if (filters.action) {
            paramCount++;
            query += ` AND al.action = $${paramCount}`;
            values.push(filters.action);
        }

        if (filters.userId) {
            paramCount++;
            query += ` AND al.user_id = $${paramCount}`;
            values.push(filters.userId);
        }

        if (filters.resourceType) {
            paramCount++;
            query += ` AND al.resource_type = $${paramCount}`;
            values.push(filters.resourceType);
        }

        if (filters.dateFrom) {
            paramCount++;
            query += ` AND al.created_at >= $${paramCount}`;
            values.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            paramCount++;
            query += ` AND al.created_at <= $${paramCount}`;
            values.push(filters.dateTo);
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await database.query(query, values);
        return result.rows.map(row => ({
            ...new AuditLog(row),
            userEmail: row.email,
            userFullName: row.full_name
        }));
    }

    /**
     * Počet audit logů podle filtru
     */
    static async count(filters = {}) {
        let query = `
            SELECT COUNT(*) as total
            FROM audit_log al
            WHERE 1=1
        `;
        
        const values = [];
        let paramCount = 0;

        // Filtry
        if (filters.action) {
            paramCount++;
            query += ` AND al.action = $${paramCount}`;
            values.push(filters.action);
        }

        if (filters.userId) {
            paramCount++;
            query += ` AND al.user_id = $${paramCount}`;
            values.push(filters.userId);
        }

        if (filters.resourceType) {
            paramCount++;
            query += ` AND al.resource_type = $${paramCount}`;
            values.push(filters.resourceType);
        }

        if (filters.dateFrom) {
            paramCount++;
            query += ` AND al.created_at >= $${paramCount}`;
            values.push(filters.dateFrom);
        }

        if (filters.dateTo) {
            paramCount++;
            query += ` AND al.created_at <= $${paramCount}`;
            values.push(filters.dateTo);
        }

        const result = await database.query(query, values);
        return parseInt(result.rows[0].total);
    }

    /**
     * Vyčištění starých audit logů
     */
    static async cleanOldLogs(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const query = `
            DELETE FROM audit_log 
            WHERE created_at < $1
        `;

        try {
            const result = await database.query(query, [cutoffDate]);
            logger.info('Old audit logs cleaned up', {
                deletedCount: result.rowCount,
                cutoffDate: cutoffDate
            });
            return result.rowCount;
        } catch (error) {
            logger.error('Error cleaning old audit logs', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Statistiky audit logů
     */
    static async getStatistics() {
        const query = `
            SELECT 
                action,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users
            FROM audit_log 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY action
            ORDER BY count DESC
        `;

        const result = await database.query(query);
        return result.rows;
    }

    /**
     * Konverze na JSON
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            action: this.action,
            resourceType: this.resourceType,
            resourceId: this.resourceId,
            details: this.details,
            ipAddress: this.ipAddress,
            userAgent: this.userAgent,
            createdAt: this.createdAt
        };
    }
}

module.exports = AuditLog;
