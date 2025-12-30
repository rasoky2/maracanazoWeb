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
import { Reserva } from '../models/Reserva.model.js';

export class ReservaRepository {
  constructor() {
    this.collection = 'reservas';
  }

  // Crear una nueva reserva
  async create(reservaData) {
    try {
      const reserva = new Reserva(reservaData);
      const docRef = await addDoc(collection(db, this.collection), reserva.toFirestore());
      return { id: docRef.id, ...reservaData };
    } catch (error) {
      console.info('Error creating reserva:', error);
      throw error;
    }
  }

  // Obtener reserva por ID
  async getById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Reserva.fromFirestore(docSnap);
      } else {
        return null;
      }
    } catch (error) {
      console.info('Error getting reserva by ID:', error);
      throw error;
    }
  }

  // Obtener reservas por usuario
  async getByUser(userId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('idUsuario', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const reservas = querySnapshot.docs.map(doc => Reserva.fromFirestore(doc));
      // Ordenar en memoria por fechaCreacion descendente
      return reservas.sort((a, b) => {
        const fechaA = a.fechaCreacion?.toDate ? a.fechaCreacion.toDate() : new Date(a.fechaCreacion);
        const fechaB = b.fechaCreacion?.toDate ? b.fechaCreacion.toDate() : new Date(b.fechaCreacion);
        return fechaB - fechaA;
      });
    } catch (error) {
      console.info('Error getting reservas by user:', error);
      throw error;
    }
  }

  // Obtener reservas por cancha y fecha
  async getByCanchaAndDate(canchaId, date) {
    try {
      // Función auxiliar para convertir tiempo a minutos
      const timeToMinutes = (time) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Primero intentar con orderBy, si falla por índice, hacer sin orderBy
      let q;
      try {
        q = query(
          collection(db, this.collection),
          where('idCancha', '==', canchaId),
          where('fecha', '==', date),
          where('estadoPago', 'in', ['pendiente', 'pagado']),
          orderBy('horaInicio')
        );
      } catch (indexError) {
        // Si falla por índice, hacer la consulta sin orderBy
        console.info('Index error, querying without orderBy:', indexError);
        q = query(
          collection(db, this.collection),
          where('idCancha', '==', canchaId),
          where('fecha', '==', date),
          where('estadoPago', 'in', ['pendiente', 'pagado'])
        );
      }
      
      const querySnapshot = await getDocs(q);
      const reservas = querySnapshot.docs.map(doc => Reserva.fromFirestore(doc));
      
      console.info(`Consulta exitosa: ${reservas.length} reservas encontradas para cancha ${canchaId} en fecha ${date}`);
      
      // Ordenar en memoria si no se pudo ordenar en la consulta
      return reservas.sort((a, b) => {
        const horaA = timeToMinutes(a.horaInicio);
        const horaB = timeToMinutes(b.horaInicio);
        return horaA - horaB;
      });
    } catch (error) {
      console.info('Error getting reservas by cancha and date:', error);
      // Si falla completamente, intentar sin filtro de estadoPago
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
        const reservas = querySnapshot.docs.map(doc => Reserva.fromFirestore(doc));
        console.info(`Consulta fallback: ${reservas.length} reservas encontradas (sin filtro de estado)`);
        
        // Filtrar solo pendientes y pagadas en memoria
        const reservasFiltradas = reservas.filter(r => r.estadoPago === 'pendiente' || r.estadoPago === 'pagado');
        console.info(`Reservas filtradas (pendientes/pagadas): ${reservasFiltradas.length}`);
        
        return reservasFiltradas.sort((a, b) => {
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

  // Obtener todas las reservas
  async getAll() {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Reserva.fromFirestore(doc));
    } catch (error) {
      console.info('Error getting all reservas:', error);
      throw error;
    }
  }

  // Actualizar reserva
  async update(id, reservaData) {
    try {
      const reservaRef = doc(db, this.collection, id);
      const reserva = new Reserva({ ...reservaData, id, fechaActualizacion: new Date() });
      await updateDoc(reservaRef, reserva.toFirestore());
      return reserva;
    } catch (error) {
      console.info('Error updating reserva:', error);
      throw error;
    }
  }

  // Cancelar reserva
  async cancel(id) {
    try {
      const reservaRef = doc(db, this.collection, id);
      await updateDoc(reservaRef, { 
        estadoPago: 'cancelado', 
        fechaActualizacion: new Date() 
      });
      return true;
    } catch (error) {
      console.info('Error cancelling reserva:', error);
      throw error;
    }
  }

  // Confirmar reserva
  async confirm(id) {
    try {
      const reservaRef = doc(db, this.collection, id);
      await updateDoc(reservaRef, { 
        estadoPago: 'pagado', 
        fechaActualizacion: new Date() 
      });
      return true;
    } catch (error) {
      console.info('Error confirming reserva:', error);
      throw error;
    }
  }

  // Eliminar reserva
  async delete(id) {
    try {
      const reservaRef = doc(db, this.collection, id);
      await deleteDoc(reservaRef);
      return true;
    } catch (error) {
      console.info('Error deleting reserva:', error);
      throw error;
    }
  }
}
