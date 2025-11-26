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
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase.config.js';
import { Descuento } from '../models/Descuento.model.js';

export class DescuentoRepository {
  constructor() {
    this.collection = 'descuentos';
  }

  // Crear un nuevo descuento
  async create(descuentoData) {
    try {
      const descuento = new Descuento(descuentoData);
      const docRef = await addDoc(collection(db, this.collection), descuento.toFirestore());
      return { id: docRef.id, ...descuentoData };
    } catch (error) {
      console.info('Error creating descuento:', error);
      throw error;
    }
  }

  // Obtener descuento por ID
  async getById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Descuento.fromFirestore(docSnap);
      } else {
        return null;
      }
    } catch (error) {
      console.info('Error getting descuento by ID:', error);
      throw error;
    }
  }

  // Obtener descuento por código
  async getByCodigo(codigo) {
    try {
      const q = query(
        collection(db, this.collection),
        where('codigo', '==', codigo.toUpperCase()),
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return Descuento.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.info('Error getting descuento by codigo:', error);
      throw error;
    }
  }

  // Obtener descuentos públicos activos
  async getPublicosActivos() {
    try {
      const q = query(
        collection(db, this.collection),
        where('esPublico', '==', true),
        where('activo', '==', true),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Descuento.fromFirestore(doc));
    } catch (error) {
      console.info('Error getting publicos activos:', error);
      throw error;
    }
  }

  // Obtener todos los descuentos (admin)
  async getAll() {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Descuento.fromFirestore(doc));
    } catch (error) {
      console.info('Error getting all descuentos:', error);
      throw error;
    }
  }

  // Actualizar descuento
  async update(id, descuentoData) {
    try {
      const descuentoRef = doc(db, this.collection, id);
      const descuento = new Descuento({ ...descuentoData, id, fechaActualizacion: new Date() });
      await updateDoc(descuentoRef, descuento.toFirestore());
      return descuento;
    } catch (error) {
      console.info('Error updating descuento:', error);
      throw error;
    }
  }

  // Incrementar contador de usos
  async incrementarUso(id) {
    try {
      const descuentoRef = doc(db, this.collection, id);
      await updateDoc(descuentoRef, {
        usosActuales: increment(1),
        fechaActualizacion: new Date()
      });
      return true;
    } catch (error) {
      console.info('Error incrementing uso:', error);
      throw error;
    }
  }

  // Desactivar descuento
  async desactivar(id) {
    try {
      const descuentoRef = doc(db, this.collection, id);
      await updateDoc(descuentoRef, { 
        activo: false, 
        fechaActualizacion: new Date() 
      });
      return true;
    } catch (error) {
      console.info('Error deactivating descuento:', error);
      throw error;
    }
  }

  // Eliminar descuento
  async delete(id) {
    try {
      const descuentoRef = doc(db, this.collection, id);
      await deleteDoc(descuentoRef);
      return true;
    } catch (error) {
      console.info('Error deleting descuento:', error);
      throw error;
    }
  }
}
