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
  Spinner
} from '@heroui/react';
import { ReservaRepository } from '../repositories/Reserva.repository.js';

const ReservaForm = ({ isOpen, onClose, reserva = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reservaRepository = new ReservaRepository();

  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    estadoPago: 'pendiente',
    metodoPago: '',
    notas: '',
    precioTotal: 0
  });

  useEffect(() => {
    if (reserva) {
      setFormData({
        fecha: reserva.fecha || '',
        horaInicio: reserva.horaInicio || '',
        horaFin: reserva.horaFin || '',
        estadoPago: reserva.estadoPago || 'pendiente',
        metodoPago: reserva.metodoPago || '',
        notas: reserva.notas || '',
        precioTotal: reserva.precioTotal || reserva.total || 0
      });
    } else {
      setFormData({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        estadoPago: 'pendiente',
        metodoPago: '',
        notas: '',
        precioTotal: 0
      });
    }
    setError('');
  }, [reserva, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSave = async () => {
    if (!reserva) {
      setError('No se puede guardar sin una reserva seleccionada');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reservaRepository.update(reserva.id, {
        fecha: formData.fecha,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        estadoPago: formData.estadoPago,
        metodoPago: formData.metodoPago,
        notas: formData.notas,
        precioTotal: formData.precioTotal
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.info('Error updating reserva:', err.message);
      setError('Error al actualizar la reserva: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-semibold">Editar Reserva</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Fecha"
                value={formData.fecha}
                onValueChange={(value) => handleInputChange('fecha', value)}
                isRequired
              />
              <Input
                type="time"
                label="Hora de Inicio"
                value={formData.horaInicio}
                onValueChange={(value) => handleInputChange('horaInicio', value)}
                isRequired
              />
              <Input
                type="time"
                label="Hora de Fin"
                value={formData.horaFin}
                onValueChange={(value) => handleInputChange('horaFin', value)}
                isRequired
              />
              <Input
                type="number"
                label="Precio Total"
                value={String(formData.precioTotal)}
                onValueChange={(value) => handleInputChange('precioTotal', parseFloat(value) || 0)}
                isRequired
              />
              <Select
                label="Estado de Pago"
                selectedKeys={[formData.estadoPago]}
                onSelectionChange={(keys) => {
                  const estado = Array.from(keys)[0];
                  handleInputChange('estadoPago', estado);
                }}
                isRequired
              >
                <SelectItem key="pendiente" value="pendiente">Pendiente</SelectItem>
                <SelectItem key="pagado" value="pagado">Pagado</SelectItem>
                <SelectItem key="cancelado" value="cancelado">Cancelado</SelectItem>
              </Select>
              <Input
                label="Método de Pago"
                value={formData.metodoPago}
                onValueChange={(value) => handleInputChange('metodoPago', value)}
                placeholder="Efectivo, Tarjeta, etc."
              />
            </div>
            <Textarea
              label="Notas"
              value={formData.notas}
              onValueChange={(value) => handleInputChange('notas', value)}
              placeholder="Notas adicionales..."
              minRows={3}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button color="success" onPress={handleSave} isDisabled={loading}>
            {loading ? <Spinner size="sm" color="white" /> : 'Guardar Cambios'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReservaForm;
