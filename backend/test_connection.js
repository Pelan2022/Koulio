#!/usr/bin/env node

// Simple connection test script for Unroll Backend
const { Pool } = require('pg');

async function testConnection() {
    console.log('🔍 Testing database connection...');
    
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'unroll_db',
        user: process.env.DB_USER || 'unroll_user',
        password: process.env.DB_PASSWORD,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: false
    });

    try {
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('📊 Database info:');
        console.log(`   Current time: ${result.rows[0].current_time}`);
        console.log(`   PostgreSQL version: ${result.rows[0].postgres_version}`);
        
        // Test table access
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Available tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        client.release();
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        console.error('   Detail:', error.detail);
        
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Check if DB_HOST is correct');
        console.log('   2. Verify DB_PORT is accessible');
        console.log('   3. Confirm DB_NAME exists');
        console.log('   4. Validate DB_USER has access');
        console.log('   5. Ensure DB_PASSWORD is correct');
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the test
testConnection().catch(console.error);

