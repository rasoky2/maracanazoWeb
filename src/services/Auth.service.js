import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase.config.js';
import { UserRepository } from '../repositories/User.repository.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.currentUser = null;
    this.lastFetchedEmail = null;
    this.googleProvider = new GoogleAuthProvider();
    
    // Configurar scopes adicionales para obtener más información
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('https://www.googleapis.com/auth/user.birthday.read');
    this.googleProvider.addScope('https://www.googleapis.com/auth/user.gender.read');
    this.googleProvider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
  }

  // Registrar nuevo usuario
  async register(email, password, userData) {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualizar perfil del usuario
      await updateProfile(user, {
        displayName: userData.name
      });

      // Crear documento en Firestore
      const userDoc = await this.userRepository.create({
        email: user.email,
        nombreCompleto: userData.name,
        telefono: userData.phone,
        esAdmin: false
      });

      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userDoc
        }
      };
    } catch (error) {
      console.info('Error registering user:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Iniciar sesión
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await this.userRepository.getByEmail(email);
      
      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          ...userDoc
        }
      };
    } catch (error) {
      console.info('Error logging in:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Iniciar sesión con Google
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const user = result.user;
      
      // Obtener información adicional del token de Google
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      
      // Información básica de Firebase Auth
      const userBasicInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        providerId: user.providerId,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      };
      
      // Información adicional que podemos obtener del perfil de Google
      let additionalInfo = {};
      
      if (accessToken) {
        try {
          // Hacer petición a Google People API para obtener información adicional
          const peopleResponse = await fetch(
            `https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,phoneNumbers,birthdays,genders,addresses,organizations,occupations,biographies,photos`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (peopleResponse.ok) {
            const peopleData = await peopleResponse.json();
            additionalInfo = this.extractGooglePeopleData(peopleData);
          }
        } catch (error) {
          console.info('No se pudo obtener información adicional de Google People API:', error.message);
        }
      }
      
      // Combinar toda la información disponible
      const completeUserInfo = {
        ...userBasicInfo,
        ...additionalInfo
      };
      
      // Verificar si el usuario ya existe en Firestore
      let userDoc = await this.userRepository.getByEmail(user.email);
      
      // Si no existe, crear el usuario en Firestore
      if (!userDoc) {
        userDoc = await this.userRepository.create({
          email: user.email,
          nombreCompleto: user.displayName || additionalInfo.nombreCompleto || 'Usuario Google',
          telefono: user.phoneNumber || additionalInfo.telefonos?.[0]?.value || '',
          urlFoto: user.photoURL || '',
          esAdmin: false
        });
      } else {
        // Actualizar información existente con datos más recientes
        await this.userRepository.update(userDoc.id, {
          nombreCompleto: user.displayName || additionalInfo.nombreCompleto || userDoc.nombreCompleto,
          telefono: user.phoneNumber || additionalInfo.telefonos?.[0]?.value || userDoc.telefono,
          urlFoto: user.photoURL || userDoc.urlFoto
        });
      }
      
      return { 
        success: true, 
        user: {
          ...completeUserInfo,
          ...userDoc
        }
      };
    } catch (error) {
      console.info('Error logging in with Google:', error.message);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Extraer datos de Google People API
  extractGooglePeopleData(peopleData) {
    const extracted = {};
    
    try {
      // Nombres
      if (peopleData.names && peopleData.names.length > 0) {
        const name = peopleData.names[0];
        extracted.nombreCompleto = name.displayName || '';
      }
      
      // Números de teléfono
      if (peopleData.phoneNumbers && peopleData.phoneNumbers.length > 0) {
        extracted.telefonos = peopleData.phoneNumbers.map(phone => ({
          value: phone.value,
          type: phone.type,
        }));
      }
      
    } catch (error) {
      console.info('Error extrayendo datos de Google People API:', error.message);
    }
    
    return extracted;
  }

  // Cerrar sesión
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.info('Error logging out:', error.message);
      throw error;
    }
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.currentUser;
  }

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async user => {
      if (user) {
        // Solo obtener datos si el email cambió para evitar consultas innecesarias
        if (user.email !== this.lastFetchedEmail) {
          this.lastFetchedEmail = user.email;
          try {
            const userDoc = await this.userRepository.getByEmail(user.email);
            // Combinar datos de Firebase Auth con datos de Firestore
            // Asegurar que urlFoto de Firestore tenga prioridad sobre photoURL de Firebase Auth
            this.currentUser = { 
              ...user, 
              ...userDoc,
              urlFoto: userDoc?.urlFoto || user.photoURL || '',
              nombreCompleto: userDoc?.nombreCompleto || user.displayName || '',
              telefono: userDoc?.telefono || '',
              esAdmin: userDoc?.esAdmin === true
            };
          } catch (error) {
            console.info('Error obteniendo datos del usuario:', error.message);
            this.currentUser = { 
              ...user,
              urlFoto: user.photoURL || '',
              nombreCompleto: user.displayName || ''
            };
          }
        }
      } else {
        this.currentUser = null;
        this.lastFetchedEmail = null;
      }
      callback(this.currentUser);
    });
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Verificar si el usuario es admin
  isAdmin() {
    return this.currentUser?.esAdmin === true;
  }

  // Obtener mensaje de error personalizado
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'El email ya está registrado',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión',
      'auth/invalid-credential': 'Credenciales inválidas'
    };
    
    return errorMessages[errorCode] || 'Error de autenticación';
  }
}
