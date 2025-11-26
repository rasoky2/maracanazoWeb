import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../config/firebase.config.js';

export class StorageService {
  basePath = 'canchas';

  async uploadImage(file, path) {
    try {
      const storageRef = ref(storage, `${this.basePath}/${path}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.info('Error uploading image:', error.message);
      throw new Error('Error al subir la imagen: ' + error.message);
    }
  }

  async uploadImageFromBlob(blob, path) {
    try {
      const storageRef = ref(storage, `${this.basePath}/${path}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.info('Error uploading image from blob:', error.message);
      throw new Error('Error al subir la imagen: ' + error.message);
    }
  }

  async deleteImage(imageUrl) {
    try {
      if (!imageUrl?.includes('firebasestorage')) {
        return;
      }
      
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.info('Error deleting image:', error.message);
    }
  }

  generateImagePath(canchaId, imageType, extension = 'jpg') {
    const timestamp = Date.now();
    return `${canchaId}/${imageType}_${timestamp}.${extension}`;
  }
}
