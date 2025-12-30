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
  Switch
} from '@heroui/react';
import { EventoRepository } from '../repositories/Evento.repository.js';
import { CanchaRepository } from '../repositories/Cancha.repository.js';

const EventoForm = ({ isOpen, onClose, evento = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canchas, setCanchas] = useState([]);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const eventoRepository = new EventoRepository();
  const canchaRepository = new CanchaRepository();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    idCancha: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    activo: true
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
          activo: evento.activo !== undefined ? evento.activo : true
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          idCancha: '',
          fecha: '',
          horaInicio: '',
          horaFin: '',
          activo: true
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
    // Validar que la fecha no sea pasada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.fecha);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
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
      if (evento) {
        await eventoRepository.update(evento.id, formData);
      } else {
        await eventoRepository.create(formData);
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
              min={new Date().toISOString().split('T')[0]}
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
    </Modal>
  );
};

export default EventoForm;
