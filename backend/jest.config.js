module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!src/database/migrate.js',
        '!src/database/seed.js'
    ],
    
    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    
    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    
    // Verbose output
    verbose: true,
    
    // Transform files
    transform: {},
    
    // Module name mapping
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    
    // Global variables
    globals: {
        'process.env.NODE_ENV': 'test'
    },
    
    // Test results processor
    testResultsProcessor: undefined,
    
    // Watch plugins
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
    ]
};
