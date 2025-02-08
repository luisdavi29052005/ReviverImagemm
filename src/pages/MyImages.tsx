import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Download, Settings, Image as ImageIcon, Info, Upload, Cloud, X, FileText, Home, Menu, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, getProcessedImages } from '../lib/firebase';
import { processImage } from '../lib/imageProcessing';
import { UserMenu } from '../components/UserMenu';
import { UserCredits } from '../components/UserCredits';
import { PricingModal } from '../components/PricingModal';
import { SettingsContent } from '../components/SettingsContent';
import { ProcessingPreview } from '../components/ProcessingPreview';
import type { ImageProcessingSettings, ProcessedImage } from '../types';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [processingImages, setProcessingImages] = useState<{[key: string]: {
    originalUrl: string;
    processedUrl?: string;
  }}>({});
  const [settings, setSettings] = useState<ImageProcessingSettings>({
    version: '1.4',
    bgUpsampler: 'none',
    realEsrgan: 'x4',
    upscale: 4
  });

  useEffect(() => {
    async function loadSavedImages() {
      if (!user) return;
      
      try {
        setIsLoadingSaved(true);
        const images = await getProcessedImages(user.uid);
        setProcessedImages(images);
      } catch (error) {
        console.error('Error loading saved images:', error);
      } finally {
        setIsLoadingSaved(false);
      }
    }

    loadSavedImages();
  }, [user]);

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

  const handleProcess = async () => {
    if (!selectedImage || isProcessing) return;

    try {
      setIsProcessing(true);
      setUploadError(null);

      const processingId = Date.now().toString();

      setProcessingImages(prev => ({
        ...prev,
        [processingId]: {
          originalUrl: selectedImage.preview
        }
      }));

      const processedImageUrl = await processImage(selectedImage.file, settings);

      if (!processedImageUrl) {
        throw new Error('Failed to get processed image URL');
      }

      setProcessingImages(prev => ({
        ...prev,
        [processingId]: {
          originalUrl: selectedImage.preview,
          processedUrl: processedImageUrl
        }
      }));

      handleRemoveImage();
      
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      
      setProcessingImages(prev => {
        const newState = { ...prev };
        const failedKey = Object.keys(newState).find(
          key => !newState[key].processedUrl
        );
        if (failedKey) {
          delete newState[failedKey];
        }
        return newState;
      });

      setUploadError(
        error instanceof Error && error.message === 'Créditos insuficientes'
          ? 'Você não tem créditos suficientes para processar esta imagem'
          : error instanceof Error 
            ? error.message 
            : 'Falha ao processar imagem. Tente novamente.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(processingImages).forEach(image => {
        URL.revokeObjectURL(image.originalUrl);
        if (image.processedUrl) {
          URL.revokeObjectURL(image.processedUrl);
        }
      });
    };
  }, [processingImages]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1C1C1E] text-white">
      <header className="fixed top-0 left-0 right-0 bg-[#1C1C1E] border-b border-gray-800 z-50">
        <div className="max-w-full mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-white-800 hover:bg-gray-700 transition-colors"
              >
                <Home size={16} />
              </motion.button>

              <motion.img 
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                src="/Duda_.png" 
                alt="Logo" 
                className="w-8 h-8"
              />
            </div>

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
            
            <div className="flex items-center">
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

              <div className="hidden sm:block ml-4">
                <UserMenu />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 1.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden ml-4 p-2"
              >
                <Menu size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
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
                <span>IMAGENS PROCESSADAS</span>
              </div>
              
              <div className="space-y-4">
                {isLoadingSaved ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Carregando imagens...</p>
                  </div>
                ) : processedImages.length > 0 || Object.keys(processingImages).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(processingImages).map(([id, image]) => (
                      <ProcessingPreview
                        key={id}
                        originalUrl={image.originalUrl}
                        processedUrl={image.processedUrl}
                        isProcessing={!image.processedUrl}
                      />
                    ))}
                    
                    {processedImages.map((image) => (
                      <ProcessingPreview
                        key={image.id}
                        originalUrl={image.originalUrl}
                        processedUrl={image.processedUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-800/50 rounded-lg">
                    <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhuma imagem processada ainda</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Suas imagens processadas aparecerão aqui
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="hidden lg:block w-80 border-l border-gray-800 overflow-y-auto"
        >
          <div className="sticky top-0 p-4 bg-[#1C1aC1E]">
            <SettingsContent 
              settings={settings}
              setSettings={setSettings}
              onProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
  {isMobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50"
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#1C1C1E] p-4 gap-2 flex flex-col" // Adicionei gap-8 e flex-col aqui
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
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

<motion.button
  whileTap={{ scale: 0.95 }}
  onClick={() => navigate('/settings')}
  className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gray-700 text-gray-300"
>
  <span>Configurações</span>
</motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => auth.signOut()}
          className="w-full px-4 py-2 rounded-lg bg-red-600/20 text-red-500"
        >
          Sair
        </motion.button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-[#1C1C1E] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-white">Configurações</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                </div>
                
                <SettingsContent 
                  settings={settings}
                  setSettings={setSettings}
                  onProcess={handleProcess}
                  onClose={() => setIsSidebarOpen(false)}
                  isProcessing={isProcessing}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PricingModal 
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 shadow-lg flex items-center justify-center z-20"
      >
        <Settings size={24} />
      </motion.button>
    </div>
  );
}

export default MyImages;
