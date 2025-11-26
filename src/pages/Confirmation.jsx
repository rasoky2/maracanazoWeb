import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Button } from '@heroui/react';

const Confirmation = () => {
  const location = useLocation();
  const reservation = location.state?.reservation;

  if (!reservation) {
    return (
      <div className="confirmation-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>No se encontró información de la reserva.</p>
          <Link to="/" className="btn-home">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Card className="text-center p-0 shadow-lg">
          <div className="p-10">
            <div className="text-6xl text-success mb-4">✅</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">¡Reserva Confirmada!</h1>
            <p className="text-lg text-gray-600 mb-6">Tu reserva ha sido procesada exitosamente</p>

            <Card className="bg-gray-50">
              <div className="border-b px-4 py-3">
                <h4 className="m-0 text-lg font-semibold">Detalles de la Reserva</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Número de Reserva:</span>
                  <span className="font-semibold">#{reservation.id}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Fecha:</span>
                  <span className="font-semibold">{new Date(reservation.date).toLocaleDateString('es-PE')}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Hora:</span>
                  <span className="font-semibold">{reservation.time}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Duración:</span>
                  <span className="font-semibold">{reservation.duration} horas</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Jugadores:</span>
                  <span className="font-semibold">{reservation.players}</span>
                </div>
                <hr />
                <div className="flex items-center justify-between font-semibold text-2xl text-success">
                  <span>Total Pagado:</span>
                  <span>S/ {reservation.total}</span>
                </div>
                {reservation.payment && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500">ID de Transacción:</span>
                    <span className="font-semibold">{reservation.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Link to="/reservations">
                <Button color="success" size="lg">Ver Mis Reservas</Button>
              </Link>
              <Link to="/">
                <Button variant="bordered" size="lg">Volver al Inicio</Button>
              </Link>
            </div>

            <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <h6 className="font-semibold">¿Necesitas ayuda?</h6>
              <p className="m-0">Contáctanos al +51 999 999 999 o envía un email a info@ptr.com</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Confirmation;
