import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  type DocumentData
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Transaction, RefundRequest } from '../types';

// Credit plans
export const creditPlans = [
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

// Get user credits
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.data()?.credits || 0;
  } catch (error) {
    console.error('Error fetching credits:', error);
    return 0;
  }
}

// Update user credits
export async function updateUserCredits(userId: string, newCredits: number) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      credits: newCredits,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    throw new Error('Failed to update credits');
  }
}

// Use credits
export async function useCredit(userId: string, amount: number = 1) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentCredits = userDoc.data()?.credits || 0;

    if (currentCredits < amount) {
      throw new Error('Créditos insuficientes');
    }

    await updateDoc(userRef, {
      credits: increment(-amount),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error using credits:', error);
    throw error;
  }
}

// Get user transactions
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Create transaction
export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
  try {
    const transactionsRef = collection(db, 'transactions');
    const docRef = await addDoc(transactionsRef, {
      ...data,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Request refund
export async function requestRefund(data: Omit<RefundRequest, 'id' | 'createdAt' | 'status'>) {
  try {
    const refundsRef = collection(db, 'refundRequests');
    await addDoc(refundsRef, {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
}

// Get user refund requests
export async function getUserRefundRequests(userId: string) {
  try {
    const refundsRef = collection(db, 'refundRequests');
    const q = query(
      refundsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt?.toDate() || null
    }));
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    return [];
  }
}

// Check if transaction is eligible for refund
export function isRefundEligible(transaction: Transaction): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(transaction.createdAt) > sevenDaysAgo;
}