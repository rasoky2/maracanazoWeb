import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AuthService } from '../services/Auth.service.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authServiceRef = React.useRef(new AuthService());

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = authServiceRef.current.onAuthStateChange(async firebaseUser => {
      if (firebaseUser) {
        try {
          // firebaseUser ya contiene los datos de Firestore desde onAuthStateChange
          const userData = firebaseUser;
          
          // Normalizar el usuario - asegurar que urlFoto y otros campos estén disponibles
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...userData,
            urlFoto: userData.urlFoto || firebaseUser.photoURL || '',
            nombreCompleto: userData.nombreCompleto || firebaseUser.displayName || '',
            telefono: userData.telefono || '',
            esAdmin: userData.esAdmin === true
          });
        } catch (error) {
          console.info('Error obteniendo datos del usuario:', error.message);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      return await authServiceRef.current.login(email, password);
    } catch (error) {
      console.info('Error in login:', error.message);
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      return await authServiceRef.current.register(email, password, userData);
    } catch (error) {
      console.info('Error in register:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authServiceRef.current.logout();
      setUser(null);
    } catch (error) {
      console.info('Error in logout:', error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      return await authServiceRef.current.loginWithGoogle();
    } catch (error) {
      console.info('Error in Google login:', error.message);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    isAuthenticated: !!user
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};
