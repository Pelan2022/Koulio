const request = require('supertest');
const app = require('../app');

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                fullName: 'Test User',
                password: 'TestPassword123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
        });

        it('should fail with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                fullName: 'Test User',
                password: 'TestPassword123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message');
        });

        it('should fail with weak password', async () => {
            const userData = {
                email: 'test@example.com',
                fullName: 'Test User',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail with duplicate email', async () => {
            const userData = {
                email: 'existing@example.com',
                fullName: 'Test User',
                password: 'TestPassword123!'
            };

            // First registration should succeed
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Second registration with same email should fail
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Register a test user
            const userData = {
                email: 'logintest@example.com',
                fullName: 'Login Test User',
                password: 'TestPassword123!'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'logintest@example.com',
                password: 'TestPassword123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data).toHaveProperty('user');
        });

        it('should fail with invalid credentials', async () => {
            const loginData = {
                email: 'logintest@example.com',
                password: 'WrongPassword123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Invalid credentials');
        });

        it('should fail with non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'TestPassword123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/auth/refresh', () => {
        let refreshToken;

        beforeEach(async () => {
            // Register and login to get refresh token
            const userData = {
                email: 'refreshtest@example.com',
                fullName: 'Refresh Test User',
                password: 'TestPassword123!'
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            refreshToken = registerResponse.body.data.refreshToken;
        });

        it('should refresh access token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('expiresIn');
        });

        it('should fail with invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail without refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let accessToken;

        beforeEach(async () => {
            // Register and login to get access token
            const userData = {
                email: 'profiletest@example.com',
                fullName: 'Profile Test User',
                password: 'TestPassword123!'
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            accessToken = registerResponse.body.data.accessToken;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('email', 'profiletest@example.com');
        });

        it('should fail without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/auth/logout', () => {
        let accessToken, refreshToken;

        beforeEach(async () => {
            // Register and login to get tokens
            const userData = {
                email: 'logouttest@example.com',
                fullName: 'Logout Test User',
                password: 'TestPassword123!'
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            accessToken = registerResponse.body.data.accessToken;
            refreshToken = registerResponse.body.data.refreshToken;
        });

        it('should logout successfully with valid tokens', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Logged out successfully');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .send({ refreshToken })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});
