import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext.jsx';

// Componente para verificar si el usuario es administrador
export const AdminOnly = ({ children, fallback = null }) => {
  const { user } = useAuth();
  
  const isAdmin = user?.esAdmin === true;
  
  if (!user || !isAdmin) {
    return fallback;
  }
  
  return children;
};

AdminOnly.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

// Hook para verificar permisos de administrador
export const useAdminCheck = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.esAdmin === true;
  
  return {
    isAdmin,
    user
  };
};

// Componente para mostrar contenido solo a administradores
export const AdminGuard = ({ children, showMessage = true }) => {
  const { isAdmin } = useAdminCheck();
  
  if (!isAdmin) {
    if (showMessage) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger text-center">
            <h4>Acceso Denegado</h4>
            <p>No tienes permisos para acceder a esta sección.</p>
            <p>Solo los administradores pueden acceder al panel de administración.</p>
          </div>
        </div>
      );
    }
    return null;
  }
  
  return children;
};

AdminGuard.propTypes = {
  children: PropTypes.node.isRequired,
  showMessage: PropTypes.bool
};
