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
  Spinner,
  Select,
  SelectItem
} from '@heroui/react';
import { FaPlus, FaTrash, FaSave, FaImage, FaVideo } from 'react-icons/fa';
import { HomeContentRepository } from '../repositories/HomeContent.repository.js';
import { StorageService } from '../services/Storage.service.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import ImageCropper from './ImageCropper.jsx';
import { cropTo16x9 } from '../utils/cropTo16x9.js';

const StepsForm = ({ isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([
    { title: '', desc: '', imagen: '', video: '', tipo: 'imagen' }
  ]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [uploadingVideos, setUploadingVideos] = useState({});
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperFile, setCropperFile] = useState(null);
  const [cropperIndex, setCropperIndex] = useState(null);
  const [cropperType, setCropperType] = useState('imagen');
  const repository = new HomeContentRepository();
  const storageService = new StorageService();

  useEffect(() => {
    if (isOpen) {
      loadSteps();
    }
  }, [isOpen]);

  const loadSteps = async () => {
    setLoading(true);
    try {
      const data = await repository.getSteps();
      if (data.length > 0) {
        // Asegurar que cada step tenga el campo tipo
        const normalizedData = data.map(step => ({
          ...step,
          tipo: step.tipo || (step.video ? 'video' : 'imagen'),
          imagen: step.imagen || '',
          video: step.video || ''
        }));
        setSteps(normalizedData);
      }
    } catch (err) {
      console.info('Error loading steps:', err.message);
      setError('Error al cargar los pasos');
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // Convertir imagen a WebP después de recortar a 16:9
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

  const handleFileSelect = (index, file, type) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if ((type === 'imagen' && !isImage) || (type === 'video' && !isVideo)) {
      setError(`Por favor selecciona un archivo ${type === 'imagen' ? 'de imagen' : 'de video'} válido`);
      return;
    }

    // Verificar autenticación
    if (!isAuthenticated || !user) {
      setError('Debes estar autenticado para subir archivos');
      return;
    }

    // Abrir cropper para recortar a 16:9
    setCropperFile(file);
    setCropperIndex(index);
    setCropperType(type);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedBlob) => {
    if (cropperIndex === null || !croppedBlob) return;

    const index = cropperIndex;
    const type = cropperType;

    try {
      if (type === 'imagen') {
        setUploadingImages(prev => ({ ...prev, [index]: true }));
        // Recortar a 16:9 automáticamente
        const cropped16x9 = await cropTo16x9(croppedBlob);
        // Convertir a WebP
        const webpBlob = await convertToWebP(cropped16x9);
        const timestamp = Date.now();
        const imagePath = `steps/step_${index}_${timestamp}.webp`;
        const imageUrl = await storageService.uploadImageFromBlob(webpBlob, imagePath);
        handleStepChange(index, 'imagen', imageUrl);
        setUploadingImages(prev => ({ ...prev, [index]: false }));
      } else {
        setUploadingVideos(prev => ({ ...prev, [index]: true }));
        // Para videos, subir el archivo original
        const timestamp = Date.now();
        const videoExtension = cropperFile.name.split('.').pop();
        const videoPath = `steps/step_${index}_video_${timestamp}.${videoExtension}`;
        const videoUrl = await storageService.uploadVideo(cropperFile, videoPath);
        handleStepChange(index, 'video', videoUrl);
        setUploadingVideos(prev => ({ ...prev, [index]: false }));
      }
    } catch (err) {
      console.info('Error uploading file:', err.message);
      setError(`Error al subir el archivo: ${err.message}`);
      if (type === 'imagen') {
        setUploadingImages(prev => ({ ...prev, [index]: false }));
      } else {
        setUploadingVideos(prev => ({ ...prev, [index]: false }));
      }
    } finally {
      setCropperOpen(false);
      setCropperFile(null);
      setCropperIndex(null);
    }
  };

  const handleAddStep = () => {
    setSteps([...steps, { title: '', desc: '', imagen: '', video: '', tipo: 'imagen' }]);
  };

  const handleRemoveStep = index => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    // Validar que todos los campos estén completos
    const incomplete = steps.some(step => {
      if (!step.title || !step.desc) return true;
      if (step.tipo === 'imagen' && !step.imagen) return true;
      if (step.tipo === 'video' && !step.video) return true;
      return false;
    });
    if (incomplete) {
      setError('Todos los campos deben estar completos');
      setSaving(false);
      return;
    }

    try {
      await repository.saveSteps(steps);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.info('Error saving steps:', err.message);
      setError('Error al guardar los pasos');
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
            Editar Pasos del Home
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
              
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Paso {index + 1}</h4>
                      {steps.length > 1 && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          isIconOnly
                          onPress={() => handleRemoveStep(index)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      label="Título"
                      value={step.title}
                      onChange={e => handleStepChange(index, 'title', e.target.value)}
                      placeholder="Ej: Reserva tu cancha deportiva..."
                      isRequired
                    />
                    
                    <Textarea
                      label="Descripción"
                      value={step.desc}
                      onChange={e => handleStepChange(index, 'desc', e.target.value)}
                      placeholder="Descripción del paso..."
                      minRows={2}
                      isRequired
                    />
                    
                    <Select
                      label="Tipo de contenido"
                      selectedKeys={step.tipo ? [step.tipo] : ['imagen']}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        handleStepChange(index, 'tipo', selected);
                        if (selected === 'imagen') {
                          handleStepChange(index, 'video', '');
                        } else {
                          handleStepChange(index, 'imagen', '');
                        }
                      }}
                      className="w-full"
                    >
                      <SelectItem key="imagen" value="imagen">Imagen</SelectItem>
                      <SelectItem key="video" value="video">Video</SelectItem>
                    </Select>

                    {step.tipo === 'imagen' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Imagen (16:9)</label>
                        <div className="flex items-center gap-3">
                          {step.imagen ? (
                            <img
                              src={step.imagen}
                              alt={step.title || `Paso ${index + 1}`}
                              className="w-48 h-27 object-cover rounded-lg border border-gray-300 bg-gray-50"
                              style={{ aspectRatio: '16/9' }}
                            />
                          ) : (
                            <div className="w-48 h-27 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50" style={{ aspectRatio: '16/9' }}>
                              {uploadingImages[index] ? (
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
                                onChange={e => handleFileSelect(index, e.target.files?.[0], 'imagen')}
                                className="hidden"
                                id={`step-image-upload-${index}`}
                              />
                              <Button
                                as="label"
                                htmlFor={`step-image-upload-${index}`}
                                size="sm"
                                variant="bordered"
                                startContent={<FaImage />}
                                isDisabled={uploadingImages[index]}
                              >
                                {step.imagen ? 'Cambiar' : 'Subir'} Imagen
                              </Button>
                            </div>
                            <Input
                              label="URL (Alternativa)"
                              value={step.imagen}
                              onChange={e => handleStepChange(index, 'imagen', e.target.value)}
                              placeholder="https://..."
                              isRequired
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Video (16:9)</label>
                        <div className="flex items-center gap-3">
                          {step.video ? (
                            <video
                              src={step.video}
                              className="w-48 h-27 object-cover rounded-lg border border-gray-300 bg-gray-50"
                              style={{ aspectRatio: '16/9' }}
                              controls
                              muted
                            />
                          ) : (
                            <div className="w-48 h-27 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50" style={{ aspectRatio: '16/9' }}>
                              {uploadingVideos[index] ? (
                                <Spinner size="sm" />
                              ) : (
                                <FaVideo className="text-gray-400" size={24} />
                              )}
                            </div>
                          )}
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={e => handleFileSelect(index, e.target.files?.[0], 'video')}
                                className="hidden"
                                id={`step-video-upload-${index}`}
                              />
                              <Button
                                as="label"
                                htmlFor={`step-video-upload-${index}`}
                                size="sm"
                                variant="bordered"
                                startContent={<FaVideo />}
                                isDisabled={uploadingVideos[index]}
                              >
                                {step.video ? 'Cambiar' : 'Subir'} Video
                              </Button>
                            </div>
                            <Input
                              label="URL (Alternativa)"
                              value={step.video}
                              onChange={e => handleStepChange(index, 'video', e.target.value)}
                              placeholder="https://..."
                              isRequired
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<FaPlus />}
                  onPress={handleAddStep}
                  className="w-full"
                >
                  Agregar Paso
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={saving}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={handleSave} 
            isLoading={saving}
            className="text-white [&>span]:text-white"
          >
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
      
      <ImageCropper
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropperFile(null);
          setCropperIndex(null);
        }}
        imageFile={cropperFile}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />
    </Modal>
  );
};

export default StepsForm;
