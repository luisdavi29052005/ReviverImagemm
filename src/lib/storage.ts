import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './firebase';

const storage = getStorage();

export async function uploadImage(file: File) {
  if (!auth.currentUser) throw new Error('Usuário não autenticado');

  // Validate file type
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error('Formato de arquivo não suportado. Use JPG, PNG ou WebP.');
  }

  // Validate file size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. O tamanho máximo é 50MB.');
  }

  try {
    // Create a unique file name
    const fileName = `${auth.currentUser.uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: file.name,
      type: file.type,
      size: file.size
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw new Error('Falha ao fazer upload da imagem. Tente novamente.');
  }
}
