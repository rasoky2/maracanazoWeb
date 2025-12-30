import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Input,
  Spinner
} from '@heroui/react';
import { FaPlus, FaTrash, FaSave, FaImage } from 'react-icons/fa';
import { HomeContentRepository } from '../repositories/HomeContent.repository.js';
import { StorageService } from '../services/Storage.service.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const TrustedByForm = ({ isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logos, setLogos] = useState([{ alt: '', src: '' }]);
  const [uploadingImages, setUploadingImages] = useState({});
  const repository = new HomeContentRepository();
  const storageService = new StorageService();

  useEffect(() => {
    if (isOpen) {
      loadLogos();
    }
  }, [isOpen]);

  const loadLogos = async () => {
    setLoading(true);
    try {
      const data = await repository.getTrustedBy();
      if (data.length > 0) {
        setLogos(data);
      }
    } catch (err) {
      console.info('Error loading logos:', err.message);
      setError('Error al cargar los logos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (index, field, value) => {
    const newLogos = [...logos];
    newLogos[index] = { ...newLogos[index], [field]: value };
    setLogos(newLogos);
  };

  // Convertir imagen a WebP
  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                resolve(webpBlob);
              } else {
                reject(new Error('Error al convertir a WebP'));
              }
            },
            'image/webp',
            0.85 // Calidad del 85% para balance entre tamaño y calidad
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (index, file) => {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    // Verificar autenticación antes de subir
    if (!isAuthenticated || !user) {
      setError('Debes estar autenticado para subir imágenes');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [index]: true }));
    try {
      // Convertir a WebP antes de subir
      const webpBlob = await convertToWebP(file);
      const timestamp = Date.now();
      const imagePath = `trustedBy/logo_${index}_${timestamp}.webp`;
      const imageUrl = await storageService.uploadImageFromBlob(webpBlob, imagePath);
      handleLogoChange(index, 'src', imageUrl);
    } catch (err) {
      console.info('Error uploading image:', err.message);
      setError(`Error al subir la imagen: ${err.message}`);
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleAddLogo = () => {
    setLogos([...logos, { alt: '', src: '' }]);
  };

  const handleRemoveLogo = index => {
    if (logos.length > 1) {
      const newLogos = logos.filter((_, i) => i !== index);
      setLogos(newLogos);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    const incomplete = logos.some(logo => !logo.alt || !logo.src);
    if (incomplete) {
      setError('Todos los campos deben estar completos');
      setSaving(false);
      return;
    }

    try {
      await repository.saveTrustedBy(logos);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.info('Error saving logos:', err.message);
      setError('Error al guardar los logos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <FaSave />
            Editar Logos Confiados
          </div>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {logos.map((logo, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Logo {index + 1}</h4>
                      {logos.length > 1 && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          isIconOnly
                          onPress={() => handleRemoveLogo(index)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {logo.src ? (
                        <img
                          src={logo.src}
                          alt={logo.alt}
                          className="w-24 h-24 object-contain rounded-lg border border-gray-300 bg-gray-50"
                        />
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          {uploadingImages[index] ? (
                            <Spinner size="sm" />
                          ) : (
                            <FaImage className="text-gray-400" size={24} />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <Input
                          label="Nombre/Alt"
                          value={logo.alt}
                          onChange={e => handleLogoChange(index, 'alt', e.target.value)}
                          placeholder="Ej: Club Deportivo..."
                          isRequired
                        />
                        
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(index, e.target.files?.[0])}
                            className="hidden"
                            id={`logo-upload-${index}`}
                          />
                          <Button
                            as="label"
                            htmlFor={`logo-upload-${index}`}
                            size="sm"
                            variant="bordered"
                            startContent={<FaImage />}
                            isDisabled={uploadingImages[index]}
                          >
                            {logo.src ? 'Cambiar' : 'Subir'} Imagen
                          </Button>
                          
                          <Input
                            label="URL (Alternativa)"
                            value={logo.src}
                            onChange={e => handleLogoChange(index, 'src', e.target.value)}
                            placeholder="https://..."
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<FaPlus />}
                  onPress={handleAddLogo}
                  className="w-full"
                >
                  Agregar Logo
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={saving}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={saving}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TrustedByForm;

