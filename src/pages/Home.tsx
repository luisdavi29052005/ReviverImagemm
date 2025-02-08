import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Sparkles, Download, Star, Zap, Shield, Users, Camera, Palette, Menu, X, Upload, Cloud, ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserMenu } from '../components/UserMenu';
import { useUploadStore } from '../lib/uploadState.ts';

export function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const setPendingUpload = useUploadStore((state) => state.setPendingUpload);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou WebP.');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. O tamanho máximo é 50MB.');
      }

      if (!user) {
        navigate('/login');
        return;
      }

      setPendingUpload(file);
      navigate('/my-images');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="border-b border-gray-800 fixed w-full bg-gray-900/95 backdrop-blur-sm z-50"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              src="/src/Imgs/Duda_.png" 
              alt="Reviver Imagem Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold">Reviver Imagem</span>
          </motion.div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg text-white hover:text-purple-400 transition"
                  >
                    Entrar
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
                  >
                    Criar Conta
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-gray-800 border-t border-gray-700"
            >
              <div className="p-4 space-y-4">
                {/* User Profile Section */}
                {user && (
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500">
                      <img
                        src={user?.photoURL || `https://api.dicebear.com/7.x/avatars/svg?seed=${user?.email}`}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">{user?.displayName || 'Usuário'}</p>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Options */}
                {user ? (
                  <div className="space-y-3">
                    <Link to="/my-images">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white"
                      >
                        Minhas Imagens
                      </motion.button>
                    </Link>
                    <Link to="/settings">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 text-gray-300"
                      >
                        Configurações
                      </motion.button>
                    </Link>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => auth.signOut()}
                      className="w-full px-4 py-2 rounded-lg bg-red-600/20 text-red-500"
                    >
                      Sair
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link to="/login" className="block">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Entrar
                      </motion.button>
                    </Link>
                    <Link to="/register" className="block">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Criar Conta
                      </motion.button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="pt-16">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16"
          >
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-6xl font-bold mb-6"
            >
              Melhore suas Imagens com
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-purple-500"
              > IA</motion.span>
            </motion.h1>
            <motion.div 
              variants={staggerChildren}
              initial="initial"
              animate="animate"
              className="max-w-3xl mx-auto space-y-4 text-gray-400 mb-8"
            >
              <motion.p variants={fadeInUp} className="flex items-center justify-center gap-2 text-sm md:text-base">
                <ImagePlus className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                Aumente a resolução da imagem e melhore a qualidade
              </motion.p>
              <motion.p variants={fadeInUp} className="flex items-center justify-center gap-2 text-sm md:text-base">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                Transforme fotos borradas e pixeladas em imagens nítidas
              </motion.p>
              <motion.p variants={fadeInUp} className="flex items-center justify-center gap-2 text-sm md:text-base">
                <Download className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                Crie arte com IA em 4K, amplie até 500 MP
              </motion.p>
            </motion.div>

            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md mx-auto mb-12"
            >
              <Link to={user ? "/my-images" : "/register"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                >
                  Começar Agora
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-block ml-2"
                  >
                    →
                  </motion.span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Upload Area */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onDragEnter={handleDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`relative h-48 sm:h-72 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer ${
                isDragging ? 'border-purple-500 bg-purple-500/10' : 'hover:border-gray-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              
              <div className="text-center px-4">
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2 text-sm sm:text-base">
                  Solte suas imagens aqui, ou{' '}
                  <span className="text-purple-500">procure</span>
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm">
                  <span>ou importe de</span>
                  <button 
                    className="px-3 py-1 bg-gray-800 rounded-md flex items-center gap-1 hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-1 bg-gray-800 rounded-md flex items-center gap-1 hover:bg-gray-700 transition-colors">
                    <Cloud className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-2">
                  JPG, PNG, WebP até 50 mb
                </p>
              </div>

              <AnimatePresence>
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg flex items-center justify-between text-sm"
                  >
                    <span>{uploadError}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadError(null);
                      }}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Seção Antes e Depois Interativa */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-16 md:mt-32 mb-12 md:mb-24"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12"
            >
              Veja a Diferença
            </motion.h2>
            
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative h-[300px] md:h-[500px] rounded-xl overflow-hidden cursor-ew-resize shadow-2xl"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {/* Imagem Depois */}
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: 'url("/Depois.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                
                {/* Imagem Antes com máscara */}
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: 'url("/Antes.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                  }}
                />

                {/* Linha divisória com alça */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: isDragging ? 180 : 0 }}
                      className="w-4 h-4 border-r-2 border-b-2 border-gray-800 transform rotate-45"
                    />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                  Antes
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                  Depois
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-24 text-center"
          >
            {[
              { value: "500K+", label: "Imagens Processadas" },
              { value: "50K+", label: "Usuários Ativos" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Avaliação Média" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-4"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 100, delay: index * 0.1 }}
                  className="text-2xl md:text-4xl font-bold text-purple-500"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm md:text-base text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-24"
          >
            {[
              { icon: Camera, title: "Melhore Fotos", desc: "Transforme suas fotos com nossa tecnologia de IA avançada" },
              { icon: Sparkles, title: "Corrija Borrões", desc: "Diga adeus às imagens borradas e pixeladas" },
              { icon: Palette, title: "Gere Arte", desc: "Crie arte impressionante com IA em resolução 4K" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 p-4 md:p-6 rounded-xl"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4"
                >
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                </motion.div>
                <h3 className="text-base md:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Benefits Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-24"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12"
            >
              Por que escolher Reviver Imagem?
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { icon: Zap, title: "Rápido", desc: "Resultados em segundos" },
                { icon: Shield, title: "Seguro", desc: "Dados sempre protegidos" },
                { icon: Star, title: "Alta Qualidade", desc: "Resultados profissionais" },
                { icon: Users, title: "Suporte 24/7", desc: "Sempre aqui para ajudar" }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
                  </motion.div>
                  <h3 className="text-sm md:text-base font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section - Only show if user is not logged in */}
          {!user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 md:p-12 text-center"
            >
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-bold mb-4 md:mb-6"
              >
                Comece a Melhorar suas Imagens Hoje
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base md:text-lg text-purple-100 mb-6 md:mb-8 max-w-2xl mx-auto"
              >
                Junte-se a milhares de usuários que já estão transformando suas imagens com IA
              </motion.p>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 md:px-8 py-3 md:py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition text-sm md:text-base"
                >
                  Criar Conta Gratuita
                </motion.button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 md:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/Duda_.png" 
                  alt="Reviver Imagem Logo" 
                  className="w-6 h-6 md:w-8 md:h-8 object-contain"
                />
                <span className="text-lg md:text-xl font-bold">Reviver Imagem</span>
              </div>
              <p className="text-sm md:text-base text-gray-400">
                Transformando imagens com o poder da IA
              </p>
            </div>
            
            {[
              {
                title: "Produto",
                items: ["Recursos", "Preços", "API", "Blog"]
              },
              {
                title: "Empresa",
                items: ["Sobre", "Carreiras", "Contato", "Imprensa"]
              },
              {
                title: "Legal",
                items: ["Privacidade", "Termos", "Cookies", "Licenças"]
              }
            ].map((section, index) => (
              <div key={index} className="col-span-1">
                <h3 className="text-sm md:text-base font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-400">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="hover:text-white cursor-pointer">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
