import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Logo */}
          <Link to="/" className="block">
            <motion.div 
              className="flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src="/src/Imgs/Duda_.png" 
                alt="Reviver Imagem Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold text-white">Reviver Imagem</span>
            </motion.div>
          </Link>

          {/* Header */}
          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white"
            >
              {title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-400"
            >
              {subtitle}
            </motion.p>
          </div>

          {children}
        </motion.div>
      </div>

      {/* Right side - Preview */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block relative flex-1"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="relative w-full max-w-lg mx-8">
            <div className="relative">
              <img 
                src="/src/Imgs/Antes.png" 
                alt="Antes" 
                className="w-full rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-sm font-medium bg-gray-900/50 px-2 py-1 rounded">Antes</span>
              </div>
            </div>
            <div className="relative mt-4">
              <img 
                src="/src/Imgs/Depois.png" 
                alt="Depois" 
                className="w-full rounded-lg shadow-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-sm font-medium bg-gray-900/50 px-2 py-1 rounded">Depois</span>
              </div>
            </div>
            <div className="absolute -bottom-8 left-4 right-4 text-center">
              <p className="text-gray-400 text-sm italic">
                "Os resultados são realmente impressionantes. Comparamos com várias pequenas fotos que foram ampliadas com um método básico de interpolação do Photoshop"
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
