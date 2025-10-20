const fs = require('fs');
const path = require('path');
const database = require('../config/database');
const logger = require('../config/logger');

async function runMigrations() {
    try {
        logger.info('Starting database migration...');
        
        // Connect to database
        await database.connect();
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await database.query(schema);
        
        logger.info('Database migration completed successfully');
        
        // Verify tables were created
        const tablesResult = await database.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        logger.info('Created tables:', tablesResult.rows.map(row => row.table_name));
        
        // Check demo user
        const demoUserResult = await database.query(`
            SELECT id, email, full_name, created_at 
            FROM users 
            WHERE email = 'demo@koulio.cz'
        `);
        
        if (demoUserResult.rows.length > 0) {
            logger.info('Demo user found:', demoUserResult.rows[0]);
        } else {
            logger.warn('Demo user not found');
        }
        
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    } finally {
        await database.disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        });
}

module.exports = runMigrations;
