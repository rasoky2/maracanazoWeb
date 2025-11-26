import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where} from 'firebase/firestore';
import { db } from '../config/firebase.config.js';
import { User } from '../models/User.model.js';

export class UserRepository {
  collection = 'usuarios';

  // Crear un nuevo usuario
  async create(userData) {
    try {
      const user = new User(userData);
      const docRef = await addDoc(collection(db, this.collection), user.toFirestore());
      return { id: docRef.id, ...userData };
    } catch (error) {
      console.info('Error creating user:', error.message);
      throw error;
    }
  }

  // Obtener usuario por ID
  async getById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return User.fromFirestore(docSnap);
      } else {
        return null;
      }
    } catch (error) {
      console.info('Error getting user by ID:', error.message);
      throw error;
    }
  }

  // Obtener usuario por email
  async getByEmail(email) {
    try {
      const q = query(
        collection(db, this.collection),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return User.fromFirestore(userDoc);
      }
      return null;
    } catch (error) {
      console.info('Error getting user by email:', error.message);
      throw error;
    }
  }

  // Obtener todos los usuarios
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collection));
      return querySnapshot.docs.map(userDoc => User.fromFirestore(userDoc));
    } catch (error) {
      console.info('Error getting all users:', error.message);
      throw error;
    }
  }

  // Actualizar usuario
  async update(id, userData) {
    try {
      const userRef = doc(db, this.collection, id);
      const user = new User({ ...userData, id, fechaActualizacion: new Date() });
      await updateDoc(userRef, user.toFirestore());
      return user;
    } catch (error) {
      console.info('Error updating user:', error.message);
      throw error;
    }
  }

  // Eliminar usuario
  async delete(id) {
    try {
      await deleteDoc(doc(db, this.collection, id));
      return true;
    } catch (error) {
      console.info('Error deleting user:', error.message);
      throw error;
    }
  }

  // Promover usuario a administrador
  async promoteToAdmin(userId) {
    try {
      const userRef = doc(db, this.collection, userId);
      await updateDoc(userRef, {
        esAdmin: true,
        fechaActualizacion: new Date()
      });
      return true;
    } catch (error) {
      console.info('Error promoting user to admin:', error.message);
      throw error;
    }
  }

  // Degradar administrador a usuario normal
  async demoteFromAdmin(userId) {
    try {
      const userRef = doc(db, this.collection, userId);
      await updateDoc(userRef, {
        esAdmin: false,
        fechaActualizacion: new Date()
      });
      return true;
    } catch (error) {
      console.info('Error demoting admin to user:', error.message);
      throw error;
    }
  }

  // Obtener todos los administradores
  async getAdmins() {
    try {
      const q = query(
        collection(db, this.collection),
        where('esAdmin', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(userDoc => User.fromFirestore(userDoc));
    } catch (error) {
      console.info('Error getting admins:', error.message);
      throw error;
    }
  }
}
