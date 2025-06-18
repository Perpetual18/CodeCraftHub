/*
 * tests/user.test.js
 * Unit and integration tests for User Service using Jest and Supertest.
 *
 * Tests cover user registration, login, profile retrieval, and update.
 * Uses an in-memory MongoDB server for isolated testing.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/userModel');

let mongoServer;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Cleanup database between tests
afterEach(async () => {
  await User.deleteMany({});
});

// Stop in-memory MongoDB server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Service API', () => {
  const userData = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'learner',
  };

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('username', userData.username);
      expect(res.body).toHaveProperty('email', userData.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not register user with existing email', async () => {
      await new User(userData).save();

      const res = await request(app)
        .post('/api/users/register')
        .send({ ...userData, username: 'anotheruser' })
        .expect(409);

      expect(res.body).toHaveProperty('message', 'Email or username already in use');
    });

    it('should fail validation for invalid input', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ username: 'ab', email: 'not-an-email', password: '123' })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/users/register').send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', userData.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: userData.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });

    it('should fail login with non-existing email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('GET /api/users/profile', () => {
    let token;

    beforeEach(async () => {
      await request(app).post('/api/users/register').send(userData);
      const loginRes = await request(app).post('/api/users/login').send({ email: userData.email, password: userData.password });
      token = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', userData.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should fail to get profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/users/profile', () => {
    let token;

    beforeEach(async () => {
      await request(app).post('/api/users/register').send(userData);
      const loginRes = await request(app).post('/api/users/login').send({ email: userData.email, password: userData.password });
      token = loginRes.body.token;
    });

    it('should update user profile successfully', async () => {
      const newUsername = 'updateduser';
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: newUsername })
        .expect(200);

      expect(res.body).toHaveProperty('username', newUsername);
    });

    it('should update password and allow login with new password', async () => {
      const newPassword = 'newStrongPassword123';

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: newPassword })
        .expect(200);

      // Login with new password
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: userData.email, password: newPassword })
        .expect(200);

      expect(loginRes.body).toHaveProperty('token');
    });
  });
});