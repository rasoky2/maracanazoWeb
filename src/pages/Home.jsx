import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Chip, Spinner, Select, SelectItem } from '@heroui/react';
import { motion } from 'framer-motion';
import Steps from '../components/Home/Steps';
import Laptop from '../components/Home/Laptop';
import TrustedBy from '../components/Home/TrustedBy';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { EventoRepository } from '../repositories/Evento.repository.js';
import { 
  FaClock, 
  FaCheckCircle,
  FaInstagram,
  FaTiktok,
  FaStar,
  FaCalendarCheck
} from 'react-icons/fa';

// Obtener los próximos 3 días desde hoy en zona horaria de Lima (UTC-5)
const getNext3Days = () => {
  // Obtener fecha actual en zona horaria de Lima
  const now = new Date();
  const limaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  
  const next3Days = [];
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(limaTime);
    date.setDate(limaTime.getDate() + i);
    
    // Obtener día de la semana en zona horaria de Lima
    const dayIndex = date.getDay();
    
    // Mapear índice del día a nombre
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Formatear fecha en formato YYYY-MM-DD usando zona horaria de Lima
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    next3Days.push({
      name: dayNames[dayIndex],
      date: formattedDate,
      dayIndex: dayIndex
    });
  }
  
  return next3Days;
};

const Home = () => {
  const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const dayMap = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 0
  };
  
  const dayToWeeklyPricingKey = {
    'Lunes': 'lunes',
    'Martes': 'martes',
    'Miércoles': 'miercoles',
    'Jueves': 'jueves',
    'Viernes': 'viernes',
    'Sábado': 'sabado',
    'Domingo': 'domingo'
  };
  
  const [canchas, setCanchas] = useState([]);
  const [selectedCanchaId, setSelectedCanchaId] = useState('');
  const [next3Days] = useState(() => getNext3Days());
  const [selectedDay, setSelectedDay] = useState(() => {
    const days = getNext3Days();
    return days[0]?.name || 'Lunes';
  });
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [featuredEventos, setFeaturedEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const canchaRepository = new CanchaRepository();
  const reservaRepository = new ReservaRepository();
  const eventoRepository = new EventoRepository();

  useEffect(() => {
    loadCanchas();
    loadFeaturedEventos();
  }, []);

  useEffect(() => {
    if (selectedCanchaId && selectedDay) {
      loadReservas();
      loadEventos();
    }
  }, [selectedCanchaId, selectedDay]);

  const loadCanchas = async () => {
    try {
      setLoadingCanchas(true);
      const canchasData = await canchaRepository.getAll();
      setCanchas(canchasData);
      if (canchasData.length > 0 && !selectedCanchaId) {
        setSelectedCanchaId(canchasData[0].id);
      }
    } catch (err) {
      console.info('Error loading canchas:', err.message);
      setCanchas([]);
    } finally {
      setLoadingCanchas(false);
    }
  };

  const DAYS_IN_WEEK = 7;

  const getDateForDay = dayName => {
    // Buscar el día en los próximos 3 días (ya calculados con zona horaria de Lima)
    const dayInfo = next3Days.find(d => d.name === dayName);
    
    if (dayInfo) {
      return dayInfo.date;
    }
    
    // Fallback: calcular usando zona horaria de Lima
    const now = new Date();
    const limaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const currentDay = limaTime.getDay();
    const targetDay = dayMap[dayName];
    let daysUntilTarget = targetDay - currentDay;
    
    if (daysUntilTarget <= 0) {
      daysUntilTarget += DAYS_IN_WEEK;
    }
    
    const targetDate = new Date(limaTime);
    targetDate.setDate(limaTime.getDate() + daysUntilTarget);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadReservas = async () => {
    if (!selectedCanchaId) {
      return;
    }
    
    try {
      setLoadingReservas(true);
      const date = getDateForDay(selectedDay);
      const reservasData = await reservaRepository.getByCanchaAndDate(selectedCanchaId, date);
      setReservas(reservasData);
    } catch (err) {
      console.info('Error loading reservas:', err.message);
      setReservas([]);
    } finally {
      setLoadingReservas(false);
    }
  };

  const loadEventos = async () => {
    if (!selectedCanchaId) {
      return;
    }
    
    try {
      const date = getDateForDay(selectedDay);
      const eventosData = await eventoRepository.getByCanchaAndDate(selectedCanchaId, date);
      // Filtrar solo eventos activos
      const eventosActivos = eventosData.filter(evento => evento.activo === true);
      setEventos(eventosActivos);
    } catch (err) {
      console.info('Error loading eventos:', err.message);
      setEventos([]);
    }
  };

  const timeToMinutes = time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeSlotAvailable = (startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Verificar si está ocupado por reservas (solo pendientes y pagadas, excluir canceladas)
    const estaOcupadoPorReserva = reservas.some(reserva => {
      // Solo considerar reservas con estado válido (pendiente o pagado)
      if (!reserva.estadoPago || (reserva.estadoPago !== 'pendiente' && reserva.estadoPago !== 'pagado')) {
        return false;
      }
      
      // Validar que tenga horas válidas
      if (!reserva.horaInicio || !reserva.horaFin) {
        return false;
      }
      
      const reservaStartMinutes = timeToMinutes(reserva.horaInicio);
      const reservaEndMinutes = timeToMinutes(reserva.horaFin);
      
      return (
        (startMinutes >= reservaStartMinutes && startMinutes < reservaEndMinutes) ||
        (endMinutes > reservaStartMinutes && endMinutes <= reservaEndMinutes) ||
        (startMinutes <= reservaStartMinutes && endMinutes >= reservaEndMinutes)
      );
    });
    
    // Verificar si está ocupado por eventos activos
    const estaOcupadoPorEvento = eventos.some(evento => {
      if (!evento.activo || !evento.horaInicio || !evento.horaFin) {
        return false;
      }
      
      const eventoStartMinutes = timeToMinutes(evento.horaInicio);
      const eventoEndMinutes = timeToMinutes(evento.horaFin);
      
      return (
        (startMinutes >= eventoStartMinutes && startMinutes < eventoEndMinutes) ||
        (endMinutes > eventoStartMinutes && endMinutes <= eventoEndMinutes) ||
        (startMinutes <= eventoStartMinutes && endMinutes >= eventoEndMinutes)
      );
    });
    
    return !estaOcupadoPorReserva && !estaOcupadoPorEvento;
  };

  const HALF_DAY_HOURS = 12;

  const formatHourLabel = time => {
    if (!time) {
      return '';
    }
    if (time === '00:00') {
      return `${HALF_DAY_HOURS}am`;
    }
    const [hourStr] = time.split(':');
    let hour = Number.parseInt(hourStr, 10);
    const suffix = hour >= HALF_DAY_HOURS ? 'pm' : 'am';
    
    if (hour === 0 || !hour) {
      hour = HALF_DAY_HOURS;
    } else if (hour > HALF_DAY_HOURS) {
      hour -= HALF_DAY_HOURS;
    }
    
    return `${hour}${suffix}`;
  };

  const normalizeEndTime = endTime => (endTime === '00:00' ? '23:59' : endTime);

  const buildMorningBlock = (manana, isAllDay) => {
    const morningRange = isAllDay
      ? `${formatHourLabel(manana.inicio)} - 12am`
      : `${formatHourLabel(manana.inicio)} - ${formatHourLabel(manana.fin)}`;
    const endTime = normalizeEndTime(manana.fin);
    const morningAvailable = isTimeSlotAvailable(manana.inicio, endTime);

    return {
      timeRange: morningRange,
      price: manana.precio,
      label: isAllDay ? 'Tarifa diaria' : 'Horario día',
      available: morningAvailable,
      startTime: manana.inicio,
      endTime
    };
  };

  const buildEveningBlock = noche => {
    const endTime = normalizeEndTime(noche.fin);
    const eveningAvailable = isTimeSlotAvailable(noche.inicio, endTime);

    return {
      timeRange: `${formatHourLabel(noche.inicio)} - ${formatHourLabel(noche.fin)}`,
      price: noche.precio,
      label: 'Horario noche',
      available: eveningAvailable,
      startTime: noche.inicio,
      endTime
    };
  };

  // Obtener hora actual en zona horaria de Lima
  const getCurrentLimaTime = () => {
    const now = new Date();
    const limaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    
    const year = limaDate.getFullYear();
    const month = String(limaDate.getMonth() + 1).padStart(2, '0');
    const day = String(limaDate.getDate()).padStart(2, '0');
    const hour = limaDate.getHours();
    const minute = limaDate.getMinutes();
    
    return {
      date: `${year}-${month}-${day}`,
      hour: hour,
      minute: minute
    };
  };

  // Obtener precio para una hora específica
  const getPriceForHour = (hour, cancha) => {
    if (!cancha) return 0;
    
    const weeklyKey = dayToWeeklyPricingKey[selectedDay];
    const basePrecios = cancha?.preciosSemanales?.[weeklyKey] || cancha?.precios;
    const manana = basePrecios?.manana;
    const noche = basePrecios?.noche;
    
    if (!manana) return 0;
    
    // Determinar si es horario de mañana o noche
    const mananaStart = parseInt(manana.inicio.split(':')[0], 10);
    const mananaEnd = manana.fin === '00:00' ? 24 : parseInt(manana.fin.split(':')[0], 10);
    
    if (hour >= mananaStart && hour < mananaEnd) {
      return manana.precio;
    } else if (noche) {
      const nocheStart = parseInt(noche.inicio.split(':')[0], 10);
      const nocheEnd = noche.fin === '00:00' ? 24 : parseInt(noche.fin.split(':')[0], 10);
      if (hour >= nocheStart || hour < nocheEnd) {
        return noche.precio;
      }
    }
    
    return manana.precio; // Default
  };

  // Construir bloques de las próximas 3 horas disponibles
  const buildScheduleBlocks = cancha => {
    if (!cancha) {
      return [];
    }
    
    const weeklyKey = dayToWeeklyPricingKey[selectedDay];
    const basePrecios = cancha?.preciosSemanales?.[weeklyKey] || cancha?.precios;
    const manana = basePrecios?.manana;
    if (!manana) {
      return [];
    }
    
    const limaTime = getCurrentLimaTime();
    const selectedDate = getDateForDay(selectedDay);
    const isToday = selectedDate === limaTime.date;
    
    const blocks = [];
    let startHour;
    
    if (isToday) {
      // Si es hoy, empezar desde la próxima hora (redondeando hacia arriba)
      startHour = limaTime.minute > 0 ? limaTime.hour + 1 : limaTime.hour + 1;
      // Asegurar que sea al menos la próxima hora completa
      if (startHour <= limaTime.hour) {
        startHour = limaTime.hour + 1;
      }
      // Limitar a máximo 23 horas
      if (startHour >= 24) {
        return []; // No hay horas disponibles hoy
      }
    } else {
      // Si es día futuro, empezar desde las 5 AM o la primera hora disponible
      const mananaStart = parseInt(manana.inicio.split(':')[0], 10);
      startHour = Math.max(5, mananaStart);
    }
    
    // Buscar las próximas 3 horas DISPONIBLES (saltándose las ocupadas)
    let hour = startHour;
    let foundCount = 0;
    const maxHours = 24; // Límite máximo de horas a revisar
    
    while (foundCount < 3 && hour < maxHours) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = hour === 23 ? '23:59' : `${String(hour + 1).padStart(2, '0')}:00`;
      
      const available = isTimeSlotAvailable(startTime, endTime);
      
      // Solo agregar si está disponible
      if (available) {
        const price = getPriceForHour(hour, cancha);
        
        blocks.push({
          timeRange: `${formatHourLabel(startTime)} - ${formatHourLabel(endTime)}`,
          price: price,
          label: `Hora ${formatHourLabel(startTime)}`,
          available: true,
          startTime: startTime,
          endTime: endTime
        });
        
        foundCount++;
      }
      
      hour++;
    }
    
    return blocks;
  };

  const handleCanchaChange = keys => {
    const selectedId = Array.from(keys)[0];
    setSelectedCanchaId(selectedId || '');
  };

  const handleDayChange = day => {
    setSelectedDay(day);
  };

  const loadFeaturedEventos = async () => {
    try {
      setLoadingEventos(true);
      const [eventosData, canchasData] = await Promise.all([
        eventoRepository.getAll(),
        canchaRepository.getAll()
      ]);
      
      // Filtrar eventos activos y futuros
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const eventosActivos = eventosData
        .filter(evento => {
          if (!evento.activo) return false;
          const eventoFecha = new Date(evento.fecha);
          eventoFecha.setHours(0, 0, 0, 0);
          return eventoFecha >= today;
        })
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.horaInicio}`);
          const fechaB = new Date(`${b.fecha}T${b.horaInicio}`);
          return fechaA - fechaB;
        })
        .slice(0, 6); // Limitar a 6 eventos más recientes
      
      // Enriquecer eventos con datos de cancha
      const eventosEnriquecidos = eventosActivos.map((evento) => {
        const cancha = canchasData.find(c => c.id === evento.idCancha);
        // Usar imagen del evento si existe, sino usar imagen de la cancha
        const eventoImagen = evento.imagen || cancha?.imagenPrincipal || cancha?.imagen || '/images/futbol1.jpg';
        return {
          ...evento,
          canchaName: cancha?.nombre || cancha?.name || 'Cancha no encontrada',
          canchaImage: cancha?.imagenPrincipal || cancha?.imagen || '/images/futbol1.jpg',
          eventoImagen: eventoImagen
        };
      });
      
      setFeaturedEventos(eventosEnriquecidos);
    } catch (error) {
      console.info('Error loading featured eventos:', error.message);
      setFeaturedEventos([]);
    } finally {
      setLoadingEventos(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const selectedCancha = canchas.find(c => c.id === selectedCanchaId);
  const scheduleBlocks = selectedCancha ? buildScheduleBlocks(selectedCancha) : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="min-h-[80vh] flex items-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://wallpapercave.com/wp/wp8255680.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
        <div className="relative z-10 w-full mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
            <div className="lg:col-span-8">
              <div className="text-white">
                <div className="flex items-center mb-4">
                  <span className="mr-3">Síguenos</span>
                  <div className="flex gap-2">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none">
                      <FaInstagram size={20} />
                    </a>
                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none">
                      <FaTiktok size={20} />
                    </a>
                  </div>
                </div>
                
                <motion.h1
                  initial={{opacity: 0, y: 16}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.4, ease: 'easeOut'}}
                  className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
                >
                  Reserva tu{' '}
                  <span className="relative inline-block group">
                    <span className="italic text-emerald-400 transition-all duration-300 group-hover:text-emerald-300 group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                      Canchita
                    </span>
                    <span className="absolute -bottom-1 left-0 w-0 h-1 bg-emerald-400 rounded-full transition-all duration-500 group-hover:w-full" />
                  </span>
                  <br className="hidden md:block" />
                  En Solo{' '}
                  <span className="italic text-white">
                    Un Minuto
                  </span>
                </motion.h1>
                
                <p className="text-lg md:text-xl mb-4 opacity-90">
                  Encuentra y reserva las mejores canchas deportivas en tu zona.
                  Sistema simple y eficiente para gestionar tus reservas deportivas.
                </p>
                
                <motion.div className="flex gap-3" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}}>
                  <Link to="/reserva">
                    <Button color="success" size="lg" className="rounded-full px-8">Reservar Ahora</Button>
                  </Link>
                  <Link to="/about">
                    <Button variant="bordered" size="lg" className="rounded-full px-8 text-white border-white/70 hover:border-white hover:bg-white/10">Leer Más</Button>
                  </Link>
                </motion.div>
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <motion.div 
                initial={{opacity: 0, scale: 0.98}} 
                animate={{opacity: 1, scale: 1}} 
                transition={{duration: 0.35}}
                className="flex flex-col relative overflow-hidden h-auto text-foreground bg-white/95 backdrop-blur-xl
                shadow-2xl p-6 rounded-3xl border border-white/50 transition-all duration-300"
                style={{boxSizing: 'border-box', maxHeight: '600px'}} 
                tabIndex={-1}
              >
                {loadingCanchas ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner color="success" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h5 className="mb-3 font-semibold">Reservas del día</h5>
                      
                      {selectedCancha && (
                        <div className="mb-3 relative rounded-lg overflow-hidden">
                          <img 
                            src={selectedCancha.imagenPrincipal || selectedCancha.imagen || '/images/futbol1.jpg'}
                            alt={selectedCancha.nombre || selectedCancha.name || 'Cancha'}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <h6 className="font-semibold text-sm mb-1">{selectedCancha.nombre || selectedCancha.name || 'Cancha'}</h6>
                            {(() => {
                              const weeklyKey = dayToWeeklyPricingKey[selectedDay];
                              const basePrecios = selectedCancha?.preciosSemanales?.[weeklyKey] || selectedCancha?.precios;
                              const manana = basePrecios?.manana;
                              const noche = basePrecios?.noche;
                              
                              if (!manana) return null;
                              
                              if (manana.fin === '00:00' || !noche || noche.precio === manana.precio) {
                                return (
                                  <div className="text-xs opacity-90">
                                    Desde S/ {manana.precio}
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="text-xs opacity-90 flex gap-2">
                                  <span>Día: S/ {manana.precio}</span>
                                  <span>Noche: S/ {noche.precio}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <Select
                          label="Seleccionar Cancha"
                          selectedKeys={selectedCanchaId ? [selectedCanchaId] : []}
                          onSelectionChange={handleCanchaChange}
                          size="sm"
                          className="w-full"
                          placeholder={canchas.length === 0 ? "No hay canchas disponibles" : "Selecciona una cancha"}
                          isDisabled={canchas.length === 0}
                        >
                          {canchas.map(cancha => (
                            <SelectItem key={cancha.id} value={cancha.id} textValue={cancha.nombre}>
                              {cancha.nombre}
                            </SelectItem>
                          ))}
                        </Select>
                        {canchas.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            No se encontraron canchas. Verifica la conexión a la base de datos.
                          </p>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-2">Próximos días disponibles</div>
                        <div className="flex flex-wrap gap-2">
                          {next3Days.map((dayInfo, index) => {
                            const isToday = index === 0;
                            const displayName = isToday ? `${dayInfo.name} (Hoy)` : dayInfo.name;
                            return (
                              <button
                                key={`day-${dayInfo.name}-${dayInfo.date}`}
                                type="button"
                                onClick={() => handleDayChange(dayInfo.name)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                  selectedDay === dayInfo.name ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                aria-pressed={selectedDay === dayInfo.name}
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                        {selectedCanchaId && (
                          <p className="text-xs text-gray-500 mt-2">
                            Fecha: {getDateForDay(selectedDay)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div 
                      className="max-h-[280px] overflow-y-auto pr-2"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}
                    >
                    {loadingReservas && (
                      <div className="flex items-center justify-center py-4">
                        <Spinner size="sm" color="success" />
                      </div>
                    )}
                    {!loadingReservas && scheduleBlocks.length > 0 && (
                        <div className="space-y-2">
                          {scheduleBlocks.map(block => (
                        <div 
                          key={block.timeRange} 
                              className="flex items-center justify-between p-2 rounded-lg transition-all bg-gray-50 hover:bg-gray-100"
                        >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FaClock size={14} className="text-gray-600 flex-shrink-0" />
                                <span className="font-medium text-sm whitespace-nowrap">{block.label}</span>
                            <Chip 
                              color="success" 
                              size="sm"
                                  className="text-xs"
                            >
                              {block.timeRange}
                            </Chip>
                          </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                              <Link to={`/reserva/${selectedCanchaId}`}>
                                    <Button 
                                      color="success" 
                                      size="sm" 
                                      className="flex items-center gap-1 rounded-full px-3 text-xs h-7 min-w-fit text-white [&>span]:text-white"
                                    >
                                      <FaCheckCircle size={12} />
                                      <span className="hidden sm:inline">Reservar</span>
                                </Button>
                              </Link>
                          </div>
                        </div>
                          ))}
                        </div>
                    )}
                    {!loadingReservas && scheduleBlocks.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                        {selectedCanchaId ? 'No hay horarios disponibles' : 'Selecciona una cancha para ver horarios'}
                      </div>
                    )}
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Eventos Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center mb-10" initial={{opacity: 0, y: 12}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.35}}>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Próximos Eventos</h2>
            <p className="text-lg text-gray-600">No te pierdas nuestros eventos deportivos especiales</p>
          </motion.div>
          {loadingEventos ? (
            <div className="flex justify-center py-10">
              <Spinner color="success" size="lg" />
            </div>
          ) : featuredEventos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEventos.map((evento, idx) => (
                <motion.div 
                  key={evento.id || `evento-${idx}`}
                  initial={{opacity: 0, y: 20}} 
                  whileInView={{opacity: 1, y: 0}} 
                  viewport={{once: true}} 
                  transition={{duration: 0.35, delay: idx * 0.1}}
                  whileHover={{scale: 1.02, y: -4}}
                >
                  <Card className="h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="overflow-hidden">
                      <img 
                        src={evento.eventoImagen || evento.imagen || evento.canchaImage || '/images/futbol1.jpg'} 
                        alt={evento.nombre || 'Evento'} 
                        className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-2">{evento.nombre || 'Evento'}</h3>
                      {evento.descripcion && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {evento.descripcion}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendarCheck size={14} />
                          <span>{formatDate(evento.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaClock size={14} />
                          <span>{formatTime(evento.horaInicio)} - {formatTime(evento.horaFin)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Cancha:</span> {evento.canchaName}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No hay eventos destacados disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

  <Steps />
  <Laptop />
  <TrustedBy />

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ¡Obtén lo Mejor! Reserva Tu Cancha Hoy y Disfruta del Juego!
              </h2>
              <p className="text-lg mb-4 opacity-90">
                Únete a miles de jugadores que ya disfrutan de nuestras instalaciones de primera clase.
              </p>
              <Link to="/reserva">
                <Button color="success" size="lg" className="rounded-full px-8">Reservar Una Cancha</Button>
              </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Todo para jugar mejor</h2>
            <p className="text-lg text-gray-600">Instalaciones modernas, procesos simples y soporte cuando lo necesites.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.35}}
              whileHover={{y: -8}}
            >
              <Card className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                <h3 className="text-xl font-semibold mb-2">Reserva inmediata</h3>
                <p className="text-gray-600">Agenda en minutos y recibe confirmación al instante. Sin llamadas, sin fricción.</p>
              </Card>
            </motion.div>
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.4}}
              whileHover={{y: -8}}
            >
              <Card className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                <h3 className="text-xl font-semibold mb-2">Canchas en óptimas condiciones</h3>
                <p className="text-gray-600">Superficie cuidada, iluminación adecuada y equipamiento disponible bajo solicitud.</p>
              </Card>
            </motion.div>
            <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.45}}
              whileHover={{y: -8}}
            >
              <Card className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                <h3 className="text-xl font-semibold mb-2">Pagos seguros</h3>
                <p className="text-gray-600">Procesamiento con cifrado y comprobante automático para cada reserva.</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Lo que dicen nuestros jugadores</h2>
            <p className="text-lg text-gray-600">Experiencias reales de equipos y amigos que ya reservaron.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "Excelente atención y canchas impecables.", 
              "Proceso rápido, llegamos y ya estaba listo.",
              "La iluminación nocturna es perfecta para after office."
            ].map((quote, idx) => (
              <motion.div
                key={`testimonial-${idx}-${quote.substring(0, 10)}`}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.35, delay: idx * 0.1}}
                whileHover={{y: -8}}
              >
                <Card className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                  <p className="text-gray-700 text-lg leading-relaxed">"{quote}"</p>
                  <div className="mt-4 text-sm text-gray-500 font-medium">Jugador verificado</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Preguntas frecuentes</h2>
            <p className="text-lg text-gray-600">Información clave antes de reservar.</p>
          </div>
          <div className="space-y-4">
            {[
              {q: '¿Puedo reprogramar mi reserva?', a: 'Sí, puedes reprogramar con 12 h de anticipación desde tu perfil.'},
              {q: '¿Qué métodos de pago aceptan?', a: 'Tarjeta y transferencias. El comprobante llega por correo.'},
              {q: '¿Se permiten reservas grupales?', a: 'Claro, puedes añadir jugadores y dividir el pago si lo necesitas.'}
            ].map(item => (
              <details key={item.q} className="group rounded-2xl border border-gray-200 p-4 hover:border-gray-300">
                <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                  {item.q}
                  <span className="transition-transform group-open:rotate-45 text-gray-400">+</span>
                </summary>
                <p className="mt-2 text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;