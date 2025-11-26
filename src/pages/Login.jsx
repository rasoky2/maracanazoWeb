import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { Button, Input, Card } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleClick = () => {
    handleGoogleLogin();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="w-full max-w-md px-4">
        <Card className="p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500">Accede a tu cuenta para reservar canchas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Correo Electrónico"
              value={formData.email}
              onChange={handleChange}
              isRequired
            />

            <Input
              type="password"
              name="password"
              label="Contraseña"
              value={formData.password}
              onChange={handleChange}
              isRequired
            />

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
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>

            <div className="text-center text-sm text-gray-500">o</div>

            <Button
              type="button"
              variant="bordered"
              color="primary"
              className="w-full"
              onPress={handleGoogleClick}
              isDisabled={loading}
              startContent={<FaGoogle />}
            >
              Continuar con Google
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta? <Link to="/register" className="text-success">Regístrate aquí</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
