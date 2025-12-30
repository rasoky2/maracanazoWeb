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
import { Evento } from '../models/Evento.model.js';

export class EventoRepository {
  constructor() {
    this.collection = 'eventos';
  }

  // Crear un nuevo evento
  async create(eventoData) {
    try {
      const evento = new Evento(eventoData);
      const docRef = await addDoc(collection(db, this.collection), evento.toFirestore());
      return { id: docRef.id, ...eventoData };
    } catch (error) {
      console.info('Error creating evento:', error);
      throw error;
    }
  }

  // Obtener evento por ID
  async getById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Evento.fromFirestore(docSnap);
      } else {
        return null;
      }
    } catch (error) {
      console.info('Error getting evento by ID:', error);
      throw error;
    }
  }

  // Obtener eventos por cancha y fecha
  async getByCanchaAndDate(canchaId, date) {
    try {
      const timeToMinutes = (time) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      let q;
      try {
        q = query(
          collection(db, this.collection),
          where('idCancha', '==', canchaId),
          where('fecha', '==', date),
          where('activo', '==', true),
          orderBy('horaInicio')
        );
      } catch (indexError) {
        console.info('Index error, querying without orderBy:', indexError);
        q = query(
          collection(db, this.collection),
          where('idCancha', '==', canchaId),
          where('fecha', '==', date),
          where('activo', '==', true)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const eventos = querySnapshot.docs.map(doc => Evento.fromFirestore(doc));
      
      return eventos.sort((a, b) => {
        const horaA = timeToMinutes(a.horaInicio);
        const horaB = timeToMinutes(b.horaInicio);
        return horaA - horaB;
      });
    } catch (error) {
      console.info('Error getting eventos by cancha and date:', error);
      try {
        const timeToMinutes = (time) => {
          if (!time) return 0;
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const q = query(
          collection(db, this.collection),
          where('idCancha', '==', canchaId),
          where('fecha', '==', date)
        );
        const querySnapshot = await getDocs(q);
        const eventos = querySnapshot.docs.map(doc => Evento.fromFirestore(doc));
        
        return eventos
          .filter(e => e.activo === true)
          .sort((a, b) => {
            const horaA = timeToMinutes(a.horaInicio);
            const horaB = timeToMinutes(b.horaInicio);
            return horaA - horaB;
          });
      } catch (fallbackError) {
        console.info('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  // Obtener todos los eventos
  async getAll() {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Evento.fromFirestore(doc));
    } catch (error) {
      console.info('Error getting all eventos:', error);
      throw error;
    }
  }

  // Actualizar evento
  async update(id, eventoData) {
    try {
      const eventoRef = doc(db, this.collection, id);
      const evento = new Evento({ ...eventoData, id, fechaActualizacion: new Date() });
      await updateDoc(eventoRef, evento.toFirestore());
      return evento;
    } catch (error) {
      console.info('Error updating evento:', error);
      throw error;
    }
  }

  // Eliminar evento
  async delete(id) {
    try {
      const eventoRef = doc(db, this.collection, id);
      await deleteDoc(eventoRef);
      return true;
    } catch (error) {
      console.info('Error deleting evento:', error);
      throw error;
    }
  }
}
