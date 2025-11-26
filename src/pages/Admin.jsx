import React, { useState, useEffect } from 'react';
import { Card, Button, Chip, Spinner } from '@heroui/react';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaCog,
  FaChartBar,
  FaFutbol,
  FaCalendarCheck,
  FaHome,
  FaVideo,
  FaImage
} from 'react-icons/fa';
import { UserRepository } from '../repositories/User.repository.js';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import CanchaForm from '../components/CanchaForm.jsx';
import StepsForm from '../components/StepsForm.jsx';
import TrustedByForm from '../components/TrustedByForm.jsx';
import VideoForm from '../components/VideoForm.jsx';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCanchas: 0,
    totalReservas: 0,
    totalRevenue: 0
  });
  const [isCanchaFormOpen, setIsCanchaFormOpen] = useState(false);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [isStepsFormOpen, setIsStepsFormOpen] = useState(false);
  const [isTrustedByFormOpen, setIsTrustedByFormOpen] = useState(false);
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);

  // Repositorios
  const userRepository = new UserRepository();
  const canchaRepository = new CanchaRepository();
  const reservaRepository = new ReservaRepository();

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, canchasData, reservasData] = await Promise.all([
        userRepository.getAll(),
        canchaRepository.getAllForAdmin(),
        reservaRepository.getAll()
      ]);

      setUsers(usersData);
      setCanchas(canchasData);

      // Enriquecer reservas con datos de usuario y cancha
      const reservasEnriquecidas = reservasData.map(reserva => {
        const usuario = usersData.find(u => u.id === reserva.idUsuario);
        const cancha = canchasData.find(c => c.id === reserva.idCancha);
        const duracion = calculateDuration(reserva.horaInicio, reserva.horaFin);

        return {
          ...reserva,
          userName: usuario?.nombreCompleto || usuario?.nombre || usuario?.name || 'Usuario no encontrado',
          userEmail: usuario?.email || 'N/A',
          userPhoto: usuario?.urlFoto || usuario?.photoURL || '',
          canchaName: cancha?.nombre || cancha?.name || 'Cancha no encontrada',
          date: reserva.fecha,
          startTime: reserva.horaInicio,
          duration: duracion,
          total: reserva.precioTotal || reserva.subtotal || 0
        };
      });

      setReservas(reservasEnriquecidas);

      // Calcular estadísticas
      const totalRevenue = reservasEnriquecidas.reduce((sum, r) => sum + (r.total || 0), 0);
      setStats({
        totalUsers: usersData.length,
        totalCanchas: canchasData.length,
        totalReservas: reservasEnriquecidas.length,
        totalRevenue
      });
    } catch (error) {
      console.info('Error loading data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async userId => {
    try {
      await userRepository.promoteToAdmin(userId);
      loadData();
    } catch (error) {
      console.info('Error promoting user:', error.message);
    }
  };

  const handleDemoteUser = async userId => {
    try {
      await userRepository.demoteFromAdmin(userId);
      loadData();
    } catch (error) {
      console.info('Error demoting user:', error.message);
    }
  };

  const handleDeleteUser = async userId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await userRepository.delete(userId);
        loadData();
      } catch (error) {
        console.info('Error deleting user:', error.message);
      }
    }
  };

  const handleDeleteCancha = async canchaId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cancha?')) {
      try {
        await canchaRepository.delete(canchaId);
        loadData();
      } catch (error) {
        console.info('Error deleting cancha:', error.message);
      }
    }
  };

  const handleUserAction = (userId, isAdmin) => {
    if (isAdmin) {
      handleDemoteUser(userId);
    } else {
      handlePromoteUser(userId);
    }
  };

  const handleDeleteUserClick = userId => {
    handleDeleteUser(userId);
  };

  const handleDeleteCanchaClick = canchaId => {
    handleDeleteCancha(canchaId);
  };

  const handleEditCancha = cancha => {
    setSelectedCancha(cancha);
    setIsCanchaFormOpen(true);
  };

  const handleCreateCancha = () => {
    setSelectedCancha(null);
    setIsCanchaFormOpen(true);
  };

  const handleCanchaFormSuccess = () => {
    loadData();
  };

  const handleCloseCanchaForm = () => {
    setIsCanchaFormOpen(false);
    setSelectedCancha(null);
  };

  const formatDate = dateString => {
    if (!dateString) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <Spinner color="success" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3">
            <FaCog /> Panel de Administración
          </h1>
          <p className="text-lg text-gray-600">Gestiona usuarios, canchas, horarios y eventos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-0">
              <div className="divide-y">
                {[
                  { key: 'dashboard', icon: <FaChartBar size={16} />, label: 'Dashboard' },
                  { key: 'users', icon: <FaUsers size={16} />, label: 'Usuarios' },
                  { key: 'canchas', icon: <FaFutbol size={16} />, label: 'Canchas' },
                  { key: 'reservas', icon: <FaCalendarCheck size={16} />, label: 'Reservas' },
                  { key: 'eventos', icon: <FaCalendarAlt size={16} />, label: 'Eventos' },
                  { key: 'home', icon: <FaHome size={16} />, label: 'Contenido Home' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 ${activeTab === item.key ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-9">
            {activeTab === 'dashboard' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="text-center p-4">
                    <FaUsers size={32} className="text-primary mb-2" />
                    <h3 className="text-primary">{stats.totalUsers}</h3>
                    <p className="text-gray-500 m-0">Total Usuarios</p>
                  </Card>
                  <Card className="text-center p-4">
                    <FaFutbol size={32} className="text-success mb-2" />
                    <h3 className="text-success">{stats.totalCanchas}</h3>
                    <p className="text-gray-500 m-0">Canchas Activas</p>
                  </Card>
                  <Card className="text-center p-4">
                    <FaCalendarCheck size={32} className="text-blue-500 mb-2" />
                    <h3 className="text-blue-500">{stats.totalReservas}</h3>
                    <p className="text-gray-500 m-0">Total Reservas</p>
                  </Card>
                  <Card className="text-center p-4">
                    <FaChartBar size={32} className="text-yellow-500 mb-2" />
                    <h3 className="text-yellow-500">{formatCurrency(stats.totalRevenue)}</h3>
                    <p className="text-gray-500 m-0">Ingresos Totales</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <div className="border-b px-4 py-3">
                      <h5 className="m-0">Usuarios Recientes</h5>
                    </div>
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-left text-gray-600">
                            <tr>
                              <th className="py-2 pr-4">Nombre</th>
                              <th className="py-2 pr-4">Email</th>
                              <th className="py-2 pr-4">Rol</th>
                              <th className="py-2 pr-4">Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.slice(0, 5).map(userItem => (
                              <tr key={userItem.id} className="border-t">
                                <td className="py-2 pr-4">{userItem.name}</td>
                                <td className="py-2 pr-4">{userItem.email}</td>
                                <td className="py-2 pr-4">
                                  <Chip color={userItem.isAdmin ? 'danger' : 'primary'} size="sm">
                                    {userItem.isAdmin ? 'Admin' : 'Usuario'}
                                  </Chip>
                                </td>
                                <td className="py-2 pr-4">{formatDate(userItem.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="border-b px-4 py-3">
                      <h5 className="m-0">Reservas Recientes</h5>
                    </div>
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-left text-gray-600">
                            <tr>
                              <th className="py-2 pr-4">Usuario</th>
                              <th className="py-2 pr-4">Cancha</th>
                              <th className="py-2 pr-4">Fecha</th>
                              <th className="py-2 pr-4">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservas.slice(0, 5).map(reserva => (
                              <tr key={reserva.id} className="border-t">
                                <td className="py-2 pr-4">{reserva.userName}</td>
                                <td className="py-2 pr-4">{reserva.canchaName}</td>
                                <td className="py-2 pr-4">{formatDate(reserva.date)}</td>
                                <td className="py-2 pr-4">{formatCurrency(reserva.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <Card>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h4 className="m-0">Gestión de Usuarios</h4>
                  <Button color="primary" size="sm">
                    <FaPlus className="mr-1" />
                    Nuevo Usuario
                  </Button>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-600">
                        <tr>
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Nombre</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Teléfono</th>
                          <th className="py-2 pr-4">Rol</th>
                          <th className="py-2 pr-4">Registro</th>
                          <th className="py-2 pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(userItem => (
                          <tr key={userItem.id} className="border-t">
                            <td className="py-2 pr-4">#{userItem.id.slice(0, 8)}</td>
                            <td className="py-2 pr-4">{userItem.name}</td>
                            <td className="py-2 pr-4">{userItem.email}</td>
                            <td className="py-2 pr-4">{userItem.phone || 'N/A'}</td>
                            <td className="py-2 pr-4">
                              <Chip color={userItem.isAdmin ? 'danger' : 'primary'} size="sm">
                                {userItem.isAdmin ? 'Admin' : 'Usuario'}
                              </Chip>
                            </td>
                            <td className="py-2 pr-4">{formatDate(userItem.createdAt)}</td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  color={userItem.isAdmin ? 'warning' : 'success'}
                                  onPress={() => handleUserAction(userItem.id, userItem.isAdmin)}
                                >
                                  {userItem.isAdmin ? 'Degradar' : 'Promover'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  color="danger"
                                  variant="bordered"
                                  onPress={() => handleDeleteUserClick(userItem.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'canchas' && (
              <Card>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h4 className="m-0">Gestión de Canchas</h4>
                  <Button color="primary" size="sm" onPress={handleCreateCancha}>
                    <FaPlus className="mr-1" />
                    Nueva Cancha
                  </Button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {canchas.map(cancha => (
                      <Card key={cancha.id} className="h-full p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="m-0">{cancha.nombre || 'Sin nombre'}</h5>
                          <Chip color={cancha.activo ? 'success' : 'default'} size="sm">
                            {cancha.activo ? 'Activa' : 'Inactiva'}
                          </Chip>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">{cancha.descripcion || 'Sin descripción'}</p>
                        <div className="mb-3">
                          {cancha.precios ? (
                            <div className="text-sm">
                              <div className="font-semibold text-success mb-1">Precios por horario:</div>
                              <div>{cancha.precios.manana?.inicio || '07:00'}-{cancha.precios.manana?.fin || '17:00'}: {formatCurrency(cancha.precios.manana?.precio || 0)}</div>
                              <div>{cancha.precios.noche?.inicio || '17:00'}-{cancha.precios.noche?.fin || '00:00'}: {formatCurrency(cancha.precios.noche?.precio || 0)}</div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-success">{formatCurrency(cancha.precio || 0)}</span>
                              <small className="text-gray-500">{cancha.tipo || 'N/A'}</small>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="bordered" 
                            color="primary" 
                            className="flex-1"
                            onPress={() => handleEditCancha(cancha)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="bordered"
                            color="danger"
                            onPress={() => handleDeleteCanchaClick(cancha.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'reservas' && (
              <Card>
                <div className="border-b px-4 py-3">
                  <h4 className="m-0">Gestión de Reservas</h4>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-600">
                      <tr>
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Usuario</th>
                        <th className="py-2 pr-4">Cancha</th>
                        <th className="py-2 pr-4">Fecha</th>
                        <th className="py-2 pr-4">Hora</th>
                        <th className="py-2 pr-4">Duración</th>
                        <th className="py-2 pr-4">Total</th>
                        <th className="py-2 pr-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map(reserva => (
                        <tr key={reserva.id} className="border-t">
                          <td className="py-2 pr-4">#{reserva.id.slice(0, 8)}</td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-3">
                              {reserva.userPhoto ? (
                                <img 
                                  src={reserva.userPhoto} 
                                  alt={reserva.userName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                  {reserva.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{reserva.userName}</div>
                                <small className="text-gray-500">{reserva.userEmail}</small>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-4">{reserva.canchaName}</td>
                          <td className="py-2 pr-4">{formatDate(reserva.date)}</td>
                          <td className="py-2 pr-4">{reserva.startTime}</td>
                          <td className="py-2 pr-4">{reserva.duration}h</td>
                          <td className="py-2 pr-4">{formatCurrency(reserva.total)}</td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="bordered" color="primary">
                                <FaEye />
                              </Button>
                              <Button size="sm" variant="bordered" color="success">
                                <FaEdit />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === 'eventos' && (
              <Card>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h4 className="m-0">Gestión de Eventos</h4>
                  <Button color="primary" size="sm">
                    <FaPlus className="mr-1" />
                    Nuevo Evento
                  </Button>
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt />
                      <span>Aquí puedes crear y gestionar eventos especiales en las canchas.</span>
                    </div>
                  </div>
                  <div className="text-center py-10">
                    <FaCalendarAlt size={64} className="text-gray-400 mb-3 mx-auto" />
                    <h5 className="text-lg font-semibold">Gestión de Eventos</h5>
                    <p className="text-gray-500">Próximamente podrás crear eventos especiales y torneos.</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'home' && (
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="m-0">Pasos del Home</h4>
                      <p className="text-sm text-gray-500 m-0">Gestiona los pasos que se muestran en la sección Steps</p>
                    </div>
                    <Button color="primary" size="sm" onPress={() => setIsStepsFormOpen(true)}>
                      <FaEdit className="mr-1" />
                      Editar Pasos
                    </Button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <FaHome />
                        <span>Edita los videos, títulos y descripciones de los pasos del proceso de reserva.</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="m-0">Logos Confiados</h4>
                      <p className="text-sm text-gray-500 m-0">Gestiona los logos que se muestran en TrustedBy</p>
                    </div>
                    <Button color="primary" size="sm" onPress={() => setIsTrustedByFormOpen(true)}>
                      <FaImage className="mr-1" />
                      Editar Logos
                    </Button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <FaImage />
                        <span>Agrega o edita los logos de clubes y asociaciones que confían en ti.</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="m-0">Videos Deportivos</h4>
                      <p className="text-sm text-gray-500 m-0">Gestiona los videos que se muestran en la sección Video</p>
                    </div>
                    <Button color="primary" size="sm" onPress={() => setIsVideoFormOpen(true)}>
                      <FaVideo className="mr-1" />
                      Editar Videos
                    </Button>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <div className="flex items-center gap-2">
                        <FaVideo />
                        <span>Edita los videos deportivos, posters y títulos que se muestran en el carrusel.</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <CanchaForm
        isOpen={isCanchaFormOpen}
        onClose={handleCloseCanchaForm}
        cancha={selectedCancha}
        onSuccess={handleCanchaFormSuccess}
      />

      <StepsForm
        isOpen={isStepsFormOpen}
        onClose={() => setIsStepsFormOpen(false)}
        onSuccess={loadData}
      />

      <TrustedByForm
        isOpen={isTrustedByFormOpen}
        onClose={() => setIsTrustedByFormOpen(false)}
        onSuccess={loadData}
      />

      <VideoForm
        isOpen={isVideoFormOpen}
        onClose={() => setIsVideoFormOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default Admin;