const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RvdYuQSGViadIU5ElNy1cnw4VeAHfi5dgvWjVbpjWwAyssSmfJONci8b8Ph1Od5fNNCjPro6g7ArRWxEFHrkuNS00k4iFnV4C');

// Create payment link
router.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, name, description, metadata } = req.body;

    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            description: description || name,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      after_completion: { 
        type: 'redirect', 
        redirect: { url: 'https://maijjd.com/payment/success' } 
      },
      metadata: metadata || {}
    });

    res.json({ url: paymentLink.url, id: paymentLink.id });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, name, description, metadata, mode = 'payment' } = req.body;

    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            description: description || name,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode,
      success_url: 'https://maijjd.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://maijjd.com/payment/cancel',
      metadata: metadata || {}
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/create-subscription', async (req, res) => {
  try {
    const { priceId, customerEmail, metadata } = req.body;

    if (!priceId || !customerEmail) {
      return res.status(400).json({ error: 'Price ID and customer email are required' });
    }

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
        metadata: metadata || {}
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'https://maijjd.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://maijjd.com/payment/cancel',
      metadata: metadata || {}
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customer portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://maijjd.com/dashboard',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create setup intent
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment methods
router.get('/payment-methods/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete payment method
router.delete('/payment-methods/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscriptions
router.get('/subscriptions/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    res.json({ subscriptions: subscriptions.data });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
router.put('/subscriptions/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
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
    res.status(500).json({ error: error.message });
  }
});

// Get invoices
router.get('/invoices/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    res.json({ invoices: invoices.data });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download invoice
router.get('/invoices/:invoiceId/download', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await stripe.invoices.retrieve(invoiceId);
    
    if (invoice.invoice_pdf) {
      res.redirect(invoice.invoice_pdf);
    } else {
      res.status(404).json({ error: 'Invoice PDF not available' });
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create refund
router.post('/refunds', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    const refundData = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = amount;
    }

    if (reason) {
      refundData.reason = reason;
    }

    const refund = await stripe.refunds.create(refundData);

    res.json({ refund });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get refunds
router.get('/refunds/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
    });

    res.json({ refunds: refunds.data });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/customers', async (req, res) => {
  try {
    const { email, name, metadata } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: metadata || {}
    });

    res.json({ customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer
router.get('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await stripe.customers.retrieve(customerId);

    res.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { email, name, metadata } = req.body;

    const customer = await stripe.customers.update(customerId, {
      email,
      name,
      metadata: metadata || {}
    });

    res.json({ customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    await stripe.customers.del(customerId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/products', async (req, res) => {
  try {
    const { name, description, metadata } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const product = await stripe.products.create({
      name,
      description: description || name,
      metadata: metadata || {}
    });

    res.json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create price
router.post('/prices', async (req, res) => {
  try {
    const { productId, unitAmount, currency = 'usd', recurring } = req.body;

    if (!productId || !unitAmount) {
      return res.status(400).json({ error: 'Product ID and unit amount are required' });
    }

    const priceData = {
      product: productId,
      unit_amount: unitAmount,
      currency,
    };

    if (recurring) {
      priceData.recurring = recurring;
    }

    const price = await stripe.prices.create(priceData);

    res.json({ price });
  } catch (error) {
    console.error('Error creating price:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await stripe.products.list({
      limit: 100,
    });

    res.json({ products: products.data });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      limit: 100,
    });

    res.json({ prices: prices.data });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    stripe_version: '2023-10-16'
  });
});

// Get Stripe status
router.get('/status', (req, res) => {
  res.json({ 
    status: 'connected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get payment links
router.get('/payment-links', async (req, res) => {
  try {
    const paymentLinks = await stripe.paymentLinks.list({
      limit: 100,
    });

    res.json({ links: paymentLinks.data });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent transactions
router.get('/transactions', async (req, res) => {
  try {
    const payments = await stripe.paymentIntents.list({
      limit: 50,
      created: {
        gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) // Last 30 days
      }
    });

    const transactions = payments.data.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      customer: payment.receipt_email || 'Unknown',
      date: new Date(payment.created * 1000).toISOString().split('T')[0]
    }));

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Stripe connection
router.get('/test-connection', async (req, res) => {
  try {
    // Test basic Stripe functionality
    const account = await stripe.accounts.retrieve();
    
    res.json({ 
      status: 'connected',
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      livemode: account.livemode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all customers (missing endpoint)
router.get('/customers', async (req, res) => {
  try {
    const customers = await stripe.customers.list({
      limit: 100,
    });

    res.json({ customers: customers.data });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices (missing endpoint)
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await stripe.invoices.list({
      limit: 100,
    });

    res.json({ invoices: invoices.data });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create invoice (missing endpoint)
router.post('/invoices', async (req, res) => {
  try {
    const { customer, description, metadata, amount, currency = 'usd' } = req.body;

    if (!customer || !description) {
      return res.status(400).json({ error: 'Customer ID and description are required' });
    }

    const invoiceData = {
      customer,
      description,
      metadata: metadata || {},
      currency
    };

    if (amount) {
      invoiceData.amount = amount;
    }

    const invoice = await stripe.invoices.create(invoiceData);

    res.json({ invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all subscriptions (missing endpoint)
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.default_payment_method'],
    });

    res.json({ subscriptions: subscriptions.data });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription (missing endpoint)
router.post('/subscriptions', async (req, res) => {
  try {
    const { customer, items, metadata } = req.body;

    if (!customer || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Customer ID and items array are required' });
    }

    const subscription = await stripe.subscriptions.create({
      customer,
      items,
      metadata: metadata || {}
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tax rates (missing endpoint)
router.get('/tax-rates', async (req, res) => {
  try {
    const taxRates = await stripe.taxRates.list({
      limit: 100,
    });

    res.json({ tax_rates: taxRates.data });
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get automatic tax configuration (missing endpoint)
router.get('/automatic-tax', async (req, res) => {
  try {
    // This would typically check if automatic tax is enabled
    // For now, return a basic response
    res.json({ 
      automatic_tax_enabled: false,
      message: 'Automatic tax configuration endpoint accessible'
    });
  } catch (error) {
    console.error('Error checking automatic tax:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get balance (missing endpoint)
router.get('/balance', async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    
    res.json({ 
      balance: balance,
      available: balance.available,
      pending: balance.pending,
      instant_available: balance.instant_available
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analytics (missing endpoint)
router.get('/analytics', async (req, res) => {
  try {
    // Get basic analytics data
    const [payments, customers, subscriptions] = await Promise.all([
      stripe.paymentIntents.list({ limit: 100 }),
      stripe.customers.list({ limit: 100 }),
      stripe.subscriptions.list({ limit: 100 })
    ]);

    const analytics = {
      total_payments: payments.data.length,
      total_customers: customers.data.length,
      total_subscriptions: subscriptions.data.length,
      active_subscriptions: subscriptions.data.filter(sub => sub.status === 'active').length,
      timestamp: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get coupons (missing endpoint)
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await stripe.coupons.list({
      limit: 100,
    });

    res.json({ coupons: coupons.data });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get promotion codes (missing endpoint)
router.get('/promotion-codes', async (req, res) => {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
    });

    res.json({ promotion_codes: promotionCodes.data });
  } catch (error) {
    console.error('Error fetching promotion codes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get disputes (missing endpoint)
router.get('/disputes', async (req, res) => {
  try {
    const disputes = await stripe.disputes.list({
      limit: 100,
    });

    res.json({ disputes: disputes.data });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get refunds (missing endpoint)
router.get('/refunds', async (req, res) => {
  try {
    const refunds = await stripe.refunds.list({
      limit: 100,
    });

    res.json({ refunds: refunds.data });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Billing portal endpoint (missing endpoint)
router.get('/billing-portal', (req, res) => {
  res.json({ 
    message: 'Billing portal endpoint accessible',
    usage: 'POST to /create-portal-session with customerId to create a session'
  });
});

// Payment configuration endpoints (moved from payments.js for Railway compatibility)
router.get('/config', (req, res) => {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY || stripe.publishableKey || null;
  res.json({ publishableKey: pk ? String(pk) : null });
});

// Plans endpoint (moved from payments.js)
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
    amount: 2999,
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
    amount: 9999,
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
    amount: 29999,
    currency: 'usd',
    interval: 'month',
    features: [
      'Access to all software solutions',
      '24/7 dedicated support',
      'All premium features',
      'API access',
      'Custom integrations',
      'Advanced analytics',
      'Custom SLA'
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
  }
};

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Products endpoint
const ONE_TIME_PRODUCTS = {
  premiumUpgrade: {
    id: 'premium-upgrade',
    name: 'Premium Upgrade',
    amount: 2999,
    currency: 'usd',
    description: 'One-time premium feature upgrade',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_UPGRADE || null,
  },
  apiAccess: {
    id: 'api-access',
    name: 'API Access',
    amount: 9999,
    currency: 'usd',
    description: 'One-time API access purchase',
    stripePriceId: process.env.STRIPE_PRICE_API_ACCESS || null,
  },
  customDevelopment: {
    id: 'custom-development',
    name: 'Custom Development',
    amount: 49999,
    currency: 'usd',
    description: 'Custom development service',
    stripePriceId: process.env.STRIPE_PRICE_CUSTOM_DEVELOPMENT || null,
  }
};

router.get('/products', (req, res) => {
  res.json({ products: ONE_TIME_PRODUCTS });
});

module.exports = router;
