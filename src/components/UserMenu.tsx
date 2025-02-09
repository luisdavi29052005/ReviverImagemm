import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User, Images, Menu, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

// Desktop version of the UserMenu
function DesktopUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="hidden sm:flex items-center space-x-4">
      {/* Minhas Imagens Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/my-images')}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Images size={18} />
        <span>Minhas Imagens</span>
      </motion.button>

      {/* User Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
            <img
              src={
                user?.photoURL ||
                `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(
                  user?.email || 'default'
                )}`
              }
              alt="Foto de perfil"
              className="w-full h-full object-cover"
              onError={(e: any) => {
                e.target.src = 'https://via.placeholder.com/150';
              }}
            />
          </div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-700"
            >
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <User size={16} />
                <span>Perfil</span>
              </button>
              <button
                onClick={() => handleNavigate('/settings')}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} />
                <span>Configurações</span>
              </button>
              <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Mobile version of the UserMenu
function MobileUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="sm:hidden">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
          <img
            src={
              user?.photoURL ||
              `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(
                user?.email || 'default'
              )}`
            }
            alt="Foto de perfil"
            className="w-full h-full object-cover"
            onError={(e: any) => {
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[320px] bg-gray-900 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                {/* Back Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Voltar</span>
                </motion.button>

                {/* User Profile */}
                <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500">
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${user?.email}`}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {user?.displayName || 'Usuário'}
                    </h3>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate('/my-images')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-purple-600 text-white"
                  >
                    <span>Minhas Imagens</span>
                    <Images size={20} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate('/profile')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <span>Perfil</span>
                    <User size={20} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate('/settings')}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <span>Configurações</span>
                    <Settings size={20} />
                  </motion.button>
                </div>

                {/* Logout */}
                <div className="pt-6 border-t border-gray-800">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    <span>Sair da conta</span>
                    <LogOut size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main UserMenu component that renders either mobile or desktop version
export function UserMenu() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  if (isLoggingOut) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center"
        >
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Até logo!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Esperamos ver você em breve
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Fazer Login
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <DesktopUserMenu />
      <MobileUserMenu />
    </>
  );
}