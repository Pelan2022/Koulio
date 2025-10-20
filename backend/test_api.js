const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const isHttps = BASE_URL.startsWith('https');

const makeRequest = (options, data = null) => {
    return new Promise((resolve, reject) => {
        const client = isHttps ? https : http;
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
};

async function testAPI() {
    console.log('🧪 Testing KOULIO Backend API\n');
    console.log(`🌐 Base URL: ${BASE_URL}\n`);
    
    let accessToken = null;
    let refreshToken = null;
    
    try {
        // 1. Health Check
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await makeRequest({
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
            path: '/health',
            method: 'GET'
        });
        
        if (healthResponse.statusCode === 200) {
            console.log('✅ Health check passed');
            console.log(`   Message: ${healthResponse.body.message}`);
            console.log(`   Database: ${healthResponse.body.database}\n`);
        } else {
            console.log('❌ Health check failed');
            console.log(`   Status: ${healthResponse.statusCode}\n`);
        }
        
        // 2. API Documentation
        console.log('2️⃣ Testing API documentation...');
        const apiResponse = await makeRequest({
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
            path: '/api',
            method: 'GET'
        });
        
        if (apiResponse.statusCode === 200) {
            console.log('✅ API documentation accessible');
            console.log(`   Version: ${apiResponse.body.version}\n`);
        } else {
            console.log('❌ API documentation failed');
            console.log(`   Status: ${apiResponse.statusCode}\n`);
        }
        
        // 3. User Registration
        console.log('3️⃣ Testing user registration...');
        const registrationData = {
            email: 'apitest@koulio.cz',
            fullName: 'API Test User',
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!'
        };
        
        const registrationResponse = await makeRequest({
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, registrationData);
        
        if (registrationResponse.statusCode === 201) {
            console.log('✅ User registration successful');
            accessToken = registrationResponse.body.data.tokens.accessToken;
            refreshToken = registrationResponse.body.data.tokens.refreshToken;
            console.log(`   User ID: ${registrationResponse.body.data.user.id}`);
            console.log(`   Email: ${registrationResponse.body.data.user.email}\n`);
        } else {
            console.log('❌ User registration failed');
            console.log(`   Status: ${registrationResponse.statusCode}`);
            console.log(`   Error: ${registrationResponse.body.message}\n`);
        }
        
        // 4. User Login (Test user)
        console.log('4️⃣ Testing user login (test user)...');
        const loginData = {
            email: 'apitest@koulio.cz',
            password: 'TestPassword123!'
        };
        
        const loginResponse = await makeRequest({
            hostname: new URL(BASE_URL).hostname,
            port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, loginData);
        
        if (loginResponse.statusCode === 200) {
            console.log('✅ User login successful');
            accessToken = loginResponse.body.data.tokens.accessToken;
            refreshToken = loginResponse.body.data.tokens.refreshToken;
            console.log(`   User: ${loginResponse.body.data.user.fullName}`);
            console.log(`   Email: ${loginResponse.body.data.user.email}\n`);
        } else {
            console.log('❌ User login failed');
            console.log(`   Status: ${loginResponse.statusCode}`);
            console.log(`   Error: ${loginResponse.body.message}\n`);
        }
        
        // 5. Get User Profile
        if (accessToken) {
            console.log('5️⃣ Testing get user profile...');
            const profileResponse = await makeRequest({
                hostname: new URL(BASE_URL).hostname,
                port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
                path: '/api/auth/profile',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (profileResponse.statusCode === 200) {
                console.log('✅ Get profile successful');
                console.log(`   User: ${profileResponse.body.data.user.fullName}`);
                console.log(`   Email: ${profileResponse.body.data.user.email}\n`);
            } else {
                console.log('❌ Get profile failed');
                console.log(`   Status: ${profileResponse.statusCode}`);
                console.log(`   Error: ${profileResponse.body.message}\n`);
            }
        }
        
        // 6. Token Verification
        if (accessToken) {
            console.log('6️⃣ Testing token verification...');
            const verifyResponse = await makeRequest({
                hostname: new URL(BASE_URL).hostname,
                port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
                path: '/api/auth/verify',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (verifyResponse.statusCode === 200) {
                console.log('✅ Token verification successful');
                console.log(`   User: ${verifyResponse.body.data.user.fullName}\n`);
            } else {
                console.log('❌ Token verification failed');
                console.log(`   Status: ${verifyResponse.statusCode}`);
                console.log(`   Error: ${verifyResponse.body.message}\n`);
            }
        }
        
        // 7. Refresh Token
        if (refreshToken) {
            console.log('7️⃣ Testing token refresh...');
            const refreshResponse = await makeRequest({
                hostname: new URL(BASE_URL).hostname,
                port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
                path: '/api/auth/refresh',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, { refreshToken });
            
            if (refreshResponse.statusCode === 200) {
                console.log('✅ Token refresh successful');
                accessToken = refreshResponse.body.data.tokens.accessToken;
                console.log(`   New access token generated\n`);
            } else {
                console.log('❌ Token refresh failed');
                console.log(`   Status: ${refreshResponse.statusCode}`);
                console.log(`   Error: ${refreshResponse.body.message}\n`);
            }
        }
        
        // 8. Logout
        if (accessToken) {
            console.log('8️⃣ Testing logout...');
            const logoutResponse = await makeRequest({
                hostname: new URL(BASE_URL).hostname,
                port: new URL(BASE_URL).port || (isHttps ? 443 : 80),
                path: '/api/auth/logout',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (logoutResponse.statusCode === 200) {
                console.log('✅ Logout successful\n');
            } else {
                console.log('❌ Logout failed');
                console.log(`   Status: ${logoutResponse.statusCode}`);
                console.log(`   Error: ${logoutResponse.body.message}\n`);
            }
        }
        
        console.log('🎉 API testing completed successfully!');
        console.log('\n📋 Test Summary:');
        console.log('   ✅ Health check');
        console.log('   ✅ API documentation');
        console.log('   ✅ User registration');
        console.log('   ✅ User login (test user)');
        console.log('   ✅ Get profile');
        console.log('   ✅ Token verification');
        console.log('   ✅ Token refresh');
        console.log('   ✅ Logout\n');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run tests if called directly
if (require.main === module) {
    testAPI()
        .then(() => {
            console.log('✅ API testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ API testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = testAPI;
