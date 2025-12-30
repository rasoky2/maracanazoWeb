import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Textarea, Spinner } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { EventoRepository } from '../repositories/Evento.repository.js';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const reservaRepository = new ReservaRepository();
  const eventoRepository = new EventoRepository();
  const [reservation, setReservation] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    // Esperar a que termine la carga de autenticación antes de verificar
    if (authLoading) {
      return;
    }

    // Si no hay usuario después de cargar, redirigir al login
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // Si hay reserva en el estado, configurarla
    if (location.state?.reservation) {
      setReservation(location.state.reservation);
      setPaymentData(prev => ({
        ...prev,
        email: user.email || '',
        phone: user.telefono || user.phone || ''
      }));
    } else {
      // Si no hay reserva, redirigir a canchas
      navigate('/canchas');
    }
  }, [user, authLoading, location.state, location.pathname, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Formatear número de tarjeta con espacios cada 4 dígitos
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setPaymentData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiryDate') {
      // Formatear fecha de expiración MM/YY
      const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
      setPaymentData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      // Solo permitir 3 dígitos para CVV
      const formatted = value.replace(/\D/g, '').slice(0, 3);
      setPaymentData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setPaymentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validatePaymentData = () => {
    const { cardNumber, expiryDate, cvv, cardName, email, phone } = paymentData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setError('Número de tarjeta inválido');
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      setError('Fecha de expiración inválida');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      setError('CVV inválido');
      return false;
    }
    
    if (!cardName.trim()) {
      setError('Nombre en la tarjeta requerido');
      return false;
    }
    
    if (!email.trim()) {
      setError('Correo electrónico requerido');
      return false;
    }
    
    if (!phone.trim()) {
      setError('Teléfono requerido');
      return false;
    }
    
    return true;
  };

  const formatTime12h = (time24h) => {
    if (!time24h) return 'N/A';
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Si es un objeto Firestore Timestamp
      if (dateString.toDate) {
        const date = dateString.toDate();
        return date.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
      }
      
      // Si es un string en formato YYYY-MM-DD, formatearlo directamente sin convertir a Date
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        // Formatear directamente como DD/MM/YYYY usando la fecha como está
        return `${day}/${month}/${year}`;
      }
      
      // Para otros formatos, intentar parsear normalmente
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Formatear usando zona horaria de Lima
      return date.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    } catch {
      return 'N/A';
    }
  };

  // Convertir tiempo a minutos
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Verificar si el horario está disponible antes de procesar el pago
  const checkAvailability = async () => {
    if (!reservation || !reservation.idCancha || !reservation.fecha || !reservation.horaInicio || !reservation.horaFin) {
      return { available: false, reason: 'Datos de reserva incompletos' };
    }

    try {
      const fecha = reservation.fecha || reservation.date;
      const horaInicio = reservation.horaInicio || reservation.time;
      const horaFin = reservation.horaFin;

      // Cargar reservas y eventos existentes para esa cancha y fecha
      const [reservasExistentes, eventosExistentes] = await Promise.all([
        reservaRepository.getByCanchaAndDate(reservation.idCancha, fecha),
        eventoRepository.getByCanchaAndDate(reservation.idCancha, fecha)
      ]);

      const reservaStartMinutes = timeToMinutes(horaInicio);
      const reservaEndMinutes = timeToMinutes(horaFin);

      // Verificar si está ocupado por otra reserva (excluyendo la reserva actual)
      const estaOcupadoPorReserva = reservasExistentes.some(reserva => {
        // Excluir la reserva actual si tiene ID
        if (reservation.id && reserva.id === reservation.id) {
          return false;
        }

        // Solo considerar reservas con estado válido (pendiente o pagado)
        if (!reserva.estadoPago || (reserva.estadoPago !== 'pendiente' && reserva.estadoPago !== 'pagado')) {
          return false;
        }

        if (!reserva.horaInicio || !reserva.horaFin) {
          return false;
        }

        const reservaStart = timeToMinutes(reserva.horaInicio);
        const reservaEnd = timeToMinutes(reserva.horaFin);

        return (
          (reservaStartMinutes >= reservaStart && reservaStartMinutes < reservaEnd) ||
          (reservaEndMinutes > reservaStart && reservaEndMinutes <= reservaEnd) ||
          (reservaStartMinutes <= reservaStart && reservaEndMinutes >= reservaEnd)
        );
      });

      // Verificar si está ocupado por evento activo
      const estaOcupadoPorEvento = eventosExistentes.some(evento => {
        if (!evento.activo || !evento.horaInicio || !evento.horaFin) {
          return false;
        }

        const eventoStart = timeToMinutes(evento.horaInicio);
        const eventoEnd = timeToMinutes(evento.horaFin);

        return (
          (reservaStartMinutes >= eventoStart && reservaStartMinutes < eventoEnd) ||
          (reservaEndMinutes > eventoStart && reservaEndMinutes <= eventoEnd) ||
          (reservaStartMinutes <= eventoStart && reservaEndMinutes >= eventoEnd)
        );
      });

      if (estaOcupadoPorReserva) {
        return { available: false, reason: 'Este horario ya está reservado por otro usuario' };
      }

      if (estaOcupadoPorEvento) {
        return { available: false, reason: 'Este horario está ocupado por un evento' };
      }

      return { available: true };
    } catch (err) {
      console.info('Error checking availability:', err);
      return { available: false, reason: 'Error al verificar disponibilidad' };
    }
  };

  const calculateDuration = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return 0;
    const [startHours, startMinutes] = horaInicio.split(':').map(Number);
    const [endHours, endMinutes] = horaFin.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;
    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }
    return Math.round((endTotal - startTotal) / 60);
  };

  const processPayment = async () => {
    if (!validatePaymentData()) return;

    setLoading(true);
    setError('');
    setCheckingAvailability(true);

    try {
      if (!reservation || !reservation.id) {
        throw new Error('Reserva no válida');
      }

      // Verificar disponibilidad antes de procesar el pago
      const availabilityCheck = await checkAvailability();
      setCheckingAvailability(false);

      if (!availabilityCheck.available) {
        setError(availabilityCheck.reason || 'Este horario ya no está disponible. Por favor selecciona otro horario.');
        navigate('/canchas');
        return;
      }

      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Obtener fecha actual en zona horaria de Lima para fechaActualizacion
      const now = new Date();
      const limaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
      
      // Actualizar reserva en Firestore con información de pago
      await reservaRepository.update(reservation.id, {
        estadoPago: 'pagado',
        metodoPago: paymentData.cardName ? 'Tarjeta' : 'Efectivo',
        fechaActualizacion: limaDate
      });

      // Preparar datos para la página de confirmación
      const updatedReservation = {
        ...reservation,
        estadoPago: 'pagado',
        metodoPago: paymentData.cardName ? 'Tarjeta' : 'Efectivo'
      };

      navigate('/confirmation', { state: { reservation: updatedReservation } });
    } catch (err) {
      console.info('Error processing payment:', err);
      setError('Error al procesar el pago. Inténtalo de nuevo.');
      setCheckingAvailability(false);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar spinner mientras carga la autenticación o la reserva
  if (authLoading || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <Spinner color="success" />
          <span>{authLoading ? 'Verificando sesión...' : 'Cargando reserva...'}</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, no mostrar nada (ya se redirigió)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Procesar Pago</h1>
          <p className="text-lg text-gray-600">Completa los datos de pago para confirmar tu reserva</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="p-0">
              <div className="border-b px-4 py-3">
                <h3 className="m-0 text-lg font-semibold">Resumen de Reserva</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span>Fecha:</span>
                  <span className="font-semibold">{formatDate(reservation.fecha || reservation.date)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Hora de Inicio:</span>
                  <span className="font-semibold">{formatTime12h(reservation.horaInicio || reservation.time)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Hora de Fin:</span>
                  <span className="font-semibold">{formatTime12h(reservation.horaFin)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Duración:</span>
                  <span className="font-semibold">
                    {reservation.duration || (reservation.horaInicio && reservation.horaFin ? calculateDuration(reservation.horaInicio, reservation.horaFin) : 'N/A')} horas
                  </span>
                </div>
                <hr className="my-3" />
                <div className="flex items-center justify-between font-semibold text-2xl text-success">
                  <span>Total a Pagar:</span>
                  <span>S/ {reservation.precioTotal || reservation.total || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="p-0">
              <div className="border-b px-4 py-3">
                <h3 className="m-0 text-lg font-semibold">Información de Pago</h3>
              </div>
              <div className="p-4">
                <form className="space-y-4">
                  <Input
                    type="text"
                    name="cardNumber"
                    label="Número de Tarjeta"
                    value={paymentData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    isRequired
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      name="expiryDate"
                      label="Fecha de Expiración"
                      value={paymentData.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      isRequired
                    />
                    <Input
                      type="text"
                      name="cvv"
                      label="CVV"
                      value={paymentData.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength={3}
                      isRequired
                    />
                  </div>

                  <Input
                    type="text"
                    name="cardName"
                    label="Nombre en la Tarjeta"
                    value={paymentData.cardName}
                    onChange={handleInputChange}
                    placeholder="Nombre como aparece en la tarjeta"
                    isRequired
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="email"
                      name="email"
                      label="Correo Electrónico"
                      value={paymentData.email}
                      onChange={handleInputChange}
                      isRequired
                    />
                    <Input
                      type="tel"
                      name="phone"
                      label="Teléfono"
                      value={paymentData.phone}
                      onChange={handleInputChange}
                      isRequired
                    />
                  </div>

                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 flex items-center gap-2">
                    <span>🔒</span>
                    <span>Tu información está protegida con encriptación SSL de 256 bits</span>
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                  )}

                  {checkingAvailability && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>Verificando disponibilidad del horario...</span>
                    </div>
                  )}

                  <Button
                    color="success"
                    size="lg"
                    className="w-full text-white [&>span]:text-white"
                    onPress={processPayment}
                    isDisabled={loading || checkingAvailability}
                    isLoading={loading || checkingAvailability}
                  >
                    {checkingAvailability ? 'Verificando...' : loading ? 'Procesando Pago...' : `Pagar S/ ${reservation.total || reservation.precioTotal || 0}`}
                  </Button>

                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Aceptamos:</p>
                    <div className="flex justify-center gap-3 text-xl">
                      <span>💳</span>
                      <span>🏦</span>
                      <span>📱</span>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
