import { auth } from './firebase';
import { useCredit } from './credits';
import { saveProcessedImage, deleteOriginalImage } from './firebase';  // Certifique-se de que a função `deleteOriginalImage` existe
import { ImageProcessingSettings } from '../types';

export async function processImage(file: File, settings: ImageProcessingSettings): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Verificar se o arquivo é uma imagem
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo enviado não é uma imagem válida');
    }

    // Prepara os dados do formulário para o back-end
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', auth.currentUser.uid);
    formData.append('version', settings.version);
    formData.append('bg_upsampler', settings.bgUpsampler);
    formData.append('real_esrgan', settings.realEsrgan);
    formData.append('upscale', settings.upscale.toString());

    console.log('Sending request to process image...');

    // Faz a requisição para o back-end FastAPI
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    // Verifica se a resposta é do tipo JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned invalid response format');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process image');
    }

    if (!data.processedImage) {
      throw new Error('Server did not return a processed image URL');
    }

    // Apagar a imagem original do banco de dados
    if (data.originalImageId) {
      await deleteOriginalImage(data.originalImageId);  // Passando o ID da imagem original para apagar
    }

    // Salva apenas os metadados da imagem processada no Firebase
    await saveProcessedImage({
      userId: auth.currentUser.uid,
      processedUrl: data.processedImage,
      createdAt: new Date()
    });

    // Deduz um crédito
    await useCredit(auth.currentUser.uid);

    console.log('Successfully processed image:', data);
    return data.processedImage;
  } catch (error) {
    console.error('Error in processImage:', error);
    if (error instanceof Error && error.message === 'Créditos insuficientes') {
      throw error;
    }
    throw error instanceof Error ? error : new Error('Failed to process image');
  }
}
