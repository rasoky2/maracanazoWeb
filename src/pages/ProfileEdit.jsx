import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Spinner } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { UserRepository } from '../repositories/User.repository.js';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userRepository = new UserRepository();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      setFormData({
        nombreCompleto: user.nombreCompleto || '',
        telefono: user.telefono || ''
      });
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.nombreCompleto.trim()) {
      setError('El nombre completo es requerido');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userId = user?.id || user?.uid;
      if (!userId) {
        throw new Error('No se pudo identificar al usuario');
      }

      await userRepository.update(userId, {
        nombreCompleto: formData.nombreCompleto.trim(),
        telefono: formData.telefono.trim()
      });

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.info('Error actualizando perfil:', error);
      setError('Error al actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <Spinner color="success" size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Editar Perfil</h1>
          <p className="text-lg text-gray-600">Actualiza tu información personal</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <Input
              label="Nombre Completo"
              placeholder="Ingresa tu nombre completo"
              value={formData.nombreCompleto}
              onValueChange={(value) => handleInputChange('nombreCompleto', value)}
              isRequired
              variant="bordered"
            />

            <Input
              label="Teléfono"
              placeholder="Ingresa tu número de teléfono"
              value={formData.telefono}
              onValueChange={(value) => handleInputChange('telefono', value)}
              variant="bordered"
            />

            <Input
              label="Email"
              value={user.email || ''}
              isDisabled
              variant="bordered"
              description="El email no se puede modificar"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                color="success"
                className="flex-1"
                onPress={handleSave}
                isLoading={saving}
                isDisabled={saving}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="bordered"
                className="flex-1"
                onPress={handleCancel}
                isDisabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileEdit;

