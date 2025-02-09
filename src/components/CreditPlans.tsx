import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Rocket,
  Crown,
  Check,
  Star,
  Settings,
  ChevronRight,
  Zap,
  Shield,
  Users,
  RefreshCw
} from 'lucide-react';
import { subscriptionPlans, createSubscription } from '../lib/stripe';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export function CreditPlans() {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
      if (!plan) throw new Error('Invalid plan');

      await createSubscription(plan);
    } catch (error) {
      console.error('Error initiating subscription:', error);
      setError('Failed to initiate subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const planFeatures = {
    free: {
      icon: Star,
      gradient: 'from-gray-600 to-gray-500',
      benefits: [
        { icon: Zap, text: '10 créditos diários' },
        { icon: Shield, text: 'Acesso básico' },
        { icon: Users, text: 'Suporte por email' }
      ]
    },
    basic: {
      icon: Sparkles,
      gradient: 'from-purple-600 to-blue-600',
      benefits: [
        { icon: Zap, text: '100 créditos diários' },
        { icon: Shield, text: 'Acesso premium' },
        { icon: Users, text: 'Suporte prioritário' }
      ]
    },
    pro: {
      icon: Crown,
      gradient: 'from-yellow-600 to-orange-600',
      benefits: [
        { icon: Zap, text: '200 créditos diários' },
        { icon: Shield, text: 'Recursos avançados' },
        { icon: Users, text: 'Suporte VIP' }
      ]
    },
    enterprise: {
      icon: Rocket,
      gradient: 'from-blue-600 to-cyan-600',
      benefits: [
        { icon: Zap, text: '300 créditos diários' },
        { icon: Shield, text: 'API access' },
        { icon: Users, text: 'Suporte dedicado' }
      ]
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header - Centered */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 rounded-full text-purple-400 text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>Escolha o plano ideal para você</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Planos para todas as necessidades
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Comece gratuitamente e atualize conforme sua demanda crescer. 
            Cancele a qualquer momento.
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Plans Grid - Centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 justify-center">
          {Object.entries(subscriptionPlans).map(([id, plan]) => {
            const features = planFeatures[id as keyof typeof planFeatures];
            const Icon = features.icon;
            const isFreePlan = id === 'free';
            const isUserPlan = isFreePlan;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`relative rounded-2xl overflow-hidden ${
                  isUserPlan
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800'
                    : 'bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80'
                } border border-gray-700/50`}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${features.gradient} opacity-10`} />

                {/* Content - All items centered */}
                <div className="relative p-6 flex flex-col h-full items-center text-center">
                  {/* Header */}
                  <div className="flex flex-col items-center mb-6 w-full">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${features.gradient} mb-2`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {isUserPlan && (
                      <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full text-white mt-2">
                        Seu plano atual
                      </span>
                    )}
                  </div>

                  {/* Plan Info - Centered */}
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-2">
                      {plan.price > 0 ? (
                        <>
                          <span className="text-3xl font-bold text-white">
                            R${plan.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400">/mês</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-white">Grátis</span>
                      )}
                    </div>
                  </div>

                  {/* Features - Centered */}
                  <div className="space-y-4 flex-grow w-full">
                    {features.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center justify-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${features.gradient} bg-opacity-20`}>
                          <benefit.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-gray-300">{benefit.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button - Centered */}
                  <div className="mt-8 w-full">
                    {isUserPlan ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/settings')}
                        className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Gerenciar Plano</span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSubscribe(id)}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
                          isLoading
                            ? 'opacity-50 cursor-not-allowed'
                            : plan.price === 0
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : `bg-gradient-to-r ${features.gradient} text-white hover:opacity-90`
                        }`}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Processando...
                          </span>
                        ) : (
                          <span>Assinar Plano</span>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer - Centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 sm:mt-12 space-y-3"
        >
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Todos os planos incluem atualizações gratuitas e novas funcionalidades
          </p>
        </motion.div>
      </div>
    </div>
  );
}