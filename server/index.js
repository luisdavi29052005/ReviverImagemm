import express from 'express'; 
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Configuração do domínio
const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = isProduction ? 'https://www.reviverimagem.shop' : 'http://localhost:5000';

// Inicialização segura do Stripe
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('Erro: Chave secreta do Stripe ausente.');
}
const stripe = new Stripe(stripeSecretKey);

// Configuração do servidor
const app = express();
app.use(express.json());

// Configuração CORS
const allowedOrigins = [
  'https://www.reviverimagem.shop',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Inicialização do Firebase
if (!process.env.VITE_FIREBASE_PRIVATE_KEY) {
  throw new Error('Erro: Chave privada do Firebase não configurada.');
}
initializeApp({
  credential: cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.VITE_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

// Planos de assinatura
const subscriptionPlans = {
  free: { id: 'free', name: 'Plano Gratuito', credits: 10, price: 0 },
  basic: { id: 'basic', name: 'Plano Básico', credits: 100, price: 29.9 },
  pro: { id: 'pro', name: 'Plano Profissional', credits: 200, price: 49.9 },
  enterprise: { id: 'enterprise', name: 'Plano Enterprise', credits: 300, price: 79.9 },
};

// Criar sessão de pagamento para assinatura
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;
    if (!planId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Plano inválido.' });
    }

    const origin = req.get('origin') || BASE_URL;
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: plan.name, description: `${plan.credits} créditos diários` },
          unit_amount: Math.round(plan.price * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      metadata: { userId, planId, credits: plan.credits.toString() },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura.' });
  }
});

// Obter status da assinatura
app.get('/api/subscription-status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'ID do usuário ausente.' });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.json({ status: 'none' });

    const subscriptions = await stripe.subscriptions.list({
      customer: userDoc.data().stripeCustomerId,
      limit: 1,
      status: 'active',
    });

    if (subscriptions.data.length === 0) return res.json({ status: 'none' });

    const subscription = subscriptions.data[0];
    res.json({
      status: subscription.status,
      planId: subscription.items.data[0].price.product,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Erro ao obter status da assinatura:', error);
    res.status(500).json({ error: 'Erro ao obter status da assinatura.' });
  }
});

// Webhook do Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Assinatura ou segredo do webhook ausente.' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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
    console.error('Erro no Webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

// Função para atualizar Firestore ao mudar assinatura
async function handleSubscriptionChange(subscription) {
  try {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: subscription.status,
      subscriptionPlan: subscription.items.data[0].price.product,
      subscriptionPeriodEnd: subscription.current_period_end,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura no Firestore:', error);
  }
}

// Função para remover assinatura cancelada
async function handleSubscriptionCanceled(subscription) {
  try {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'canceled',
      subscriptionPlan: null,
      subscriptionPeriodEnd: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao remover assinatura cancelada:', error);
  }
}

// Teste do servidor
app.get('/api', (req, res) => res.send('Servidor Reviver Imagem rodando!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}, disponível em ${BASE_URL}`));
