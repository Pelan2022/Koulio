const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ExportService {
    constructor() {
        this.tempDir = path.join(__dirname, '../../temp');
        this.ensureTempDir();
    }

    /**
     * Vytvoření temp adresáře pokud neexistuje
     */
    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Export uživatelských dat do CSV
     */
    async exportUserDataToCSV(userData, exportType = 'profile') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `user_${exportType}_${timestamp}.csv`;
            const filepath = path.join(this.tempDir, filename);

            let csvWriter;
            let data = [];

            switch (exportType) {
                case 'profile':
                    csvWriter = createCsvWriter({
                        path: filepath,
                        header: [
                            { id: 'id', title: 'ID' },
                            { id: 'email', title: 'Email' },
                            { id: 'fullName', title: 'Full Name' },
                            { id: 'role', title: 'Role' },
                            { id: 'isActive', title: 'Is Active' },
                            { id: 'isEmailVerified', title: 'Email Verified' },
                            { id: 'createdAt', title: 'Created At' },
                            { id: 'lastLoginAt', title: 'Last Login' }
                        ]
                    });

                    data = [{
                        id: userData.id,
                        email: userData.email,
                        fullName: userData.fullName,
                        role: userData.role,
                        isActive: userData.isActive,
                        isEmailVerified: userData.isEmailVerified,
                        createdAt: userData.createdAt,
                        lastLoginAt: userData.lastLoginAt
                    }];
                    break;

                case 'audit':
                    csvWriter = createCsvWriter({
                        path: filepath,
                        header: [
                            { id: 'id', title: 'ID' },
                            { id: 'action', title: 'Action' },
                            { id: 'resourceType', title: 'Resource Type' },
                            { id: 'details', title: 'Details' },
                            { id: 'ipAddress', title: 'IP Address' },
                            { id: 'createdAt', title: 'Created At' }
                        ]
                    });

                    data = userData.map(log => ({
                        id: log.id,
                        action: log.action,
                        resourceType: log.resourceType,
                        details: JSON.stringify(log.details),
                        ipAddress: log.ipAddress,
                        createdAt: log.createdAt
                    }));
                    break;

                default:
                    throw new Error(`Unsupported export type: ${exportType}`);
            }

            await csvWriter.writeRecords(data);

            logger.info('CSV export completed', {
                filename,
                exportType,
                recordCount: data.length
            });

            return {
                filename,
                filepath,
                contentType: 'text/csv',
                size: fs.statSync(filepath).size
            };

        } catch (error) {
            logger.error('CSV export failed', {
                error: error.message,
                exportType
            });
            throw error;
        }
    }

    /**
     * Export uživatelských dat do PDF
     */
    async exportUserDataToPDF(userData, exportType = 'profile') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `user_${exportType}_${timestamp}.pdf`;
            const filepath = path.join(this.tempDir, filename);

            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(filepath));

            // Header
            doc.fontSize(20)
               .text('KOULIO - Export dat', 50, 50)
               .fontSize(12)
               .text(`Export typu: ${exportType}`, 50, 80)
               .text(`Datum exportu: ${new Date().toLocaleString('cs-CZ')}`, 50, 100)
               .text(`Export pro: ${userData.email || 'N/A'}`, 50, 120);

            let yPosition = 150;

            switch (exportType) {
                case 'profile':
                    doc.fontSize(16).text('Profil uživatele', 50, yPosition);
                    yPosition += 30;

                    const profileData = [
                        ['ID', userData.id],
                        ['Email', userData.email],
                        ['Jméno', userData.fullName],
                        ['Role', userData.role],
                        ['Aktivní', userData.isActive ? 'Ano' : 'Ne'],
                        ['Email ověřen', userData.isEmailVerified ? 'Ano' : 'Ne'],
                        ['Vytvořeno', userData.createdAt],
                        ['Poslední přihlášení', userData.lastLoginAt || 'Nikdy']
                    ];

                    profileData.forEach(([label, value]) => {
                        doc.text(`${label}:`, 50, yPosition)
                           .text(value || 'N/A', 200, yPosition);
                        yPosition += 20;
                    });
                    break;

                case 'audit':
                    doc.fontSize(16).text('Audit logy', 50, yPosition);
                    yPosition += 30;

                    if (userData.length === 0) {
                        doc.text('Žádné audit logy nebyly nalezeny.', 50, yPosition);
                    } else {
                        userData.forEach((log, index) => {
                            if (yPosition > 700) {
                                doc.addPage();
                                yPosition = 50;
                            }

                            doc.fontSize(12)
                               .text(`${index + 1}. ${log.action}`, 50, yPosition)
                               .fontSize(10)
                               .text(`Typ zdroje: ${log.resourceType || 'N/A'}`, 70, yPosition + 20)
                               .text(`IP adresa: ${log.ipAddress || 'N/A'}`, 70, yPosition + 35)
                               .text(`Datum: ${log.createdAt}`, 70, yPosition + 50);

                            if (log.details) {
                                const detailsText = JSON.stringify(log.details, null, 2);
                                doc.text(`Detaily: ${detailsText.substring(0, 200)}...`, 70, yPosition + 65);
                            }

                            yPosition += 100;
                        });
                    }
                    break;

                default:
                    throw new Error(`Unsupported export type: ${exportType}`);
            }

            // Footer
            doc.fontSize(8)
               .text(`Vygenerováno: ${new Date().toLocaleString('cs-CZ')}`, 50, doc.page.height - 50)
               .text('KOULIO - Aplikace pro práci s emocemi', 50, doc.page.height - 35);

            doc.end();

            // Počkat na dokončení PDF
            await new Promise((resolve) => {
                doc.on('end', resolve);
            });

            logger.info('PDF export completed', {
                filename,
                exportType,
                recordCount: Array.isArray(userData) ? userData.length : 1
            });

            return {
                filename,
                filepath,
                contentType: 'application/pdf',
                size: fs.statSync(filepath).size
            };

        } catch (error) {
            logger.error('PDF export failed', {
                error: error.message,
                exportType
            });
            throw error;
        }
    }

    /**
     * Export dat podle typu a formátu
     */
    async exportData(userData, format, exportType) {
        try {
            let result;

            switch (format.toLowerCase()) {
                case 'csv':
                    result = await this.exportUserDataToCSV(userData, exportType);
                    break;
                case 'pdf':
                    result = await this.exportUserDataToPDF(userData, exportType);
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            return result;

        } catch (error) {
            logger.error('Data export failed', {
                error: error.message,
                format,
                exportType
            });
            throw error;
        }
    }

    /**
     * Čtení souboru pro download
     */
    async readExportFile(filepath) {
        try {
            const data = fs.readFileSync(filepath);
            return data;
        } catch (error) {
            logger.error('Error reading export file', {
                error: error.message,
                filepath
            });
            throw error;
        }
    }

    /**
     * Mazání temp souborů
     */
    async cleanupTempFiles() {
        try {
            const files = fs.readdirSync(this.tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hodin

            let deletedCount = 0;

            for (const file of files) {
                const filepath = path.join(this.tempDir, file);
                const stats = fs.statSync(filepath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filepath);
                    deletedCount++;
                }
            }

            if (deletedCount > 0) {
                logger.info('Temp files cleaned up', {
                    deletedCount,
                    tempDir: this.tempDir
                });
            }

            return deletedCount;

        } catch (error) {
            logger.error('Error cleaning up temp files', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Získání informací o temp souborech
     */
    async getTempFilesInfo() {
        try {
            const files = fs.readdirSync(this.tempDir);
            const fileInfo = [];

            for (const file of files) {
                const filepath = path.join(this.tempDir, file);
                const stats = fs.statSync(filepath);
                
                fileInfo.push({
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            }

            return fileInfo;

        } catch (error) {
            logger.error('Error getting temp files info', {
                error: error.message
            });
            throw error;
        }
    }
}

module.exports = new ExportService();
