import express from 'express';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// 🔹 Carregar variáveis de ambiente de forma segura
if (fs.existsSync('.env')) {
  dotenv.config();
} else {
  console.warn('Arquivo .env não encontrado! Certifique-se de definir as variáveis corretamente.');
}

// 🔹 Configurar express e middleware
const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use(express.json());

// 🔹 Inicializar Firebase Admin
const serviceAccountPath = 'reviviverimagem-firebase-adminsdk-fbsvc-560e24bd33.json';

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} else {
  console.error('❌ Arquivo de credenciais do Firebase não encontrado!');
  process.exit(1);
}

const db = admin.firestore();

// 🔹 Inicializar Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY não definido no .env!');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// 🔹 Definir domínio base
const DOMAIN = process.env.DOMAIN || 'https://www.reviverimagem.shop';

// 🏦 Criar sessão de pagamento Stripe
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, userId, userEmail } = req.body;

    // 🔹 Definir planos disponíveis
    const plans = {
      basic: { price: 500, credits: 5, name: 'Basic Plan' },
      standard: { price: 1000, credits: 15, name: 'Standard Plan' },
      premium: { price: 2000, credits: 50, name: 'Premium Plan' },
    };

    // 🔹 Verificar plano válido
    const plan = plans[planId];
    if (!plan) return res.status(400).json({ error: 'Plano inválido' });

    // 🔹 Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: plan.name, description: `${plan.credits} créditos` },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/payment/cancelsession_id={CHECKOUT_SESSION_ID}`,
      customer_email: userEmail,
      metadata: { userId, planId, credits: plan.credits.toString() },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: 'Erro ao criar checkout' });
  }
});

// 🔍 Verificar pagamento e atualizar créditos do usuário
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Pagamento não concluído' });
    }

    const { userId, credits } = session.metadata;
    const creditsToAdd = parseInt(credits, 10);
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('Usuário não encontrado');

      const newCredits = (userDoc.data().credits || 0) + creditsToAdd;

      transaction.update(userRef, {
        credits: newCredits,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: session.amount_total / 100,
        credits: creditsToAdd,
        status: 'completed',
        paymentId: session.payment_intent,
        paymentMethod: 'stripe',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error);
    res.status(500).json({ error: 'Erro ao verificar pagamento' });
  }
});

// 🔔 Webhook do Stripe para pagamentos concluídos
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Erro na verificação do Webhook:', err.message);
    return res.status(400).send(`Erro no Webhook: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const { userId, credits } = session.metadata;
      const creditsToAdd = parseInt(credits, 10);
      const userRef = db.collection('users').doc(userId);

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error('Usuário não encontrado');

        const newCredits = (userDoc.data().credits || 0) + creditsToAdd;

        transaction.update(userRef, {
          credits: newCredits,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`✅ Créditos adicionados para o usuário ${userId}: ${creditsToAdd}`);
    } catch (error) {
      console.error('❌ Erro ao processar Webhook:', error);
    }
  }

  res.json({ received: true });
});

// 🚀 Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
