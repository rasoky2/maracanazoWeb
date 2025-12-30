import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  SelectItem,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner
} from '@heroui/react';
import { FaUpload, FaImage, FaTrash } from 'react-icons/fa';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { Cancha } from '../models/Cancha.model.js';
import { StorageService } from '../services/Storage.service.js';
import ImageCropper from './ImageCropper.jsx';

const DAYS_OF_WEEK = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

const CanchaForm = ({ isOpen, onClose, cancha = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canchaRepository = new CanchaRepository();
  const storageService = new StorageService();

  const [formData, setFormData] = useState({
    name: '',
    type: 'futbol',
    size: 'grande',
    description: '',
    price: 0,
    image: '',
    imagePrincipal: '',
    imageCard: '',
    image1: '',
    image2: '',
    isActive: true,
    pricing: {
      morning: { start: '07:00', end: '17:00', price: 0 },
      evening: { start: '17:00', end: '00:00', price: 0 }
    },
    weeklyPricing: null
  });

  const [useWeeklyPricing, setUseWeeklyPricing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState({});
  const [cropImage, setCropImage] = useState({ file: null, field: null, open: false });

  useEffect(() => {
    if (cancha) {
      const precios = cancha.precios || cancha.pricing;
      const preciosSemanales = cancha.preciosSemanales || cancha.weeklyPricing;
      
      setFormData({
        name: cancha.nombre || cancha.name || '',
        type: cancha.tipo || cancha.type || 'futbol',
        size: cancha.tamano || cancha.size || 'grande',
        description: cancha.descripcion || cancha.description || '',
        price: cancha.precio || cancha.price || 0,
        image: cancha.imagen || cancha.imagePrincipal || cancha.image || '',
        imagePrincipal: cancha.imagenPrincipal || cancha.imagen || cancha.imagePrincipal || cancha.image || '',
        imageCard: cancha.imagenTarjeta || cancha.imagenCard || cancha.imageCard || '',
        image1: cancha.imagen1 || cancha.image1 || '',
        image2: cancha.imagen2 || cancha.image2 || '',
        isActive: cancha.activo !== undefined ? cancha.activo : (cancha.isActive !== undefined ? cancha.isActive : true),
        pricing: precios ? {
          morning: { 
            start: precios.manana?.inicio || precios.morning?.start || '07:00', 
            end: precios.manana?.fin || precios.morning?.end || '17:00', 
            price: precios.manana?.precio || precios.morning?.price || 0 
          },
          evening: { 
            start: precios.noche?.inicio || precios.evening?.start || '17:00', 
            end: precios.noche?.fin || precios.evening?.end || '00:00', 
            price: precios.noche?.precio || precios.evening?.price || 0 
          }
        } : (cancha.pricing || {
          morning: { start: '07:00', end: '17:00', price: 0 },
          evening: { start: '17:00', end: '00:00', price: 0 }
        }),
        weeklyPricing: preciosSemanales ? Object.keys(preciosSemanales).reduce((acc, day) => {
          const dayPricing = preciosSemanales[day];
          acc[day] = {
            morning: {
              start: dayPricing.manana?.inicio || dayPricing.morning?.start || '07:00',
              end: dayPricing.manana?.fin || dayPricing.morning?.end || '17:00',
              price: dayPricing.manana?.precio || dayPricing.morning?.price || 0
            },
            evening: {
              start: dayPricing.noche?.inicio || dayPricing.evening?.start || '17:00',
              end: dayPricing.noche?.fin || dayPricing.evening?.end || '00:00',
              price: dayPricing.noche?.precio || dayPricing.evening?.price || 0
            }
          };
          return acc;
        }, {}) : (cancha.weeklyPricing || null)
      });
      setUseWeeklyPricing(!!preciosSemanales || !!cancha.weeklyPricing);
    } else {
      resetForm();
    }
  }, [cancha, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'futbol',
      size: 'grande',
      description: '',
      price: 0,
      image: '',
      imagePrincipal: '',
      imageCard: '',
      image1: '',
      image2: '',
      isActive: true,
      pricing: {
        morning: { start: '07:00', end: '17:00', price: 0 },
        evening: { start: '17:00', end: '00:00', price: 0 }
      },
      weeklyPricing: null
    });
    setUseWeeklyPricing(false);
    setError('');
    setUploadingImages({});
  };

  const handleImageSelect = (field, e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCropImage({ file, field, open: true });
    }
    e.target.value = '';
  };

  // Convertir imagen a WebP
  const convertToWebP = (blob) => {
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
      reader.readAsDataURL(blob);
    });
  };

  const handleCropComplete = async (blob, field) => {
    try {
      setUploadingImages(prev => ({ ...prev, [field]: true }));
      
      // Convertir a WebP antes de subir
      const webpBlob = await convertToWebP(blob);
      
      const canchaId = cancha?.id || `temp_${Date.now()}`;
      const imagePath = storageService.generateImagePath(canchaId, field, 'webp');
      const imageUrl = await storageService.uploadImageFromBlob(webpBlob, imagePath);
      
      handleInputChange(field, imageUrl);
      setUploadingImages(prev => ({ ...prev, [field]: false }));
      setCropImage({ file: null, field: null, open: false });
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Error al subir la imagen: ' + err.message);
      setUploadingImages(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleRemoveImage = (field) => {
    const currentUrl = formData[field];
    if (currentUrl && currentUrl.includes('firebasestorage')) {
      storageService.deleteImage(currentUrl).catch(console.error);
    }
    handleInputChange(field, '');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, subChild] = field.split('.');
      if (subChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleWeeklyPricingChange = (day, field, value) => {
    setFormData(prev => {
      const weeklyPricing = prev.weeklyPricing || {};
      const dayPricing = weeklyPricing[day] || {
        morning: { start: '07:00', end: '17:00', price: 0 },
        evening: { start: '17:00', end: '00:00', price: 0 }
      };

      const [parent, child] = field.split('.');
      dayPricing[parent] = {
        ...dayPricing[parent],
        [child]: value
      };

      return {
        ...prev,
        weeklyPricing: {
          ...weeklyPricing,
          [day]: dayPricing
        }
      };
    });
  };

  const initializeWeeklyPricing = () => {
    const weeklyPricing = {};
    DAYS_OF_WEEK.forEach(day => {
      weeklyPricing[day.key] = {
        morning: { ...formData.pricing.morning },
        evening: { ...formData.pricing.evening }
      };
    });
    setFormData(prev => ({
      ...prev,
      weeklyPricing
    }));
  };

  const handleToggleWeeklyPricing = (checked) => {
    setUseWeeklyPricing(checked);
    if (checked && !formData.weeklyPricing) {
      initializeWeeklyPricing();
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!formData.name.trim()) {
      setError('El nombre de la cancha es requerido');
      return;
    }

    if (formData.pricing.morning.price <= 0 && formData.pricing.evening.price <= 0) {
      setError('Debe establecer al menos un precio mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const weeklyPricingConverted = useWeeklyPricing && formData.weeklyPricing ? 
        Object.keys(formData.weeklyPricing).reduce((acc, day) => {
          const dayPricing = formData.weeklyPricing[day];
          acc[day] = {
            manana: {
              inicio: dayPricing.morning.start,
              fin: dayPricing.morning.end,
              precio: dayPricing.morning.price
            },
            noche: {
              inicio: dayPricing.evening.start,
              fin: dayPricing.evening.end,
              precio: dayPricing.evening.price
            }
          };
          return acc;
        }, {}) : null;

      const canchaData = {
        nombre: formData.name,
        tipo: formData.type,
        tamano: formData.size,
        descripcion: formData.description,
        precio: formData.price,
        imagen: formData.imagePrincipal || formData.image,
        imagenPrincipal: formData.imagePrincipal || formData.image,
        imagenTarjeta: formData.imageCard,
        imagen1: formData.image1,
        imagen2: formData.image2,
        activo: formData.isActive,
        precios: {
          manana: {
            inicio: formData.pricing.morning.start,
            fin: formData.pricing.morning.end,
            precio: formData.pricing.morning.price
          },
          noche: {
            inicio: formData.pricing.evening.start,
            fin: formData.pricing.evening.end,
            precio: formData.pricing.evening.price
          }
        },
        preciosSemanales: weeklyPricingConverted
      };

      let savedCancha;
      if (cancha) {
        savedCancha = await canchaRepository.update(cancha.id, canchaData);
      } else {
        savedCancha = await canchaRepository.create(canchaData);
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving cancha:', err);
      setError('Error al guardar la cancha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadField = ({ label, field, aspectRatio = null }) => {
    const imageUrl = formData[field];
    const isUploading = uploadingImages[field];

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="relative group">
              <img
                src={imageUrl}
                alt={label}
                className="w-24 h-24 object-cover rounded-lg border border-gray-300"
              />
              <Button
                size="sm"
                color="danger"
                variant="flat"
                isIconOnly
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => handleRemoveImage(field)}
              >
                <FaTrash size={12} />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {isUploading ? (
                <Spinner size="sm" />
              ) : (
                <FaImage className="text-gray-400" size={24} />
              )}
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(field, e)}
              className="hidden"
              id={`image-${field}`}
            />
            <Button
              as="label"
              htmlFor={`image-${field}`}
              size="sm"
              variant="bordered"
              startContent={<FaUpload />}
              isDisabled={isUploading}
            >
              {imageUrl ? 'Cambiar' : 'Subir'} Imagen
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {cancha ? 'Editar Cancha' : 'Nueva Cancha'}
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de la Cancha"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                isRequired
                placeholder="Ej: Cancha Fútbol 1"
              />
              <Select
                label="Tipo"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => handleInputChange('type', Array.from(keys)[0])}
              >
                <SelectItem key="futbol">Fútbol</SelectItem>
                <SelectItem key="voley">Vóley</SelectItem>
                <SelectItem key="basquet">Básquet</SelectItem>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tamaño"
                selectedKeys={[formData.size]}
                onSelectionChange={(keys) => handleInputChange('size', Array.from(keys)[0])}
              >
                <SelectItem key="grande">Grande</SelectItem>
                <SelectItem key="mediana">Mediana</SelectItem>
                <SelectItem key="pequeña">Pequeña</SelectItem>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Imágenes de la Cancha</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploadField 
                  label="Imagen Principal" 
                  field="imagePrincipal"
                  aspectRatio={16/9}
                />
                <ImageUploadField 
                  label="Imagen Card" 
                  field="imageCard"
                  aspectRatio={4/3}
                />
                <ImageUploadField 
                  label="Imagen 1" 
                  field="image1"
                />
                <ImageUploadField 
                  label="Imagen 2" 
                  field="image2"
                />
              </div>
              <div className="mt-3">
                <Input
                  label="URL de Imagen (Alternativa)"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="/images/futbol1.jpg"
                  description="Usa esta opción si prefieres usar una URL externa en lugar de subir"
                />
              </div>
            </div>

            <Textarea
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción de la cancha..."
              minRows={3}
            />

            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Precios por Horario</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Hora Inicio (Mañana)"
                  type="time"
                  value={formData.pricing.morning.start}
                  onChange={(e) => handleInputChange('pricing.morning.start', e.target.value)}
                />
                <Input
                  label="Hora Fin (Mañana)"
                  type="time"
                  value={formData.pricing.morning.end === '00:00' ? '23:59' : formData.pricing.morning.end}
                  onChange={(e) => handleInputChange('pricing.morning.end', e.target.value === '23:59' ? '00:00' : e.target.value)}
                />
                <Input
                  label="Precio Mañana (S/)"
                  type="number"
                  value={formData.pricing.morning.price}
                  onChange={(e) => handleInputChange('pricing.morning.price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Input
                  label="Hora Inicio (Noche)"
                  type="time"
                  value={formData.pricing.evening.start}
                  onChange={(e) => handleInputChange('pricing.evening.start', e.target.value)}
                />
                <Input
                  label="Hora Fin (Noche)"
                  type="time"
                  value={formData.pricing.evening.end === '00:00' ? '23:59' : formData.pricing.evening.end}
                  onChange={(e) => handleInputChange('pricing.evening.end', e.target.value === '23:59' ? '00:00' : e.target.value)}
                />
                <Input
                  label="Precio Noche (S/)"
                  type="number"
                  value={formData.pricing.evening.price}
                  onChange={(e) => handleInputChange('pricing.evening.price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-semibold">Precios por Día de la Semana</h5>
                  <p className="text-sm text-gray-500">Activa para establecer precios diferentes por día</p>
                </div>
                <Switch
                  isSelected={useWeeklyPricing}
                  onValueChange={handleToggleWeeklyPricing}
                >
                  Usar precios semanales
                </Switch>
              </div>

              {useWeeklyPricing && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {DAYS_OF_WEEK.map(day => {
                    const dayPricing = formData.weeklyPricing?.[day.key] || formData.pricing;
                    return (
                      <Card key={day.key} className="p-4">
                        <h6 className="font-semibold mb-3">{day.label}</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            label="Inicio Mañana"
                            type="time"
                            size="sm"
                            value={dayPricing.morning.start}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'morning.start', e.target.value)}
                          />
                          <Input
                            label="Fin Mañana"
                            type="time"
                            size="sm"
                            value={dayPricing.morning.end === '00:00' ? '23:59' : dayPricing.morning.end}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'morning.end', e.target.value === '23:59' ? '00:00' : e.target.value)}
                          />
                          <Input
                            label="Precio Mañana (S/)"
                            type="number"
                            size="sm"
                            value={dayPricing.morning.price}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'morning.price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <Input
                            label="Inicio Noche"
                            type="time"
                            size="sm"
                            value={dayPricing.evening.start}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'evening.start', e.target.value)}
                          />
                          <Input
                            label="Fin Noche"
                            type="time"
                            size="sm"
                            value={dayPricing.evening.end === '00:00' ? '23:59' : dayPricing.evening.end}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'evening.end', e.target.value === '23:59' ? '00:00' : e.target.value)}
                          />
                          <Input
                            label="Precio Noche (S/)"
                            type="number"
                            size="sm"
                            value={dayPricing.evening.price}
                            onChange={(e) => handleWeeklyPricingChange(day.key, 'evening.price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Switch
                isSelected={formData.isActive}
                onValueChange={(checked) => handleInputChange('isActive', checked)}
              >
                Cancha activa
              </Switch>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="bordered" 
            className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            onPress={handleSubmit} 
            isLoading={loading}
          >
            {cancha ? 'Guardar Cambios' : 'Crear Cancha'}
          </Button>
        </ModalFooter>
      </ModalContent>

      <ImageCropper
        isOpen={cropImage.open}
        onClose={() => setCropImage({ file: null, field: null, open: false })}
        imageFile={cropImage.file}
        onCropComplete={(blob) => handleCropComplete(blob, cropImage.field)}
        aspectRatio={cropImage.field === 'imagePrincipal' ? 16/9 : cropImage.field === 'imageCard' ? 4/3 : null}
      />
    </Modal>
  );
};

export default CanchaForm;
