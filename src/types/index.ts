export interface User {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId: string;
  paymentMethod: string;
  createdAt: Date;
}

export interface ProcessedImage {
  id: string;
  userId: string;
  originalUrl: string;
  processedUrl: string;
  createdAt: Date;
}

export interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
}

export interface RefundRequest {
  id: string;
  userId: string;
  transactionId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  amount: number;
  credits: number;
}

export interface ImageProcessingSettings {
  version: string;
  bgUpsampler: 'none' | 'realesrgan';
  realEsrgan: string;
  upscale: number;
}
