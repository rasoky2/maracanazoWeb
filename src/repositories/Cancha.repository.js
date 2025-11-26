import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase.config.js';
import { Cancha } from '../models/Cancha.model.js';

export class CanchaRepository {
  constructor() {
    this.collection = 'canchas';
  }

  // Crear una nueva cancha
  async create(canchaData) {
    try {
      const cancha = new Cancha(canchaData);
      const docRef = await addDoc(collection(db, this.collection), cancha.toFirestore());
      return { id: docRef.id, ...canchaData };
    } catch (error) {
      console.info('Error creating cancha:', error);
      throw error;
    }
  }

  // Obtener cancha por ID
  async getById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Cancha.fromFirestore(docSnap);
      } else {
        return null;
      }
    } catch (error) {
      console.info('Error getting cancha by ID:', error);
      throw error;
    }
  }

  // Obtener todas las canchas
  async getAll() {
    try {
      const q = query(
        collection(db, this.collection),
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const canchas = querySnapshot.docs.map(doc => Cancha.fromFirestore(doc));
      return canchas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (error) {
      console.info('Error getting all canchas:', error);
      throw error;
    }
  }

  // Obtener canchas por tipo
  async getByType(type) {
    try {
      const q = query(
        collection(db, this.collection),
        where('tipo', '==', type),
        where('activo', '==', true),
        orderBy('nombre')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Cancha.fromFirestore(doc));
    } catch (error) {
      console.info('Error getting canchas by type:', error);
      throw error;
    }
  }

  // Actualizar cancha
  async update(id, canchaData) {
    try {
      const canchaRef = doc(db, this.collection, id);
      const cancha = new Cancha({ ...canchaData, id, fechaActualizacion: new Date() });
      await updateDoc(canchaRef, cancha.toFirestore());
      return cancha;
    } catch (error) {
      console.info('Error updating cancha:', error);
      throw error;
    }
  }

  // Eliminar cancha (soft delete)
  async delete(id) {
    try {
      const canchaRef = doc(db, this.collection, id);
      await updateDoc(canchaRef, { 
        activo: false, 
        fechaActualizacion: new Date() 
      });
      return true;
    } catch (error) {
      console.info('Error deleting cancha:', error);
      throw error;
    }
  }
}
