import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Package, Star } from 'lucide-react';
import { creditPlans } from '../lib/credits';
import { createCheckoutSession } from '../lib/stripe';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

export function CreditPlans() {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const plan = creditPlans.find((p) => p.id === planId);
      if (!plan) throw new Error('Invalid plan');
      
      await createCheckoutSession(plan);
    } catch (error) {
      console.error('Error initiating purchase:', error);
      setError('Failed to initiate purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Escolha seu plano
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            Compre créditos para restaurar suas imagens
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {creditPlans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 rounded-xl overflow-hidden relative"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  {plan.id === 'basic' && <Package className="w-6 h-6 text-purple-500" />}
                  {plan.id === 'standard' && <CreditCard className="w-6 h-6 text-purple-500" />}
                  {plan.id === 'premium' && <Star className="w-6 h-6 text-yellow-500" />}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-white">R${plan.price}</span>
                  <span className="ml-2 text-gray-400">/mês</span>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {plan.credits} créditos/mês
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Acesso a todas as features
                  </li>
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePurchase(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg bg-purple-600 text-white font-medium 
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'} 
                    transition-all duration-200`}
                >
                  {isLoading ? 'Processando...' : 'Assinar agora'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Pagamento seguro processado pela Stripe</p>
          <p className="mt-2">Cancele a qualquer momento</p>
        </div>
      </div>
    </div>
  );
}
