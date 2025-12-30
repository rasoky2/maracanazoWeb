import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Chip, Spinner, Select, SelectItem } from '@heroui/react';
import { motion } from 'framer-motion';
import Steps from '../components/Home/Steps';
import Laptop from '../components/Home/Laptop';
import TrustedBy from '../components/Home/TrustedBy';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { HomeContentRepository } from '../repositories/HomeContent.repository.js';
import { 
  FaClock, 
  FaCheckCircle,
  FaInstagram,
  FaTiktok,
  FaStar
} from 'react-icons/fa';

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
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [reservas, setReservas] = useState([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [featuredDiscounts, setFeaturedDiscounts] = useState([]);
  const [discountsSectionInfo, setDiscountsSectionInfo] = useState({
    title: 'Descuentos Increíbles Disponibles Esta Semana!',
    subtitle: 'No te pierdas nuestras ofertas especiales en reservas de canchas.'
  });
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const canchaRepository = new CanchaRepository();
  const reservaRepository = new ReservaRepository();
  const homeContentRepository = new HomeContentRepository();

  useEffect(() => {
    loadCanchas();
    loadFeaturedDiscounts();
  }, []);

  useEffect(() => {
    if (selectedCanchaId && selectedDay) {
      loadReservas();
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
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = dayMap[dayName];
    let daysUntilTarget = targetDay - currentDay;
    
    if (daysUntilTarget <= 0) {
      daysUntilTarget += DAYS_IN_WEEK;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate.toISOString().split('T')[0];
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

  const timeToMinutes = time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeSlotAvailable = (startTime, endTime) => {
    if (reservas.length === 0) {
      return true;
    }
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    return !reservas.some(reserva => {
      const reservaStartMinutes = timeToMinutes(reserva.horaInicio);
      const reservaEndMinutes = timeToMinutes(reserva.horaFin);
      
      return (
        (startMinutes >= reservaStartMinutes && startMinutes < reservaEndMinutes) ||
        (endMinutes > reservaStartMinutes && endMinutes <= reservaEndMinutes) ||
        (startMinutes <= reservaStartMinutes && endMinutes >= reservaEndMinutes)
      );
    });
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
    
    const noche = basePrecios?.noche;
    const isAllDay = manana.fin === '00:00' || !noche || noche.precio === manana.precio;
    const blocks = [buildMorningBlock(manana, isAllDay)];

    if (!isAllDay && noche) {
      blocks.push(buildEveningBlock(noche));
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

  const loadFeaturedDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const [discounts, sectionInfo] = await Promise.all([
        homeContentRepository.getFeaturedDiscounts(),
        homeContentRepository.getDiscountsSectionInfo()
      ]);
      setFeaturedDiscounts(discounts);
      setDiscountsSectionInfo(sectionInfo);
    } catch (error) {
      console.info('Error loading featured discounts:', error.message);
      setFeaturedDiscounts([]);
    } finally {
      setLoadingDiscounts(false);
    }
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
                        <div className="text-sm text-gray-600 mb-2">Día de la semana</div>
                        <div className="flex flex-wrap gap-2">
                          {days.map(day => (
                            <button
                              key={`day-${day}`}
                              type="button"
                              onClick={() => handleDayChange(day)}
                              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                selectedDay === day ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                              aria-pressed={selectedDay === day}
                            >
                              {day}
                            </button>
                          ))}
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
                              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                                block.available ? 'bg-gray-50 hover:bg-gray-100' : 'bg-red-50 opacity-75'
                          }`}
                        >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FaClock size={14} className={block.available ? 'text-gray-600 flex-shrink-0' : 'text-red-500 flex-shrink-0'} />
                                <span className="font-medium text-sm whitespace-nowrap">{block.label}</span>
                            <Chip 
                              color={block.available ? 'success' : 'danger'} 
                              size="sm"
                                  className="text-xs"
                            >
                              {block.timeRange}
                            </Chip>
                            {!block.available && (
                                  <Chip color="danger" size="sm" variant="flat" className="text-xs">Ocupado</Chip>
                            )}
                          </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-semibold text-success text-sm whitespace-nowrap">S/ {block.price}<span className="text-xs text-gray-500">/h</span></span>
                            {block.available ? (
                              <Link to={`/reserva/${selectedCanchaId}`}>
                                    <Button color="success" size="sm" className="flex items-center gap-1 rounded-full px-3 text-xs h-7 min-w-fit">
                                      <FaCheckCircle size={12} />
                                      <span className="hidden sm:inline">Reservar</span>
                                </Button>
                              </Link>
                            ) : (
                              <Button 
                                color="default" 
                                size="sm" 
                                    className="flex items-center gap-1 rounded-full px-3 text-xs h-7 min-w-fit"
                                isDisabled
                              >
                                No disponible
                              </Button>
                            )}
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

      {/* Discounts Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div className="text-center mb-10" initial={{opacity: 0, y: 12}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{duration: 0.35}}>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{discountsSectionInfo.title}</h2>
            <p className="text-lg text-gray-600">{discountsSectionInfo.subtitle}</p>
          </motion.div>
          {loadingDiscounts ? (
            <div className="flex justify-center py-10">
              <Spinner color="success" size="lg" />
            </div>
          ) : featuredDiscounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredDiscounts.map((discount, idx) => (
                <motion.div 
                  key={discount.id || `discount-${idx}`}
                  initial={{opacity: 0, y: 20}} 
                  whileInView={{opacity: 1, y: 0}} 
                  viewport={{once: true}} 
                  transition={{duration: 0.35, delay: idx * 0.1}}
                  whileHover={{scale: 1.02, y: -4}}
                >
                  <Card className="h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <div className="overflow-hidden">
                      <img 
                        src={discount.imagen || discount.image || '/images/futbol1.jpg'} 
                        alt={discount.titulo || discount.title || 'Cancha'} 
                        className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl">{discount.titulo || discount.title || 'Cancha'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Tiempo: {discount.horario || discount.time || '07:00 - 17:00'}
                      </p>
                      <div className="flex items-center justify-between mb-3 mt-3">
                        <span className="text-2xl font-bold text-success">
                          S/ {discount.precio || discount.price || '0.00'}
                        </span>
                        {discount.rating && (
                          <span className="text-gray-500 text-sm flex items-center gap-1">
                            <FaStar className="text-yellow-400" /> {discount.rating} {discount.reviews && `| ${discount.reviews}+ reseñas`}
                          </span>
                        )}
                      </div>
                      <Link to={discount.link || discount.canchaId ? `/reserva/${discount.canchaId}` : '/canchas'}>
                        <Button color="success" className="w-full rounded-full group-hover:scale-105 transition-transform">
                          {discount.botonTexto || discount.buttonText || 'Reservar Ahora'}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No hay descuentos destacados disponibles en este momento.</p>
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