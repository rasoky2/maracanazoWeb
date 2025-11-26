import { 
  doc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase.config.js';

export class HomeContentRepository {
  constructor() {
    this.collection = 'homeContent';
  }

  // Obtener contenido de Steps
  async getSteps() {
    try {
      const docRef = doc(db, this.collection, 'steps');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().steps || [];
      }
      return [];
    } catch (error) {
      console.info('Error getting steps:', error.message);
      throw error;
    }
  }

  // Guardar contenido de Steps
  async saveSteps(steps) {
    try {
      const docRef = doc(db, this.collection, 'steps');
      await setDoc(docRef, { steps, updatedAt: new Date() }, { merge: true });
      return steps;
    } catch (error) {
      console.info('Error saving steps:', error.message);
      throw error;
    }
  }

  // Obtener logos de TrustedBy
  async getTrustedBy() {
    try {
      const docRef = doc(db, this.collection, 'trustedBy');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().logos || [];
      }
      return [];
    } catch (error) {
      console.info('Error getting trustedBy:', error.message);
      throw error;
    }
  }

  // Guardar logos de TrustedBy
  async saveTrustedBy(logos) {
    try {
      const docRef = doc(db, this.collection, 'trustedBy');
      await setDoc(docRef, { logos, updatedAt: new Date() }, { merge: true });
      return logos;
    } catch (error) {
      console.info('Error saving trustedBy:', error.message);
      throw error;
    }
  }

  // Obtener videos de Video
  async getVideos() {
    try {
      const docRef = doc(db, this.collection, 'videos');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().sports || [];
      }
      return [];
    } catch (error) {
      console.info('Error getting videos:', error.message);
      throw error;
    }
  }

  // Guardar videos de Video
  async saveVideos(sports) {
    try {
      const docRef = doc(db, this.collection, 'videos');
      await setDoc(docRef, { sports, updatedAt: new Date() }, { merge: true });
      return sports;
    } catch (error) {
      console.info('Error saving videos:', error.message);
      throw error;
    }
  }

  // Obtener descuentos destacados para la sección de home
  async getFeaturedDiscounts() {
    try {
      const docRef = doc(db, this.collection, 'featuredDiscounts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().discounts || [];
      }
      return [];
    } catch (error) {
      console.info('Error getting featured discounts:', error.message);
      throw error;
    }
  }

  // Guardar descuentos destacados
  async saveFeaturedDiscounts(discounts) {
    try {
      const docRef = doc(db, this.collection, 'featuredDiscounts');
      await setDoc(docRef, { 
        discounts, 
        updatedAt: new Date(),
        title: 'Descuentos Increíbles Disponibles Esta Semana!',
        subtitle: 'No te pierdas nuestras ofertas especiales en reservas de canchas.'
      }, { merge: true });
      return discounts;
    } catch (error) {
      console.info('Error saving featured discounts:', error.message);
      throw error;
    }
  }

  // Obtener título y subtítulo de la sección de descuentos
  async getDiscountsSectionInfo() {
    try {
      const docRef = doc(db, this.collection, 'featuredDiscounts');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          title: data.title || 'Descuentos Increíbles Disponibles Esta Semana!',
          subtitle: data.subtitle || 'No te pierdas nuestras ofertas especiales en reservas de canchas.'
        };
      }
      return {
        title: 'Descuentos Increíbles Disponibles Esta Semana!',
        subtitle: 'No te pierdas nuestras ofertas especiales en reservas de canchas.'
      };
    } catch (error) {
      console.info('Error getting discounts section info:', error.message);
      return {
        title: 'Descuentos Increíbles Disponibles Esta Semana!',
        subtitle: 'No te pierdas nuestras ofertas especiales en reservas de canchas.'
      };
    }
  }
}
