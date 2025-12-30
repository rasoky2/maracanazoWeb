import React, { useState, useEffect } from 'react';
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Spinner
} from '@heroui/react';
import { FaImage } from 'react-icons/fa';
import { EventoRepository } from '../repositories/Evento.repository.js';
import { CanchaRepository } from '../repositories/Cancha.repository.js';
import { StorageService } from '../services/Storage.service.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import ImageCropper from './ImageCropper.jsx';
import { cropTo16x9 } from '../utils/cropTo16x9.js';

const EventoForm = ({ isOpen, onClose, evento = null, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canchas, setCanchas] = useState([]);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperFile, setCropperFile] = useState(null);
  const eventoRepository = new EventoRepository();
  const canchaRepository = new CanchaRepository();
  const storageService = new StorageService();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    idCancha: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    activo: true,
    imagen: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCanchas();
      if (evento) {
        setFormData({
          nombre: evento.nombre || '',
          descripcion: evento.descripcion || '',
          idCancha: evento.idCancha || '',
          fecha: evento.fecha || '',
          horaInicio: evento.horaInicio || '',
          horaFin: evento.horaFin || '',
          activo: evento.activo !== undefined ? evento.activo : true,
          imagen: evento.imagen || ''
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          idCancha: '',
          fecha: '',
          horaInicio: '',
          horaFin: '',
          activo: true,
          imagen: ''
        });
      }
      setError('');
      setSelectedCancha(null);
    }
  }, [isOpen, evento]);

  useEffect(() => {
    const loadSelectedCancha = async () => {
      if (formData.idCancha) {
        try {
          const canchaData = await canchaRepository.getById(formData.idCancha);
          setSelectedCancha(canchaData);
          
          // Si no hay imagen y la cancha tiene imagen, usar la de la cancha
          if (!formData.imagen && (canchaData.imagenPrincipal || canchaData.imagen)) {
            setFormData(prev => ({
              ...prev,
              imagen: canchaData.imagenPrincipal || canchaData.imagen || ''
            }));
          }
        } catch (err) {
          console.info('Error loading selected cancha:', err);
          setSelectedCancha(null);
        }
      } else {
        setSelectedCancha(null);
      }
    };

    loadSelectedCancha();
  }, [formData.idCancha]);

  const loadCanchas = async () => {
    try {
      const canchasData = await canchaRepository.getAll();
      setCanchas(canchasData);
    } catch (err) {
      console.info('Error loading canchas:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const convertToWebP = async (blob) => {
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
            0.85
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Debes estar autenticado para subir imágenes');
      return;
    }

    setCropperFile(file);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!croppedBlob) return;

    setUploadingImage(true);
    try {
      // Recortar a 16:9 automáticamente
      const cropped16x9 = await cropTo16x9(croppedBlob);
      // Convertir a WebP
      const webpBlob = await convertToWebP(cropped16x9);
      const timestamp = Date.now();
      const imagePath = `eventos/evento_${timestamp}.webp`;
      const imageUrl = await storageService.uploadImageFromBlob(webpBlob, imagePath);
      handleInputChange('imagen', imageUrl);
    } catch (err) {
      console.info('Error uploading image:', err.message);
      setError(`Error al subir la imagen: ${err.message}`);
    } finally {
      setUploadingImage(false);
      setCropperOpen(false);
      setCropperFile(null);
    }
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre del evento es requerido');
      return false;
    }
    if (!formData.idCancha) {
      setError('Debes seleccionar una cancha');
      return false;
    }
    if (!formData.fecha) {
      setError('La fecha es requerida');
      return false;
    }
    // Validar que la fecha no sea pasada usando zona horaria de Lima
    const now = new Date();
    const limaToday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    limaToday.setHours(0, 0, 0, 0);
    
    // Parsear la fecha seleccionada (formato YYYY-MM-DD)
    const [year, month, day] = formData.fecha.split('-').map(Number);
    const selectedDate = new Date();
    selectedDate.setFullYear(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < limaToday) {
      setError('No se puede seleccionar una fecha pasada');
      return false;
    }
    if (!formData.horaInicio) {
      setError('La hora de inicio es requerida');
      return false;
    }
    if (!formData.horaFin) {
      setError('La hora de fin es requerida');
      return false;
    }
    // Validar formato de hora (HH:00)
    if (!formData.horaInicio.match(/^\d{2}:00$/)) {
      setError('La hora de inicio debe tener formato válido');
      return false;
    }
    if (!formData.horaFin.match(/^\d{2}:00$/)) {
      setError('La hora de fin debe tener formato válido');
      return false;
    }
    if (formData.horaInicio >= formData.horaFin) {
      setError('La hora de fin debe ser posterior a la hora de inicio');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Si no hay imagen y hay cancha seleccionada, usar imagen de la cancha
      let imagenFinal = formData.imagen;
      if (!imagenFinal && selectedCancha) {
        imagenFinal = selectedCancha.imagenPrincipal || selectedCancha.imagen || '';
      }

      const eventoData = {
        ...formData,
        imagen: imagenFinal
      };

      if (evento) {
        await eventoRepository.update(evento.id, eventoData);
      } else {
        await eventoRepository.create(eventoData);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.info('Error saving evento:', err);
      setError('Error al guardar el evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          {evento ? 'Editar Evento' : 'Nuevo Evento'}
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nombre del Evento"
              placeholder="Ej: Torneo de Fútbol"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              isRequired
            />

            <Textarea
              label="Descripción"
              placeholder="Describe el evento..."
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              minRows={3}
            />

            <Select
              label="Cancha"
              placeholder="Selecciona una cancha"
              selectedKeys={formData.idCancha ? [formData.idCancha] : []}
              onSelectionChange={(keys) => {
                const selectedId = Array.from(keys)[0];
                handleInputChange('idCancha', selectedId || '');
              }}
              isRequired
            >
              {canchas.map(cancha => (
                <SelectItem key={cancha.id} value={cancha.id}>
                  {cancha.nombre || cancha.name}
                </SelectItem>
              ))}
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Imagen del Evento (16:9)</label>
              <div className="flex items-center gap-3">
                {formData.imagen ? (
                  <img
                    src={formData.imagen}
                    alt="Imagen del evento"
                    className="w-48 h-27 object-cover rounded-lg border border-gray-300 bg-gray-50"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : (
                  <div className="w-48 h-27 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50" style={{ aspectRatio: '16/9' }}>
                    {uploadingImage ? (
                      <Spinner size="sm" />
                    ) : (
                      <FaImage className="text-gray-400" size={24} />
                    )}
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                      id="evento-image-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="evento-image-upload"
                      size="sm"
                      variant="bordered"
                      startContent={<FaImage />}
                      isDisabled={uploadingImage}
                    >
                      {formData.imagen ? 'Cambiar' : 'Subir'} Imagen
                    </Button>
                  </div>
                  <Input
                    label="URL (Alternativa)"
                    value={formData.imagen}
                    onChange={e => handleInputChange('imagen', e.target.value)}
                    placeholder="https://..."
                  />
                  {!formData.imagen && selectedCancha && (
                    <p className="text-xs text-gray-500">
                      Si no subes una imagen, se usará la imagen de la cancha seleccionada
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedCancha && (
              <div className="flex flex-col items-center p-4 rounded-lg border border-gray-200 bg-gray-50">
                <img 
                  src={selectedCancha.imagenPrincipal || selectedCancha.imagen || '/images/futbol1.jpg'}
                  alt={selectedCancha.nombre || selectedCancha.name || 'Cancha'}
                  className="w-full max-w-md h-48 object-cover rounded-lg shadow-md mb-3"
                />
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-1">
                    {selectedCancha.nombre || selectedCancha.name || 'Cancha'}
                  </h4>
                  {selectedCancha.descripcion && (
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedCancha.descripcion}
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    {selectedCancha.tipo && (
                      <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {selectedCancha.tipo}
                      </span>
                    )}
                    {selectedCancha.tamano && (
                      <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                        {selectedCancha.tamano}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              min={(() => {
                // Obtener fecha actual en zona horaria de Lima
                const now = new Date();
                const limaDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
                const year = limaDate.getFullYear();
                const month = String(limaDate.getMonth() + 1).padStart(2, '0');
                const day = String(limaDate.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()}
              isRequired
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Hora de Inicio"
                placeholder="Selecciona la hora"
                selectedKeys={formData.horaInicio ? [formData.horaInicio] : []}
                onSelectionChange={(keys) => {
                  const selectedTime = Array.from(keys)[0];
                  handleInputChange('horaInicio', selectedTime || '');
                }}
                isRequired
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour24 = i;
                  const hour12 = hour24 % 12 || 12;
                  const period = hour24 >= 12 ? 'PM' : 'AM';
                  const time24h = `${hour24.toString().padStart(2, '0')}:00`;
                  const time12h = `${hour12}:00 ${period}`;
                  return (
                    <SelectItem key={time24h} value={time24h}>
                      {time12h}
                    </SelectItem>
                  );
                })}
              </Select>

              <Select
                label="Hora de Fin"
                placeholder="Selecciona la hora"
                selectedKeys={formData.horaFin ? [formData.horaFin] : []}
                onSelectionChange={(keys) => {
                  const selectedTime = Array.from(keys)[0];
                  handleInputChange('horaFin', selectedTime || '');
                }}
                isRequired
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour24 = i;
                  const hour12 = hour24 % 12 || 12;
                  const period = hour24 >= 12 ? 'PM' : 'AM';
                  const time24h = `${hour24.toString().padStart(2, '0')}:00`;
                  const time12h = `${hour12}:00 ${period}`;
                  return (
                    <SelectItem key={time24h} value={time24h}>
                      {time12h}
                    </SelectItem>
                  );
                })}
              </Select>
            </div>

            <Switch
              isSelected={formData.activo}
              onValueChange={(value) => handleInputChange('activo', value)}
            >
              Evento Activo
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancelar
          </Button>
          <Button 
            color="white" 
            onPress={handleSubmit} 
            isLoading={loading}
            className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          >
            {evento ? 'Guardar Cambios' : 'Crear Evento'}
          </Button>
        </ModalFooter>
      </ModalContent>
      
      <ImageCropper
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropperFile(null);
        }}
        imageFile={cropperFile}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />
    </Modal>
  );
};

export default EventoForm;
