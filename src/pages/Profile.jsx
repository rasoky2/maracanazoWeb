import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Chip, Spinner, Avatar } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadReservations();
    }
  }, [user, authLoading, navigate]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/reservations');
      const allReservations = await response.json();
      const currentUserId = user?.id ?? user?.uid;
      const userReservations = allReservations.filter(r => r.userId === currentUserId);
      setReservations(userReservations);
    } catch (error) {
      console.info('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateString => new Date(dateString).toLocaleDateString('es-PE');

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
                          <th className="py-2 pr-4">Estado</th>
                          <th className="py-2 pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map(reservation => (
                          <tr key={reservation.id} className="border-t">
                            <td className="py-2 pr-4">#{reservation.id}</td>
                            <td className="py-2 pr-4">{formatDate(reservation.date)}</td>
                            <td className="py-2 pr-4">{reservation.time}</td>
                            <td className="py-2 pr-4">{reservation.duration}h</td>
                            <td className="py-2 pr-4">{formatCurrency(reservation.total)}</td>
                            <td className="py-2 pr-4">
                              <Chip color={reservation.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                                {reservation.status}
                              </Chip>
                            </td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2">
                                {reservation.status === 'pending' && (
                                  <Button size="sm" color="danger">Cancelar</Button>
                                )}
                                <Button size="sm" variant="bordered" color="primary">Ver Detalles</Button>
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
    </div>
  );
};

export default Profile;
