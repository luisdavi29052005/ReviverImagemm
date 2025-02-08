import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserDocument } from '../lib/firestore-init';
import { AuthLayout } from '../components/AuthLayout';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Verifica se precisa criar o documento do usuário
      await createUserDocument(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || ''
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
      console.error('Login error:', err);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Verifica se precisa criar o documento do usuário
      await createUserDocument(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || ''
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError('Falha no login com Google.');
      console.error('Google login error:', err);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta"
      subtitle="Faça login para continuar melhorando suas imagens"
    >
      <div className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-700 rounded-lg shadow-sm text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <img
            className="h-5 w-5 mr-2"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
          />
          <span>Continuar com Google</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">ou</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
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
                autoComplete="current-password"
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

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Entrar
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400">
              Criar conta
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
      </div>
    </AuthLayout>
  );
}
