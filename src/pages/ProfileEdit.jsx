import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Spinner, Avatar } from '@heroui/react';
import { FaUpload, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext.jsx';
import { UserRepository } from '../repositories/User.repository.js';
import { StorageService } from '../services/Storage.service.js';
import ImageCropper from '../components/ImageCropper.jsx';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    urlFoto: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImage, setCropImage] = useState({ file: null, open: false });

  const userRepository = new UserRepository();
  const storageService = new StorageService();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      setFormData({
        nombreCompleto: user.nombreCompleto || '',
        telefono: user.telefono || '',
        urlFoto: user.urlFoto || user.photoURL || ''
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
      // Verificar que el usuario existe
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el usuario completo desde Firestore primero
      if (!user?.email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      let userDoc;
      try {
        userDoc = await userRepository.getByEmail(user.email);
        if (!userDoc || !userDoc.id) {
          // Si no existe el documento, crearlo con los datos básicos
          userDoc = await userRepository.create({
            email: user.email,
            nombreCompleto: user.displayName || user.nombreCompleto || formData.nombreCompleto || '',
            telefono: user.telefono || formData.telefono || '',
            urlFoto: user.photoURL || user.urlFoto || formData.urlFoto || '',
            esAdmin: false
          });
        }
      } catch (err) {
        console.info('Error obteniendo usuario:', err.message);
        throw new Error('Error al obtener los datos del usuario. Por favor, intenta nuevamente.');
      }

      // Actualizar usuario en Firestore preservando todos los campos importantes
      await userRepository.update(userDoc.id, {
        email: userDoc.email || user.email, // Preservar el email
        nombreCompleto: formData.nombreCompleto.trim(),
        telefono: formData.telefono.trim(),
        urlFoto: formData.urlFoto || '',
        esAdmin: userDoc.esAdmin !== undefined ? userDoc.esAdmin : false, // Preservar esAdmin
        fechaCreacion: userDoc.fechaCreacion || new Date() // Preservar fechaCreacion
      });

      // Refrescar usuario en el contexto y actualizar cache
      await refreshUser();

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

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    setCropImage({ file, open: true });
  };

  const handleCropComplete = async (blob) => {
    try {
      setUploadingPhoto(true);
      setError('');
      
      // Verificar que el usuario existe
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      // Obtener el ID correcto del usuario desde Firestore
      let userId = user?.id;
      
      // Si no tenemos el ID, obtenerlo por email (obligatorio)
      if (!userId) {
        if (!user?.email) {
          throw new Error('No se pudo obtener el email del usuario');
        }
        try {
          const userDoc = await userRepository.getByEmail(user.email);
          if (!userDoc || !userDoc.id) {
            // Si no existe el documento, crearlo con los datos básicos
            const newUserDoc = await userRepository.create({
              email: user.email,
              nombreCompleto: user.displayName || user.nombreCompleto || '',
              telefono: user.telefono || '',
              urlFoto: user.photoURL || user.urlFoto || '',
              esAdmin: false
            });
            userId = newUserDoc.id;
          } else {
            userId = userDoc.id;
          }
        } catch (err) {
          console.info('Error obteniendo usuario:', err.message);
          throw new Error('Error al obtener los datos del usuario. Por favor, intenta nuevamente.');
        }
      }

      // Eliminar foto anterior si existe y es de Firebase Storage
      if (formData.urlFoto && formData.urlFoto.includes('firebasestorage')) {
        try {
          await storageService.deleteImage(formData.urlFoto);
        } catch (err) {
          console.info('Error eliminando foto anterior:', err.message);
        }
      }

      // Subir nueva foto
      const imagePath = storageService.generateUserImagePath(userId, 'jpg');
      const imageUrl = await storageService.uploadImageFromBlob(blob, imagePath, 'usuarios');
      
      // Actualizar formData con la nueva URL
      setFormData(prev => ({
        ...prev,
        urlFoto: imageUrl
      }));

      // Actualizar también en Firestore inmediatamente para que se refleje en el Header
      try {
        await userRepository.update(userId, {
          urlFoto: imageUrl
        });
        // Refrescar usuario en el contexto para actualizar Header
        await refreshUser();
      } catch (err) {
        console.info('Error actualizando foto en Firestore:', err.message);
        // No lanzamos error aquí porque la foto ya se subió correctamente
      }

      setCropImage({ file: null, open: false });
    } catch (err) {
      console.info('Error subiendo foto:', err);
      setError('Error al subir la foto. Por favor, intenta nuevamente.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      // Eliminar foto de Firebase Storage si existe
      if (formData.urlFoto && formData.urlFoto.includes('firebasestorage')) {
        try {
          await storageService.deleteImage(formData.urlFoto);
        } catch (err) {
          console.info('Error eliminando foto:', err.message);
        }
      }

      setFormData(prev => ({
        ...prev,
        urlFoto: ''
      }));
    } catch (err) {
      console.info('Error eliminando foto:', err);
      setError('Error al eliminar la foto.');
    }
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
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <Avatar
                  src={formData.urlFoto || undefined}
                  name={formData.nombreCompleto || user?.displayName || 'U'}
                  className="w-32 h-32 text-2xl"
                />
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Spinner size="sm" color="white" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label htmlFor="photo-upload">
                  <Button
                    as="span"
                    size="sm"
                    color="white"
                    className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    startContent={<FaUpload />}
                    isDisabled={uploadingPhoto || saving}
                  >
                    {formData.urlFoto ? 'Cambiar Foto' : 'Subir Foto'}
                  </Button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={uploadingPhoto || saving}
                  />
                </label>
                {formData.urlFoto && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="bordered"
                    startContent={<FaTrash />}
                    onPress={handleRemovePhoto}
                    isDisabled={uploadingPhoto || saving}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>

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

      <ImageCropper
        isOpen={cropImage.open}
        onClose={() => setCropImage({ file: null, open: false })}
        imageFile={cropImage.file}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </div>
  );
};

export default ProfileEdit;
