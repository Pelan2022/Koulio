#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

/**
 * Database backup script for PostgreSQL
 * Používá pg_dump pro vytvoření zálohy databáze
 */

class DatabaseBackup {
    constructor() {
        this.databaseUrl = process.env.DATABASE_URL;
        this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
        this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
        
        // Parsování DATABASE_URL
        this.parseDatabaseUrl();
    }
    
    parseDatabaseUrl() {
        if (!this.databaseUrl) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        
        try {
            const url = new URL(this.databaseUrl);
            this.dbConfig = {
                host: url.hostname,
                port: url.port || 5432,
                database: url.pathname.substring(1),
                username: url.username,
                password: url.password,
                ssl: url.searchParams.get('sslmode') === 'require'
            };
        } catch (error) {
            throw new Error(`Invalid DATABASE_URL: ${error.message}`);
        }
    }
    
    /**
     * Vytvoření zálohy databáze
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `unroll_backup_${timestamp}.sql`;
        const backupPath = path.join(this.backupDir, backupFileName);
        
        // Vytvoření backup adresáře pokud neexistuje
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        // Sestavení pg_dump příkazu
        const pgDumpCommand = this.buildPgDumpCommand(backupPath);
        
        logger.info('Starting database backup', {
            database: this.dbConfig.database,
            backupFile: backupFileName,
            timestamp: new Date().toISOString()
        });
        
        return new Promise((resolve, reject) => {
            exec(pgDumpCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Backup failed', {
                        error: error.message,
                        stderr: stderr
                    });
                    reject(error);
                    return;
                }
                
                // Kontrola velikosti souboru
                const stats = fs.statSync(backupPath);
                const fileSizeMB = Math.round(stats.size / 1024 / 1024);
                
                logger.info('Backup completed successfully', {
                    backupFile: backupFileName,
                    fileSize: `${fileSizeMB}MB`,
                    duration: 'completed'
                });
                
                resolve({
                    backupPath,
                    fileName: backupFileName,
                    fileSize: stats.size,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    /**
     * Sestavení pg_dump příkazu
     */
    buildPgDumpCommand(outputPath) {
        const env = {
            ...process.env,
            PGPASSWORD: this.dbConfig.password
        };
        
        const command = [
            'pg_dump',
            `--host=${this.dbConfig.host}`,
            `--port=${this.dbConfig.port}`,
            `--username=${this.dbConfig.username}`,
            `--dbname=${this.dbConfig.database}`,
            '--verbose',
            '--no-password',
            '--format=plain',
            '--encoding=UTF8',
            '--no-owner',
            '--no-privileges',
            '--clean',
            '--if-exists',
            '--create',
            `--file=${outputPath}`
        ];
        
        if (this.dbConfig.ssl) {
            command.push('--set=sslmode=require');
        }
        
        return command.join(' ');
    }
    
    /**
     * Komprese zálohy
     */
    async compressBackup(backupPath) {
        const compressedPath = backupPath + '.gz';
        
        return new Promise((resolve, reject) => {
            exec(`gzip -c "${backupPath}" > "${compressedPath}"`, (error) => {
                if (error) {
                    logger.error('Backup compression failed', {
                        error: error.message
                    });
                    reject(error);
                    return;
                }
                
                // Smazání nekomprimovaného souboru
                fs.unlinkSync(backupPath);
                
                const stats = fs.statSync(compressedPath);
                const fileSizeMB = Math.round(stats.size / 1024 / 1024);
                
                logger.info('Backup compressed successfully', {
                    compressedFile: path.basename(compressedPath),
                    fileSize: `${fileSizeMB}MB`
                });
                
                resolve({
                    compressedPath,
                    fileName: path.basename(compressedPath),
                    fileSize: stats.size
                });
            });
        });
    }
    
    /**
     * Vyčištění starých záloh
     */
    async cleanupOldBackups() {
        if (!fs.existsSync(this.backupDir)) {
            return;
        }
        
        const files = fs.readdirSync(this.backupDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        
        let deletedCount = 0;
        let freedSpace = 0;
        
        for (const file of files) {
            if (file.startsWith('unroll_backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))) {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    freedSpace += stats.size;
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
        }
        
        if (deletedCount > 0) {
            logger.info('Old backups cleaned up', {
                deletedCount,
                freedSpace: `${Math.round(freedSpace / 1024 / 1024)}MB`,
                retentionDays: this.retentionDays
            });
        }
    }
    
    /**
     * Hlavní metoda pro spuštění zálohy
     */
    async run() {
        try {
            logger.info('Database backup process started', {
                database: this.dbConfig.database,
                backupDir: this.backupDir,
                retentionDays: this.retentionDays
            });
            
            // Vytvoření zálohy
            const backup = await this.createBackup();
            
            // Komprese zálohy
            const compressedBackup = await this.compressBackup(backup.backupPath);
            
            // Vyčištění starých záloh
            await this.cleanupOldBackups();
            
            logger.info('Database backup process completed successfully', {
                backupFile: compressedBackup.fileName,
                fileSize: `${Math.round(compressedBackup.fileSize / 1024 / 1024)}MB`
            });
            
            return compressedBackup;
            
        } catch (error) {
            logger.error('Database backup process failed', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

// Spuštění zálohy pokud je skript volán přímo
if (require.main === module) {
    const backup = new DatabaseBackup();
    
    backup.run()
        .then(result => {
            console.log('Backup completed:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('Backup failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseBackup;
