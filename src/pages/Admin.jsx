import React, { useState, useEffect } from 'react';
import { Card, Button, Chip, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { 
  FaUsers, 
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
  FaImage,
  FaEllipsisV,
  FaSearch
} from 'react-icons/fa';
import { UserRepository } from '../repositories/User.repository.js';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { ReservaRepository } from '../repositories/Reserva.repository.js';
import { EventoRepository } from '../repositories/Evento.repository.js';
import { HomeContentRepository } from '../repositories/HomeContent.repository.js';
import CanchaForm from '../components/CanchaForm.jsx';
import EventoForm from '../components/EventoForm.jsx';
import ReservaForm from '../components/ReservaForm.jsx';
import StepsForm from '../components/StepsForm.jsx';
import TrustedByForm from '../components/TrustedByForm.jsx';
import VideoForm from '../components/VideoForm.jsx';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [filteredReservas, setFilteredReservas] = useState([]);
  const [reservaSearchTerm, setReservaSearchTerm] = useState('');
  const [eventos, setEventos] = useState([]);
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
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [isReservaDetailModalOpen, setIsReservaDetailModalOpen] = useState(false);
  const [isReservaEditModalOpen, setIsReservaEditModalOpen] = useState(false);
  const [editingReserva, setEditingReserva] = useState(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [isEventoFormOpen, setIsEventoFormOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [isDeleteEventoModalOpen, setIsDeleteEventoModalOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  // Repositorios
  const userRepository = new UserRepository();
  const canchaRepository = new CanchaRepository();
  const reservaRepository = new ReservaRepository();
  const eventoRepository = new EventoRepository();
  const homeContentRepository = new HomeContentRepository();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'home') {
      loadSteps();
    }
  }, [activeTab]);

  const loadSteps = async () => {
    setLoadingSteps(true);
    try {
      const stepsData = await homeContentRepository.getSteps();
      setSteps(stepsData || []);
    } catch (error) {
      console.info('Error loading steps:', error.message);
      setSteps([]);
    } finally {
      setLoadingSteps(false);
    }
  };

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
      const [usersData, canchasData, reservasData, eventosData] = await Promise.all([
        userRepository.getAll(),
        canchaRepository.getAllForAdmin(),
        reservaRepository.getAll(),
        eventoRepository.getAll()
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
          canchaImage: cancha?.imagenPrincipal || cancha?.imagen || '',
          date: reserva.fecha,
          startTime: reserva.horaInicio,
          duration: duracion,
          total: reserva.precioTotal || reserva.subtotal || 0
        };
      });

      // Ordenar reservas por fecha y hora (más recientes primero)
      const reservasOrdenadas = reservasEnriquecidas.sort((a, b) => {
        const fechaA = new Date(`${a.date}T${a.startTime}`);
        const fechaB = new Date(`${b.date}T${b.startTime}`);
        return fechaB - fechaA; // Descendente (más reciente primero)
      });

      setReservas(reservasOrdenadas);
      setFilteredReservas(reservasOrdenadas);
      setFilteredReservas(reservasOrdenadas);

      // Enriquecer eventos con datos de cancha
      const eventosEnriquecidos = eventosData.map(evento => {
        const cancha = canchasData.find(c => c.id === evento.idCancha);
        return {
          ...evento,
          canchaName: cancha?.nombre || cancha?.name || 'Cancha no encontrada',
          canchaImage: cancha?.imagenPrincipal || cancha?.imagen || ''
        };
      });
      setEventos(eventosEnriquecidos);

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

  const formatTime12h = (time24h) => {
    if (!time24h) return 'N/A';
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    
    const cleaned = phone.toString().trim();
    const digits = cleaned.replace(/\D/g, '');
    
    // Si tiene 11 dígitos y empieza con 51, tomar los últimos 9
    if (digits.length === 11 && digits.startsWith('51')) {
      const phoneDigits = digits.slice(2);
      if (phoneDigits.length === 9) {
        return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;
      }
    }
    
    // Si ya tiene +51 y 9 dígitos después
    if (cleaned.startsWith('+51')) {
      const phoneDigits = digits.startsWith('51') ? digits.slice(2) : digits;
      if (phoneDigits.length === 9) {
        return `${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`;
      }
      return cleaned.replace('+51', '').trim();
    }
    
    // Si tiene exactamente 9 dígitos, formatear
    if (digits.length === 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    
    // Cualquier otro formato, devolver como está
    return cleaned;
  };

  const handleViewReservaDetails = (reserva) => {
    setSelectedReserva(reserva);
    setIsReservaDetailModalOpen(true);
  };

  const handleEditReserva = (reserva) => {
    setEditingReserva(reserva);
    setIsReservaEditModalOpen(true);
  };

  const handleDeleteReservaClick = (reservaId) => {
    setReservaToDelete(reservaId);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteReserva = async () => {
    if (!reservaToDelete) return;
    
    try {
      await reservaRepository.delete(reservaToDelete);
      setIsDeleteConfirmModalOpen(false);
      setReservaToDelete(null);
      loadData();
    } catch (error) {
      console.info('Error deleting reserva:', error.message);
      setIsDeleteConfirmModalOpen(false);
      setReservaToDelete(null);
      alert('Error al eliminar la reserva');
    }
  };

  const handleReservaFormSuccess = () => {
      setIsReservaEditModalOpen(false);
      setEditingReserva(null);
      loadData();
  };

  const handleCloseReservaForm = () => {
    setIsReservaEditModalOpen(false);
    setEditingReserva(null);
  };

  // Agrupar reservas por fecha
  const groupReservasByDate = (reservasList) => {
    const grouped = {};
    reservasList.forEach(reserva => {
      const fecha = reserva.date || '';
      if (!grouped[fecha]) {
        grouped[fecha] = [];
      }
      grouped[fecha].push(reserva);
    });
    
    // Ordenar fechas descendente (más reciente primero)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(fecha => ({
        fecha,
        reservas: grouped[fecha]
      }));
  };

  // Filtrar reservas según término de búsqueda
  useEffect(() => {
    if (!reservaSearchTerm.trim()) {
      setFilteredReservas(reservas);
      return;
    }

    const searchLower = reservaSearchTerm.toLowerCase().trim();
    const filtered = reservas.filter(reserva => {
      const userName = (reserva.userName || '').toLowerCase();
      const userEmail = (reserva.userEmail || '').toLowerCase();
      const canchaName = (reserva.canchaName || '').toLowerCase();
      const estadoPago = (reserva.estadoPago || '').toLowerCase();
      const fecha = formatDate(reserva.date).toLowerCase();
      const metodoPago = (reserva.metodoPago || '').toLowerCase();
      const notas = (reserva.notas || '').toLowerCase();
      const id = (reserva.id || '').toLowerCase();

      return userName.includes(searchLower) ||
             userEmail.includes(searchLower) ||
             canchaName.includes(searchLower) ||
             estadoPago.includes(searchLower) ||
             fecha.includes(searchLower) ||
             metodoPago.includes(searchLower) ||
             notas.includes(searchLower) ||
             id.includes(searchLower);
    });

    setFilteredReservas(filtered);
  }, [reservaSearchTerm, reservas]);

  const handleCreateEvento = () => {
    setSelectedEvento(null);
    setIsEventoFormOpen(true);
  };

  const handleEditEvento = (evento) => {
    setSelectedEvento(evento);
    setIsEventoFormOpen(true);
  };

  const handleDeleteEventoClick = (eventoId) => {
    setEventoToDelete(eventoId);
    setIsDeleteEventoModalOpen(true);
  };

  const handleConfirmDeleteEvento = async () => {
    if (!eventoToDelete) return;
    
    try {
      await eventoRepository.delete(eventoToDelete);
      setIsDeleteEventoModalOpen(false);
      setEventoToDelete(null);
      loadData();
    } catch (error) {
      console.info('Error deleting evento:', error.message);
      setIsDeleteEventoModalOpen(false);
      setEventoToDelete(null);
      alert('Error al eliminar el evento');
    }
  };

  const handleEventoFormSuccess = () => {
    loadData();
  };

  const handleCloseEventoForm = () => {
    setIsEventoFormOpen(false);
    setSelectedEvento(null);
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
          <p className="text-lg text-gray-600">Gestiona usuarios, canchas y reservas</p>
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
                  { key: 'eventos', icon: <FaCalendarCheck size={16} />, label: 'Eventos' },
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
                                <td className="py-2 pr-4">{userItem.nombreCompleto || 'Sin nombre'}</td>
                                <td className="py-2 pr-4">{userItem.email}</td>
                                <td className="py-2 pr-4">
                                  <Chip 
                                    className={userItem.esAdmin ? 'bg-green-800 text-white' : 'bg-blue-100 text-blue-700'} 
                                    size="sm"
                                  >
                                    {userItem.esAdmin ? 'Admin' : 'Usuario'}
                                  </Chip>
                                </td>
                                <td className="py-2 pr-4">
                                  {userItem.fechaCreacion ? formatDate(userItem.fechaCreacion.toDate ? userItem.fechaCreacion.toDate() : userItem.fechaCreacion) : 'N/A'}
                                </td>
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
                  <Button color="white" className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" size="sm">
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
                            <td className="py-2 pr-4">{userItem.nombreCompleto || 'Sin nombre'}</td>
                            <td className="py-2 pr-4">{userItem.email}</td>
                            <td className="py-2 pr-4">{formatPhoneNumber(userItem.telefono)}</td>
                            <td className="py-2 pr-4">
                              <Chip 
                                className={userItem.esAdmin ? 'bg-green-800 text-white' : 'bg-blue-100 text-blue-700'} 
                                size="sm"
                              >
                                {userItem.esAdmin ? 'Admin' : 'Usuario'}
                              </Chip>
                            </td>
                            <td className="py-2 pr-4">
                              {userItem.fechaCreacion ? formatDate(userItem.fechaCreacion.toDate ? userItem.fechaCreacion.toDate() : userItem.fechaCreacion) : 'N/A'}
                            </td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  color={userItem.esAdmin ? 'warning' : 'success'}
                                  onPress={() => handleUserAction(userItem.id, userItem.esAdmin)}
                                >
                                  {userItem.esAdmin ? 'Degradar' : 'Promover'}
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
                  <Button color="white" className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" size="sm" onPress={handleCreateCancha}>
                    <FaPlus className="mr-1" />
                    Nueva Cancha
                  </Button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {canchas.map(cancha => (
                      <Card key={cancha.id} className="h-full p-4">
                        {(cancha.imagenPrincipal || cancha.imagen) && (
                          <img 
                            src={cancha.imagenPrincipal || cancha.imagen} 
                            alt={cancha.nombre || 'Cancha'}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="m-0">{cancha.nombre || 'Sin nombre'}</h5>
                          <Chip 
                            className={cancha.activo ? 'bg-success text-white' : 'bg-default text-default-foreground'} 
                            size="sm"
                          >
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
                  <div className="flex items-center justify-between gap-4">
                    <Input
                      placeholder="Buscar por usuario, cancha, email, estado..."
                      value={reservaSearchTerm}
                      onValueChange={setReservaSearchTerm}
                      className="flex-1 max-w-md"
                      startContent={<FaSearch />}
                    />
                    <Chip className="bg-primary text-white" size="sm">
                      Total: {filteredReservas.length} / {reservas.length}
                  </Chip>
                </div>
                </div>
                <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-600">
                      <tr>
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Usuario</th>
                        <th className="py-2 pr-4">Cancha</th>
                        <th className="py-2 pr-4">Hora</th>
                        <th className="py-2 pr-4">Duración</th>
                        <th className="py-2 pr-4">Total</th>
                        <th className="py-2 pr-4">Estado</th>
                        <th className="py-2 pr-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservas.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-8 text-gray-500">
                            {reservaSearchTerm ? 'No se encontraron reservas que coincidan con la búsqueda' : 'No hay reservas registradas'}
                          </td>
                        </tr>
                      ) : (
                        groupReservasByDate(filteredReservas).map(({ fecha, reservas: reservasFecha }) => (
                          <React.Fragment key={fecha}>
                            <tr className="bg-gray-100 border-t border-b-2 border-gray-300">
                              <td colSpan="8" className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FaCalendarCheck className="text-primary" />
                                  <span className="font-semibold text-gray-700">{formatDate(fecha)}</span>
                                  <span className="text-gray-500 text-xs">({reservasFecha.length} {reservasFecha.length === 1 ? 'reserva' : 'reservas'})</span>
                                </div>
                              </td>
                            </tr>
                            {reservasFecha.map(reserva => (
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
                            <td className="py-2 pr-4">{reserva.startTime}</td>
                            <td className="py-2 pr-4">{reserva.duration}h</td>
                            <td className="py-2 pr-4">{formatCurrency(reserva.total)}</td>
                            <td className="py-2 pr-4">
                              <Chip 
                                color={reserva.estadoPago === 'pagado' ? 'success' : reserva.estadoPago === 'cancelado' ? 'danger' : 'warning'} 
                                size="sm"
                              >
                                {reserva.estadoPago === 'pagado' ? 'Pagado' : reserva.estadoPago === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                              </Chip>
                            </td>
                            <td className="py-2 pr-4">
                                  <Dropdown>
                                    <DropdownTrigger>
                                <Button 
                                  size="sm" 
                                        variant="light"
                                        isIconOnly
                                        className="min-w-0"
                                >
                                        <FaEllipsisV />
                                </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Acciones de reserva">
                                      <DropdownItem 
                                        key="view"
                                        startContent={<FaEye />}
                                        onPress={() => handleViewReservaDetails(reserva)}
                                      >
                                        Ver Detalles
                                      </DropdownItem>
                                      <DropdownItem 
                                        key="edit"
                                        startContent={<FaEdit />}
                                  onPress={() => handleEditReserva(reserva)}
                                >
                                        Editar
                                      </DropdownItem>
                                      <DropdownItem 
                                        key="delete"
                                        className="text-danger"
                                  color="danger"
                                        startContent={<FaTrash />}
                                  onPress={() => handleDeleteReservaClick(reserva.id)}
                                >
                                        Eliminar
                                      </DropdownItem>
                                    </DropdownMenu>
                                  </Dropdown>
                            </td>
                          </tr>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </Card>
            )}

            {activeTab === 'eventos' && (
              <Card>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h4 className="m-0">Gestión de Eventos</h4>
                  <Button 
                    color="white" 
                    className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50" 
                    size="sm" 
                    onPress={handleCreateEvento}
                  >
                    <FaPlus className="mr-1" />
                    Nuevo Evento
                  </Button>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-600">
                        <tr>
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Nombre</th>
                          <th className="py-2 pr-4">Cancha</th>
                          <th className="py-2 pr-4">Fecha</th>
                          <th className="py-2 pr-4">Hora Inicio</th>
                          <th className="py-2 pr-4">Hora Fin</th>
                          <th className="py-2 pr-4">Estado</th>
                          <th className="py-2 pr-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventos.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-8 text-center text-gray-500">
                              No hay eventos registrados
                            </td>
                          </tr>
                        ) : (
                          eventos.map(evento => (
                            <tr key={evento.id} className="border-t">
                              <td className="py-2 pr-4">#{evento.id.slice(0, 8)}</td>
                              <td className="py-2 pr-4">
                                <div>
                                  <div className="font-medium">{evento.nombre}</div>
                                  {evento.descripcion && (
                                    <small className="text-gray-500">{evento.descripcion.substring(0, 50)}...</small>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 pr-4">{evento.canchaName}</td>
                              <td className="py-2 pr-4">{formatDate(evento.fecha)}</td>
                              <td className="py-2 pr-4">{formatTime12h(evento.horaInicio)}</td>
                              <td className="py-2 pr-4">{formatTime12h(evento.horaFin)}</td>
                              <td className="py-2 pr-4">
                                <Chip 
                                  className={evento.activo ? 'bg-success text-white' : 'bg-default text-default-foreground'} 
                                  size="sm"
                                >
                                  {evento.activo ? 'Activo' : 'Inactivo'}
                                </Chip>
                              </td>
                              <td className="py-2 pr-4">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="bordered" 
                                    color="success"
                                    onPress={() => handleEditEvento(evento)}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="bordered" 
                                    color="danger"
                                    onPress={() => handleDeleteEventoClick(evento.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                    <Button 
                      color="primary" 
                      size="sm" 
                      onPress={() => setIsStepsFormOpen(true)}
                      className="text-white [&>span]:text-white"
                    >
                      <FaEdit className="mr-1" />
                      Editar Pasos
                    </Button>
                  </div>
                  <div className="p-4">
                    {loadingSteps ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                          <div className="flex items-center gap-2">
                            <FaHome />
                            <span>Edita los videos, títulos y descripciones de los pasos del proceso de reserva.</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Chip color="primary" size="sm" className="text-white">
                              {steps.length} {steps.length === 1 ? 'Paso configurado' : 'Pasos configurados'}
                            </Chip>
                          </div>
                          {steps.length > 0 ? (
                            <div className="space-y-2">
                              {steps.map((step, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-gray-900 mb-1 truncate">{step.title || 'Sin título'}</h5>
                                      <p className="text-sm text-gray-600 line-clamp-2">{step.desc || 'Sin descripción'}</p>
                                      {step.imagen && (
                                        <div className="mt-2">
                                          <img 
                                            src={step.imagen} 
                                            alt={step.title || `Paso ${index + 1}`}
                                            className="w-24 h-16 object-cover rounded border border-gray-300"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <p>No hay pasos configurados aún.</p>
                              <p className="text-sm mt-1">Haz clic en "Editar Pasos" para agregar contenido.</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="m-0">Logos Confiados</h4>
                      <p className="text-sm text-gray-500 m-0">Gestiona los logos que se muestran en TrustedBy</p>
                    </div>
                    <Button 
                      color="primary" 
                      size="sm" 
                      onPress={() => setIsTrustedByFormOpen(true)}
                      className="text-white [&>span]:text-white"
                    >
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

      <EventoForm
        isOpen={isEventoFormOpen}
        onClose={handleCloseEventoForm}
        evento={selectedEvento}
        onSuccess={handleEventoFormSuccess}
      />

      <StepsForm
        isOpen={isStepsFormOpen}
        onClose={() => setIsStepsFormOpen(false)}
        onSuccess={() => {
          loadData();
          loadSteps();
        }}
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

      {/* Modal de Detalles de Reserva */}
      <Modal isOpen={isReservaDetailModalOpen} onClose={() => setIsReservaDetailModalOpen(false)} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Detalles de la Reserva</h3>
          </ModalHeader>
          <ModalBody>
            {selectedReserva && (
              <div className="space-y-4">
                {/* Imagen de la cancha */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={selectedReserva.canchaImage || '/images/futbol1.jpg'}
                    alt={selectedReserva.canchaName}
                    className="w-full max-w-md h-48 object-cover rounded-lg shadow-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ID de Reserva</p>
                    <p className="font-semibold">#{selectedReserva.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Usuario</p>
                    <p className="font-semibold">{selectedReserva.userName}</p>
                    <small className="text-gray-500">{selectedReserva.userEmail}</small>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cancha</p>
                    <p className="font-semibold">{selectedReserva.canchaName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha</p>
                    <p className="font-semibold">{formatDate(selectedReserva.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hora de Inicio</p>
                    <p className="font-semibold">{formatTime12h(selectedReserva.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Hora de Fin</p>
                    <p className="font-semibold">{formatTime12h(selectedReserva.horaFin)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duración</p>
                    <p className="font-semibold">{selectedReserva.duration} horas</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado de Pago</p>
                    <Chip 
                      color={selectedReserva.estadoPago === 'pagado' ? 'success' : selectedReserva.estadoPago === 'cancelado' ? 'danger' : 'warning'} 
                      size="sm"
                    >
                      {selectedReserva.estadoPago === 'pagado' ? 'Pagado' : selectedReserva.estadoPago === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Método de Pago</p>
                    <p className="font-semibold">{selectedReserva.metodoPago || 'No especificado'}</p>
                  </div>
                </div>
                
                {selectedReserva.notas && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notas</p>
                    <p className="font-semibold">{selectedReserva.notas}</p>
                  </div>
                )}

                {selectedReserva.codigoDescuento && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-sm text-gray-500 mb-1">Descuento Aplicado</p>
                    <p className="font-semibold text-green-700">Código: {selectedReserva.codigoDescuento}</p>
                    {selectedReserva.montoDescuento > 0 && (
                      <p className="text-sm text-green-600">Descuento: {formatCurrency(selectedReserva.montoDescuento)}</p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(selectedReserva.subtotal || selectedReserva.total)}</span>
                  </div>
                  {selectedReserva.montoDescuento > 0 && (
                    <div className="flex justify-between items-center mb-2 text-green-600">
                      <span>Descuento:</span>
                      <span>- {formatCurrency(selectedReserva.montoDescuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold text-success border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedReserva.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsReservaDetailModalOpen(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ReservaForm
        isOpen={isReservaEditModalOpen}
        onClose={handleCloseReservaForm}
        reserva={editingReserva}
        onSuccess={handleReservaFormSuccess}
      />

      {/* Modal de Confirmación de Eliminación de Reserva */}
      <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => setIsDeleteConfirmModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Confirmar Eliminación</h3>
          </ModalHeader>
          <ModalBody>
            <p>¿Estás seguro de que quieres eliminar esta reserva?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleConfirmDeleteReserva}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmación de Eliminación de Evento */}
      <Modal isOpen={isDeleteEventoModalOpen} onClose={() => setIsDeleteEventoModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Confirmar Eliminación</h3>
          </ModalHeader>
          <ModalBody>
            <p>¿Estás seguro de que quieres eliminar este evento?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteEventoModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleConfirmDeleteEvento}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Admin;