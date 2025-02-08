import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Clock } from 'lucide-react';
import { handlePaymentSuccess } from '../lib/stripe';

export function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setStatus('failed');
          setMessage('Sessão de pagamento não encontrada');
          return;
        }

        const result = await handlePaymentSuccess(sessionId);
        
        if (result.success) {
          setStatus('success');
          setMessage('Pagamento processado com sucesso! Seus créditos foram adicionados.');
        } else {
          setStatus('failed');
          setMessage(result.error || 'Falha ao processar o pagamento');
        }

        // Redirect after delay
        setTimeout(() => {
          navigate('/my-images');
        }, 3000);
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage('Erro ao verificar o pagamento. Por favor, contate o suporte.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const statusConfig = {
    processing: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500',
      title: 'Processando pagamento'
    },
    success: {
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      title: 'Pagamento aprovado!'
    },
    failed: {
      icon: X,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500',
      title: 'Falha no pagamento'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full ${config.bgColor} ${config.borderColor} border rounded-lg p-8 text-center`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-900"
        >
          <config.icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-4 text-2xl font-bold ${config.color}`}
        >
          {config.title}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-gray-400"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
