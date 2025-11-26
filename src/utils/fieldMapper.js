// Mapeo de campos de base de datos (inglés) a nombres en español para UI
// Esto permite mantener los campos en inglés en Firestore (mejor práctica)
// mientras mostramos nombres en español en la interfaz

export const fieldLabels = {
  // Cancha
  name: 'Nombre',
  type: 'Tipo',
  size: 'Tamaño',
  description: 'Descripción',
  price: 'Precio',
  pricing: 'Precios',
  morning: 'Mañana',
  evening: 'Noche',
  start: 'Inicio',
  end: 'Fin',
  image: 'Imagen',
  imagePrincipal: 'Imagen Principal',
  imageCard: 'Imagen Tarjeta',
  isActive: 'Activo',
  createdAt: 'Fecha de Creación',
  updatedAt: 'Última Actualización',
  
  // Reserva
  userId: 'ID Usuario',
  canchaId: 'ID Cancha',
  date: 'Fecha',
  startTime: 'Hora de Inicio',
  endTime: 'Hora de Fin',
  totalPrice: 'Precio Total',
  subtotal: 'Subtotal',
  descuentoId: 'ID Descuento',
  codigoDescuento: 'Código Descuento',
  montoDescuento: 'Monto Descontado',
  status: 'Estado',
  paymentStatus: 'Estado de Pago',
  paymentMethod: 'Método de Pago',
  notes: 'Notas',
  
  // Usuario
  email: 'Correo',
  phone: 'Teléfono',
  role: 'Rol',
  isAdmin: 'Es Administrador',
  
  // Descuento
  codigo: 'Código',
  nombre: 'Nombre',
  tipo: 'Tipo',
  valor: 'Valor',
  montoMinimo: 'Monto Mínimo',
  montoMaximo: 'Monto Máximo',
  fechaInicio: 'Fecha de Inicio',
  fechaFin: 'Fecha de Fin',
  horaInicio: 'Hora de Inicio',
  horaFin: 'Hora de Fin',
  diasSemana: 'Días de la Semana',
  canchaIds: 'IDs de Canchas',
  tiposCancha: 'Tipos de Cancha',
  usosMaximos: 'Usos Máximos',
  usosPorUsuario: 'Usos por Usuario',
  usosActuales: 'Usos Actuales',
  activo: 'Activo',
  esPublico: 'Es Público',
  descripcion: 'Descripción'
};

// Valores traducidos para enums
export const enumLabels = {
  // Estados de reserva
  status: {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada'
  },
  
  // Estados de pago
  paymentStatus: {
    pending: 'Pendiente',
    paid: 'Pagado',
    failed: 'Fallido'
  },
  
  // Tipos de cancha
  type: {
    futbol: 'Fútbol',
    voley: 'Voleibol',
    basquet: 'Básquet'
  },
  
  // Tamaños de cancha
  size: {
    grande: 'Grande',
    mediana: 'Mediana',
    pequena: 'Pequeña'
  },
  
  // Tipos de descuento
  discountType: {
    porcentaje: 'Porcentaje',
    monto_fijo: 'Monto Fijo'
  },
  
  // Días de la semana
  daysOfWeek: {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  }
};

// Función helper para obtener la etiqueta de un campo
export const getFieldLabel = (fieldName) => {
  return fieldLabels[fieldName] || fieldName;
};

// Función helper para obtener la etiqueta de un valor enum
export const getEnumLabel = (enumType, value) => {
  return enumLabels[enumType]?.[value] || value;
};

// Función para convertir un objeto con campos en inglés a español (solo para display)
export const translateObjectForDisplay = (obj, prefix = '') => {
  const translated = {};
  for (const [key, value] of Object.entries(obj)) {
    const translatedKey = fieldLabels[key] || key;
    translated[translatedKey] = value;
  }
  return translated;
};
