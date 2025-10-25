#!/usr/bin/env node

// Simple server test script for Unroll Backend
const http = require('http');

console.log('🧪 Testing Unroll Backend Server...');

// Test if the server can start
async function testServer() {
    try {
        // Try to require the app
        console.log('📦 Loading application modules...');
        const app = require('./src/app');
        console.log('✅ Application modules loaded successfully');
        
        // Create a test server
        const server = http.createServer(app);
        
        // Test server creation
        server.listen(0, 'localhost', () => {
            const port = server.address().port;
            console.log(`✅ Test server started on port ${port}`);
            
            // Test health endpoint
            const options = {
                hostname: 'localhost',
                port: port,
                path: '/health',
                method: 'GET'
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log('📊 Health check response:');
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
                    console.log(`   Body: ${data}`);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ Health check passed!');
                    } else {
                        console.log('⚠️  Health check returned non-200 status');
                    }
                    
                    server.close();
                    console.log('🏁 Test completed');
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ Health check request failed:', error.message);
                server.close();
            });
            
            req.end();
        });
        
        server.on('error', (error) => {
            console.error('❌ Server creation failed:', error.message);
            process.exit(1);
        });
        
    } catch (error) {
        console.error('❌ Failed to load application:');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

// Run the test
testServer().catch(console.error);

