import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Download, Settings, Image as ImageIcon, ChevronDown, Info, Upload, Cloud, X, FileText, Home, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { uploadImage } from '../lib/storage';
import { UserMenu } from '../components/UserMenu';
import { UserCredits } from '../components/UserCredits';
import { PricingModal } from '../components/PricingModal';

interface Settings {
  mode: 'magic' | 'balanced' | 'gentle';
  size: 'auto' | 'scale';
  digitalArt: boolean;
  tryAll: boolean;
  lightAI: boolean;
  removeBg: boolean;
  showAdvanced: boolean;
  scale: number;
}

interface ImageInfo {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function MyImages() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({
    mode: 'magic',
    size: 'auto',
    lightAI: false,
    removeBg: false,
    showAdvanced: false
  });

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

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou WebP.');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. O tamanho máximo é 50MB.');
      }

      const dimensions = await getImageDimensions(file);
      const preview = URL.createObjectURL(file);
      
      setSelectedImage({
        file,
        preview,
        dimensions
      });

      const uploadedImage = await uploadImage(file);
      console.log('Imagem enviada:', uploadedImage);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
      setSelectedImage(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1C1C1E] text-white">
      {/* Header */}
      <header className="bg-[#1C1C1E] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4">
          {/* Main Header Row */}
          <div className="h-16 flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Home size={16} />
              </motion.button>

              <motion.img 
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                src="/src/Imgs/Duda_.png" 
                alt="Logo" 
                className="w-8 h-8"
              />
            </div>

            {/* Center Section - Desktop Only */}
            <div className="hidden md:flex space-x-4 text-sm">
              {['Aprimorador', 'Gerador', 'Novo'].map((item, index) => (
                <motion.button
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={item === 'Aprimorador' ? 'text-white font-medium' : 'text-gray-400'}
                >
                  {item}
                </motion.button>
              ))}
            </div>
            
            {/* Right Section */}
            <div className="flex items-center">
              {/* Credits and Plans - Always visible */}
              <div className="flex items-center space-x-2">
                <UserCredits />
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPricingOpen(true)}
                  className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                >
                  Planos
                </motion.button>
              </div>

              {/* Desktop Menu */}
              <div className="hidden sm:block ml-4">
                <UserMenu />
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden ml-4 p-2"
              >
                <Menu size={20} />
              </motion.button>
            </div>
          </div>

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

                  {/* Navigation Options */}
                  {['Aprimorador', 'Gerador', 'Novo'].map((item) => (
                    <motion.button
                      key={item}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full px-4 py-2 rounded-lg ${
                        item === 'Aprimorador' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {item}
                    </motion.button>
                  ))}

                  {/* Settings Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-700 text-gray-300"
                  >
                    <span>Configurações</span>
                    <Settings size={16} />
                  </motion.button>

                  {/* Logout Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => auth.signOut()}
                    className="w-full px-4 py-2 rounded-lg bg-red-600/20 text-red-500"
                  >
                    Sair
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        <div className="flex-1 p-4">
          <div className="text-xs text-gray-400 font-medium mb-2 flex items-center justify-between">
            <span>IMAGENS PARA PROCESSAR</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 text-purple-500"
            >
              <Settings size={14} />
              <span>Configurações</span>
            </motion.button>
          </div>
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative h-48 sm:h-72 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 overflow-hidden ${
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
            
            {selectedImage ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full h-full group"
              >
                <img 
                  src={selectedImage.preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/80 p-4 rounded-lg mb-4 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                      <FileText size={16} />
                      <span className="font-medium">{selectedImage.file.name}</span>
                    </div>
                    <div className="space-y-1 text-gray-300">
                      <p>Tamanho: {formatFileSize(selectedImage.file.size)}</p>
                      {selectedImage.dimensions && (
                        <p>Dimensões: {selectedImage.dimensions.width} x {selectedImage.dimensions.height}px</p>
                      )}
                      <p>Tipo: {selectedImage.file.type.split('/')[1].toUpperCase()}</p>
                    </div>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveImage}
                    className="bg-red-500 text-white p-2 rounded-full"
                  >
                    <X size={24} />
                  </motion.button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="text-center px-4">
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2 text-sm sm:text-base">
                  Solte suas imagens aqui, ou{' '}
                  <button 
                    onClick={handleUploadClick}
                    className="text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    procure
                  </button>
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm">
                  <span>ou importe de</span>
                  <button 
                    onClick={handleUploadClick}
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
            )}

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
                    onClick={() => setUploadError(null)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-8">
            <div className="text-xs text-gray-400 font-medium mb-4 flex justify-between items-center">
              <span>MINHAS IMAGENS</span>
            </div>
            
            <div className="text-center py-8 sm:py-12 bg-gray-800/50 rounded-lg">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400 text-sm sm:text-base">
                Nenhuma imagem processada ainda
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Suas imagens processadas aparecerão aqui
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sidebar - Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#1C1C1E] p-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                  <h2 className="text-lg font-semibold">Configurações</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                </div>
                
                <SettingsContent onClose={() => setIsSidebarOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="hidden lg:block w-80 border-l border-gray-800 p-4 bg-[#1C1C1E]"
        >
          <SettingsContent />
        </motion.div>
      </div>

      {/* Mobile Settings Button (Fixed) */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 shadow-lg flex items-center justify-center z-20"
      >
        <Settings size={24} />
      </motion.button>

      <PricingModal 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </div>
  );
}

// Settings Content Component
function SettingsContent({ onClose }: { onClose?: () => void }) {
  const [settings, setSettings] = useState<Settings>({
    mode: 'magic',
    size: 'auto',
    digitalArt: false,
    tryAll: false,
    lightAI: false,
    removeBg: false,
    showAdvanced: false,
    scale: 2
  });

  const handleToggle = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleModeChange = (mode: Settings['mode']) => {
    setSettings(prev => ({
      ...prev,
      mode
    }));
  };

  const handleSizeChange = (size: Settings['size']) => {
    setSettings(prev => ({
      ...prev,
      size
    }));
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 4) {
      setSettings(prev => ({
        ...prev,
        scale: value
      }));
    }
  };

  const handleProcess = () => {
    console.log('Processing with settings:', settings);
    // Here you would implement the actual image processing logic
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xs font-medium">
        <div className="flex justify-between items-center mb-4">
          <span>OPERAÇÕES</span>
          <span className="text-purple-500 cursor-pointer hover:text-purple-400 transition-colors">
            PREDEFINIÇÕES
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>Ampliar e Aprimorar</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    Melhore a qualidade e aumente a resolução da sua imagem
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleToggle('showAdvanced')}
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  settings.showAdvanced ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings.showAdvanced ? 'right-1' : 'left-1'
                  }`} 
                />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {['magic', 'balanced', 'gentle'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode as Settings['mode'])}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    settings.mode === mode ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {[
            { key: 'digitalArt', label: 'Digital art', tooltip: 'Transforme sua imagem em arte digital' },
            { key: 'tryAll', label: 'Experimente todos (3 créditos)', tooltip: 'Teste todos os modos de processamento' },
            { key: 'lightAI', label: 'Light AI', tooltip: 'Processamento mais leve e rápido' },
            { key: 'removeBg', label: 'Remover fundo', tooltip: 'Remove o fundo da imagem automaticamente' }
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-1">
                <span>{setting.label}</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    {setting.tooltip}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleToggle(setting.key as keyof Settings)}
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  settings[setting.key as keyof Settings] ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    settings[setting.key as keyof Settings] ? 'right-1' : 'left-1'
                  }`} 
                />
              </button>
            </div>
          ))}

          <div>
            <span className="block mb-2">Tamanho</span>
            <div className="grid grid-cols-2 gap-2">
              {['auto', 'scale'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size as Settings['size'])}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    settings.size === size ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {size === 'auto' ? 'Automático' : 'Escala'}
                </button>
              ))}
            </div>

            {settings.size === 'scale' && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Fator de escala</span>
                  <span className="text-xs text-gray-400">{settings.scale}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={settings.scale}
                  onChange={handleScaleChange}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>4x</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {settings.showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-4 border-t border-gray-700"
        >
          <div className="text-xs font-medium mb-2">CONFIGURAÇÕES AVANÇADAS</div>
          {/* Add advanced settings here */}
        </motion.div>
      )}

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProcess}
          className="w-full py-2 bg-purple-600 text-sm rounded-lg hover:bg-purple-700 transition-all"
        >
          Iniciar processamento
        </motion.button>

        {onClose && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-2 bg-gray-800 text-sm rounded-lg hover:bg-gray-700 transition-all lg:hidden"
          >
            Fechar
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default MyImages;
