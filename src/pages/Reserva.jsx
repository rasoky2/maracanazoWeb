import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button as HButton, Input, Textarea, Select, SelectItem, Chip, Spinner } from '@heroui/react';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { DiscountService } from '../services/Discount.service.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config.js';

const Reserva = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [cancha, setCancha] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservationData, setReservationData] = useState({
    date: '',
    duration: '2',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingCancha, setLoadingCancha] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState(null);
  const [validandoDescuento, setValidandoDescuento] = useState(false);
  const [errorDescuento, setErrorDescuento] = useState('');
  const canchaRepository = new CanchaRepository();
  const reservaRepository = new ReservaRepository();
  const discountService = new DiscountService();

  useEffect(() => {
    loadCancha();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setReservationData(prev => ({
      ...prev,
      date: tomorrowStr
    }));
  }, [id]);

  useEffect(() => {
    if (cancha && reservationData.date) {
      loadHorarios();
    }
  }, [cancha, reservationData.date]);

  const loadCancha = async () => {
    try {
      setLoadingCancha(true);
      const canchaData = await canchaRepository.getById(id);
      if (!canchaData) {
        setError('Cancha no encontrada');
        return;
      }
      setCancha(canchaData);
      generateTimeSlots(canchaData);
    } catch (err) {
      console.info('Error loading cancha:', err.message);
      setError('Error al cargar la cancha');
    } finally {
      setLoadingCancha(false);
    }
  };

  const loadHorarios = async () => {
    if (!cancha || !reservationData.date) return;
    
    try {
      setLoadingHorarios(true);
      
      // Cargar horarios desde Firebase
      const horarioDocRef = doc(db, 'horarios', `${cancha.id}_${reservationData.date}`);
      const horarioDoc = await getDoc(horarioDocRef);
      
      // Cargar reservas existentes para esa fecha
      const reservasExistentes = await reservaRepository.getByCanchaAndDate(cancha.id, reservationData.date);
      
      let slots = [];
      
      if (horarioDoc.exists()) {
        // Usar horarios de Firebase
        const horariosData = horarioDoc.data();
        const horarios = horariosData.horarios || [];
        
        slots = horarios.map(horario => {
          // Verificar si está ocupado
          const estaOcupado = reservasExistentes.some(reserva => {
            const reservaInicio = timeToMinutes(reserva.horaInicio);
            const reservaFin = timeToMinutes(reserva.horaFin);
            const horarioInicio = timeToMinutes(horario.hora);
            const horarioFin = timeToMinutes(horario.horaFin);
            
            return (
              (horarioInicio >= reservaInicio && horarioInicio < reservaFin) ||
              (horarioFin > reservaInicio && horarioFin <= reservaFin) ||
              (horarioInicio <= reservaInicio && horarioFin >= reservaFin)
            );
          });
          
          return {
            time: horario.hora,
            price: horario.precio,
            available: horario.disponible && !estaOcupado
          };
        });
      } else {
        // Generar horarios por defecto si no existen en Firebase
        const startHour = 7;
        const endHour = 24;
        
        for (let hour = startHour; hour < endHour; hour++) {
          const time = `${hour.toString().padStart(2, '0')}:00`;
          const price = cancha.getPriceByTime ? cancha.getPriceByTime(time) : cancha.precio || 0;
          
          // Verificar si está ocupado
          const estaOcupado = reservasExistentes.some(reserva => {
            const reservaInicio = timeToMinutes(reserva.horaInicio);
            const reservaFin = timeToMinutes(reserva.horaFin);
            const horarioInicio = timeToMinutes(time);
            const horarioFin = timeToMinutes(`${(hour + 1).toString().padStart(2, '0')}:00`);
            
            return (
              (horarioInicio >= reservaInicio && horarioInicio < reservaFin) ||
              (horarioFin > reservaInicio && horarioFin <= reservaFin) ||
              (horarioInicio <= reservaInicio && horarioFin >= reservaFin)
            );
          });
          
          slots.push({
            time,
            price,
            available: !estaOcupado
          });
        }
      }
      
      setTimeSlots(slots);
    } catch (err) {
      console.info('Error loading horarios:', err.message);
      // Fallback: generar horarios básicos
      generateTimeSlots(cancha);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const generateTimeSlots = (canchaData) => {
    const slots = [];
    const startHour = 7;
    const endHour = 24;
    
    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const price = canchaData.getPriceByTime ? canchaData.getPriceByTime(time) : canchaData.precio || 0;
      slots.push({
        time,
        price,
        available: true
      });
    }
    
    setTimeSlots(slots);
  };

  const handleSlotSelect = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    setReservationData({
      ...reservationData,
      [e.target.name]: e.target.value
    });
  };

  const calculateSubtotal = () => {
    if (!selectedSlot) return 0;
    return selectedSlot.price * parseInt(reservationData.duration);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (descuentoAplicado && descuentoAplicado.calculo && descuentoAplicado.calculo.aplicado) {
      return descuentoAplicado.calculo.montoFinal;
    }
    return subtotal;
  };

  const handleAplicarDescuento = async () => {
    if (!codigoDescuento.trim()) {
      setErrorDescuento('Ingresa un código promocional');
      return;
    }

    if (!selectedSlot || !cancha || !reservationData.date) {
      setErrorDescuento('Completa primero la fecha y horario');
      return;
    }

    setValidandoDescuento(true);
    setErrorDescuento('');

    try {
      const subtotal = calculateSubtotal();
      const fecha = new Date(reservationData.date);
      const validacion = await discountService.validarCodigo(
        codigoDescuento,
        subtotal,
        cancha.id,
        cancha.tipo,
        fecha,
        selectedSlot.time
      );

      if (validacion.valido) {
        setDescuentoAplicado(validacion);
        setErrorDescuento('');
      } else {
        setDescuentoAplicado(null);
        setErrorDescuento(validacion.error || 'Código no válido');
      }
    } catch (err) {
      console.info('Error validating discount:', err);
      setErrorDescuento('Error al validar el código');
      setDescuentoAplicado(null);
    } finally {
      setValidandoDescuento(false);
    }
  };

  const handleRemoverDescuento = () => {
    setDescuentoAplicado(null);
    setCodigoDescuento('');
    setErrorDescuento('');
  };

  const handleReservation = async () => {
    // Verificar si el usuario está autenticado antes de continuar
    if (!user) {
      setError('Debes iniciar sesión para realizar una reserva');
      navigate('/login', { state: { from: `/reserva/${id}` } });
      return;
    }

    if (!selectedSlot || !reservationData.date || !cancha) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const subtotal = calculateSubtotal();
      let descuentoData = null;

      if (descuentoAplicado && descuentoAplicado.calculo && descuentoAplicado.calculo.aplicado) {
        const aplicacion = await discountService.aplicarDescuento(
          codigoDescuento,
          subtotal,
          cancha.id,
          cancha.tipo,
          new Date(reservationData.date),
          selectedSlot.time
        );

        if (aplicacion.valido) {
          descuentoData = {
            codigo: aplicacion.descuento.codigo,
            valor: aplicacion.descuento.valor,
            tipo: aplicacion.descuento.tipo,
            monto: aplicacion.calculo.descuento
          };
        }
      }

      const reservation = {
        idUsuario: user.id || user.uid,
        idCancha: cancha.id,
        fecha: reservationData.date,
        horaInicio: selectedSlot.time,
        horaFin: calculateEndTime(selectedSlot.time, parseInt(reservationData.duration)),
        precioTotal: calculateTotal(),
        estado: 'pendiente',
        estadoPago: 'pendiente',
        notas: reservationData.notes,
        descuentoAplicado: descuentoData,
        precioConDescuento: descuentoData ? calculateTotal() : subtotal
      };

      const newReserva = await reservaRepository.create(reservation);
      navigate('/payment', { state: { reservation: { ...newReserva, ...reservation } } });
    } catch (err) {
      console.info('Error creating reservation:', err.message);
      setError('Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + duration) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  if (loadingCancha) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <Spinner color="success" />
          <span>Cargando cancha...</span>
        </div>
      </div>
    );
  }

  if (!cancha) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cancha no encontrada</h2>
          <p className="text-gray-600 mb-4">La cancha que buscas no existe o no está disponible</p>
          <HButton color="primary" onPress={() => navigate('/canchas')}>
            Volver a Canchas
          </HButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Reservar {cancha.nombre}</h1>
          <p className="text-lg text-gray-600">Selecciona tu horario preferido y completa los datos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="p-0">
              <div className="border-b px-4 py-3">
                <h3 className="m-0 text-lg font-semibold">Horarios Disponibles</h3>
              </div>
              <div className="p-4">
                {loadingHorarios ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner color="success" />
                    <span className="ml-3">Cargando horarios...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {timeSlots.map((slot, index) => (
                    <Card
                      key={index}
                      className={`p-4 text-center cursor-pointer transition-all ${
                        !slot.available ? 'border-red-300 bg-red-50 opacity-50' : 
                        selectedSlot?.time === slot.time ? 'border-green-500 bg-green-50 ring-2 ring-green-300' : 
                        'hover:border-green-300 hover:bg-green-50'
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <h5 className="font-semibold mb-2">{slot.time}</h5>
                      <Chip color={slot.available ? 'success' : 'danger'} size="sm" className="mb-2">
                        {slot.available ? 'Disponible' : 'Ocupado'}
                      </Chip>
                      <p className="text-lg font-bold text-success m-0">S/ {slot.price}</p>
                    </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-4">
              <div className="border-b px-4 py-3">
                <h3 className="m-0 text-lg font-semibold">Detalles de la Reserva</h3>
              </div>
              <div className="p-4">
                {selectedSlot && (
                  <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    <div className="font-semibold">Horario Seleccionado</div>
                    <p className="mb-0"><strong>Hora:</strong> {selectedSlot.time}</p>
                    <p className="mb-0"><strong>Precio por hora:</strong> S/ {selectedSlot.price}</p>
                  </div>
                )}

                <form className="space-y-4">
                  <Input
                    type="date"
                    name="date"
                    label="Fecha de Reserva"
                    value={reservationData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    isRequired
                  />

                  <Select
                    label="Duración (horas)"
                    name="duration"
                    selectedKeys={[String(reservationData.duration)]}
                    onChange={handleInputChange}
                  >
                    <SelectItem key="1" value="1">1 hora</SelectItem>
                    <SelectItem key="2" value="2">2 horas</SelectItem>
                    <SelectItem key="3" value="3">3 horas</SelectItem>
                    <SelectItem key="4" value="4">4 horas</SelectItem>
                  </Select>

                  <Textarea
                    name="notes"
                    label="Notas Adicionales"
                    value={reservationData.notes}
                    onChange={handleInputChange}
                    placeholder="Comentarios especiales, equipos adicionales, etc."
                    minRows={3}
                  />

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código Promocional
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Ingresa código"
                          value={codigoDescuento}
                          onChange={(e) => {
                            setCodigoDescuento(e.target.value.toUpperCase());
                            setErrorDescuento('');
                            if (descuentoAplicado) {
                              setDescuentoAplicado(null);
                            }
                          }}
                          isDisabled={validandoDescuento || !selectedSlot}
                          className="flex-1"
                        />
                        {descuentoAplicado ? (
                          <HButton
                            color="danger"
                            variant="flat"
                            size="lg"
                            onPress={handleRemoverDescuento}
                          >
                            Remover
                          </HButton>
                        ) : (
                          <HButton
                            color="success"
                            size="lg"
                            onPress={handleAplicarDescuento}
                            isDisabled={validandoDescuento || !selectedSlot}
                            isLoading={validandoDescuento}
                          >
                            Aplicar
                          </HButton>
                        )}
                      </div>
                      {errorDescuento && (
                        <p className="text-sm text-red-600 mt-1">{errorDescuento}</p>
                      )}
                      {descuentoAplicado && (
                        <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                          <div className="font-semibold">{descuentoAplicado.mensaje}</div>
                          <div className="text-xs mt-1">
                            Descuento: S/ {descuentoAplicado.calculo.descuento}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedSlot && (
                      <Card className="bg-gray-50">
                        <div className="p-4">
                          <h6 className="font-semibold mb-3">Resumen de Costo</h6>
                          <div className="flex justify-between mb-2">
                            <span>Precio por hora:</span>
                            <span>S/ {selectedSlot.price}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>Duración:</span>
                            <span>{reservationData.duration} horas</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>Subtotal:</span>
                            <span>S/ {calculateSubtotal()}</span>
                          </div>
                          {descuentoAplicado && descuentoAplicado.calculo && descuentoAplicado.calculo.aplicado && (
                            <>
                              <div className="flex justify-between mb-2 text-green-600">
                                <span>Descuento ({descuentoAplicado.descuento.codigo}):</span>
                                <span>- S/ {descuentoAplicado.calculo.descuento}</span>
                              </div>
                              <hr className="my-2" />
                            </>
                          )}
                          <div className="flex justify-between font-semibold text-xl text-success">
                            <span>Total:</span>
                            <span>S/ {calculateTotal()}</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                  )}

                  <HButton
                    color="success"
                    size="lg"
                    className="w-full"
                    onPress={handleReservation}
                    isDisabled={!selectedSlot || loading}
                    isLoading={loading}
                  >
                    {loading ? 'Procesando...' : 'Continuar al Pago'}
                  </HButton>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reserva;