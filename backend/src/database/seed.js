const User = require('../models/User');
const database = require('../config/database');
const logger = require('../utils/logger');

async function seedDatabase() {
    try {
        logger.info('Starting database seeding...');
        
        // Connect to database
        await database.connect();
        
        
        // Create additional test users
        const testUsers = [
            {
                email: 'test1@koulio.cz',
                fullName: 'Test User 1',
                password: 'TestPassword123!'
            },
            {
                email: 'test2@koulio.cz',
                fullName: 'Test User 2',
                password: 'TestPassword123!'
            }
        ];
        
        for (const userData of testUsers) {
            const existingUser = await User.findByEmail(userData.email);
            if (!existingUser) {
                const user = await User.create(userData);
                logger.info('Test user created:', {
                    id: user.id,
                    email: user.email
                });
            } else {
                logger.info('Test user already exists:', {
                    id: existingUser.id,
                    email: existingUser.email
                });
            }
        }
        
        // Get user statistics
        const userCount = await User.count();
        logger.info(`Total users in database: ${userCount}`);
        
        logger.info('Database seeding completed successfully');
        
    } catch (error) {
        logger.error('Seeding failed:', error);
        throw error;
    } finally {
        await database.disconnect();
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            logger.info('✅ Database seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('❌ Database seeding failed:', { message: error.message, stack: error.stack });
            process.exit(1);
        });
}

module.exports = seedDatabase;
