const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class RefreshToken {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.token = data.token;
        this.expiresAt = data.expires_at;
        this.isRevoked = data.is_revoked;
        this.createdAt = data.created_at;
        this.revokedAt = data.revoked_at;
    }

    /**
     * Vytvoření nového refresh tokenu
     */
    static async create(userId, expiresInDays = 7) {
        const token = jwt.sign(
            { userId, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: `${expiresInDays}d` }
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const query = `
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const values = [userId, token, expiresAt];
        const result = await database.query(query, values);

        return new RefreshToken(result.rows[0]);
    }

    /**
     * Nalezení refresh tokenu podle tokenu
     */
    static async findByToken(token) {
        const query = `
            SELECT * FROM refresh_tokens 
            WHERE token = $1 AND is_revoked = FALSE AND expires_at > CURRENT_TIMESTAMP
        `;
        
        const result = await database.query(query, [token]);
        
        if (result.rows.length === 0) {
            return null;
        }

        return new RefreshToken(result.rows[0]);
    }

    /**
     * Nalezení všech refresh tokenů pro uživatele
     */
    static async findByUserId(userId) {
        const query = `
            SELECT * FROM refresh_tokens 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        
        const result = await database.query(query, [userId]);
        
        return result.rows.map(row => new RefreshToken(row));
    }

    /**
     * Zneplatnění refresh tokenu
     */
    async revoke() {
        const query = `
            UPDATE refresh_tokens 
            SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;
        
        await database.query(query, [this.id]);
        this.isRevoked = true;
        this.revokedAt = new Date();
    }

    /**
     * Zneplatnění všech refresh tokenů pro uživatele
     */
    static async revokeAllForUser(userId) {
        const query = `
            UPDATE refresh_tokens 
            SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND is_revoked = FALSE
        `;
        
        const result = await database.query(query, [userId]);
        return result.rowCount;
    }

    /**
     * Vyčištění expirovaných refresh tokenů
     */
    static async cleanExpired() {
        const query = `
            DELETE FROM refresh_tokens 
            WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = TRUE
        `;
        
        const result = await database.query(query);
        return result.rowCount;
    }

    /**
     * Kontrola platnosti tokenu
     */
    isValid() {
        return !this.isRevoked && this.expiresAt > new Date();
    }

    /**
     * Generování nového access tokenu z refresh tokenu
     */
    generateAccessToken() {
        return jwt.sign(
            { 
                userId: this.userId, 
                type: 'access' 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    /**
     * Konverze na JSON
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            token: this.token,
            expiresAt: this.expiresAt,
            isRevoked: this.isRevoked,
            createdAt: this.createdAt,
            revokedAt: this.revokedAt
        };
    }
}

module.exports = RefreshToken;
