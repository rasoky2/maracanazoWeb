import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase para el proyecto Marakanazo
const firebaseConfig = {
  apiKey: 'AIzaSyDYyPsU1DODDme8KndbvHlzhxfrleWK87E',
  authDomain: 'marakanazo.firebaseapp.com',
  databaseURL: 'https://marakanazo-default-rtdb.firebaseio.com',
  projectId: 'marakanazo',
  storageBucket: 'marakanazo.firebasestorage.app',
  messagingSenderId: '662792428108',
  appId: '1:662792428108:web:4d095e5ab128d1608cf2e9',
  measurementId: 'G-VZEYXTDP8Z'
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configurar persistencia de autenticación (localStorage/indexedDB)
// Esto asegura que la sesión persista entre recargas de página
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(error => {
    console.info('Error configurando persistencia:', error.message);
  });
}

export const storage = getStorage(app);

// Inicializar Analytics solo en el navegador
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
