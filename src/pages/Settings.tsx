import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Bell,
  Lock,
  Mail,
  Shield,
  User,
  ChevronRight,
  ArrowLeft,
  History,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { getUserTransactions, isRefundEligible } from '../lib/credits';
import { RefundModal } from '../components/RefundModal';
import type { Transaction } from '../types';

export function Settings() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        try {
          const userTransactions = await getUserTransactions(user.uid);
          setTransactions(userTransactions);
        } catch (error) {
          console.error('Erro ao carregar transações:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTransactions();
  }, [user]);

  const sections = [
    {
      id: 'account',
      title: 'Conta',
      icon: User,
      items: [
        { title: 'Perfil', description: 'Gerencie suas informações pessoais' },
        { title: 'Email', description: 'Atualize seu endereço de email' },
        { title: 'Senha', description: 'Altere sua senha de acesso' }
      ]
    },
    {
      id: 'payments',
      title: 'Pagamentos e Créditos',
      icon: CreditCard,
      items: [
        { title: 'Histórico', description: 'Veja suas transações anteriores' },
        { title: 'Reembolsos', description: 'Solicite reembolso de compras' },
        { title: 'Métodos de Pagamento', description: 'Gerencie seus cartões' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      items: [
        { title: 'Email', description: 'Configure notificações por email' },
        { title: 'Push', description: 'Configure notificações no navegador' }
      ]
    },
    {
      id: 'security',
      title: 'Segurança',
      icon: Shield,
      items: [
        { title: 'Verificação em duas etapas', description: 'Ative a autenticação 2FA' },
        { title: 'Dispositivos conectados', description: 'Gerencie suas sessões ativas' },
        { title: 'Histórico de login', description: 'Veja acessos recentes' }
      ]
    }
  ];

  const handleRefundRequest = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsRefundModalOpen(true);
  };

  const renderContent = () => {
    if (!activeSection) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 p-6"
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(section.id)}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">{section.title}</h3>
                  <p className="text-sm text-gray-400">{section.items.length} opções</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => auth.signOut()}
            className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-red-500">Sair</h3>
                <p className="text-sm text-red-400/70">Encerrar sessão</p>
              </div>
            </div>
          </motion.button>
        </motion.div>
      );
    }

    const section = sections.find((s) => s.id === activeSection);
    if (!section) return null;

    if (activeSection === 'payments') {
      return (
        <div className="p-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSection(null)}
            className="flex items-center text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Voltar</span>
          </motion.button>

          <h2 className="text-2xl font-bold text-white mb-6">Pagamentos e Créditos</h2>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Carregando transações...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-medium">
                        {transaction.credits} créditos
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        R$ {transaction.amount.toFixed(2)}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : transaction.status === 'refunded'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {transaction.status === 'completed'
                          ? 'Concluído'
                          : transaction.status === 'refunded'
                          ? 'Reembolsado'
                          : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {transaction.status === 'completed' && isRefundEligible(transaction) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRefundRequest(transaction)}
                      className="w-full mt-2 py-2 text-sm text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      Solicitar reembolso
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma transação encontrada</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveSection(null)}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Voltar</span>
        </motion.button>

        <h2 className="text-2xl font-bold text-white mb-6">{section.title}</h2>

        <div className="space-y-4">
          {section.items.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="text-left">
                <h3 className="font-medium text-white">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-900 text-white">
      {/* Botão de Voltar para Home */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} className="mr-2" /> Voltar para Home
      </button>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center">
            <h1 className="text-xl font-bold text-white">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto mt-6">{renderContent()}</main>

      {/* Refund Modal */}
      {selectedTransaction && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
}
