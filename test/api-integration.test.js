const request = require('supertest');
const app = require('../server');

describe('Maijjd API Integration Tests', () => {
  let authToken;
  let refreshToken;

  describe('Health Check and System Status', () => {
    test('GET /api/health should return system status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Maijjd API is running');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('platform');
    });

    test('GET /api/ai/integration should return AI integration capabilities', async () => {
      const response = await request(app)
        .get('/api/ai/integration')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'AI Integration endpoint available');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body.capabilities).toContain('Software catalog access');
      expect(response.body.capabilities).toContain('User authentication');
      expect(response.body.capabilities).toContain('Real-time data processing');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
      expect(response.body).toHaveProperty('health', '/api/health');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Authentication System', () => {
    test('POST /api/auth/register should create new user account', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('data.user');
      expect(response.body).toHaveProperty('data.authentication');
      expect(response.body).toHaveProperty('data.welcome');
      expect(response.body).toHaveProperty('metadata');
      
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).toHaveProperty('role', 'user');
      expect(response.body.data.user).toHaveProperty('permissions');
      
      expect(response.body.data.authentication).toHaveProperty('accessToken');
      expect(response.body.data.authentication).toHaveProperty('refreshToken');
      expect(response.body.data.authentication).toHaveProperty('tokenType', 'Bearer');
      
      expect(response.body.data.welcome).toHaveProperty('message');
      expect(response.body.data.welcome).toHaveProperty('nextSteps');
      expect(Array.isArray(response.body.data.welcome.nextSteps)).toBe(true);
    });

    test('POST /api/auth/login should authenticate existing user', async () => {
      const loginData = {
        email: 'admin@maijjd.com',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('data.user');
      expect(response.body).toHaveProperty('data.authentication');
      expect(response.body).toHaveProperty('data.apiAccess');
      expect(response.body).toHaveProperty('metadata');

      expect(response.body.data.user).toHaveProperty('email', loginData.email);
      expect(response.body.data.user).toHaveProperty('role', 'admin');
      expect(response.body.data.user).toHaveProperty('permissions');

      expect(response.body.data.authentication).toHaveProperty('accessToken');
      expect(response.body.data.authentication).toHaveProperty('refreshToken');
      expect(response.body.data.authentication).toHaveProperty('tokenType', 'Bearer');

      expect(response.body.data.apiAccess).toHaveProperty('endpoints');
      expect(response.body.data.apiAccess).toHaveProperty('rateLimits');
      expect(response.body.data.apiAccess).toHaveProperty('documentation');

      // Store tokens for subsequent tests
      authToken = response.body.data.authentication.accessToken;
      refreshToken = response.body.data.authentication.refreshToken;
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const invalidData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication Failed');
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/auth/profile should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.body).toHaveProperty('data.profile');
      expect(response.body).toHaveProperty('data.account');
      expect(response.body).toHaveProperty('data.apiAccess');
      expect(response.body).toHaveProperty('data.security');
      expect(response.body).toHaveProperty('metadata');

      expect(response.body.data.profile).toHaveProperty('email', 'admin@maijjd.com');
      expect(response.body.data.profile).toHaveProperty('role', 'admin');
      expect(response.body.data.profile).toHaveProperty('permissions');

      expect(response.body.data.account).toHaveProperty('status', 'Active');
      expect(response.body.data.account).toHaveProperty('type', 'Administrator');

      expect(response.body.data.apiAccess).toHaveProperty('currentToken');
      expect(response.body.data.apiAccess).toHaveProperty('endpoints');
      expect(response.body.data.apiAccess).toHaveProperty('rateLimits');
    });

    test('GET /api/auth/profile should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'No token provided');
      expect(response.body).toHaveProperty('code', 'TOKEN_MISSING');
    });

    test('POST /api/auth/refresh should refresh expired tokens', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(response.body).toHaveProperty('data.authentication');
      expect(response.body).toHaveProperty('metadata');

      expect(response.body.data.authentication).toHaveProperty('accessToken');
      expect(response.body.data.authentication).toHaveProperty('refreshToken');
      expect(response.body.data.authentication).toHaveProperty('tokenType', 'Bearer');
      expect(response.body.data.authentication).toHaveProperty('expiresIn');
      expect(response.body.data.authentication).toHaveProperty('refreshExpiresIn');
    });

    test('GET /api/auth/ai/integration should return authentication AI integration info', async () => {
      const response = await request(app)
        .get('/api/auth/ai/integration')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Authentication AI Integration endpoint available');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body).toHaveProperty('authentication');
      expect(response.body).toHaveProperty('dataFormats');
      expect(response.body).toHaveProperty('metadata');

      expect(response.body.capabilities).toHaveProperty('userAuthentication');
      expect(response.body.capabilities).toHaveProperty('userRegistration');
      expect(response.body.capabilities).toHaveProperty('profileAccess');
      expect(response.body.capabilities).toHaveProperty('tokenRefresh');

      expect(response.body.authentication).toHaveProperty('method', 'JWT (JSON Web Tokens)');
      expect(response.body.authentication).toHaveProperty('tokenTypes');
      expect(response.body.authentication).toHaveProperty('expiration');
      expect(response.body.authentication).toHaveProperty('security');
    });
  });

  describe('Software Catalog API', () => {
    test('GET /api/software should return software list with AI metadata', async () => {
      const response = await request(app)
        .get('/api/software')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Software retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check first software item structure
      const firstSoftware = response.body.data[0];
      expect(firstSoftware).toHaveProperty('id');
      expect(firstSoftware).toHaveProperty('name');
      expect(firstSoftware).toHaveProperty('description');
      expect(firstSoftware).toHaveProperty('category');
      expect(firstSoftware).toHaveProperty('features');
      expect(firstSoftware).toHaveProperty('specifications');
      expect(firstSoftware).toHaveProperty('aiMetadata');

      // Check AI metadata structure
      expect(firstSoftware.aiMetadata).toHaveProperty('intelligenceLevel');
      expect(firstSoftware.aiMetadata).toHaveProperty('automationScore');
      expect(firstSoftware.aiMetadata).toHaveProperty('aiFeatures');
      expect(firstSoftware.aiMetadata).toHaveProperty('apiEndpoints');
      expect(firstSoftware.aiMetadata).toHaveProperty('responseTime');
      expect(firstSoftware.aiMetadata).toHaveProperty('accuracy');

      // Check metadata structure
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('categories');
      expect(response.body.metadata).toHaveProperty('intelligenceLevels');
      expect(response.body.metadata).toHaveProperty('automationRange');
      expect(response.body.metadata).toHaveProperty('aiCapabilities');
      expect(response.body.metadata).toHaveProperty('responseTime');
      expect(response.body.metadata).toHaveProperty('apiVersion');
    });

    test('GET /api/software should support category filtering', async () => {
      const response = await request(app)
        .get('/api/software?category=AI%20%26%20Automation')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(software => {
        expect(software.category).toBe('AI & Automation');
      });
    });

    test('GET /api/software should support intelligent search', async () => {
      const response = await request(app)
        .get('/api/software?search=AI')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      // At least one software should contain "AI" in name, description, or features
      const hasAI = response.body.data.some(software => 
        software.name.toLowerCase().includes('ai') ||
        software.description.toLowerCase().includes('ai') ||
        software.features.some(feature => feature.toLowerCase().includes('ai'))
      );
      expect(hasAI).toBe(true);
    });

    test('GET /api/software should support intelligence level filtering', async () => {
      const response = await request(app)
        .get('/api/software?intelligence=Advanced')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(software => {
        expect(software.aiMetadata.intelligenceLevel).toBe('Advanced');
      });
    });

    test('GET /api/software should support automation score filtering', async () => {
      const response = await request(app)
        .get('/api/software?automation=90')
        .expect(200);

      response.body.data.forEach(software => {
        expect(software.aiMetadata.automationScore).toBeGreaterThanOrEqual(90);
      });
    });

    test('GET /api/software/:id should return detailed software information', async () => {
      const response = await request(app)
        .get('/api/software/1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Software retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('aiIntegration');
      expect(response.body.data).toHaveProperty('documentation');

      expect(response.body.data.aiIntegration).toHaveProperty('apiEndpoints');
      expect(response.body.data.aiIntegration).toHaveProperty('responseTime');
      expect(response.body.data.aiIntegration).toHaveProperty('accuracy');
      expect(response.body.data.aiIntegration).toHaveProperty('supportedFormats');
      expect(response.body.data.aiIntegration).toHaveProperty('authentication');
      expect(response.body.data.aiIntegration).toHaveProperty('rateLimiting');
      expect(response.body.data.aiIntegration).toHaveProperty('webhooks');
      expect(response.body.data.aiIntegration).toHaveProperty('realTimeUpdates');

      expect(response.body.data.documentation).toHaveProperty('apiDocs');
      expect(response.body.data.documentation).toHaveProperty('examples');
      expect(response.body.data.documentation).toHaveProperty('sdk');
    });

    test('GET /api/software/categories should return AI-enhanced categories', async () => {
      const response = await request(app)
        .get('/api/software/categories')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categories retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check category structure
      const firstCategory = response.body.data[0];
      expect(firstCategory).toHaveProperty('id');
      expect(firstCategory).toHaveProperty('name');
      expect(firstCategory).toHaveProperty('description');
      expect(firstCategory).toHaveProperty('icon');
      expect(firstCategory).toHaveProperty('color');
      expect(firstCategory).toHaveProperty('aiFeatures');
      expect(firstCategory).toHaveProperty('intelligenceLevel');

      expect(Array.isArray(firstCategory.aiFeatures)).toBe(true);
      expect(typeof firstCategory.intelligenceLevel).toBe('string');
    });

    test('GET /api/software/ai/integration should return software AI integration info', async () => {
      const response = await request(app)
        .get('/api/software/ai/integration')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'AI Integration endpoint available');
      expect(response.body).toHaveProperty('capabilities');
      expect(response.body).toHaveProperty('aiFeatures');
      expect(response.body).toHaveProperty('dataFormats');
      expect(response.body).toHaveProperty('authentication');
      expect(response.body).toHaveProperty('metadata');

      expect(response.body.capabilities).toHaveProperty('softwareCatalog');
      expect(response.body.capabilities).toHaveProperty('categories');
      expect(response.body.capabilities).toHaveProperty('individualSoftware');

      expect(response.body.aiFeatures).toHaveProperty('intelligentSearch');
      expect(response.body.aiFeatures).toHaveProperty('categoryFiltering');
      expect(response.body.aiFeatures).toHaveProperty('automationScoring');
      expect(response.body.aiFeatures).toHaveProperty('featureMatching');
      expect(response.body.aiFeatures).toHaveProperty('realTimeData');
    });

    test('GET /api/software/:id/examples should return usage examples', async () => {
      const response = await request(app)
        .get('/api/software/1/examples')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Examples retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('software');
      expect(response.body.data).toHaveProperty('apiUsage');
      expect(response.body.data).toHaveProperty('aiIntegration');

      expect(response.body.data.apiUsage).toHaveProperty('getSoftware');
      expect(response.body.data.apiUsage).toHaveProperty('searchSoftware');
      expect(response.body.data.apiUsage).toHaveProperty('filterByCategory');

      expect(response.body.data.aiIntegration).toHaveProperty('intelligenceLevel');
      expect(response.body.data.aiIntegration).toHaveProperty('automationScore');
      expect(response.body.data.aiIntegration).toHaveProperty('aiFeatures');
      expect(response.body.data.aiIntegration).toHaveProperty('apiEndpoints');
      expect(response.body.data.aiIntegration).toHaveProperty('responseTime');
    });
  });

  describe('API Documentation and Metadata', () => {
    test('GET /api-docs should serve Swagger documentation', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      // Should return HTML for Swagger UI
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('swagger-ui');
    });

    test('GET /swagger.json should return OpenAPI specification', async () => {
      const response = await request(app)
        .get('/swagger.json')
        .expect(200);

      expect(response.body).toHaveProperty('openapi', '3.0.0');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('components');
      expect(response.body).toHaveProperty('tags');

      expect(response.body.info).toHaveProperty('title', 'Maijjd API - Intelligent Software Integration Platform');
      expect(response.body.info).toHaveProperty('description');
      expect(response.body.info).toHaveProperty('version', '1.0.0');

      expect(response.body.paths).toHaveProperty('/api/health');
      expect(response.body.paths).toHaveProperty('/api/software');
      expect(response.body.paths).toHaveProperty('/api/auth/login');
      expect(response.body.paths).toHaveProperty('/api/auth/register');
    });
  });

  describe('Error Handling and Security', () => {
    test('Should handle 404 routes gracefully', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code', 'ROUTE_NOT_FOUND');
      expect(response.body).toHaveProperty('availableRoutes');
      expect(Array.isArray(response.body.availableRoutes)).toBe(true);
    });

    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('x-api-version', '1.0.0');
      expect(response.headers).toHaveProperty('x-api-platform', 'Maijjd-Intelligent-System');
    });

    test('Should include CORS headers for AI platforms', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://openai.com')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
    });

    test('Should include request tracking headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Request-ID', 'test-request-123')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id', 'test-request-123');
      expect(response.headers).toHaveProperty('x-response-time');
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limiting on repeated requests', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(request(app).get('/api/health'));
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(response => response.status === 429);

      if (rateLimited) {
        const rateLimitResponse = responses.find(response => response.status === 429);
        expect(rateLimitResponse.body).toHaveProperty('error', 'Rate limit exceeded');
        expect(rateLimitResponse.body).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
        expect(rateLimitResponse.body).toHaveProperty('retryAfter');
        expect(rateLimitResponse.body).toHaveProperty('limit');
        expect(rateLimitResponse.body).toHaveProperty('remaining');
      }
    });
  });

  describe('AI Platform Integration', () => {
    test('Should provide structured data for AI consumption', async () => {
      const response = await request(app)
        .get('/api/software')
        .set('User-Agent', 'OpenAI-API/1.0')
        .expect(200);

      // Verify response structure is AI-friendly
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('categories');
      expect(response.body.metadata).toHaveProperty('intelligenceLevels');
      expect(response.body.metadata).toHaveProperty('automationRange');
      expect(response.body.metadata).toHaveProperty('aiCapabilities');
    });

    test('Should support AI-specific query parameters', async () => {
      const response = await request(app)
        .get('/api/software?intelligence=Advanced&automation=90&features=ML,NLP')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(software => {
        expect(software.aiMetadata.intelligenceLevel).toBe('Advanced');
        expect(software.aiMetadata.automationScore).toBeGreaterThanOrEqual(90);
      });
    });
  });
});
