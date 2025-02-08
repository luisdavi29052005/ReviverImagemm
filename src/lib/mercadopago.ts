import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import type { CreditPlan } from '../types';
import { updateUserCredits, getUserCredits, creditPlans, createTransaction } from './credits';
import { auth } from './firebase';

// Initialize Mercado Pago with the public key
const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
const MERCADO_PAGO_ACCESS_TOKEN = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN;

initMercadoPago(MERCADO_PAGO_PUBLIC_KEY);

export { Wallet };

// Create payment preference
export async function createPaymentPreference(plan: CreditPlan, userId: string) {
  try {
    console.log('Criando preferência para usuário:', userId, 'plano:', plan.id);
    
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            id: plan.id,
            title: `${plan.name} - ${plan.credits} créditos`,
            description: plan.description,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: plan.price
          }
        ],
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" }
          ],
          installments: 1
        },
        back_urls: {
          success: `${window.location.origin}/payment/success`,
          failure: `${window.location.origin}/payment/failure`,
          pending: `${window.location.origin}/payment/pending`
        },
        auto_return: 'approved',
        external_reference: `${userId}:${plan.id}` // Formato: userId:planId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro detalhado:', errorData);
      throw new Error('Erro ao criar preferência de pagamento');
    }

    const data = await response.json();
    return {
      id: data.id,
      init_point: data.init_point
    };
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw error;
  }
}

// Process payment callback
export async function processPayment(paymentData: {
  status: string | null;
  payment_id: string | null;
  external_reference: string | null;
}) {
  try {
    const { status, payment_id, external_reference } = paymentData;
    console.log('Processando pagamento:', paymentData);

    if (!external_reference) {
      throw new Error('Referência externa não encontrada');
    }

    if (!status) {
      throw new Error('Status do pagamento não encontrado');
    }

    if (!payment_id) {
      throw new Error('ID do pagamento não encontrado');
    }

    // Parse external_reference (formato: userId:planId)
    const [userId, planId] = external_reference.split(':');
    console.log('ID do usuário:', userId, 'ID do plano:', planId);

    if (!userId) {
      throw new Error('ID do usuário não encontrado na referência');
    }

    // Verifica se o usuário está autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se o userId do pagamento corresponde ao usuário autenticado
    if (userId !== currentUser.uid) {
      console.log('Tentando correspondência alternativa com email');
      if (userId !== currentUser.email) {
        throw new Error('ID do usuário não corresponde ao usuário autenticado');
      }
    }

    // Only process approved payments
    if (status === 'approved') {
      console.log('Pagamento aprovado, processando...');

      try {
        // Get current credits
        const currentCredits = await getUserCredits(currentUser.uid);
        console.log('Créditos atuais:', currentCredits);
        
        // Find the exact plan by ID
        const plan = creditPlans.find(p => p.id === planId);
        if (!plan) {
          throw new Error(`Plano não encontrado: ${planId}`);
        }
        console.log('Plano encontrado:', plan);
        
        // Calculate new credits using the exact plan
        const newCredits = currentCredits + plan.credits;
        console.log('Novos créditos calculados:', newCredits, '(atual:', currentCredits, '+ plano:', plan.credits, ')');

        // Create transaction record first
        const transactionId = await createTransaction({
          userId: currentUser.uid,
          amount: plan.price,
          credits: plan.credits,
          status: 'completed',
          paymentId: payment_id,
          paymentMethod: 'mercadopago'
        });
        console.log('Transação registrada com sucesso:', transactionId);

        // Then update user credits
        await updateUserCredits(currentUser.uid, newCredits);
        console.log('Créditos atualizados com sucesso para', newCredits);

        return {
          success: true,
          message: 'Créditos adicionados com sucesso',
          credits: newCredits
        };
      } catch (error) {
        console.error('Erro durante o processamento do pagamento:', error);
        throw error;
      }
    }

    return {
      success: false,
      message: `Pagamento não aprovado (status: ${status})`,
      status
    };
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}
