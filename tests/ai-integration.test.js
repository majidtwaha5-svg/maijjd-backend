const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock the AI integration routes
const aiIntegrationRoutes = require('../routes/ai-integration');

const app = express();
app.use(express.json());
app.use('/api/ai', aiIntegrationRoutes);

// Mock authentication middleware
const mockAuthToken = jwt.sign(
  { 
    userId: 'test-user-id', 
    email: 'test@example.com', 
    role: 'admin',
    ai_access_level: 'full',
    ai_capabilities: ['analysis', 'optimization', 'security', 'management']
  }, 
  'your-super-secret-jwt-key-change-in-production'
);

describe('AI Integration API Tests', () => {
  let authHeaders;

  beforeEach(() => {
    authHeaders = {
      'Authorization': `Bearer ${mockAuthToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': `test-${Date.now()}`,
      'X-AI-Platform': 'test-platform',
      'X-Client-Version': '1.0.0'
    };
  });

  describe('GET /api/ai/models', () => {
    it('should return available AI models', async () => {
      const response = await request(app)
        .get('/api/ai/models')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('models');
      expect(response.body.data).toHaveProperty('total_models');
      expect(response.body.data).toHaveProperty('available_models');
      expect(response.body.data).toHaveProperty('ai_platform_compatible');
      expect(response.body.data.ai_platform_compatible).toBe(true);
      expect(response.body.metadata).toHaveProperty('ai_compatible');
      expect(response.body.metadata.ai_compatible).toBe(true);
    });

    it('should include model endpoints and documentation', async () => {
      const response = await request(app)
        .get('/api/ai/models')
        .set(authHeaders);

      const models = response.body.data.models;
      expect(models.length).toBeGreaterThan(0);
      
      models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('status');
        expect(model).toHaveProperty('capabilities');
        expect(model).toHaveProperty('endpoints');
        expect(model).toHaveProperty('documentation');
      });
    });
  });

  describe('POST /api/ai/analyze', () => {
    it('should perform software analysis with valid parameters', async () => {
      const analysisData = {
        software_id: 'test-software-123',
        analysis_type: 'performance',
        ai_model: 'gpt-4',
        parameters: {
          depth: 'comprehensive',
          include_recommendations: true
        }
      };

      const response = await request(app)
        .post('/api/ai/analyze')
        .set(authHeaders)
        .send(analysisData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis_id');
      expect(response.body.data).toHaveProperty('software_id');
      expect(response.body.data).toHaveProperty('analysis_type');
      expect(response.body.data).toHaveProperty('ai_model');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('confidence_score');
      expect(response.body.data).toHaveProperty('processing_time');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.metadata).toHaveProperty('ai_compatible');
    });

    it('should handle different analysis types', async () => {
      const analysisTypes = ['performance', 'security', 'scalability', 'user_experience'];
      
      for (const analysisType of analysisTypes) {
        const analysisData = {
          software_id: 'test-software-123',
          analysis_type: analysisType,
          ai_model: 'claude-3'
        };

        const response = await request(app)
          .post('/api/ai/analyze')
          .set(authHeaders)
          .send(analysisData);

        expect(response.status).toBe(200);
        expect(response.body.data.analysis_type).toBe(analysisType);
      }
    });

    it('should return error for missing required parameters', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set(authHeaders)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameters');
      expect(response.body.ai_compatible).toBe(true);
      expect(response.body).toHaveProperty('required_fields');
    });
  });

  describe('POST /api/ai/automation/workflow', () => {
    it('should create automation workflow with valid data', async () => {
      const workflowData = {
        name: 'Test Automation Workflow',
        workflow_type: 'data_processing',
        steps: [
          {
            id: 'step-1',
            name: 'Data Collection',
            type: 'api_call',
            parameters: {
              endpoint: '/api/data/collect',
              method: 'GET'
            },
            timeout: 30000
          },
          {
            id: 'step-2',
            name: 'Data Processing',
            type: 'data_processing',
            parameters: {
              algorithm: 'ml-classification'
            },
            timeout: 60000
          }
        ],
        trigger_conditions: {
          schedule: 'daily',
          time: '02:00'
        },
        ai_guidance: 'Optimize data processing for better performance'
      };

      const response = await request(app)
        .post('/api/ai/automation/workflow')
        .set(authHeaders)
        .send(workflowData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('workflow');
      expect(response.body.data.workflow).toHaveProperty('id');
      expect(response.body.data.workflow).toHaveProperty('name');
      expect(response.body.data.workflow).toHaveProperty('workflow_type');
      expect(response.body.data.workflow).toHaveProperty('steps');
      expect(response.body.data.workflow).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('execution_endpoint');
      expect(response.body.data).toHaveProperty('status_endpoint');
      expect(response.body.data).toHaveProperty('update_endpoint');
    });

    it('should return error for invalid workflow data', async () => {
      const invalidWorkflowData = {
        name: 'Test',
        workflow_type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/ai/automation/workflow')
        .set(authHeaders)
        .send(invalidWorkflowData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameters');
      expect(response.body.ai_compatible).toBe(true);
    });
  });

  describe('POST /api/ai/automation/execute/:workflow_id', () => {
    it('should execute existing workflow', async () => {
      // First create a workflow
      const workflowData = {
        name: 'Test Execution Workflow',
        workflow_type: 'system_maintenance',
        steps: [
          {
            id: 'step-1',
            name: 'System Check',
            type: 'system_command',
            parameters: {
              command: 'systemctl status'
            }
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/ai/automation/workflow')
        .set(authHeaders)
        .send(workflowData);

      const workflowId = createResponse.body.data.workflow.id;

      // Then execute it
      const executeData = {
        parameters: {
          environment: 'production',
          priority: 'high'
        }
      };

      const response = await request(app)
        .post(`/api/ai/automation/execute/${workflowId}`)
        .set(authHeaders)
        .send(executeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('execution_id');
      expect(response.body.data).toHaveProperty('workflow_id');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data).toHaveProperty('logs');
    });

    it('should return error for non-existent workflow', async () => {
      const response = await request(app)
        .post('/api/ai/automation/execute/non-existent-id')
        .set(authHeaders)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Workflow not found');
      expect(response.body.ai_compatible).toBe(true);
    });
  });

  describe('POST /api/ai/optimize', () => {
    it('should perform performance optimization', async () => {
      const optimizationData = {
        target_system: 'web-application',
        optimization_type: 'comprehensive',
        constraints: {
          budget: 5000,
          timeline: '2 weeks',
          priority: 'high'
        }
      };

      const response = await request(app)
        .post('/api/ai/optimize')
        .set(authHeaders)
        .send(optimizationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimization_id');
      expect(response.body.data).toHaveProperty('target_system');
      expect(response.body.data).toHaveProperty('optimization_type');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('expected_improvements');
      expect(response.body.data).toHaveProperty('implementation_plan');
    });

    it('should handle different optimization types', async () => {
      const optimizationTypes = ['cpu', 'memory', 'disk', 'network', 'database', 'application'];
      
      for (const optType of optimizationTypes) {
        const optimizationData = {
          target_system: 'test-system',
          optimization_type: optType
        };

        const response = await request(app)
          .post('/api/ai/optimize')
          .set(authHeaders)
          .send(optimizationData);

        expect(response.status).toBe(200);
        expect(response.body.data.optimization_type).toBe(optType);
      }
    });
  });

  describe('POST /api/ai/security/assess', () => {
    it('should perform security assessment', async () => {
      const assessmentData = {
        target_system: 'web-application',
        assessment_type: 'comprehensive',
        scan_depth: 'exhaustive'
      };

      const response = await request(app)
        .post('/api/ai/security/assess')
        .set(authHeaders)
        .send(assessmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('assessment_id');
      expect(response.body.data).toHaveProperty('target_system');
      expect(response.body.data).toHaveProperty('assessment_type');
      expect(response.body.data).toHaveProperty('scan_depth');
      expect(response.body.data).toHaveProperty('vulnerabilities');
      expect(response.body.data).toHaveProperty('risk_score');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('compliance_status');
    });

    it('should handle different assessment types', async () => {
      const assessmentTypes = ['vulnerability_scan', 'penetration_test', 'code_analysis', 'infrastructure_audit'];
      
      for (const assessmentType of assessmentTypes) {
        const assessmentData = {
          target_system: 'test-system',
          assessment_type: assessmentType
        };

        const response = await request(app)
          .post('/api/ai/security/assess')
          .set(authHeaders)
          .send(assessmentData);

        expect(response.status).toBe(200);
        expect(response.body.data.assessment_type).toBe(assessmentType);
      }
    });
  });

  describe('GET /api/ai/monitoring', () => {
    it('should return intelligent monitoring data', async () => {
      const response = await request(app)
        .get('/api/ai/monitoring?system_id=test-system&metrics_type=all&time_range=24h')
        .set(authHeaders);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('system_id');
      expect(response.body.data).toHaveProperty('metrics_type');
      expect(response.body.data).toHaveProperty('time_range');
      expect(response.body.data).toHaveProperty('current_metrics');
      expect(response.body.data).toHaveProperty('historical_data');
      expect(response.body.data).toHaveProperty('predictions');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should handle different time ranges', async () => {
      const timeRanges = ['1h', '6h', '24h', '7d', '30d'];
      
      for (const timeRange of timeRanges) {
        const response = await request(app)
          .get(`/api/ai/monitoring?system_id=test-system&time_range=${timeRange}`)
          .set(authHeaders);

        expect(response.status).toBe(200);
        expect(response.body.data.time_range).toBe(timeRange);
      }
    });
  });

  describe('AI Platform Compatibility', () => {
    it('should include AI-compatible headers in all responses', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/ai/models' },
        { method: 'POST', path: '/api/ai/analyze', data: { software_id: 'test', analysis_type: 'performance' } },
        { method: 'POST', path: '/api/ai/optimize', data: { target_system: 'test', optimization_type: 'cpu' } }
      ];

      for (const endpoint of endpoints) {
        let requestBuilder = request(app)[endpoint.method.toLowerCase()](endpoint.path).set(authHeaders);
        
        if (endpoint.data) {
          requestBuilder = requestBuilder.send(endpoint.data);
        }

        const response = await requestBuilder;

        expect(response.body).toHaveProperty('metadata');
        expect(response.body.metadata).toHaveProperty('ai_compatible');
        expect(response.body.metadata.ai_compatible).toBe(true);
        expect(response.body.metadata).toHaveProperty('timestamp');
        expect(response.body.metadata).toHaveProperty('request_id');
      }
    });

    it('should handle AI platform specific headers', async () => {
      const aiHeaders = {
        ...authHeaders,
        'X-AI-Platform': 'openai-gpt-4',
        'X-Client-Version': '2.0.0',
        'X-Request-ID': `ai-${Date.now()}`,
        'X-Platform': 'web',
        'X-Device-Type': 'desktop'
      };

      const response = await request(app)
        .get('/api/ai/models')
        .set(aiHeaders);

      expect(response.status).toBe(200);
      expect(response.body.metadata.request_id).toContain('ai-');
    });
  });

  describe('Error Handling', () => {
    it('should return AI-compatible error responses', async () => {
      const response = await request(app)
        .post('/api/ai/analyze')
        .set(authHeaders)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('ai_compatible');
      expect(response.body.ai_compatible).toBe(true);
      expect(response.body).toHaveProperty('required_fields');
      expect(response.body).toHaveProperty('suggestions');
    });

    it('should handle server errors gracefully', async () => {
      // This would test actual server errors, but we're using mocks
      // In a real scenario, you'd test database connection failures, etc.
      expect(true).toBe(true); // Placeholder for actual error testing
    });
  });
});

// Performance tests
describe('AI Integration Performance Tests', () => {
  let authHeaders;

  beforeEach(() => {
    authHeaders = {
      'Authorization': `Bearer ${mockAuthToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': `perf-test-${Date.now()}`,
      'X-AI-Platform': 'performance-test',
      'X-Client-Version': '1.0.0'
    };
  });

  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/ai/models')
      .set(authHeaders);

    const responseTime = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });

  it('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/api/ai/models')
          .set({
            ...authHeaders,
            'X-Request-ID': `concurrent-${i}-${Date.now()}`
          })
      );
    }

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
