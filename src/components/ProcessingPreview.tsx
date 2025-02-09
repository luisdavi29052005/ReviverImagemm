import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Eye } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

interface ProcessingPreviewProps {
  originalUrl: string;
  processedUrl?: string;
  isProcessing?: boolean;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
  onDelete?: () => void;
}

export function ProcessingPreview({
  originalUrl,
  processedUrl,
  isProcessing = false,
  fileName = 'image.jpg',
  fileSize = 0,
  createdAt = new Date(),
  onDelete
}: ProcessingPreviewProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Se temos uma URL processada e não estamos processando, mostra direto a imagem processada
  if (processedUrl && !isProcessing) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={processedUrl}
            alt="Processed"
            className="w-full h-full object-cover"
          />
          {/* Desktop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="p-2 bg-purple-600 rounded-full"
            >
              <Eye className="w-6 h-6" />
            </motion.button>
            <motion.a
              href={processedUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-purple-600 rounded-full"
            >
              <Download className="w-6 h-6" />
            </motion.a>
          </motion.div>

          {/* Mobile indicator */}
          <div className="absolute bottom-2 right-2 sm:hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <ImageLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={processedUrl}
          fileName={fileName}
          fileSize={fileSize}
          createdAt={createdAt}
          onDelete={onDelete}
        />
      </>
    );
  }

  // Se estamos processando, mostra o preview com o overlay
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative aspect-square rounded-lg overflow-hidden bg-gray-800"
      >
        <img
          src={originalUrl}
          alt="Processing"
          className="w-full h-full object-cover blur-sm"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-8 h-8 text-purple-500" />
          </motion.div>
          <p className="text-sm text-white mt-2">Processando...</p>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}