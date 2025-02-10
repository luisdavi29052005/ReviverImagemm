import { loadStripe } from '@stripe/stripe-js';
import type { SubscriptionPlan } from '../types';
import { auth } from './firebase';

// Make sure to use the correct environment variable
const VITE_STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Initialize Stripe only if we have a public key
const stripePromise = VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(VITE_STRIPE_PUBLIC_KEY)
  : Promise.reject(new Error('Stripe public key is not configured'));

// Use HTTP instead of HTTPS for local development
const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000' 
  : 'https://www.reviverimagem.shop/api';

export const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Plano Gratuito',
    credits: 10,
    price: 0,
    description: '10 créditos diários',
    features: [
      'Acesso básico',
      '10 créditos diários',
      'Sem compromisso'
    ]
  },
  basic: {
    id: 'basic',
    name: 'Plano Básico',
    credits: 100,
    price: 29.90,
    description: '100 créditos diários',
    features: [
      'Acesso premium',
      '100 créditos diários',
      'Suporte prioritário'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Plano Profissional',
    credits: 200,
    price: 49.90,
    description: '200 créditos diários',
    features: [
      'Acesso premium',
      '200 créditos diários',
      'Suporte prioritário',
      'Recursos avançados'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plano Enterprise',
    credits: 300,
    price: 79.90,
    description: '300 créditos diários',
    features: [
      'Acesso premium',
      '300 créditos diários',
      'Suporte VIP',
      'Recursos avançados',
      'API access'
    ]
  }
} as const;

export async function createSubscription(plan: SubscriptionPlan) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Initialize Stripe
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Create checkout session
    const response = await fetch(`${API_BASE_URL}/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: plan.id,
        userId: user.uid,
        userEmail: user.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create subscription');
    }

    const session = await response.json();
    
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function updateSubscription(newPlanId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/update-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.uid,
        newPlanId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function getSubscriptionStatus() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/subscription-status?userId=${user.uid}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get subscription status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}