const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'koulio_db',
                user: process.env.DB_USER || 'koulio_user',
                password: process.env.DB_PASSWORD,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.connected = true;
            logger.info('Database connected successfully');
            
            // Handle pool errors
            this.pool.on('error', (err) => {
                logger.error('Unexpected error on idle client', err);
                this.connected = false;
            });

        } catch (error) {
            logger.error('Database connection failed:', error);
            this.connected = false;
            throw error;
        }
    }

    async query(text, params) {
        if (!this.connected || !this.pool) {
            throw new Error('Database not connected');
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            logger.debug('Executed query', { 
                text: text.substring(0, 100) + '...', 
                duration: `${duration}ms`,
                rows: result.rowCount 
            });
            
            return result;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async getClient() {
        if (!this.connected || !this.pool) {
            throw new Error('Database not connected');
        }
        return await this.pool.connect();
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.connected = false;
            logger.info('Database disconnected');
        }
    }

    isConnected() {
        return this.connected;
    }
}

// Singleton instance
const database = new DatabaseConnection();

module.exports = database;
