const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RvdYuQSGViadIU5ElNy1cnw4VeAHfi5dgvWjVbpjWwAyssSmfJONci8b8Ph1Od5fNNCjPro6g7ArRWxEFHrkuNS00k4iFnV4C');

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object);
        break;
      
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment Intent Handlers
async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Payment succeeded:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.customer,
    metadata: paymentIntent.metadata
  });

  // Update user subscription status
  if (paymentIntent.metadata && paymentIntent.metadata.type === 'subscription') {
    await updateUserSubscription(paymentIntent.customer, 'active', paymentIntent.metadata);
  }

  // Send confirmation email
  await sendPaymentConfirmationEmail(paymentIntent);
}

async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Payment failed:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.customer,
    last_payment_error: paymentIntent.last_payment_error
  });

  // Update user subscription status
  if (paymentIntent.metadata && paymentIntent.metadata.type === 'subscription') {
    await updateUserSubscription(paymentIntent.customer, 'failed', paymentIntent.metadata);
  }

  // Send failure notification
  await sendPaymentFailureEmail(paymentIntent);
}

// Checkout Session Handlers
async function handleCheckoutCompleted(session) {
  console.log('🛒 Checkout completed:', {
    id: session.id,
    customer: session.customer,
    amount_total: session.amount_total,
    metadata: session.metadata
  });

  // Process the completed checkout
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session);
  } else {
    await handleOneTimePayment(session);
  }

  // Send welcome email
  await sendWelcomeEmail(session);
}

// Subscription Handlers
async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    current_period_end: subscription.current_period_end
  });

  await createUserSubscription(subscription);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('📅 Subscription updated:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    current_period_end: subscription.current_period_end
  });

  await updateUserSubscription(subscription.customer, subscription.status, subscription.metadata);
}

async function handleSubscriptionDeleted(subscription) {
  console.log('📅 Subscription deleted:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status
  });

  await cancelUserSubscription(subscription.customer);
}

// Invoice Handlers
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('📄 Invoice payment succeeded:', {
    id: invoice.id,
    customer: invoice.customer,
    amount_paid: invoice.amount_paid,
    subscription: invoice.subscription
  });

  // Update subscription status
  if (invoice.subscription) {
    await updateUserSubscription(invoice.customer, 'active', { subscription_id: invoice.subscription });
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('📄 Invoice payment failed:', {
    id: invoice.id,
    customer: invoice.customer,
    amount_due: invoice.amount_due,
    subscription: invoice.subscription
  });

  // Update subscription status
  if (invoice.subscription) {
    await updateUserSubscription(invoice.customer, 'past_due', { subscription_id: invoice.subscription });
  }

  // Send payment reminder
  await sendPaymentReminderEmail(invoice);
}

// Customer Handlers
async function handleCustomerCreated(customer) {
  console.log('👤 Customer created:', {
    id: customer.id,
    email: customer.email,
    name: customer.name
  });

  await createUserProfile(customer);
}

async function handleCustomerUpdated(customer) {
  console.log('👤 Customer updated:', {
    id: customer.id,
    email: customer.email,
    name: customer.name
  });

  await updateUserProfile(customer);
}

async function handleCustomerDeleted(customer) {
  console.log('👤 Customer deleted:', {
    id: customer.id,
    email: customer.email
  });

  await deleteUserProfile(customer.id);
}

// Helper Functions
async function updateUserSubscription(customerId, status, metadata) {
  try {
    // Update user subscription in your database
    console.log(`Updating subscription for customer ${customerId} to status: ${status}`);
    
    // Example database update:
    // await db.query(
    //   'UPDATE users SET subscription_status = $1, subscription_metadata = $2 WHERE stripe_customer_id = $3',
    //   [status, metadata, customerId]
    // );
    
  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
}

async function createUserSubscription(subscription) {
  try {
    console.log(`Creating subscription for customer ${subscription.customer}`);
    
    // Example database insert:
    // await db.query(
    //   'INSERT INTO subscriptions (stripe_subscription_id, customer_id, status, plan_id, current_period_end) VALUES ($1, $2, $3, $4, $5)',
    //   [subscription.id, subscription.customer, subscription.status, subscription.items.data[0].price.id, subscription.current_period_end]
    // );
    
  } catch (error) {
    console.error('Error creating user subscription:', error);
  }
}

async function cancelUserSubscription(customerId) {
  try {
    console.log(`Cancelling subscription for customer ${customerId}`);
    
    // Example database update:
    // await db.query(
    //   'UPDATE subscriptions SET status = $1, cancelled_at = NOW() WHERE customer_id = $2',
    //   ['cancelled', customerId]
    // );
    
  } catch (error) {
    console.error('Error cancelling user subscription:', error);
  }
}

async function handleSubscriptionCheckout(session) {
  try {
    console.log(`Processing subscription checkout for session ${session.id}`);
    
    // Handle subscription-specific logic
    // This could include setting up user access, sending welcome emails, etc.
    
  } catch (error) {
    console.error('Error handling subscription checkout:', error);
  }
}

async function handleOneTimePayment(session) {
  try {
    console.log(`Processing one-time payment for session ${session.id}`);
    
    // Handle one-time payment logic
    // This could include granting access to specific features, sending confirmation emails, etc.
    
  } catch (error) {
    console.error('Error handling one-time payment:', error);
  }
}

async function createUserProfile(customer) {
  try {
    console.log(`Creating user profile for customer ${customer.id}`);
    
    // Example database insert:
    // await db.query(
    //   'INSERT INTO users (stripe_customer_id, email, name, created_at) VALUES ($1, $2, $3, NOW())',
    //   [customer.id, customer.email, customer.name]
    // );
    
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
}

async function updateUserProfile(customer) {
  try {
    console.log(`Updating user profile for customer ${customer.id}`);
    
    // Example database update:
    // await db.query(
    //   'UPDATE users SET email = $1, name = $2, updated_at = NOW() WHERE stripe_customer_id = $3',
    //   [customer.email, customer.name, customer.id]
    // );
    
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
}

async function deleteUserProfile(customerId) {
  try {
    console.log(`Deleting user profile for customer ${customerId}`);
    
    // Example database update:
    // await db.query(
    //   'UPDATE users SET deleted_at = NOW(), status = $1 WHERE stripe_customer_id = $2',
    //   ['deleted', customerId]
    // );
    
  } catch (error) {
    console.error('Error deleting user profile:', error);
  }
}

// Email Functions (placeholder implementations)
async function sendPaymentConfirmationEmail(paymentIntent) {
  console.log(`📧 Sending payment confirmation email for payment ${paymentIntent.id}`);
  // Implement email sending logic
}

async function sendPaymentFailureEmail(paymentIntent) {
  console.log(`📧 Sending payment failure email for payment ${paymentIntent.id}`);
  // Implement email sending logic
}

async function sendWelcomeEmail(session) {
  console.log(`📧 Sending welcome email for session ${session.id}`);
  // Implement email sending logic
}

async function sendPaymentReminderEmail(invoice) {
  console.log(`📧 Sending payment reminder email for invoice ${invoice.id}`);
  // Implement email sending logic
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    webhook_endpoint: '/stripe/webhook'
  });
});

module.exports = router;
