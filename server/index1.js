import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);
const app = express();

// Configure CORS with proper origin handling
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['https://www.reviverimagem.shop'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
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

// Create subscription endpoint
app.post('/create-subscription', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get origin for success/cancel URLs
    const origin = req.get('origin') || 'https://reviver-imagemm-server-v946gcy7p-davis-projects-f055a2bc.vercel.app';

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
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
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

// Rota para testar se o servidor está rodando corretamente
app.get('/up', (req, res) => {
  res.send('Reviver Imagemm Server is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});