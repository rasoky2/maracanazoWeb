import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  DropdownSection,
  Button, 
  Avatar 
} from '@heroui/react';
import { 
  FaCalendarAlt,
  FaPhone,
  FaUser,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext.jsx';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.info('Error al cerrar sesión:', error.message);
    }
  };

  const handleLogoutClick = useCallback(() => {
    handleLogout();
  }, [logout, navigate]);

  const getFirstName = displayName => {
    if (!displayName) {
      return 'Usuario';
    }
    return displayName.split(' ')[0];
  };

  const getInitials = displayName => {
    if (!displayName) {
      return 'U';
    }
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    return user?.nombreCompleto || user?.displayName || 'Usuario';
  };

  const getUserPhoto = () => user?.urlFoto || user?.photoURL || '';

  const isAdmin = user?.esAdmin === true;

  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900 text-white shadow z-50">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between w-full">
        <Link to="/" className="font-semibold text-xl whitespace-nowrap">Maracanazo</Link>
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 flex-shrink-0">
          <Link to="/canchas" className="text-sm hover:text-gray-200 flex items-center gap-1 whitespace-nowrap">
            <FaCalendarAlt size={16} />Canchas
          </Link>
          <Link to="/contact" className="text-sm hover:text-gray-200 flex items-center gap-1 whitespace-nowrap">
            <FaPhone size={16} />Contacto
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm hover:text-gray-200 flex items-center gap-1 whitespace-nowrap"
            >
              <FaCog size={16} />Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {user ? (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="light" className="bg-transparent text-white min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      className="w-8 h-8 text-xs font-bold flex-shrink-0"
                      name={getInitials(getUserDisplayName())}
                      src={getUserPhoto() || undefined}
                    />
                    <span className="hidden sm:inline whitespace-nowrap">{getFirstName(getUserDisplayName())}</span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="user menu">
                <DropdownItem key="profile" href="/profile" startContent={<FaUser size={14} />}>Mi Perfil</DropdownItem>
                <DropdownItem key="reservations" href="/reservations" startContent={<FaCalendarAlt size={14} />}>Mis Reservas</DropdownItem>
                {isAdmin && (
                  <DropdownItem key="admin" href="/admin" startContent={<FaCog size={14} />}>Panel Admin</DropdownItem>
                )}
                <DropdownSection>
                  <DropdownItem 
                    key="logout" 
                    className="text-danger" 
                    color="danger" 
                    startContent={<FaSignOutAlt size={14} />} 
                    onPress={handleLogoutClick}
                  >
                    Cerrar Sesión
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm whitespace-nowrap">Iniciar Sesión</Link>
            </div>
          )}
          <Link to="/canchas" className="flex-shrink-0">
            <Button color="success" size="sm" className="whitespace-nowrap">Reservar Ahora</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
