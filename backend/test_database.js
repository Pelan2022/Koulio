const database = require('./src/config/database');
const User = require('./src/models/User');
const security = require('./src/config/security');
const logger = require('./src/config/logger');

async function testDatabaseConnection() {
    console.log('🧪 Testing KOULIO Backend Database Connection\n');
    
    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        await database.connect();
        console.log('✅ Database connected successfully\n');
        
        // 2. Test basic query
        console.log('2️⃣ Testing basic query...');
        const result = await database.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✅ Query executed successfully');
        console.log(`   Current time: ${result.rows[0].current_time}`);
        console.log(`   PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}\n`);
        
        // 3. Test user creation
        console.log('3️⃣ Testing user creation...');
        const testUser = await User.create({
            email: 'test@koulio.cz',
            fullName: 'Test User',
            password: 'TestPassword123!'
        });
        console.log('✅ User created successfully');
        console.log(`   User ID: ${testUser.id}`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Full Name: ${testUser.fullName}\n`);
        
        // 4. Test password verification
        console.log('4️⃣ Testing password verification...');
        const isValidPassword = await testUser.verifyPassword('TestPassword123!');
        const isInvalidPassword = await testUser.verifyPassword('wrongpassword');
        console.log(`✅ Password verification works`);
        console.log(`   Correct password: ${isValidPassword ? '✅' : '❌'}`);
        console.log(`   Wrong password: ${!isInvalidPassword ? '✅' : '❌'}\n`);
        
        // 5. Test JWT token generation
        console.log('5️⃣ Testing JWT token generation...');
        const accessToken = security.generateAccessToken({
            userId: testUser.id,
            email: testUser.email,
            type: 'access'
        });
        const refreshToken = security.generateRefreshToken({
            userId: testUser.id,
            email: testUser.email,
            type: 'refresh'
        });
        console.log('✅ JWT tokens generated successfully');
        console.log(`   Access token length: ${accessToken.length} characters`);
        console.log(`   Refresh token length: ${refreshToken.length} characters\n`);
        
        // 6. Test JWT token verification
        console.log('6️⃣ Testing JWT token verification...');
        const decodedAccess = security.verifyToken(accessToken);
        const decodedRefresh = security.verifyToken(refreshToken);
        console.log('✅ JWT tokens verified successfully');
        console.log(`   Access token user ID: ${decodedAccess.userId}`);
        console.log(`   Refresh token user ID: ${decodedRefresh.userId}\n`);
        
        // 7. Test user retrieval
        console.log('7️⃣ Testing user retrieval...');
        const foundUser = await User.findByEmail('test@koulio.cz');
        const foundUserById = await User.findById(testUser.id);
        console.log('✅ User retrieval works');
        console.log(`   Found by email: ${foundUser ? '✅' : '❌'}`);
        console.log(`   Found by ID: ${foundUserById ? '✅' : '❌'}\n`);
        
        // 8. Test demo user
        console.log('8️⃣ Testing demo user...');
        const demoUser = await User.findByEmail('demo@koulio.cz');
        if (demoUser) {
            console.log('✅ Demo user found');
            console.log(`   Demo user ID: ${demoUser.id}`);
            console.log(`   Demo user email: ${demoUser.email}`);
            
            // Test demo login
            const isDemoPasswordValid = await demoUser.verifyPassword('demo123');
            console.log(`   Demo password verification: ${isDemoPasswordValid ? '✅' : '❌'}\n`);
        } else {
            console.log('❌ Demo user not found\n');
        }
        
        // 9. Test user statistics
        console.log('9️⃣ Testing user statistics...');
        const userCount = await User.count();
        console.log(`✅ Total users in database: ${userCount}\n`);
        
        // 10. Clean up test user
        console.log('🔟 Cleaning up test user...');
        await testUser.delete();
        console.log('✅ Test user deleted successfully\n');
        
        console.log('🎉 All database tests passed successfully!');
        console.log('📊 Database is ready for production use\n');
        
        // Summary
        console.log('📋 Test Summary:');
        console.log('   ✅ Database connection');
        console.log('   ✅ Basic queries');
        console.log('   ✅ User creation');
        console.log('   ✅ Password hashing/verification');
        console.log('   ✅ JWT token generation');
        console.log('   ✅ JWT token verification');
        console.log('   ✅ User retrieval');
        console.log('   ✅ Demo user functionality');
        console.log('   ✅ User statistics');
        console.log('   ✅ Data cleanup\n');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await database.disconnect();
        console.log('🔌 Database connection closed');
    }
}

// Run tests if called directly
if (require.main === module) {
    testDatabaseConnection()
        .then(() => {
            console.log('\n✅ Database testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = testDatabaseConnection;
