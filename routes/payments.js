const express = require('express');
const router = express.Router();
const {
  validateCheckoutRequest,
  validateOneTimeRequest,
  validateSubscriptionRequest,
  buildMetadata,
  sanitizeMetadata,
  errorResponse,
  successResponse,
  asyncHandler,
  checkRateLimit
} = require('./payments-validation');

// Stripe integration
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.error('Stripe init failed:', e.message);
    stripe = null;
  }
}

// Updated plan definitions matching frontend pricing
const PLANS = {
  free: {
    id: 'free',
    name: 'Free Trial',
    amount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      'Access to basic software solutions',
      'Community support',
      'Limited features',
      '7-day trial period'
    ],
    stripePriceId: process.env.STRIPE_PRICE_FREE || null,
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    amount: 2999, // $29.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Access to 20+ software solutions',
      'Email support',
      'Standard features',
      'Basic analytics'
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER || null,
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    amount: 9999, // $99.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Access to all 50+ software solutions',
      'Priority support',
      'Advanced features',
      'API access',
      'Advanced analytics'
    ],
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || null,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    amount: 29999, // $299.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Access to all software solutions',
      '24/7 dedicated support',
      'Custom integrations',
      'White-label options',
      'Advanced analytics',
      'Custom pricing available'
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
  }
};

// One-time products
const ONE_TIME_PRODUCTS = {
  premium_upgrade: {
    id: 'premium_upgrade',
    name: 'Premium Upgrade',
    amount: 2999, // $29.99 in cents
    description: 'One-time premium features upgrade',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_UPGRADE || null,
  },
  api_access: {
    id: 'api_access',
    name: 'API Access',
    amount: 9999, // $99.99 in cents
    description: 'One-time API access purchase',
    stripePriceId: process.env.STRIPE_PRICE_API_ACCESS || null,
  },
  custom_development: {
    id: 'custom_development',
    name: 'Custom Development',
    amount: 49999, // $499.99 in cents
    description: 'Custom software development service',
    stripePriceId: process.env.STRIPE_PRICE_CUSTOM_DEVELOPMENT || null,
  }
};

function getFrontendBase(req) {
  const configured = process.env.FRONTEND_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  return origin.replace(/\/$/, '');
}

// Public config for frontend display (no secrets)
router.get('/config', (req, res) => {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY;
  res.json({ publishableKey: pk ? String(pk) : null });
});

// Get all plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Get all one-time products
router.get('/products', (req, res) => {
  res.json({ products: ONE_TIME_PRODUCTS });
});

// Create Checkout Session for subscription
router.post('/create-checkout-session', asyncHandler(async (req, res) => {
  // Rate limiting
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientId)) {
    return errorResponse(res, 429, 'Too many requests. Please try again later.');
  }

  // Validation
  const validation = validateCheckoutRequest(req);
  if (!validation.valid) {
    return errorResponse(res, 400, 'Validation failed', { errors: validation.errors });
  }

  const { planId, successUrl, cancelUrl } = req.body;
  const plan = PLANS[planId];

  if (!plan) {
    return errorResponse(res, 400, 'Invalid plan ID');
  }

  const success = successUrl || `${getFrontendBase(req)}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel = cancelUrl || `${getFrontendBase(req)}/payment/cancel`;

  if (!stripe) {
    return res.json({
      mode: 'simulated',
      url: `${getFrontendBase(req)}/register?plan=${plan.id}`,
      message: 'Stripe not configured. Redirecting to signup as a fallback.'
    });
  }

  // Build comprehensive metadata
  const metadata = buildMetadata(plan, {
    created_by: 'checkout_api',
    user_ip: clientId,
    user_agent: req.headers['user-agent'],
    ...sanitizeMetadata(req.body.metadata || {})
  });

  // Create checkout session with 7-day trial period
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: plan.stripePriceId || undefined,
      price_data: plan.stripePriceId ? undefined : {
        currency: plan.currency,
        product_data: {
          name: `${plan.name} Subscription`,
          description: plan.features.join(', ')
        },
        recurring: {
          interval: plan.interval
        },
        unit_amount: plan.amount,
      },
      quantity: 1,
    }],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: plan.id === 'free' ? undefined : 7, // 7-day free trial for paid plans
      metadata: {
        ...metadata,
        trial_enabled: plan.id !== 'free'
      }
    },
    success_url: success,
    cancel_url: cancel,
    metadata: metadata,
    allow_promotion_codes: true,
    customer_creation: 'always', // Ensure customer is created
    billing_address_collection: 'required' // Collect billing address
  });

  return successResponse(res, { sessionId: session.id, url: session.url });
}));

// Create Checkout Session for one-time purchase
router.post('/create-one-time-checkout-session', asyncHandler(async (req, res) => {
  // Rate limiting
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientId)) {
    return errorResponse(res, 429, 'Too many requests. Please try again later.');
  }

  // Validation
  const validation = validateOneTimeRequest(req);
  if (!validation.valid) {
    return errorResponse(res, 400, 'Validation failed', { errors: validation.errors });
  }

  const { productId, successUrl, cancelUrl } = req.body;
  const product = ONE_TIME_PRODUCTS[productId];

  if (!product) {
    return errorResponse(res, 400, 'Invalid product ID');
  }

  const success = successUrl || `${getFrontendBase(req)}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel = cancelUrl || `${getFrontendBase(req)}/payment/cancel`;

  if (!stripe) {
    return res.json({
      mode: 'simulated',
      url: `${getFrontendBase(req)}/register?product=${product.id}`,
      message: 'Stripe not configured. Redirecting to signup as a fallback.'
    });
  }

  // Build comprehensive metadata
  const metadata = buildMetadata(product, {
    created_by: 'checkout_api',
    product_type: 'one_time',
    user_ip: clientId,
    user_agent: req.headers['user-agent'],
    ...sanitizeMetadata(req.body.metadata || {})
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: product.stripePriceId || undefined,
      price_data: product.stripePriceId ? undefined : {
        currency: 'usd',
        product_data: {
          name: product.name,
          description: product.description
        },
        unit_amount: product.amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: success,
    cancel_url: cancel,
    metadata: metadata,
    customer_creation: 'always',
    billing_address_collection: 'required'
  });

  return successResponse(res, { sessionId: session.id, url: session.url });
}));

// Create Payment Link
router.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, name, description, metadata = {} } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: name,
            description: description || name
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      metadata: {
        created_by: 'api',
        ...metadata
      }
    });

    res.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// Create Subscription
router.post('/create-subscription', asyncHandler(async (req, res) => {
  // Validation
  const validation = validateSubscriptionRequest(req);
  if (!validation.valid) {
    return errorResponse(res, 400, 'Validation failed', { errors: validation.errors });
  }

  if (!stripe) {
    return errorResponse(res, 500, 'Stripe not configured');
  }

  const { priceId, customerEmail, metadata = {} } = req.body;

  // Create or get customer
  let customer;
  const existingCustomers = await stripe.customers.list({
    email: customerEmail,
    limit: 1
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: customerEmail,
      metadata: buildMetadata({ id: 'customer', name: 'Customer' }, {
        created_by: 'api',
        ...sanitizeMetadata(metadata)
      })
    });
  }

  // Build subscription metadata
  const subscriptionMetadata = buildMetadata({ id: 'subscription', name: 'Subscription' }, {
    created_by: 'api',
    customer_id: customer.id,
    customer_email: customerEmail,
    ...sanitizeMetadata(metadata)
  });

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    metadata: subscriptionMetadata,
    expand: ['latest_invoice.payment_intent'] // Expand for better error handling
  });

  return successResponse(res, { subscriptionId: subscription.id, customerId: customer.id });
}));

// Create Portal Session
router.post('/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getFrontendBase(req)}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Create Setup Intent
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Get Payment Methods
router.get('/payment-methods/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Delete Payment Method
router.delete('/payment-methods/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Get Subscriptions
router.get('/subscriptions/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
    });

    res.json({ subscriptions: subscriptions.data });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Cancel Subscription
router.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Update Subscription
router.put('/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { priceId } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get Invoices
router.get('/invoices/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
    });

    res.json({ invoices: invoices.data });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Download Invoice
router.get('/invoices/:invoiceId/download', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);
    
    if (invoice.invoice_pdf) {
      res.redirect(invoice.invoice_pdf);
    } else {
      res.status(404).json({ error: 'Invoice PDF not available' });
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

// Refund Payment
router.post('/refunds', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || undefined,
    });

    res.json({ refund });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: 'Failed to create refund' });
  }
});

// Get Refunds
router.get('/refunds/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
    });

    res.json({ refunds: refunds.data });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

module.exports = router;