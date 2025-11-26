import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { Button, Input, Card } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';

const MIN_PASSWORD_LENGTH = 6;

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handlers = useMemo(() => ({
    handleChange: e => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    },
    handleSubmit: async e => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      if (formData.password.length < MIN_PASSWORD_LENGTH) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      try {
        const userData = {
          name: formData.name,
          phone: formData.phone
        };

        const result = await register(formData.email, formData.password, userData);
        
        if (result.success) {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Error al registrar usuario');
      } finally {
        setLoading(false);
      }
    },

    handleGoogleLogin: async () => {
      setLoading(true);
      setError('');

      try {
        const result = await loginWithGoogle();
        
        if (result.success) {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Error al registrarse con Google');
      } finally {
        setLoading(false);
      }
    }
  }), [formData, register, navigate, loginWithGoogle]);

  const buttonText = useMemo(() => loading ? 'Creando cuenta...' : 'Crear Cuenta', [loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="w-full max-w-2xl px-4">
        <Card className="p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Crear Cuenta</h2>
            <p className="text-sm text-gray-500">Regístrate para reservar canchas y disfrutar de nuestros servicios</p>
          </div>

          <form onSubmit={handlers.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                name="name"
                label="Nombre Completo"
                value={formData.name}
                onChange={handlers.handleChange}
                isRequired
              />
              <Input
                type="tel"
                name="phone"
                label="Teléfono"
                value={formData.phone}
                onChange={handlers.handleChange}
                placeholder="+51 999 999 999"
                isRequired
              />
            </div>

            <Input
              type="email"
              name="email"
              label="Correo Electrónico"
              value={formData.email}
              onChange={handlers.handleChange}
              isRequired
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="password"
                name="password"
                label="Contraseña"
                value={formData.password}
                onChange={handlers.handleChange}
                minLength={MIN_PASSWORD_LENGTH}
                isRequired
              />
              <Input
                type="password"
                name="confirmPassword"
                label="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={handlers.handleChange}
                isRequired
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              color="success"
              className="w-full"
              isDisabled={loading}
              isLoading={loading}
            >
              {buttonText}
            </Button>

            <div className="text-center text-sm text-gray-500">o</div>

            <Button
              type="button"
              variant="bordered"
              color="primary"
              className="w-full"
              onPress={handlers.handleGoogleLogin}
              isDisabled={loading}
              startContent={<FaGoogle />}
            >
              Continuar con Google
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta? <Link to="/login" className="text-success">Inicia sesión aquí</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
