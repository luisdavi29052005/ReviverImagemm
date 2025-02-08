import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { requestRefund } from '../lib/credits';
import type { Transaction } from '../types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export function RefundModal({ isOpen, onClose, transaction }: RefundModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!reason.trim()) {
      setError('Por favor, forneça um motivo para o reembolso.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await requestRefund({
        userId: transaction.userId,
        transactionId: transaction.id,
        reason: reason.trim(),
        amount: transaction.amount,
        credits: transaction.credits
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      setError('Não foi possível processar sua solicitação de reembolso. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </motion.button>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Solicitar Reembolso
              </h2>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Solicitação Enviada!
                  </h3>
                  <p className="text-gray-400">
                    Analisaremos seu pedido e responderemos em breve.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-500">
                          Informações importantes
                        </h4>
                        <ul className="mt-2 text-sm text-yellow-500/80 list-disc list-inside space-y-1">
                          <li>O reembolso pode levar até 7 dias úteis</li>
                          <li>Os créditos serão removidos da sua conta</li>
                          <li>Você receberá um email com a confirmação</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Detalhes da Compra
                    </label>
                    <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Valor:</span>
                        <span className="text-white">R$ {transaction.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Créditos:</span>
                        <span className="text-white">{transaction.credits}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Data:</span>
                        <span className="text-white">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
                      Motivo do Reembolso
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Descreva o motivo do seu pedido de reembolso..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Enviando...' : 'Solicitar Reembolso'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
