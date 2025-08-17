const express = require('express');
const router = express.Router();

// Stripe optional integration
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    // Lazy require to avoid crash when key missing
    // eslint-disable-next-line global-require
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.error('Stripe init failed:', e.message);
    stripe = null;
  }
}

// Plan definitions (source of truth)
const PLANS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    amount: 5000, // cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Core features',
      'Essential usage limits',
      'Community support'
    ],
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || null,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    amount: 19900, // cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Standard',
      'Advanced tools and services',
      'Higher usage limits',
      'Priority support'
    ],
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || null,
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
  res.json({
    plans: Object.values(PLANS).map(p => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      interval: p.interval,
      features: p.features,
      hasStripePrice: Boolean(p.stripePriceId)
    })),
    trialDays: Number(process.env.TRIAL_DAYS || 0)
  });
});

// Expose publishable key safely (for Stripe Elements if needed)
router.get('/public-key', (req, res) => {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY || null;
  res.json({ publishableKey: pk ? String(pk) : null });
});

// Create Checkout Session for subscription
router.post('/checkout', async (req, res) => {
  try {
    const { plan, custom_amount_cents, custom_name, currency } = req.body || {};
    const chosen = plan ? PLANS[String(plan).toLowerCase()] : null;

    const successUrl = `${getFrontendBase(req)}/?billing=success&plan=${chosen?.id || 'custom'}`;
    const cancelUrl = `${getFrontendBase(req)}/?billing=cancel`;

    if (!stripe) {
      return res.json({
        mode: 'simulated',
        url: `${getFrontendBase(req)}/register?plan=${chosen?.id || 'custom'}`,
        message: 'Stripe not configured. Redirecting to signup as a fallback.'
      });
    }

    // Build line item honoring frontend-displayed price.
    let lineItem;
    if (custom_amount_cents && Number(custom_amount_cents) > 0) {
      lineItem = {
        price_data: {
          currency: (currency || chosen?.currency || 'usd'),
          product_data: { name: custom_name || `${chosen?.name || 'Subscription'} Plan` },
          recurring: { interval: chosen?.interval || 'month' },
          unit_amount: Number(custom_amount_cents),
        },
        quantity: 1,
      };
    } else if (chosen) {
      lineItem = chosen.stripePriceId
        ? { price: chosen.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: chosen.currency,
              product_data: { name: `${chosen.name} Plan` },
              recurring: { interval: chosen.interval },
              unit_amount: chosen.amount,
            },
            quantity: 1,
          };
    } else {
      return res.status(400).json({ error: 'invalid_request', message: 'Provide a valid plan or custom_amount_cents' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      metadata: { plan: chosen?.id || 'custom' }
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'checkout_failed', message: err.message });
  }
});

// Create a Billing Portal session so users can manage invoices and cards
router.post('/portal', async (req, res) => {
  try {
    const { customerId } = req.body || {};
    const returnUrl = `${getFrontendBase(req)}/billing`;

    if (!stripe || !customerId) {
      // Fallback: if we can't open a portal, send user to account page
      return res.json({
        mode: 'simulated',
        url: `${getFrontendBase(req)}/dashboard?billing=manage`,
        message: 'Portal unavailable. Redirecting to account dashboard.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Portal error:', err);
    return res.status(500).json({ error: 'portal_failed', message: err.message });
  }
});

// Optional webhook endpoint (safe no-op without secret)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(200).send('ok');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Stripe webhook event:', event.type);
    return res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;


