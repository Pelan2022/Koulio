#!/usr/bin/env node

/**
 * Cron job script for automated database backups
 * Spouští se denně v 2:00 AM
 */

const DatabaseBackup = require('./backup');
const logger = require('../src/utils/logger');

async function runBackup() {
    try {
        logger.info('Starting scheduled database backup', {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });
        
        const backup = new DatabaseBackup();
        const result = await backup.run();
        
        logger.info('Scheduled backup completed successfully', {
            backupFile: result.fileName,
            fileSize: `${Math.round(result.fileSize / 1024 / 1024)}MB`,
            timestamp: new Date().toISOString()
        });
        
        process.exit(0);
        
    } catch (error) {
        logger.error('Scheduled backup failed', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        process.exit(1);
    }
}

// Spuštění zálohy
runBackup();
