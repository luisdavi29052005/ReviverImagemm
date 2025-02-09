import { auth } from './firebase';
import { useCredit } from './credits';
import { supabase } from './supabase';
import type { ImageProcessingSettings, ProcessedImage } from '../types';

function sanitizeStoragePath(path: string): string {
  return path.replace(/[^a-zA-Z0-9-_/.]/g, '_');
}

export async function processImage(file: File, settings: ImageProcessingSettings): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo enviado não é uma imagem válida');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', auth.currentUser.uid);
    formData.append('version', settings.version);
    formData.append('bg_upsampler', settings.bgUpsampler);
    formData.append('real_esrgan', settings.realEsrgan);
    formData.append('upscale', settings.upscale.toString());

    console.log('Sending request to process image...');

    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process image');
    }

    const data = await response.json();

    if (!data.processedImage) {
      throw new Error('Server did not return a processed image URL');
    }

    // Create safe storage paths
    const timestamp = Date.now();
    const sanitizedUserId = sanitizeStoragePath(auth.currentUser.uid);
    const sanitizedFileName = sanitizeStoragePath(file.name);
    const originalFileName = `${sanitizedUserId}/${timestamp}_${sanitizedFileName}`;

    // Upload original image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('processed-images')
      .upload(originalFileName, file, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading original image:', uploadError);
      throw new Error('Failed to upload original image');
    }

    // Get public URL for original image
    const { data: urlData } = supabase.storage
      .from('processed-images')
      .getPublicUrl(originalFileName);

    // Save to Supabase database with correct column names
    const { error: dbError } = await supabase
      .from('processed_images')
      .insert({
        firebase_user_id: auth.currentUser.uid,
        url_original: urlData.publicUrl,
        url_processada: data.processedImage,
        tamanho_do_arquivo: file.size,
        tipo_de_arquivo: file.type,
        configuracoes: settings,
        criado_em: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error saving to Supabase:', dbError);
      throw new Error('Failed to save processed image metadata');
    }

    await useCredit(auth.currentUser.uid);

    return data.processedImage;
  } catch (error) {
    console.error('Error in processImage:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process image');
  }
}

export async function getProcessedImages(userId: string): Promise<ProcessedImage[]> {
  if (!userId) {
    console.error('No user ID provided to getProcessedImages');
    return [];
  }

  try {
    console.log('Fetching images for user:', userId);
    
    const { data, error } = await supabase
      .from('processed_images')
      .select('*')
      .eq('firebase_user_id', userId)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Error fetching processed images:', error);
      throw error;
    }

    if (!data) {
      console.log('No images found for user');
      return [];
    }

    console.log('Found images:', data.length);

    return data.map(item => ({
      id: item.id,
      userId: item.firebase_user_id,
      originalUrl: item.url_original,
      processedUrl: item.url_processada,
      createdAt: new Date(item.criado_em)
    }));
  } catch (error) {
    console.error('Error in getProcessedImages:', error);
    return [];
  }
}