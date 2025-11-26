import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Textarea } from '@heroui/react';

const Payment = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (location.state?.reservation) {
      setReservation(location.state.reservation);
      setPaymentData(prev => ({
        ...prev,
        email: user.email,
        phone: user.phone
      }));
    } else {
      navigate('/reserva');
    }
  }, [user, location.state, navigate]);

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

  const processPayment = async () => {
    if (!validatePaymentData()) return;

    setLoading(true);
    setError('');

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular respuesta exitosa del procesador de pagos
      const paymentResult = {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        amount: reservation.total,
        currency: 'PEN',
        timestamp: new Date().toISOString()
      };

      if (paymentResult.success) {
        // Actualizar reserva con información de pago
        const updatedReservation = {
          ...reservation,
          payment: {
            transactionId: paymentResult.transactionId,
            amount: paymentResult.amount,
            currency: paymentResult.currency,
            status: 'completed',
            timestamp: paymentResult.timestamp,
            method: 'card'
          },
          status: 'confirmed'
        };

        // Actualizar reserva en la base de datos
        const response = await fetch(`http://localhost:4000/reservations/${reservation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedReservation),
        });

        if (response.ok) {
          navigate('/confirmation', { state: { reservation: updatedReservation } });
        } else {
          setError('Error al confirmar la reserva');
        }
      } else {
        setError('Error en el procesamiento del pago');
      }
    } catch (err) {
      setError('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) {
    return <div>Cargando...</div>;
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
                  <span>{new Date(reservation.date).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Hora:</span>
                  <span>{reservation.time}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Duración:</span>
                  <span>{reservation.duration} horas</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span>Jugadores:</span>
                  <span>{reservation.players}</span>
                </div>
                <hr />
                <div className="flex items-center justify-between font-semibold text-2xl text-success">
                  <span>Total a Pagar:</span>
                  <span>S/ {reservation.total}</span>
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

                  <Button
                    color="success"
                    size="lg"
                    className="w-full"
                    onPress={processPayment}
                    isDisabled={loading}
                    isLoading={loading}
                  >
                    {loading ? 'Procesando Pago...' : `Pagar S/ ${reservation.total}`}
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
