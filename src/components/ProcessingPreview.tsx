import React from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';

interface ProcessingPreviewProps {
  originalUrl: string;
  processedUrl?: string;
  isProcessing?: boolean;
}

export function ProcessingPreview({ originalUrl, processedUrl, isProcessing = false }: ProcessingPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-square rounded-lg overflow-hidden bg-gray-800"
    >
      <div className="relative w-full h-full">
        {/* Original image with blur */}
        <div className={`relative w-full h-full ${isProcessing ? 'blur-sm' : ''} transition-all duration-300`}>
          <img
            src={originalUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Processing overlay */}
        {isProcessing && (
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
        )}

        {/* Download overlay (only show when processed and not processing) */}
        {processedUrl && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <motion.a
              href={processedUrl}
              download
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-purple-600 rounded-full"
            >
              <Download className="w-6 h-6" />
            </motion.a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
