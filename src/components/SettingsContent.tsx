import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { ImageProcessingSettings } from '../types';

interface SettingsContentProps {
  settings: ImageProcessingSettings;
  setSettings: React.Dispatch<React.SetStateAction<ImageProcessingSettings>>;
  onProcess: () => void;
  onClose?: () => void;
  isProcessing: boolean;
}

export function SettingsContent({ 
  settings, 
  setSettings, 
  onProcess, 
  onClose,
  isProcessing 
}: SettingsContentProps) {
  const handleVersionChange = (version: string) => {
    setSettings(prev => ({
      ...prev,
      version
    }));
  };

  const handleBgUpsamplerChange = (value: 'none' | 'realesrgan') => {
    setSettings(prev => ({
      ...prev,
      bgUpsampler: value
    }));
  };

  const handleRealEsrganChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      realEsrgan: value
    }));
  };

  const handleUpscaleChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      upscale: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-xs font-medium">
        <div className="flex justify-between items-center mb-4">
          <span>Configurações de processamento</span>
          <span className="text-purple-500 cursor-pointer hover:text-purple-400 transition-colors">
            Predefinições
          </span>
        </div>

        <div className="space-y-4">
          {/* Version Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>Versão do Modelo</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    Escolha a versão do modelo de IA para processamento
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {['1.2', '1.3', '1.4', 'RestoreFormer'].map((version) => (
                <button
                  key={version}
                  onClick={() => handleVersionChange(version)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    settings.version === version ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  v{version}
                </button>
              ))}
            </div>
          </div>

          {/* Background Upsampler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>Background Upsampler</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    Método de processamento do fundo da imagem
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'none', label: 'Nenhum' },
                { value: 'realesrgan', label: 'RealESRGAN' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleBgUpsamplerChange(option.value as 'none' | 'realesrgan')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    settings.bgUpsampler === option.value ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* RealESRGAN Model */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>Modelo RealESRGAN</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    Versão do modelo RealESRGAN para upscaling
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {['x2', 'x4', 'x8'].map((scale) => (
                <button
                  key={scale}
                  onClick={() => handleRealEsrganChange(scale)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    settings.realEsrgan === scale ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          {/* Upscale Factor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span>Fator de Ampliação</span>
                <div className="cursor-help group relative">
                  <Info className="w-3 h-3 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                    Quanto a imagem será ampliada
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{settings.upscale}x</span>
            </div>
            
            <input
              type="range"
              min="2"
              max="8"
              step="2"
              value={settings.upscale}
              onChange={(e) => handleUpscaleChange(Number(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2x</span>
              <span>8x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onProcess}
          disabled={isProcessing}
          className={`w-full py-2 bg-purple-600 text-sm rounded-lg hover:bg-purple-700 transition-all ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? 'Processando...' : 'Iniciar processamento'}
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
