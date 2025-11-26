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
  Spinner
} from '@heroui/react';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { HomeContentRepository } from '../repositories/HomeContent.repository.js';

const StepsForm = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([
    { title: '', desc: '', videoMp4: '' }
  ]);
  const repository = new HomeContentRepository();

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
        setSteps(data);
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

  const handleAddStep = () => {
    setSteps([...steps, { title: '', desc: '', videoMp4: '' }]);
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
    const incomplete = steps.some(step => !step.title || !step.desc || !step.videoMp4);
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
                    
                    <Input
                      label="URL del Video (MP4)"
                      value={step.videoMp4}
                      onChange={e => handleStepChange(index, 'videoMp4', e.target.value)}
                      placeholder="https://videos.pexels.com/..."
                      isRequired
                    />
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
          <Button color="primary" onPress={handleSave} isLoading={saving}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StepsForm;

