const request = require('supertest');
const app = require('../server');

describe('Maijjd API Endpoints', () => {
  let authToken;
  let testUserId;

  describe('Health Check', () => {
    test('GET /api/health should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Maijjd API is running');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Welcome to Maijjd API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('auth');
      expect(response.body.endpoints).toHaveProperty('users');
      expect(response.body.endpoints).toHaveProperty('contact');
      expect(response.body.endpoints).toHaveProperty('software');
      expect(response.body.endpoints).toHaveProperty('services');
    });
  });

  describe('Services Endpoint', () => {
    test('GET /api/services should return all services', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Services retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const service = response.body.data[0];
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('price');
      expect(service).toHaveProperty('category');
      expect(service).toHaveProperty('features');
      expect(service).toHaveProperty('icon');
      expect(service).toHaveProperty('color');
    });
  });

  describe('Software Endpoint', () => {
    test('GET /api/software should return all software', async () => {
      const response = await request(app)
        .get('/api/software')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'All software retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const software = response.body.data[0];
      expect(software).toHaveProperty('id');
      expect(software).toHaveProperty('name');
      expect(software).toHaveProperty('description');
      expect(software).toHaveProperty('version');
      expect(software).toHaveProperty('price');
      expect(software).toHaveProperty('category');
      expect(software).toHaveProperty('features');
      expect(software).toHaveProperty('image');
    });
  });

  describe('Users Endpoint', () => {
    test('GET /api/users should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Users retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('lastLogin');
    });
  });

  describe('Contact Endpoint', () => {
    test('POST /api/contact should create a new contact request', async () => {
      const contactData = {
        name: 'Test Contact',
        email: 'contact@test.com',
        message: 'This is a test contact message',
        subject: 'API Testing'
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Contact request submitted successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', contactData.name);
      expect(response.body.data).toHaveProperty('email', contactData.email);
      expect(response.body.data).toHaveProperty('message', contactData.message);
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    test('POST /api/contact should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ name: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register should register a new user', async () => {
      const userData = {
        name: 'Test User Registration',
        email: 'register@test.com',
        password: 'testpassword123',
        confirmPassword: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      const user = response.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name', userData.name);
      expect(user).toHaveProperty('email', userData.email);
      expect(user).toHaveProperty('role', 'user');
      expect(user).toHaveProperty('createdAt');

      // Store for later tests
      testUserId = user.id;
      authToken = response.body.data.token;
    });

    test('POST /api/auth/register should validate password confirmation', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    test('POST /api/auth/login should authenticate valid user', async () => {
      const loginData = {
        email: 'register@test.com',
        password: 'testpassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');

      const user = response.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email', loginData.email);
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const loginData = {
        email: 'register@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
      expect(response.body).toHaveProperty('message', 'Email or password is incorrect');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('CORS and Security', () => {
    test('Should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/contact')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Response Format', () => {
    test('All successful responses should have consistent format', async () => {
      const endpoints = ['/api/health', '/api/services', '/api/software', '/api/users'];
      
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
      }
    });
  });
});
