import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '../types';

// Função para criar um novo usuário no Firestore
export async function createUserDocument(userId: string, userData: Partial<User>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Verifica se o usuário já existe
    const userDoc = await getDoc(userRef);
    
    // Se o usuário já existe, não sobrescreve os créditos existentes
    if (userDoc.exists()) {
      const existingData = userDoc.data();
      await setDoc(userRef, {
        ...existingData,
        uid: userId,
        email: userData.email || existingData.email,
        displayName: userData.displayName || existingData.displayName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('Documento do usuário atualizado com sucesso');
    } else {
      // Se é um novo usuário, cria com os créditos iniciais
      await setDoc(userRef, {
        uid: userId,
        email: userData.email || '',
        displayName: userData.displayName || '',
        credits: 10, // Créditos iniciais gratuitos
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Novo documento do usuário criado com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao criar/atualizar documento do usuário:', error);
    return false;
  }
}
