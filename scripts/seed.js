import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const filename = fileURLToPath(import.meta.url);
const dirPath = dirname(filename);

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const WEEK_DAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const loadSeedData = () => {
  try {
    const seedPath = join(dirPath, '..', 'seed-data.json');
    const fileContent = readFileSync(seedPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.info('Error cargando seed-data.json:', error.message);
    process.exit(1);
  }
  return null;
};

const calculatePrice = (precios, precioBase, time) => {
  if (!precios) {
    return precioBase || 0;
  }
  
  const [hourStr] = time.split(':');
  const hourNum = Number.parseInt(hourStr, 10);
  const mananaInicio = Number.parseInt(precios.manana.inicio.split(':')[0], 10);
  const mananaFin = Number.parseInt(precios.manana.fin.split(':')[0], 10);
  
  if (mananaFin === 0) {
    return precios.manana.precio;
  }
  
  if (hourNum >= mananaInicio && hourNum < mananaFin) {
    return precios.manana.precio;
  }
  
  return precios.noche?.precio ?? precios.manana.precio ?? precioBase ?? 0;
};

const createHorariosForCancha = async (canchaId, cancha, config) => {
  const { diasParaCrear, horaInicio, horaFin, duracion } = config.horarios;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const promises = [];
  
  for (let dayOffset = 0; dayOffset < diasParaCrear; dayOffset++) {
    const fecha = new Date(today);
    fecha.setDate(today.getDate() + dayOffset);
    const fechaStr = fecha.toISOString().split('T')[0];
    const weekDayKey = WEEK_DAYS[fecha.getDay()];
    const preciosDia = cancha.preciosSemanales?.[weekDayKey] || cancha.precios;
    
    const horariosDelDia = [];
    
    for (let hour = horaInicio; hour < horaFin; hour += duracion) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const endHourTime = hour + duracion;
      const endTime = `${endHourTime.toString().padStart(2, '0')}:00`;
      const precio = calculatePrice(preciosDia, cancha.precio, time);
      
      horariosDelDia.push({
        hora: time,
        horaFin: endTime,
        duracion,
        precio,
        precioTotal: precio * duracion,
        disponible: true
      });
    }
    
    const horarioDocRef = doc(db, 'horarios', `${canchaId}_${fechaStr}`);
    promises.push(
      setDoc(horarioDocRef, {
        idCancha: canchaId,
        nombreCancha: cancha.nombre,
        fecha: fechaStr,
        horarios: horariosDelDia,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now()
      })
    );
  }
  
  await Promise.all(promises);
  return diasParaCrear;
};

const seedDatabase = async () => {
  try {
    console.info('Iniciando seed de base de datos...\n');
    
    const seedData = loadSeedData();
    const { canchas, config } = seedData;
    
    if (!canchas || canchas.length === 0) {
      console.info('No hay canchas en seed-data.json');
      process.exit(0);
    }
    
    console.info(`Procesando ${canchas.length} cancha(s)...\n`);
    
    for (const canchaData of canchas) {
      console.info(`Creando cancha: "${canchaData.nombre}"`);
      console.info(`  - Tipo: ${canchaData.tipo}`);
      console.info(`  - Tamaño: ${canchaData.tamano || 'N/A'}`);
      console.info(`  - Ubicación: ${canchaData.ubicacion || 'N/A'}`);
      
      const canchaDoc = {
        ...canchaData,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'canchas'), canchaDoc);
      console.info(`  ✓ Cancha creada con ID: ${docRef.id}`);
      
      if (canchaData.precios) {
        console.info(`  - Precios:`);
        console.info(`    * ${canchaData.precios.manana.inicio}-${canchaData.precios.manana.fin}: S/ ${canchaData.precios.manana.precio}`);
        console.info(`    * ${canchaData.precios.noche.inicio}-${canchaData.precios.noche.fin}: S/ ${canchaData.precios.noche.precio}`);
      }
      
      console.info(`\nCreando horarios para "${canchaData.nombre}"...`);
      const diasCreados = await createHorariosForCancha(docRef.id, canchaData, config);
      console.info(`  ✓ Creados ${diasCreados} días de horarios\n`);
    }
    
    console.info('✓ Seed completado exitosamente');
    console.info(`  - ${canchas.length} cancha(s) creada(s)`);
    console.info(`  - ${config.horarios.diasParaCrear} días de horarios por cancha`);
    process.exit(0);
  } catch (error) {
    console.info('Error en seed:', error);
    process.exit(1);
  }
};

seedDatabase();
