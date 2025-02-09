import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, Calendar, FileText, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
  onDelete?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  fileSize,
  createdAt,
  onDelete
}: ImageLightboxProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-8 max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Image Container */}
          <div className="flex-1 relative bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="relative w-full h-full max-h-[70vh] lg:max-h-[90vh]">
              <img
                src={imageUrl}
                alt={fileName}
                className="w-full h-full object-contain"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%'
                }}
              />
            </div>
          </div>

          {/* Info Panel */}
          <div className="w-full lg:w-80 bg-gray-900 rounded-lg p-4 lg:p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg lg:text-xl font-bold text-white truncate flex-1 mr-2">
                {fileName}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">
                  {format(createdAt, "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3 text-gray-400">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm truncate">{fileName}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-400">
                <HardDrive className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{formatFileSize(fileSize)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-gray-800">
              <motion.a
                href={imageUrl}
                download
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </motion.a>

              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Excluir imagem</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}