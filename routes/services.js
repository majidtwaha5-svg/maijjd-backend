const express = require('express');
const router = express.Router();

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Services route is working!',
    timestamp: new Date().toISOString(),
    route: '/api/services/test'
  });
});

// Get all services
router.get('/', async (req, res) => {
  try {
    console.log('📡 Services endpoint called:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"`
    });

    const services = [
      {
        id: 1,
        name: 'Custom Software Development',
        description: 'Tailored software solutions designed to meet your specific business requirements and workflows. We specialize in creating scalable, maintainable applications that drive business growth.',
        price: 'Starting from $399',
        category: 'Development',
        features: [
          'Web Applications (React, Angular, Vue.js)',
          'Desktop Applications (Windows, macOS, Linux)',
          'Mobile Apps (iOS, Android, Cross-platform)',
          'API Development (REST, GraphQL, Microservices)',
          'System Integration & Legacy Modernization',
          'Cloud-Native Applications',
          'Progressive Web Apps (PWA)',
          'Real-time Applications',
          'E-commerce Solutions',
          'Enterprise Resource Planning (ERP)'
        ],
        icon: 'code',
        color: 'blue',
        deliveryTime: '4-12 weeks',
        technologies: ['React', 'Node.js', 'Python', 'Java', 'C#', 'Flutter', 'React Native']
      },
      {
        id: 2,
        name: 'Database Management & Analytics',
        description: 'Comprehensive database solutions with advanced analytics, reporting, and data management capabilities. We help organizations unlock the full potential of their data.',
        price: 'Starting from $199',
        category: 'Data',
        features: [
          'Database Design & Architecture',
          'Data Migration & ETL Processes',
          'Performance Optimization & Tuning',
          'Backup & Disaster Recovery',
          'Data Analytics & Business Intelligence',
          'Data Warehousing Solutions',
          'Real-time Data Processing',
          'Data Quality Management',
          'Compliance & Data Governance',
          'Machine Learning Integration'
        ],
        icon: 'database',
        color: 'green',
        deliveryTime: '2-8 weeks',
        technologies: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Apache Kafka']
      },
      {
        id: 3,
        name: 'System Integration & API Development',
        description: 'Seamless integration of existing systems and third-party applications for improved efficiency and data flow across your organization.',
        price: 'Starting from $299',
        category: 'Integration',
        features: [
          'API Development & Management',
          'Legacy System Integration',
          'Cloud Integration (AWS, Azure, GCP)',
          'Workflow Automation & Orchestration',
          'Data Synchronization & Mapping',
          'Third-party Service Integration',
          'Webhook Implementation',
          'Message Queue Systems',
          'Real-time Data Streaming',
          'API Gateway & Security'
        ],
        icon: 'settings',
        color: 'purple',
        deliveryTime: '3-10 weeks',
        technologies: ['Node.js', 'Python', 'Java', 'Apache Kafka', 'RabbitMQ', 'Docker']
      },
      {
        id: 4,
        name: 'User Management & Security Systems',
        description: 'Comprehensive user management and access control systems for enhanced security, compliance, and user experience.',
        price: 'Starting from $149',
        category: 'Security',
        features: [
          'User Authentication & Authorization',
          'Role-based Access Control (RBAC)',
          'Single Sign-On (SSO) & SAML',
          'Multi-factor Authentication (MFA)',
          'User Analytics & Behavior Tracking',
          'Security Auditing & Compliance',
          'Password Management & Policies',
          'Session Management',
          'API Security & Rate Limiting',
          'Data Privacy & GDPR Compliance'
        ],
        icon: 'users',
        color: 'orange',
        deliveryTime: '2-6 weeks',
        technologies: ['JWT', 'OAuth 2.0', 'SAML', 'LDAP', 'Active Directory', 'Redis']
      },
      {
        id: 5,
        name: 'Advanced Analytics & Business Intelligence',
        description: 'Advanced analytics and real-time reporting solutions for data-driven decision making and business growth.',
        price: 'Starting from $199',
        category: 'Analytics',
        features: [
          'Business Intelligence Dashboards',
          'Real-time Data Visualization',
          'Custom Report Generation',
          'Advanced Data Analytics',
          'Predictive Analytics & Forecasting',
          'Machine Learning Models',
          'Data Mining & Pattern Recognition',
          'Performance Metrics & KPIs',
          'Interactive Charts & Graphs',
          'Automated Insights & Alerts'
        ],
        icon: 'bar-chart',
        color: 'pink',
        deliveryTime: '3-8 weeks',
        technologies: ['Tableau', 'Power BI', 'Python', 'R', 'Apache Spark', 'TensorFlow']
      },
      {
        id: 6,
        name: 'Cybersecurity & Compliance Solutions',
        description: 'Enterprise-grade security solutions with advanced threat detection, encryption, and compliance standards.',
        price: 'Starting from $299',
        category: 'Security',
        features: [
          'Security Auditing & Assessment',
          'Penetration Testing & Vulnerability Scanning',
          'Compliance Management (SOC2, ISO27001)',
          'Data Encryption & Key Management',
          'Security Monitoring & Incident Response',
          'Threat Intelligence & Analysis',
          'Network Security & Firewall Management',
          'Endpoint Protection & Detection',
          'Security Awareness Training',
          'Risk Assessment & Management'
        ],
        icon: 'shield',
        color: 'red',
        deliveryTime: '4-12 weeks',
        technologies: ['Wireshark', 'Nmap', 'Metasploit', 'Snort', 'OSSEC', 'OpenVAS']
      },
      {
        id: 7,
        name: 'Cloud Infrastructure & DevOps',
        description: 'Cloud infrastructure setup, management, and DevOps automation for scalable, reliable applications.',
        price: 'Starting from $399',
        category: 'Infrastructure',
        features: [
          'Cloud Architecture Design',
          'Infrastructure as Code (IaC)',
          'CI/CD Pipeline Automation',
          'Container Orchestration (Kubernetes)',
          'Monitoring & Logging Solutions',
          'Auto-scaling & Load Balancing',
          'Disaster Recovery & Backup',
          'Security & Compliance',
          'Cost Optimization',
          'Performance Tuning'
        ],
        icon: 'cloud',
        color: 'indigo',
        deliveryTime: '6-16 weeks',
        technologies: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins']
      },
      {
        id: 8,
        name: 'AI & Machine Learning Solutions',
        description: 'Custom AI and machine learning solutions to automate processes, gain insights, and create intelligent applications.',
        price: 'Starting from $399',
        category: 'AI/ML',
        features: [
          'Custom AI Model Development',
          'Natural Language Processing (NLP)',
          'Computer Vision & Image Recognition',
          'Predictive Analytics & Forecasting',
          'Recommendation Systems',
          'Chatbot & Virtual Assistant Development',
          'Data Preprocessing & Feature Engineering',
          'Model Training & Optimization',
          'AI Integration & APIs',
          'Continuous Learning & Model Updates'
        ],
        icon: 'zap',
        color: 'yellow',
        deliveryTime: '8-20 weeks',
        technologies: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenAI', 'Hugging Face', 'Python']
      },
      {
        id: 9,
        name: 'Mobile App Development',
        description: 'Native and cross-platform mobile applications with modern UI/UX design and advanced features.',
        price: 'Starting from $299',
        category: 'Mobile',
        features: [
          'Native iOS & Android Development',
          'Cross-platform Development (React Native, Flutter)',
          'Progressive Web Apps (PWA)',
          'Mobile App Testing & QA',
          'App Store Optimization (ASO)',
          'Push Notifications & Analytics',
          'Offline Functionality',
          'Social Media Integration',
          'Payment Gateway Integration',
          'App Maintenance & Updates'
        ],
        icon: 'smartphone',
        color: 'teal',
        deliveryTime: '6-16 weeks',
        technologies: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Firebase', 'AWS Amplify']
      },
      {
        id: 10,
        name: 'E-commerce & Digital Commerce',
        description: 'Complete e-commerce solutions with advanced features, payment processing, and customer management.',
        price: 'Starting from $399',
        category: 'E-commerce',
        features: [
          'Custom E-commerce Platform Development',
          'Payment Gateway Integration',
          'Inventory Management Systems',
          'Customer Relationship Management',
          'Order Processing & Fulfillment',
          'Multi-store Management',
          'Mobile Commerce Solutions',
          'Analytics & Reporting',
          'Marketing & SEO Tools',
          'Security & PCI Compliance'
        ],
        icon: 'shopping-cart',
        color: 'cyan',
        deliveryTime: '8-20 weeks',
        technologies: ['Shopify', 'WooCommerce', 'Magento', 'Node.js', 'React', 'Stripe']
      },
      {
        id: 11,
        name: 'Web Design & UI/UX',
        description: 'Professional web design and user experience solutions with modern, responsive designs.',
        price: 'Starting from $199',
        category: 'Design',
        features: [
          'Custom Web Design',
          'UI/UX Design',
          'Responsive Design',
          'Prototyping & Wireframing',
          'Brand Identity Design',
          'User Research & Testing',
          'Design Systems',
          'Accessibility Compliance',
          'Design-to-Code Handoff',
          'Design Maintenance'
        ],
        icon: 'palette',
        color: 'pink',
        deliveryTime: '2-8 weeks',
        technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle', 'Framer']
      },
      {
        id: 12,
        name: 'Digital Marketing & SEO',
        description: 'Comprehensive digital marketing solutions with SEO optimization and performance tracking.',
        price: 'Starting from $149',
        category: 'Marketing',
        features: [
          'Search Engine Optimization (SEO)',
          'Content Marketing',
          'Social Media Marketing',
          'Pay-Per-Click (PPC) Advertising',
          'Email Marketing Campaigns',
          'Analytics & Performance Tracking',
          'Conversion Rate Optimization',
          'Brand Awareness Campaigns',
          'Marketing Automation',
          'ROI Analysis & Reporting'
        ],
        icon: 'trending-up',
        color: 'orange',
        deliveryTime: '4-12 weeks',
        technologies: ['Google Analytics', 'Google Ads', 'Facebook Ads', 'HubSpot', 'Mailchimp', 'SEMrush']
      },
      {
        id: 13,
        name: 'Content Management Systems',
        description: 'Custom CMS solutions with advanced content management and publishing capabilities.',
        price: 'Starting from $299',
        category: 'CMS',
        features: [
          'Custom CMS Development',
          'Content Publishing Workflows',
          'Multi-user Management',
          'Version Control & History',
          'Media Library Management',
          'SEO Optimization Tools',
          'Multi-language Support',
          'API Integration',
          'Performance Optimization',
          'Security & Backup'
        ],
        icon: 'file-text',
        color: 'blue',
        deliveryTime: '6-16 weeks',
        technologies: ['WordPress', 'Drupal', 'Strapi', 'Contentful', 'Sanity', 'Ghost']
      },
      {
        id: 14,
        name: 'Business Process Automation',
        description: 'Automate business processes and workflows to improve efficiency and reduce manual work.',
        price: 'Starting from $249',
        category: 'Automation',
        features: [
          'Workflow Automation',
          'Process Mapping & Analysis',
          'Task Automation',
          'Document Processing',
          'Email Automation',
          'Data Entry Automation',
          'Approval Workflows',
          'Integration with Existing Systems',
          'Performance Monitoring',
          'Process Optimization'
        ],
        icon: 'workflow',
        color: 'green',
        deliveryTime: '4-12 weeks',
        technologies: ['Zapier', 'Microsoft Power Automate', 'UiPath', 'Automation Anywhere', 'Blue Prism', 'Workato']
      },
      {
        id: 15,
        name: 'Quality Assurance & Testing',
        description: 'Comprehensive software testing and quality assurance services to ensure reliable applications.',
        price: 'Starting from $199',
        category: 'Testing',
        features: [
          'Functional Testing',
          'Performance Testing',
          'Security Testing',
          'User Acceptance Testing',
          'Automated Testing',
          'Load & Stress Testing',
          'Cross-browser Testing',
          'Mobile App Testing',
          'API Testing',
          'Test Case Development'
        ],
        icon: 'check-circle',
        color: 'purple',
        deliveryTime: '2-8 weeks',
        technologies: ['Selenium', 'Jest', 'Cypress', 'Postman', 'JMeter', 'Appium']
      },
      {
        id: 16,
        name: 'IT Consulting & Strategy',
        description: 'Strategic IT consulting to help organizations make informed technology decisions.',
        price: 'Starting from $199',
        category: 'Consulting',
        features: [
          'Technology Strategy Planning',
          'Digital Transformation',
          'IT Infrastructure Assessment',
          'Technology Selection',
          'Architecture Design',
          'Cost Optimization',
          'Risk Assessment',
          'Compliance Planning',
          'Change Management',
          'Training & Support'
        ],
        icon: 'users',
        color: 'indigo',
        deliveryTime: '2-6 weeks',
        technologies: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform']
      },
      {
        id: 17,
        name: 'Data Migration & Integration',
        description: 'Secure data migration and integration services for seamless system transitions.',
        price: 'Starting from $349',
        category: 'Data Migration',
        features: [
          'Data Assessment & Planning',
          'Data Cleaning & Validation',
          'Migration Strategy Development',
          'ETL Process Design',
          'Data Mapping & Transformation',
          'Testing & Validation',
          'Rollback Planning',
          'Performance Optimization',
          'Data Security & Compliance',
          'Post-migration Support'
        ],
        icon: 'database',
        color: 'teal',
        deliveryTime: '4-16 weeks',
        technologies: ['Talend', 'Informatica', 'Apache NiFi', 'Pentaho', 'SSIS', 'AWS Glue']
      },
      {
        id: 18,
        name: 'Cloud Migration & Optimization',
        description: 'Cloud migration services with optimization for cost, performance, and security.',
        price: 'Starting from $499',
        category: 'Cloud Migration',
        features: [
          'Cloud Strategy & Planning',
          'Application Assessment',
          'Migration Planning & Execution',
          'Data Migration',
          'Infrastructure Setup',
          'Security Configuration',
          'Performance Optimization',
          'Cost Optimization',
          'Monitoring & Management',
          'Training & Support'
        ],
        icon: 'cloud',
        color: 'sky',
        deliveryTime: '8-24 weeks',
        technologies: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform']
      },
      {
        id: 19,
        name: 'API Development & Management',
        description: 'Custom API development with comprehensive management and documentation.',
        price: 'Starting from $299',
        category: 'API Development',
        features: [
          'RESTful API Development',
          'GraphQL API Development',
          'API Documentation',
          'API Testing & Validation',
          'Rate Limiting & Security',
          'API Gateway Setup',
          'Version Management',
          'Performance Monitoring',
          'Developer Portal',
          'API Analytics'
        ],
        icon: 'code',
        color: 'emerald',
        deliveryTime: '3-10 weeks',
        technologies: ['Node.js', 'Python', 'Java', 'Postman', 'Swagger', 'Kong']
      },
      {
        id: 20,
        name: 'DevOps & CI/CD Implementation',
        description: 'DevOps implementation with continuous integration and deployment pipelines.',
        price: 'Starting from $399',
        category: 'DevOps',
        features: [
          'CI/CD Pipeline Setup',
          'Infrastructure as Code',
          'Container Orchestration',
          'Monitoring & Logging',
          'Automated Testing',
          'Deployment Automation',
          'Environment Management',
          'Security Integration',
          'Performance Optimization',
          'Team Training'
        ],
        icon: 'settings',
        color: 'violet',
        deliveryTime: '6-16 weeks',
        technologies: ['Jenkins', 'GitLab CI', 'GitHub Actions', 'Docker', 'Kubernetes', 'Terraform']
      },
      {
        id: 21,
        name: 'Legacy System Modernization',
        description: 'Modernize legacy systems with updated technologies and improved performance.',
        price: 'Starting from $599',
        category: 'Modernization',
        features: [
          'System Assessment & Analysis',
          'Modernization Strategy',
          'Data Migration',
          'Application Refactoring',
          'UI/UX Modernization',
          'Performance Optimization',
          'Security Updates',
          'Integration with Modern Systems',
          'Testing & Validation',
          'Training & Documentation'
        ],
        icon: 'refresh-cw',
        color: 'amber',
        deliveryTime: '12-32 weeks',
        technologies: ['React', 'Node.js', 'Python', 'Java', 'C#', 'PostgreSQL']
      },
      {
        id: 22,
        name: 'Microservices Architecture',
        description: 'Design and implement microservices architecture for scalable applications.',
        price: 'Starting from $499',
        category: 'Architecture',
        features: [
          'Architecture Design & Planning',
          'Service Decomposition',
          'API Gateway Implementation',
          'Service Discovery',
          'Load Balancing',
          'Container Orchestration',
          'Monitoring & Observability',
          'Security Implementation',
          'Testing Strategy',
          'Documentation & Training'
        ],
        icon: 'layers',
        color: 'rose',
        deliveryTime: '8-20 weeks',
        technologies: ['Docker', 'Kubernetes', 'Istio', 'Consul', 'Prometheus', 'Grafana']
      },
      {
        id: 23,
        name: 'Performance Optimization',
        description: 'Optimize application performance for better speed, scalability, and user experience.',
        price: 'Starting from $299',
        category: 'Performance',
        features: [
          'Performance Analysis & Profiling',
          'Code Optimization',
          'Database Optimization',
          'Caching Implementation',
          'CDN Setup',
          'Image & Asset Optimization',
          'Load Testing',
          'Monitoring Setup',
          'Performance Metrics',
          'Optimization Recommendations'
        ],
        icon: 'zap',
        color: 'yellow',
        deliveryTime: '3-8 weeks',
        technologies: ['New Relic', 'Datadog', 'Lighthouse', 'WebPageTest', 'Redis', 'CloudFlare']
      },
      {
        id: 24,
        name: 'Security Audit & Implementation',
        description: 'Comprehensive security audit and implementation of security best practices.',
        price: 'Starting from $399',
        category: 'Security',
        features: [
          'Security Assessment & Audit',
          'Vulnerability Scanning',
          'Penetration Testing',
          'Security Implementation',
          'Authentication & Authorization',
          'Data Encryption',
          'Security Monitoring',
          'Compliance Assessment',
          'Security Training',
          'Incident Response Planning'
        ],
        icon: 'shield',
        color: 'red',
        deliveryTime: '4-12 weeks',
        technologies: ['OWASP', 'Nessus', 'Burp Suite', 'Wireshark', 'Splunk', 'ELK Stack']
      },
      {
        id: 25,
        name: 'Technical Documentation',
        description: 'Comprehensive technical documentation for applications, APIs, and systems.',
        price: 'Starting from $149',
        category: 'Documentation',
        features: [
          'API Documentation',
          'User Manuals',
          'Technical Specifications',
          'Architecture Documentation',
          'Code Documentation',
          'Installation Guides',
          'Troubleshooting Guides',
          'Video Tutorials',
          'Interactive Documentation',
          'Documentation Maintenance'
        ],
        icon: 'book',
        color: 'slate',
        deliveryTime: '2-6 weeks',
        technologies: ['Swagger', 'GitBook', 'Confluence', 'Notion', 'Sphinx', 'Docusaurus']
      },
      {
        id: 26,
        name: 'Training & Support Services',
        description: 'Comprehensive training and ongoing support for your development team.',
        price: 'Starting from $199',
        category: 'Training',
        features: [
          'Technical Training Programs',
          'Code Review Sessions',
          'Best Practices Workshops',
          'Technology Migration Training',
          'Team Mentoring',
          '24/7 Technical Support',
          'Remote Support',
          'Performance Monitoring',
          'Regular Health Checks',
          'Knowledge Transfer'
        ],
        icon: 'graduation-cap',
        color: 'lime',
        deliveryTime: '1-4 weeks',
        technologies: ['Zoom', 'Slack', 'Jira', 'Confluence', 'GitHub', 'Docker']
      }
    ];

    res.json({
      message: 'Services retrieved successfully',
      data: services,
      metadata: {
        ai_compatible: true,
        total_services: services.length,
        categories: [...new Set(services.map(s => s.category))],
        ai_enhanced_features: [
          'Intelligent Service Matching',
          'AI-Powered Recommendations',
          'Predictive Delivery Estimates',
          'Automated Workflow Integration'
        ],
        timestamp: new Date().toISOString(),
        request_id: `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });

    console.log('✅ Services response sent:', {
      servicesCount: services.length,
      categories: [...new Set(services.map(s => s.category))],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      error: 'Failed to retrieve services',
      message: 'Please try again later'
    });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock service data
    const service = {
      id: parseInt(id),
      name: 'Custom Software Development',
      description: 'Tailored software solutions designed to meet your specific business requirements and workflows. Our experienced development team works closely with you to understand your needs and deliver high-quality, scalable solutions.',
      price: 'Starting from $1,500',
      category: 'Development',
      features: [
        'Web Applications',
        'Desktop Applications',
        'Mobile Apps',
        'API Development',
        'System Integration'
      ],
      process: [
        {
          step: 1,
          title: 'Discovery',
          description: 'We analyze your requirements and create a detailed project plan.'
        },
        {
          step: 2,
          title: 'Design',
          description: 'We create wireframes and design mockups for your approval.'
        },
        {
          step: 3,
          title: 'Development',
          description: 'Our team develops your solution using agile methodologies.'
        },
        {
          step: 4,
          title: 'Deployment',
          description: 'We deploy your solution and provide ongoing support.'
        }
      ],
      technologies: [
        'React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS'
      ],
      icon: 'code',
      color: 'blue',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z'
    };

    res.json({
      message: 'Service retrieved successfully',
      data: service
    });

  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve service',
      message: 'Please try again later'
    });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Mock services by category
    const servicesByCategory = {
      'development': [
        {
          id: 1,
          name: 'Custom Software Development',
          description: 'Tailored software solutions designed to meet your specific business requirements.',
          price: 'Starting from $5,000',
          category: 'Development'
        }
      ],
      'data': [
        {
          id: 2,
          name: 'Database Management',
          description: 'Comprehensive database solutions with advanced analytics.',
          price: 'Starting from $3,000',
          category: 'Data'
        }
      ],
      'integration': [
        {
          id: 3,
          name: 'System Integration',
          description: 'Seamless integration of existing systems and third-party applications.',
          price: 'Starting from $4,000',
          category: 'Integration'
        }
      ],
      'security': [
        {
          id: 4,
          name: 'User Management Systems',
          description: 'Comprehensive user management and access control systems.',
          price: 'Starting from $2,500',
          category: 'Security'
        },
        {
          id: 6,
          name: 'Security Solutions',
          description: 'Enterprise-grade security solutions with encryption.',
          price: 'Starting from $4,500',
          category: 'Security'
        }
      ],
      'analytics': [
        {
          id: 5,
          name: 'Analytics & Reporting',
          description: 'Advanced analytics and real-time reporting solutions.',
          price: 'Starting from $3,500',
          category: 'Analytics'
        }
      ]
    };

    const services = servicesByCategory[category.toLowerCase()] || [];

    res.json({
      message: 'Services retrieved successfully',
      data: services
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      error: 'Failed to retrieve services',
      message: 'Please try again later'
    });
  }
});

module.exports = router;
