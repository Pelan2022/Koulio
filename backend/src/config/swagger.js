const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Unroll Backend API',
            version: '1.0.0',
            description: 'REST API for Unroll application with PostgreSQL and JWT authentication',
            contact: {
                name: 'Unroll Team',
                email: 'admin@unroll.cz'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.FRONTEND_URL || 'https://unrollit.aici.cz',
                description: 'Production server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Unique user identifier'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        fullName: {
                            type: 'string',
                            description: 'User full name'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'user', 'guest'],
                            description: 'User role'
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether user account is active'
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            description: 'Whether user email is verified'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Account creation timestamp'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp'
                        },
                        lastLoginAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last login timestamp'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            description: 'User password'
                        },
                        rememberMe: {
                            type: 'boolean',
                            description: 'Whether to remember user session'
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'fullName', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        fullName: {
                            type: 'string',
                            minLength: 2,
                            description: 'User full name'
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                            description: 'User password'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Whether the request was successful'
                        },
                        message: {
                            type: 'string',
                            description: 'Response message'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    $ref: '#/components/schemas/User'
                                },
                                accessToken: {
                                    type: 'string',
                                    description: 'JWT access token'
                                },
                                refreshToken: {
                                    type: 'string',
                                    description: 'JWT refresh token'
                                },
                                expiresIn: {
                                    type: 'string',
                                    description: 'Token expiration time'
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Detailed error messages'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/models/*.js'
    ]
};

const specs = swaggerJSDoc(options);

// Custom CSS for Swagger UI
const customCss = `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #667eea; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
`;

const swaggerOptions = {
    customCss,
    customSiteTitle: 'Unroll API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
};

module.exports = {
    specs,
    swaggerUi,
    swaggerOptions
};
