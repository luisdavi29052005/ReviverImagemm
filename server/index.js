import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Configurar CORS para permitir requisições do frontend
app.use(cors({
  origin: 'https://www.reviverimagem.shop',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Inicializar Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore();

const plans = {
  basic: {
    price: 500, // $5.00
    credits: 5,
    name: 'Basic Plan'
  },
  standard: {
    price: 1000, // $10.00
    credits: 15,
    name: 'Standard Plan'
  },
  premium: {
    price: 2000, // $20.00
    credits: 50,
    name: 'Premium Plan'
  }
};

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.name,
              description: `${plan.credits} credits`,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://www.reviverimagem.shop/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.reviverimagem.shop/payment/cancel`,
      customer_email: userEmail,
      metadata: {
        userId,
        planId,
        credits: plan.credits.toString()
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const { userId, credits } = session.metadata;
    const creditsToAdd = parseInt(credits, 10);

    // Update user credits in Firestore
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentCredits = userDoc.data().credits || 0;
      const newCredits = currentCredits + creditsToAdd;

      transaction.update(userRef, { 
        credits: newCredits,
        updatedAt: new Date()
      });

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: session.amount_total / 100,
        credits: creditsToAdd,
        status: 'completed',
        paymentId: session.payment_intent,
        paymentMethod: 'stripe',
        createdAt: new Date()
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await handleSuccessfulPayment(session);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      return res.status(500).json({ error: 'Failed to process payment' });
    }
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(session) {
  const { userId, credits } = session.metadata;
  const creditsToAdd = parseInt(credits, 10);

  const userRef = db.collection('users').doc(userId);
  
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data().credits || 0;
    transaction.update(userRef, { 
      credits: currentCredits + creditsToAdd,
      updatedAt: new Date()
    });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
