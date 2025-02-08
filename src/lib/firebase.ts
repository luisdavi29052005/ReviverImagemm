import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

export const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  REFUND_REQUESTS: 'refundRequests',
  PROCESSED_IMAGES: 'processedImages'
} as const;

export async function saveProcessedImage(userId: string, file: File) {
  const storageRef = ref(storage, `processed/${userId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteOriginalImage(filePath: string) {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
}

export async function getProcessedImages(userId: string) {
  const imagesRef = collection(db, COLLECTIONS.PROCESSED_IMAGES);
  const querySnapshot = await getDocs(imagesRef);
  return querySnapshot.docs
    .filter((doc) => doc.data().userId === userId)
    .map((doc) => ({ id: doc.id, ...doc.data() }));
}
