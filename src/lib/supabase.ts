import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// Helper function to get processed images with proper error handling
export async function getProcessedImages(userId: string) {
  try {
    const { data, error } = await supabase
      .from('processed_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching processed images:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProcessedImages:', error);
    return [];
  }
}

// Helper function to upload image to storage
export async function uploadImage(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('processed-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('processed-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Helper function to delete image from storage
export async function deleteImage(path: string) {
  try {
    const { error } = await supabase.storage
      .from('processed-images')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// Helper function to get image public URL
export function getPublicUrl(path: string) {
  const { data } = supabase.storage
    .from('processed-images')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Helper function to check storage quota
export async function checkStorageQuota(userId: string) {
  try {
    const { count, error } = await supabase
      .from('processed_images')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Example: limit of 100 images per user
    return {
      used: count || 0,
      limit: 100,
      available: 100 - (count || 0)
    };
  } catch (error) {
    console.error('Error checking storage quota:', error);
    throw error;
  }
}