const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
// const { validateSoftwareData } = require('../middleware/validation');

// AI-Enhanced Software Data with Intelligent Features
const softwareData = [
  {
    id: 1,
    name: "Maijjd AI Hub",
    description: "Advanced AI-powered software management platform with intelligent automation, machine learning capabilities, and real-time analytics. Features include predictive maintenance, automated workflows, and intelligent resource allocation.",
    version: "2.1.0",
    price: "$299/month",
    category: "AI & Automation",
    features: [
      "Intelligent Process Automation",
      "Machine Learning Integration",
      "Real-time Analytics Dashboard",
      "Predictive Maintenance",
      "Automated Workflow Management",
      "Natural Language Processing",
      "API-First Architecture",
      "Multi-Platform Support"
    ],
    specifications: {
      "AI Capabilities": "GPT-4 Integration, Custom ML Models",
      "Performance": "99.9% Uptime, <100ms Response Time",
      "Security": "End-to-End Encryption, OAuth 2.0, JWT",
      "Scalability": "Auto-scaling, Load Balancing",
      "Integration": "REST API, Webhooks, WebSocket",
      "Compliance": "GDPR, SOC 2, ISO 27001"
    },
    image: "/images/ai-hub.jpg",
    downloads: 15420,
    status: "Active",
    rating: 4.8,
    icon: "🤖",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 95,
      "aiFeatures": ["NLP", "ML", "Predictive Analytics"],
      "apiEndpoints": 25,
      "responseTime": "50ms",
      "accuracy": "99.2%"
    }
  },
  {
    id: 2,
    name: "Maijjd CRM Pro",
    description: "Intelligent customer relationship management system with AI-powered lead scoring, automated follow-ups, and predictive analytics. Integrates seamlessly with existing business tools and provides actionable insights.",
    version: "1.8.5",
    price: "$199/month",
    category: "Business & CRM",
    features: [
      "AI-Powered Lead Scoring",
      "Automated Follow-up System",
      "Predictive Analytics",
      "Multi-Channel Communication",
      "Advanced Reporting",
      "Mobile App Support",
      "API Integration",
      "Custom Workflows"
    ],
    specifications: {
      "AI Capabilities": "Lead Scoring, Customer Behavior Analysis",
      "Performance": "99.5% Uptime, <200ms Response Time",
      "Security": "Data Encryption, Role-Based Access",
      "Scalability": "Multi-tenant Architecture",
      "Integration": "Zapier, Salesforce, HubSpot",
      "Compliance": "GDPR, CCPA, HIPAA"
    },
    image: "/images/crm-pro.jpg",
    downloads: 8920,
    status: "Active",
    rating: 4.6,
    icon: "💼",
    aiMetadata: {
      "intelligenceLevel": "Intermediate",
      "automationScore": 88,
      "aiFeatures": ["Lead Scoring", "Behavior Analysis", "Predictive Analytics"],
      "apiEndpoints": 18,
      "responseTime": "150ms",
      "accuracy": "94.5%"
    }
  },
  {
    id: 3,
    name: "Maijjd Analytics Suite",
    description: "Comprehensive business intelligence platform with real-time data processing, AI-driven insights, and interactive dashboards. Supports multiple data sources and provides automated reporting.",
    version: "2.0.1",
    price: "$399/month",
    category: "Analytics & BI",
    features: [
      "Real-time Data Processing",
      "AI-Driven Insights",
      "Interactive Dashboards",
      "Automated Reporting",
      "Data Visualization",
      "Predictive Modeling",
      "Multi-Source Integration",
      "Custom Alerts"
    ],
    specifications: {
      "AI Capabilities": "Predictive Modeling, Anomaly Detection",
      "Performance": "99.8% Uptime, <50ms Response Time",
      "Security": "Data Masking, Audit Logging",
      "Scalability": "Distributed Processing",
      "Integration": "SQL, NoSQL, Cloud APIs",
      "Compliance": "GDPR, SOX, PCI DSS"
    },
    image: "/images/analytics-suite.jpg",
    downloads: 6730,
    status: "Active",
    rating: 4.9,
    icon: "📊",
    aiMetadata: {
      "intelligenceLevel": "Expert",
      "automationScore": 92,
      "aiFeatures": ["Predictive Modeling", "Anomaly Detection", "Natural Language Queries"],
      "apiEndpoints": 32,
      "responseTime": "30ms",
      "accuracy": "97.8%"
    }
  },
  {
    id: 4,
    name: "Maijjd Security Shield",
    description: "Next-generation cybersecurity platform with AI-powered threat detection, automated incident response, and comprehensive security monitoring. Protects against advanced persistent threats and zero-day vulnerabilities.",
    version: "1.5.2",
    price: "$599/month",
    category: "Security & Compliance",
    features: [
      "AI-Powered Threat Detection",
      "Automated Incident Response",
      "Real-time Monitoring",
      "Vulnerability Assessment",
      "Compliance Reporting",
      "Threat Intelligence",
      "Zero-Day Protection",
      "Security Automation"
    ],
    specifications: {
      "AI Capabilities": "Threat Detection, Behavioral Analysis",
      "Performance": "99.99% Uptime, <10ms Response Time",
      "Security": "Zero-Trust Architecture, End-to-End Encryption",
      "Scalability": "Global Threat Intelligence Network",
      "Integration": "SIEM, EDR, Firewall APIs",
      "Compliance": "SOC 2, ISO 27001, NIST"
    },
    image: "/images/security-shield.jpg",
    downloads: 4450,
    status: "Active",
    rating: 4.7,
    icon: "🛡️",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 96,
      "aiFeatures": ["Threat Detection", "Behavioral Analysis", "Anomaly Detection"],
      "apiEndpoints": 28,
      "responseTime": "8ms",
      "accuracy": "99.1%"
    }
  },
  {
    id: 5,
    name: "Maijjd Cloud Manager",
    description: "Intelligent cloud infrastructure management platform with automated scaling, cost optimization, and AI-driven resource allocation. Supports multi-cloud environments and provides real-time monitoring.",
    version: "1.7.0",
    price: "$349/month",
    category: "Cloud & DevOps",
    features: [
      "Automated Scaling",
      "Cost Optimization",
      "AI Resource Allocation",
      "Multi-Cloud Support",
      "Real-time Monitoring",
      "Performance Analytics",
      "Automated Backups",
      "Disaster Recovery"
    ],
    specifications: {
      "AI Capabilities": "Resource Optimization, Cost Prediction",
      "Performance": "99.7% Uptime, <100ms Response Time",
      "Security": "IAM, Encryption, Network Security",
      "Scalability": "Auto-scaling, Load Balancing",
      "Integration": "AWS, Azure, GCP, Kubernetes",
      "Compliance": "SOC 2, ISO 27001, FedRAMP"
    },
    image: "/images/cloud-manager.jpg",
    downloads: 5670,
    status: "Active",
    rating: 4.5,
    icon: "☁️",
    aiMetadata: {
      "intelligenceLevel": "Intermediate",
      "automationScore": 90,
      "aiFeatures": ["Resource Optimization", "Cost Prediction", "Performance Tuning"],
      "apiEndpoints": 22,
      "responseTime": "80ms",
      "accuracy": "93.2%"
    }
  },
  {
    id: 6,
    name: "Maijjd Development Studio",
    description: "Advanced integrated development environment with AI-powered code completion, automated testing, and intelligent debugging. Supports multiple programming languages and frameworks.",
    version: "2.2.0",
    price: "$249/month",
    category: "Development & IDE",
    features: [
      "AI-Powered Code Completion",
      "Intelligent Debugging",
      "Automated Testing",
      "Multi-Language Support",
      "Version Control Integration",
      "Performance Profiling",
      "Code Quality Analysis",
      "Team Collaboration Tools"
    ],
    specifications: {
      "AI Capabilities": "Code Completion, Bug Detection, Performance Optimization",
      "Performance": "99.6% Uptime, <150ms Response Time",
      "Security": "Secure Code Execution, Sandbox Environment",
      "Scalability": "Multi-Project Support, Resource Management",
      "Integration": "Git, Docker, CI/CD Pipelines",
      "Compliance": "GDPR, SOC 2, ISO 27001"
    },
    image: "/images/dev-studio.jpg",
    downloads: 7890,
    status: "Active",
    rating: 4.7,
    icon: "💻",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 89,
      "aiFeatures": ["Code Completion", "Bug Detection", "Performance Analysis"],
      "apiEndpoints": 20,
      "responseTime": "120ms",
      "accuracy": "95.8%"
    }
  },
  {
    id: 7,
    name: "Maijjd Web Builder Pro",
    description: "Professional website builder with AI-powered design suggestions, SEO optimization, and e-commerce integration. Features drag-and-drop interface with advanced customization options.",
    version: "1.9.3",
    price: "$179/month",
    category: "Web & E-commerce",
    features: [
      "AI Design Suggestions",
      "Drag & Drop Interface",
      "SEO Optimization",
      "E-commerce Integration",
      "Responsive Templates",
      "Custom Domain Support",
      "Analytics Dashboard",
      "Multi-Language Support"
    ],
    specifications: {
      "AI Capabilities": "Design Suggestions, SEO Optimization, Content Generation",
      "Performance": "99.5% Uptime, <200ms Response Time",
      "Security": "SSL Certificates, DDoS Protection, Backup System",
      "Scalability": "CDN Integration, Load Balancing",
      "Integration": "Payment Gateways, Marketing Tools, Analytics",
      "Compliance": "GDPR, PCI DSS, WCAG 2.1"
    },
    image: "/images/web-builder.jpg",
    downloads: 11230,
    status: "Active",
    rating: 4.4,
    icon: "🌐",
    aiMetadata: {
      "intelligenceLevel": "Intermediate",
      "automationScore": 85,
      "aiFeatures": ["Design Suggestions", "SEO Optimization", "Content Generation"],
      "apiEndpoints": 16,
      "responseTime": "180ms",
      "accuracy": "92.1%"
    }
  },
  {
    id: 8,
    name: "Maijjd Infrastructure Manager",
    description: "Comprehensive server and infrastructure management platform with AI-powered monitoring, automated maintenance, and intelligent resource allocation for enterprise environments.",
    version: "1.6.8",
    price: "$429/month",
    category: "Infrastructure & DevOps",
    features: [
      "AI-Powered Monitoring",
      "Automated Maintenance",
      "Intelligent Resource Allocation",
      "Server Performance Analytics",
      "Automated Backups",
      "Disaster Recovery",
      "Load Balancing",
      "Security Hardening"
    ],
    specifications: {
      "AI Capabilities": "Performance Monitoring, Predictive Maintenance, Resource Optimization",
      "Performance": "99.8% Uptime, <50ms Response Time",
      "Security": "Zero-Trust Architecture, Automated Security Updates",
      "Scalability": "Multi-Server Management, Auto-scaling",
      "Integration": "Kubernetes, Docker, Cloud Platforms",
      "Compliance": "SOC 2, ISO 27001, HIPAA"
    },
    image: "/images/infrastructure-manager.jpg",
    downloads: 3450,
    status: "Active",
    rating: 4.6,
    icon: "🖥️",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 93,
      "aiFeatures": ["Performance Monitoring", "Predictive Maintenance", "Resource Optimization"],
      "apiEndpoints": 24,
      "responseTime": "45ms",
      "accuracy": "96.4%"
    }
  },
  {
    id: 9,
    name: "Maijjd Marketing Automation",
    description: "AI-powered marketing automation platform with intelligent campaign management, customer segmentation, and predictive analytics. Automates email marketing, social media, and advertising campaigns.",
    version: "2.1.3",
    price: "$159/month",
    category: "Marketing & Automation",
    features: [
      "AI-Powered Campaign Management",
      "Intelligent Customer Segmentation",
      "Predictive Analytics",
      "Multi-Channel Marketing",
      "Automated A/B Testing",
      "ROI Tracking",
      "Social Media Integration",
      "Email Marketing Automation"
    ],
    specifications: {
      "AI Capabilities": "Customer Segmentation, Campaign Optimization, Predictive Analytics",
      "Performance": "99.7% Uptime, <180ms Response Time",
      "Security": "Data Encryption, GDPR Compliance, Secure APIs",
      "Scalability": "Multi-Campaign Support, Auto-scaling",
      "Integration": "CRM Systems, Social Platforms, Email Services",
      "Compliance": "GDPR, CCPA, CAN-SPAM"
    },
    image: "/images/marketing-automation.jpg",
    downloads: 15680,
    status: "Active",
    rating: 4.5,
    icon: "📈",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 91,
      "aiFeatures": ["Customer Segmentation", "Campaign Optimization", "Predictive Analytics"],
      "apiEndpoints": 22,
      "responseTime": "160ms",
      "accuracy": "94.8%"
    }
  },
  {
    id: 10,
    name: "Maijjd Project Management Pro",
    description: "Intelligent project management solution with AI-powered task prioritization, resource allocation, and risk assessment. Features real-time collaboration, automated reporting, and predictive project timelines.",
    version: "1.7.2",
    price: "$89/month",
    category: "Project Management",
    features: [
      "AI-Powered Task Prioritization",
      "Intelligent Resource Allocation",
      "Risk Assessment & Mitigation",
      "Real-time Collaboration",
      "Automated Reporting",
      "Gantt Charts & Timelines",
      "Team Performance Analytics",
      "Integration with Development Tools"
    ],
    specifications: {
      "AI Capabilities": "Task Prioritization, Resource Optimization, Risk Prediction",
      "Performance": "99.6% Uptime, <120ms Response Time",
      "Security": "Role-Based Access, Data Encryption, Audit Logs",
      "Scalability": "Multi-Project Support, Team Management",
      "Integration": "Git, Jira, Slack, Microsoft Teams",
      "Compliance": "ISO 27001, SOC 2, GDPR"
    },
    image: "/images/project-management.jpg",
    downloads: 23450,
    status: "Active",
    rating: 4.7,
    icon: "📋",
    aiMetadata: {
      "intelligenceLevel": "Intermediate",
      "automationScore": 87,
      "aiFeatures": ["Task Prioritization", "Resource Optimization", "Risk Prediction"],
      "apiEndpoints": 19,
      "responseTime": "110ms",
      "accuracy": "93.2%"
    }
  },
  {
    id: 11,
    name: "Maijjd Data Science Studio",
    description: "Comprehensive data science platform with AI-powered model development, automated feature engineering, and MLOps capabilities. Supports multiple programming languages and provides enterprise-grade security.",
    version: "2.3.1",
    price: "$599/month",
    category: "Data Science & ML",
    features: [
      "AI-Powered Model Development",
      "Automated Feature Engineering",
      "MLOps Pipeline Management",
      "Multi-Language Support",
      "Enterprise Security",
      "Real-time Model Monitoring",
      "Collaborative Workspaces",
      "Advanced Visualization Tools"
    ],
    specifications: {
      "AI Capabilities": "Model Development, Feature Engineering, MLOps Automation",
      "Performance": "99.9% Uptime, <80ms Response Time",
      "Security": "Enterprise Security, Model Encryption, Access Control",
      "Scalability": "Distributed Computing, GPU Support",
      "Integration": "Python, R, Julia, TensorFlow, PyTorch",
      "Compliance": "SOC 2, ISO 27001, HIPAA, GDPR"
    },
    image: "/images/data-science-studio.jpg",
    downloads: 8920,
    status: "Active",
    rating: 4.9,
    icon: "🔬",
    aiMetadata: {
      "intelligenceLevel": "Expert",
      "automationScore": 96,
      "aiFeatures": ["Model Development", "Feature Engineering", "MLOps Automation"],
      "apiEndpoints": 28,
      "responseTime": "70ms",
      "accuracy": "97.8%"
    }
  },
  {
    id: 12,
    name: "Maijjd Customer Support AI",
    description: "Intelligent customer support platform with AI-powered chatbots, sentiment analysis, and automated ticket routing. Provides 24/7 support with human-like interactions and seamless escalation.",
    version: "1.5.7",
    price: "$129/month",
    category: "Customer Support",
    features: [
      "AI-Powered Chatbots",
      "Sentiment Analysis",
      "Automated Ticket Routing",
      "24/7 Support Availability",
      "Multi-Language Support",
      "Knowledge Base Integration",
      "Performance Analytics",
      "Seamless Human Escalation"
    ],
    specifications: {
      "AI Capabilities": "Natural Language Processing, Sentiment Analysis, Intelligent Routing",
      "Performance": "99.8% Uptime, <100ms Response Time",
      "Security": "Data Privacy, Secure Chat, GDPR Compliance",
      "Scalability": "Multi-Channel Support, Auto-scaling",
      "Integration": "CRM Systems, Help Desk Tools, Live Chat",
      "Compliance": "GDPR, CCPA, SOC 2"
    },
    image: "/images/customer-support-ai.jpg",
    downloads: 18750,
    status: "Active",
    rating: 4.6,
    icon: "🎧",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 89,
      "aiFeatures": ["Natural Language Processing", "Sentiment Analysis", "Intelligent Routing"],
      "apiEndpoints": 21,
      "responseTime": "90ms",
      "accuracy": "95.1%"
    }
  },
  {
    id: 13,
    name: "Maijjd Financial Analytics",
    description: "AI-powered financial analytics platform with real-time market data, predictive modeling, and automated risk assessment. Provides comprehensive financial insights for investment decisions and portfolio management.",
    version: "2.0.8",
    price: "$349/month",
    category: "Financial Technology",
    features: [
      "Real-time Market Data",
      "AI-Powered Predictive Modeling",
      "Automated Risk Assessment",
      "Portfolio Management",
      "Financial Reporting",
      "Compliance Monitoring",
      "API Integration",
      "Mobile App Support"
    ],
    specifications: {
      "AI Capabilities": "Predictive Modeling, Risk Assessment, Market Analysis",
      "Performance": "99.9% Uptime, <60ms Response Time",
      "Security": "Bank-Grade Security, Encryption, Audit Trails",
      "Scalability": "High-Frequency Trading Support, Real-time Processing",
      "Integration": "Trading Platforms, Banking APIs, Market Data Feeds",
      "Compliance": "SOX, PCI DSS, SOC 2, GDPR"
    },
    image: "/images/financial-analytics.jpg",
    downloads: 6540,
    status: "Active",
    rating: 4.8,
    icon: "💰",
    aiMetadata: {
      "intelligenceLevel": "Expert",
      "automationScore": 94,
      "aiFeatures": ["Predictive Modeling", "Risk Assessment", "Market Analysis"],
      "apiEndpoints": 26,
      "responseTime": "55ms",
      "accuracy": "96.9%"
    }
  },
  {
    id: 14,
    name: "Maijjd Healthcare Analytics",
    description: "Comprehensive healthcare analytics platform with AI-powered patient insights, predictive diagnostics, and compliance management. Designed for healthcare providers, researchers, and administrators.",
    version: "1.8.4",
    price: "$499/month",
    category: "Healthcare Technology",
    features: [
      "AI-Powered Patient Insights",
      "Predictive Diagnostics",
      "Compliance Management",
      "Clinical Decision Support",
      "Population Health Analytics",
      "Real-time Monitoring",
      "Secure Data Sharing",
      "Research Tools"
    ],
    specifications: {
      "AI Capabilities": "Patient Insights, Predictive Diagnostics, Clinical Decision Support",
      "Performance": "99.9% Uptime, <100ms Response Time",
      "Security": "HIPAA Compliance, End-to-End Encryption, Access Control",
      "Scalability": "Multi-Hospital Support, Real-time Processing",
      "Integration": "EHR Systems, Medical Devices, Research Databases",
      "Compliance": "HIPAA, HITECH, SOC 2, ISO 27001"
    },
    image: "/images/healthcare-analytics.jpg",
    downloads: 4230,
    status: "Active",
    rating: 4.7,
    icon: "🎧",
    aiMetadata: {
      "intelligenceLevel": "Advanced",
      "automationScore": 92,
      "aiFeatures": ["Patient Insights", "Predictive Diagnostics", "Clinical Decision Support"],
      "apiEndpoints": 23,
      "responseTime": "85ms",
      "accuracy": "95.7%"
    }
  },
  {
    id: 15,
    name: "Maijjd Education Platform",
    description: "AI-powered educational platform with personalized learning paths, intelligent tutoring, and adaptive assessments. Supports multiple learning styles and provides comprehensive analytics for educators.",
    version: "1.6.2",
    price: "$79/month",
    category: "Education Technology",
    features: [
      "Personalized Learning Paths",
      "AI-Powered Tutoring",
      "Adaptive Assessments",
      "Multi-Media Content",
      "Progress Tracking",
      "Collaborative Learning",
      "Analytics Dashboard",
      "Mobile Learning Support"
    ],
    specifications: {
      "AI Capabilities": "Personalized Learning, Intelligent Tutoring, Adaptive Assessments",
      "Performance": "99.7% Uptime, <150ms Response Time",
      "Security": "Student Data Protection, Secure Authentication, Privacy Controls",
      "Scalability": "Multi-School Support, Content Management",
      "Integration": "LMS Systems, Video Platforms, Assessment Tools",
      "Compliance": "FERPA, COPPA, GDPR, SOC 2"
    },
    image: "/images/education-platform.jpg",
    downloads: 15680,
    status: "Active",
    rating: 4.5,
    icon: "🎓",
    aiMetadata: {
      "intelligenceLevel": "Intermediate",
      "automationScore": 86,
      "aiFeatures": ["Personalized Learning", "Intelligent Tutoring", "Adaptive Assessments"],
      "apiEndpoints": 17,
      "responseTime": "140ms",
      "accuracy": "93.8%"
    }
  }
];

// AI-Enhanced Categories with Intelligent Classification
const categories = [
  {
    id: 1,
    name: "AI & Automation",
    description: "Advanced artificial intelligence and automation solutions",
    icon: "🤖",
    color: "#6366f1",
    aiFeatures: ["Machine Learning", "Natural Language Processing", "Process Automation"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 2,
    name: "Business & CRM",
    description: "Customer relationship management and business process solutions",
    icon: "💼",
    color: "#10b981",
    aiFeatures: ["Lead Scoring", "Customer Analytics", "Predictive Insights"],
    intelligenceLevel: "Intermediate"
  },
  {
    id: 3,
    name: "Analytics & BI",
    description: "Business intelligence and data analytics platforms",
    icon: "📊",
    color: "#f59e0b",
    aiFeatures: ["Predictive Modeling", "Data Visualization", "Real-time Analytics"],
    intelligenceLevel: "Expert"
  },
  {
    id: 4,
    name: "Security & Compliance",
    description: "Cybersecurity and compliance management solutions",
    icon: "🛡️",
    color: "#ef4444",
    aiFeatures: ["Threat Detection", "Behavioral Analysis", "Compliance Automation"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 5,
    name: "Cloud & DevOps",
    description: "Cloud infrastructure and development operations tools",
    icon: "☁️",
    color: "#8b5cf6",
    aiFeatures: ["Resource Optimization", "Automated Deployment", "Performance Monitoring"],
    intelligenceLevel: "Intermediate"
  },
  {
    id: 6,
    name: "Development & IDE",
    description: "Integrated development environments and coding tools",
    icon: "💻",
    color: "#06b6d4",
    aiFeatures: ["Code Completion", "Bug Detection", "Performance Analysis"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 7,
    name: "Web & E-commerce",
    description: "Website building and e-commerce platform solutions",
    icon: "🌐",
    color: "#84cc16",
    aiFeatures: ["Design Suggestions", "SEO Optimization", "Content Generation"],
    intelligenceLevel: "Intermediate"
  },
  {
    id: 8,
    name: "Infrastructure & DevOps",
    description: "Server management and infrastructure automation tools",
    icon: "🖥️",
    color: "#f97316",
    aiFeatures: ["Performance Monitoring", "Predictive Maintenance", "Resource Optimization"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 9,
    name: "Marketing & Automation",
    description: "AI-powered marketing automation and campaign management solutions",
    icon: "📈",
    color: "#ec4899",
    aiFeatures: ["Customer Segmentation", "Campaign Optimization", "Predictive Analytics"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 10,
    name: "Project Management",
    description: "Intelligent project management and team collaboration tools",
    icon: "📋",
    color: "#14b8a6",
    aiFeatures: ["Task Prioritization", "Resource Optimization", "Risk Prediction"],
    intelligenceLevel: "Intermediate"
  },
  {
    id: 11,
    name: "Data Science & ML",
    description: "Advanced data science and machine learning platforms",
    icon: "🔬",
    color: "#7c3aed",
    aiFeatures: ["Model Development", "Feature Engineering", "MLOps Automation"],
    intelligenceLevel: "Expert"
  },
  {
    id: 12,
    name: "Customer Support",
    description: "AI-powered customer support and service automation",
    icon: "🎧",
    color: "#f59e0b",
    aiFeatures: ["Natural Language Processing", "Sentiment Analysis", "Intelligent Routing"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 13,
    name: "Financial Technology",
    description: "AI-powered financial analytics and trading platforms",
    icon: "💰",
    color: "#059669",
    aiFeatures: ["Predictive Modeling", "Risk Assessment", "Market Analysis"],
    intelligenceLevel: "Expert"
  },
  {
    id: 14,
    name: "Healthcare Technology",
    description: "AI-powered healthcare analytics and clinical decision support",
    icon: "🏥",
    color: "#dc2626",
    aiFeatures: ["Patient Insights", "Predictive Diagnostics", "Clinical Decision Support"],
    intelligenceLevel: "Advanced"
  },
  {
    id: 15,
    name: "Education Technology",
    description: "AI-powered educational platforms and learning management systems",
    icon: "🎓",
    color: "#0891b2",
    aiFeatures: ["Personalized Learning", "Intelligent Tutoring", "Adaptive Assessments"],
    intelligenceLevel: "Intermediate"
  }
];

// Get all software with AI-enhanced filtering and search
router.get('/', (req, res) => {
  try {
    let filteredSoftware = [...softwareData];
    const { category, search, intelligence, automation, features } = req.query;

    // Category filtering
    if (category) {
      filteredSoftware = filteredSoftware.filter(software => 
        software.category.toLowerCase() === category.toLowerCase()
      );
    }

    // AI-powered search with semantic matching
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSoftware = filteredSoftware.filter(software => {
        const searchableText = [
          software.name,
          software.description,
          software.category,
          ...software.features,
          ...Object.values(software.specifications),
          ...software.aiMetadata.aiFeatures
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
    }

    // Intelligence level filtering
    if (intelligence) {
      filteredSoftware = filteredSoftware.filter(software => 
        software.aiMetadata.intelligenceLevel.toLowerCase() === intelligence.toLowerCase()
      );
    }

    // Automation score filtering
    if (automation) {
      const minScore = parseInt(automation);
      filteredSoftware = filteredSoftware.filter(software => 
        software.aiMetadata.automationScore >= minScore
      );
    }

    // Features filtering
    if (features) {
      const requiredFeatures = features.split(',').map(f => f.trim().toLowerCase());
      filteredSoftware = filteredSoftware.filter(software => 
        requiredFeatures.every(feature => 
          software.features.some(f => f.toLowerCase().includes(feature)) ||
          software.aiMetadata.aiFeatures.some(f => f.toLowerCase().includes(feature))
        )
      );
    }

    // Add AI-friendly metadata
    const response = {
      message: 'Software retrieved successfully',
      data: filteredSoftware,
      metadata: {
        total: filteredSoftware.length,
        categories: categories.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
        intelligenceLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        automationRange: { min: 0, max: 100 },
        aiCapabilities: ['Machine Learning', 'Natural Language Processing', 'Predictive Analytics', 'Computer Vision', 'Robotic Process Automation'],
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error retrieving software:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve software data',
      code: 'SOFTWARE_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Get software by ID with detailed AI information
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const software = softwareData.find(s => s.id === id);

    if (!software) {
      return res.status(404).json({
        error: 'Software not found',
        message: `Software with ID ${id} does not exist`,
        code: 'SOFTWARE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Enhanced response with AI integration details
    const response = {
      message: 'Software retrieved successfully',
      data: {
        ...software,
        aiIntegration: {
          apiEndpoints: software.aiMetadata.apiEndpoints,
          responseTime: software.aiMetadata.responseTime,
          accuracy: software.aiMetadata.accuracy,
          supportedFormats: ['JSON', 'XML', 'GraphQL'],
          authentication: ['JWT', 'API Key', 'OAuth 2.0'],
          rateLimiting: '1000 requests per 15 minutes',
          webhooks: true,
          realTimeUpdates: true
        },
        documentation: {
          apiDocs: `/api-docs`,
          examples: `/api/software/${id}/examples`,
          sdk: `/api/software/${id}/sdk`
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error retrieving software:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve software data',
      code: 'SOFTWARE_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Get software categories with AI features
router.get('/categories', (req, res) => {
  try {
    const response = {
      message: 'Categories retrieved successfully',
      data: categories,
      metadata: {
        total: categories.length,
        intelligenceLevels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        aiCapabilities: ['Machine Learning', 'Natural Language Processing', 'Predictive Analytics', 'Computer Vision', 'Robotic Process Automation'],
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories',
      code: 'CATEGORIES_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// AI Integration endpoint for external AI platforms
router.get('/ai/integration', (req, res) => {
  try {
    const response = {
      message: 'AI Integration endpoint available',
      capabilities: {
        softwareCatalog: {
          endpoint: '/api/software',
          methods: ['GET'],
          parameters: ['category', 'search', 'intelligence', 'automation', 'features'],
          responseFormat: 'JSON',
          authentication: 'Optional'
        },
        categories: {
          endpoint: '/api/software/categories',
          methods: ['GET'],
          responseFormat: 'JSON',
          authentication: 'None required'
        },
        individualSoftware: {
          endpoint: '/api/software/{id}',
          methods: ['GET'],
          responseFormat: 'JSON',
          authentication: 'None required'
        }
      },
      aiFeatures: {
        intelligentSearch: 'Semantic search across software descriptions and features',
        categoryFiltering: 'Filter by AI capabilities and intelligence levels',
        automationScoring: 'Filter by automation capabilities (0-100 scale)',
        featureMatching: 'Find software with specific AI features',
        realTimeData: 'Live software catalog with real-time updates'
      },
      dataFormats: {
        primary: 'JSON',
        supported: ['JSON', 'XML (on request)'],
        schema: '/api-docs',
        examples: '/api/software/1'
      },
      authentication: {
        methods: ['JWT Bearer Token', 'API Key'],
        endpoints: '/api/auth/login',
        rateLimiting: '1000 requests per 15 minutes'
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalSoftware: softwareData.length,
        totalCategories: categories.length,
        aiEnabledSoftware: softwareData.filter(s => s.aiMetadata.intelligenceLevel !== 'Beginner').length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in AI integration endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to provide AI integration information',
      code: 'AI_INTEGRATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Get software examples for AI platforms
router.get('/:id/examples', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const software = softwareData.find(s => s.id === id);

    if (!software) {
      return res.status(404).json({
        error: 'Software not found',
        message: `Software with ID ${id} does not exist`,
        code: 'SOFTWARE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const examples = {
      software: software.name,
      apiUsage: {
        getSoftware: {
          method: 'GET',
          url: `/api/software/${id}`,
          description: 'Retrieve software details',
          response: software
        },
        searchSoftware: {
          method: 'GET',
          url: `/api/software?search=${encodeURIComponent(software.name)}`,
          description: 'Search for software by name',
          parameters: { search: software.name }
        },
        filterByCategory: {
          method: 'GET',
          url: `/api/software?category=${encodeURIComponent(software.category)}`,
          description: 'Filter software by category',
          parameters: { category: software.category }
        }
      },
      aiIntegration: {
        intelligenceLevel: software.aiMetadata.intelligenceLevel,
        automationScore: software.aiMetadata.automationScore,
        aiFeatures: software.aiMetadata.aiFeatures,
        apiEndpoints: software.aiMetadata.apiEndpoints,
        responseTime: software.aiMetadata.responseTime
      }
    };

    res.json({
      message: 'Examples retrieved successfully',
      data: examples
    });
  } catch (error) {
    console.error('Error retrieving examples:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve examples',
      code: 'EXAMPLES_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
