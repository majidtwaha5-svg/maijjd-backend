/**
 * MJND AI Agent - Custom AI Assistant for Maijjd Platform
 * Handles customer inquiries automatically with brand voice
 */

class MJNDAgent {
  constructor() {
    this.name = "MJND Agent";
    this.version = "1.0.0";
    this.brand = "Maijjd";
    this.responses = this.initializeResponses();
    this.context = {
      currentUser: null,
      conversationHistory: [],
      activeServices: [],
      pricing: null
    };
  }

  /**
   * Initialize response templates for common inquiries
   */
  initializeResponses() {
    return {
      greeting: [
        "Hello! I'm MJND, your AI assistant for Maijjd. How can I help you today?",
        "Hi there! MJND here, ready to assist you with Maijjd's software solutions. What can I do for you?",
        "Welcome! I'm MJND, your personal guide to Maijjd's 50+ software categories and 26+ services. How may I help?"
      ],
      software: [
        "Maijjd offers 50+ software categories including System Software, Application Software, Development Tools, Scientific Software, Real-time Software, Embedded Software, Cloud Software, AI & Machine Learning, CRM, ERP, and many more!",
        "Our software portfolio covers everything from basic productivity tools to advanced enterprise solutions. We have System Software, Application Software, Development Software, Scientific Software, Real-time Software, Embedded Software, Cloud Software, AI platforms, CRM, ERP, and 40+ other specialized categories.",
        "Maijjd provides comprehensive software solutions across 50 categories. From System Software & Operating Systems to AI & Machine Learning Platforms, CRM & Customer Management, ERP & Business Process Management, and 40+ more specialized categories."
      ],
      services: [
        "Maijjd offers 26+ professional services including Custom Software Development, Web Application Development, Mobile App Development, Cloud Infrastructure & DevOps, AI & Machine Learning Services, Data Analytics & Business Intelligence, Cybersecurity & Compliance, UI/UX Design, Quality Assurance & Testing, Technical Consulting & Architecture, and 16+ more services.",
        "Our service portfolio includes Custom Software Development, Web & Mobile App Development, Cloud Infrastructure & DevOps, AI & Machine Learning Services, Data Analytics & Business Intelligence, Cybersecurity & Compliance, UI/UX Design, Quality Assurance & Testing, Technical Consulting, and 16+ additional professional services.",
        "We provide 26+ specialized services: Custom Software Development, Web & Mobile Development, Cloud Infrastructure & DevOps, AI & Machine Learning Services, Data Analytics & Business Intelligence, Cybersecurity & Compliance, UI/UX Design, Quality Assurance & Testing, Technical Consulting & Architecture, and 16+ more professional services."
      ],
      pricing: [
        "Maijjd offers flexible pricing with a free tier for basic features, professional plans for businesses, enterprise solutions for large organizations, and custom pricing for specialized needs. All admin users have free access to all features.",
        "Our pricing structure includes: Free tier for basic features, Professional plans for businesses, Enterprise solutions for large organizations, and Custom pricing for specialized needs. Admin users get free access to all categories.",
        "Maijjd provides: Free tier for basic features, Professional plans for businesses, Enterprise solutions for large organizations, and Custom pricing for specialized needs. Admin users have zero cost access to all software and services."
      ],
      support: [
        "Maijjd provides 24/7 technical support for all users. You can reach us at info@maijjd.com or through our support portal at https://maijjd.com/support.",
        "We offer round-the-clock technical support. Contact us at info@maijjd.com or visit https://maijjd.com/support for assistance.",
        "Maijjd's support team is available 24/7. Reach out to us at info@maijjd.com or access our support portal at https://maijjd.com/support."
      ],
      features: [
        "Maijjd's key features include: Complete project management, Real-time collaboration tools, Advanced analytics and reporting, Secure data handling, Scalable infrastructure, Integrated development tools, Code collaboration features, Version control integration, Automated testing frameworks, Deployment pipelines, and Performance monitoring.",
        "Our platform offers: Complete project management, Real-time collaboration tools, Advanced analytics and reporting, Secure data handling, Scalable infrastructure, Integrated development tools, Code collaboration features, Version control integration, Automated testing frameworks, Deployment pipelines, and Performance monitoring.",
        "Key features of Maijjd: Complete project management, Real-time collaboration tools, Advanced analytics and reporting, Secure data handling, Scalable infrastructure, Integrated development tools, Code collaboration features, Version control integration, Automated testing frameworks, Deployment pipelines, and Performance monitoring."
      ]
    };
  }

  /**
   * Process incoming customer message and generate appropriate response
   */
  async processMessage(message, userContext = {}) {
    try {
      // Update context with user information
      this.context.currentUser = userContext;
      
      // Add to conversation history
      this.context.conversationHistory.push({
        timestamp: new Date(),
        user: message,
        agent: null
      });

      // Analyze message intent
      const intent = this.analyzeIntent(message);
      
      // Generate response based on intent
      const response = await this.generateResponse(intent, message, userContext);
      
      // Add response to conversation history
      this.context.conversationHistory[this.context.conversationHistory.length - 1].agent = response;
      
      return {
        success: true,
        response: response,
        intent: intent,
        timestamp: new Date(),
        agent: this.name
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        error: 'Sorry, I encountered an error. Please try again or contact support.',
        timestamp: new Date(),
        agent: this.name
      };
    }
  }

  /**
   * Analyze user intent from message
   */
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Greeting patterns
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }
    
    // Software inquiries
    if (lowerMessage.includes('software') || lowerMessage.includes('program') || lowerMessage.includes('application')) {
      return 'software';
    }
    
    // Services inquiries
    if (lowerMessage.includes('service') || lowerMessage.includes('development') || lowerMessage.includes('consulting')) {
      return 'services';
    }
    
    // Pricing inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('free') || lowerMessage.includes('payment')) {
      return 'pricing';
    }
    
    // Support inquiries
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact')) {
      return 'support';
    }
    
    // Features inquiries
    if (lowerMessage.includes('feature') || lowerMessage.includes('capability') || lowerMessage.includes('what can')) {
      return 'features';
    }
    
    // Default to general inquiry
    return 'general';
  }

  /**
   * Generate response based on intent
   */
  async generateResponse(intent, message, userContext) {
    const responses = this.responses[intent] || this.responses.greeting;
    
    // Select random response from available options
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Customize response based on user context
    let customizedResponse = selectedResponse;
    
    // Add personalization if user is authenticated
    if (userContext.isAuthenticated) {
      customizedResponse = `Hello ${userContext.name || 'there'}! ${customizedResponse}`;
    }
    
    // Add relevant links based on intent
    if (intent === 'software') {
      customizedResponse += `\n\n🔗 Explore our software categories: https://maijjd.com/software-dashboard`;
    } else if (intent === 'services') {
      customizedResponse += `\n\n🔗 View our services: https://maijjd.com/services`;
    } else if (intent === 'pricing') {
      customizedResponse += `\n\n🔗 Check our pricing: https://maijjd.com/pricing`;
    } else if (intent === 'support') {
      customizedResponse += `\n\n🔗 Get support: https://maijjd.com/support`;
    }
    
    return customizedResponse;
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.context.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.context.conversationHistory = [];
  }

  /**
   * Update user context
   */
  updateUserContext(userContext) {
    this.context.currentUser = userContext;
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    return {
      name: this.name,
      version: this.version,
      brand: this.brand,
      capabilities: [
        'Customer support',
        'Software information',
        'Service inquiries',
        'Pricing information',
        'Feature explanations',
        'General assistance'
      ]
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MJNDAgent;
}

// Global availability for browser use
if (typeof window !== 'undefined') {
  window.MJNDAgent = MJNDAgent;
}
