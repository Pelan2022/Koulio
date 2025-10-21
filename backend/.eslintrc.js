module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'prettier'
    ],
    plugins: [
        'prettier'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        // Prettier rules
        'prettier/prettier': 'error',
        
        // General rules
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-unused-vars': ['error', { 
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_' 
        }],
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-arrow-callback': 'error',
        
        // Code style
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-before-function-paren': ['error', 'always'],
        'keyword-spacing': 'error',
        'space-infix-ops': 'error',
        'eol-last': 'error',
        'no-trailing-spaces': 'error',
        
        // Best practices
        'eqeqeq': ['error', 'always'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-return-assign': 'error',
        'no-self-compare': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'prefer-promise-reject-errors': 'error',
        'radix': 'error',
        'wrap-iife': 'error',
        'yoda': 'error',
        
        // Security
        'no-alert': 'error',
        'no-caller': 'error',
        'no-implied-eval': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',
        'no-process-exit': 'error',
        'no-sync': 'warn',
        
        // Node.js specific
        'handle-callback-err': 'error',
        'no-mixed-requires': 'error',
        'no-new-require': 'error',
        'no-path-concat': 'error',
        'no-process-env': 'warn',
        'no-process-exit': 'error',
        'no-restricted-modules': 'off',
        'no-sync': 'warn'
    },
    globals: {
        // Jest globals
        'describe': 'readonly',
        'it': 'readonly',
        'expect': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly',
        'beforeAll': 'readonly',
        'afterAll': 'readonly',
        'jest': 'readonly'
    },
    overrides: [
        {
            files: ['**/*.test.js', '**/*.spec.js'],
            env: {
                jest: true
            },
            rules: {
                'no-console': 'off',
                'no-unused-expressions': 'off'
            }
        },
        {
            files: ['scripts/**/*.js'],
            rules: {
                'no-console': 'off',
                'no-process-exit': 'off'
            }
        }
    ]
};
