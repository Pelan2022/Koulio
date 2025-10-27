const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@unroll.cz';
        this.init();
    }

    /**
     * Inicializace email transportu
     */
    init() {
        try {
            // Konfigurace pro SendGrid nebo SMTP
            if (process.env.SENDGRID_API_KEY) {
                this.transporter = nodemailer.createTransport({
                    service: 'SendGrid',
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                });
            } else {
                // SMTP konfigurace
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'localhost',
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
            }

            logger.info('Email service initialized', {
                service: process.env.SENDGRID_API_KEY ? 'SendGrid' : 'SMTP'
            });
        } catch (error) {
            logger.error('Email service initialization failed', {
                error: error.message
            });
        }
    }

    /**
     * Odeslání emailu
     */
    async sendEmail(to, subject, html, text = null) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const mailOptions = {
                from: this.fromEmail,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            logger.info('Email sent successfully', {
                to,
                subject,
                messageId: result.messageId
            });

            return result;
        } catch (error) {
            logger.error('Email sending failed', {
                error: error.message,
                to,
                subject
            });
            throw error;
        }
    }

    /**
     * Email pro potvrzení registrace
     */
    async sendRegistrationConfirmation(userEmail, userName, verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Potvrzení registrace - Unroll</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea;">Vítejte v Unroll!</h1>
                    <p>Ahoj ${userName},</p>
                    <p>děkujeme za registraci v aplikaci Unroll. Pro dokončení registrace prosím potvrďte svůj email kliknutím na tlačítko níže:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  display: inline-block;">
                            Potvrdit email
                        </a>
                    </div>
                    
                    <p>Pokud tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:</p>
                    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                    
                    <p>Tento odkaz je platný 24 hodin.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        Tento email byl odeslán automaticky. Prosím neodpovídejte na něj.
                    </p>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(
            userEmail,
            'Potvrzení registrace - Unroll',
            html
        );
    }

    /**
     * Email pro reset hesla
     */
    async sendPasswordReset(userEmail, userName, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reset hesla - Unroll</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea;">Reset hesla</h1>
                    <p>Ahoj ${userName},</p>
                    <p>obdrželi jsme žádost o reset vašeho hesla. Pro vytvoření nového hesla klikněte na tlačítko níže:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 5px; 
                                  display: inline-block;">
                            Resetovat heslo
                        </a>
                    </div>
                    
                    <p>Pokud tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:</p>
                    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                    
                    <p><strong>Důležité:</strong></p>
                    <ul>
                        <li>Tento odkaz je platný pouze 1 hodinu</li>
                        <li>Pokud jste o reset hesla nežádali, tento email ignorujte</li>
                        <li>Vaše stávající heslo zůstává beze změny</li>
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        Tento email byl odeslán automaticky. Prosím neodpovídejte na něj.
                    </p>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(
            userEmail,
            'Reset hesla - Unroll',
            html
        );
    }

    /**
     * Email pro notifikaci o smazání účtu
     */
    async sendAccountDeletionNotification(userEmail, userName) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Účet byl smazán - Unroll</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea;">Účet byl smazán</h1>
                    <p>Ahoj ${userName},</p>
                    <p>váš účet v aplikaci Unroll byl úspěšně smazán.</p>
                    
                    <p><strong>Co to znamená:</strong></p>
                    <ul>
                        <li>Všechna vaše data byla trvale odstraněna</li>
                        <li>Už se nemůžete přihlásit s tímto emailem</li>
                        <li>Pokud si budete chtít vytvořit nový účet, můžete se znovu zaregistrovat</li>
                    </ul>
                    
                    <p>Děkujeme, že jste používali Unroll!</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        Tento email byl odeslán automaticky. Prosím neodpovídejte na něj.
                    </p>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(
            userEmail,
            'Účet byl smazán - Unroll',
            html
        );
    }

    /**
     * Email pro notifikaci o změně hesla
     */
    async sendPasswordChangeNotification(userEmail, userName) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Heslo bylo změněno - Unroll</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #667eea;">Heslo bylo změněno</h1>
                    <p>Ahoj ${userName},</p>
                    <p>vaše heslo v aplikaci Unroll bylo úspěšně změněno.</p>
                    
                    <p><strong>Důležité informace:</strong></p>
                    <ul>
                        <li>Zmeňte bylo provedeno ${new Date().toLocaleString('cs-CZ')}</li>
                        <li>Pokud jste tuto změnu neprovedli, kontaktujte nás co nejdříve</li>
                        <li>Doporučujeme pravidelně měnit hesla pro vyšší bezpečnost</li>
                    </ul>
                    
                    <p>Pokud máte jakékoliv dotazy, neváhejte nás kontaktovat.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        Tento email byl odeslán automaticky. Prosím neodpovídejte na něj.
                    </p>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(
            userEmail,
            'Heslo bylo změněno - Unroll',
            html
        );
    }

    /**
     * Konverze HTML na text
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    /**
     * Test email konfigurace
     */
    async testConnection() {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            await this.transporter.verify();
            logger.info('Email service connection test successful');
            return true;
        } catch (error) {
            logger.error('Email service connection test failed', {
                error: error.message
            });
            return false;
        }
    }
}

module.exports = new EmailService();
