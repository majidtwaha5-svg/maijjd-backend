/**
 * Enhanced Payment Route Validation and Performance Optimizations
 * This file provides validation utilities and performance enhancements
 */

/**
 * Validate plan ID
 */
function validatePlanId(planId) {
  const validPlans = ['free', 'starter', 'professional', 'enterprise'];
  return validPlans.includes(planId);
}

/**
 * Validate product ID
 */
function validateProductId(productId) {
  const validProducts = ['premium_upgrade', 'api_access', 'custom_development'];
  return validProducts.includes(productId);
}

/**
 * Validate amount (in cents)
 */
function validateAmount(amount) {
  return typeof amount === 'number' && amount >= 0 && amount <= 100000000; // Max $1M
}

/**
 * Validate currency
 */
function validateCurrency(currency) {
  const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
  return validCurrencies.includes(currency?.toLowerCase());
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize metadata
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  
  const sanitized = {};
  const allowedKeys = [
    'plan_id', 'plan_name', 'product_id', 'product_name',
    'user_id', 'order_id', 'created_by', 'source', 'campaign'
  ];
  
  for (const [key, value] of Object.entries(metadata)) {
    // Only allow alphanumeric and underscore in keys
    if (/^[a-zA-Z0-9_]+$/.test(key) && allowedKeys.includes(key)) {
      // Ensure value is string and not too long
      const stringValue = String(value);
      if (stringValue.length <= 500) {
        sanitized[key] = stringValue;
      }
    }
  }
  
  return sanitized;
}

/**
 * Build comprehensive metadata
 */
function buildMetadata(planOrProduct, additionalData = {}) {
  return {
    plan_id: planOrProduct.id,
    plan_name: planOrProduct.name,
    created_at: new Date().toISOString(),
    source: 'maijjd_platform',
    version: '1.0.0',
    ...sanitizeMetadata(additionalData)
  };
}

/**
 * Performance: Cache price lookups
 */
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedPrice(priceId) {
  const cached = priceCache.get(priceId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPrice(priceId, priceData) {
  priceCache.set(priceId, {
    data: priceData,
    timestamp: Date.now()
  });
}

/**
 * Clear cache
 */
function clearPriceCache() {
  priceCache.clear();
}

/**
 * Error response helper
 */
function errorResponse(res, statusCode, message, details = {}) {
  return res.status(statusCode).json({
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Success response helper
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error handler wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Rate limiting helper (basic)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const requests = requestCounts.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);
  return true;
}

/**
 * Validate checkout session request
 */
function validateCheckoutRequest(req) {
  const errors = [];
  
  const { planId, successUrl, cancelUrl } = req.body;
  
  if (!planId) {
    errors.push('planId is required');
  } else if (!validatePlanId(planId)) {
    errors.push(`Invalid planId: ${planId}`);
  }
  
  if (successUrl && !validateUrl(successUrl)) {
    errors.push('Invalid successUrl format');
  }
  
  if (cancelUrl && !validateUrl(cancelUrl)) {
    errors.push('Invalid cancelUrl format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate one-time purchase request
 */
function validateOneTimeRequest(req) {
  const errors = [];
  
  const { productId, successUrl, cancelUrl } = req.body;
  
  if (!productId) {
    errors.push('productId is required');
  } else if (!validateProductId(productId)) {
    errors.push(`Invalid productId: ${productId}`);
  }
  
  if (successUrl && !validateUrl(successUrl)) {
    errors.push('Invalid successUrl format');
  }
  
  if (cancelUrl && !validateUrl(cancelUrl)) {
    errors.push('Invalid cancelUrl format');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate subscription creation request
 */
function validateSubscriptionRequest(req) {
  const errors = [];
  
  const { priceId, customerEmail, metadata } = req.body;
  
  if (!priceId) {
    errors.push('priceId is required');
  }
  
  if (!customerEmail) {
    errors.push('customerEmail is required');
  } else if (!validateEmail(customerEmail)) {
    errors.push('Invalid email format');
  }
  
  if (metadata && typeof metadata !== 'object') {
    errors.push('metadata must be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validatePlanId,
  validateProductId,
  validateAmount,
  validateCurrency,
  validateEmail,
  validateUrl,
  sanitizeMetadata,
  buildMetadata,
  getCachedPrice,
  setCachedPrice,
  clearPriceCache,
  errorResponse,
  successResponse,
  asyncHandler,
  checkRateLimit,
  validateCheckoutRequest,
  validateOneTimeRequest,
  validateSubscriptionRequest
};

