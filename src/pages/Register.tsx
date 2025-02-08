import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firestore-init';
import { AuthLayout } from '../components/AuthLayout';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      setVerificationSent(true);

      // Create user document
      await createUserDocument(user.uid, {
        email: user.email || '',
        displayName: user.displayName || ''
      });

      setError('Por favor, verifique seu email para ativar sua conta. Um link de verificação foi enviado.');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este email já está em uso. Por favor, use outro email ou faça login.');
          break;
        case 'auth/weak-password':
          setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
          break;
        default:
          setError('Falha no registro. Tente novamente.');
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Criar documento do usuário no Firestore
      await createUserDocument(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || ''
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError('Falha no registro com Google.');
    }
  };

  return (
    <AuthLayout 
      title="Comece com 10 imagens grátis"
      subtitle="Crie sua conta para começar"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 space-y-6"
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-lg text-sm ${
              verificationSent 
                ? "bg-blue-500/10 border border-blue-500 text-blue-500"
                : "bg-red-500/10 border border-red-500 text-red-500"
            }`}
          >
            {error}
          </motion.div>
        )}

        {/* Google Sign Up */}
        <motion.button
          onClick={handleGoogleRegister}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg shadow-sm text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <img
            className="h-5 w-5 mr-2"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
          />
          <span>Continuar com Google</span>
        </motion.button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">ou</span>
          </div>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-lg shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="newsletter"
              name="newsletter"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
            />
            <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-400">
              Receba as novidades, descontos e atualizações
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Criar conta
          </motion.button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400">
              Faça login
            </Link>
          </span>
        </div>

        <div className="text-center text-xs text-gray-400">
          Ao se inscrever em uma conta, você concorda com a{' '}
          <a href="#" className="text-gray-300 hover:text-white">
            Política de Privacidade
          </a>{' '}
          e os{' '}
          <a href="#" className="text-gray-300 hover:text-white">
            Termos e Condições
          </a>
          .
        </div>
      </motion.div>
    </AuthLayout>
  );
}
