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

const VideoForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sports, setSports] = useState([
    { title: '', poster: '', mp4: '', webm: '' }
  ]);
  const [uploadingImages, setUploadingImages] = useState({});
  const repository = new HomeContentRepository();
  const storageService = new StorageService();

  useEffect(() => {
    if (isOpen) {
      loadVideos();
    }
  }, [isOpen]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await repository.getVideos();
      if (data.length > 0) {
        setSports(data);
      }
    } catch (err) {
      console.info('Error loading videos:', err.message);
      setError('Error al cargar los videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSportChange = (index, field, value) => {
    const newSports = [...sports];
    newSports[index] = { ...newSports[index], [field]: value };
    setSports(newSports);
  };

  const handleImageUpload = async (index, file) => {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    setUploadingImages(prev => ({ ...prev, [index]: true }));
    try {
      const imagePath = storageService.generateImagePath('videos', `poster_${index}_${Date.now()}`, 'jpg');
      const imageUrl = await storageService.uploadImage(file, imagePath);
      handleSportChange(index, 'poster', imageUrl);
    } catch (err) {
      console.info('Error uploading image:', err.message);
      setError('Error al subir la imagen');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleAddSport = () => {
    setSports([...sports, { title: '', poster: '', mp4: '', webm: '' }]);
  };

  const handleRemoveSport = index => {
    if (sports.length > 1) {
      const newSports = sports.filter((_, i) => i !== index);
      setSports(newSports);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    const incomplete = sports.some(sport => !sport.title || !sport.poster || !sport.mp4);
    if (incomplete) {
      setError('Título, poster y video MP4 son requeridos');
      setSaving(false);
      return;
    }

    try {
      await repository.saveVideos(sports);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.info('Error saving videos:', err.message);
      setError('Error al guardar los videos');
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
            Editar Videos Deportivos
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
                {sports.map((sport, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Deporte {index + 1}</h4>
                      {sports.length > 1 && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          isIconOnly
                          onPress={() => handleRemoveSport(index)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      label="Título"
                      value={sport.title}
                      onChange={e => handleSportChange(index, 'title', e.target.value)}
                      placeholder="Ej: Fútbol"
                      isRequired
                    />
                    
                    <div className="flex items-center gap-3">
                      {sport.poster ? (
                        <img
                          src={sport.poster}
                          alt={sport.title}
                          className="w-32 h-20 object-cover rounded-lg border border-gray-300"
                        />
                      ) : (
                        <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
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
                            onChange={e => handleImageUpload(index, e.target.files?.[0])}
                            className="hidden"
                            id={`poster-upload-${index}`}
                          />
                          <Button
                            as="label"
                            htmlFor={`poster-upload-${index}`}
                            size="sm"
                            variant="bordered"
                            startContent={<FaImage />}
                            isDisabled={uploadingImages[index]}
                          >
                            {sport.poster ? 'Cambiar' : 'Subir'} Poster
                          </Button>
                          
                          <Input
                            label="URL Poster (Alternativa)"
                            value={sport.poster}
                            onChange={e => handleSportChange(index, 'poster', e.target.value)}
                            placeholder="/images/..."
                            className="flex-1"
                            isRequired
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Input
                      label="URL Video MP4"
                      value={sport.mp4}
                      onChange={e => handleSportChange(index, 'mp4', e.target.value)}
                      placeholder="/videos/clip.mp4"
                      isRequired
                    />
                    
                    <Input
                      label="URL Video WebM (Opcional)"
                      value={sport.webm || ''}
                      onChange={e => handleSportChange(index, 'webm', e.target.value)}
                      placeholder="/videos/clip.webm"
                    />
                  </div>
                ))}
                
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<FaPlus />}
                  onPress={handleAddSport}
                  className="w-full"
                >
                  Agregar Deporte
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

export default VideoForm;

