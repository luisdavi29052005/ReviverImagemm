import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Initialize Stripe with error handling
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

// Configure CORS to accept both production and development origins
const allowedOrigins = [
  'https://www.reviverimagem.shop',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Parse JSON payloads
app.use(express.json());

// Initialize Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore();

// Subscription plans matching the frontend
const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Plano Gratuito',
    credits: 10,
    price: 0,
    description: '10 créditos diários'
  },
  basic: {
    id: 'basic',
    name: 'Plano Básico',
    credits: 100,
    price: 29.90,
    description: '100 créditos diários'
  },
  pro: {
    id: 'pro',
    name: 'Plano Profissional',
    credits: 200,
    price: 49.90,
    description: '200 créditos diários'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plano Enterprise',
    credits: 300,
    price: 79.90,
    description: '300 créditos diários'
  }
};

// Create subscription checkout session
app.post('/create-subscription', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    if (!planId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Determine the success and cancel URLs based on the request origin
    const origin = req.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/payment/cancel`;

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.name,
              description: `${plan.credits} créditos diários`,
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        credits: plan.credits.toString()
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
app.post('/update-subscription', async (req, res) => {
  try {
    const { userId, newPlanId } = req.body;

    if (!userId || !newPlanId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userDoc.data().stripeCustomerId,
      limit: 1,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = subscriptions.data[0];
    const plan = subscriptionPlans[newPlanId];

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price_data: {
          currency: 'brl',
          product_data: {
            name: plan.name,
            description: `${plan.credits} créditos diários`,
          },
          unit_amount: Math.round(plan.price * 100),
          recurring: {
            interval: 'month'
          }
        }
      }],
      proration_behavior: 'always_invoice'
    });

    res.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Cancel subscription
app.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userDoc.data().stripeCustomerId,
      limit: 1,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get subscription status
app.get('/subscription-status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.json({ status: 'none' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userDoc.data().stripeCustomerId,
      limit: 1,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return res.json({ status: 'none' });
    }

    const subscription = subscriptions.data[0];
    res.json({
      status: subscription.status,
      planId: subscription.items.data[0].price.id,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

async function handleSubscriptionChange(subscription) {
  try {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: subscription.status,
      subscriptionPlan: subscription.items.data[0].price.id,
      subscriptionPeriodEnd: subscription.current_period_end,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCanceled(subscription) {
  try {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'canceled',
      subscriptionPlan: null,
      subscriptionPeriodEnd: null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});