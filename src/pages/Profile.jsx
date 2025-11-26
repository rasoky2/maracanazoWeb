import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Avatar, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { CanchaRepository } from '../repositories/Cancha.repository.js';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const reservaRepository = new ReservaRepository();
  const canchaRepository = new CanchaRepository();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadReservations();
    }
  }, [user, authLoading, navigate]);

  const calculateDuration = (horaInicio, horaFin) => {
    const [startHours, startMinutes] = horaInicio.split(':').map(Number);
    const [endHours, endMinutes] = horaFin.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;
    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }
    return Math.round((endTotal - startTotal) / 60);
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const currentUserId = user?.id ?? user?.uid;
      if (!currentUserId) {
        console.info('No user ID available');
        setReservations([]);
        return;
      }
      
      const reservasData = await reservaRepository.getByUser(currentUserId);
      
      if (!reservasData || reservasData.length === 0) {
        setReservations([]);
        return;
      }
      
      // Enriquecer con datos de cancha
      const reservasEnriquecidas = await Promise.all(
        reservasData.map(async (reserva) => {
          const cancha = await canchaRepository.getById(reserva.idCancha);
          const duracion = calculateDuration(reserva.horaInicio, reserva.horaFin);
          
          return {
            ...reserva,
            canchaName: cancha?.nombre || 'Cancha no encontrada',
            date: reserva.fecha,
            time: reserva.horaInicio,
            duration: duracion,
            total: reserva.precioTotal || reserva.subtotal || 0
          };
        })
      );
      
      setReservations(reservasEnriquecidas);
    } catch (error) {
      console.info('Error loading reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    if (dateString.toDate) {
      return dateString.toDate().toLocaleDateString('es-PE');
    }
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const formatCurrency = amount => new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount);

  const handleEditProfile = useCallback(() => {
    navigate('/profile/edit');
  }, [navigate]);

  const handleGoToReserva = useCallback(() => {
    navigate('/reserva');
  }, [navigate]);

  const handleViewDetails = useCallback((reservation) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  }, []);

  const formatTime12h = (time24h) => {
    if (!time24h) return 'N/A';
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Mi Perfil</h1>
          <p className="text-lg text-gray-600">Gestiona tu cuenta y reservas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card className="p-0 mb-4">
              <div className="border-b px-4 py-3">
                <h4 className="m-0 text-lg font-semibold">Información Personal</h4>
              </div>
              <div className="p-4">
                <div className="flex justify-center mb-4">
                  <Avatar
                    src={user?.urlFoto || user?.photoURL || undefined}
                    name={user?.nombreCompleto || user?.displayName || 'Usuario'}
                    size="lg"
                    className="w-24 h-24 text-xl font-bold"
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="font-semibold">{user.nombreCompleto || 'Usuario'}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold">{user.email}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="font-semibold">{user.telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">Miembro desde:</span>
                  <span className="font-semibold">{user.fechaCreacion ? formatDate(user.fechaCreacion.toDate ? user.fechaCreacion.toDate() : user.fechaCreacion) : 'N/A'}</span>
                </div>
                <Button 
                  color="success" 
                  size="lg"
                  className="w-full mt-3 text-white text-lg font-semibold" 
                  onPress={handleEditProfile}
                >
                  Editar Perfil
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="p-0">
              <div className="border-b px-4 py-3">
                <h4 className="m-0 text-lg font-semibold">Mis Reservas</h4>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-10 flex justify-center">
                    <Spinner color="success" />
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 mb-3">No tienes reservas aún</p>
                    <Button 
                      color="success" 
                      size="lg"
                      className="text-white text-lg font-semibold"
                      onPress={handleGoToReserva}
                    >
                      Hacer una Reserva
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-600">
                        <tr>
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Fecha</th>
                          <th className="py-2 pr-4">Hora</th>
                          <th className="py-2 pr-4">Duración</th>
                          <th className="py-2 pr-4">Total</th>
                          <th className="py-2 pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map(reservation => (
                          <tr key={reservation.id} className="border-t">
                            <td className="py-2 pr-4">#{reservation.id.slice(0, 8)}</td>
                            <td className="py-2 pr-4">{formatDate(reservation.date)}</td>
                            <td className="py-2 pr-4">{reservation.time}</td>
                            <td className="py-2 pr-4">{reservation.duration}h</td>
                            <td className="py-2 pr-4">{formatCurrency(reservation.total)}</td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2">
                                {reservation.estadoPago === 'pendiente' && (
                                  <Button size="sm" color="danger">Cancelar</Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="bordered" 
                                  color="primary"
                                  onPress={() => handleViewDetails(reservation)}
                                >
                                  Ver Detalles
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Detalles de la Reserva</h3>
          </ModalHeader>
          <ModalBody>
            {selectedReservation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ID de Reserva</p>
                    <p className="font-semibold">#{selectedReservation.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cancha</p>
                    <p className="font-semibold">{selectedReservation.canchaName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha</p>
                    <p className="font-semibold">{formatDate(selectedReservation.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hora de Inicio</p>
                    <p className="font-semibold">{formatTime12h(selectedReservation.time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hora de Fin</p>
                    <p className="font-semibold">{formatTime12h(selectedReservation.horaFin)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duración</p>
                    <p className="font-semibold">{selectedReservation.duration} horas</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado de Pago</p>
                    <Chip 
                      color={selectedReservation.estadoPago === 'pagado' ? 'success' : selectedReservation.estadoPago === 'cancelado' ? 'danger' : 'warning'} 
                      size="sm"
                    >
                      {selectedReservation.estadoPago === 'pagado' ? 'Pagado' : selectedReservation.estadoPago === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Método de Pago</p>
                    <p className="font-semibold">{selectedReservation.metodoPago || 'No especificado'}</p>
                  </div>
                </div>
                
                {selectedReservation.notas && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notas</p>
                    <p className="font-semibold">{selectedReservation.notas}</p>
                  </div>
                )}

                {selectedReservation.codigoDescuento && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-sm text-gray-500 mb-1">Descuento Aplicado</p>
                    <p className="font-semibold text-green-700">Código: {selectedReservation.codigoDescuento}</p>
                    {selectedReservation.montoDescuento > 0 && (
                      <p className="text-sm text-green-600">Descuento: {formatCurrency(selectedReservation.montoDescuento)}</p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(selectedReservation.subtotal || selectedReservation.total)}</span>
                  </div>
                  {selectedReservation.montoDescuento > 0 && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span>Descuento:</span>
                      <span>- {formatCurrency(selectedReservation.montoDescuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold text-success border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedReservation.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Profile;
