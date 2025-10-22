const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SecurityService {
    constructor() {
        this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.jwtSecret = process.env.JWT_SECRET;
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
        
        // Argon2 configuration
        this.argon2Options = {
            memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536, // 64 MB
            timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
            parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1,
            type: argon2.argon2id
        };
        
        if (!this.jwtSecret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
    }

    /**
     * Hash password using Argon2 (preferred) or bcrypt (fallback)
     */
    async hashPassword(password) {
        try {
            // Try Argon2 first (more secure)
            return await argon2.hash(password, this.argon2Options);
        } catch (error) {
            // Fallback to bcrypt if Argon2 fails
            return await bcrypt.hash(password, this.bcryptRounds);
        }
    }

    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        try {
            // Check if it's an Argon2 hash (starts with $argon2)
            if (hash.startsWith('$argon2')) {
                return await argon2.verify(hash, password);
            } else {
                // Assume bcrypt hash
                return await bcrypt.compare(password, hash);
            }
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }

    /**
     * Generate JWT access token
     */
    generateAccessToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            issuer: 'koulio-backend',
            audience: 'koulio-client'
        });
    }

    /**
     * Generate JWT refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtRefreshExpiresIn,
            issuer: 'koulio-backend',
            audience: 'koulio-client'
        });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'koulio-backend',
                audience: 'koulio-client'
            });
        } catch (error) {
            throw new Error(`Invalid token: ${error.message}`);
        }
    }

    /**
     * Generate secure random string
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate secure UUID
     */
    generateSecureUUID() {
        return crypto.randomUUID();
    }

    /**
     * Sanitize user input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 1000); // Limit length
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate password reset token
     */
    generatePasswordResetToken() {
        return {
            token: this.generateSecureToken(32),
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        };
    }
}

module.exports = new SecurityService();
