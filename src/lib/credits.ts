import { db, COLLECTIONS } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { User, Transaction, ProcessedImage, CreditPlan, RefundRequest } from '../types';

// Planos de créditos disponíveis
export const creditPlans: CreditPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    credits: 5,
    price: 5.00,
    description: '5 créditos para restaurar suas fotos'
  },
  {
    id: 'standard',
    name: 'Padrão',
    credits: 15,
    price: 10.00,
    description: '15 créditos com desconto'
  },
  {
    id: 'premium',
    name: 'Premium',
    credits: 50,
    price: 20.00,
    description: '50 créditos com maior desconto'
  }
];

// Gerenciar créditos do usuário
export async function getUserCredits(userId: string): Promise<number> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  return userDoc.data()?.credits || 0;
}

export async function updateUserCredits(userId: string, newCredits: number) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    credits: newCredits,
    updatedAt: serverTimestamp()
  });
}

export async function useCredit(userId: string, amount: number = 1) {
  const currentCredits = await getUserCredits(userId);
  if (currentCredits < amount) {
    throw new Error('Créditos insuficientes');
  }
  await updateUserCredits(userId, currentCredits - amount);
}

// Gerenciar transações
export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  return addDoc(transactionsRef, {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function getUserTransactions(userId: string) {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const q = query(transactionsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  }));
}

// Gerenciar imagens processadas
export async function saveProcessedImage(data: Omit<ProcessedImage, 'id' | 'createdAt'>) {
  const imagesRef = collection(db, COLLECTIONS.PROCESSED_IMAGES);
  return addDoc(imagesRef, {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function getUserProcessedImages(userId: string) {
  const imagesRef = collection(db, COLLECTIONS.PROCESSED_IMAGES);
  const q = query(imagesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate()
  }));
}

// Sistema de Reembolso
export async function requestRefund(data: Omit<RefundRequest, 'id' | 'createdAt' | 'status'>) {
  const refundsRef = collection(db, COLLECTIONS.REFUND_REQUESTS);
  return addDoc(refundsRef, {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function getUserRefundRequests(userId: string) {
  const refundsRef = collection(db, COLLECTIONS.REFUND_REQUESTS);
  const q = query(refundsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: doc.data().updatedAt ? (doc.data().updatedAt as Timestamp).toDate() : null
  }));
}

export async function updateRefundStatus(refundId: string, status: 'pending' | 'approved' | 'rejected', reason?: string) {
  const refundRef = doc(db, COLLECTIONS.REFUND_REQUESTS, refundId);
  await updateDoc(refundRef, {
    status,
    updatedAt: serverTimestamp(),
    ...(reason && { reason })
  });

  // If approved, update transaction status and user credits
  if (status === 'approved') {
    const refundDoc = await getDoc(refundRef);
    const refundData = refundDoc.data() as RefundRequest;

    // Update transaction status
    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, refundData.transactionId);
    await updateDoc(transactionRef, {
      status: 'refunded',
      updatedAt: serverTimestamp()
    });

    // Update user credits
    const currentCredits = await getUserCredits(refundData.userId);
    await updateUserCredits(refundData.userId, currentCredits - refundData.credits);
  }
}

// Verifica se uma transação é elegível para reembolso (até 7 dias após a compra)
export function isRefundEligible(transaction: Transaction): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(transaction.createdAt) > sevenDaysAgo;
}
