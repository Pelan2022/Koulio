const { config } = require('dotenv');

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/koulio_test';

// Mock logger for tests
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    auth: {
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        tokenRefresh: jest.fn()
    },
    database: {
        query: jest.fn(),
        error: jest.fn(),
        connection: jest.fn()
    },
    security: {
        rateLimit: jest.fn(),
        suspiciousActivity: jest.fn(),
        invalidToken: jest.fn()
    },
    metrics: {
        performance: jest.fn(),
        health: jest.fn()
    }
}));

// Mock email service for tests
jest.mock('../services/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    sendRegistrationConfirmation: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    sendPasswordReset: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    sendAccountDeletionNotification: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    sendPasswordChangeNotification: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    testConnection: jest.fn().mockResolvedValue(true)
}));

// Mock export service for tests
jest.mock('../services/exportService', () => ({
    exportData: jest.fn().mockResolvedValue({
        filename: 'test-export.csv',
        filepath: '/tmp/test-export.csv',
        contentType: 'text/csv',
        size: 1024
    }),
    readExportFile: jest.fn().mockResolvedValue(Buffer.from('test,data\n1,2')),
    cleanupTempFiles: jest.fn().mockResolvedValue(0),
    getTempFilesInfo: jest.fn().mockResolvedValue([])
}));

// Global test utilities
global.testUtils = {
    // Generate test JWT token
    generateTestToken: (payload = {}) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { 
                userId: 'test-user-id',
                email: 'test@example.com',
                role: 'user',
                ...payload 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    },

    // Generate test refresh token
    generateTestRefreshToken: (payload = {}) => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            { 
                userId: 'test-user-id',
                type: 'refresh',
                ...payload 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    },

    // Mock user data
    mockUser: {
        id: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        toJSON: function() {
            return {
                id: this.id,
                email: this.email,
                fullName: this.fullName,
                role: this.role,
                isActive: this.isActive,
                isEmailVerified: this.isEmailVerified,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                lastLoginAt: this.lastLoginAt
            };
        }
    },

    // Mock admin user data
    mockAdminUser: {
        id: 'test-admin-id',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        toJSON: function() {
            return {
                id: this.id,
                email: this.email,
                fullName: this.fullName,
                role: this.role,
                isActive: this.isActive,
                isEmailVerified: this.isEmailVerified,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                lastLoginAt: this.lastLoginAt
            };
        }
    },

    // Clean up mocks
    cleanupMocks: () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    },

    // Wait for async operations
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup and teardown for each test
beforeEach(() => {
    global.testUtils.cleanupMocks();
});

afterEach(() => {
    global.testUtils.cleanupMocks();
});

// Global teardown
afterAll(async () => {
    // Clean up any test databases or connections
    try {
        const database = require('../config/database');
        await database.disconnect();
    } catch (error) {
        console.warn('Error during test teardown:', error.message);
    }
});
