const database = require('../config/database');
const security = require('../config/security');
const logger = require('../utils/logger');

class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.fullName = data.full_name;
        this.passwordHash = data.password_hash;
        this.role = data.role || 'user';
        this.isActive = data.is_active;
        this.isEmailVerified = data.is_email_verified;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
        this.lastLoginAt = data.last_login_at;
        this.loginAttempts = data.login_attempts || 0;
        this.lockedUntil = data.locked_until;
        this.refreshToken = data.refresh_token;
        this.refreshTokenExpiresAt = data.refresh_token_expires_at;
    }

    /**
     * Create a new user
     */
    static async create(userData) {
        const {
            email,
            fullName,
            password
        } = userData;

        // Validate input
        if (!security.validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        const passwordValidation = security.validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const passwordHash = await security.hashPassword(password);

        try {
            const query = `
                INSERT INTO users (
                    email, 
                    full_name, 
                    password_hash, 
                    is_active, 
                    is_email_verified,
                    created_at, 
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const now = new Date();
            const values = [
                security.sanitizeInput(email.toLowerCase()),
                security.sanitizeInput(fullName),
                passwordHash,
                true,
                false, // Email verification required
                now,
                now
            ];

            const result = await database.query(query, values);
            logger.info('User created successfully', { userId: result.rows[0].id, email });
            
            return new User(result.rows[0]);
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = await database.query(query, [email.toLowerCase()]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            logger.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = $1';
            const result = await database.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * Verify user password
     */
    async verifyPassword(password) {
        return await security.verifyPassword(password, this.passwordHash);
    }

    /**
     * Update user password
     */
    async updatePassword(newPassword) {
        const passwordValidation = security.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        const passwordHash = await security.hashPassword(newPassword);
        
        try {
            const query = `
                UPDATE users 
                SET password_hash = $1, updated_at = $2
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await database.query(query, [passwordHash, new Date(), this.id]);
            this.passwordHash = result.rows[0].password_hash;
            
            logger.info('Password updated successfully', { userId: this.id });
            return this;
        } catch (error) {
            logger.error('Error updating password:', error);
            throw error;
        }
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin() {
        try {
            const query = `
                UPDATE users 
                SET last_login_at = $1, login_attempts = 0, locked_until = NULL
                WHERE id = $2
            `;
            
            await database.query(query, [new Date(), this.id]);
            this.lastLoginAt = new Date();
            this.loginAttempts = 0;
            this.lockedUntil = null;
            
            logger.info('Last login updated', { userId: this.id });
        } catch (error) {
            logger.error('Error updating last login:', error);
            throw error;
        }
    }

    /**
     * Increment login attempts
     */
    async incrementLoginAttempts() {
        try {
            const maxAttempts = 5;
            const lockTime = 30 * 60 * 1000; // 30 minutes
            
            const query = `
                UPDATE users 
                SET login_attempts = login_attempts + 1,
                    locked_until = CASE 
                        WHEN login_attempts + 1 >= $1 THEN $2
                        ELSE locked_until
                    END
                WHERE id = $3
                RETURNING login_attempts, locked_until
            `;
            
            const lockedUntil = new Date(Date.now() + lockTime);
            const result = await database.query(query, [maxAttempts, lockedUntil, this.id]);
            
            this.loginAttempts = result.rows[0].login_attempts;
            this.lockedUntil = result.rows[0].locked_until;
            
            logger.warn('Login attempts incremented', { 
                userId: this.id, 
                attempts: this.loginAttempts,
                lockedUntil: this.lockedUntil 
            });
        } catch (error) {
            logger.error('Error incrementing login attempts:', error);
            throw error;
        }
    }

    /**
     * Update refresh token
     */
    async updateRefreshToken(token, expiresAt) {
        try {
            const query = `
                UPDATE users 
                SET refresh_token = $1, refresh_token_expires_at = $2, updated_at = $3
                WHERE id = $4
            `;
            
            await database.query(query, [token, expiresAt, new Date(), this.id]);
            this.refreshToken = token;
            this.refreshTokenExpiresAt = expiresAt;
            
            logger.info('Refresh token updated', { userId: this.id });
        } catch (error) {
            logger.error('Error updating refresh token:', error);
            throw error;
        }
    }

    /**
     * Clear refresh token
     */
    async clearRefreshToken() {
        try {
            const query = `
                UPDATE users 
                SET refresh_token = NULL, refresh_token_expires_at = NULL, updated_at = $1
                WHERE id = $2
            `;
            
            await database.query(query, [new Date(), this.id]);
            this.refreshToken = null;
            this.refreshTokenExpiresAt = null;
            
            logger.info('Refresh token cleared', { userId: this.id });
        } catch (error) {
            logger.error('Error clearing refresh token:', error);
            throw error;
        }
    }

    /**
     * Delete user account
     */
    async delete() {
        try {
            const query = 'DELETE FROM users WHERE id = $1';
            await database.query(query, [this.id]);
            
            logger.info('User account deleted', { userId: this.id, email: this.email });
        } catch (error) {
            logger.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Kontrola role uživatele
     */
    hasRole(role) {
        return this.role === role;
    }

    /**
     * Kontrola zda je uživatel admin
     */
    isAdmin() {
        return this.role === 'admin';
    }

    /**
     * Kontrola zda je účet uzamčen
     */
    isLocked() {
        return this.lockedUntil && this.lockedUntil > new Date();
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            fullName: this.fullName,
            role: this.role,
            isActive: this.isActive,
            isEmailVerified: this.isEmailVerified,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLoginAt: this.lastLoginAt
        };
    }

    /**
     * Get all users (admin only)
     */
    static async findAll(limit = 50, offset = 0) {
        try {
            const query = `
                SELECT id, email, full_name, is_active, is_email_verified, 
                       created_at, updated_at, last_login_at
                FROM users 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
            `;
            
            const result = await database.query(query, [limit, offset]);
            return result.rows.map(row => new User(row));
        } catch (error) {
            logger.error('Error finding all users:', error);
            throw error;
        }
    }

    /**
     * Get user count
     */
    static async count() {
        try {
            const query = 'SELECT COUNT(*) as count FROM users';
            const result = await database.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            logger.error('Error counting users:', error);
            throw error;
        }
    }
}

module.exports = User;
